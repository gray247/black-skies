# Phase 13 Pass 16 - Service Connectivity + High-Risk Control Coverage

## Summary
The `Writing tools offline` / `Request timed out after 45000ms` state comes from the shared service-health and bridge request path, not from snapshot browsing itself. Snapshot creation, verification, backup creation, and restore actions are backend-dependent and should stay gated by service availability. Local snapshot browsing actions, especially `Open report file`, `Reveal`, `Manifest`, and `View snapshot details`, are file-system backed and should remain usable when the service bridge is offline as long as the underlying path exists.

This pass tightened that boundary by keeping the local report browser enabled even when the service status is offline, and by clarifying the operator-facing offline message so it no longer implies that local snapshot browsing is unavailable.

## Evidence
- `app/main/preload.ts`
  - `BridgeTimeoutError` emits `Request timed out after 45000ms.`
  - `makeServiceCall()` uses the shared 45s bridge policy for backend calls.
- `app/renderer/hooks/useServiceHealth.ts`
  - Service-health state is `online` / `checking` / `offline`, with `service_port_unavailable` and `test-offline` reasons.
  - The offline banner reflects service-health/bridge reachability, not local file accessibility.
- `app/renderer/components/ServiceHealthBanner.tsx`
  - The banner text is explicitly about the writing tools service.
- `app/renderer/components/SnapshotsPanel.tsx`
  - `Run verification`, `Create backup`, `Restore backup`, and `Restore latest ZIP as copy` remain backend-gated.
  - `Open report file` is now gated only on `projectPath`, not on service health.
  - The offline advisory now says snapshot browsing remains available.
- `app/renderer/utils/revealPathFeedback.ts`
  - `Reveal`/`Manifest`/`Verification report` actions validate local paths before OS open and surface structured renderer errors.
- `services/src/blackskies/services/routers/backup_verifier.py`
  - `run_backup_verifier` persists `.snapshots/last_verification.json`.
- `services/src/blackskies/services/snapshots.py`
  - manual snapshots exclude generated snapshot/backup artifacts.
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
  - now includes an offline-local-browse regression test proving `Open report file` remains enabled and resolves the canonical report path when the service UI is offline.

## Service / Offline Root Cause
The observed offline state is **writing-tool/bridge-health**, not snapshot-specific. The `45000ms` message is the shared bridge timeout used by backend service calls. It is broad by design and can surface during any request routed through the bridge.

## Snapshot Action Availability When Offline
| Control | Expected state | Reason |
| --- | --- | --- |
| Snapshot | Disabled | Backend snapshot creation requires the service bridge. |
| Verify snapshots | Disabled | Verification is backend-driven and writes report state. |
| Snapshots | Enabled | Opens local panel; no backend mutation by itself. |
| Refresh status | Enabled | Re-reads existing local/report state. |
| Run verification | Disabled | Backend verification is required. |
| Open report file | Enabled | Local file path only; should not be tied to service health. |
| Reveal | Enabled | Local path + OS file browser. |
| Manifest | Enabled | Local path + OS file browser. |
| Re-run verification for this snapshot | Disabled | Backend verification is required. |
| Create backup | Disabled | Backend backup creation is required. |
| Restore latest ZIP as copy | Disabled | Backend restore operation is required. |

## Timeout / Bridge Handling Audit
- `Request timed out after 45000ms.` is emitted by the shared bridge request wrapper in `preload.ts`.
- That timeout is not snapshot-specific.
- It is reused across bridge-backed writing-tool operations, so the banner and toast language must stay precise about what is actually unavailable.

## Coverage Audit
- Visible control families inventoried in Pass 15: 59
- Covered by Playwright: 19
- Covered by renderer/unit tests: 32
- Covered by truth lane: 3

## High-Risk Controls Still Uncovered
Still lacking stronger Playwright behavior coverage:
- `Open report file`
- `Reveal`
- `Manifest`
- `Re-run verification for this snapshot`
- `Refresh status`
- `Create backup`
- `Restore backup` row actions
- `Restore latest ZIP as copy`

Why they remain high risk:
- several are local-file or OS-open paths that are hard to assert through Playwright without brittle OS dialog assumptions,
- several are backend-gated and need dedicated success/failure assertions rather than visibility-only checks,
- the current truth lane covers only a small portion of the snapshot authority surface.

## Behavior Changes Made
- `Open report file` is no longer disabled purely because the service bridge is offline.
- The snapshots panel offline message now clarifies that snapshot browsing remains available.
- Renderer tests now prove the local report browser stays usable while services are offline.

## Label / Message Changes
- No control labels changed in this pass.
- The offline advisory copy changed to distinguish local snapshot browsing from backend-driven verification and backup actions.

## Validation Results
- `pnpm --filter app test -- AppSnapshotsVerification.test.tsx AppPreflight.test.tsx AppRestore.test.tsx AppRecovery.test.tsx` - passed
- `pnpm --filter app test` - passed
- `pnpm --filter app lint` - passed, with the existing ESLintRC deprecation warning
- `pnpm --filter app run build:production` - passed
- `pnpm --dir app exec playwright test tests/e2e/gui.snapshot_verification_flow.spec.ts -c ./playwright.config.ts` - passed
- `pnpm test:truth` - passed on rerun after clearing the transient port collision
- `pytest services/tests/test_snapshot_endpoints.py services/tests/test_backup_verifier_report.py services/tests/test_backup_snapshot_regressions.py` - passed
- `git diff --check` - passed

## Remaining Risks
- The default GUI still has a broad snapshot surface, and not every control is end-to-end behavior-verified.
- Playwright still does not assert the file-browser outcome for local open/reveal flows.
- The truth lane does not yet cover the snapshot/report controls at the same depth as the editorial workflows.

## Recommendation
Pass 14 human verification may resume from the snapshot section, but the operator checklist should still treat `Open report file`, `Reveal`, `Manifest`, and `Re-run verification for this snapshot` as the highest-risk remaining controls.
