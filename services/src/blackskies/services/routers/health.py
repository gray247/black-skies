"""Health and diagnostics endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request, Response

from ..metrics import render

__all__ = ["router", "get_service_version", "health", "metrics_endpoint"]


router = APIRouter(prefix="/api/v1", tags=["health"])


_METRICS_MEDIA_TYPE = "text/plain; version=0.0.4"


def get_service_version(request: Request) -> str:
    """Return the service version attached to the application state."""

    return getattr(request.app.state, "service_version", "unknown")


def _health_payload(request: Request, version: str) -> dict[str, Any]:
    payload: dict[str, Any] = {"status": "ok", "version": version}

    state = getattr(request.app.state, "backup_verifier_state", None)
    if state is None:
        payload["backup_status"] = "warning"
        payload["backup_enabled"] = False
        payload["backup_message"] = "Backup verifier state unavailable."
        return payload

    summary = state.summary()
    payload["backup_status"] = summary["status"]
    payload["backup_enabled"] = summary["enabled"]
    if summary.get("message"):
        payload["backup_message"] = summary["message"]
    if summary.get("last_run"):
        payload["backup_last_run"] = summary["last_run"]
    if summary.get("last_success"):
        payload["backup_last_success"] = summary["last_success"]
    if summary.get("last_error"):
        payload["backup_last_error"] = summary["last_error"]
    payload["backup_checked_snapshots"] = summary.get("checked_snapshots", 0)
    payload["backup_failed_snapshots"] = summary.get("failed_snapshots", 0)
    payload["backup_voice_notes_checked"] = summary.get("voice_notes_checked", 0)
    payload["backup_voice_note_issues"] = summary.get("voice_note_issues", 0)
    return payload


@router.get("/healthz")
async def health(request: Request, version: str = Depends(get_service_version)) -> dict[str, Any]:
    return _health_payload(request, version)


@router.get("/metrics")
async def metrics_endpoint(version: str = Depends(get_service_version)) -> Response:
    """Return the Prometheus metrics payload without implicit charsets."""

    metrics_payload = render(version).encode("utf-8")
    response = Response(content=metrics_payload)
    response.headers["Content-Type"] = _METRICS_MEDIA_TYPE
    return response
