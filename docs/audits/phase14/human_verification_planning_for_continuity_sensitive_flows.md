# Human Verification Planning for Continuity-Sensitive Flows

Status: Produced
Canonical role: Planning artifact for future human verification of continuity-sensitive, authority-sensitive, and stale-state-sensitive runtime flows before deeper implementation alignment.
Scope: Define what must be manually verified, why automation is insufficient for the scoped flows, which authority layers matter, which stale-state hazards must be checked, and which future phases depend on those checks.
Owns: Human-verification planning for the scoped runtime flows and the operator-observed checkpoints required before deeper implementation confidence can be claimed.
Does not own: Runtime implementation, test implementation, Playwright coverage, proof doctrine, phase sequencing, or execution of the verification itself.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

## Purpose

Some authority and continuity claims cannot be trusted from harness-only or lane-scoped proof.

Stale-state corruption, project-switch contamination, floating-pane rebinding drift, preload/renderer disconnects, and cached renderer persistence all require human observation at the real runtime surface when the claim depends on what an operator actually sees and experiences.

Future restore, memory, longform, and intelligence/editorial work depends on continuity correctness. This artifact defines verification planning only. It does not execute verification.

## Evidence Inspected

- Audits:
  - `docs/audits/phase14/recovery_load_project_switch_continuity_audit.md`
  - `docs/audits/phase14/wrapper_launcher_cwd_audit.md`
  - `docs/audits/phase14/canonical_command_recipe_and_preflight.md`
  - `docs/audits/phase14/cross_system_operational_risk_sweep.md`
- Specs and roadmap artifacts:
  - `docs/specs/snapshot_state_vocabulary_and_evidence_contract.md`
  - `docs/roadmap/master_phase_allocation_plan.md`
  - `docs/roadmap/deferred_work_matrix.md`
  - `docs/roadmap/authority_reconciliation_strategy.md`
- Operational tracker:
  - `docs/BLACK_SKIES_FIX_TRACKER.md`
- Search surfaces:
  - `human verification`
  - `manual verification`
  - `continuity`
  - `project switch`
  - `restore latest`
  - `floating pane`
  - `reload`
  - `rebind`
  - `hydration`
  - `session`
  - `localStorage`
  - `cache`
  - `snapshot`
  - `stale`
  - `orphan`
  - `alias`
  - `degraded`
  - `restore`
  - `recovery`
  - `truth lane`
  - `synthetic`
  - `harness`
  - `serviceStubs`
  - `overrideServices`
  - `preload`
  - `bridge`
  - `renderer`
  - `freshness`
  - `draft preview`

## Why Human Verification Is Required

### Renderer truth versus filesystem truth

The renderer can display a coherent state at `A4` while the filesystem or runtime truth at `A1` and `A2` disagrees. Human verification is required whenever the operator-facing claim depends on whether a visible state is trustworthy rather than merely renderable.

### Persisted-record versus current-run ambiguity

Snapshot/report flows can now expose both:

- current runtime verification results
- persisted verification record reads

Those are not interchangeable. Human verification is required whenever operator-facing trust depends on knowing whether a visible claim is coming from a current runtime run, a historical record read, or renderer witness state alone.

### Stale-state risk

Cached `localStorage`, session persistence, recent-project state, and draft-preview continuity can make a flow appear healthy when it is only replaying stale renderer assumptions.

### Continuity corruption risk

Continuity-sensitive flows can fail without obvious backend crashes:

- wrong project still appears active
- recovery banner binds to the wrong root
- reloaded panes show stale or cross-project content
- persisted preview state rehydrates under the wrong authority context

### Project-switch contamination risk

Automation can prove a narrow route or button contract. It often cannot prove that all visible and persisted state was actually cleared, rebound, or refreshed correctly when the active project changes.

### Floating-pane and rebind risk

Floating panes, reopened panes, and renderer hydration paths can preserve stale bindings that only show up in a real operator session after reload, recovery, or root change.

### Preload and bridge continuity risk

Bridge availability, service reconnect behavior, diagnostics paths, and harness-only preload helpers can make a flow look stable in a scoped lane even when live rebind behavior remains mixed.

### localStorage and session persistence risk

Manual verification is required where cache, recent-project history, draft-preview state, or cross-window storage events could silently alter what the operator sees.

### Truth-lane overread risk

Truth lane is a narrow runtime lane. It is strong evidence for the scoped path, but it does not close broader continuity, GUI authority, or stale-state claims.

### Harness realism limitations

Harness modes, service overrides, synthetic flags, and fixture materialization are necessary for controlled testing. They are not substitutes for operator-observed runtime continuity when the claim is about visible trust, cross-project cleanliness, or recovery semantics.

