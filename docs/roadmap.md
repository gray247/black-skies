Status: Active roadmap / status authority, not runtime authority
Version: 1.1.0
Last Reviewed: 2026-05-06

# Roadmap

Authority note: this file is the single planning and status authority for phase progress.
It is not runtime authority. For runtime truth, use `build/runtime_truth.json` and `docs/specs/current_state.md`.

Related planning docs:
- Scope authority: `docs/phases/phase_charter.md`
- History-only ledger: `docs/phases/phase_log.md`

## Status legend
| Label | Meaning |
| :---- | :------ |
| Planned | Scoped but not yet code-backed. |
| In progress | Active implementation with meaningful open work. |
| Partial | Code-backed implementation exists, but phase goals are incomplete or behind flags/advisory paths. |
| Complete | Landed and verified against runtime/code/tests. |
| Stale claim | Prior doc claim does not match current code/runtime truth. |

## Runtime-aware planning note
Later phases can be partially implemented in parallel. A phase marked `Partial` may include shipped seams, feature-flagged paths, advisory systems, or incomplete UI.

## Phase summary
| Phase | Name | Verified status | Runtime-aware summary |
| :---- | :---- | :-------------- | :-------------------- |
| P7 | Release candidate baseline | Complete | Core service and desktop baseline are landed and operational. |
| P8 | Insights and feedback expansion | Partial | Docking workspace, layout persistence, budget meter, batch critique, and rubric tooling are landed; floating-pane restore-on-load behavior remains intentionally non-restored. |
| P9 | Analytics and visualization | Partial | Analytics routes and backend metrics/budget surfaces are code-backed and baseline-enabled by maturity default; full dashboard productization remains open. |
| P10 | Accessibility and professional exports | Complete | Export surfaces are code-backed; accessibility toggle product surface and voice-note productization remain deferred/non-baseline, but Phase 10 stabilization is closed. |
| P11 | Agents and plugins | Partial | Plugin and backup seams exist behind flags; advisory systems (fracture diagnostics and Canon Court) are landed as non-blocking diagnostics. |

## Phase detail

### P7 - Release candidate baseline (Complete)
Landed:
- Core API/runtime path in `services/src/blackskies/services/app.py`
- Runtime config and router seams in `services/src/blackskies/services/config.py`, `model_router.py`, and `model_routing.py`

Open:
- No major P7 runtime scope items remain.

### P8 - Insights and feedback expansion (Partial)
Landed:
- Docking workspace (`app/renderer/components/docking/DockWorkspace.tsx`)
- Layout persistence (`app/main/layoutIpc.ts`)
- Budget meter in workspace header (`app/renderer/components/WorkspaceHeader.tsx`)
- Batch critique and rubric editor (`app/renderer/components/CompanionOverlay.tsx`)

Open:
- Floating panes are currently not restored from persisted state on load; renderer intentionally clears persisted floating entries.
- Remaining accessibility/manual sign-off should be tracked as work items, not assumed complete.

### P9 - Analytics and visualization (Partial)
Landed:
- Analytics routes and runtime guards in `services/src/blackskies/services/routers/analytics.py`
- Default analytics maturity is production in `services/src/blackskies/services/feature_flags.py`
- Runtime truth lists analytics as baseline default on.

Open:
- Full dashboard/visualization product polish remains scope work.

### P10 - Accessibility and professional exports (Complete)
Landed:
- Export path and analytics export integration are code-backed.
- Keyboard/focus accessibility work exists in docking flows.

Deferred:
- No Phase 10 blockers remain.
- Accessibility toggle UI productization remains deferred outside the closed stabilization lane.
- Voice notes/transcription remain deferred (non-baseline with disabled seam metadata only).

### P11 - Agents and plugins (Partial)
Landed:
- Plugin seams and maturity flags exist (non-baseline by default).
- Backup verifier seam exists (off by default).
- Advisory diagnostics and contradiction review systems are landed (fracture diagnostics and Canon Court v1).

Open:
- Full plugin/agent operator product surface remains scoped future work.
- Smart merge remains deferred.

## Deferred feature references
- `docs/deferred/voice_notes_transcription.md`
- `docs/deferred/smart_merge_tool.md`
- `docs/gui/accessibility_toggles.md`

## Status discipline
If roadmap status and runtime truth diverge, update this file after validating:
1. `build/runtime_truth.json`
2. `docs/specs/current_state.md`
3. code/tests
