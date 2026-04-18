"""Prompt compilation helpers for scene-draft generation."""

from __future__ import annotations

from .continuity_context_builder import SceneContext
from .prompt_profile_resolver import DEFAULT_PROFILE, ProviderProfile


def compile_draft_prompt(context: SceneContext, profile: ProviderProfile | None = None) -> str:
    profile = profile or DEFAULT_PROFILE
    beat_line = ", ".join(context.beat_refs) if context.beat_refs else "None"
    notes_line = " | ".join(context.notes) if context.notes else "None"
    locked_line = "; ".join(context.locked_facts) if context.locked_facts else "None"
    memory = context.memory
    resolved = context.resolved_memory

    lines: list[str] = []
    lines.extend(profile.draft_style)
    lines.extend(
        [
            f"Scene title: {context.title}",
            f"Chapter: {context.chapter_context or context.chapter_id}",
            f"POV: {context.pov}",
            f"Purpose: {context.purpose}",
            f"Goal: {context.goal}",
            f"Conflict: {context.conflict}",
            f"Turn: {context.turn}",
            f"Emotion: {context.emotion}",
            f"Target words: {context.word_target}",
            f"Pacing target: {context.pacing_target}",
            f"Beats: {beat_line}",
            f"Locked facts: {locked_line}",
            f"Notes: {notes_line}",
        ]
    )
    if resolved and resolved.selected_summary:
        lines.append(f"Prior outcome: {resolved.selected_summary}")
    elif memory and memory.prior_summary:
        lines.append(f"Prior outcome: {memory.prior_summary}")

    if resolved and resolved.selected_unresolved_tensions:
        lines.append(f"Unresolved tensions: {', '.join(resolved.selected_unresolved_tensions)}")
    elif memory and memory.unresolved_tensions:
        lines.append(f"Unresolved tensions: {', '.join(memory.unresolved_tensions)}")

    if resolved and resolved.selected_emotional_carryover:
        lines.append(f"Emotional carryover: {resolved.selected_emotional_carryover}")
    elif memory and memory.emotional_carryover:
        lines.append(f"Emotional carryover: {memory.emotional_carryover}")

    if resolved and resolved.selected_location_state:
        lines.append(f"Location state: {resolved.selected_location_state}")
    elif memory and memory.location_state:
        lines.append(f"Location state: {memory.location_state}")

    if resolved and resolved.selected_interpretations:
        winner_label = next(
            (
                label.strip()
                for label in resolved.selected_interpretations
                if isinstance(label, str) and label.strip()
            ),
            None,
        )
        if winner_label:
            lines.append(f"Narrative interpretation pressure: {winner_label}")

    if resolved and isinstance(resolved.alternate_interpretation, str):
        alternate_label = resolved.alternate_interpretation.strip()
        if alternate_label:
            with_alternate = [*lines, f"Alternate reading: {alternate_label}"]
            base_tokens = estimate_prompt_tokens("\n".join(lines))
            alternate_tokens = estimate_prompt_tokens("\n".join(with_alternate))
            if base_tokens == 0 or ((alternate_tokens - base_tokens) / float(base_tokens)) <= 0.20:
                lines = with_alternate

    if context.prior_context:
        lines.append(f"Prior context: {context.prior_context}")
    lines.append("Return plain text only, no markdown fences.")
    return "\n".join(lines)


def estimate_prompt_tokens(text: str) -> int:
    return len([token for token in text.split() if token])


__all__ = ["compile_draft_prompt", "estimate_prompt_tokens"]
