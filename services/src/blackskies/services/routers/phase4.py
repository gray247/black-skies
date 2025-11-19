"""Phase 4 critique + rewrite mock endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from ..e2e_mode import (
    e2e_phase4_critique_response,
    e2e_phase4_rewrite_response,
    is_e2e_mode,
)
from ..models.phase4_loop import (
    CritiqueMode,
    Phase4CritiqueRequest,
    Phase4CritiqueResponse,
    Phase4Issue,
    Phase4RewriteRequest,
    Phase4RewriteResponse,
)

router = APIRouter(prefix="/phase4", tags=["phase4"])


def _split_lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def _build_summary(text: str, mode: CritiqueMode) -> str:
    word_count = len(text.split())
    lines = len(_split_lines(text))
    mode_label = mode.value.replace("_", " ").title()
    return f"Mock {mode_label} critique covers {word_count} words across {lines} line(s)."


def _build_issues(lines: list[str]) -> list[Phase4Issue]:
    issues: list[Phase4Issue] = []
    for index, line in enumerate(lines[:3], start=1):
        if len(line) > 120:
            issues.append(
                Phase4Issue(
                    line=index,
                    type="pacing",
                    message="Sentence feels long; insert a break to sustain the rhythm.",
                )
            )
        elif len(line) < 40:
            issues.append(
                Phase4Issue(
                    line=index,
                    type="detail",
                    message="Scene skims the surface; add sensory detail or internal beats.",
                )
            )
    if not issues:
        issues.append(
            Phase4Issue(
                line=1 if lines else None,
                type="tone",
                message="Tone is muted; lean into strong verbs or contrast.",
            )
        )
    return issues


_MODE_SUGGESTIONS: dict[CritiqueMode, list[str]] = {
    CritiqueMode.line_edit: [
        "Read aloud to catch stumbles and tighten phrasing.",
        "Swap passive verbs for stronger active beats.",
    ],
    CritiqueMode.big_picture: [
        "Ensure motivation arcs each beat.",
        "Revisit the midpoint thrust to keep stakes aligned.",
    ],
    CritiqueMode.pacing: [
        "Balance long sentences with short payoffs for rhythm.",
        "Add a brief pause or tag moment mid-scene.",
    ],
    CritiqueMode.tone: [
        "Amplify sensory anchors to secure atmosphere.",
        "Contrast solace with menace in alternating beats.",
    ],
}


def _build_suggestions(mode: CritiqueMode) -> list[str]:
    return _MODE_SUGGESTIONS.get(mode, _MODE_SUGGESTIONS[CritiqueMode.big_picture])


def _mock_rewrite(original_text: str, instructions: str | None) -> str:
    prefix = "[REWRITE MOCK]"
    cleaned_instructions = (instructions or "").strip()
    if cleaned_instructions:
        prefix = f"[REWRITE MOCK] {cleaned_instructions}"
    lines = _split_lines(original_text)
    condensed = " ".join(word for line in lines for word in line.split())
    if not condensed.strip():
        condensed = original_text.strip() or ""
    revised = condensed
    if len(revised.split()) > 200:
        revised = " ".join(revised.split()[:200]) + "…"
    return f"{prefix}\n\n{revised}"


@router.post("/critique", response_model=Phase4CritiqueResponse)
async def critique_phase4(payload: Phase4CritiqueRequest) -> Phase4CritiqueResponse:
    """Return deterministic mock feedback for the requested scene."""

    if is_e2e_mode():
        return e2e_phase4_critique_response(payload.scene_id)

    normalized_text = payload.text.strip()
    summary = _build_summary(normalized_text, payload.mode)
    lines = _split_lines(normalized_text)
    issues = _build_issues(lines)
    suggestions = _build_suggestions(payload.mode)
    return Phase4CritiqueResponse(summary=summary, issues=issues, suggestions=suggestions)


@router.post("/rewrite", response_model=Phase4RewriteResponse)
async def rewrite_phase4(payload: Phase4RewriteRequest) -> Phase4RewriteResponse:
    """Apply lightweight mock edits to the submitted text."""

    if is_e2e_mode():
        return e2e_phase4_rewrite_response(payload.scene_id, payload.instructions)

    revised_text = _mock_rewrite(payload.original_text, payload.instructions)
    return Phase4RewriteResponse(revised_text=revised_text)
