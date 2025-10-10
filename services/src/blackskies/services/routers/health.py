"""Health and diagnostics endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response

from ..metrics import render

__all__ = ["router", "get_service_version"]


router = APIRouter(prefix="/api/v1", tags=["health"])


def get_service_version(request: Request) -> str:
    """Return the service version attached to the application state."""

    return getattr(request.app.state, "service_version", "unknown")


def _health_payload(version: str) -> dict[str, str]:
    return {"status": "ok", "version": version}


@router.get("/healthz")
async def health(version: str = Depends(get_service_version)) -> dict[str, str]:
    return _health_payload(version)


@router.get("/metrics")
async def metrics_endpoint(version: str = Depends(get_service_version)) -> Response:
    return Response(
        content=render(version),
        media_type="text/plain; version=0.0.4",
    )
