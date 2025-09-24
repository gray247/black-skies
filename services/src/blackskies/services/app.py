"""FastAPI application object for the Black Skies service stack."""

from __future__ import annotations

import json
import logging
from importlib import resources
from typing import Any, Final

from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from pydantic import ValidationError

from .config import Settings, get_settings
from .critique_analyzer import CritiqueAnalyzer, SceneNotFoundError
from .models import CritiqueBatchResponse, CritiqueOutput, CritiqueRequest
from .models.critique import ALLOWED_RUBRIC_CATEGORIES

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

    def _get_critique_analyzer(settings: Settings = Depends(get_settings)) -> CritiqueAnalyzer:
        """Provide a critique analyzer bound to current settings."""

        return CritiqueAnalyzer(settings)

    @draft_router.post("/critique")
    async def critique_draft(
        payload: CritiqueRequest,
        analyzer: CritiqueAnalyzer = Depends(_get_critique_analyzer),
    ) -> dict[str, Any]:
        """Generate deterministic critique output for requested units."""

        rubric = [category.strip() for category in payload.rubric]
        if any(not category for category in rubric):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": "Rubric categories must be non-empty strings.",
                },
            )

        unknown = sorted(set(rubric) - ALLOWED_RUBRIC_CATEGORIES)
        if unknown:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": "Unknown rubric categories provided.",
                    "details": {"invalid_categories": unknown},
                },
            )

        unit_ids = payload.resolved_unit_ids()
        if len(unit_ids) > 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": "Critique requests may include at most 3 units.",
                    "details": {"provided": unit_ids},
                },
            )

        raw_results: list[dict[str, Any]] = []
        for unit_id in unit_ids:
            try:
                critique_output = analyzer.analyze_unit(unit_id, rubric)
            except SceneNotFoundError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "VALIDATION",
                        "message": f"Scene {unit_id} was not found in the drafts directory.",
                        "details": {"unit_id": unit_id},
                    },
                ) from None
            except Exception as exc:  # pragma: no cover - defensive guard
                LOGGER.exception("Unexpected critique failure for unit %s", unit_id)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "code": "INTERNAL",
                        "message": "Critique generation failed.",
                        "details": {"unit_id": unit_id},
                    },
                ) from exc

            try:
                validated_output = CritiqueOutput.model_validate(critique_output.model_dump())
            except ValidationError as exc:
                LOGGER.exception("Critique output validation failed for unit %s", unit_id)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "code": "INTERNAL",
                        "message": "Critique output failed schema validation.",
                        "details": {"unit_id": unit_id},
                    },
                ) from exc

            raw_results.append(validated_output.model_dump())

        try:
            response_model = CritiqueBatchResponse.model_validate({"results": raw_results})
        except ValidationError as exc:
            LOGGER.exception("Critique batch validation failed for units %s", [item.get("unit_id") for item in raw_results])
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "INTERNAL",
                    "message": "Critique batch failed schema validation.",
                    "details": {"units": [item.get("unit_id") for item in raw_results]},
                },
            ) from exc

        return response_model.model_dump()

    api.include_router(draft_router)


def create_app() -> FastAPI:
    """Construct the FastAPI application."""
    application = FastAPI(title="Black Skies Services", version=SERVICE_VERSION)
    _register_routes(application)
    return application


app = create_app()

__all__ = ["app", "create_app", "SERVICE_VERSION"]
