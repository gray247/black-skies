# PASS 133 - SNAPSHOT TIMEOUT TARGETED REPRO EVIDENCE PLAN

## 1. Files inspected

- `docs/audits/phase14/pass132_snapshot_timeout_offline_cascade_intake.md`
- `docs/audits/phase14/pass120_workflow_smoke_human_verification_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `app/main/preload.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/snapshots.py`
- `services/src/blackskies/services/persistence/snapshot.py`
- `services/src/blackskies/services/routers/health.py`
- `services/src/blackskies/services/app.py`

## 2. Existing logging / debug surfaces available

The current code already exposes enough logging to run a targeted repro without adding new instrumentation first:

- `app/main/preload.ts`
  - logs `request-start`, `request`, `response`, `error`, and `returning` phases for bridge calls.
  - includes `traceId`, `timeoutMs`, `unitCount`, `status`, and `durationMs` on the relevant service path.
- `app/renderer/App.tsx`
  - logs snapshot toast lifecycle events:
    - `[snapshot-toast-fired]`
    - `[snapshot-toast-action]`
  - maintains `window.__blackskiesDebugLog` and `window.__blackSkiesDebugState`.
- `app/renderer/hooks/useServiceHealth.ts`
  - logs health probe failures with `[useServiceHealth] Health probe failed`.
  - transitions renderer health state based on `checkHealth()`, forced offline, and port unavailability.
- `app/renderer/components/ServiceStatusPill.tsx`
  - renders `data-status` / `data-reason` state and can be queried directly in the DOM.
- `app/renderer/components/ServiceHealthBanner.tsx`
  - renders the visible offline banner and can be queried directly in the DOM.
- Backend router and persistence layers
  - `services/src/blackskies/services/routers/snapshots.py`
  - `services/src/blackskies/services/snapshots.py`
  - `services/src/blackskies/services/persistence/snapshot.py`
  - `services/src/blackskies/services/routers/health.py`
  - `services/src/blackskies/services/app.py`
  - these are the relevant backend logs to watch for `/snapshots` and `/healthz` activity.

## 3. Exact manual repro steps for user

1. Start the app in the same environment where the smoke failure was observed.
2. Open the project used in the human smoke run.
3. Open renderer DevTools so the console is visible.
4. Clear the renderer debug buffer before the attempt:
   ```js
   window.__blackskiesDebugLog = [];
   ```
5. Record the current service state before clicking snapshot:
   ```js
   console.log({
     serviceStatus: document.querySelector('[data-testid="service-status-pill"]')?.getAttribute('data-status') ?? null,
     serviceReason: document.querySelector('[data-testid="service-status-pill"]')?.getAttribute('data-reason') ?? null,
     healthBannerVisible: Boolean(document.querySelector('[data-testid="service-health-banner"]')),
     debugState: window.__blackSkiesDebugState ?? null,
   });
   ```
6. Trigger snapshot creation from the normal UI path:
   - `WorkspaceHeader` snapshot action, or
   - `SnapshotsPanel` create/backup action if that is the surface used in the smoke run.
7. Do not refresh or switch projects during the run.
8. Wait until one of these happens:
   - snapshot succeeds,
   - the 45-second timeout appears,
   - the offline banner appears,
   - or the backend clearly errors.
9. After the result, capture the renderer log buffer and the current service state.

## 4. Exact renderer console commands to run before and after repro

### Before clicking snapshot

```js
window.__blackskiesDebugLog = [];
console.log('before-snapshot', {
  serviceStatus: document.querySelector('[data-testid="service-status-pill"]')?.getAttribute('data-status') ?? null,
  serviceReason: document.querySelector('[data-testid="service-status-pill"]')?.getAttribute('data-reason') ?? null,
  healthBannerVisible: Boolean(document.querySelector('[data-testid="service-health-banner"]')),
  debugState: window.__blackSkiesDebugState ?? null,
});
```

### After the timeout / success / failure result

```js
console.log('after-snapshot', {
  serviceStatus: document.querySelector('[data-testid="service-status-pill"]')?.getAttribute('data-status') ?? null,
  serviceReason: document.querySelector('[data-testid="service-status-pill"]')?.getAttribute('data-reason') ?? null,
  healthBannerVisible: Boolean(document.querySelector('[data-testid="service-health-banner"]')),
  debugState: window.__blackSkiesDebugState ?? null,
});
console.table(
  (window.__blackskiesDebugLog ?? []).map((entry) => ({
    timestamp: entry.timestamp,
    scope: entry.scope,
    data: typeof entry.data === 'object' ? JSON.stringify(entry.data) : String(entry.data),
  })),
);
```

### If you need a narrowed trace slice

```js
(window.__blackskiesDebugLog ?? [])
  .filter((entry) => String(entry.scope).includes('service') || String(entry.scope).includes('snapshot'))
  .slice(-50);
