"""Rubric evaluation helpers and critique service implementations."""

from __future__ import annotations

import copy
import json
import logging
from importlib import resources
from pathlib import Path
from typing import Any, Final, Iterable, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from .models import Critique, Draft
from .models.critique import DraftCritiqueRequest
from .scene_docs import DraftRequestError, read_scene_document
from .model_router import ModelRouter, ModelRouteDecision, ModelTask
from .model_adapters import AdapterError, BaseAdapter

CRITIQUE_MODEL: Final[dict[str, str]] = {
    "name": "black-skies-rubric-v1",
    "provider": "offline",
}
CATEGORIES: Final[list[str]] = [
    "Logic",
    "Continuity",
    "Character",
    "Pacing",
    "Prose",
    "Horror",
]
BLOCKED_RUBRIC_CATEGORIES: Final[set[str]] = {"unknown"}
LOGGER = logging.getLogger(__name__)


class _AdapterLineComment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    line: int = Field(..., ge=1)
    note: str
    excerpt: str | None = None


class _AdapterSuggestedEdit(BaseModel):
    model_config = ConfigDict(extra="forbid")

    range: tuple[int, int]
    replacement: str

    @model_validator(mode="after")
    def _validate_range(self) -> "_AdapterSuggestedEdit":
        start, end = self.range
        if start < 0 or end < 0:
            msg = "Suggested edit range positions must be non-negative."
            raise ValueError(msg)
        if end < start:
            msg = "Suggested edit range end must be >= start."
            raise ValueError(msg)
        return self


class _AdapterCritiquePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(min_length=1)
    priorities: list[str]
    line_comments: list[_AdapterLineComment]
    suggested_edits: list[_AdapterSuggestedEdit]
    severity: Literal["low", "medium", "high"]


def _sentence_lengths(text: str) -> list[int]:
    """Return word counts for each sentence in the provided text."""

    sentences = [segment.strip() for segment in text.replace("\n", " ").split(".")]
    lengths: list[int] = []
    for sentence in sentences:
        if sentence:
            lengths.append(len(sentence.split()))
    return lengths or [0]


def _longest_line(lines: Iterable[str]) -> tuple[int, str]:
    """Return the longest line and its one-based index."""

    best_line = ""
    best_index = 0
    for index, line in enumerate(lines, start=1):
        if len(line) > len(best_line):
            best_line = line
            best_index = index
    return best_index, best_line


def _compute_heuristics(draft: Draft) -> dict[str, float]:
    metadata = draft.metadata or {}
    word_count = len(draft.text.split())
    heuristics: dict[str, float] = {
        "pov_consistency": 1.0 if metadata.get("pov") else 0.0,
        "goal_clarity": 0.0,
        "conflict_clarity": 1.0 if metadata.get("conflict") else 0.0,
        "pacing_fit": 0.0,
    }

    goal = str(metadata.get("goal") or "").strip()
    if goal:
        goal_length = len(goal.split())
        heuristics["goal_clarity"] = round(goal_length / (goal_length + 4), 2)

    target = metadata.get("word_target")
    if isinstance(target, (int, float)):
        target_value = float(target)
        if target_value > 0:
            deviation = abs(word_count - target_value)
            heuristics["pacing_fit"] = round(max(0.0, 1.0 - min(deviation / target_value, 1.0)), 2)

    return heuristics


