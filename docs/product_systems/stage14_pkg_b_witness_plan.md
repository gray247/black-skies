# Stage 14 PKG-B Witness Plan

## 1. Repo gate result

Status: passed.

Repository checkpoint:

```text
e62b4de7150fd14c4b25daa7d678a711d15dd511 docs(product): control Stage 14 residual deferrals
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
e62b4de docs(product): control Stage 14 residual deferrals
765998e docs(product): baseline Stage 14 PKG-B
79e1f49 docs(product): charter Stage 14 PKG-B
ae7d6f0 docs(product): close Stage 14 PKG-E
68d0e8d docs(product): close Stage 14 PKG-D
409b4f2 docs(product): close Stage 14 PKG-A
b063363 docs(product): close Stage 14 PKG-C
```

No runtime code, tests, witnesses, mutation-scope records, protected evidence, or Stage 15 records were created or modified during this witness-plan pass.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_b_charter.md`
- `docs/product_systems/stage14_pkg_b_read_only_baseline.md`
- `docs/product_systems/stage14_residual_deferral_control.md`
- `docs/product_systems/stage14_pkg_a_closure_review.md`
- `docs/product_systems/stage14_pkg_d_closure_review.md`
- `docs/product_systems/stage14_pkg_e_closure_review.md`

## 3. Baseline findings under test

Baseline findings selected for witness review:

- `ProjectHome` currently exposes the clearest save-state truth through `persisted`, `runtime-only`, `dirty`, `unsaved`, `partial`, `clean`, `stale`, and `recovery-required`
- the active writing shell does not currently show an equivalent save-state truth surface in the inspected baseline
- recovery, snapshot, backup, and service-health seams already show visible status language such as `Crash recovery available`, `Restore snapshot`, `Blocked`, `Stale`, `Snapshot request timed out`, `Backend services offline`, and `Writing tools offline`
- `pending`, `at risk`, and one normalized cross-surface `degraded-writing` model were not observed in current user-facing wording
- the baseline did not prove contradiction by static evidence alone

These findings justify bounded witness work but do not yet authorize mutation.

## 4. Witness lane A

Witness lane A: live save-state honesty

Question:

Does the writer-facing active writing flow clearly distinguish `saved`, `pending` or `dirty`, `unsaved`, `partial`, `stale`, `recovery-required`, or `blocked` states without relying only on `ProjectHome`?

Bounded focus:

- transition from `ProjectHome` / startup state into active writing flow
- active writing-shell visibility near the writing surface and workflow spine
- whether save-state truth remains available after local draft state changes
- whether user-visible wording is available where the writer is actually writing

What this lane must not absorb:

- PKG-A identity repair
- PKG-D write-target or root-binding questions
- PKG-E identity/diagnostic polish that is not directly part of save-state truth
- backend persistence architecture

## 5. Witness lane B

Witness lane B: degraded-writing / recovery / startup-resume truth

Question:

Do existing user-facing status surfaces truthfully communicate when writing is degraded, recoverable, blocked, stale, or at risk across recovery, snapshot, service-health, and startup/resume paths?

Bounded focus:

- `ServiceStatusPill`
- `ServiceHealthBanner`
- `OfflineBanner`
- `RecoveryBanner`
- `SnapshotsPanel`
- startup/reopen/recovery entry messaging

What this lane must not absorb:

- backend restore destination safety
- PKG-D snapshot/export/draft write-target ownership
- generic backend root behavior
- PKG-E visibility/diagnostic polish outside degraded-writing truth

## 6. Source/test files likely involved later

Likely source files for later witness execution:

- `app/renderer/App.tsx`
- `app/renderer/DraftEditor.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/OfflineBanner.tsx`
- `app/renderer/hooks/useRecovery.ts`
- `app/renderer/hooks/useServiceHealth.ts`

Likely existing tests for later bounded witness work:

- `app/renderer/__tests__/ProjectHome.test.tsx`
- `app/renderer/__tests__/AppRecovery.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/renderer/__tests__/RecoveryBanner.test.tsx`
- `app/renderer/__tests__/ServiceStatusPill.test.tsx`
- `app/renderer/__tests__/useRecovery.test.tsx`
- `app/renderer/__tests__/useServiceHealth.test.tsx`
- `app/renderer/__tests__/OfflineReconnect.test.tsx`

## 7. Files/areas explicitly forbidden

Explicitly forbidden for PKG-B witness execution:

- PKG-A runtime identity repair seams as mutation targets
- PKG-D write-target, root-repair, export, backup-verifier, or draft-acceptance seams
- PKG-E recents/picker identity and unrelated visibility-polish seams
- backend root architecture
- connector work
- cleanup/archive work
- Stage 15 work
- protected sample projects
- tracked snapshots
- real user projects

## 8. Protected evidence posture

Protected evidence remains protected:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

Planned witness work, if later authorized, must use synthetic test data only.

## 9. Witness method

Method:

- use the smallest useful set of synthetic renderer-facing witnesses
- prefer extending or adding tightly bounded renderer tests only if needed
- test user-visible state language and status availability, not backend write-target mechanics
- compare what the writer can see in active writing flow versus what is only available in `ProjectHome` or diagnostic/home surfaces
- compare degraded-writing wording across recovery, snapshot, service-health, and startup/resume surfaces without broadening into implementation repair

Execution constraints:

- no witness execution in this record
- no production-code mutation
- no test mutation in this record
- no snapshot updates

## 10. What proves safe/contained behavior

Safe or contained behavior is proved if accepted witness evidence shows:

- live writing flow keeps save-state truth visible enough that the writer does not need to return to `ProjectHome` to understand current draft state
- user-facing wording clearly distinguishes local writing availability from blocked backend actions
- recovery, snapshot, and service-health surfaces communicate degraded or recoverable conditions without contradicting one another
- startup/resume state messaging does not imply false safety or hidden blocked state

Contained behavior may still be imperfect, but it must not create a current product-significant contradiction.

## 11. What proves contradiction

Contradiction is proved if accepted witness evidence shows any of the following inside PKG-B authority:

- the active writing flow hides or contradicts current save-state truth in a way that makes the writer-facing state materially misleading
- user-facing surfaces imply a scene or session is effectively saved or safe when the visible state actually remains dirty, partial, stale, blocked, or recovery-required
- degraded-writing messaging materially conflicts across service health, recovery, snapshots, or startup/resume surfaces
- startup/resume or recovery surfaces misstate whether writing is currently available, blocked, recoverable, or at risk

Contradiction for PKG-B is about writer-facing state truth, not backend target correctness.

## 12. What remains unresolved but not contradicted

Unless later witness evidence proves otherwise, the following remain unresolved but not contradicted:

- explicit `pending` wording may still be absent without becoming a contradiction
- explicit `at risk` wording may still be absent without becoming a contradiction
- the product may still rely on distributed state surfaces rather than one normalized label set
- backend destination safety, write-target semantics, and generic root behavior remain outside PKG-B unless witness evidence proves direct save-state/degraded-writing impact
- remaining AppPreflight residuals remain out-of-scope unless product-system impact is later proved

## 13. Deferral-control compliance table

All possible residuals in this plan are governed by `Stage 14 / PKG-B` and may not be deferred into closed packages.

| Potential residual | Current position | Named home | Home status | Promotion trigger | Why it does not block PKG-B witness planning | Must appear in Stage 14 closure review |
| --- | --- | --- | --- | --- | --- | --- |
| Active writing save-state wording remains ambiguous after witness execution | Stage 14 / PKG-B | `PKG-B` | active | accepted witness proves contradiction inside active writing flow | ambiguity can be investigated by bounded witness before any scope decision | yes if unresolved at PKG-B close |
| Degraded-writing surfaces remain distributed but non-contradictory | Stage 14 / PKG-B | `PKG-B` | active | accepted witness proves product-significant contradiction | distribution alone does not prevent witness planning | yes if still unresolved |
| Backend write-target or root behavior becomes implicated during witness review | Stage 14 / PKG-B | `Stage 14 closure review` | active | accepted evidence proves direct product-system impact beyond PKG-B authority | this plan is renderer-facing and does not need backend expansion to start | yes |
| AppPreflight residuals reappear as test-health noise only | Stage 14 / PKG-B | `Stage 14 closure review` | active | accepted evidence proves product-system impact | test-health residuals do not block bounded PKG-B witnesses | yes |
| Save-state or degraded-writing question points to a later still-ahead lane after Stage 14 | Stage 14 / PKG-B | later explicitly authorized lane | ahead or not yet authorized | later lane is explicitly named and authorized | future lane naming is not required to plan current bounded witnesses | yes until ownership transfers |
| Visibility or diagnostics issue outside save-state/degraded-writing workflow is noticed | Stage 14 / PKG-B | `Stage 14 closure review` | active | accepted evidence proves it belongs in a later named lane | out-of-scope notice does not block PKG-B witness planning | yes |

Compliance consequences:

- no residual in this plan is deferred to PKG-A, PKG-C, PKG-D, or PKG-E
- no residual in this plan is deferred to a completed earlier stage
- no vague `later` home is permitted without `Stage 14 closure review` visibility

## 14. Decision table

| Witness outcome | Required next action |
| --- | --- |
| contradiction proved | later scope decision required |
| safe or contained | reassessment / closure path |
| inconclusive | narrow follow-up only if a specific gap remains |
| out-of-scope issue | `Stage 14 closure review` or named later not-yet-started lane, never a closed package |

## 15. Next action after witness execution

After witness execution:

- if either lane proves contradiction, create a bounded PKG-B scope-decision record before any mutation work
- if both lanes are safe or contained, create a post-witness reassessment record
- if one lane is inconclusive, create only a narrower follow-up plan for the specific unresolved gap
- if a finding escapes PKG-B authority, route it to `Stage 14 closure review` or a named later ahead lane in compliance with the deferral-control note

Stage 15 remains blocked by current Stage 14 governance. PKG-B witness execution or closure alone does not make Stage 15 eligible.

PZ_CONTINUE: PKG-B witness plan ready for review
