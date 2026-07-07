# Stage 14 PKG-B Witness Execution

## 1. Repository gate result

- `git rev-parse HEAD` returned `14a9b90aacfc840df261d095b748cf3942c977b7`.
- `git status -sb` returned `## salvage/minimal-two-surface-shell...origin/salvage/minimal-two-surface-shell`.
- `git status --short` was empty before witness work.
- `git log -48 --oneline` included:
  - `docs(product): plan Stage 14 PKG-B witnesses`
  - `docs(product): control Stage 14 residual deferrals`
  - `docs(product): baseline Stage 14 PKG-B`
  - `docs(product): charter Stage 14 PKG-B`
  - `docs(product): close Stage 14 PKG-E`
  - `docs(product): close Stage 14 PKG-D`
  - `docs(product): close Stage 14 PKG-A`
- `docs(product): close Stage 14 PKG-C` was also confirmed in branch history.
- Gate verdict: passed.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_b_charter.md`
- `docs/product_systems/stage14_pkg_b_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_b_witness_plan.md`
- `docs/product_systems/stage14_residual_deferral_control.md`

## 3. Witness lanes executed

- Lane A: live save-state honesty across ProjectHome to active writing flow
- Lane B: degraded-writing / recovery / startup-resume truth across existing status surfaces

## 4. Source/test files inspected

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/DraftEditor.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/OfflineBanner.tsx`
- `app/renderer/hooks/useRecovery.ts`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/recovery/actions.mjs`
- `app/renderer/__tests__/ProjectHome.test.tsx`
- `app/renderer/__tests__/AppRecovery.test.tsx`
- `app/renderer/__tests__/AppRestore.test.tsx`
- `app/renderer/__tests__/HistoryPane.test.tsx`
- `app/renderer/__tests__/ServiceStatusPill.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`

## 5. Files changed

- `app/renderer/__tests__/PkgBWritingStateWitness.test.tsx` (new targeted witness test using synthetic data only)

## 6. Commands run and results

- `git rev-parse HEAD`
  - Result: `14a9b90aacfc840df261d095b748cf3942c977b7`
- `git status -sb`
  - Result: synchronized branch, clean before witness work
- `git status --short`
  - Result: empty before witness work
- `git log -48 --oneline`
  - Result: required PKG-B / PKG-E / PKG-D / PKG-A history present
- `git log --oneline --grep "docs(product): close Stage 14 PKG-C" -n 1`
  - Result: `b063363 docs(product): close Stage 14 PKG-C`
- `rg -n "Session truth|Lifecycle state:|Signal classification:|Draft/session state:" app/renderer/components/ProjectHome.tsx`
  - Result: `ProjectHome` statically exposes explicit session-truth labels and classifications
- `cmd /c pnpm --filter app test -- --run renderer/__tests__/PkgBWritingStateWitness.test.tsx`
  - Initial result: failed once because the witness used an overly broad `Draft editor` selector against CodeMirror accessibility markup
  - Corrected result: `Test Files 1 passed (1); Tests 1 passed (1)`
- `cmd /c pnpm --filter app test -- --run renderer/__tests__/HistoryPane.test.tsx renderer/__tests__/ServiceStatusPill.test.tsx renderer/__tests__/AppRestore.test.tsx renderer/__tests__/AppSnapshotsVerification.test.tsx`
  - Result: `Test Files 4 passed (4); Tests 25 passed (25)`
- Exploratory only, not accepted as primary PKG-B evidence:
  - `cmd /c pnpm --filter app test -- --run renderer/__tests__/AppRecovery.test.tsx renderer/__tests__/AppRestore.test.tsx renderer/__tests__/HistoryPane.test.tsx renderer/__tests__/ServiceStatusPill.test.tsx renderer/__tests__/AppSnapshotsVerification.test.tsx`
  - Result: `AppRecovery.test.tsx` introduced broader failures (`1 failed | 4 passed` at file level); this was not needed to prove the scoped witness lanes and is carried only as test-health context, not accepted contradiction evidence

## 7. Lane A result

- Result: contradiction proved.
- Accepted evidence:
  - `ProjectHome.tsx` explicitly renders `Lifecycle state`, `Signal classification`, and `Draft/session state`.
  - The targeted `PkgBWritingStateWitness` passed and showed that, after a local edit inside the active writing shell, the writer still sees workflow controls and the editor surface but no equivalent `persisted`, `dirty`, `unsaved`, `partial`, `stale`, or `recovery-required` save-state truth.
- Conclusion:
  - Save-state honesty still relies on `ProjectHome`.
  - The active writing flow does not itself clearly distinguish saved, pending/dirty, unsaved, partial, stale, recovery-required, or blocked states for the scoped witness condition.

## 8. Lane B result

- Result: contained.
- Accepted evidence:
  - `HistoryPane.test.tsx` passed and continues to surface recovery controls and empty-state fallback behavior.
  - `ServiceStatusPill.test.tsx` passed and continues to expose online/checking/offline service truth.
  - `AppRestore.test.tsx` passed and continues to surface restore timeout, degraded inspection warning, and blocked restore eligibility messaging.
  - `AppSnapshotsVerification.test.tsx` passed and continues to expose snapshot verification status, blocked/stale backup states, backup restore gating, and offline local-browsing language.
  - Source inspection across `RecoveryBanner.tsx`, `ServiceHealthBanner.tsx`, `OfflineBanner.tsx`, `SnapshotsPanel.tsx`, `useRecovery.ts`, `useServiceHealth.ts`, and `App.tsx` showed explicit user-facing degraded/recovery/status wording on the tested seams.
- Conclusion:
  - Existing degraded-writing / recovery / snapshot / service-health surfaces communicate state truthfully on the exercised seams.
  - No accepted witness proved a PKG-B contradiction for lane B.

## 9. Classification

- Lane A: contradiction proved
- Lane B: contained
- Overall PKG-B witness verdict: mutation scope is required before closure preparation

## 10. Deferral-control compliance

| Residual | Current position | Named home | Home status | Promotion trigger | Non-blocking rationale | Stage 14 closure-review visibility |
| --- | --- | --- | --- | --- | --- | --- |
| Active writing save-state honesty contradiction | Stage 14 / PKG-B | PKG-B mutation scope | active | Accepted witness contradiction showing the active writing shell omits canonical save-state truth now proved by execution evidence | Witness execution is complete; the contradiction is bounded and can advance to scoped mutation without broadening PKG-B authority | Yes |
| Broader cross-surface save/degraded vocabulary normalization beyond the proved contradiction | Stage 14 / PKG-B | Stage 14 closure review | active | Later accepted evidence proving user-facing contradiction outside the scoped active-recents-writing seam | Current witnesses proved one bounded contradiction and contained the tested degraded-status seams; broader normalization was not proved contradictory here | Yes |
| Exploratory `AppRecovery` rerun instability outside the accepted witness set | Stage 14 / PKG-B | Stage 14 closure review | active | Later accepted evidence showing the failing `AppRecovery` cases reflect a product-system truth contradiction rather than broader test-health or app-shell instability | The accepted lane-B evidence came from narrower passing status-surface tests; the broader `AppRecovery` batch was not required to answer the scoped witness question | Yes |
| Inherited backend root / write-target / persistence residuals outside PKG-B authority | Stage 14 / PKG-B | Stage 14 closure review | active | Later closure-review accounting or later explicitly authorized lane proves product-system action is still required | Those seams are explicitly forbidden to PKG-B and were not reopened by these witnesses | Yes |

## 11. Protected evidence posture

- Protected evidence was not touched.
- No witness used:
  - `sample_project/proj_esther_estate/**`
  - `sample_project/Esther_Estate/**`
  - `build/truth_receipts/**`
  - `build/runtime_truth.json`
  - `build/runtime_truth.schema.json`
  - `ci_artifacts/**`
  - tracked snapshots
  - IPC snapshot evidence
  - real user projects
- The new witness test used synthetic in-memory data only.

## 12. Excluded seams preserved

- No production code was modified.
- No backend root or write-target behavior was modified.
- No PKG-A identity repair was modified.
- No PKG-D write-target repair was modified.
- No PKG-E identity visibility polish outside save-state / degraded-writing workflow was modified.
- No cleanup/archive work was opened.
- Stage 15 was not started.

## 13. Whether mutation scope is required

- Yes.
- The accepted lane-A contradiction is bounded and requires a later PKG-B mutation scope record.

## 14. Whether closure preparation is eligible

- No.
- PKG-B closure preparation is not eligible while the accepted lane-A contradiction remains unresolved.

PZ_CONTINUE: PKG-B mutation scope required
