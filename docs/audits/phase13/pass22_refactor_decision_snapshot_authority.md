# Phase 13 Pass 22 - Refactor Decision Pass

## Goal
Decide what refactors belong now versus Phase 14.

## Decision
No broad refactor belongs in Phase 13.

Tiny helper extraction is allowed only if duplicate authority logic is actively causing drift. In this batch, the safer move was to fix behavior and document the remaining duplication rather than reshaping the architecture.

## Candidate Table

| Candidate | Evidence | Risk | Now/Later/Frozen | Reason | Validation Needed |
| --- | --- | --- | --- | --- | --- |
| Snapshot/report path helper shared by `App.tsx` and `SnapshotsPanel.tsx` | Both surfaces resolve report/reveal/manifest paths | Medium | Later | Duplication exists but is not diverging badly enough to justify a Phase 13 refactor | Phase 14 review if path logic drifts again |
| Shared verification label formatter | Status text appears in both panel and modal flows | Low | Later | Current text is stable after test hardening | Only if a future copy change creates divergence |
| Shared missing-path toast builder | Reveal/report failures use related renderer feedback | Low | Frozen | Existing helper behavior is already clear enough for Phase 13 | None unless error copy starts drifting |
| Row selector normalization for snapshot controls | Playwright needed row-level scoping changes | Low | Frozen | This is a test selector issue, not a runtime architecture issue | None |
| Backend report-state harmonization across renderer and services | Report persistence is now proven but still split across layers | Medium | Later | It works, but the boundary is still multi-layered | Phase 14 if the layers diverge again |

## Validation
- The batch stayed focused on authority proof and did not introduce new architecture.
- The current fixes are behavior-first; broader cleanup is deferred.