def apply_rubric(draft: Draft, *, model: dict[str, str] | None = None) -> Critique:
    """Evaluate a draft against the baseline rubric and produce a critique."""

    text = draft.text
    lines = text.splitlines()
    word_count = len(text.split())
    sentence_lengths = _sentence_lengths(text)
    avg_sentence = sum(sentence_lengths) / len(sentence_lengths)
    longest_sentence = max(sentence_lengths)
    line_index, longest_line = _longest_line(lines or [text])

    summary_parts = [
        f"Draft '{draft.title}' spans {word_count} words across {len(lines) or 1} line(s).",
        (
            "Average sentence length is "
            f"{avg_sentence:.1f} words; longest sentence uses {longest_sentence} words."
        ),
    ]
    if avg_sentence > 25:
        summary_parts.append("Pacing slows due to long sentences; consider strategic breaks.")
    elif avg_sentence < 8:
        summary_parts.append("Rapid-fire pacing detected; blend in longer beats for contrast.")

    line_comments: list[dict[str, Any]] = []
    if longest_line:
        line_comments.append(
            {
                "line": line_index,
                "note": "Longest line in the scene; tighten phrasing to sustain tension.",
                "excerpt": longest_line[:160],
            }
        )

    priorities = [
        "Validate logical continuity between beats.",
        "Ensure character motivation remains visible in each reversal.",
    ]
    if avg_sentence > 20:
        priorities.append("Split or tighten long sentences to restore pacing.")
    if word_count < 200:
        priorities.append("Expand atmospheric detail to deepen horror tone.")

    suggested_edits: list[dict[str, Any]] = []
    if longest_line:
        begin = text.find(longest_line)
        if begin >= 0:
            suggested_edits.append(
                {
                    "range": [begin, begin + len(longest_line)],
                    "replacement": longest_line.strip().rstrip(",.;") + ".",
                }
            )

    severity = "medium"
    if avg_sentence > 30 or word_count < 120:
        severity = "high"
    elif avg_sentence < 12 and word_count > 800:
        severity = "low"

    heuristics = _compute_heuristics(draft)
    critique = Critique(
        unit_id=draft.unit_id,
        summary=" ".join(summary_parts),
        line_comments=line_comments,
        priorities=priorities,
        suggested_edits=suggested_edits,
        severity=severity,
        model=model or CRITIQUE_MODEL,
        heuristics=heuristics,
    )
    return critique


