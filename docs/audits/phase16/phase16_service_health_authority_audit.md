Canonical role: Phase 16 service and health-state authority audit.
Scope: classify what the health banner, status pill, and action gating actually mean relative to backend availability and local-only functionality.
Owns: health-state authority mapping, label accuracy, and deferred GUI debt classification.
Does not own: status-system modernization, global copy cleanup, or control-surface redesign.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 16 Service / Health State Authority Audit

## Source Evidence Used

- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/App.tsx`
- `docs/audits/phase15/phase15_closure_review.md`
- `docs/audits/phase14/phase14d_closure_audit.md`

## Authority Matrix

| Surface | What it really means | Label accuracy | Can it block trust proof? | Phase 17 GUI debt? | Phase 16 blocker? |
| --- | --- | --- | --- | --- | --- |
| Service polling in `useServiceHealth` | Polls the backend and records reachability | Accurate | Yes, if the poll result is used as the only proof of runtime health | No | No |
| Status pill `Checking writing tools` | Health check is in flight or the UI is waiting on a health result | Mostly accurate for a poll, but not a product-wide truth | Yes if interpreted as "all writing tools are unavailable" | Yes | Only if the label is used as broad authority proof |
| Status pill `Writing tools offline` | Backend is unreachable or forced offline in the current session | Accurate for reachability, but broad in wording | Yes if an operator reads it as a total product outage | Yes | No by itself |
| Status pill `Writing tools port unavailable` | The configured API port is missing or wrong | Accurate | Yes, because it justifies action gating | No | No |
| Health banner `Writing tools offline` | The service port is unavailable or the test harness has forced offline state | Mostly accurate, but still broad | Yes when the banner is treated as a generic product-state claim | Yes | No |
| `SnapshotsPanel` backendUnavailable gating | Backup, restore, and verification actions are gated on actual backend availability | Accurate | Yes, because it prevents false-clicks on unavailable routes | No | No |
| Local snapshot browsing | File browsing of snapshots, manifests, and verification records is local-only | Accurate | Low; browsing is not validity proof | No | No |
| Backup / restore controls while backend is offline | Disabled or warned against using the unavailable service | Accurate | Yes, because these are the closure-critical actions | No | No |
| Generation / critique controls while backend is offline | Disabled by service-health state and budget gates | Accurate | Moderate | No | No |

## Findings

- The underlying gating logic is better than the global wording. The UI usually disables the right controls when the backend is unavailable.
- The global `Writing tools offline` and `Checking writing tools` phrases still flatten distinct states into one broad label.
- That flattening is misleading but not, by itself, a Phase 16 runtime blocker.
- The misleading labels become a proof problem only if the operator is asked to treat them as evidence that backup/restore, local browsing, or snapshot verification are all equally unavailable.

## Classification

- `Label is accurate`: backend port unavailability, local-only browsing, and disabled backup/restore gating.
- `Label is misleading but non-blocking`: the global health banner and pill wording.
- `Label can block trust proof`: yes, if the label is treated as a product-wide outage rather than a backend reachability signal.
- `Phase 17 GUI debt`: yes, for wording simplification and control-surface cleanup.
- `Phase 16 blocker`: no, unless a later proof attempt depends on the wording being trusted as a runtime claim.

## Closure Impact

- Phase 16 can document the mismatch without fixing it.
- The current wording should not be used as the proof basis for backup/restore or recovery/reopen closure.
- The issue stays deferred to Phase 17 unless it becomes the only remaining explanation for a trust claim the operator needs to make.
