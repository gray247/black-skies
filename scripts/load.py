"""Concurrent load testing harness for Black Skies services."""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import json
import logging
import math
import shlex
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from statistics import mean
from time import perf_counter
from typing import Any, Iterable, Iterator, Mapping, Sequence

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:  # pragma: no cover - path hygiene
    sys.path.insert(0, str(REPO_ROOT))

try:  # pragma: no cover - ensure repo hooks apply when running as script
    import sitecustomize  # noqa: F401
except Exception:  # pragma: no cover - best-effort import
    pass

try:  # pragma: no cover - optional dependency documented in requirements
    import yaml
except ModuleNotFoundError as exc:  # pragma: no cover - surfaced during CLI usage
    raise SystemExit(
        "PyYAML is required for load testing. Install it with 'pip install pyyaml'."
    ) from exc

from blackskies.services import runs

import smoke_runner

LOGGER = logging.getLogger("blackskies.load")

DEFAULT_PROFILES_PATH = Path("config/load_profiles.yaml")
DEFAULT_SERVICE_COMMAND = (
    "uvicorn blackskies.services.app:create_app --factory --host {host} --port {port}"
)


@dataclass(slots=True)
class Thresholds:
    """Performance guardrails for a load profile."""

    p95_ms: float
    p99_ms: float
    max_error_rate: float
    max_budget_usd: float


@dataclass(slots=True)
class LoadProfile:
    """Load test configuration resolved from profile files or CLI overrides."""

    name: str
    total_cycles: int
    concurrency: int
    timeout: float
    thresholds: Thresholds
    warmup_cycles: int = 0
    scene_count: int | None = None
    wizard_steps: tuple[str, ...] | None = None
    description: str | None = None


@dataclass(slots=True)
class LoadMetrics(smoke_runner.SmokeMetricsSink):
    """Collect request latency and budget metrics during execution."""

    requests: list[dict[str, Any]] = field(default_factory=list)
    budgets: list[float] = field(default_factory=list)
    started_at: float | None = None
    finished_at: float | None = None

    def record_request(self, *, method: str, path: str, status: int, elapsed_ms: float) -> None:
        self.requests.append(
            {
                "method": method,
                "path": path,
                "status": status,
                "elapsed_ms": elapsed_ms,
            }
        )

    def record_budget(self, *, estimated_cost_usd: float) -> None:
        self.budgets.append(estimated_cost_usd)

    @property
    def total_requests(self) -> int:
        return len(self.requests)

    @property
    def error_count(self) -> int:
        return sum(1 for entry in self.requests if entry["status"] >= 400)

    @property
    def error_rate(self) -> float:
        if not self.requests:
            return 0.0
        return self.error_count / len(self.requests)

    @property
    def total_budget(self) -> float:
        return sum(self.budgets)

    def mark_start(self) -> None:
        if self.started_at is None:
            self.started_at = perf_counter()

    def mark_end(self) -> None:
        marker = perf_counter()
        if self.started_at is None:
            self.started_at = marker
        self.finished_at = marker

    @property
    def duration_seconds(self) -> float | None:
        if self.started_at is None or self.finished_at is None:
            return None
        duration = self.finished_at - self.started_at
        return duration if duration >= 0 else 0.0

    @property
    def requests_per_second(self) -> float | None:
        duration = self.duration_seconds
        if not duration:
            return None
        return self.total_requests / duration

    def percentile(self, percentile: float) -> float | None:
        if not self.requests:
            return None
        latencies = sorted(entry["elapsed_ms"] for entry in self.requests)
        rank = percentile / 100 * (len(latencies) - 1)
        lower = math.floor(rank)
        upper = math.ceil(rank)
        if lower == upper:
            return latencies[int(rank)]
        fraction = rank - lower
        return latencies[lower] + (latencies[upper] - latencies[lower]) * fraction

    def average_latency(self) -> float | None:
        if not self.requests:
            return None
        return mean(entry["elapsed_ms"] for entry in self.requests)

    def per_path_summary(self) -> dict[str, Any]:
        summary: dict[str, Any] = {}
        by_path: dict[str, list[dict[str, Any]]] = {}
        for entry in self.requests:
            by_path.setdefault(entry["path"], []).append(entry)
        for path, entries in by_path.items():
            latencies = sorted(item["elapsed_ms"] for item in entries)
            summary[path] = {
                "count": len(entries),
                "avg_ms": mean(latencies),
                "p95_ms": self._percentile_from_sorted(latencies, 95.0),
                "p99_ms": self._percentile_from_sorted(latencies, 99.0),
                "error_count": sum(1 for item in entries if item["status"] >= 400),
            }
        return summary

    @staticmethod
    def _percentile_from_sorted(latencies: Sequence[float], percentile: float) -> float:
        rank = percentile / 100 * (len(latencies) - 1)
        lower = math.floor(rank)
        upper = math.ceil(rank)
        if lower == upper:
            return latencies[int(rank)]
        fraction = rank - lower
        return latencies[lower] + (latencies[upper] - latencies[lower]) * fraction


