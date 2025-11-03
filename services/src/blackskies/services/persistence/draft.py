"""Persistence helpers for draft scene documents."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from uuid import uuid4

from ..config import ServiceSettings
from .atomic import flush_handle, locked_path, replace_file

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
    durable_writes: bool = True

    def ensure_project_root(self, project_id: str) -> Path:
        project_root = self.settings.project_base_dir / project_id
        project_root.mkdir(parents=True, exist_ok=True)
        return project_root

    def write_scene(
        self,
        project_id: str,
        front_matter: dict[str, Any],
        body: str,
        *,
        durable: bool | None = None,
    ) -> Path:
        project_root = self.ensure_project_root(project_id)
        drafts_dir = project_root / "drafts"
        drafts_dir.mkdir(parents=True, exist_ok=True)

        scene_id = front_matter["id"]
        target_path = drafts_dir / f"{scene_id}.md"
        rendered = self._render(front_matter, body)

        with locked_path(target_path):
            temp_path = target_path.parent / f".{target_path.name}.{uuid4().hex}.tmp"
            effective_durability = self.durable_writes if durable is None else durable
            with temp_path.open("w", encoding="utf-8") as handle:
                handle.write(rendered)
                flush_handle(handle, durable=effective_durability)
            replace_file(temp_path, target_path)
        return target_path

    @staticmethod
    def _render(front_matter: dict[str, Any], body: str) -> str:
        lines = ["---"]
        ordered_keys: list[str] = []
        for key in _FIELD_ORDER:
            if key in front_matter:
                ordered_keys.append(key)

        remaining_keys = sorted(key for key in front_matter.keys() if key not in _FIELD_ORDER)
        ordered_keys.extend(remaining_keys)

        for key in ordered_keys:
            value = front_matter.get(key)
            if value is None:
                continue
            lines.append(f"{key}: {_format_yaml_value(value)}")
        lines.append("---")

        text_body = body.rstrip()
        if text_body:
            return "\n".join(lines) + "\n" + text_body + "\n"
        return "\n".join(lines) + "\n"


__all__ = ["DraftPersistence"]
