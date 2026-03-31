"""Public package exports for the service runtime."""

from __future__ import annotations

from typing import Any, Callable, NoReturn, cast

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

__all__: list[str] = [
    "app",
    "create_app",
    "SERVICE_VERSION",
    "main",
]
