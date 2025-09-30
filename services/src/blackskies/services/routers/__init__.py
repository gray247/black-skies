
"""Router package exports."""

from __future__ import annotations

from fastapi import APIRouter

from .draft import router as draft_router
from .outline import router as outline_router
from .recovery import router as recovery_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(outline_router)
api_router.include_router(draft_router)
api_router.include_router(recovery_router)

__all__ = [
    "api_router",
    "draft_router",
    "outline_router",
    "recovery_router",
]

