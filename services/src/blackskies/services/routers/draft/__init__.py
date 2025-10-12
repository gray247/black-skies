"""Draft API router split across feature-focused modules."""

from __future__ import annotations

import importlib

from fastapi import APIRouter

from ...constants import DEFAULT_HARD_BUDGET_LIMIT_USD, DEFAULT_SOFT_BUDGET_LIMIT_USD
from ...http import default_error_responses
from .common import _compute_sha256

router = APIRouter(prefix="/draft", tags=["draft"], responses=default_error_responses())

for module_name in ("acceptance", "export", "generation", "revision", "wizard"):
    importlib.import_module(f"{__name__}.{module_name}")

__all__ = [
    "router",
    "DEFAULT_HARD_BUDGET_LIMIT_USD",
    "DEFAULT_SOFT_BUDGET_LIMIT_USD",
    "_compute_sha256",
]
