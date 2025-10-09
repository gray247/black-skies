"""Eval report aggregation utilities for offline regression harness."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from statistics import mean
from typing import Iterable, Sequence

from .dataset import EvalTaskFlow


@dataclass(slots=True)
class EvalCaseResult:
    """Result of executing a single eval task."""

    task_id: str
    flow: EvalTaskFlow
    summary: str
    passed: bool
    latency_ms: float
    error: str | None = None
    details: dict[str, object] = field(default_factory=dict)


@dataclass(slots=True)
class EvalMetrics:
    """Aggregate metrics derived from a collection of eval case results."""

    total: int
    passed: int
    failed: int
    pass_rate: float
    avg_latency_ms: float
    p95_latency_ms: float


@dataclass(slots=True)
class EvalReport:
    """Structured representation of an evaluation run."""

    generated_at: str
    metrics: EvalMetrics
    results: list[EvalCaseResult]

    def to_dict(self) -> dict[str, object]:
        """Return a JSON-serializable representation of the report."""

        return {
            "generated_at": self.generated_at,
            "metrics": {
                "total": self.metrics.total,
                "passed": self.metrics.passed,
                "failed": self.metrics.failed,
                "pass_rate": self.metrics.pass_rate,
                "avg_latency_ms": self.metrics.avg_latency_ms,
                "p95_latency_ms": self.metrics.p95_latency_ms,
            },
            "results": [
                {
                    "task_id": result.task_id,
                    "flow": result.flow.value,
                    "summary": result.summary,
                    "passed": result.passed,
                    "latency_ms": result.latency_ms,
                    "error": result.error,
                    "details": result.details,
                }
                for result in self.results
            ],
        }


def _compute_p95(values: Sequence[float]) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    index = int(round(0.95 * (len(sorted_values) - 1)))
    return sorted_values[index]


def build_report(results: Iterable[EvalCaseResult]) -> EvalReport:
    """Construct an :class:`EvalReport` from raw case results."""

    materialized: list[EvalCaseResult] = list(results)
    total = len(materialized)
    passed = sum(1 for result in materialized if result.passed)
    failed = total - passed
    latencies = [result.latency_ms for result in materialized]
    avg_latency = mean(latencies) if latencies else 0.0
    p95_latency = _compute_p95(latencies)
    pass_rate = (passed / total) if total else 0.0

    metrics = EvalMetrics(
        total=total,
        passed=passed,
        failed=failed,
        pass_rate=round(pass_rate, 4),
        avg_latency_ms=round(avg_latency, 4),
        p95_latency_ms=round(p95_latency, 4),
    )
    generated_at = datetime.now(timezone.utc).isoformat()
    return EvalReport(generated_at=generated_at, metrics=metrics, results=materialized)


def render_html(report: EvalReport) -> str:
    """Render a simple HTML document summarizing the evaluation."""

    rows = []
    for result in report.results:
        status = "✅" if result.passed else "❌"
        error = result.error or ""
        rows.append(
            f"<tr><td>{result.task_id}</td><td>{result.flow.value}</td>"
            f"<td>{status}</td><td>{result.latency_ms:.2f}</td><td>{error}</td></tr>"
        )

    html = f"""
<!DOCTYPE html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <title>Black Skies Eval Report</title>
    <style>
      body {{ font-family: Arial, sans-serif; margin: 2rem; }}
      table {{ border-collapse: collapse; width: 100%; }}
      th, td {{ border: 1px solid #ccc; padding: 0.5rem; text-align: left; }}
      th {{ background-color: #f5f5f5; }}
    </style>
  </head>
  <body>
    <h1>Black Skies Evaluation Results</h1>
    <p>Generated at: {report.generated_at}</p>
    <section>
      <h2>Summary</h2>
      <ul>
        <li>Total tasks: {report.metrics.total}</li>
        <li>Passed: {report.metrics.passed}</li>
        <li>Failed: {report.metrics.failed}</li>
        <li>Pass rate: {report.metrics.pass_rate:.2%}</li>
        <li>Average latency (ms): {report.metrics.avg_latency_ms:.2f}</li>
        <li>P95 latency (ms): {report.metrics.p95_latency_ms:.2f}</li>
      </ul>
    </section>
    <section>
      <h2>Cases</h2>
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Flow</th>
            <th>Status</th>
            <th>Latency (ms)</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {''.join(rows)}
        </tbody>
      </table>
    </section>
  </body>
</html>
"""
    return html.strip()


__all__ = ["EvalCaseResult", "EvalMetrics", "EvalReport", "build_report", "render_html"]
