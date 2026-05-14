Status: Produced
Canonical role: Audit and classification artifact for recovery, load, project-switch, and continuity seams before deeper implementation or memory-adjacent scaling work depends on them.
Scope: Classify continuity-related runtime surfaces by operational risk, authority-layer impact, cross-project contamination pressure, current ownership, and recommended follow-up.
Owns: Recovery/load/project-switch continuity risk classification for the audited surfaces; dependency summary for restore, memory, longform, intelligence, and broad `/goals`; ownership recommendation for any dedicated roadmap item created from this audit.
Does not own: Proof doctrine, phase sequencing, deferred-matrix ID governance beyond any new item explicitly added here, production implementation, test implementation, GUI redesign, or Phase 14 execution.
Upstream dependencies: [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md), [wrapper_launcher_cwd_audit.md](/C:/Dev/black-skies/docs/audits/phase14/wrapper_launcher_cwd_audit.md), [critique_intelligence_risk_allocation.md](/C:/Dev/black-skies/docs/audits/phase14/critique_intelligence_risk_allocation.md), [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md), [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md), [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md), [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md), [memory_runtime.md](/C:/Dev/black-skies/docs/specs/memory_runtime.md), [model_runtime.md](/C:/Dev/black-skies/docs/specs/model_runtime.md), [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md), [pane_lifecycle.md](/C:/Dev/black-skies/docs/specs/pane_lifecycle.md), and [draft_preview_contract.md](/C:/Dev/black-skies/docs/specs/draft_preview_contract.md)
Downstream dependencies: Future continuity hardening allocation, restore/load follow-up planning, preload/bridge continuity follow-up, memory and longform gating, and any later human-verification pass for project-switch continuity.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

# Recovery / Load / Project-Switch Continuity Audit

## Purpose

Continuity correctness is foundational for restore safety, memory carryover, longform continuation, critique/editorial stability, and any later runtime orchestration work.

Stale or cross-project state is not a cosmetic problem. It creates authority corruption risk when:

- the loaded root diverges from the canonical project identity
- persisted or local renderer state survives a project change incorrectly
- recovery or restore paths rehydrate partial state without current authority refresh
- harness-only preload controls hide continuity gaps that are not true in live runtime

This audit classifies continuity risk and allocates ownership.
It does not implement fixes.

## Evidence Inspected

Governance and audit inputs:

- [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md)
- [wrapper_launcher_cwd_audit.md](/C:/Dev/black-skies/docs/audits/phase14/wrapper_launcher_cwd_audit.md)
- [critique_intelligence_risk_allocation.md](/C:/Dev/black-skies/docs/audits/phase14/critique_intelligence_risk_allocation.md)
- [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md)
- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md)
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)

Runtime/spec inputs:

