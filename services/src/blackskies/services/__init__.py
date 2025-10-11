"""Public package exports with optional dependency fallbacks."""

from __future__ import annotations

from typing import Any, Callable, NoReturn, TYPE_CHECKING, cast

if TYPE_CHECKING:  # pragma: no cover - import is for typing only
    from .services import AgentOrchestrator as AgentOrchestratorType
    from .services import ToolNotPermittedError as ToolNotPermittedErrorType
else:
    AgentOrchestratorType = Any
    ToolNotPermittedErrorType = type[Exception]

try:  # pragma: no cover - optional FastAPI dependency not installed
    from .app import SERVICE_VERSION as _SERVICE_VERSION, app as _app, create_app as _create_app
except ModuleNotFoundError:  # pragma: no cover - executed when FastAPI is absent
    SERVICE_VERSION = "unknown"
    app = None

    def _raise_fastapi_missing(*_: Any, **__: Any) -> NoReturn:
        raise ModuleNotFoundError("FastAPI is required to create the service application")

    create_app = cast(Callable[..., Any], _raise_fastapi_missing)
else:
    SERVICE_VERSION = _SERVICE_VERSION
    app = _app
    create_app = _create_app

try:  # pragma: no cover - optional CLI dependency not installed
    from .__main__ import main as _main
except ModuleNotFoundError:  # pragma: no cover - executed when uvicorn is absent

    def _raise_uvicorn_missing(*_: Any, **__: Any) -> NoReturn:
        raise ModuleNotFoundError("uvicorn is required to launch the CLI entrypoint")

    main = cast(Callable[..., Any], _raise_uvicorn_missing)
else:
    main = _main

if TYPE_CHECKING:  # pragma: no cover - handled via static imports above
    from .services import AgentOrchestrator, ToolNotPermittedError
else:
    try:  # pragma: no cover - optional service dependencies not installed
        from .services import AgentOrchestrator as _AgentOrchestrator
        from .services import ToolNotPermittedError as _ToolNotPermittedError
    except (
        ModuleNotFoundError
    ):  # pragma: no cover - executed when orchestration services are absent
        AgentOrchestrator: AgentOrchestratorType | None = None

        class ToolNotPermittedError(RuntimeError):
            """Fallback error raised when service dependencies are unavailable."""

    else:
        AgentOrchestrator = cast(AgentOrchestratorType, _AgentOrchestrator)
        ToolNotPermittedError = cast(ToolNotPermittedErrorType, _ToolNotPermittedError)


__all__: list[str] = [
    "AgentOrchestrator",
    "ToolNotPermittedError",
    "app",
    "create_app",
    "SERVICE_VERSION",
    "main",
]
