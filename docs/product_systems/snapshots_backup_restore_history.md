# Snapshots / Backup / Restore / History

## 1. Status Header

- Dossier name: `Snapshots / Backup / Restore / History`
- Status: `drafted`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-10`
- Depends on: `Writing Surface`, `Narrative Insertion / Narrative Assertion`
- Feeds into: all storage-bearing systems
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `yes`

## 2. Purpose

Define recovery, backup, restore, and history support so the app can preserve user work and recover safely without turning system history into story truth authority.

This dossier inherits recovery-mode and protection-preservation doctrine from `snapshot_protected_recovery_contract.md`, protected-content rules from `protected_content_permission_matrix.md`, provenance posture from `provenance_state_model.md`, degraded execution rules from `degraded_mode_execution_contract.md`, and ownership limits from `truth_and_state_ownership_matrix.md`.

## 3. User Problem Solved

The writer needs confidence that work can be recovered without losing clarity about what content is current, accepted, deleted, or historical.

## 4. What The System Does

- capture recoverable history,
- support backup and governed restore modes such as preview-only, read-only, restore-as-copy, restore-as-candidate, restore-as-staged-object, and restore-as-current,
- preserve bounded change history.

## 5. What The System Does Not Do

- decide truth,
- silently resurrect deleted truth as current canon,
- blur current accepted state with historical snapshots,
- silently recreate notes, signals, memory, or protected raw content just because it existed historically.

## 6. User-Facing Behavior

Visible behavior should emphasize recovery, comparison, explicit restore choices, and a clear distinction between current save state and historical recovery artifacts.

## 7. Hidden/Background Behavior

Background snapshotting may exist, but must remain governed and recoverable.
Snapshots support recovery and history, but they must not become a substitute for clear current save-state behavior.
`Project Persistence / Local Save` owns confirmed current-save truth.

## 8. What Appears First

- current recovery status,
- restore entry points when needed,
- recent history only when relevant.

## 9. What Is Summonable

- deeper history,
- backup detail,
- restore comparisons.

## 10. What Is Hidden Until Needed

- dense snapshot internals,
- raw operational logs,
- low-value history clutter.

## 11. Inputs

- project state,
- manuscript state,
- author actions,
- system health events.

## 12. Outputs

- snapshots,
- restore options,
- preview, read-only, copy, candidate, staged, comparison, or current-restore paths when allowed,
- history views,
- recovery status.

## 13. Which Other Systems Consume Those Outputs

- all storage-bearing systems

## 14. What Gets Stored

- snapshots,
- recovery metadata,
- restore markers,
- bounded history records.

## 15. What Remains Temporary

- current-session recovery state,
- transient restore previews.

## 16. Relationship To Narrative Insertion / Assertion

Snapshots preserve prior state but do not define current accepted truth by themselves.

## 17. Relationship To Story Units

Story Unit state may be restorable only as part of broader recovery rules.

## 18. Relationship To Prose / Scene Projection

Projection states may be recoverable but remain distinct from accepted manuscript state.

## 19. Relationship To Writing Surface

Recovery must preserve direct writing, avoid confusing restore previews with current text, and support crash or restart recovery without turning recovery artifacts into hidden canon.

## 20. Relationship To Command Center Surface

Heavier history and restore review may belong in the Command Center.

## 21. GUI Placement Principles

Keep recovery discoverable without making history the default writing surface.

## 22. Local LLM Role

Not required for core recovery behavior.

## 23. Paid API Role

Not required for core recovery behavior.

## 24. Model Routing Notes And Cost / Budget Impact

None by default.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Snapshots and backups must respect local-only and protected-content boundaries.
Recovery does not erase `hidden`, `masked`, `deleted`, `discarded`, `forgotten`, `AI-excluded`, `local-only`, `export-blocked`, or `transfer-blocked` posture.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Deleted, hidden, masked, or excluded material requires careful recovery rules.
Historical existence does not make those materials current again by default.

## 27. Testing Requirements

Prove restore, undo, and history views preserve clear current-versus-historical boundaries.

## 28. Governance Rules And Risks

- no history-as-canon,
- no snapshots-as-save-state-authority,
- no unsafe restore ambiguity,
- no protected-data leakage,
- restore-as-current is the highest-risk recovery action and requires governed approval,
- historical evidence is not current truth authority.

## 29. Failure Modes

If history fails, current work must remain safe and recoverable where possible.
Recovery failure must not imply that snapshot artifacts become the new manuscript truth by default.
Read-only, repair-first, comparison, or restore-as-copy fallback should be preferred over unsafe restore-as-current.

## 30. v1 Boundary

Basic snapshots, restore, and bounded history.

## 31. v2 Boundary

Richer comparisons and recovery controls.

## 32. Future-Only Boundary

Deep time-travel editing models.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from recovery, sync-history, import, and crash-loop questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `4 Critical`, `2 Major`

### Fatal Questions

- None currently. The architecture suite now answers the prior cross-system Fatal question about protected recovery, historical-state authority, and restore-as-current governance. Remaining blockers are narrower implementation-shaping Critical and Future contract questions.

### Critical Questions

- Future contract need: what exact recoverable object bundles should early snapshots capture together versus separately across manuscript text, accepted assertions, projection state, Story Unit state, notes, signals, memory, and support metadata, and what remains historical only?
- Critical: which actions require a snapshot or backup first, especially import, sync-like transfer, restore, or destructive operations that can damage current work?
- Critical: what safe recovery path exists if snapshot restore fails, causes a crash loop, or can only reopen a project in read-only, repair-first, or recovery-first mode?
- Critical: what anchor-repair rules must govern restored notes, signals, or other linked support objects when their original ranges are stale, deleted, or structurally changed?
- Future contract need: what exact boundary separates current save state from snapshot or recovery history so authors can recover recent work after crash or restart without mistaking recovery artifacts for accepted story truth?

### Major Questions

- Major: how much history should be visible by default, and should resolved or superseded restore events remain visible as history without crowding everyday writing?
- Major: which non-manuscript events belong in history at all, such as revision history, export history, sync history, or setup-answer history?

### Minor Questions

- Minor: what user-facing language best separates backup, snapshot, restore, recovery, and history?

### Answered / Superseded Questions

- Historical state is not automatic current truth.
- Restore previews and history views must remain visibly distinct from current accepted state.
- Protected-content boundaries still apply to snapshots, restore previews, and backup artifacts.
- Answered / Superseded: snapshots are historical evidence and recovery support, not truth authority.
- Answered / Superseded: restore-as-current is the highest-risk recovery path and requires explicit governed approval rather than silent replay.
- Answered / Superseded: restore-as-copy, preview-only, read-only, candidate, staged, comparison, and evidence-oriented recovery are valid governed modes.
- Answered / Superseded: hidden, masked, deleted, discarded, forgotten, AI-excluded, and local-only states survive recovery rather than being erased by historical presence.
- Answered / Superseded: historical existence does not automatically recreate current truth, notes, signals, memory, or export eligibility.
- Answered / Superseded: `Project Persistence / Local Save` owns
  confirmed current-save truth; snapshots may consume that state as
  input but do not prove it.
- Snapshots support recovery and history, not Google Docs sync, cloud sync, or document-interchange authority.
- Questions better owned elsewhere: exact import/export/sync behavior belongs primarily to the future import/export dossier.

### Deferred Questions

- Deferred: exact retention windows, storage limits, and pruning policy.

## 34. Acceptance Criteria

Implementation remains blocked by open Critical and Future contract questions.
This dossier is acceptable only if recovery remains safe, explicit, and non-authoritative.
