"""Budget management helpers for draft generation workflows."""

from __future__ import annotations

import copy
import json
import logging
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from .diagnostics import DiagnosticLogger
from .constants import (
    COST_PER_1000_WORDS_USD,
    DEFAULT_HARD_BUDGET_LIMIT_USD,
    DEFAULT_SOFT_BUDGET_LIMIT_USD,
)

if TYPE_CHECKING:
    from .models.accept import DraftAcceptRequest

LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class ProjectBudgetState:
    """Snapshot of a project's budget configuration and metadata."""

    project_root: Path
    metadata: dict[str, Any]
    soft_limit: float
    hard_limit: float
    spent_usd: float
    project_path: Path


_NUMERIC_SANITIZE_RE = re.compile(r"[^0-9.,+-]")


def _normalize_budget_token(raw_value: str) -> str | None:
    text = raw_value.strip().replace("\u00a0", "")
    if not text:
        return None

    sign = ""
    if text[0] in "+-":
        sign = text[0]
        text = text[1:]

    filtered = _NUMERIC_SANITIZE_RE.sub("", text)
    if not filtered:
        return None

    filtered = filtered.replace("+", "")
    if "-" in filtered:
        return None

    if "," in filtered and "." in filtered:
        last_dot = filtered.rfind(".")
        last_comma = filtered.rfind(",")
        if last_dot > last_comma:
            decimal_sep = "."
            thousands_sep = ","
        else:
            decimal_sep = ","
            thousands_sep = "."

        filtered = filtered.replace(thousands_sep, "")
        if decimal_sep != ".":
            filtered = filtered.replace(decimal_sep, ".", 1)
            if decimal_sep in filtered:
                return None
    elif "," in filtered:
        fractional = filtered.split(",", 1)[1]
        if filtered.count(",") == 1 and 1 <= len(fractional) <= 2:
            filtered = filtered.replace(",", ".")
        else:
            filtered = filtered.replace(",", "")

    if filtered.count(".") > 1:
        return None

    candidate = f"{sign}{filtered}" if sign else filtered
    if candidate in {"", "+", "-", ".", "+.", "-."}:
        return None
    return candidate


def _coerce_budget_value(
    raw_value: Any,
    *,
    default: float,
    field: str,
    project_root: Path,
    diagnostics: DiagnosticLogger,
) -> float:
    if isinstance(raw_value, (int, float)):
        return float(raw_value)
    if isinstance(raw_value, str):
        normalized = _normalize_budget_token(raw_value)
        if normalized is not None:
            try:
                return float(normalized)
            except ValueError:
                LOGGER.debug("Failed to parse budget value", exc_info=True)
    elif raw_value is None:
        return float(default)

    diagnostics.log(
        project_root,
        code="VALIDATION",
        message="Invalid budget value encountered; default applied.",
        details={"field": field, "value": raw_value},
    )
    return float(default)


def load_project_budget_state(
    project_root: Path, diagnostics: DiagnosticLogger
) -> ProjectBudgetState:
    """Read the project's persisted budget state from disk."""

    project_path = project_root / "project.json"
    base_payload: dict[str, Any] = {
        "project_id": project_root.name,
        "budget": {
            "soft": DEFAULT_SOFT_BUDGET_LIMIT_USD,
            "hard": DEFAULT_HARD_BUDGET_LIMIT_USD,
            "spent_usd": 0.0,
        },
    }
    payload = copy.deepcopy(base_payload)

    if project_path.exists():
        try:
            with project_path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            diagnostics.log(
                project_root,
                code="INTERNAL",
                message="Failed to read project metadata.",
                details={"error": str(exc)},
            )

    budget_meta = payload.setdefault("budget", {})
    soft_limit = _coerce_budget_value(
        budget_meta.get("soft", DEFAULT_SOFT_BUDGET_LIMIT_USD),
        default=DEFAULT_SOFT_BUDGET_LIMIT_USD,
        field="soft",
        project_root=project_root,
        diagnostics=diagnostics,
    )
    hard_limit = _coerce_budget_value(
        budget_meta.get("hard", DEFAULT_HARD_BUDGET_LIMIT_USD),
        default=DEFAULT_HARD_BUDGET_LIMIT_USD,
        field="hard",
        project_root=project_root,
        diagnostics=diagnostics,
    )
    spent_usd = _coerce_budget_value(
        budget_meta.get("spent_usd", 0.0),
        default=0.0,
        field="spent_usd",
        project_root=project_root,
        diagnostics=diagnostics,
    )

    effective_hard = hard_limit if hard_limit > 0 else DEFAULT_HARD_BUDGET_LIMIT_USD
    if soft_limit > effective_hard:
        soft_limit = effective_hard

    return ProjectBudgetState(
        project_root=project_root,
        metadata=payload,
        soft_limit=soft_limit,
        hard_limit=effective_hard,
        spent_usd=spent_usd if spent_usd >= 0 else 0.0,
        project_path=project_path,
    )


