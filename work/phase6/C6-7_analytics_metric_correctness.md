# C6-7 — New Playwright E2E Test:
# gui.analytics_metric_correctness.spec.ts

## Goal
Validate Phase-6 analytics metrics render:
- Readability bucket (Easy/Moderate/Dense)
- Dialogue/Narration ratio
- Pacing bucket (Slow/Neutral/Fast)
- Pacing strip

## Read Before Coding
- `app/tests/e2e/gui.insights.spec.ts`
- `app/renderer/components/AnalyticsDashboard.tsx`
- `docs/phase6_analytics_refinement_notes.md`

## Instructions
1. Create `app/tests/e2e/gui.analytics_metric_correctness.spec.ts`.
2. Bootstrap with `_bootstrap.ts`, load `sample_project/Esther_Estate`, wait for dock workspace.
3. Open Story Insights panel via toolbar action.
4. Assert readability badge (`Easy|Moderate|Dense`), dialogue/narration labels, pacing bucket text, and pacing strip element exist.
5. Ensure no React errors occur and the panel is fully rendered.
6. Report: "Created gui.analytics_metric_correctness.spec.ts — validates visibility of all analytics metrics."
