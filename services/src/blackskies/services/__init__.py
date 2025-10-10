"""Runtime services and helper modules for the Black Skies platform."""

from __future__ import annotations

try:
    from .app import SERVICE_VERSION, app, create_app
except ModuleNotFoundError:  # pragma: no cover - optional FastAPI dependency not installed
    SERVICE_VERSION = "unknown"
    app = None

    def create_app(*args, **kwargs):  # type: ignore[override]
        raise ModuleNotFoundError("FastAPI is required to create the service application")
try:
    from .__main__ import main
except ModuleNotFoundError:  # pragma: no cover - optional CLI dependency not installed
    def main(*args, **kwargs):  # type: ignore[override]
        raise ModuleNotFoundError("uvicorn is required to launch the CLI entrypoint")

try:
    from .services import AgentOrchestrator, ToolNotPermittedError
except ModuleNotFoundError:  # pragma: no cover - optional service dependencies not installed
    AgentOrchestrator = None  # type: ignore[assignment]

    class ToolNotPermittedError(RuntimeError):
        """Fallback error raised when service dependencies are unavailable."""

__all__ = [
    "AgentOrchestrator",
    "ToolNotPermittedError",
    "app",
    "create_app",
    "SERVICE_VERSION",
    "main",
]