- [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md)
- [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md)
- [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
- [memory_runtime.md](/C:/Dev/black-skies/docs/specs/memory_runtime.md)
- [model_runtime.md](/C:/Dev/black-skies/docs/specs/model_runtime.md)
- [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md)
- [pane_lifecycle.md](/C:/Dev/black-skies/docs/specs/pane_lifecycle.md)
- [draft_preview_contract.md](/C:/Dev/black-skies/docs/specs/draft_preview_contract.md)
- [preload_hook_inventory_and_containment.md](/C:/Dev/black-skies/docs/reviews/preload_hook_inventory_and_containment.md)
- [stable_environment_confirmation.md](/C:/Dev/black-skies/docs/reviews/stable_environment_confirmation.md)
- [validation_failures_and_blockers.md](/C:/Dev/black-skies/docs/reviews/validation_failures_and_blockers.md)

Source and script surfaces inspected:

- [preload.ts](/C:/Dev/black-skies/app/main/preload.ts)
- [ProjectHome.tsx](/C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx)
- [App.tsx](/C:/Dev/black-skies/app/renderer/App.tsx)
- [useRecovery.ts](/C:/Dev/black-skies/app/renderer/hooks/useRecovery.ts)
- [draftPreviewSync.ts](/C:/Dev/black-skies/app/renderer/utils/draftPreviewSync.ts)
- [actions.mjs](/C:/Dev/black-skies/app/renderer/recovery/actions.mjs)

Search surfaces inspected:

- repo searches for `project load`, `project switch`, `switchProject`, `loadProject`, `recent project`, `workspace`, `continuity`, `reload`, `refresh`, `recovery`, `restore`, `snapshot`, `freshness`, `stale`, `alias`, `Esther_Estate`, `proj_esther_estate`, `preload`, `bridge`, `renderer`, `state`, `persist`, `persistence`, `memory`, `continuation`, `session`, `startup`, `bootstrap`, `hydration`, `cache`, `restore latest`, `materialize`, `reveal`, `project root`, `setDevProjectPath`, and `overrideServices`

Missing or weak evidence:

- No fresh human-verification rerun exists for recovery/load/project-switch continuity after governance acceptance.
- Harness-only recovery markers and startup overrides remain documented, but this pass does not rerun them.
- Latest green GitHub workflow state is still not locally repo-provable by this pass alone.

## Operational Classification Model

- `Trusted`
- `Partially trusted`
- `Observed risk`
- `Governance-only`
- `Deferred future`

Authority layers interpreted from the authority strategy:

- `A1` real filesystem/runtime
- `A2` real backend service
- `A3` canonical persisted records
- `A4` renderer/UI state
- `A5` harness/fixture state
- `A6` synthetic mode
- `A7` mock/stub behavior

## Continuity Audit Table

| Surface | Evidence found | Risk class | Authority layers affected | Known or likely continuity failure | Cross-project contamination risk | Runtime impact | Existing owner/RDM | Recommended owner phase | Recommended next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| project-load continuity | [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md) still marks `project_load` as `mixed`; [ProjectHome.tsx](/C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx) carries bootstrap, recent-project, fallback, and reopen load paths | Observed risk | `A1`, `A3`, `A4` | load success can still depend on which path source supplied the root and whether stale local state was cleared correctly | High | High | `RDM-ALIAS-001`, `RDM-RISK-001` | Phase 15 | Create dedicated continuity ownership and treat project-load as broader than alias drift alone |
| project-switch continuity | [pane_lifecycle.md](/C:/Dev/black-skies/docs/specs/pane_lifecycle.md) explicitly warns about stale panes on project switch; tracker history records floated-pane project-switch regressions and deferred E2E coverage | Observed risk | `A3`, `A4`, `A5` | active scene, draft-preview sync, critique state, and hidden panes can retain state from the previous project if rebinding is missed | High | High | `RDM-ALIAS-001`, `RDM-RISK-001` | Phase 15 with later Phase 17 support | Allocate dedicated continuity item and plan later human-verification coverage |
| recent-project behavior | [ProjectHome.tsx](/C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx) persists recents and last-project path in localStorage and prunes stale entries heuristically | Partially trusted | `A3`, `A4` | local recent-path memory can reference stale or invalid roots and influence reopen/fallback behavior | Medium | Medium | none direct | Phase 15 | Keep as part of the continuity item, not a separate backlog branch |
| preload/renderer continuity | [preload.ts](/C:/Dev/black-skies/app/main/preload.ts) exposes harness-only startup config, recovery markers, `setDevProjectPath`, and `overrideServices`; [App.tsx](/C:/Dev/black-skies/app/renderer/App.tsx) responds to those surfaces | Observed risk | `A4`, `A5`, `A6`, `A7` | preload and renderer can agree on harness-only continuity state that does not represent live runtime continuity truth | High | High | `RDM-WRAPPER-001`, `RDM-HARNESS-001` | Phase 16 with continuity dependency notes in Phase 15 | Treat preload/bridge continuity as adjacent but not identical to wrapper/CWD risk |
| snapshot freshness refresh | [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md) and [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md) already classify stale/report freshness as unresolved | Partially trusted | `A1`, `A2`, `A3`, `A4` | refreshed state can remain historical-only or path-divergent if continuity and loaded-root state do not agree | Medium | High | `RDM-SNAP-001`, `RDM-SNAP-002` | Phase 14 and Phase 15 | Keep as a dependency edge from continuity into snapshot authority and restore |
| recovery/load behavior | [capability_truth_matrix.md](/C:/Dev/black-skies/docs/specs/capability_truth_matrix.md) marks recovery authoritative, but [useRecovery.ts](/C:/Dev/black-skies/app/renderer/hooks/useRecovery.ts) still coordinates multiple renderer and persisted-state transitions | Partially trusted | `A2`, `A3`, `A4` | authoritative recovery route can still be wrapped by renderer continuity state that has not been fully revalidated after switch/reopen paths | Medium | High | `RDM-RESTORE-001`, `RDM-BACKUP-001`, `RDM-RISK-001` | Phase 15 | Treat route truth as stronger than end-to-end continuity truth; do not overclaim |
| restore-latest continuity | [preload.ts](/C:/Dev/black-skies/app/main/preload.ts) exposes `restoreSnapshot` and `restoreFromZip`; snapshot vocabulary spec explicitly keeps restore out of `14A.1` scope | Observed risk | `A1`, `A2`, `A4` | restore-latest can succeed or fail against a continuity model that still has unresolved loaded-root, stale-report, or reopen state assumptions | High | High | `RDM-RESTORE-001`, `RDM-BACKUP-001`, `RDM-BROWSE-001` | Phase 15 | Keep restore-latest continuity as a major gate before memory or orchestration scaling |
| alias/root continuity | tracker and handoff docs continue to record `Esther_Estate` versus `proj_esther_estate` drift; [ProjectHome.tsx](/C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx) and fixture docs still show multiple root forms | Observed risk | `A1`, `A3`, `A4`, `A5` | one root can load while reports, snapshots, or recents point at another representation of the same project identity | High | High | `RDM-ALIAS-001` | Phase 14 and Phase 15 | Keep alias-root semantics separate but make continuity depend on their eventual decision |
| persistence continuity | [draftPreviewSync.ts](/C:/Dev/black-skies/app/renderer/utils/draftPreviewSync.ts) keys live state by project path; [App.tsx](/C:/Dev/black-skies/app/renderer/App.tsx) hydrates and writes draft preview sync on storage events | Observed risk | `A3`, `A4` | persisted draft-preview state can be replayed across reload/floating contexts if project-path identity or hydration discipline is wrong | High | High | none direct | Phase 15 with Phase 17 support | Add explicit continuity ownership instead of assuming draft-preview sync is harmless renderer trivia |
| startup/bootstrap continuity | [ProjectHome.tsx](/C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx) auto-loads the sample project unless suppressed; [App.tsx](/C:/Dev/black-skies/app/renderer/App.tsx) seeds project summary defaults in some test/startup paths | Partially trusted | `A1`, `A3`, `A4`, `A5` | bootstrap fallback can mask an invalid last project or create different continuity expectations across normal, harness, and floating hosts | Medium | Medium | `RDM-WRAPPER-001`, `RDM-HARNESS-001` | Phase 15 with wrapper dependency | Keep bootstrap behavior inside continuity scope because it selects the initial authority chain |
| renderer hydration assumptions | [App.tsx](/C:/Dev/black-skies/app/renderer/App.tsx) gates actions on `data-project-loaded`, hydrates draft preview state, and merges floating-pane draft state | Observed risk | `A3`, `A4` | renderer can believe a project is ready because markers and hydrated local state exist even when deeper continuity assumptions remain mixed | High | High | none direct | Phase 15 and Phase 17 | Treat renderer hydration as a real continuity seam, not only a UI implementation detail |
| cache/session continuity | localStorage-backed recents, last-project, and draft-preview sync survive reload and cross-window storage events | Observed risk | `A3`, `A4` | cached or session-like renderer state can outlive the authoritative project root and pollute reload or reopen behavior | High | High | none direct | Phase 15 | Keep as part of `RDM-CONTINUITY-001`; do not split yet |
| materialized fixture continuity | fixture docs and tracker history show `Esther_Estate` and `proj_esther_estate` materialization serving different lanes with historical snapshot structures | Partially trusted | `A1`, `A5`, `A6` | harness continuity may appear valid because fixture roots were materialized compatibly, while live project continuity remains less certain | Medium | Medium | `RDM-HARNESS-001`, `RDM-WRAPPER-001` | Phase 16 | Keep fixture continuity as a harness realism dependency, not runtime closure |
| bridge state continuity | [preload.ts](/C:/Dev/black-skies/app/main/preload.ts) exposes project-loader, service, diagnostics, and layout bridges; [useRecovery.ts](/C:/Dev/black-skies/app/renderer/hooks/useRecovery.ts) assumes bridge availability and state sequencing | Partially trusted | `A2`, `A4`, `A5` | bridge availability, route truth, and renderer state can fall out of sync during reload or reopen transitions | Medium | Medium | `RDM-WRAPPER-001`, `RDM-HARNESS-001` | Phase 15 with later preload audit | Related to preload/bridge risk, but continuity-specific because it spans rebind and state carryover |

## Human Verification Interpretation

### What continuity issues were actually observed historically

- tracker history already records alias-root drift, loaded-root mismatch, and project-local fixture identity confusion
- tracker history also records floated-pane project-switch regressions and stale-state coverage added at renderer level when the Playwright path proved too brittle
- snapshot/report authority work repeatedly exposed continuity-adjacent contradictions where one root or one persisted record path looked valid while another continuity surface disagreed

### What remains unverified

- no fresh manual pass confirms that recent-project reopen, reload-from-disk, floating-pane reload, and recovery banner paths stay clean across multiple project changes
- no fresh human-verification pass confirms that continuity-sensitive panes clear or rebind correctly after alias-root transitions
- no fresh runtime evidence confirms that localStorage-backed draft-preview state cannot bleed across project-switch edge cases

### What may be hidden by harness or synthetic behavior

- harness-only startup config, recovery markers, and service overrides can force continuity-looking state in ways the live runtime does not
- fixture materialization can make cross-root continuity look healthier than it is by seeding both aliases or both snapshot layouts
- truth lane proves narrow recovery route truth, not whole renderer or cross-window continuity truth

### What future systems depend on this area

- restore and backup authority
- memory persistence and carryover correctness
- longform continuation
- critique/editorial confidence when draft and project identity must remain stable
- future orchestration, multi-window, and broad implementation `/goals`

## Dependency Analysis

### Relationship to restore semantics

Restore semantics depend on continuity correctness because restore targets, latest-snapshot selection, and post-restore rebind behavior can all be wrong even when the backend route itself is sound.

### Relationship to memory systems

Memory systems depend on continuity correctness more directly than snapshot vocabulary alone. If project identity, last-loaded root, or carried draft state is wrong, memory persistence and advisory context can bind to the wrong story state.

### Relationship to longform continuation

Longform continuation should remain provisional while continuity confidence is partial. Continuation assumes stable project identity, scene continuity, and reliable reload/reopen semantics.

### Relationship to intelligence/editorial confidence

Critique and rewrite confidence depend on continuity because advisory/editorial state should not survive project or scene changes incorrectly. Continuity is a prerequisite for treating editorial-runtime confidence as more than route truth.

### Relationship to future `/goals`

Broad implementation `/goals` should not assume continuity correctness yet. Multi-surface campaigns amplify exactly the risks this audit found:

- project identity drift
- cached local renderer state
- floating-pane rebinding gaps
- harness-only recovery and startup shortcuts

## RDM Recommendation

Evidence supports a dedicated roadmap item.

Recommended item:

- `RDM-CONTINUITY-001`
- Title: `Recovery / load / project-switch continuity confidence`
- Severity: `S1 Closure-critical`
- Ownership: `Backend/runtime / Electron/preload / Renderer/UI`
- Future phase: `Phase 15`
- Future pass/slice: `recovery/load/project-switch continuity hardening`

Rationale:

- continuity is broader than `RDM-ALIAS-001`, `RDM-RESTORE-001`, or `RDM-WRAPPER-001`
- future memory, longform, and intelligence systems depend on it heavily
- current evidence is strong enough to justify explicit ownership now instead of treating continuity as a side-effect of restore or alias cleanup

## `/goals` Impact

Safe continuity-related `/goals` scope now:

- docs/spec/governance planning
- read-only continuity audits
- bounded ownership and dependency-allocation passes
- narrow command verification with explicit root, shell, and project-path assumptions

Unsafe scope now:

- broad implementation `/goals` spanning restore, preload, renderer, and memory surfaces together
- campaigns that assume project reload, recent-project reopen, floating-pane hydration, and recovery state all share one trustworthy continuity model
- any rollout that treats harness continuity markers or localStorage hydration as runtime truth

Required guardrails:

- explicit project root and project identity for commands and audits
- explicit statement of whether evidence comes from real runtime, persisted local renderer state, or harness overrides
- explicit note when floating-pane or storage-event behavior is relevant
- no broad implementation `/goals` that rely on continuity-heavy paths until continuity hardening is planned or risk-accepted

Current recommendation:

- broad implementation `/goals` should wait for continuity hardening or explicit risk acceptance

## Open Questions for Operator

- Should continuity become a formal pre-memory gate?
- Should project-switch continuity receive dedicated human verification?
- Should restore-latest continuity be validated before memory systems evolve?
- Should preload/bridge continuity receive its own later audit?
- Should cache/session assumptions be treated as observed risk until proven otherwise?
