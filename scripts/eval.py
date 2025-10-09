"""Offline evaluation harness for Black Skies adapters."""

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

from blackskies.services import runs
from blackskies.services.eval import EvalTask, EvalTaskFlow, load_dataset
from blackskies.services.eval.dataset import DEFAULT_DATASET_DIR
from blackskies.services.eval.report import (
    EvalCaseResult,
    EvalReport,
    build_report,
    render_html,
)
from blackskies.services.tools.registry import ToolRegistry

logger = logging.getLogger("blackskies.services.scripts.eval")


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
            "P95 latency "
            f"{report.metrics.p95_latency_ms:.2f}ms exceeds {args.max_p95_latency_ms:.2f}ms"
        )
    return reasons


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)

    dataset_dir = args.dataset or DEFAULT_DATASET_DIR
    tasks = load_dataset(dataset_dir)
    run_metadata = runs.start_run("evaluation", {"dataset": str(dataset_dir)})
    run_id = run_metadata["run_id"]

    case_results: list[EvalCaseResult] = []
    for task in tasks:
        case_results.append(_evaluate_task(task, run_id=run_id))

    report = build_report(case_results)
    regressions = _evaluate_thresholds(report, args)

    _ensure_parent(args.json)
    args.json.write_text(
        json.dumps(
            {
                "report": report.to_dict(),
                "regressions": regressions,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    _ensure_parent(args.html)
    args.html.write_text(render_html(report), encoding="utf-8")

    status = "failed" if regressions else "completed"
    runs.finalize_run(run_id, status=status, result={"regressions": regressions})
    return 1 if regressions else 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
