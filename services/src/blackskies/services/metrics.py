"""Lightweight Prometheus-style metrics utilities for the service."""

from __future__ import annotations

from collections import Counter
from threading import Lock
from typing import Iterable

_COUNTERS: Counter[str] = Counter()
_LOCK = Lock()


def record_request(method: str, status_code: int) -> None:
    """Track an HTTP request labelled by method and status code."""

    labels = f'method="{method.lower()}",status="{status_code}"'
    sample = f"blackskies_requests_total{{{labels}}}"
    with _LOCK:
        _COUNTERS[sample] += 1


def _snapshot() -> Iterable[tuple[str, int]]:
    """Yield a snapshot of recorded counters in sorted order."""

    with _LOCK:
        return sorted(_COUNTERS.items())


def render(service_version: str) -> str:
    """Render metrics using the Prometheus text exposition format."""

    lines = [
        "# HELP blackskies_requests_total Count of HTTP requests processed by the Black Skies service",
        "# TYPE blackskies_requests_total counter",
    ]

    for sample, value in _snapshot():
        lines.append(f"{sample} {value}")

    if len(lines) == 2:
        lines.append('blackskies_requests_total{method="none",status="0"} 0')

    lines.extend(
        [
            "# HELP blackskies_service_info Static service metadata",
            "# TYPE blackskies_service_info gauge",
            f'blackskies_service_info{{version="{service_version}"}} 1',
        ]
    )
    return "\n".join(lines) + "\n"


__all__ = ["record_request", "render"]