def configure_logging(level: int) -> None:
    logging.basicConfig(
        level=level,
        format="[load] %(message)s",
    )


def load_profile_data(path: Path) -> Mapping[str, Any]:
    if not path.exists():
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if data is None:
        return {}
    if isinstance(data, Mapping):
        profiles = data.get("profiles", data)
        if isinstance(profiles, Mapping):
            return profiles
    raise ValueError(f"Invalid load profile configuration format in {path}")


def resolve_profile(name: str, profiles: Mapping[str, Any]) -> dict[str, Any]:
    try:
        candidate = profiles[name]
    except KeyError as exc:
        raise KeyError(f"Profile '{name}' not found in provided configuration.") from exc
    if not isinstance(candidate, Mapping):
        raise TypeError(f"Profile '{name}' must be a mapping.")
    return dict(candidate)


def build_profile(name: str, raw: Mapping[str, Any], args: argparse.Namespace) -> LoadProfile:
    thresholds_cfg = raw.get("thresholds", {})
    if not isinstance(thresholds_cfg, Mapping):
        raise TypeError("Profile thresholds must be a mapping.")

    def _override(value: Any, override: Any | None) -> Any:
        return override if override is not None else value

    total_cycles = int(
        _override(raw.get("total_cycles", 12), getattr(args, "total_cycles", None))
    )
    concurrency = int(
        _override(raw.get("concurrency", 3), getattr(args, "concurrency", None))
    )
    timeout = float(
        _override(raw.get("timeout", smoke_runner.DEFAULT_TIMEOUT), getattr(args, "timeout", None))
    )
    warmup_cycles = int(
        _override(raw.get("warmup_cycles", 0), getattr(args, "warmup_cycles", None))
    )

    thresholds = Thresholds(
        p95_ms=float(
            _override(thresholds_cfg.get("p95_ms", 1500.0), getattr(args, "p95_ms", None))
        ),
        p99_ms=float(
            _override(thresholds_cfg.get("p99_ms", 2500.0), getattr(args, "p99_ms", None))
        ),
        max_error_rate=float(
            _override(thresholds_cfg.get("max_error_rate", 0.05), getattr(args, "max_error_rate", None))
        ),
        max_budget_usd=float(
            _override(thresholds_cfg.get("max_budget_usd", 5.0), getattr(args, "max_budget_usd", None))
        ),
    )

    scene_count_override = getattr(args, "scene_count", None)
    raw_scene_count = raw.get("scene_count")
    scene_count_value = _override(raw_scene_count, scene_count_override)
    scene_count = int(scene_count_value) if scene_count_value is not None else None

    if scene_count is not None and scene_count <= 0:
        raise ValueError("scene_count must be greater than zero when provided.")

    wizard_steps: tuple[str, ...] | None = None
    wizard_steps_override = getattr(args, "wizard_steps", None)
    if wizard_steps_override:
        wizard_steps = tuple(str(step).strip() for step in wizard_steps_override if str(step).strip())
    elif raw.get("wizard_steps") is not None:
        raw_steps = raw["wizard_steps"]
        if not isinstance(raw_steps, Sequence):
            raise TypeError("Profile wizard_steps must be a sequence of strings.")
        wizard_steps = tuple(str(step).strip() for step in raw_steps if str(step).strip())
        if not wizard_steps:
            wizard_steps = None

    description = raw.get("description")
    if description is not None and not isinstance(description, str):
        raise TypeError("Profile description must be a string.")
    if isinstance(description, str):
        description = description.strip() or None

    if concurrency <= 0:
        raise ValueError("Concurrency must be greater than zero.")
    if total_cycles <= 0:
        raise ValueError("Total cycles must be greater than zero.")

    return LoadProfile(
        name=name,
        total_cycles=total_cycles,
        concurrency=concurrency,
        timeout=timeout,
        thresholds=thresholds,
        warmup_cycles=warmup_cycles,
        scene_count=scene_count,
        wizard_steps=wizard_steps,
        description=description,
    )


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Black Skies load tests.")
    parser.add_argument("--profile", default="default")
    parser.add_argument(
        "--profiles-path",
        type=Path,
        default=DEFAULT_PROFILES_PATH,
    )
    parser.add_argument("--host", default=smoke_runner.DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=smoke_runner.DEFAULT_PORT)
    parser.add_argument("--project-id", default=smoke_runner.DEFAULT_PROJECT_ID)
    parser.add_argument("--project-base-dir")
    parser.add_argument("--scene-ids", nargs="*")
    parser.add_argument("--wizard-steps", nargs="*")
    parser.add_argument(
        "--scene-count",
        type=int,
        help="Rotate through this many unique scene ids during the load run (defaults to matching cycle count).",
    )

    parser.add_argument("--total-cycles", type=int)
    parser.add_argument("--concurrency", type=int)
    parser.add_argument("--timeout", type=float)
    parser.add_argument("--warmup-cycles", type=int)

    parser.add_argument("--p95-ms", type=float)
    parser.add_argument("--p99-ms", type=float)
    parser.add_argument("--max-error-rate", type=float)
    parser.add_argument("--max-budget-usd", type=float)
    parser.add_argument(
        "--slo-report",
        type=Path,
        help="Optional path to write the captured SLO metrics JSON payload.",
    )

    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
    )
    parser.add_argument(
        "--start-service",
        action="store_true",
        help="Launch the FastAPI services stack before running the load (uses uvicorn by default).",
    )
    parser.add_argument(
        "--service-command",
        type=str,
        help=(
            "Override the command used with --start-service. Provide a shell-style string; "
            "defaults to 'uvicorn blackskies.services.app:create_app --factory --host <host> --port <port>'."
        ),
    )
    return parser.parse_args(argv)


