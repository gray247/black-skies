"""Utilities for reading and parsing scene markdown documents."""

from __future__ import annotations

from pathlib import Path
from typing import Any


class DraftRequestError(ValueError):
    """Raised when draft operations cannot proceed due to missing artifacts."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.details = details or {}


def _looks_like_float(value: str) -> bool:
    stripped = value.replace("_", "")
    if stripped.count(".") != 1:
        return False
    left, right = stripped.split(".", 1)
    if left in {"", "-"}:
        return False
    return left.lstrip("-").isdigit() and right.isdigit()


def _parse_front_matter_value(value: str) -> Any:
    """Best-effort parsing of front-matter scalar values."""

    candidate = value.strip()
    if candidate == "":
        return ""
    lowered = candidate.lower()
    if lowered == "null":
        return None
    if lowered in {"true", "false"}:
        return lowered == "true"
    if lowered.isdigit() or (lowered.startswith("-") and lowered[1:].isdigit()):
        return int(lowered)
    if _looks_like_float(candidate):
        try:
            return float(candidate)
        except ValueError:  # pragma: no cover - defensive guard
            pass
    if candidate.startswith("[") and candidate.endswith("]"):
        inner = candidate[1:-1].strip()
        if not inner:
            return []
        parts = [part.strip() for part in inner.split(",") if part.strip()]
        normalized: list[str] = []
        for fragment in parts:
            token = fragment.strip()
            if len(token) >= 2 and token[0] in {'"', "'"} and token[-1] == token[0]:
                token = token[1:-1]
            normalized.append(token)
        return normalized
    return candidate


def read_scene_document(
    project_root: Path, unit_id: str
) -> tuple[Path, dict[str, Any], str]:
    """Load front-matter metadata and body text for the given scene markdown."""

    drafts_dir = project_root / "drafts"
    target_path = drafts_dir / f"{unit_id}.md"
    if not target_path.exists():
        raise DraftRequestError("Scene markdown is missing.", {"unit_id": unit_id})

    content = target_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        raise DraftRequestError(
            "Scene markdown is missing front-matter header.", {"unit_id": unit_id}
        )

    front_lines: list[str] = []
    index = 1
    while index < len(lines) and lines[index].strip() != "---":
        front_lines.append(lines[index])
        index += 1
    if index == len(lines):
        raise DraftRequestError(
            "Scene markdown is missing front-matter terminator.", {"unit_id": unit_id}
        )

    body = "\n".join(lines[index + 1 :])

    front_matter: dict[str, Any] = {}
    for line in front_lines:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        front_matter[key.strip()] = _parse_front_matter_value(value)

    scene_id = front_matter.get("id")
    if scene_id != unit_id:
        raise DraftRequestError(
            "Scene markdown id does not match unit id.", {"unit_id": unit_id}
        )

    return target_path, front_matter, body


__all__ = ["DraftRequestError", "read_scene_document"]
