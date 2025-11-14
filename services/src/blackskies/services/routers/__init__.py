"""Router package exports."""

from __future__ import annotations

from .analytics import router as analytics_router
from .api_v1 import router as api_router
from .draft import router as draft_router
from .outline import router as outline_router
from .recovery import router as recovery_router

__all__ = [
    "analytics_router",
    "api_router",
    "draft_router",
    "outline_router",
    "recovery_router",
]
