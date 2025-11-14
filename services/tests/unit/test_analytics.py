"""Unit tests for analytics helpers."""

from __future__ import annotations

import pytest

from blackskies.services.analytics import (
    AnalyticsPayload,
    ConflictChapter,
    ConflictHeatmap,
    EmotionArcPoint,
    PacingSummary,
    RevisionEvent,
    compute_conflict_heatmap,
    compute_emotion_arc,
    compute_pacing_metrics,
    compute_revision_streaks,
    compute_scene_length_distribution,
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
            "text": ("The cellar stairs were slick with rain water and loose basement soil below."),
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


def test_compute_emotion_arc_orders_and_defaults(
    outline_payload: dict, draft_units: list[dict]
) -> None:
    arc = compute_emotion_arc(outline_payload, draft_units)

    assert [point.scene_id for point in arc] == ["sc_0001", "sc_0002", "sc_0003"]
    assert arc[0].intensity == 1.0  # dread maps to the highest intensity
    assert arc[1].intensity == 0.85  # tension uses predefined mapping
    assert arc[2].intensity == 0.5  # missing emotion tag falls back to default


def test_compute_pacing_metrics_handles_missing_beats(
    outline_payload: dict, draft_units: list[dict]
) -> None:
    summary = compute_pacing_metrics(outline_payload, draft_units)

    assert isinstance(summary, PacingSummary)
    assert summary.average_word_count > 0
    scene_metrics = {metric.scene_id: metric for metric in summary.scene_metrics}
    assert scene_metrics["sc_0001"].words_per_beat == pytest.approx(6.5, rel=1e-2)
    assert scene_metrics["sc_0003"].beat_count is None
    assert scene_metrics["sc_0003"].words_per_beat is None
    assert {metric.pace_label for metric in summary.scene_metrics} <= {"fast", "steady", "slow"}


def test_compute_conflict_heatmap_groups_by_chapter(
    outline_payload: dict, draft_units: list[dict]
) -> None:
    heatmap = compute_conflict_heatmap(outline_payload, draft_units)

    assert isinstance(heatmap, ConflictHeatmap)
    assert len(heatmap.chapters) == 2
    first_chapter = heatmap.chapters[0]
    assert isinstance(first_chapter, ConflictChapter)
    assert first_chapter.chapter_id == "ch_0001"
    assert {scene.scene_id for scene in first_chapter.scenes} == {"sc_0001", "sc_0002"}
    assert first_chapter.intensity == pytest.approx(0.5, rel=1e-3)


def test_generate_analytics_payload_composes_metrics(
    outline_payload: dict, draft_units: list[dict]
) -> None:
    events = [
        RevisionEvent(snapshot_id="20230101T000000Z", type="accept", timestamp="2023-01-01T00:00:00Z"),
        RevisionEvent(snapshot_id="20230102T000000Z", type="feedback", timestamp="2023-01-02T00:00:00Z"),
    ]
    payload = generate_analytics_payload(
        outline=outline_payload,
        draft_units=draft_units,
        revision_events=events,
    )

    assert isinstance(payload, AnalyticsPayload)
    assert all(isinstance(point, EmotionArcPoint) for point in payload.emotion_arc)
    assert isinstance(payload.pacing, PacingSummary)
    assert isinstance(payload.conflict_heatmap, ConflictHeatmap)
    assert payload.scene_length_distribution.buckets
    assert payload.revision_streaks.longest_streak >= 1


def test_empty_outline_returns_empty_metrics() -> None:
    empty_outline = {"chapters": [], "scenes": []}
    payload = generate_analytics_payload(outline=empty_outline, draft_units=[])

    assert payload.emotion_arc == []
    assert payload.pacing.average_word_count == 0.0
    assert payload.pacing.scene_metrics == []
    assert payload.conflict_heatmap.chapters == []
    assert payload.scene_length_distribution.buckets == []
    assert payload.revision_streaks.current_streak == 0


def test_scene_length_distribution_detects_outliers(outline_payload: dict, draft_units: list[dict]) -> None:
    summary = compute_pacing_metrics(outline_payload, draft_units)
    distribution = compute_scene_length_distribution(summary.scene_metrics)

    assert distribution.buckets
    assert "above" in distribution.outliers
    assert "below" in distribution.outliers


def test_compute_revision_streaks_tracks_resets() -> None:
    events = [
        RevisionEvent(snapshot_id="s1", type="accept", timestamp="2023-05-01T00:00:00Z"),
        RevisionEvent(snapshot_id="s2", type="accept", timestamp="2023-05-02T00:00:00Z"),
        RevisionEvent(snapshot_id="s3", type="feedback", timestamp="2023-05-03T00:00:00Z"),
        RevisionEvent(snapshot_id="s4", type="accept", timestamp="2023-05-04T00:00:00Z"),
    ]

    streaks = compute_revision_streaks(events)

    assert streaks.current_streak == 1
    assert streaks.longest_streak == 2
    assert streaks.last_reset == "2023-05-03T00:00:00Z"
