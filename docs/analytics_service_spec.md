# Analytics Service Specification

## Goals
- Quantify manuscript pacing, emotional flow, conflict coverage, and revision activity to support UI charts called out in phase P9.
- Provide a documented contract that renderer components can consume without reverse-engineering implementation details.

## Inputs
- **Outline artifact**: `outline.json` (OutlineSchema v1). Acts supply ordering; chapters supply groupings; scenes provide IDs, titles, beat references.
- **Scene drafts**: Markdown with YAML front matter captured under `drafts/`. Emotion tags, purposes, beats, word targets, and revision timestamps are derived from the latest front matter/body.
- **Revision history**: Snapshot metadata in `history/snapshots/` plus critique / accept logs for streak calculations.
- Optional **runtime hints**: Budget limits (for cost overlays) and analytics overrides from `runtime.yaml`.

## Metrics
- **Emotion arc**: For each scene order position, derive emotion intensity from `scene.emotion_tag` (fallback to default intensity). Output normalized float precision 2 decimals.
- **Pacing graph**: Compute per-scene word counts (`extractSceneBody`) and beats; emit average, median, standard deviation, `words_per_beat`, and pace label:
  - slow if `word_count >= avg * slow_threshold`
  - fast if `word_count <= avg * fast_threshold`
  - otherwise steady.
- **Conflict heatmap**: Flag scenes with non-empty conflict metadata; aggregate per chapter. Intensity equals normalized conflict word count (min 0, max 1). Include summary string samples.
- **Scene length analysis**: Histogram buckets (customizable) summarizing word count distribution and detection of outliers (> 2 std dev above/below average).
- **Revision streak tracker**: Traverse snapshots in chronological order; track consecutive accepts per project/day, include streak resets on critique without accept, and timestamps for UI badges.

## Outputs
- JSON envelope keyed by `analytics_version` (initial `1.0`) containing:
  - `emotion_arc`: ordered array of `{scene_id, order, title, emotion_tag, intensity}`.
  - `pacing`: aggregate object `{average_word_count, median_word_count, standard_deviation_word_count, scene_metrics:[...]}`.
  - `conflict_heatmap`: chapters array `{chapter_id, title, intensity, scenes:[{scene_id, order, conflict_present, intensity, conflict_summary}]}`.
  - `length_distribution`: buckets array `{label, lower_bound, upper_bound, scene_ids}` plus outlier lists.
  - `revision_streaks`: `{current_streak, longest_streak, current_start, last_reset, events:[{snapshot_id, type, timestamp}]}`.
- All numeric fields should be rounded to two decimal places unless integral.
- Response served from `/api/v1/analytics/summary` (GET) with query `project_id`. Payload must include a `trace_id` header for diagnostics.

## Processing Pipeline
1. Resolve project root (`ServiceSettings.project_base_dir / project_id`); validate access.
2. Load outline and drafts; normalize front matter with existing helpers (`read_scene_document`, `normalize_markdown`).
3. Derive metrics using utility module (`blackskies.services.analytics`) extended to cover new requirements.
4. Cache last computed payload alongside fingerprint of inputs (outline hash, draft checksums) to avoid redundant recomputation.
5. Emit diagnostics on missing data (e.g., scenes without drafts) using `DiagnosticLogger`.

## Integration Points
- Renderer requests summary on project load and after draft accept / critique operations.
- Budget meter can overlay `revision_streaks.current_streak` for gamification.
- Analytics pane consumes `emotion_arc`, `pacing.scene_metrics`, conflict heatmap, and histogram to render the charts referenced in P9.
- Future exporters can persist the JSON under `analytics_report.json` (existing behavior) while aligning format to this contract.
