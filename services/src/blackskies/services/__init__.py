"""Runtime services for the Black Skies platform."""

from __future__ import annotations

from .app import SERVICE_VERSION, app, create_app
from .__main__ import main

__all__ = ["app", "create_app", "SERVICE_VERSION", "main"]