## Human-Verification Categories

- `authority-sensitive`
  - visible claims that imply filesystem, backend, or persisted-record truth
- `continuity-sensitive`
  - load, reload, reopen, rebind, or cross-project flows
- `stale-state-sensitive`
  - flows that can be distorted by prior renderer, cache, or persisted local state
- `renderer-preload-sensitive`
  - flows where UI state depends on bridge availability or rebinding correctness
- `recovery-sensitive`
  - flows involving recovery banners, recovery routes, reopen behavior, or post-crash surfaces
- `restore-sensitive`
  - flows where operator-visible restore claims must match actual eligibility and current project identity
- `intelligence/editorial-sensitive`
  - flows where critique, draft preview, or editor-facing continuity depends on the correct active project and scene state

## Candidate Verification Flows

| Flow | Why automation alone is insufficient | Authority layers involved | Known risks | Required preconditions | Required stale-state handling | Future owner phase | Recommended verification timing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| project load | Narrow lanes can prove route health without proving the right project root and visible state loaded cleanly | `A1`, `A2`, `A3`, `A4` | wrong root, stale recent-project state, mixed load paths | canonical repo root, declared shell, declared project root, live runtime | verify recent-project and cached state assumptions before run | Phase 15 | after continuity-sensitive implementation changes and before closure claims |
| project switch | Automation may miss cross-project contamination in panes, preview state, or rendered summaries | `A1`, `A3`, `A4` | stale pane state, alias-root confusion, incorrect rebind | explicit source and target project identities | clear or record renderer/session persistence state before switch | Phase 15 | dedicated continuity checkpoint before broader restore/memory work |
| restore latest | Route truth alone does not prove visible project identity, rebound state, or stale-state cleanliness after restore | `A1`, `A2`, `A3`, `A4` | restore advertised too broadly, wrong target, stale post-restore UI | agreed restore contract, explicit fixture/project root | reset stale local state before and after restore when required | Phase 15 | after restore hardening work, before trust claims |
| recovery/reload | Harness recovery paths can hide live continuity gaps | `A2`, `A3`, `A4`, `A5` | recovery banner mismatch, stale resumed state, partial rehydrate | explicit runtime lane, explicit recovery scenario | record whether cache/session state was preserved or reset | Phase 15 | after recovery-alignment work and before closure |
| floating-pane reload/rebind | Floating pane correctness is historically brittle and not closed by route-level proof | `A3`, `A4` | stale pane content, wrong project context, failed rebind | floating-pane surface available in the scoped runtime | clear stale pane/session assumptions or preserve intentionally and record it | Phase 15 and Phase 17 | dedicated manual checkpoint |
| snapshot freshness refresh | UI and persisted report state can disagree with current filesystem/runtime truth | `A1`, `A2`, `A3`, `A4` | stale report shown as current, degraded copy mismatch | explicit snapshot/root scenario | do not inherit stale report context silently | Phase 14B and Phase 17 | after freshness semantics implementation |
| alias-root transition | Historical alias drift means route success is not enough | `A1`, `A3`, `A4` | `Esther_Estate` vs `proj_esther_estate` divergence, wrong loaded root | explicit alias/root setup | clear cached project identity before transition check | Phase 14B, Phase 15 | after alias/root handling changes |
| continuity after restart | Restart can reveal stale recent-project or persisted renderer assumptions not visible in-session | `A1`, `A3`, `A4` | wrong reopen target, bad draft-preview rehydrate, stale status | canonical launch recipe, explicit root, explicit lane | define whether persistence is expected to survive or be cleared | Phase 15 | before memory-heavy follow-up phases |
| continuity after crash/recovery | Crash-style flows stress recovery, persistence, and rebind semantics simultaneously | `A2`, `A3`, `A4`, `A5` | partial recovery state, stale previews, wrong pane restore | explicit recovery scenario and operator steps | reset or intentionally preserve persisted local state and record which | Phase 15 | after recovery hardening, before closure |
| critique/editorial continuity | Advisory/editorial confidence depends on the right project and scene state staying bound | `A2`, `A3`, `A4` | stale critique context, wrong scene/project continuity | explicit active project and scene context | clear stale preview/editorial state when needed | Phase 17 and Phase 20+ | after continuity improvements, before broader intelligence work |
| draft preview continuity | Preview persistence can survive reload or switch incorrectly | `A3`, `A4` | wrong draft preview after reopen/switch, stale localStorage | explicit preview scenario and project root | inspect/reset localStorage as part of the run plan | Phase 15 and Phase 17 | after continuity-sensitive renderer changes |
| preload/renderer rebinding | Harness-only proof does not close live bridge rebind correctness | `A2`, `A4`, `A5` | bridge reconnect mismatch, stale diagnostics or recovery state | explicit runtime lane, no hidden overrides | disclose any overrides and avoid hidden harness carryover | Phase 15 with later preload follow-up | after bridge-sensitive changes |
| localStorage/session reset behavior | Automation can clear state intentionally and mask how the product behaves when stale state exists | `A3`, `A4` | hidden cache contamination, false clean start assumptions | explicit clean-state or dirty-state scenario | state-reset discipline must be declared in the receipt | Phase 15 and Phase 17 | as a prerequisite for all continuity-sensitive manual bundles |

