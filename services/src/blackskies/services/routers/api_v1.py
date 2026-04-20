"""API v1 aggregate router."""

from __future__ import annotations

from fastapi import APIRouter

from .analytics import router as analytics_router
from .backups import router as backups_router
from .draft import router as draft_router
from .outline import router as outline_router
from .export import router as export_router
from .long_form import router as long_form_router
from .backup_verifier import router as backup_verifier_router
from .phase4 import router as phase4_router
from .recovery import router as recovery_router
from .restore import router as restore_router
from .snapshots import router as snapshots_router


def build_api_router(*, include_phase4_mock_routes: bool = False) -> APIRouter:
    """Build the API v1 aggregate router.

    Phase4 endpoints are legacy mock seams and remain opt-in for explicit
    harness/dev scenarios. They are excluded from the default runtime surface.
    """

    router = APIRouter(prefix="/api/v1")
    router.include_router(outline_router)
    router.include_router(recovery_router)
    router.include_router(draft_router)
    router.include_router(analytics_router)
    router.include_router(snapshots_router)
    router.include_router(backup_verifier_router)
    router.include_router(backups_router)
    router.include_router(export_router)
    router.include_router(long_form_router)
    if include_phase4_mock_routes:
        router.include_router(phase4_router)
    router.include_router(restore_router)
    return router


# Keep a default router export for compatibility with direct imports.
router = build_api_router(include_phase4_mock_routes=False)

__all__ = ["build_api_router", "router"]
