"""Helpers for loading and validating critique rubric definitions."""

from __future__ import annotations

import json
import re
from importlib import resources
from pathlib import Path
from typing import Iterable, Tuple

from .models.rubric import RubricDefinition

_FIXTURE_PACKAGE = "blackskies.services.fixtures.rubrics"
_DEFAULT_RUBRIC_FILE = "baseline.json"
_RUBRIC_ID_PATTERN = re.compile(r"^[a-z0-9._-]{3,64}$")


def normalise_rubric_id(value: str) -> str:
    """Normalise rubric identifiers to a lowercase slug."""

    candidate = value.strip().lower()
    if not _RUBRIC_ID_PATTERN.fullmatch(candidate):
        msg = "Rubric identifier must be 3-64 characters using lowercase, digits, '.', '_', or '-'."
        raise ValueError(msg)
    return candidate


def load_rubric_definition(project_root: Path | None, rubric_id: str | None) -> RubricDefinition:
    """Load a rubric definition from project storage or bundled fixtures."""

    if rubric_id:
        rubric_id = normalise_rubric_id(rubric_id)
    if project_root and rubric_id:
        definition = _load_project_rubric(project_root, rubric_id)
        if definition is not None:
            return definition
    try:
        return _load_fixture_rubric(rubric_id or "baseline")
    except FileNotFoundError:
        if rubric_id:
            raise
        return _load_fixture_rubric("baseline")


def resolve_rubric_categories(
    project_root: Path | None,
    rubric_id: str | None,
    fallback_categories: Iterable[str],
) -> Tuple[list[str], str | None]:
    """Return rubric categories and the resolved rubric identifier."""

    if rubric_id:
        definition = load_rubric_definition(project_root, rubric_id)
        categories = definition.categories or list(fallback_categories)
        return categories, definition.rubric_id
    definition = load_rubric_definition(project_root, None)
    categories = definition.categories or list(fallback_categories)
    return categories, definition.rubric_id


def _load_project_rubric(project_root: Path, rubric_id: str) -> RubricDefinition | None:
    candidate = project_root / "history" / "rubrics" / f"{rubric_id}.json"
    if not candidate.exists():
        return None
    with candidate.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return RubricDefinition.model_validate(data)


def _load_fixture_rubric(rubric_id: str) -> RubricDefinition:
    try:
        fixture = resources.files(_FIXTURE_PACKAGE).joinpath(f"{rubric_id}.json")
    except (FileNotFoundError, ModuleNotFoundError) as exc:
        raise FileNotFoundError(rubric_id) from exc
    if not fixture.exists():
        if rubric_id != "baseline":
            raise FileNotFoundError(rubric_id)
        fixture = resources.files(_FIXTURE_PACKAGE).joinpath(_DEFAULT_RUBRIC_FILE)
    with fixture.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return RubricDefinition.model_validate(data)


__all__ = ["load_rubric_definition", "normalise_rubric_id", "resolve_rubric_categories"]
