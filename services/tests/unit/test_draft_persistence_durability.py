"""Tests for configurable durability in draft persistence."""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import DraftPersistence


@pytest.fixture()
def service_settings(tmp_path: Path) -> ServiceSettings:
    """Provide service settings pointing at a temporary project root."""

    return ServiceSettings(project_base_dir=tmp_path)


def _front_matter(scene_id: str) -> dict[str, str]:
    return {
        "id": scene_id,
        "title": f"Title for {scene_id}",
        "slug": scene_id,
    }


def test_relaxed_durability_batches_fsync(
    monkeypatch: pytest.MonkeyPatch, service_settings: ServiceSettings
) -> None:
    """Only the final write should fsync when durability is relaxed."""

    calls: list[int] = []

    def _capture_fsync(fd: int) -> None:
        calls.append(fd)

    monkeypatch.setattr(os, "fsync", _capture_fsync)

    persistence = DraftPersistence(settings=service_settings, durable_writes=False)
    project_id = "proj"

    persistence.write_scene(project_id, _front_matter("scene-1"), "Body one.", durable=False)
    persistence.write_scene(project_id, _front_matter("scene-2"), "Body two.", durable=True)

    assert len(calls) == 1, "Expected exactly one fsync for batched writes"


def test_default_durability_invokes_fsync(
    monkeypatch: pytest.MonkeyPatch, service_settings: ServiceSettings
) -> None:
    """Strict durability should fsync on every write by default."""

    calls: list[int] = []

    def _capture_fsync(fd: int) -> None:
        calls.append(fd)

    monkeypatch.setattr(os, "fsync", _capture_fsync)

    persistence = DraftPersistence(settings=service_settings)
    project_id = "proj"

    persistence.write_scene(project_id, _front_matter("scene-3"), "Body text.")

    assert len(calls) == 1, "Durable writes must fsync once per write"
