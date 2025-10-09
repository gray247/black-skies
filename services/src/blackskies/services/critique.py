"""Service responsible for producing draft critique responses."""

from __future__ import annotations

import copy
import json
from importlib import resources
from typing import Any, Final

from .models.critique import DraftCritiqueRequest


class CritiqueService:
    """Generate critique payloads compliant with CritiqueOutputSchema v1."""

    _FIXTURE_PACKAGE: Final[str] = "blackskies.services.fixtures"
    _FIXTURE_NAME: Final[str] = "draft_critique.json"
    _SCHEMA_VERSION: Final[str] = "CritiqueOutputSchema v1"

    def __init__(self, fixtures_package: str | None = None) -> None:
        self._fixtures_package = fixtures_package or self._FIXTURE_PACKAGE
        self._cached_fixture: dict[str, Any] | None = None

    def run(self, request: DraftCritiqueRequest) -> dict[str, Any]:
        """Return a critique payload tailored to the requested unit."""

        payload = copy.deepcopy(self._load_fixture())
        payload["unit_id"] = request.unit_id
        payload["schema_version"] = self._SCHEMA_VERSION
        return payload

    def _load_fixture(self) -> dict[str, Any]:
        """Load and cache the baseline critique fixture."""

        if self._cached_fixture is not None:
            return self._cached_fixture

        try:
            fixture_path = resources.files(self._fixtures_package).joinpath(
                self._FIXTURE_NAME
            )
        except (FileNotFoundError, ModuleNotFoundError) as exc:  # pragma: no cover
            msg = "Critique fixture namespace is unavailable."
            raise RuntimeError(msg) from exc

        try:
            with fixture_path.open("r", encoding="utf-8") as handle:
                self._cached_fixture = json.load(handle)
        except FileNotFoundError as exc:  # pragma: no cover - defensive guard
            msg = "Critique fixture is missing."
            raise RuntimeError(msg) from exc
        except json.JSONDecodeError as exc:  # pragma: no cover - defensive guard
            msg = "Critique fixture contains invalid JSON."
            raise RuntimeError(msg) from exc

        return self._cached_fixture


__all__ = ["CritiqueService"]

