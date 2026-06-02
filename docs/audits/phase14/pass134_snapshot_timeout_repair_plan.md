# PASS 134 - SNAPSHOT TIMEOUT REPAIR PLAN

## 1. Files inspected

- `app/main/preload.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/snapshots.py`
- `services/src/blackskies/services/persistence/snapshot.py`
- `docs/audits/phase14/pass132_snapshot_timeout_offline_cascade_intake.md`
- `docs/audits/phase14/pass133_snapshot_timeout_targeted_repro_evidence_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## 2. Evidence summary

Targeted repro evidence now distinguishes the defect from the earlier offline-cascade hypothesis:

- UI result:
  - `Snapshot creation failed`
  - `No snapshot was created`
  - `Request timed out after 45000ms`
- Backend timing:
  - `POST /api/v1/snapshots` started at approximately `2026-06-02T15:32:51`
  - `POST /api/v1/snapshots HTTP 200` returned at approximately `2026-06-02T15:33:39`
  - total duration was approximately 48 seconds
- Health checks:
  - before / during / after remained `HTTP 200` with `status ok`
- Console:
  - no console errors were observed

Conclusion from the evidence:

- the backend did start,
- the backend did finish successfully,
- the backend finished after the renderer/preload request timeout expired,
- the health layer did not independently fail.

This is a late-success timeout problem, not a backend-offline problem.

## 3. Root-cause classification

The best current classification is:

- backend starts but exceeds 45s,
- backend completes after bridge timeout,
- health does not independently fail,
- the renderer error message is misleading because the snapshot may still complete after the timeout.

This is consistent with a route-level timeout budget mismatch, not with a broken snapshot endpoint or a real offline cascade.

## 4. Timeout ownership map

### Bridge timeout owner

- `app/main/preload.ts`
  - `REQUEST_POLICY.timeoutMs` defaults the generic bridge budget to `45000ms`.
  - `resolveRouteTimeoutMs(...)` currently gives special budgets to `restore`, `backups`, and `backups/restore`.
  - `snapshots` falls through to the generic request budget.
  - `createProjectSnapshot` routes through `makeServiceCall('snapshots', 'POST', ...)`.

### Backend snapshot owner

- `services/src/blackskies/services/routers/snapshots.py`
  - `POST /snapshots` validates input and delegates to snapshot creation.
- `services/src/blackskies/services/snapshots.py`
  - orchestrates manual snapshot creation.
- `services/src/blackskies/services/persistence/snapshot.py`
  - performs the directory allocation, copy, metadata, and manifest write work that can legitimately take longer than the generic bridge budget.

### Renderer call site

- `app/renderer/App.tsx`
  - `handleCreateSnapshot` invokes `services.createProjectSnapshot`.
  - the current failure branch reports a hard negative copy, which is not truthful for a timeout that may later complete.

## 5. UI / error-message ownership map

- `app/renderer/App.tsx`
  - owns the snapshot toast copy and action text.
  - currently uses `Snapshot creation failed` and `No snapshot was created` for any error path.
  - currently refreshes the snapshots panel only on success, not on timeout failure.
- `app/renderer/components/SnapshotsPanel.tsx`
  - refreshes snapshot/verification data on open and on its own local refresh triggers.
  - does not own the manual snapshot create action in this lane.

The misleading part is therefore the renderer toast wording, not the backend endpoint contract.

## 6. Health / offline cascade assessment

Do not treat this repro as a service-health failure.

- `app/renderer/hooks/useServiceHealth.ts` remained healthy in the targeted repro.
- `serviceStatus` stayed `ok` / `online` before, during, and after the snapshot attempt.
- `GET /api/v1/healthz` remained `HTTP 200`.
- No evidence shows the timeout should flip `serviceOffline` or the offline banner.

The snapshot timeout must not be reclassified as backend offline unless new evidence shows a separate health-probe failure.

## 7. Candidate repairs with tradeoffs

### A. Increase timeout only for `createProjectSnapshot` / `snapshots` POST

Pros:

- smallest operational change,
- contains the fix to the long-running snapshot path only,
- avoids raising the generic 45s policy for unrelated service calls.

Cons:

- if snapshot work grows past the new budget, the timeout can still recur.

### B. Add operation-specific timeout policy for long operations

Pros:

- makes the timeout structure explicit,
- keeps future long operations from inheriting the generic bridge budget.

Cons:

- slightly broader than a one-off constant,
- still not enough on its own if the UI continues to claim definitive failure on timeout.

### C. Improve UI copy to say “still running or timed out” and refresh snapshot state

Pros:

- fixes the false-negative user message,
- makes the timeout branch truthful,
- reduces user confusion when the backend later completes successfully.

Cons:

- does not itself prevent the timeout from happening.

### D. Convert snapshot creation to async job / progress UI

Pros:

- most robust for very long operations.

Cons:

- too broad for the current evidence,
- requires new state/progress semantics,
- unnecessary if a route-specific budget is enough.

### E. Optimize backend snapshot creation speed

Pros:

- may reduce end-to-end latency.

Cons:

- not the smallest safe repair,
- evidence already shows the backend succeeded within ~48s, so the immediate failure is the 45s bridge timeout and misleading UI copy rather than a backend crash.

## 8. Recommended smallest safe repair

Recommended repair:

1. Add a snapshot-specific bridge timeout for `createProjectSnapshot` / `snapshots` POST in `app/main/preload.ts`.
2. Keep the generic request policy unchanged for unrelated operations.
3. Update `App.handleCreateSnapshot` to distinguish timeout from definitive failure.
4. Replace `No snapshot was created` in the timeout branch with truthful copy such as:
   - `Snapshot request timed out. The snapshot may still complete. Refresh the snapshots panel to check.`
5. Do not change `useServiceHealth.ts` or the offline banner for this request timeout, because health remained OK.

This is the smallest repair that addresses the observed defect without adding async-job architecture.

## 9. Authorized files for implementation

- `app/main/preload.ts`
- `app/renderer/App.tsx`

Conditional only if UI copy needs to be mirrored in a shared snapshots surface:

- `app/renderer/components/SnapshotsPanel.tsx`

## 10. Unauthorized files

- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/snapshots.py`
- `services/src/blackskies/services/persistence/snapshot.py`
- `services/src/blackskies/services/routers/health.py`
- `services/src/blackskies/services/app.py`
- dependencies / lockfiles
- unrelated tests and fixtures

## 11. Validation plan

Use the narrowest validation set that proves the late-success path is handled truthfully:

- targeted snapshot creation test if available:
  - `app/renderer/__tests__/AppPreflight.test.tsx`
- preload/request timeout coverage if available:
  - bridge timeout / snapshot timeout assertions in renderer tests
- backend snapshot tests if available:
  - `services/tests/test_snapshot_endpoints.py`
  - `services/tests/unit/test_snapshots.py`
  - `services/tests/unit/test_snapshot_persistence_refactor.py`
- `pnpm --filter app test`
- `pnpm --filter app build`
- manual human retest of snapshot creation and late-completion behavior
- `git diff --check`
- `pnpm lint:docs`

The human retest should verify:

- the snapshot request no longer fails at 45s for the observed 48s case,
- the UI does not falsely claim that no snapshot was created when the backend later returns 200,
- service health does not flip offline when `/healthz` remains healthy.

## 12. Final verdict

`READY FOR SNAPSHOT TIMEOUT IMPLEMENTATION`
