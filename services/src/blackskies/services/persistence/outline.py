"""Persistence helpers for outline artifacts."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from ..config import ServiceSettings
from ..models.outline import OutlineArtifact
from .atomic import flush_handle, locked_path, replace_file


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

        with locked_path(target_path):
            temp_path = target_path.parent / f".{target_path.name}.{uuid4().hex}.tmp"
            with temp_path.open("w", encoding="utf-8") as handle:
                handle.write(serialized)
                flush_handle(handle, durable=True)
            replace_file(temp_path, target_path)
        return target_path


__all__ = ["OutlinePersistence"]
