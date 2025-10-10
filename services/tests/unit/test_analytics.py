"""Unit tests for analytics helpers."""

from __future__ import annotations

import pytest

from blackskies.services.analytics import (
    AnalyticsPayload,
    ConflictChapter,
    ConflictHeatmap,
    EmotionArcPoint,
    PacingSummary,
    compute_conflict_heatmap,
    compute_emotion_arc,
    compute_pacing_metrics,
    generate_analytics_payload,
)


@pytest.fixture()
def outline_payload() -> dict:
    return {
        "chapters": [
            {"id": "ch_0001", "order": 1, "title": "Arrival"},
            {"id": "ch_0002", "order": 2, "title": "Departure"},
        ],
        "scenes": [
            {
                "id": "sc_0001",
                "order": 1,
                "title": "Storm Cellar",
                "chapter_id": "ch_0001",
                "beat_refs": ["inciting", "doorway"],
            },
            {
                "id": "sc_0002",
                "order": 2,
                "title": "Rising Waters",
                "chapter_id": "ch_0001",
                "beat_refs": ["escalation"],
            },
            {
                "id": "sc_0003",
                "order": 3,
                "title": "Long Night",
                "chapter_id": "ch_0002",
                "beat_refs": [],
            },
        ],
    }


@pytest.fixture()
def draft_units() -> list[dict]:
    return [
        {
            "id": "sc_0001",
            "title": "Storm Cellar",
            "text": (
                "The cellar stairs were slick with rain water and loose basement soil below."
            ),
            "meta": {
                "emotion_tag": "dread",
                "conflict": "Rising flood threatens supplies",
            },
        },
        {
            "id": "sc_0002",
            "title": "Rising Waters",
            "text": (
                "They bailed in shifts until the buckets became too heavy to lift. "
                "Neighbors shouted from the levee, urging them to run."
            ),
            "meta": {
                "emotion_tag": "tension",
                "conflict": "Neighbors argue about abandoning the levee",
            },
        },
        {
            "id": "sc_0003",
            "title": "Long Night",
            "text": "They waited in the dark, counting breaths.",
            "meta": {
                "emotion_tag": None,
                "conflict": "",
            },
        },
    ]


def test_compute_emotion_arc_orders_and_defaults(outline_payload: dict, draft_units: list[dict]) -> None:
    arc = compute_emotion_arc(outline_payload, draft_units)

    assert [point.scene_id for point in arc] == ["sc_0001", "sc_0002", "sc_0003"]
    assert arc[0].intensity == 1.0  # dread maps to the highest intensity
    assert arc[1].intensity == 0.85  # tension uses predefined mapping
    assert arc[2].intensity == 0.5  # missing emotion tag falls back to default


def test_compute_pacing_metrics_handles_missing_beats(outline_payload: dict, draft_units: list[dict]) -> None:
    summary = compute_pacing_metrics(outline_payload, draft_units)

    assert isinstance(summary, PacingSummary)
    assert summary.average_word_count > 0
    scene_metrics = {metric.scene_id: metric for metric in summary.scene_metrics}
    assert scene_metrics["sc_0001"].words_per_beat == pytest.approx(6.5, rel=1e-2)
    assert scene_metrics["sc_0003"].beat_count is None
    assert scene_metrics["sc_0003"].words_per_beat is None
    assert {metric.pace_label for metric in summary.scene_metrics} <= {"fast", "steady", "slow"}


def test_compute_conflict_heatmap_groups_by_chapter(outline_payload: dict, draft_units: list[dict]) -> None:
    heatmap = compute_conflict_heatmap(outline_payload, draft_units)

    assert isinstance(heatmap, ConflictHeatmap)
    assert len(heatmap.chapters) == 2
    first_chapter = heatmap.chapters[0]
    assert isinstance(first_chapter, ConflictChapter)
    assert first_chapter.chapter_id == "ch_0001"
    assert {scene.scene_id for scene in first_chapter.scenes} == {"sc_0001", "sc_0002"}
    assert first_chapter.intensity == pytest.approx(0.5, rel=1e-3)


def test_generate_analytics_payload_composes_metrics(outline_payload: dict, draft_units: list[dict]) -> None:
    payload = generate_analytics_payload(outline=outline_payload, draft_units=draft_units)

    assert isinstance(payload, AnalyticsPayload)
    assert all(isinstance(point, EmotionArcPoint) for point in payload.emotion_arc)
    assert isinstance(payload.pacing, PacingSummary)
    assert isinstance(payload.conflict_heatmap, ConflictHeatmap)


def test_empty_outline_returns_empty_metrics() -> None:
    empty_outline = {"chapters": [], "scenes": []}
    payload = generate_analytics_payload(outline=empty_outline, draft_units=[])

    assert payload.emotion_arc == []
    assert payload.pacing.average_word_count == 0.0
    assert payload.pacing.scene_metrics == []
    assert payload.conflict_heatmap.chapters == []
