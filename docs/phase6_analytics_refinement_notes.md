Phase 6 Story Insights (Buckets 1–4) currently deliver a working dashboard with locally computed metrics:

- **Readability** is estimated as words per sentence (avgReadability in `/analytics/summary`).
- **Scene density** tracks dialogueRatio/narrationRatio extracted with quote heuristics.
- **EmotionScore** = 0.6 × dialogueRatio + 0.4 × normalized readability.
- **PacingScore** = 1 - (scene.wordCount / maxWordCount) and drives the pacing strip opacity.

These are intentionally lightweight heuristics. Bucket 9 will revisit:

1. **Metric tuning:** Move beyond words-per-sentence readability, rebalance emotion weights, and re-evaluate pacing formulas when more signals become available.
2. **Performance/caching:** Measure Story Insights latency on large projects, add caching or incremental recompute if needed, and ensure the dashboard stays responsive.
3. **Tests/regression:** Expand the Story Insights dashboard (AnalyticsDashboard) test suite for edge cases (no scenes, many scenes) and add regression fixtures for critical metrics. New coverage now locks error-banner behavior, pane visibility, valid endpoint calls, corkboard stability, and relationship graph empty states.
4. **UX/accessibility:** Audit graph/tables for usability at common resolutions, confirm keyboard navigation, and improve labels/tooltips so metrics are clear to writers.
5. **Offline/online behavior:** Verify the dashboard still loads sensible messaging when services are offline and reuses cached data if fetching fails.

This note should remind future work to polish and QA Story Insights at the end of Phase 6 before advancing to dashboards/corkboard pixels.

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
