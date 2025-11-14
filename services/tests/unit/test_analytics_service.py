from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.analytics.service import AnalyticsSummaryService
from blackskies.services.config import ServiceSettings
from blackskies.services.constants import (
    DEFAULT_HARD_BUDGET_LIMIT_USD,
    DEFAULT_SOFT_BUDGET_LIMIT_USD,
    EMOTION_INTENSITY_MAP,
    PACE_FAST_THRESHOLD,
    PACE_SLOW_THRESHOLD,
)
from blackskies.services.diagnostics import DiagnosticLogger


def _write_outline(project_root: Path) -> None:
    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Arrival"}],
        "scenes": [
            {
                "id": "sc_0001",
                "order": 1,
                "title": "Storm Cellar",
                "chapter_id": "ch_0001",
                "beat_refs": ["inciting"],
            }
        ],
    }
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "outline.json").write_text(json.dumps(outline, indent=2), encoding="utf-8")


def _write_scene(project_root: Path) -> None:
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text(
        (
            "---\n"
            "id: sc_0001\n"
            "title: Storm Cellar\n"
            "order: 1\n"
            "chapter_id: ch_0001\n"
            "emotion_tag: dread\n"
            "purpose: setup\n"
            "word_target: 900\n"
            "---\n"
            "The cellar hummed with static.\n"
        ),
        encoding="utf-8",
    )


def _write_snapshot(project_root: Path) -> None:
    snapshot_dir = project_root / "history" / "snapshots" / "20240101T000000Z_accept"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    metadata = {
        "snapshot_id": "20240101T000000Z",
        "project_id": "proj_analytics",
        "label": "accept",
        "created_at": "2024-01-01T00:00:00Z",
        "includes": ["drafts", "outline.json", "project.json"],
    }
    (snapshot_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def _write_project_meta(project_root: Path) -> None:
    payload = {
        "budget": {
            "soft": 9.5,
            "hard": 22.0,
            "spent_usd": 1.25,
            "last_generate_response": {
                "draft_id": "dr_cached",
                "budget": {
                    "estimated_usd": 0.45,
                    "status": "ok",
                    "total_after_usd": 1.7,
                },
            },
        }
    }
    (project_root / "project.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def test_summary_includes_runtime_hints(tmp_path: Path) -> None:
    project_id = "proj_analytics"
    project_root = tmp_path / project_id
    _write_outline(project_root)
    _write_scene(project_root)
    _write_snapshot(project_root)
    _write_project_meta(project_root)

    service = AnalyticsSummaryService(
        settings=ServiceSettings(project_base_dir=tmp_path),
        diagnostics=DiagnosticLogger(),
    )
    payload = service.build_summary(project_id)

    runtime_hints = payload["runtime_hints"]
    assert runtime_hints["budget"]["soft_limit_usd"] == DEFAULT_SOFT_BUDGET_LIMIT_USD
    assert runtime_hints["budget"]["hard_limit_usd"] == DEFAULT_HARD_BUDGET_LIMIT_USD
    overrides = runtime_hints["analytics_overrides"]
    assert overrides["emotion_intensity"]["dread"] == pytest.approx(EMOTION_INTENSITY_MAP["dread"])
    assert overrides["pace"]["slow_threshold"] == pytest.approx(PACE_SLOW_THRESHOLD)
    assert overrides["pace"]["fast_threshold"] == pytest.approx(PACE_FAST_THRESHOLD)
    assert payload["analytics_version"] == "1.0"

    overlays = payload["cost_overlays"]
    budget_overlay = overlays["budget"]
    assert budget_overlay["soft_limit_usd"] == pytest.approx(9.5)
    assert budget_overlay["hard_limit_usd"] == pytest.approx(22.0)
    assert budget_overlay["spent_usd"] == pytest.approx(1.25)
    assert budget_overlay["remaining_usd"] == pytest.approx(20.75)
    assert overlays["last_generate"]["draft_id"] == "dr_cached"
    assert overlays["last_generate"]["estimated_usd"] == pytest.approx(0.45)
