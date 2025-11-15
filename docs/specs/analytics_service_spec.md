# Analytics Service Specification
> **Status:** Draft
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Spec Index:** For architecture, see `./architecture.md`; for data schemas, see `./data_model.md`; for endpoints, see `./endpoints.md`.

## Goals
- Quantify pacing, emotional flow, rubric coverage, and character relationships so every analytics surface (Story insights, Project Health, the Visuals Layer) reuses the same backend truth.
- Provide a documented contract so renderer prefabs can render timelines, heatmaps, and graphs without reverse-engineering service internals.

> **Phase 8 status:** The analytics service is documented here for Phase 9 planning, but the service and its endpoints are disabled in Phase 8 builds.

## Bookend 2 – Visuals Layer
The Visuals Layer preset (left: Visuals, center: Draft Board, right: Critique + History) renders the Emotion & Pacing Timeline, Critique Trendline, Relationship Graph, and Coverage Heatmap. Each visualization reads from this service and the cached analytics files the service writes (`analytics/scene_metrics.json`, `analytics/critique_scores.json`, `analytics/graph.json`).

## Inputs
- **Outline artifact**: `outline.json` (OutlineSchema v1) for scene order, chapter grouping, and beat references.
- **Scene drafts**: Markdown with YAML front matter stored under `/drafts/`; emotion tags, purposes, beats, word targets, and revision stamps are normalized via shared helpers.
- **Revision history**: Snapshots in `history/snapshots/` plus accept/log events feed the streak tracker and critique trendline.
- **Analytics cache files**: `analytics/scene_metrics.json`, `analytics/critique_scores.json`, and `analytics/graph.json` store the last payload to accelerate UI loads and partial refreshes.
- **Runtime hints**: Budget overrides and pacing thresholds from `runtime.yaml` for tunable overlays.

## Metrics
- **Emotion arc timeline**: Derive intensity per scene by mapping `scene.emotion_tag` to normalized floats; fall back to default intensities when missing. Output includes `scene_id`, `order`, `title`, and `intensity`.
- **Adaptive pacing graph**: Compute word counts (`extract_scene_body`), beats, and `words_per_beat`. Emit aggregates (`average`, `median`, `stddev`) plus a pace label (`slow`, `steady`, `fast`).
- **Critique trendline**: Track rubric note counts, edit counts, and accept rates per scene using `analytics/critique_scores.json`; produce rolling averages for the timeline UI and highlight scenes that spike.
- **Coverage heatmap**: Combine rubric completeness, pacing balance, and emotional breadth to create chapter/scene intensities; scenes that miss rubric nodes or have lopsided pacing flag lower coverage.
- **Character relationship graph**: Build nodes/edges using co-occurrence within scenes and beats. Node metadata includes appearance counts, last seen, and emotion_tone; edges track co-occurrence weight and last shared scene.
- **Scene rubric scoring**: Score each scene for rubric categories (clarity, stakes, progression, etc.) and feed those values into `critique_scores.json` for the Critique Pane badges.
- **Analytics-derived nodal metrics**: Character presence, emotion variance, and pace adherence per scene feed heatmap tinting and graph edge strength.

## Outputs
- Payload delivered via `/api/v1/analytics/summary`. Envelope includes arrays/objects:
  - `emotion_arc`, `pacing`, `conflict_heatmap`, `scene_length_distribution` (histogram + outliers).
  - `note_coverage`: per-scene rubric scores plus `notes_count`, `edits_count`, `accept_rate`.
  - `graph`: nodes/edges for the Relationship Graph.
  - `revision_streaks`: `{current_streak, longest_streak, events}`.
  - `cost_overlays`: budget + last generate info (used for meter overlays).
  - `runtime_hints`: optional overrides for intensity/pace thresholds.
  - `trace_id`: echoed header for diagnostics.
- Numeric values are rounded to two decimal places unless integral.
- Payloads also stored as `analytics/scene_metrics.json`, `analytics/critique_scores.json`, and `analytics/graph.json` with SHA-256 checksums for export/backup.

## Data Storage & Artifacts
- `/analytics/scene_metrics.json`: per-scene pacing/emotion metrics plus timestamps.
- `/analytics/critique_scores.json`: rubric note counts, acceptance markers, and deduped note IDs.
- `/analytics/graph.json`: character nodes/edges with metadata.
- `analytics_report.json` (export) mirrors this schema for downstream consumers.
- All files include schema version tags and `project_id` metadata for tracing.

## Processing Pipeline
1. Resolve the project root (`ServiceSettings.project_base_dir / project_id`); validate access.
2. Load outline/drafts, normalize front matter, parse beats, and note emotion tags.
3. Derive metrics via `blackskies.services.analytics` (pacing, rubric scoring, graph builder, conflict heatmap).
4. Write JSON payloads to cache file plus the standard HTTP response; emit diagnostics on missing drafts/outline nodes.
5. Cache fingerprints (outline hash + draft checksums) under `.blackskies/cache/analytics_summary.json` to skip redundant recomputes.

## Integration Points
- Renderer requests `/api/v1/analytics/summary` on project load and after critique acceptance.
- Visuals Layer playlists call `/analytics/scene_metrics.json`, `/analytics/critique_scores.json`, and `/analytics/graph.json` to populate heatmaps, trendlines, and graphs.
- Budget meter overlays `revision_streaks.current_streak`; conflict heatmap backs the Project Health dashboard.
- Exporters persist `analytics_report.json` and include SHA-256 checksums in `/exports/checksums.txt`.

## Analytics Endpoints
- `POST /api/v1/analytics/build` — enqueues a full rebuild; response `{job_id, status:"queued"}` and emitted when new drafts/objective changes occur.
- `POST /api/v1/analytics/refresh` — forces recomputation of cache files and returns `{status:"ok", refreshed:true}`; typically used after bulk imports or plugin actions.
- `GET /api/v1/analytics/scene/{scene_id}` — fetch scene-level metrics and rubric detail for the Visuals Layer hover cards.
- `GET /api/v1/analytics/graph` — return relationship graph nodes/edges for Relationship Graph visualizations.
- All analytics endpoints require the active project context and respect Model Router budgets when they indirectly trigger fresh metrics.

## Analytics & Telemetry Index

- [`docs/phases/phase9_charter.md`](./phase9_charter.md) – Phase 9 intent, acceptance criteria, and risks that the analytics service must satisfy.
- [`docs/phases/phase9_11_testplan.md`](./phase9_11_testplan.md) – Regression suites, telemetry assertions, and test coverage requirements protecting analytics behaviors.
- [`docs/phases/phase9_companion_loop.md`](./phase9_companion_loop.md) – Companion automation controls that surface analytics data through the Critique Pane.
- [`docs/phases/dashboard_initiatives.md`](./dashboard_initiatives.md) – Dashboard deliverables (Project Health, Outline validation, multi-project launcher) that consume these metrics.
- [`docs/specs/performance_telemetry_policy.md`](./performance_telemetry_policy.md) – Telemetry targets, collection rules, and red lines that keep analytics metrics compliant.
- [`docs/ops/support_playbook.md`](../ops/support_playbook.md) – Operational runbook for dashboards, analytics health signals, and escalation flows.

## Phase Alignment
- Analytics spec sits ready so Bookend 2 (Visuals Layer, heatmaps) can consume consistent data once Phase 11 exports and automation land.
- Phase 8 does not ship these endpoints; see `./endpoints.md` for the deferred checklist and gating details.
