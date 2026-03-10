# Phase 6 Tracker

## Bucket 1 — Analytics Service Skeleton (Backend)

- [x] Create `analytics_stub.py` with `get_project_summary` and `get_scene_metrics`.
- [x] Add `routers/analytics.py` endpoints that call the stub helpers.
- [x] Wire the router into `api_v1` (already included and now returns stub data).
- [x] Add `services/tests/test_analytics_endpoints.py` covering summary and scenes.
- [x] Document the new endpoints/payloads below.

### Notes:
Endpoints `/api/v1/analytics/summary` and `/api/v1/analytics/scenes` now return minimal JSON tagged with `projectId`, `projectPath`, and stub metrics such as `scenes`, `wordCount`, and `avgReadability`. These responses use the injected `ServiceSettings` to echo the project directory even though no actual analytics are computed yet.

## Bucket 2 — Metric Computation Pipeline

- [x] Evolve `analytics_stub.py` into metric helpers reading outline + drafts.
- [x] Ensure `/api/v1/analytics/summary` reports true scene counts, word counts, and avg readability.
- [x] Ensure `/api/v1/analytics/scenes` returns scene entries with wordCount, readability, and density ratios.
- [x] Add `services/tests/test_analytics_metrics.py` covering ratios, counts, and readability.
- [x] Grow endpoint tests to verify non-zero metrics for seeded projects.

### Notes:
Scene metrics now include `sceneId`, `index`, `title`, `wordCount`, `readability`, and `density` ratios for dialogue vs narration using quote heuristics. Readability is words per sentence, and density ratios sum to ~1 even when a scene has mixed narration/dialogue.

## Bucket 3 ― Dashboard Pane (Renderer Shell)

- [x] Add analytics bridge methods for summary and scenes.
- [x] Create `AnalyticsDashboard` component fetching summary + scenes and displaying tabular data.
- [x] Wire Story Insights pane (dock) to show dashboard for the active project.
- [x] Add renderer test ensuring summary and scenes render via mocked bridge.

### Notes:
`AnalyticsDashboard` lives at `app/renderer/components/AnalyticsDashboard.tsx`, calls `getAnalyticsSummary`/`getAnalyticsScenes`, and renders summary rows plus a simple scene grid. The pane is opened via the Story Insights dock tab (layout ID `analytics`) and falls back to a notice when no project is loaded.

## Bucket 4 ― Emotion Graph & Pacing Heatmap

- [x] Define emotionScore/pacingScore heuristics based on the scene metrics (dialogue/readability/word count).
- [x] Add an emotion graph (simple SVG polyline) to `AnalyticsDashboard`.
- [x] Add a pacing strip (per-scene block opacity) to visualize density/length.
- [x] Add renderer assertions via data-testids for the graph and pacing strip.

### Notes:
EmotionScore blends dialogueRatio plus normalized readability; pacingScore is derived from 1 - normalized wordCount. The graph is rendered in `AnalyticsDashboard` with `data-testid="analytics-emotion-graph"` and the pacing strip uses `data-testid="analytics-pacing-strip"` (one span per scene). Both visuals live above the scene table and reuse the existing metrics without backend changes.

## Bucket 5 ― Corkboard (Scene Cards)

- [x] Design UX for a static scene card grid.
- [x] Display metadata (sceneId, title, index, wordCount, readability, dialogueRatio).
- [x] Ensure layout honors outline order and matches dashboard style.
- [x] Keep interactions minimal for this pass.

### Notes:
Corkboard cards live at `app/renderer/components/Corkboard.tsx`, rendering scene metadata after calling `getAnalyticsScenes`. Each card uses `data-testid="corkboard-card"` and fits into the `.corkboard__grid` layout with headers and metadata values.

## Bucket 6 – Insights Integration & Offline Behavior

- [x] Wire story insights data into the Insights panel.
- [x] Confirm story insights work when services are offline.
- [x] Add tests that cover offline fallbacks.

### Notes:
- The Insights panel gained a “Local story insights” section that calls `getAnalyticsSummary`/`getAnalyticsScenes`, surfaces scenes/word counts, and gracefully reports offline service status. The block ships with `data-testid="insights-analytics-summary"` for the summary and `data-testid="insights-analytics-scenes"` for the scene grid, ensuring the offline notice still renders without hiding the rest of Insights.
- C4.2 Snapshot/Verification UI polish completed: the View Report toast now sticks until dismissed, only the action button opens the modal, and the modal renders locally-loaded history snapshot metadata/manifest summaries with dark-theme emphasis and offline-resilient fallback scanning.

## Bucket 7 — Stretch: Relationship Graph

- [x] Prototype relationship graph view (optional).
- [x] Decide shipping status (Phase 6 vs later).
- [x] Document limitations or stretch goals.

### Notes:
Exposed `/api/v1/analytics/relationships` returning `nodes` and `edges`. The renderer now renders `RelationshipGraph` (`app/renderer/components/RelationshipGraph.tsx`) in the dock layout ID `relationships`, showcasing character and scene nodes plus “appearsIn” connections. Tests rely on `data-testid="relationship-graph"`, `relationship-node`, and `relationship-edge`, ensuring the minimal relationship map renders reliably.

