"""Persistence helpers for writing service artifacts to disk."""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from uuid import uuid4

from .config import ServiceSettings
from .models.outline import OutlineArtifact


@dataclass
class OutlinePersistence:
    """Persist outline artifacts using atomic file writes."""

    settings: ServiceSettings

    def ensure_project_root(self, project_id: str) -> Path:
        """Ensure the project root exists and return the path."""

        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        return project_root

    def write_outline(self, project_id: str, outline: OutlineArtifact) -> Path:
        """Validate and atomically write the outline artifact to disk."""

        project_root = self.ensure_project_root(project_id)
        target_path = project_root / "outline.json"

        payload = outline.model_dump(mode="json")
        serialized = json.dumps(payload, indent=2, ensure_ascii=False)

        temp_path = target_path.parent / f".{target_path.name}.{uuid4().hex}.tmp"
        with temp_path.open("w", encoding="utf-8") as handle:
            handle.write(serialized)
            handle.flush()
            os.fsync(handle.fileno())

        temp_path.replace(target_path)
        return target_path


_FIELD_ORDER = [
    "id",
    "slug",
    "title",
    "pov",
    "purpose",
    "goal",
    "conflict",
    "turn",
    "emotion_tag",
    "word_target",
    "order",
    "chapter_id",
    "beats",
]


def _format_yaml_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        if not value:
            return "[]"
        joined = ", ".join(_format_yaml_value(item) for item in value)
        return f"[{joined}]"
    if value is None:
        return "null"

    text = str(value)
    if _needs_quotes(text):
        return json.dumps(text)
    return text


def _needs_quotes(value: str) -> bool:
    if value == "":
        return True
    if value != value.strip():
        return True
    if value.lower() in {"null", "true", "false", "yes", "no"}:
        return True
    if value[0] in "-?:!%*@&" or value[-1] in ":":
        return True
    if re.search(r"[#:>{}\[\],]", value):
        return True
    return False


@dataclass
class DraftPersistence:
    """Persist synthesized draft scenes with locked front-matter."""

    settings: ServiceSettings

    def ensure_project_root(self, project_id: str) -> Path:
        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        return project_root

    def write_scene(
        self, project_id: str, front_matter: dict[str, Any], body: str
    ) -> Path:
        project_root = self.ensure_project_root(project_id)
        drafts_dir = project_root / "drafts"
        drafts_dir.mkdir(parents=True, exist_ok=True)

        scene_id = front_matter["id"]
        target_path = drafts_dir / f"{scene_id}.md"
        rendered = self._render(front_matter, body)

        temp_path = target_path.parent / f".{target_path.name}.{uuid4().hex}.tmp"
        with temp_path.open("w", encoding="utf-8") as handle:
            handle.write(rendered)
            handle.flush()
            os.fsync(handle.fileno())

        temp_path.replace(target_path)
        return target_path

    @staticmethod
    def _render(front_matter: dict[str, Any], body: str) -> str:
        lines = ["---"]
        for key in _FIELD_ORDER:
            if key not in front_matter:
                continue
            value = front_matter[key]
            if value is None:
                continue
            lines.append(f"{key}: {_format_yaml_value(value)}")
        lines.append("---")

        text_body = body.rstrip()
        if text_body:
            return "\n".join(lines) + "\n" + text_body + "\n"
        return "\n".join(lines) + "\n"


def dump_diagnostic(path: Path, payload: dict[str, Any]) -> None:
    """Write a JSON diagnostic payload to disk."""

    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.flush()
        os.fsync(handle.fileno())


__all__ = ["DraftPersistence", "OutlinePersistence", "dump_diagnostic"]
