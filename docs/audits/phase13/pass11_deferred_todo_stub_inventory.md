# Phase 13 Pass 11 - Deferred / TODO / Stub / Placeholder Inventory

Status: Completed
Reviewed: 2026-05-09

## Summary

This pass inventories high-signal deferred, TODO, stub, placeholder, mock, legacy, and experimental markers without fixing or deleting any of them.

The search confirms that the repository still contains substantial historical and future-scope language. Most of it is documentation, test fixtures, or explicitly gated experimental/service seams. The blocker risk is not the presence of the markers by itself; the risk is ambiguity around which markers are active engineering debt versus documented future containment.

No runtime, test, workflow, cleanup, deletion, or refactor changes were made for this pass.

## Evidence Inspected

Commands/searches used:

```powershell
rg -n "TODO|FIXME|stub|placeholder|temporary|hack|later|deferred|future|obsolete|legacy|experimental|not implemented|coming soon|mock|fake|bypass|skip" app services scripts tests docs -g '!docs/archive/**' -g '!app/test-results/**' -g '!app/dist/**' -g '!app/temp-trace/**' -g '!services/testtmp-*' -g '!**/node_modules/**'
```

Generated and historical-noise exclusions were applied for:

- `docs/archive/**`
- `app/test-results/**`
- `app/dist/**`
- `app/temp-trace/**`
- `services/testtmp-*`
- `**/node_modules/**`

An earlier broad scan hit access-denied noise under `services/testtmp-*`; that path was excluded from the inventory because this pass does not perform cleanup or generated-file deletion.

## Marker Count Summary

Approximate filtered counts from the Pass 11 search:

| Marker | Count |
| --- | ---: |
| `TODO` | 17 |
| `FIXME` | 0 |
| `stub` | 287 |
| `placeholder` | 140 |
| `temporary` | 32 |
| `hack` | 0 |
| `later` | 104 |
| `deferred` | 458 |
| `future` | 551 |
| `obsolete` | 8 |
| `legacy` | 293 |
| `experimental` | 249 |
| `not implemented` | 4 |
| `coming soon` | 0 |
| `mock` | 640 |
| `fake` | 75 |
| `bypass` | 28 |
| `skip` | 183 |

These counts include docs and tests, so they are a triage signal rather than a direct defect count.

## Item Table

Allowed classifications for this pass:

- implemented
- frozen with review trigger
- merged elsewhere
- obsolete/cancelled
- active follow-up candidate

