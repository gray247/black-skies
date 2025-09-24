"""FastAPI application object for the Black Skies service stack."""

from __future__ import annotations

import json
import logging
from importlib import resources
from typing import Any, Final

from fastapi import APIRouter, FastAPI, HTTPException, status

LOGGER = logging.getLogger(__name__)

SERVICE_VERSION: Final[str] = "0.1.0"
_FIXTURE_PACKAGE: Final[str] = "blackskies.services.fixtures"


def _load_fixture(name: str) -> dict[str, Any]:
    """Load a JSON fixture bundled with the package."""
    try:
        fixture_path = resources.files(_FIXTURE_PACKAGE).joinpath(name)
    except (FileNotFoundError, ModuleNotFoundError) as exc:  # pragma: no cover - importlib guards
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture namespace is unavailable.",
                "details": {"fixture": name},
            },
        ) from exc

    try:
        with fixture_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        LOGGER.exception("Fixture %s is missing", name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture not found.",
                "details": {"fixture": name},
            },
        ) from exc
    except json.JSONDecodeError as exc:
        LOGGER.exception("Fixture %s contains invalid JSON", name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture data is invalid JSON.",
                "details": {"fixture": name},
            },
        ) from exc


def _register_routes(api: FastAPI) -> None:
    """Attach all routers to the provided FastAPI app."""
    @api.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        """Simple readiness probe for the desktop app."""
        return {"status": "ok", "version": SERVICE_VERSION}

    outline_router = APIRouter(prefix="/outline", tags=["outline"])

    @outline_router.post("/build")
    async def build_outline() -> dict[str, Any]:
        """Return a schema-compatible outline artifact from fixtures."""
        return _load_fixture("outline_build.json")

    api.include_router(outline_router)

    draft_router = APIRouter(prefix="/draft", tags=["draft"])

    @draft_router.post("/generate")
    async def generate_draft() -> dict[str, Any]:
        """Return a stubbed draft generation response."""
        return _load_fixture("draft_generate.json")

    @draft_router.post("/rewrite")
    async def rewrite_draft() -> dict[str, Any]:
        """Return a stubbed draft rewrite response."""
        return _load_fixture("draft_rewrite.json")

    @draft_router.post("/critique")
    async def critique_draft() -> dict[str, Any]:
        """Return a stubbed draft critique response."""
        return _load_fixture("draft_critique.json")

    api.include_router(draft_router)


def create_app() -> FastAPI:
    """Construct the FastAPI application."""
    application = FastAPI(title="Black Skies Services", version=SERVICE_VERSION)
    _register_routes(application)
    return application


app = create_app()

__all__ = ["app", "create_app", "SERVICE_VERSION"]
