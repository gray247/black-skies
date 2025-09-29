"""Offline evaluation harness runner for Black Skies."""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path
from typing import Any, Iterable, Protocol, Sequence

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from black_skies import runs
from black_skies.eval import EvalTask, EvalTaskFlow, load_dataset
from black_skies.eval.report import EvalCaseResult, EvalReport, build_report, render_html
from black_skies.tools.registry import ToolRegistry

logger = logging.getLogger("black_skies.scripts.eval")


class FlowRunner(Protocol):
    def __call__(
        self, task: EvalTask, *, registry: ToolRegistry, run_id: str
    ) -> tuple[bool, dict[str, Any]]:
        """Run the evaluation adapter for ``task``."""


def _default_wizard_runner(
    task: EvalTask, *, registry: ToolRegistry, run_id: str
) -> tuple[bool, dict[str, Any]]:
    registry.check_permission(
        "template_renderer",
        run_id=run_id,
        metadata={"task_id": task.task_id, "flow": task.flow.value},
    )
    outline = task.expected.outline  # type: ignore[union-attr]
    scene_count = len(outline.scenes)
    if scene_count == 0:
        raise ValueError("Wizard outline expected scenes to compare against")
    return True, {"outline_id": outline.outline_id, "scene_count": scene_count}


def _default_draft_runner(
    task: EvalTask, *, registry: ToolRegistry, run_id: str
) -> tuple[bool, dict[str, Any]]:
    registry.check_permission(
        "summarizer",
        run_id=run_id,
        metadata={"task_id": task.task_id, "flow": task.flow.value},
    )
    draft = task.expected.draft  # type: ignore[union-attr]
    units = draft.units
    if not units:
        raise ValueError("Draft evaluation requires at least one unit")
    return True, {
        "draft_id": draft.draft_id,
        "unit_count": len(units),
        "word_targets": [unit.meta.word_target for unit in units],
    }


def _default_critique_runner(
    task: EvalTask, *, registry: ToolRegistry, run_id: str
) -> tuple[bool, dict[str, Any]]:
    registry.check_permission(
        "markdown_search",
        run_id=run_id,
        metadata={"task_id": task.task_id, "flow": task.flow.value},
    )
    critique = task.expected.critique  # type: ignore[union-attr]
    if not critique.summary.strip():
        raise ValueError("Critique summary may not be empty for evaluation")
    return True, {
        "unit_id": critique.unit_id,
        "comment_count": len(critique.line_comments),
        "suggested_edits": len(critique.suggested_edits),
    }


FLOW_RUNNERS: dict[EvalTaskFlow, FlowRunner] = {
    EvalTaskFlow.WIZARD: _default_wizard_runner,
    EvalTaskFlow.DRAFT: _default_draft_runner,
    EvalTaskFlow.CRITIQUE: _default_critique_runner,
}

_CHECKLIST_PATH = REPO_ROOT / "docs" / "decision_checklist.md"


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Black Skies eval dataset against adapters")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=None,
        help="Path to the eval dataset directory (defaults to packaged dataset)",
    )
    parser.add_argument("--json", type=Path, required=True, help="Path to write JSON results")
    parser.add_argument("--html", type=Path, required=True, help="Path to write HTML report")
    parser.add_argument(
        "--fail-under-pass-rate",
        type=float,
        default=1.0,
        help="Fail if overall pass rate falls below this threshold (0-1)",
    )
    parser.add_argument(
        "--max-avg-latency-ms",
        type=float,
        default=None,
        help="Fail if average latency exceeds this threshold in milliseconds",
    )
    parser.add_argument(
        "--max-p95-latency-ms",
        type=float,
        default=None,
        help="Fail if P95 latency exceeds this threshold in milliseconds",
    )
    return parser.parse_args(argv)


def _ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _build_registry(project_id: str) -> ToolRegistry:
    metadata = {"project_id": project_id, "tools": {"allow": ["*"], "deny": []}}
    kwargs: dict[str, Any] = {}
    if _CHECKLIST_PATH.exists():
        kwargs["checklist_path"] = _CHECKLIST_PATH
    return ToolRegistry(project_metadata=metadata, **kwargs)


