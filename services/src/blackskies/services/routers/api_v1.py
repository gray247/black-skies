"""API v1 aggregate router."""

from __future__ import annotations

from fastapi import APIRouter

from .analytics import router as analytics_router
from .draft import router as draft_router
from .outline import router as outline_router
from .export import router as export_router
from .backup_verifier import router as backup_verifier_router
from .phase4 import router as phase4_router
from .recovery import router as recovery_router
from .restore import router as restore_router
from .snapshots import router as snapshots_router

router = APIRouter(prefix="/api/v1")
router.include_router(outline_router)
router.include_router(draft_router)
router.include_router(recovery_router)
router.include_router(analytics_router)
router.include_router(snapshots_router)
router.include_router(backup_verifier_router)
router.include_router(export_router)
router.include_router(phase4_router)
router.include_router(restore_router)
router.include_router(restore_router)

__all__ = ["router"]