## Verification Environment Requirements

- canonical repo root expectations:
  - run from `C:\Dev\black-skies` unless a lane explicitly requires another root
- shell expectations:
  - declare PowerShell versus bash when shell behavior matters
- clean/dirty worktree expectations:
  - verification receipt must state whether the worktree was clean or intentionally dirty
- localStorage/session handling:
  - receipt must state whether local renderer state was cleared, preserved, or intentionally seeded
- fixture assumptions:
  - receipt must state whether the flow used sample fixtures, materialized fixtures, or a real local project
- synthetic/harness disclosure requirements:
  - receipt must disclose `serviceStubs`, `overrideServices`, synthetic mode, truth lane, or harness-only hooks
- explicit lane labeling:
  - each manual run must say whether it is runtime, truth-lane-adjacent, harness-assisted, or operator-only
- explicit authority-layer labeling:
  - each checked claim should name the authority layers it is trying to validate or witness

## Relationship To Future Phases

### Phase 14A.1 implementation

`Phase 14A.1` defines vocabulary and evidence-contract semantics. Human verification is not executed in that planning slice, but the slice should preserve terms that make later manual checks legible.

### Phase 14B alignment

`Phase 14B` will start changing behavior. Human verification planning is needed now so those changes do not claim closure from harness or lane-scoped proof alone.

### Phase 15 restore and continuity work

This is the heaviest dependency. Restore/latest, recovery, project-load, project-switch, restart, and stale-state handling all depend on manual checkpoints before closure-grade confidence can be claimed.

### Phase 16 harness realism

Manual verification planning defines where harness realism stops being enough. Phase 16 should use that boundary to avoid overclaiming from synthetic or fixture lanes.

### Phase 17 GUI authority simplification

GUI copy, degraded-state semantics, and operator-facing controls need manual checks because the visible claim itself is part of the contract.

### Phase 20+ memory, longform, and intelligence work

These phases depend on continuity correctness more than current planning confidence suggests. Human verification should become a gate before treating those systems as ready for broader implementation scaling.

## Verification Doctrine Recommendations

- create future human-verification checkpoints at:
  - post-`14B` continuity-sensitive behavior changes
  - pre-Phase 15 closure
  - pre-memory or pre-longform scaling
- bundle continuity-sensitive checks instead of scattering them:
  - project load
  - project switch
  - restart/reopen
  - recovery/reload
  - stale-state reset behavior
- require authority-layer labeling in the manual receipt
- require stale-state reset discipline in the manual receipt
- require screenshot or notes evidence only as operator-observed receipts unless intentionally converted into committed audit evidence
- require a brief manual verification receipt naming:
  - runtime lane
  - project/root identity
  - stale-state handling
  - whether the claim came from a current runtime run, persisted verification record, renderer witness state, or a mixed surface
  - observed result
  - contradictions found

## `/goals` Impact

### Safe verification-related `/goals`

- docs-only verification planning
- read-only audit consolidation
- receipt-template planning
- bounded command-discipline and preflight planning

### Unsafe verification-related `/goals`

- autonomous claims that continuity-sensitive or authority-sensitive flows are verified without operator observation
- broad implementation `/goals` that proceed past a known human-verification checkpoint without stopping
- campaigns that treat truth-lane or harness success as a substitute for manual continuity validation

### What must remain operator-observed

- project-switch cleanliness
- floating-pane reload and rebind correctness
- continuity after restart or recovery
- restore-latest visible trust behavior
- stale-state reset outcomes when user-visible trust is the claim

### Where autonomous execution should stop

Autonomous execution should stop when the next claim depends on whether the operator-facing runtime actually stayed clean, rebound correctly, or avoided stale-state contamination.

## Open Questions For Operator

1. Should continuity-sensitive verification become a formal gate before memory work?
2. Should floating-pane reload/rebind receive dedicated manual verification?
3. Should restore-latest verification require stale-state reset discipline every time?
4. Should future implementation `/goals` stop automatically before human-verification checkpoints?
