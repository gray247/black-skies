# Phase 13 Pass 2 - Test Integrity Audit

Status: Completed
Reviewed: 2026-05-09

## Summary

Test coverage exists across renderer, backend/service, and e2e layers for the editorial workflow contract. The coverage is useful, but much of the renderer proof is harness-heavy and copy-sensitive, so it proves wiring and truth statements more than full end-to-end persistence.

## Test Inventory By Area

### Renderer tests

- `app/renderer/__tests__/AppCritique.test.tsx`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/__tests__/AppRecovery.test.tsx`
- `app/renderer/__tests__/AppRestore.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/renderer/__tests__/CritiqueModal.test.tsx`
- `app/renderer/__tests__/useRecovery.test.tsx`
- `app/renderer/__tests__/useRecovery.test.tsx`
- `app/renderer/__tests__/SplitCommandWorkspace.test.tsx`

### Backend / service tests

- `services/tests/test_rewrite_error_path.py`
- `services/tests/test_snapshot_authority_enforcement.py`
- `services/tests/test_snapshot_endpoints.py`
- `services/tests/unit/test_audited_chain_contract.py`
- `services/tests/unit/test_project_export_service.py`

### E2E and package-script coverage

- `app/package.json` defines `test`, `e2e:test`, `test:e2e`, `e2e:build`, and `e2e:report`.
- `package.json` defines `test:e2e`, `test:truth`, `test:service-truth`, `verify:gauntlet`, and `repo:hygiene`.
- `app/tests/e2e` exists, so the repo already has a top-level e2e test lane.

## Named Contracts Found

- Editorial workflow contract
- Critique / rewrite provenance contract
- Workflow spine contract
- Error / toast visibility contract
- Draft preview contract
- Scene metadata contract
- Snapshot authority contract
- Recovery behavior contract

## Contract-To-Test Mapping

| Contract | Evidence in tests | Assessment |
| --- | --- | --- |
| Critique is advisory and non-mutating | `AppCritique.test.tsx` includes `keeps critique advisory and non-mutative before rewrite`; `CritiqueModal.test.tsx` checks summary rendering; `services/tests/test_rewrite_error_path.py` covers backend rewrite conflict truth. | Good coverage for the core rule. |
| Rewrite is saved before sync | `AppCritique.test.tsx` includes `runs critique, rewrites, and applies the revision`, `Generate saved rewrite`, `Saved rewrite`, `Sync draft view`, and `Close saved rewrite preview`. | Good coverage, but it is largely copy and harness driven. |
| Saved rewrite vs synced renderer view | `AppCritique.test.tsx` and `AppPreflight.test.tsx` cover the view update path and the wrapper shell path. | Good coverage, but brittle if copy changes without a behavior change. |
| Snapshot and recovery truth | `AppRecovery.test.tsx`, `useRecovery.test.tsx`, `AppSnapshotsVerification.test.tsx`, `services/tests/test_snapshot_endpoints.py`, and `services/tests/test_snapshot_authority_enforcement.py`. | Strong coverage across renderer and service boundaries. |
| Error / toast visibility | `AppCritique.test.tsx`, `useRecovery.test.tsx`, and `AppSnapshotsVerification.test.tsx`. | Good coverage for the main visible failure surfaces. |
| Draft preview authority | `AppPreflight.test.tsx` covers draft preview hydration, sync, and project-scoped state. | Good coverage for preview truth. |
| Split Command shell boundary | `AppPreflight.test.tsx` and `SplitCommandWorkspace.test.tsx` cover the flagged shell and default-shell separation. | Good coverage for the flag boundary. |

## Weak Tests And False-Green Risks

- Many renderer tests are heavy harness tests with mocked services and bridge layers.
- Several assertions are string-sensitive, which is appropriate for trust copy but brittle if wording drifts without a contract change.
- `AppPreflight.test.tsx` is large and covers many concerns in one file, so a local setup regression can be harder to isolate.
- Snapshot and preview tests rely on synthetic filesystem fixtures, so they do not prove real disk timing or race behavior.

## Missing Negative Paths

- Critique failure paths are not as explicit as the success-path assertions.
- There is limited coverage for stale provenance appearing in the wrong state.
- Restore failure copy and current-project-modified semantics are not as exhaustively tested as restore success.

## Mock-Heavy Areas

- `AppCritique.test.tsx`
- `AppPreflight.test.tsx`
- `AppSnapshotsVerification.test.tsx`
- `useRecovery.test.tsx`

## Duplicated Or Brittle Assertion Risks

- `Generate saved rewrite`
- `Saved rewrite`
- `Close saved rewrite preview`
- `View snapshot report`
- `Current project restored from latest snapshot.`

These strings are correct contracts today, but they must be updated deliberately if product wording changes.

## Future Test Recommendations

| Recommendation | Named contract | Why it belongs |
| --- | --- | --- |
| Add a test that proves sync only updates the renderer view and does not imply persistence. | Saved rewrite vs synced renderer view | The current suite proves the happy path but not the authority boundary as directly as it could. |
| Add a negative restore test that states whether the current project was modified on failure. | Snapshot / recovery contract | Recovery semantics should stay explicit when the restore cannot complete. |
| Add a test that keeps trace ids visible for rewrite or recovery failures when they are available. | Error / toast visibility contract | The error contract says trace ids belong on visible failures. |
| Add a regression test that failed rewrite conflicts never show accepted provenance. | Critique / rewrite provenance contract | The current conflict path is good, but it should stay impossible to regress silently. |
| Add a small smoke path that explicitly proves the workflow spine order for critique -> saved rewrite -> sync on the flagged shell wrapper. | Workflow spine contract | This is the cleanest way to guard against state-order drift in the renderer shell. |

## Stop / Proceed Recommendation For Pass 3

Proceed. The test inventory is rich enough to support the workflow audit next.