def _resolve_service_command(args: argparse.Namespace) -> list[str]:
    template = args.service_command or DEFAULT_SERVICE_COMMAND
    expanded = template.format(host=args.host, port=args.port)
    tokens = shlex.split(expanded)

    if args.service_command:
        return tokens

    if tokens and tokens[0] == "uvicorn" and shutil.which(tokens[0]) is None:
        LOGGER.info(
            "uvicorn not found on PATH; falling back to 'python -m uvicorn'.",
        )
        tokens = [sys.executable, "-m", "uvicorn", *tokens[1:]]

    return tokens


@contextlib.contextmanager
def _maybe_started_service(args: argparse.Namespace) -> Iterator[None]:
    if not getattr(args, "start_service", False):
        yield
        return

    command_tokens = _resolve_service_command(args)
    LOGGER.info("Starting services with command: %s", " ".join(command_tokens))
    try:
        process = subprocess.Popen(command_tokens, cwd=REPO_ROOT)
    except FileNotFoundError as exc:
        raise SystemExit(f"Unable to start services: {exc}") from exc
    try:
        yield
    finally:
        LOGGER.info("Stopping services process (pid=%s)", process.pid)
        process.terminate()
        try:
            process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            LOGGER.warning("Service process did not exit gracefully; sending SIGKILL.")
            process.kill()
            process.wait(timeout=5)


def distribute_cycles(total_cycles: int, concurrency: int) -> Iterable[int]:
    base = total_cycles // concurrency
    remainder = total_cycles % concurrency
    for index in range(concurrency):
        yield base + (1 if index < remainder else 0)