def classify_budget(
    estimated_cost: float,
    *,
    soft_limit: float,
    hard_limit: float,
    current_spend: float,
) -> tuple[str, str, float]:
    """Classify an estimated run cost against budget thresholds."""

    effective_hard_limit = (
        hard_limit if hard_limit > 0 else DEFAULT_HARD_BUDGET_LIMIT_USD
    )
    effective_soft_limit = (
        soft_limit if 0 <= soft_limit <= effective_hard_limit else effective_hard_limit
    )

    total_after_run = round(current_spend + estimated_cost, 2)

    if total_after_run >= effective_hard_limit:
        return (
            "blocked",
            (
                f"Estimated total ${total_after_run:.2f} exceeds hard limit "
                f"${effective_hard_limit:.2f}."
            ),
            total_after_run,
        )
    if total_after_run >= effective_soft_limit:
        return (
            "soft-limit",
            (
                f"Estimated total ${total_after_run:.2f} exceeds soft limit "
                f"${effective_soft_limit:.2f}."
            ),
            total_after_run,
        )
    return "ok", "Estimate within budget.", total_after_run


def persist_project_budget(state: ProjectBudgetState, new_spent_usd: float) -> None:
    """Persist the updated budget metadata back to disk."""

    payload = copy.deepcopy(state.metadata)
    budget_section = payload.setdefault("budget", {})
    budget_section["soft"] = round(state.soft_limit, 2)
    budget_section["hard"] = round(state.hard_limit, 2)
    budget_section["spent_usd"] = round(max(new_spent_usd, 0.0), 2)

    payload.setdefault("project_id", state.project_root.name)

    serialized = json.dumps(payload, indent=2, ensure_ascii=False)

    state.project_root.mkdir(parents=True, exist_ok=True)
    temp_path = state.project_path.parent / f".{state.project_path.name}.{uuid4().hex}.tmp"
    with temp_path.open("w", encoding="utf-8") as handle:
        handle.write(serialized)
        handle.flush()
        os.fsync(handle.fileno())

    temp_path.replace(state.project_path)


__all__ = [
    "ProjectBudgetState",
    "DEFAULT_SOFT_BUDGET_LIMIT_USD",
    "DEFAULT_HARD_BUDGET_LIMIT_USD",
    "COST_PER_1000_WORDS_USD",
    "derive_accept_unit_cost",
    "classify_budget",
    "load_project_budget_state",
    "persist_project_budget",
]


def _estimate_cost_from_text(text: str) -> float:
    """Estimate generation cost by counting words in the provided text."""

    words = [token for token in text.split() if token]
    if not words:
        return 0.0
    cost = (len(words) / 1000.0) * COST_PER_1000_WORDS_USD
    return round(cost, 2)


def _extract_cost_from_cached_unit(unit_payload: dict[str, Any]) -> float | None:
    meta = unit_payload.get("meta")
    if isinstance(meta, dict):
        word_target = meta.get("word_target")
        if isinstance(word_target, (int, float)) and word_target > 0:
            cost = (float(word_target) / 1000.0) * COST_PER_1000_WORDS_USD
            return round(cost, 2)

    cached_cost = unit_payload.get("estimated_cost_usd")
    if isinstance(cached_cost, (int, float)) and cached_cost >= 0:
        return round(float(cached_cost), 2)
    return None


def derive_accept_unit_cost(
    *,
    budget_state: ProjectBudgetState,
    request: "DraftAcceptRequest",
    normalized_text: str,
    project_root: Path,
    diagnostics: DiagnosticLogger,
) -> float:
    """Return the authoritative cost for an accepted draft unit."""

    budget_meta = (
        budget_state.metadata.get("budget") if isinstance(budget_state.metadata, dict) else None
    )
    cached_response = (
        budget_meta.get("last_generate_response") if isinstance(budget_meta, dict) else None
    )

    if isinstance(cached_response, dict):
        cached_draft_id = cached_response.get("draft_id")
        if cached_draft_id == request.draft_id:
            units_payload = cached_response.get("units")
            unit_matched = False
            if isinstance(units_payload, list):
                for unit_payload in units_payload:
                    if not isinstance(unit_payload, dict):
                        continue
                    if unit_payload.get("id") != request.unit_id:
                        continue
                    unit_matched = True
                    cached_cost = _extract_cost_from_cached_unit(unit_payload)
                    if cached_cost is not None:
                        return cached_cost
                    diagnostics.log(
                        project_root,
                        code="INTERNAL",
                        message="Cached generate response missing unit cost; recomputing.",
                        details={"unit_id": request.unit_id},
                    )
                    break
            if isinstance(units_payload, list) and not unit_matched:
                diagnostics.log(
                    project_root,
                    code="INTERNAL",
                    message="Cached generate response missing unit entry; recomputing cost.",
                    details={
                        "unit_id": request.unit_id,
                        "cached_unit_ids": [
                            unit.get("id") for unit in units_payload if isinstance(unit, dict)
                        ],
                    },
                )
            budget_info = cached_response.get("budget")
            if isinstance(budget_info, dict):
                total_estimate = budget_info.get("estimated_usd")
                units_payload = cached_response.get("units")
                if (
                    isinstance(total_estimate, (int, float))
                    and total_estimate >= 0
                    and isinstance(units_payload, list)
                    and len(units_payload) == 1
                ):
                    return round(float(total_estimate), 2)
        else:
            diagnostics.log(
                project_root,
                code="INTERNAL",
                message="Accept request draft_id mismatch; recomputing cost.",
                details={
                    "expected_draft_id": cached_draft_id,
                    "received_draft_id": request.draft_id,
                },
            )
    else:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Missing cached generate response; recomputing cost.",
            details={"unit_id": request.unit_id},
        )

    fallback_cost = _estimate_cost_from_text(normalized_text)
    if fallback_cost == 0.0:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Unable to derive cost from cache; text produced zero-cost fallback.",
            details={"unit_id": request.unit_id},
        )
    return fallback_cost