```

## 5. Exact backend command / log capture steps

1. Run the backend in a dedicated terminal and capture stdout/stderr to a file.
   - PowerShell example:
     ```powershell
     uvicorn blackskies.services.app:create_app --factory --reload 2>&1 | Tee-Object -FilePath logs\pass133-backend.txt
     ```
2. If the app is launched through `pnpm dev`, keep the service terminal separate and preserve the backend log stream while the repro runs.
3. During the repro, watch for:
   - `POST /snapshots`
   - `GET /api/v1/healthz`
   - `POST /backup_verifier/run`
   - any `SnapshotPersistence` or filesystem-error messages
4. After the repro, save the backend log segment that covers:
   - the 10 seconds before snapshot click,
   - the 45-second timeout window,
   - and the 10 seconds after the timeout or success.

## 6. Health endpoint checks before / during / after snapshot

Use the current service port from the environment if present, otherwise read it from the startup logs first.

### Before snapshot

```powershell
Invoke-RestMethod "http://127.0.0.1:$env:BLACKSKIES_SERVICES_PORT/api/v1/healthz"
```

### During snapshot

Run the same command once while the snapshot request is still in flight.

### After snapshot

Run the same command again immediately after the timeout or result.

Record whether the payload stayed `status: "ok"` / `status: "online"` or flipped to an unhealthy state.

## 7. Evidence package required from user

The minimum evidence package for classification is:

- screenshot of the snapshot failure toast or success toast,
- renderer console export of the last `window.__blackskiesDebugLog` entries,
- service-status-pill state before and after the attempt,
- health endpoint output before / during / after the request,
- backend terminal log lines covering `/snapshots` and `/healthz`,
- trace ID if the bridge returns one,
- note of the exact project used for the repro.

## 8. How to classify results

### Bridge timeout before backend starts

Classify this when:

- the renderer logs the snapshot request start,
- the timeout toast appears,
- but the backend log never shows the `/snapshots` route entry.

### Backend starts but exceeds 45s

Classify this when:

- the backend logs the `/snapshots` route entry,
- but no completion appears before the bridge timeout,
- and the timeout toast appears first.

### Backend completes after bridge timeout

Classify this when:

- the bridge timeout toast appears at 45s,
- and the backend later logs successful completion for the same request window.

### Backend errors

Classify this when:

- the backend returns a deterministic 4xx/5xx error,
- or the renderer receives a structured backend error before the timeout.

### Health probe independently fails

Classify this when:

- `GET /api/v1/healthz` fails or turns unhealthy independently of the snapshot request,
- and the renderer logs a probe failure or shows an offline banner before the snapshot timeout is explained.

### Renderer falsely cascades timeout into offline state

Classify this when:

- the snapshot bridge times out,
- `healthz` remains healthy before and after,
- but the renderer still marks the service offline or shows an offline banner without backend evidence of actual health failure.

## 9. Whether additional instrumentation is needed

Not for the first targeted repro.

The current bridge logs, renderer debug buffer, health probe, and backend route logging are enough to separate the leading hypotheses if the user captures the logs cleanly.

## 10. If instrumentation is needed, smallest future implementation boundary

If the targeted repro still cannot distinguish the failure mode, the smallest future instrumentation boundary is:

- `app/main/preload.ts`
  - add one extra timestamp / phase marker around the `snapshots` request only.
- `app/renderer/hooks/useServiceHealth.ts`
  - add one explicit renderer health-transition marker when `status` flips.

Do not start with backend changes. Do not broaden to unrelated request paths.

## 11. Final verdict

`READY FOR HUMAN TARGETED REPRO`
