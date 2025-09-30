"""Router package exports."""

from __future__ import annotations

from .api_v1 import router as api_router
from .draft import router as draft_router
from .outline import router as outline_router
from .recovery import router as recovery_router

__all__ = [
    "api_router",
    "draft_router",
    "outline_router",
    "recovery_router",
]
