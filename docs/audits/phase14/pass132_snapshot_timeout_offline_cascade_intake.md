# PASS 132 - SNAPSHOT TIMEOUT / OFFLINE CASCADE INTAKE

## 1. Files inspected

- `docs/audits/phase14/pass120_workflow_smoke_human_verification_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/main/preload.ts`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/persistence/snapshot.py`
- `services/src/blackskies/services/snapshots.py`
- `services/src/blackskies/services/routers/health.py`
- `services/src/blackskies/services/routers/recovery.py`
- `services/src/blackskies/services/backup_verifier.py`
- `services/src/blackskies/services/app.py`

## 2. Human smoke failure summary

Pass 120 human smoke surfaced a snapshot/recovery failure with an offline cascade:

- Snapshot creation failed.
- No snapshot was created.
- The request timed out after `45000ms`.
- Service requests were reported as temporarily unavailable.
- Health probe failure / offline symptoms appeared after the timeout.

This is the next open recovery lane after scene authority closure in Pass 130 and Pass 131.

## 3. Snapshot / recovery ownership map

### Frontend UI

- `app/renderer/App.tsx`
  - owns the snapshot action handlers:
    - `handleCreateSnapshot`
    - `handleVerifySnapshots`
    - `openSnapshotsPanel`
  - computes action gating for snapshot / verification / general workspace controls via `servicesReadyForActions`, `disableSnapshot`, `disableVerify`, `serviceOffline`, and related state.
- `app/renderer/components/SnapshotsPanel.tsx`
  - renders snapshot browsing, verification, backup create / restore controls, and the offline copy for unavailable backend services.
  - disables verification and backup actions when `serviceStatus === 'offline'`.
- `app/renderer/components/ServiceHealthBanner.tsx`
  - renders the visible backend-offline banner and retry affordance.
- `app/renderer/components/ServiceStatusPill.tsx`
  - renders the backend service status label / pill shown in the header.

### Bridge / timeout boundary

- `app/main/preload.ts`
  - exposes `services.createProjectSnapshot` and `services.runBackupVerification`.
  - applies request timeouts through the generic bridge request path.
  - `createProjectSnapshot` routes through `makeServiceCall('snapshots', 'POST', ...)`.

### Backend

- `services/src/blackskies/services/routers/snapshots.py`
  - `POST /snapshots` endpoint.
  - validates `project_id`, resolves the project root, and delegates to `create_snapshot(project_root)`.
- `services/src/blackskies/services/snapshots.py`
  - shared snapshot helper that wraps the persistence engine for manual / workflow snapshot creation.
- `services/src/blackskies/services/persistence/snapshot.py`
  - low-level snapshot engine: allocates snapshot directory, copies include entries, writes metadata, and writes the YAML manifest.
- `services/src/blackskies/services/routers/recovery.py`
  - recovery status / restore surface that reads and writes snapshot-linked recovery state.
- `services/src/blackskies/services/routers/backup_verifier.py`
  - optional verification route surface tied to snapshot records.
- `services/src/blackskies/services/backup_verifier.py`
  - optional background verifier daemon and persisted verifier state.
- `services/src/blackskies/services/routers/health.py`
  - `/healthz` payload that reports service health and backup verifier state.
- `services/src/blackskies/services/app.py`
  - backend app wiring for snapshot persistence, backup verifier state, and health / snapshot / recovery routers.

## 4. Frontend timeout path

The snapshot action path is frontend-owned at the call site but timeout-enforced in the preload bridge:

1. `App.handleCreateSnapshot` calls `services?.createProjectSnapshot({ projectId })`.
2. `app/main/preload.ts` maps that to `makeServiceCall('snapshots', 'POST', { project_id })`.
3. `makeServiceCall` computes a request timeout with `resolveRouteTimeoutMs(...)`.
4. The generic fallback timeout resolver uses `REQUEST_POLICY.timeoutMs`, which defaults to `45000ms` unless a route-specific override exists.
5. The snapshot route is not one of the special-case long budgets in the preload bridge, so the human smoke timeout is consistent with the generic 45s bridge policy.

This means the visible timeout is bridge-level behavior, not something `App.tsx` itself sets.

## 5. Backend snapshot path

The backend path for manual snapshot creation is narrow and direct:

- `POST /snapshots` in `services/src/blackskies/services/routers/snapshots.py`
- `create_snapshot(project_root)` in `services/src/blackskies/services/snapshots.py`
- `SnapshotPersistence.create_snapshot(project_id)` in `services/src/blackskies/services/persistence/snapshot.py`

The low-level persistence path performs:

- unique snapshot directory allocation,
- include-spec collection,
- file copy work,
- metadata JSON write,
- YAML manifest write.

The current evidence does not yet distinguish a slow-but-correct snapshot from a deadlock, filesystem lock stall, or a bridge timeout that expires before completion.

## 6. Service health / offline cascade path

The offline cascade is renderer-mediated rather than snapshot-specific in the first visible step:

- `useServiceHealth.ts` probes the backend and marks the service offline on failed health checks, service-port issues, or forced offline state.
- `App.tsx` consumes that state as `serviceOffline` / `servicesReadyForActions` and disables workspace actions when the service is not healthy.
- `ServiceHealthBanner.tsx` surfaces the visible "Backend services offline" banner.
- `ServiceStatusPill.tsx` mirrors the same health state in the header.
- `SnapshotsPanel.tsx` disables snapshot / verification / backup actions when `serviceStatus === 'offline'` and shows offline copy that the backend service is unavailable.

The current code therefore supports a cascade where a long snapshot request can be followed by a health-probe failure or service-offline interpretation in the renderer.

## 7. Candidate root causes ranked by confidence

1. **Bridge timeout expires at the generic 45s request budget before snapshot work completes** - highest confidence.
   - The human smoke message explicitly reported `Request timed out after 45000ms`.
   - The preload bridge defaults to `REQUEST_POLICY.timeoutMs = 45000` for non-special-case routes.
   - The snapshot route is not currently assigned a separate long budget in the bridge.
2. **Backend snapshot creation is legitimately too slow or blocks on filesystem work** - medium confidence.
   - `SnapshotPersistence.create_snapshot` performs directory allocation, include collection, copy, metadata, and manifest writes.
   - A long-running or locked filesystem operation could exhaust the generic bridge budget.
3. **Health-probe / service-offline handling cascades a snapshot timeout into a broader availability warning** - medium confidence.
   - `useServiceHealth` marks offline on probe failures and drives `serviceOffline` gating in `App.tsx`.
   - The banner / pill / snapshots panel all surface the same degraded state after a failure.
4. **Backup-verifier state is contributing to the offline wording** - lower confidence.
   - `healthz` includes backup-verifier state, but there is not yet evidence that verifier state is the trigger rather than a downstream status surface.

## 8. What evidence is missing

The current evidence is enough to map ownership, but not enough to isolate the precise root cause. Missing evidence includes:

- exact renderer console / trace lines around the failing snapshot request,
- backend logs from the snapshot route during the failure,
- whether the 45s timeout occurs before the request reaches the backend or while the backend is still processing,
- whether `healthz` failed independently of the snapshot request or only after the timeout,
- whether the offline banner was driven by a real health-probe failure or a renderer interpretation of the timeout,
- whether the timeout is reproducible across repeated runs with the same project.

## 9. Recommended next pass

`READY FOR TARGETED REPRO`

The next pass should capture a single focused runtime repro with:

- bridge request / response timestamps for snapshot creation,
- renderer health transitions,
- backend snapshot route logs,
- and any `healthz` / offline-banner transitions that follow the timeout.

That is the smallest next step that can distinguish bridge timeout, backend slowness, and health-cascade behavior.

## 10. Authorized files for future repair planning

For the next planning-only pass, the likely repair candidates are:

- `app/main/preload.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/snapshots.py`
- `services/src/blackskies/services/persistence/snapshot.py`
- `services/src/blackskies/services/routers/recovery.py`
- `services/src/blackskies/services/routers/backup_verifier.py`
- `services/src/blackskies/services/backup_verifier.py`
- `services/src/blackskies/services/routers/health.py`
- `services/src/blackskies/services/app.py`

## 11. Final verdict

`READY_FOR TARGETED REPRO`