| File | Line | Marker | Context | Category | Severity | Classification | Recommended placement | Blocker? |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| `app/renderer/DraftEditor.tsx` | 98 | `TODO` | Merge/diff view note near draft editing | Editorial comparison | Medium | active follow-up candidate | Future editorial diff/provenance phase | No |
| `app/renderer/styles/app.css` | 619 | `placeholder` | Split Command placeholder panel styling | Experimental shell | Low | frozen with review trigger | Split Command default-readiness review | No |
| `app/renderer/styles/app.css` | 2179 | `placeholder` | Preflight modal placeholder class comment | CSS naming residue | Low | active follow-up candidate | CSS cleanup pass after Phase 13 | No |
| `app/renderer/components/docking/DockWorkspace.tsx` | 1215 | `placeholder` | Empty dock pane placeholder surface | Docking UX | Informational | implemented | Monitor during docked-layout review | No |
| `app/renderer/components/CompanionOverlay.tsx` | 295 | `placeholder` | Offline/loading placeholder states | Companion/analytics UX | Low | frozen with review trigger | Companion UX polish phase | No |
| `app/renderer/testSetup.ts` | 17 | `stub` | Test storage/service setup stub | Test harness | Informational | implemented | Keep as harness fixture | No |
| `app/tests/e2e/visual.home.spec.ts` | 14 | `skip` | Visual strict mode opt-in | Visual test stability | Medium | frozen with review trigger | Visual test architecture phase | No |
| `app/renderer/testMode/testModeManager.ts` | 3 | `stub` | E2E service source type includes test stub | Test harness | Informational | implemented | Keep as explicit harness seam | No |
| `services/src/blackskies/services/routers/phase4.py` | 1 | `mock` | Legacy Phase 4 critique/rewrite mock endpoints | Legacy service seam | Medium | frozen with review trigger | Legacy route retirement review | No |
| `services/src/blackskies/services/routers/api_v1.py` | 23 | `legacy mock` | Phase 4 endpoints remain opt-in | Legacy service seam | Medium | frozen with review trigger | Legacy route retirement review | No |
| `services/src/blackskies/services/routers/health.py` | 72 | `deferred` | Voice-note counters only surfaced for deferred workflow | Deferred feature containment | Low | frozen with review trigger | Voice workflow phase | No |
| `services/src/blackskies/services/e2e_mode.py` | 98 | `bypass` | Synthetic bypasses disabled in truth lane | Truth/testing boundary | Medium | frozen with review trigger | CI truth-lane review | No |
| `services/src/blackskies/services/memory_lab/wave1.py` | 1 | `experimental` | Phase 7B Wave 1 experimental helpers | Memory lab | Medium | frozen with review trigger | Memory feasibility phase | No |
| `services/src/blackskies/services/memory_lab/orchestrator.py` | 321 | `skipped` | Contested-event write skipped when lock not effective | Memory lab safety | Medium | frozen with review trigger | Memory safety validation phase | No |
| `docs/specs/generation_scope.md` | 43 | `not implemented` | Selected/chapter/manuscript scopes not implemented | Generation scope | Medium | frozen with review trigger | Generation scope expansion phase | No |
| `docs/deferred/voice_notes_transcription.md` | 1 | `deferred` | Voice notes and transcription future scope | Deferred feature | Low | frozen with review trigger | Voice workflow phase | No |
| `docs/deferred/smart_merge_tool.md` | 1 | `deferred` | Smart merge tool future scope | Deferred feature | Medium | active follow-up candidate | Future editorial merge phase | No |
| `docs/gui/accessibility_toggles.md` | 6 | `future` | Accessibility toggles future work | Accessibility UX | Low | active follow-up candidate | Accessibility settings phase | No |
| `docs/BLACK_SKIES_FIX_TRACKER.md` | 456 | `deferred` | Repo-wide package mypy deferred by temporary scope comments | Tooling debt | Medium | active follow-up candidate | Python typing/tooling phase | No |
| `docs/BLACK_SKIES_FIX_TRACKER.md` | 966 | `temporary` | Historical CI scope narrowing / workflow context | Workflow history | Informational | merged elsewhere | No current follow-up unless workflow audit reopens it | No |

## Blockers vs Non-Blockers

No Pass 11 blocker was found.

Non-blocking risks:

- Marker volume is high enough that future audits should distinguish current runtime debt from historical docs/test fixtures.
- Legacy/mock service seams remain acceptable only while opt-in and documented.
- Visual strict-mode and broader typing debt remain known confidence gaps, not Phase 13 blockers.
- Future memory/editorial systems are repeatedly referenced in docs and services; they must stay gated until their own proof phases.

## Recommended Pass / Phase Placement

| Follow-up | Rationale | Placement |
| --- | --- | --- |
| Legacy Phase 4 mock route retirement review | Mock rewrite/critique endpoints are still present as opt-in seams | Later service API cleanup phase |
| Visual test architecture review | `visual.home` remains opt-in and historically unstable | Test architecture expansion phase |
| Editorial diff/merge planning | Draft editor and smart-merge notes remain future editorial work | Future editorial comparison phase |
| Python typing/tooling debt pass | Scoped mypy remains documented deferred debt | Tooling stabilization phase |
| Memory lab containment review | Experimental helpers are present and must remain gated | Memory feasibility proof phase |

## Stop / Proceed Recommendation

Proceed to Pass 12.

Pass 11 does not justify cleanup, deletion, or implementation in this batch. It does justify a refactor-candidate inventory focused on snapshot/report authority, test selector brittleness, feature flag scattering, and documented mock/experimental containment.