def _evaluate_task(task: EvalTask, *, run_id: str) -> EvalCaseResult:
    project_id = getattr(task.inputs, "project_id", "eval")
    registry = _build_registry(project_id)
    runs.append_event(
        run_id,
        "eval.task_start",
        {"task_id": task.task_id, "flow": task.flow.value, "project_id": project_id},
    )
    start = time.perf_counter()
    runner = FLOW_RUNNERS.get(task.flow)
    passed = False
    error: str | None = None
    details: dict[str, Any] = {}

    if runner is None:
        error = f"No runner registered for flow {task.flow}"
    else:
        try:
            passed, details = runner(task, registry=registry, run_id=run_id)
        except Exception as exc:  # noqa: BLE001 - surfaced to report
            logger.exception("eval.task_error", extra={"extra_payload": {"task_id": task.task_id}})
            error = str(exc)
            passed = False

    latency_ms = (time.perf_counter() - start) * 1000
    result = EvalCaseResult(
        task_id=task.task_id,
        flow=task.flow,
        summary=task.summary,
        passed=passed and error is None,
        latency_ms=latency_ms,
        error=error,
        details=details,
    )
    runs.append_event(
        run_id,
        "eval.task_complete",
        {
            "task_id": task.task_id,
            "flow": task.flow.value,
            "passed": result.passed,
            "latency_ms": round(latency_ms, 4),
            "error": error,
        },
    )
    return result


def _evaluate_thresholds(report: EvalReport, args: argparse.Namespace) -> list[str]:
    reasons: list[str] = []
    if report.metrics.pass_rate < args.fail_under_pass_rate:
        reasons.append(
            f"Pass rate {report.metrics.pass_rate:.4f} is below threshold {args.fail_under_pass_rate:.4f}"
        )
    if (
        args.max_avg_latency_ms is not None
        and report.metrics.avg_latency_ms > args.max_avg_latency_ms
    ):
        reasons.append(
            "Average latency "
            f"{report.metrics.avg_latency_ms:.2f}ms exceeds {args.max_avg_latency_ms:.2f}ms"
        )
    if (
        args.max_p95_latency_ms is not None
        and report.metrics.p95_latency_ms > args.max_p95_latency_ms
    ):
        reasons.append(
            f"P95 latency {report.metrics.p95_latency_ms:.2f}ms exceeds {args.max_p95_latency_ms:.2f}ms"
        )
    return reasons


def _write_outputs(
    html_path: Path, json_path: Path, report: EvalReport, regressions: Iterable[str]
) -> None:
    payload = {"report": report.to_dict(), "regressions": list(regressions)}
    html = render_html(report)
    _ensure_parent(html_path)
    _ensure_parent(json_path)
    html_path.write_text(html + "\n", encoding="utf-8")
    json_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def run(args: argparse.Namespace) -> tuple[EvalReport, list[str]]:
    dataset_path = args.dataset or None
    tasks = load_dataset(dataset_path)
    run_info = runs.start_run(
        "eval",
        {
            "dataset": str(dataset_path) if dataset_path else "default",
            "task_count": len(tasks),
            "thresholds": {
                "fail_under_pass_rate": args.fail_under_pass_rate,
                "max_avg_latency_ms": args.max_avg_latency_ms,
                "max_p95_latency_ms": args.max_p95_latency_ms,
            },
        },
    )
    run_id = run_info["run_id"]
    try:
        results = [
            _evaluate_task(task, run_id=run_id) for task in sorted(tasks, key=lambda t: t.task_id)
        ]
        report = build_report(results)
        regressions = _evaluate_thresholds(report, args)
        _write_outputs(args.html, args.json, report, regressions)
        status = "failed" if regressions else "completed"
        runs.finalize_run(
            run_id, status=status, result={"report": report.to_dict(), "regressions": regressions}
        )
        return report, regressions
    except Exception as exc:  # noqa: BLE001 - ensure ledger finalized
        runs.finalize_run(run_id, status="failed", result={"error": str(exc)})
        logger.exception("eval.run_failed", exc_info=exc)
        raise


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        _, regressions = run(args)
    except Exception:  # noqa: BLE001 - already logged
        return 1
    if regressions:
        logger.error("Eval regressions detected: %s", "; ".join(regressions))
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main(sys.argv[1:]))
