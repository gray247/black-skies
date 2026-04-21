"""Lightweight runtime-truth documentation enforcement checks."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

CANON_DOCS: tuple[str, ...] = (
    "docs/specs/current_state.md",
    "docs/specs/memory_runtime.md",
    "docs/specs/model_runtime.md",
)

ALLOWED_RUNTIME_CLAIM_SOURCES: tuple[str, ...] = (
    "build/runtime_truth.json",
    *CANON_DOCS,
)

RUNTIME_CLAIM_DOCS: tuple[str, ...] = (
    "docs/specs/current_state.md",
    "docs/specs/memory_runtime.md",
    "docs/specs/model_runtime.md",
    "docs/specs/feature_maturity_migration.md",
    "docs/specs/agents_and_services.md",
)

PLANNING_DOCS: tuple[str, ...] = (
    "docs/roadmap.md",
    "docs/phases/phase_charter.md",
)

DEFERRED_DOCS: tuple[str, ...] = (
    "docs/deferred/voice_notes_transcription.md",
    "docs/deferred/smart_merge_tool.md",
    "docs/gui/accessibility_toggles.md",
)

RUNTIME_CLAIM_PATTERN = re.compile(
    r"\b("
    r"shipped|shipping|current runtime|baseline|enabled by default|"
    r"part of the standard runtime surface|available today|live runtime|"
    r"current reality"
    r")\b",
    re.IGNORECASE,
)


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _has_runtime_anchor(text: str) -> bool:
    normalized = text.replace("\\", "/")
    return any(source in normalized for source in ALLOWED_RUNTIME_CLAIM_SOURCES)


def validate_runtime_docs(repo_root: Path | None = None) -> list[str]:
    root = repo_root or REPO_ROOT
    errors: list[str] = []

    for rel_path in RUNTIME_CLAIM_DOCS:
        path = root / rel_path
        text = _read(path)
        if RUNTIME_CLAIM_PATTERN.search(text) and not _has_runtime_anchor(text):
            errors.append(
                f"{rel_path}: runtime-availability claims require a reference to "
                "build/runtime_truth.json or a canon runtime doc."
            )

    for rel_path in PLANNING_DOCS:
        path = root / rel_path
        text = _read(path).lower()
        if "not runtime authority" not in text:
            errors.append(
                f"{rel_path}: planning docs must explicitly state they are not runtime authority."
            )
        if "docs/specs/current_state.md" not in text:
            errors.append(f"{rel_path}: planning docs must reference docs/specs/current_state.md.")

    for rel_path in DEFERRED_DOCS:
        path = root / rel_path
        text = _read(path).lower()
        if "runtime dependency" not in text:
            errors.append(
                f"{rel_path}: deferred/planned doc must include a runtime dependency declaration."
            )
        if "seam owner" not in text:
            errors.append(f"{rel_path}: deferred/planned doc must include seam owner declaration.")

    return errors


def main() -> None:
    errors = validate_runtime_docs()
    if errors:
        joined = "\n".join(f"- {entry}" for entry in errors)
        raise SystemExit(f"Runtime doc policy violations:\n{joined}")
    print("Runtime doc policy check passed.")


if __name__ == "__main__":
    main()
