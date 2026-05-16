Canonical role: Phase 16 bounded chaos plan and results.
Scope: define safe negative-path stress cases and record which ones are already covered by source/tests versus which still need operator observation.
Owns: duplicate-operation risk, stale-state risk, timeout ambiguity, and harness overclaim containment.
Does not own: destructive fault injection, load-lab construction, or broad resilience engineering.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 16 Operational Chaos Testing

## Guardrails

- Do not crash the app on purpose unless the test lane already does that in a controlled way.
- Do not mutate real projects destructively.
- Prefer read-only or fail-closed checks.
- Stop as soon as a claim boundary becomes clear.

## Chaos Plan

| Scenario | Safe stress method | What matters | What not to claim |
| --- | --- | --- | --- |
| Duplicate action risk | Click the same long-running button again while the first request is in flight | The UI should disable, debounce, or otherwise prevent a second ambiguous request | That one disabled-state check proves all retry semantics |
| Backend unavailable during UI operation | Force offline / port-unavailable state with harness or test-mode hooks | Controls should disable or fail clearly without pretending the action completed | That the banner wording is a product-wide outage proof |
| Renderer reload during long operation | Reload the renderer while a restore/export/generation request is active | The UI should not silently claim completion if the state is gone | That reload safety proves background completion semantics |
| Stale result after project switch | Switch projects while recovery or verification state is still visible | The new project should not inherit the old project's authority claim | That a single clean switch proves every reopen path |
| Operation timeout ambiguity | Trigger a request that can outlive the client timeout | The UI should say completion is unknown, preserved, or still pending | That timeout equals failure |
| Harness overclaim risk | Compare fixture truth, synthetic truth, and real runtime truth | The docs should preserve lane boundaries and avoid overclaiming | That synthetic or fixture green is runtime closure |

## Results

| Scenario | Current result | Evidence |
| --- | --- | --- |
| Duplicate action risk | Partially covered | `SnapshotsPanel` disables restore/verify buttons while a request is in flight, and `useRecovery` guards reopen with in-flight state. This is good fail-closed behavior, but not a general proof of all duplicate behaviors. |
| Backend unavailable during UI operation | Covered | `useServiceHealth` sets offline state, `SnapshotsPanel` gates backend-required actions, and the service-status tests already cover the offline labels and retry path. |
| Renderer reload during long operation | Partially covered | The long-running paths use explicit loading flags and completion-unknown wording, but recovery/reopen still needs operator observation to prove reload behavior in the real session. |
| Stale result after project switch | Covered | Phase 14 operator receipts cover project switch and floating-pane reload/rebind, and Phase 16 now adds real-project reopen-after-restore proof using a restored alias and relaunch. |
| Operation timeout ambiguity | Covered as a classification, not fully closed as a trust claim | `SnapshotsPanel` now says completion is unknown when timeout happens and `preload.ts` records the timeout details, but some flows still have shorter client budgets than backend work. |
| Harness overclaim risk | Covered | The Phase 16 governance artifact and the fixture contract check explicitly fail closed if the harness and truth lanes drift on required aliases or snapshot roots. |

## Safe Read-Only Checks

- Service-status and offline gating unit tests.
- Recovery hook and recovery banner tests.
- Snapshot verification, report-view, and backup/restore renderer tests.
- Fixture contract validation and fixture materialization checks.

## Operator Instructions If Manual Chaos Is Needed

1. Click the target action once and note whether the button disables.
2. Do not refresh unless the scenario explicitly says to test reload.
3. If the UI says completion is unknown, capture that and stop.
4. If the app claims the operation succeeded before the filesystem result exists, record that as a failure.
5. If the path is recovery/reopen, use a real project and observe the resulting project identity before claiming pass.

## Closure Impact

- No chaos scenario here justifies a broad refactor.
- The main remaining manual proof gap has been closed for Phase 16; recovery/reopen after restore now has real-project proof in this phase.
- Everything else is either already covered as fail-closed behavior or is explicitly deferred as a trust claim rather than a resilience-engineering task.
