"""Draft API router split across feature-focused modules."""

from __future__ import annotations

from fastapi import APIRouter

from ...budgeting import HARD_BUDGET_LIMIT_USD, SOFT_BUDGET_LIMIT_USD
from ...http import default_error_responses

router = APIRouter(prefix="/draft", tags=["draft"], responses=default_error_responses())

# Import side-effects register routes on the shared router.
from . import acceptance as _acceptance  # noqa: F401
from . import export as _export  # noqa: F401
from . import generation as _generation  # noqa: F401
from . import revision as _revision  # noqa: F401
from . import wizard as _wizard  # noqa: F401

from .common import _compute_sha256

__all__ = ["router", "HARD_BUDGET_LIMIT_USD", "SOFT_BUDGET_LIMIT_USD", "_compute_sha256"]
