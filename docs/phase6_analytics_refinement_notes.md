Phase 6 Story Insights (Buckets 1–4) currently deliver a working dashboard with locally computed metrics, but the C5 refinement pass must harden the heuristics, caching, and offline behavior before C7/C8 human verification closes.

## C5-1 Sub-Plan (Detailed Breakdown)

This plan defines the actionable subtasks that must be completed for Phase 6 Bucket 9’s C5 analytics refinement. Check off each box as the corresponding implementation is verified.

### C5-1A — Sentence + Token Utilities (Backend only)
- [x] Create or extend utilities for sentence splitting, word tokenizing, long-sentence detection, type-token ratio (TTR), quote-span extraction, and character/token counting.
- [ ] Keep these helpers backend-only (no metrics, endpoints, or UI yet).

### C5-1B — Readability Metric (Backend)
- [x] Using the C5-1A helpers, compute avg sentence length, percent long sentences (>30 words), TTR, and bucket scenes as Easy / Moderate / Dense.
- [x] Return `{ avg_sentence_len, pct_long_sentences, ttr, bucket }` per scene.
- [x] Integrate the payload into the analytics pipeline for later exposure.

### C5-1C — Dialogue/Narration Metric (Backend)
- [x] Extract strict quote spans for dialogue while treating script cues, thoughts, and all other content as narration.
- [x] Compute character/token totals so DialogueRatio + NarrationRatio ≈ 1.0.
- [x] Attach the ratios to each scene analytics entry.

### C5-1D — Pacing Metric (Backend)
- [x] Derive structural pacing from scene length and dialogue ratio.
- [x] Assign Slow / Neutral / Fast buckets based on normalized thresholds.
- [x] Surface both raw pacing metrics and the bucket label downstream.
- [x] Ensure the analytics pipeline wires this data through.

### C5-1E — Analytics Endpoint Wiring
- [x] Update `/analytics/summary` and `/analytics/scenes` to include readability, dialogue_ratio, narration_ratio, pacing_bucket, and raw metrics.
- [x] Guard against invalid or missing data.

### C5-1F — Insights UI Integration (Renderer)
- [x] Show the new metrics in the Insights panel with tooltips exposing raw numbers.
- [x] Add a color-coded Slow/Neutral/Fast pacing strip.
- [x] Refresh scene cards and graphs to highlight the enhanced data.
- [x] Provide fallbacks for empty/missing payloads.

### C5-1G — Docs & Tracker
- [x] Update `work/phase6/phase6_tracker.md` and `docs/phase6_analytics_refinement_notes.md` with this plan and progress comments.
- [x] Capture any additional developer notes for the Insights docs.
- [x] Log completion in the phase tracker/passoff notes.

**Summary:** All C5-1 backend + renderer analytics tasks are implemented, documented, and tracked; C5-2 caching/performance plus offline refinements are now live (history/analytics caches, Refresh Analytics, and cache-only offline handling).

## Composite readability metric (C5)
- Use average sentence length as the foundation plus the percentage of sentences longer than 30 words to surface run-on prose.
- Track vocabulary diversity via a type–token ratio computed over the scene body; higher ratios should favor the “Easy” bucket and lower ratios push toward “Dense.”
- Emit an Easy / Moderate / Dense bucket label per scene in `/analytics/summary` and `/analytics/scenes` so the renderer can badge rows and tooltips with the derived score along with the base metrics.
- Combine these signals into the existing “avgReadability” field while clearly documenting each component in the payload schema so downstream consumers know how the bucket was chosen.

## Dialogue vs Narration split (C5)
- Define dialogue as strict quoted spans only (`"…"`, `'…'`); nested quotes and unquoted thoughts count as narration.
- Script-style cues (`NAME:` or `SCENE:`) are treated entirely as narration even if they appear near speeches.
- Internalized thoughts (italics, bracketed aside, or leading with “thoughts:” tokens) aggregate into narration for ratio calculation.
- Compute ratios by characters/tokens so DialogueRatio + NarrationRatio ≈ 1.0 and report both as part of each scene payload.
- Maintain the existing quote heuristics for now but ensure the renderer can trust that the ratio bucket sums to ~1 even when fallback logic triggers.

## Pacing buckets & graph (C5)
- Derive pacing strictly from the scene’s structural footprint: word count (scene length) and the dialogue ratio above.
- Bucket each scene into Slow / Neutral / Fast based on normalized word count thresholds and how far dialogueRatio deviates from a configured median.
- The emotion graph/pacing strip should expose those buckets, and tooltips must reveal the raw length and dialogue metrics so writers understand why a scene is labeled Slow/Neutral/Fast.
- Retain the SVG polyline plus strip layout but annotate each node with the bucket label instead of a single pacingScore scalar.

## Caching & performance (C5)
- Persist analytics cache artifacts under `history/analytics/{scene_id}.json` per project; each file stores the computed metrics plus a `content_hash` of the scene/draft text that produced them.
- Scene-level computations reuse cached metrics whenever the incoming hash matches, only recomputing when drafts change or a refresh is forced.
- A Refresh Analytics control in the Story Insights dock hits the endpoints with `force_refresh=true`, recomputes the metrics, rewrites the cache, and updates the UI.
- Story Insights components (dashboard, corkboard, CompanionOverlay) read cached metrics before making `/analytics/*` calls so large projects stay responsive.

## Offline behavior (C5)
- “Backend unreachable” means the FastAPI analytics service (bridge) is down; it should not be conflated with missing API keys or feature flags.
- When the bridge is offline, reuse the offline banner text/style “Analytics service offline — using cached metrics.” The banner stays sticky, prompts manual retries, and switches the dashboard/corkboard/Insights block to render cached payloads instead.
- In offline mode, the renderer skips all `/analytics/*` HTTP calls, relying on the `history/analytics` cache or gracefull fallbacks in `CompanionOverlay` before surfacing the banner.
- Ensure the Story Insights panel still renders summary rows, graphs, pacing strips, and corkboard cards using cached data even though the API layer is unavailable.

This note should remind future work to polish the heuristics, caching, and offline behavior before advancing to dashboards/corkboard pixels.

### Tuning cues for emotion/pacing visuals
- Emotion arc: revisit weight of dialogueRatio vs readability; consider smoothing consecutive points to reduce visual jitter.
- Pacing strip: clamp opacity gradients to avoid banding on long scene runs; review normalization strategy when the longest scene is an outlier.

### Visual spacing guidelines
- Maintain consistent `16px` vertical rhythm between header, graph, pacing strip, and tables.
- Keep corkboard card gutters aligned with dashboard grid padding; avoid cramped labels on dense scene sets.
- Relationship Graph columns should retain equal padding and a small gap above the empty/connection states to prevent layout jumps.

### Renamed UI sections
- “Analytics Dashboard” → “Story Insights Dashboard”
- “Analytics” pane/tab → “Story Insights”
- Error messaging updated to “Story Insights bridge unavailable” across dashboard, corkboard, and relationship graph.