class CritiqueService:
    """Generate critique payloads compliant with CritiqueOutputSchema v1."""

    _FIXTURE_PACKAGE: Final[str] = "blackskies.services.fixtures"
    _FIXTURE_NAME: Final[str] = "draft_critique.json"
    _SCHEMA_VERSION: Final[str] = "CritiqueOutputSchema v1"
    _DATA_DIR: Final[Path] = Path(__file__).resolve().parents[4] / "data" / "drafts"

    def __init__(
        self,
        fixtures_package: str | None = None,
        *,
        data_dir: Path | None = None,
        model_router: ModelRouter | None = None,
    ) -> None:
        self._fixtures_package = fixtures_package or self._FIXTURE_PACKAGE
        self._cached_fixture: dict[str, Any] | None = None
        self._data_dir = data_dir or self._DATA_DIR
        self._model_router = model_router
        self._last_adapter: BaseAdapter | None = None
        self._last_route: ModelRouteDecision | None = None

    def _resolve_model(self) -> dict[str, str]:
        if not self._model_router:
            return CRITIQUE_MODEL.copy()
        decision = self._model_router.route(ModelTask.CRITIQUE)
        self._last_route = decision
        self._last_adapter = None
        if self._model_router.config.provider_calls_enabled:
            provider = self._model_router.providers.get(decision.provider)
            if provider and provider.supports(ModelTask.CRITIQUE):
                self._last_adapter = provider.adapter()
        return {"name": decision.model.name, "provider": decision.model.provider}

    @property
    def last_route(self) -> ModelRouteDecision | None:
        return self._last_route

    def _build_adapter_prompt(
        self,
        *,
        draft: Draft,
        rubric: list[str],
    ) -> tuple[str, str]:
        system = (
            "You are a narrative critique engine. Return a JSON object with keys "
            "summary (string), priorities (list of strings), line_comments (list of objects "
            "with line, note, excerpt), suggested_edits (list of objects with range and replacement), "
            "severity (low|medium|high)."
        )
        rubric_text = ", ".join(rubric)
        prompt = "\n".join(
            [
                f"Rubric categories: {rubric_text}",
                "Draft text:",
                draft.text,
                "Return JSON only.",
            ]
        )
        return system, prompt

    @staticmethod
    def _extract_json_payload(text: str) -> dict[str, Any] | None:
        try:
            parsed = json.loads(text)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start == -1 or end <= start:
                return None
            try:
                parsed = json.loads(text[start : end + 1])
                return parsed if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                return None

    def run(
        self,
        request: DraftCritiqueRequest,
        *,
        project_root: Path | None = None,
        project_id: str | None = None,
    ) -> dict[str, Any]:
        """Return a critique payload tailored to the requested unit."""

        draft = self._load_draft(
            request=request,
            project_root=project_root,
            project_id=project_id,
        )
        model = self._resolve_model()
        if draft is None:
            LOGGER.debug(
                "Falling back to critique fixture for %s due to missing draft text.",
                request.unit_id,
            )
            payload = copy.deepcopy(self._load_fixture())
            payload["unit_id"] = request.unit_id
            payload["schema_version"] = self._SCHEMA_VERSION
            payload["model"] = model
            payload["rubric"] = request.rubric
            if request.rubric_id:
                payload["rubric_id"] = request.rubric_id
            return payload

        adapter = self._last_adapter
        if adapter is not None:
            system, prompt = self._build_adapter_prompt(draft=draft, rubric=request.rubric)
            try:
                adapter_result = adapter.critique({"system": system, "prompt": prompt})
                adapter_text = adapter_result.get("text")
                if isinstance(adapter_text, str):
                    parsed = self._extract_json_payload(adapter_text)
                    if parsed:
                        try:
                            validated = _AdapterCritiquePayload.model_validate(parsed)
                        except ValidationError as exc:
                            LOGGER.warning(
                                "Critique adapter payload invalid; falling back to rubric. %s",
                                exc,
                            )
                        else:
                            critique = Critique(
                                unit_id=draft.unit_id,
                                summary=validated.summary,
                                line_comments=[
                                    entry.model_dump(mode="json")
                                    for entry in validated.line_comments
                                ],
                                priorities=list(validated.priorities),
                                suggested_edits=[
                                    entry.model_dump(mode="json")
                                    for entry in validated.suggested_edits
                                ],
                                severity=validated.severity,
                                model=model,
                                heuristics=_compute_heuristics(draft),
                            )
                            payload = critique.to_dict()
                            payload["rubric"] = request.rubric
                            if request.rubric_id:
                                payload["rubric_id"] = request.rubric_id
                            return payload
            except AdapterError as exc:
                LOGGER.warning("Critique adapter failed; falling back to rubric. %s", exc)

        critique = apply_rubric(draft, model=model)
        payload = critique.to_dict()
        payload["rubric"] = request.rubric
        if request.rubric_id:
            payload["rubric_id"] = request.rubric_id
        return payload

    def _load_draft(
        self,
        *,
        request: DraftCritiqueRequest,
        project_root: Path | None,
        project_id: str | None,
    ) -> Draft | None:
        draft = None
        if project_root is not None and project_root.exists():
            draft = self._draft_from_scene(
                request=request,
                project_root=project_root,
                project_id=project_id,
            )
        if draft is None:
            draft = self._draft_from_cache(request)
        return draft

    def _draft_from_scene(
        self,
        *,
        request: DraftCritiqueRequest,
        project_root: Path,
        project_id: str | None,
    ) -> Draft | None:
        try:
            _, front_matter, body = read_scene_document(project_root, request.unit_id)
        except DraftRequestError as exc:
            LOGGER.debug(
                "Scene %s unavailable for project %s: %s",
                request.unit_id,
                project_root,
                exc,
            )
            return None

        title = str(front_matter.get("title") or request.unit_id)
        metadata = dict(front_matter)
        if project_id:
            metadata["project_id"] = project_id
        return Draft(
            unit_id=request.unit_id,
            title=title,
            text=body,
            metadata=metadata,
        )

    def _draft_from_cache(self, request: DraftCritiqueRequest) -> Draft | None:
        """Load draft units from cached generation artifacts when available."""

        try:
            data_dir = Path(self._data_dir)
        except TypeError:  # pragma: no cover - defensive
            return None

        path = data_dir / f"{request.draft_id}.json"
        if not path.exists():
            return None

        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            LOGGER.debug("Failed to read cached draft %s: %s", path, exc)
            return None

        units: list[dict[str, Any]] = []
        response = raw.get("response")
        if isinstance(response, dict):
            units = response.get("units") or []
        if not units and isinstance(raw.get("units"), list):
            units = raw["units"]

        for unit in units:
            if not isinstance(unit, dict):
                continue
            if unit.get("unit_id") != request.unit_id:
                continue
            text = str(unit.get("text") or "")
            title = str(unit.get("title") or request.unit_id)
            metadata = {"source": "cache", "draft_id": request.draft_id}
            return Draft(unit_id=request.unit_id, title=title, text=text, metadata=metadata)
        return None

    def _load_fixture(self) -> dict[str, Any]:
        """Load and cache the baseline critique fixture."""

        if self._cached_fixture is not None:
            return self._cached_fixture

        try:
            fixture_path = resources.files(self._fixtures_package).joinpath(self._FIXTURE_NAME)
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


__all__ = [
    "apply_rubric",
    "CritiqueService",
    "CRITIQUE_MODEL",
    "CATEGORIES",
    "BLOCKED_RUBRIC_CATEGORIES",
]
