"""Analytics helpers for computing emotion, pacing, and conflict metrics."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import logging
from statistics import mean, median, pstdev
from typing import Any, Iterable, Mapping, Sequence

from ..constants import (
    DEFAULT_EMOTION_INTENSITY as CONFIG_DEFAULT_EMOTION_INTENSITY,
    EMOTION_INTENSITY_MAP,
    PACE_FAST_THRESHOLD,
    PACE_SLOW_THRESHOLD,
)

logger = logging.getLogger(__name__)

ANALYTICS_VERSION = "1.0"

EmotionTag = str | None


EMOTION_INTENSITY: Mapping[str, float] = EMOTION_INTENSITY_MAP
DEFAULT_EMOTION_INTENSITY = CONFIG_DEFAULT_EMOTION_INTENSITY


@dataclass(frozen=True)
class EmotionArcPoint:
    """Single point on the emotion arc timeline."""

    scene_id: str
    order: int
    title: str
    emotion_tag: EmotionTag
    intensity: float


@dataclass(frozen=True)
class ScenePacingMetrics:
    """Per-scene pacing statistics."""

    scene_id: str
    order: int
    title: str
    word_count: int
    beat_count: int | None
    words_per_beat: float | None
    pace_label: str


@dataclass(frozen=True)
class PacingSummary:
    """Aggregate pacing metrics for the project."""

    average_word_count: float
    median_word_count: float
    standard_deviation_word_count: float
    scene_metrics: list[ScenePacingMetrics]


@dataclass(frozen=True)
class ConflictScene:
    """Conflict metrics for an individual scene."""

    scene_id: str
    order: int
    title: str
    conflict_present: bool
    intensity: float
    conflict_summary: str | None


@dataclass(frozen=True)
class ConflictChapter:
    """Chapter-level aggregation of conflict intensity."""

    chapter_id: str
    title: str
    intensity: float
    scenes: list[ConflictScene]


@dataclass(frozen=True)
class ConflictHeatmap:
    """Heatmap payload grouping conflict metrics by chapter."""

    chapters: list[ConflictChapter]


@dataclass(frozen=True)
class SceneLengthBucket:
    """Histogram bucket describing scene length distribution."""

    label: str
    lower_bound: int
    upper_bound: int | None
    scene_ids: list[str]


@dataclass(frozen=True)
class SceneLengthDistribution:
    """Scene length distribution and outlier detection."""

    buckets: list[SceneLengthBucket]
    outliers: dict[str, list[str]]


@dataclass(frozen=True)
class RevisionEvent:
    """Individual revision event derived from snapshot history."""

    snapshot_id: str
    type: str
    timestamp: str


@dataclass(frozen=True)
class RevisionStreaks:
    """Revision streak metadata for UI badges."""

    current_streak: int
    longest_streak: int
    current_start: str | None
    last_reset: str | None
    events: list[RevisionEvent]


@dataclass(frozen=True)
class AnalyticsPayload:
    """Composite analytics payload consumed by the UI."""

    analytics_version: str
    emotion_arc: list[EmotionArcPoint]
    pacing: PacingSummary
    conflict_heatmap: ConflictHeatmap
    scene_length_distribution: SceneLengthDistribution
    revision_streaks: RevisionStreaks


def _as_dict(item: Any, key: str, default: Any = None) -> Any:
    if hasattr(item, key):
        return getattr(item, key)
    if isinstance(item, Mapping):
        return item.get(key, default)
    return default


def _normalize_scenes(outline: Mapping[str, Any] | Any) -> list[dict[str, Any]]:
    scenes = _as_dict(outline, "scenes", [])
    normalized: list[dict[str, Any]] = []
    for scene in scenes:
        normalized.append(
            {
                "id": _as_dict(scene, "id"),
                "order": int(_as_dict(scene, "order", 0) or 0),
                "title": _as_dict(scene, "title", ""),
                "chapter_id": _as_dict(scene, "chapter_id"),
                "beat_refs": list(_as_dict(scene, "beat_refs", []) or []),
            }
        )
    normalized.sort(key=lambda value: value["order"])
    return normalized


def _normalize_chapters(outline: Mapping[str, Any] | Any) -> dict[str, dict[str, Any]]:
    chapters = _as_dict(outline, "chapters", [])
    normalized: dict[str, dict[str, Any]] = {}
    for chapter in chapters:
        chapter_id = _as_dict(chapter, "id")
        if not chapter_id:
            continue
        normalized[chapter_id] = {
            "id": chapter_id,
            "order": int(_as_dict(chapter, "order", 0) or 0),
            "title": _as_dict(chapter, "title", ""),
        }
    return normalized


def _normalize_drafts(draft_units: Iterable[Mapping[str, Any] | Any]) -> dict[str, dict[str, Any]]:
    normalized: dict[str, dict[str, Any]] = {}
    for unit in draft_units or []:
        scene_id = _as_dict(unit, "id") or _as_dict(unit, "scene_id") or _as_dict(unit, "unit_id")
        if not scene_id:
            continue
        normalized[scene_id] = {
            "meta": dict(_as_dict(unit, "meta", {}) or {}),
            "text": _as_dict(unit, "text", "") or "",
            "title": _as_dict(unit, "title", ""),
        }
    return normalized


def _resolve_scene_title(scene: Mapping[str, Any], draft: Mapping[str, Any] | None) -> str:
    if draft and draft.get("title"):
        return str(draft["title"])
    title = scene.get("title")
    if title:
        return str(title)
    return scene.get("id", "")


def _word_count(text: str) -> int:
    if not text:
        return 0
    return len([token for token in text.split() if token])


def _conflict_intensity(conflict_text: str | None) -> float:
    if not conflict_text:
        return 0.0
    word_total = _word_count(conflict_text)
    if word_total == 0:
        return 0.0
    scaled = min(word_total / 10.0, 1.0)
    return round(scaled, 3)


def compute_emotion_arc(
    outline: Mapping[str, Any] | Any,
    draft_units: Sequence[Mapping[str, Any] | Any],
) -> list[EmotionArcPoint]:
    """Generate an ordered list of emotion arc points for the outline scenes."""

    scenes = _normalize_scenes(outline)
    drafts = _normalize_drafts(draft_units)

    arc: list[EmotionArcPoint] = []
    for scene in scenes:
        scene_id = scene["id"]
        draft = drafts.get(scene_id)
        meta = draft.get("meta", {}) if draft else {}
        emotion_tag = meta.get("emotion_tag")
        if isinstance(emotion_tag, str):
            intensity = EMOTION_INTENSITY.get(emotion_tag, DEFAULT_EMOTION_INTENSITY)
        else:
            intensity = DEFAULT_EMOTION_INTENSITY
        title = _resolve_scene_title(scene, draft)
        arc.append(
            EmotionArcPoint(
                scene_id=scene_id,
                order=scene["order"],
                title=title,
                emotion_tag=emotion_tag,
                intensity=round(float(intensity), 3),
            )
        )
    return arc


def compute_pacing_metrics(
    outline: Mapping[str, Any] | Any,
    draft_units: Sequence[Mapping[str, Any] | Any],
) -> PacingSummary:
    """Compute pacing metrics derived from scene word counts and beats."""

    scenes = _normalize_scenes(outline)
    drafts = _normalize_drafts(draft_units)

    scene_metrics: list[ScenePacingMetrics] = []
    word_counts: list[int] = []

    for scene in scenes:
        scene_id = scene["id"]
        draft = drafts.get(scene_id)
        raw_text = draft.get("text") if draft else ""
        text = str(raw_text) if raw_text is not None else ""
        words = _word_count(text)
        word_counts.append(words)

        beat_refs = scene.get("beat_refs", [])
        beat_count = len(beat_refs) if beat_refs else None
        words_per_beat: float | None
        if beat_count and beat_count > 0:
            words_per_beat = round(words / beat_count, 2)
        else:
            words_per_beat = None

        pace_label = _classify_pace(words, word_counts_so_far=word_counts)
        title = _resolve_scene_title(scene, draft)
        scene_metrics.append(
            ScenePacingMetrics(
                scene_id=scene_id,
                order=scene["order"],
                title=title,
                word_count=words,
                beat_count=beat_count,
                words_per_beat=words_per_beat,
                pace_label=pace_label,
            )
        )

    average_word_count = float(mean(word_counts)) if word_counts else 0.0
    median_word_count = float(median(word_counts)) if word_counts else 0.0
    if len(word_counts) >= 2:
        try:
            standard_deviation_word_count = float(pstdev(word_counts))
        except Exception:  # pragma: no cover - defensive logging
            logger.exception("Failed to compute pacing standard deviation")
            standard_deviation_word_count = 0.0
    else:
        standard_deviation_word_count = 0.0

    return PacingSummary(
        average_word_count=round(average_word_count, 2),
        median_word_count=round(median_word_count, 2),
        standard_deviation_word_count=round(standard_deviation_word_count, 2),
        scene_metrics=scene_metrics,
    )


def _classify_pace(word_count: int, *, word_counts_so_far: Sequence[int]) -> str:
    if not word_counts_so_far:
        return "steady"
    average = mean(word_counts_so_far)
    if average == 0:
        return "steady"
    if word_count >= average * PACE_SLOW_THRESHOLD:
        return "slow"
    if word_count <= average * PACE_FAST_THRESHOLD:
        return "fast"
    return "steady"


def compute_conflict_heatmap(
    outline: Mapping[str, Any] | Any,
    draft_units: Sequence[Mapping[str, Any] | Any],
) -> ConflictHeatmap:
    """Compute chapter-grouped conflict intensities."""

    scenes = _normalize_scenes(outline)
    chapters = _normalize_chapters(outline)
    drafts = _normalize_drafts(draft_units)

    chapter_entries: dict[str, list[ConflictScene]] = {chapter_id: [] for chapter_id in chapters}

    for scene in scenes:
        chapter_id = scene.get("chapter_id")
        draft = drafts.get(scene["id"])
        meta = draft.get("meta", {}) if draft else {}
        conflict_text = meta.get("conflict")
        intensity = _conflict_intensity(conflict_text)
        conflict_scene = ConflictScene(
            scene_id=scene["id"],
            order=scene["order"],
            title=_resolve_scene_title(scene, draft),
            conflict_present=bool(conflict_text),
            intensity=intensity,
            conflict_summary=conflict_text,
        )
        if chapter_id in chapter_entries:
            chapter_entries[chapter_id].append(conflict_scene)
        else:
            chapter_entries.setdefault(
                chapter_id or "unknown",
                [],
            ).append(conflict_scene)

    chapters_payload: list[ConflictChapter] = []
    for chapter_id, scenes_in_chapter in chapter_entries.items():
        if not scenes_in_chapter:
            continue
        chapter_meta = chapters.get(chapter_id, {"title": ""})
        chapter_intensity = (
            round(mean(scene.intensity for scene in scenes_in_chapter), 3)
            if scenes_in_chapter
            else 0.0
        )
        chapters_payload.append(
            ConflictChapter(
                chapter_id=chapter_id,
                title=chapter_meta.get("title", ""),
                intensity=chapter_intensity,
                scenes=sorted(scenes_in_chapter, key=lambda item: item.order),
            )
        )

    chapters_payload.sort(key=lambda chapter: chapters.get(chapter.chapter_id, {}).get("order", 0))
    return ConflictHeatmap(chapters=chapters_payload)


DEFAULT_LENGTH_BUCKETS: Sequence[tuple[int, int | None]] = (
    (0, 500),
    (500, 1000),
    (1000, 1500),
    (1500, 2000),
    (2000, None),
)


def compute_scene_length_distribution(
    scene_metrics: Sequence[ScenePacingMetrics],
    *,
    buckets: Sequence[tuple[int, int | None]] = DEFAULT_LENGTH_BUCKETS,
) -> SceneLengthDistribution:
    """Create histogram buckets and outlier detection for scene lengths."""

    distribution_buckets: list[SceneLengthBucket] = []
    word_counts = [metric.word_count for metric in scene_metrics]

    if not scene_metrics:
        return SceneLengthDistribution(buckets=[], outliers={"above": [], "below": []})

    def _bucket_label(lower: int, upper: int | None) -> str:
        if upper is None:
            return f"{lower}+"
        return f"{lower}-{upper}"

    bucket_containers: list[list[str]] = [[] for _ in buckets]
    open_bucket: list[str] = []

    for metric in scene_metrics:
        placed = False
        for index, (lower, upper) in enumerate(buckets):
            if (metric.word_count >= lower) and (upper is None or metric.word_count < upper):
                bucket_containers[index].append(metric.scene_id)
                placed = True
                break
        if not placed:
            open_bucket.append(metric.scene_id)

    for (lower, upper), scene_ids in zip(buckets, bucket_containers):
        distribution_buckets.append(
            SceneLengthBucket(
                label=_bucket_label(lower, upper),
                lower_bound=lower,
                upper_bound=upper,
                scene_ids=sorted(scene_ids),
            )
        )

    if open_bucket:
        distribution_buckets.append(
            SceneLengthBucket(
                label=_bucket_label(buckets[-1][1] or buckets[-1][0], None),
                lower_bound=buckets[-1][1] or buckets[-1][0],
                upper_bound=None,
                scene_ids=sorted(open_bucket),
            )
        )

    if not word_counts:
        return SceneLengthDistribution(buckets=distribution_buckets, outliers={"above": [], "below": []})

    mean_value = float(mean(word_counts))
    std_dev = float(pstdev(word_counts)) if len(word_counts) >= 2 else 0.0
    high_threshold = mean_value + (2 * std_dev)
    low_threshold = mean_value - (2 * std_dev)

    above: list[str] = []
    below: list[str] = []
    for metric in scene_metrics:
        if std_dev == 0.0:
            break
        if metric.word_count > high_threshold:
            above.append(metric.scene_id)
        elif metric.word_count < low_threshold:
            below.append(metric.scene_id)

    return SceneLengthDistribution(
        buckets=distribution_buckets,
        outliers={"above": sorted(above), "below": sorted(below)},
    )


def _parse_timestamp(value: str) -> datetime:
    if not value:
        return datetime.fromtimestamp(0, tz=timezone.utc)
    normalized = value.replace("Z", "+00:00") if value.endswith("Z") else value
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        logger.debug("Failed to parse timestamp %s", value)
        return datetime.fromtimestamp(0, tz=timezone.utc)


def compute_revision_streaks(events: Sequence[RevisionEvent]) -> RevisionStreaks:
    """Compute streak metadata from a list of revision events."""

    if not events:
        return RevisionStreaks(
            current_streak=0,
            longest_streak=0,
            current_start=None,
            last_reset=None,
            events=[],
        )

    sorted_events = sorted(events, key=lambda event: _parse_timestamp(event.timestamp))
    current_streak = 0
    longest_streak = 0
    current_start: str | None = None
    last_reset: str | None = None

    for event in sorted_events:
        if event.type == "accept":
            if current_streak == 0:
                current_start = event.timestamp
            current_streak += 1
            if current_streak > longest_streak:
                longest_streak = current_streak
        elif event.type == "feedback":
            if current_streak > 0:
                last_reset = event.timestamp
            current_streak = 0
            current_start = None

    return RevisionStreaks(
        current_streak=current_streak,
        longest_streak=longest_streak,
        current_start=current_start,
        last_reset=last_reset,
        events=list(sorted_events),
    )


def generate_analytics_payload(
    *,
    outline: Mapping[str, Any] | Any,
    draft_units: Sequence[Mapping[str, Any] | Any],
    revision_events: Sequence[RevisionEvent] | None = None,
) -> AnalyticsPayload:
    """Return a composite analytics payload expected by the UI."""

    emotion_arc = compute_emotion_arc(outline, draft_units)
    pacing = compute_pacing_metrics(outline, draft_units)
    conflict_heatmap = compute_conflict_heatmap(outline, draft_units)
    scene_length_distribution = compute_scene_length_distribution(pacing.scene_metrics)
    revision_streaks = compute_revision_streaks(revision_events or [])
    return AnalyticsPayload(
        analytics_version=ANALYTICS_VERSION,
        emotion_arc=emotion_arc,
        pacing=pacing,
        conflict_heatmap=conflict_heatmap,
        scene_length_distribution=scene_length_distribution,
        revision_streaks=revision_streaks,
    )


__all__ = [
    "AnalyticsPayload",
    "SceneLengthDistribution",
    "SceneLengthBucket",
    "RevisionEvent",
    "RevisionStreaks",
    "ConflictChapter",
    "ConflictHeatmap",
    "ConflictScene",
    "EmotionArcPoint",
    "PacingSummary",
    "ScenePacingMetrics",
    "compute_conflict_heatmap",
    "compute_emotion_arc",
    "compute_revision_streaks",
    "compute_pacing_metrics",
    "compute_scene_length_distribution",
    "generate_analytics_payload",
]