async def run_profile(profile: LoadProfile, args: argparse.Namespace, metrics: LoadMetrics) -> None:
    project_base_dir = smoke_runner.resolve_project_base_dir(args.project_base_dir)
    project_root = project_base_dir / args.project_id
    wizard_steps = (
        tuple(args.wizard_steps)
        if getattr(args, "wizard_steps", None)
        else profile.wizard_steps
        if profile.wizard_steps
        else smoke_runner.DEFAULT_WIZARD_STEPS
    )
    warmup_cycles = profile.warmup_cycles or 0

    total_cycles = profile.total_cycles
    planned_length = warmup_cycles + total_cycles
    scene_plan: list[str] | None = None

    scene_ids_arg = getattr(args, "scene_ids", None)
    scene_count_arg = getattr(args, "scene_count", None)

    if scene_ids_arg:
        base_ids = list(scene_ids_arg)
        if base_ids:
            scene_plan = [
                base_ids[index % len(base_ids)]
                for index in range(planned_length)
            ]
    else:
        requested_scene_count = scene_count_arg or profile.scene_count
        if requested_scene_count:
            base_ids = smoke_runner.load_scene_ids(project_root, requested_scene_count)
            scene_plan = [
                base_ids[index % len(base_ids)]
                for index in range(planned_length)
            ]

    if profile.warmup_cycles:
        LOGGER.info("Running %s warmup cycle(s) without metrics.", profile.warmup_cycles)
        warmup_scene_ids = (
            tuple(scene_plan[:warmup_cycles]) if scene_plan is not None else None
        )
        warmup_config = smoke_runner.SmokeTestConfig(
            host=args.host,
            port=args.port,
            project_id=args.project_id,
            project_base_dir=project_base_dir,
            cycles=profile.warmup_cycles,
            timeout=profile.timeout,
            wizard_steps=wizard_steps,
            scene_ids=warmup_scene_ids,
        )
        await smoke_runner.run_cycles(warmup_config)

    if scene_plan is not None:
        scene_plan = scene_plan[warmup_cycles:]

    tasks: list[asyncio.Task[None]] = []
    metrics.mark_start()
    offset = 0
    for worker_index, cycles in enumerate(distribute_cycles(profile.total_cycles, profile.concurrency)):
        if cycles <= 0:
            continue
        assigned_scene_ids = None
        if scene_plan is not None:
            assigned_scene_ids = tuple(scene_plan[offset : offset + cycles])
            offset += cycles
        config = smoke_runner.SmokeTestConfig(
            host=args.host,
            port=args.port,
            project_id=args.project_id,
            project_base_dir=project_base_dir,
            cycles=cycles,
            timeout=profile.timeout,
            wizard_steps=wizard_steps,
            scene_ids=assigned_scene_ids,
        )
        LOGGER.info(
            "Worker %s running %s cycle(s) against %s:%s",
            worker_index + 1,
            cycles,
            args.host,
            args.port,
        )
        tasks.append(asyncio.create_task(smoke_runner.run_cycles(config, metrics=metrics)))

    await asyncio.gather(*tasks)
    metrics.mark_end()


def evaluate_thresholds(metrics: LoadMetrics, thresholds: Thresholds) -> list[str]:
    reasons: list[str] = []
    p95 = metrics.percentile(95.0)
    p99 = metrics.percentile(99.0)

    if metrics.total_requests == 0:
        reasons.append("No requests were recorded during the load test.")
        return reasons

    if p95 is not None and p95 > thresholds.p95_ms:
        reasons.append(f"P95 latency {p95:.2f}ms exceeds threshold {thresholds.p95_ms:.2f}ms.")
    if p99 is not None and p99 > thresholds.p99_ms:
        reasons.append(f"P99 latency {p99:.2f}ms exceeds threshold {thresholds.p99_ms:.2f}ms.")
    if metrics.error_rate > thresholds.max_error_rate:
        reasons.append(
            (
                "Error rate {error_rate:.2%} exceeds threshold {threshold:.2%} "
                "({errors} errors across {total} requests)."
            ).format(
                error_rate=metrics.error_rate,
                threshold=thresholds.max_error_rate,
                errors=metrics.error_count,
                total=metrics.total_requests,
            )
        )
    if metrics.total_budget > thresholds.max_budget_usd:
        reasons.append(
            (
                "Estimated budget spend ${spent:.2f} exceeds threshold ${threshold:.2f}."
            ).format(spent=metrics.total_budget, threshold=thresholds.max_budget_usd)
        )
    return reasons


