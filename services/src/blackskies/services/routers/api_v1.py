"""API v1 aggregate router."""

from __future__ import annotations

from fastapi import APIRouter

from .analytics import router as analytics_router
from .draft import router as draft_router
from .outline import router as outline_router
from .recovery import router as recovery_router

router = APIRouter(prefix="/api/v1")
router.include_router(outline_router)
router.include_router(draft_router)
router.include_router(recovery_router)
router.include_router(analytics_router)

__all__ = ["router"]
