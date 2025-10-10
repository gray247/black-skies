"""Tests for the refactored snapshot persistence helpers."""

from __future__ import annotations

import json
import sys
import types
from dataclasses import dataclass
from pathlib import Path
from typing import Any, ClassVar

import pytest


try:  # pragma: no cover - fallback ensures tests run without optional deps
    import pydantic  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    pydantic_stub = types.ModuleType("pydantic")

    class _BaseModel:
        model_config: ClassVar[dict[str, Any]] = {}
        model_fields: dict[str, Any] = {"project_base_dir": object()}

        def __init__(self, **kwargs: Any) -> None:
            for key, value in kwargs.items():
                setattr(self, key, value)

    class _AliasChoices:
        def __init__(self, *choices: str) -> None:
            self.choices = choices

    def _field(*, default: Any | None = None, default_factory: Any | None = None, **_: Any) -> Any:
        return default if default is not None else default_factory

    def _field_validator(*args: Any, **kwargs: Any):
        def decorator(func: Any) -> Any:
            return func

        return decorator

    pydantic_stub.BaseModel = _BaseModel
    pydantic_stub.Field = _field
    pydantic_stub.field_validator = _field_validator
    pydantic_stub.AliasChoices = _AliasChoices
    sys.modules["pydantic"] = pydantic_stub

from blackskies.services.persistence import SnapshotPersistence


@dataclass
class _Settings:
    """Minimal settings stub for snapshot persistence tests."""

    project_base_dir: Path


def _write_scene(path: Path, scene_id: str, body: str = "Body text.") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = "---\n" f"id: {scene_id}\n" "title: Sample Scene\n" "pov: hero\n" "---\n" f"{body}\n"
    path.write_text(content, encoding="utf-8")


def test_snapshot_creation_happy_path(tmp_path: Path) -> None:
    settings = _Settings(project_base_dir=tmp_path)
    persistence = SnapshotPersistence(settings=settings)

    project_id = "project-happy"
    project_root = tmp_path / project_id
    _write_scene(project_root / "drafts" / "scene-1.md", "scene-1")

    outline_payload = {"scenes": [{"id": "scene-1"}]}
    (project_root / "outline.json").write_text(json.dumps(outline_payload), encoding="utf-8")
    project_payload = {"title": "Happy Project"}
    (project_root / "project.json").write_text(json.dumps(project_payload), encoding="utf-8")

    snapshot = persistence.create_snapshot(project_id, label="Review Build")

    assert snapshot["label"] == "Review-Build"
    assert snapshot["snapshot_id"]
    assert set(snapshot["includes"]) == {"drafts", "outline.json", "project.json"}

    snapshot_dir = (
        project_root / "history" / "snapshots" / f"{snapshot['snapshot_id']}_{snapshot['label']}"
    )
    metadata_path = snapshot_dir / "metadata.json"
    assert metadata_path.exists()
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert metadata["label"] == "Review-Build"
    assert metadata["includes"] == ["drafts", "outline.json", "project.json"]


def test_snapshot_creation_invalid_include_cleans_up(tmp_path: Path) -> None:
    settings = _Settings(project_base_dir=tmp_path)
    persistence = SnapshotPersistence(settings=settings)

    project_id = "project-invalid"

    with pytest.raises(ValueError) as excinfo:
        persistence.create_snapshot(
            project_id,
            include_entries=["../outside"],
        )

    assert "may not contain parent directory traversal" in str(excinfo.value)

    snapshots_dir = tmp_path / project_id / "history" / "snapshots"
    if snapshots_dir.exists():
        assert not any(snapshots_dir.iterdir())


def test_snapshot_manifest_includes_scene_entries(tmp_path: Path) -> None:
    settings = _Settings(project_base_dir=tmp_path)
    persistence = SnapshotPersistence(settings=settings)

    project_id = "project-manifest"
    project_root = tmp_path / project_id
    _write_scene(project_root / "drafts" / "scene-1.md", "scene-1")

    outline_payload = {"scenes": [{"id": "scene-1"}, {"id": "scene-2"}]}
    (project_root / "outline.json").write_text(json.dumps(outline_payload), encoding="utf-8")
    (project_root / "project.json").write_text(
        json.dumps({"title": "Manifest Project"}), encoding="utf-8"
    )

    snapshot = persistence.create_snapshot(project_id, label="manifest")

    snapshot_dir = (
        project_root / "history" / "snapshots" / f"{snapshot['snapshot_id']}_{snapshot['label']}"
    )
    manifest_path = snapshot_dir / "snapshot.yaml"
    assert manifest_path.exists()
    manifest_text = manifest_path.read_text(encoding="utf-8")

    try:
        manifest = json.loads(manifest_text)
    except json.JSONDecodeError:
        import yaml  # type: ignore

        manifest = yaml.safe_load(manifest_text)

    assert manifest["schema_version"] == "SnapshotManifest v1"
    assert manifest["drafts"][0]["id"] == "scene-1"
    assert manifest["drafts"][0]["path"] == "drafts/scene-1.md"
    assert manifest["missing_drafts"] == ["scene-2"]
