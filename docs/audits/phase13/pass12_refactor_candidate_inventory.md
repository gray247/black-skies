# Phase 13 Pass 12 - Refactor Candidate Inventory

Status: Completed
Reviewed: 2026-05-09

## Summary

This pass identifies refactor candidates supported by Phase 13 evidence. It does not implement them.

The only candidate safe for Pass 13 implementation is a narrow renderer helper extraction for snapshot/report reveal-path feedback. Broader toolbar consolidation, feature flag restructuring, GUI default decisions, and legacy service cleanup are deferred because they would exceed the current batch scope or require human verification.

## Evidence Inspected

- `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md`
- `docs/audits/phase13/pass7_snapshot_report_path_integrity_fix.md`
- `docs/audits/phase13/pass8_snapshot_toolbar_surface_consolidation.md`
- `docs/audits/phase13/pass9_feature_flag_canonical_gui_decision.md`
- `docs/audits/phase13/pass11_deferred_todo_stub_inventory.md`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/commands/commandRegistry.ts`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`

## Refactor Candidate Table

| Candidate | Evidence | Risk | Expected benefit | Likely files touched | Validation needed | Recommendation | Safe for Pass 13? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Centralize snapshot/report reveal-path feedback helper | Pass 7 introduced equivalent error classification in `App.tsx` and `SnapshotsPanel.tsx` | Low | Prevent divergent missing-path/OS-failure copy and keep structured preload result handling consistent | `App.tsx`, `SnapshotsPanel.tsx`, new renderer utility, affected tests | Snapshot verification tests, restore/recovery tests, e2e snapshot verification, lint | Implement now | Yes |
| Clean hook dependency fallout after helper extraction | Existing snapshot handlers call shared reveal functions from callbacks | Low | Avoid stale closure risk and lint warnings | `App.tsx`, `SnapshotsPanel.tsx` | App lint, targeted tests | Implement now if needed | Yes |
| Centralize snapshot/report label constants | Pass 8 labels now exist across toolbar, panel, toast, e2e, and tests | Medium | Reduce future stale selector/copy drift | Multiple renderer components, tests, command registry | Broad renderer tests and e2e | Defer | No |
| Consolidate toolbar snapshot controls into one grouped workflow | Pass 6 found overlapping `Snapshot`, `Verify snapshots`, and `Snapshots` controls | Medium / High | Reduce operator confusion | `WorkspaceHeader.tsx`, CSS, tests, docs | Human verification plus e2e | Defer until after Pass 14 | No |
| Feature flag accessor/helper consolidation | Pass 9 found flag checks in runtime config, App, tests, and docs | Medium | Reduce default/experimental path drift | `runtime.ts`, `App.tsx`, tests | Runtime config tests, preflight tests, e2e | Defer | No |
| Split Command default decision | Pass 9 confirms flag-off shell is canonical and Split Command is experimental | High | None until readiness criteria are met | Runtime config, App, docs, tests | Full app/e2e/human verification | Freeze until explicit decision record | No |
| Test selector hardening with existing test IDs | CI failures and Pass 8 label changes show stale copy selectors can break harnesses | Medium | More resilient tests without weakening assertions | E2E and renderer tests | Targeted affected tests | Defer except where labels changed in Pass 8 | Partial only |
| Preload reveal result type hardening | Pass 7 structured `revealPath` results across IPC | Medium | Stronger bridge contract confidence | `preload.ts`, `services.ts`, main/preload tests if present | Targeted bridge/unit coverage | Defer unless a focused bridge-test pass is scheduled | No |
| Legacy Phase 4 mock route retirement | Pass 11 found opt-in legacy mock routes | Medium | Reduce service surface ambiguity | Service routers/tests/docs | Backend pytest and truth lanes | Later service cleanup phase | No |
| Memory lab experimental containment review | Pass 11 found experimental memory-lab helpers | Medium | Prevent future memory work from leaking into current runtime | Memory lab services/tests/docs | Backend memory tests | Later memory feasibility phase | No |
| Current-state/docs alignment sweep | Pass 9 and 11 show docs carry historical/future-scope references | Low / Medium | Reduce operator confusion | Docs only | `git diff --check` | Later docs alignment pass | No |

## Candidate Selected For Pass 13

Selected:

- Centralize snapshot/report reveal-path feedback helper.
- Clean hook dependency fallout if lint requires it.

Why selected:

- It is directly supported by Pass 6 and Pass 7 evidence.
- It stays inside renderer snapshot/report path handling.
- It preserves Pass 7 behavior instead of adding new behavior.
- It is testable automatically.

## Candidates Rejected For This Batch

Rejected for Pass 13:

- Toolbar layout consolidation: requires human verification and UX decision-making.
- Feature flag restructuring: not needed for current bug path and risks default-path drift.
- Label constants: useful but broad enough to create churn across runtime/tests/docs.
- Split Command default work: explicitly forbidden in this phase.
- Legacy/mock service cleanup: backend behavior and service API risk.
- Memory lab cleanup: future-phase system risk.

## Stop / Proceed Recommendation

Proceed to Pass 13 with only the selected helper extraction and lint-safe dependency cleanup.

Do not perform human verification in Pass 13. Human verification remains deferred to Pass 14.
