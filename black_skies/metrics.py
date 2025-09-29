"""Lightweight metrics registry for Black Skies."""

from __future__ import annotations

from collections import defaultdict
from threading import Lock
from typing import Dict, Iterable

_COUNTERS: Dict[str, int] = defaultdict(int)
_LOCK = Lock()


def increment(counter: str) -> None:
    """Increment a counter by one."""

    with _LOCK:
        _COUNTERS[counter] += 1


def snapshot() -> Dict[str, int]:
    """Return a snapshot of all counters."""

    with _LOCK:
        return dict(_COUNTERS)


def render(prometheus: bool = True) -> str:
    """Render counters in a Prometheus-compatible text format by default."""

    metrics = snapshot()
    lines: list[str] = []
    for name, value in sorted(metrics.items()):
        metric_name = name.replace("-", "_")
        lines.append(f"# TYPE {metric_name} counter")
        lines.append(f"{metric_name} {value}")
    return "\n".join(lines) + "\n"


__all__ = ["increment", "render", "snapshot"]