def build_result_payload(
    metrics: LoadMetrics,
    thresholds: Thresholds,
    breaches: list[str],
) -> dict[str, Any]:
    duration = metrics.duration_seconds
    requests_per_second = metrics.requests_per_second
    error_budget_remaining = max(thresholds.max_error_rate - metrics.error_rate, 0.0)
    error_budget_consumed = max(metrics.error_rate - thresholds.max_error_rate, 0.0)
    slo_status = "breached" if breaches else "ok"
    return {
        "metrics": {
            "total_requests": metrics.total_requests,
            "error_count": metrics.error_count,
            "error_rate": metrics.error_rate,
            "avg_latency_ms": metrics.average_latency(),
            "p95_latency_ms": metrics.percentile(95.0),
            "p99_latency_ms": metrics.percentile(99.0),
            "total_budget_usd": metrics.total_budget,
            "duration_seconds": duration,
            "requests_per_second": requests_per_second,
            "error_budget_remaining": error_budget_remaining,
            "error_budget_consumed": error_budget_consumed,
            "per_path": metrics.per_path_summary(),
        },
        "thresholds": {
            "p95_ms": thresholds.p95_ms,
            "p99_ms": thresholds.p99_ms,
            "max_error_rate": thresholds.max_error_rate,
            "max_budget_usd": thresholds.max_budget_usd,
        },
        "breaches": breaches,
        "slo": {
            "status": slo_status,
            "violations": breaches,
            "error_budget_remaining": error_budget_remaining,
            "error_budget_consumed": error_budget_consumed,
        },
    }


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    configure_logging(getattr(logging, str(args.log_level).upper(), logging.INFO))

    profiles_map = load_profile_data(args.profiles_path)
    profile_config = resolve_profile(args.profile, profiles_map)
    profile = build_profile(args.profile, profile_config, args)

    LOGGER.info(
        "Starting load profile '%s' with %s total cycle(s) at concurrency %s.",
        profile.name,
        profile.total_cycles,
        profile.concurrency,
    )
    if profile.description:
        LOGGER.info("Profile description: %s", profile.description)

    run_metadata = runs.start_run(
        "load-test",
        {
            "profile": profile.name,
            "host": args.host,
            "port": args.port,
            "project_id": args.project_id,
            "total_cycles": profile.total_cycles,
            "concurrency": profile.concurrency,
        },
    )
    run_id = run_metadata["run_id"]

    metrics = LoadMetrics()

    with _maybe_started_service(args):
        try:
            asyncio.run(run_profile(profile, args, metrics))
        except Exception as exc:  # pragma: no cover - CLI surface
            LOGGER.error("Load execution failed: %s", exc)
            runs.finalize_run(run_id, status="failed", result={"error": str(exc)})
            return 1

    breaches = evaluate_thresholds(metrics, profile.thresholds)
    result_payload = build_result_payload(metrics, profile.thresholds, breaches)
    runs.finalize_run(
        run_id,
        status="failed" if breaches else "completed",
        result=result_payload,
    )
    ledger_path = runs.get_runs_root() / run_id / "run.json"

    if args.slo_report:
        slo_path = args.slo_report.resolve()
        slo_path.parent.mkdir(parents=True, exist_ok=True)
        slo_payload = {
            "run_id": run_id,
            "profile": profile.name,
            "host": args.host,
            "port": args.port,
            "project_id": args.project_id,
            "result": result_payload,
        }
        slo_path.write_text(json.dumps(slo_payload, indent=2, ensure_ascii=False), encoding="utf-8")
        LOGGER.info("SLO report written to %s", slo_path)

    duration = metrics.duration_seconds or 0.0
    rps = metrics.requests_per_second or 0.0
    LOGGER.info(
        (
            "Load metrics: %s requests over %.2fs (%.2f req/s), error rate %.2f%%, "
            "P95 %.2fms, P99 %.2fms, budget $%.2f"
        ),
        metrics.total_requests,
        duration,
        rps,
        metrics.error_rate * 100,
        (metrics.percentile(95.0) or 0.0),
        (metrics.percentile(99.0) or 0.0),
        metrics.total_budget,
    )
    LOGGER.info("Run ledger written to %s", ledger_path)

    if breaches:
        for reason in breaches:
            LOGGER.error("Threshold breach: %s", reason)
        return 1

    LOGGER.info("Load profile '%s' completed within thresholds.", profile.name)
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())