## Bucket 8 ― Passoff & Archive

- [x] Create `docs/phases/phase6_passoff.json`.
- [ ] Move `work/phase6` artifacts into `archive/phase6`.
- [ ] Leave a placeholder `work/phase6/README.md`.

### Notes:
- Phase 6 passoff JSON now lives at `docs/phases/phase6_passoff.json` and records analytics summaries, renderer surfaces, tests, and deferred work.
- `archive/phase6/README.md` exists to mirror the future archive location; the actual move of `work/phase6/` will happen after Bucket 9 completes (see refinement notes).
**C5-1 Progress:** Sentence/token utilities (C5-1A) implemented; readability metric (C5-1B), dialogue/narration ratios (C5-1C), structural pacing (C5-1D), analytics endpoints (C5-1E), and Insights UI/tooltips (C5-1F) now deliver the enriched payloads; C5-1G documents & tracker updates are complete.

C5-1G: Docs + tracker update completed ✅

## Bucket 9 – Story Insights Refinement & QA (End-of-Phase Pass)

**Goal:** Run a focused polish pass on all Phase 6 Story Insights features once Buckets 1–8 are functionally complete.

- [ ] Revisit metric heuristics:
  - Tune readability (move beyond simple words-per-sentence if needed).
  - Rebalance emotionScore weights (dialogue vs readability vs any future signals).
  - Revisit pacingScore definition to better match real "fast vs slow" feel.
- [x] Validate performance and caching:
  - Scene-level caching under `history/analytics/` now memoizes metrics using scene-id + content hashes.
  - Added a Refresh Analytics control that triggers the `force_refresh` query and updates caches on demand.
  - Renderer surfaces cached summaries before hitting the service to keep Story Insights responsive.
- [x] Strengthen tests:
  - Expand Story Insights dashboard tests for edge cases (no scenes, large scene counts).
  - Lock regression coverage for corkboard jitter, relationship graph empty states, hidden pane policy, valid endpoints, and error banner behavior.
  - Add regression tests around metrics for representative sample projects.
- [x] UX & accessibility tweaks:
  - Confirm graphs and tables remain usable at common resolutions.
  - Check keyboard navigation and basic accessibility affordances.
  - Adjust labels/tooltips so metrics and graphs are understandable to writers.
- [x] Offline/online behavior audit:
  - Cached scene metrics now populate the dashboard and corkboard whenever the FastAPI bridge is unreachable.
  - Offline messaging reads "Analytics service offline — using cached metrics" while `/analytics/*` calls are suppressed.

### Notes:
- C5 Analytics refinement now includes caching, refresh, and offline fallbacks: scene-level caches live under `history/analytics/`, the Refresh Analytics control drives `force_refresh`, and offline Story Insights reuse cached metrics with the new banner message instead of hitting `/analytics/*`.

Notes:
- This bucket should run near the end of Phase 6, after Buckets 1–8 are shipping.
- No new features are required; this is a polish and QA pass targeted at Story Insights quality.

## Phase 6 Renderer Regression Repair Plan

- [x] Budget meter override path (ensure stub overrides preload/renderer).
- [x] Dock layout persistence logging (log each saveLayout call).
- [ ] Toast & ribbon flow repair (single View Report, unique toast IDs, instrumentation).
- [ ] Offline status pill + recovery banner (health stub toggles and offline UI).
- [ ] Backup stub/export integrity (stub response ok:true, renderer check).
- [ ] Visual snapshot stabilization (home ready signal and adjusted spec).
- [ ] Full Electron run and tracker update once renderer passes stabilize.

Notes:
- The next wave of work focuses purely on renderer-level fixes to unblock the Phase 6 Electron suite.
- After these steps, rerun the targeted specs and the full electron project to confirm progress before documenting the Phase 6 pass.
### C6 Recovery Plan
- [ ] Stabilize renderer-level regressions that still block `budget-meter.spec.ts` and `dock-workspace.spec.ts` (budget propagation after critiques, layout save logging, floating panes).
- [ ] Re-run the focused Electron specs (`gui-contract.spec.ts`, `gui.analytics_offline_cache_flow.spec.ts`) once the renderer fixes are in place, followed by the full Electron suite.

## Done Log

- YYYY-MM-DD — [x] Created `docs/phases/phase6_passoff.json` as part of Phase 6 passoff preparations.
- YYYY-MM-DD — [ ] Phase 6 Story Insights refinement pass (run after Buckets 1–8).
- 2025-11-25 — [x] Wrote history/analytics caching, Refresh Analytics action, and offline-only fallbacks for Story Insights (C5-2 polish).
- 2025-11-20 — [x] Added Story Insights regression tests (error banners, hidden panes, valid endpoints, corkboard/graph stability).
- 2025-11-20 — [x] Synced passoff JSON, QA notes, and Story Insights naming across docs.
- 2025-11-27 — [x] Applied the C5-3 regression patch so floating windows inherit projectPath and panels fall back safely when that metadata is missing.
- 2025-11-26 — [x] Ensured AnalyticsDashboard gets a sanitized projectPath and shows a placeholder when the path is missing.
