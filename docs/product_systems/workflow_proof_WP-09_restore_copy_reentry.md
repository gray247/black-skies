# Workflow Proof WP-09 - Restore, Restore-as-Copy, and Recovery Re-entry

## Status

Status: Passed with Bounded Follow-up
- Draft complete
- Official result recorded
- Bounded follow-up routed to Stage 9 and Stage 10

## Author Goal

Show that recovery inspection, restore-as-current, restore-as-copy, and recovery re-entry remain explicit, governed, and distinct from accepted manuscript truth.

## Scope

This proof covers inspection of recoverable state, comparison with current work, governed restore decisions, re-entry after recovery, and failure or partial-recovery handling.
It proves the boundary between current save state, snapshots, history, backups, archives, exports, restored copies, and restored current work.
It does not prove backup format, integrity algorithms, rollback mechanics, or operational restore implementation.

## Preconditions

- A current project or workspace already exists.
- At least one recoverable artifact exists or is inspectable.
- The author can compare current work with recoverable state.
- Recoverable state may include snapshot, historical version, application backup, portable project archive, or publication export artifacts, but only governed recovery artifacts may be offered for restore.

## Initiating Actor and Surface

- Initiating actor: author
- Initiating surface: Writing Surface or Command Center Surface, depending on where recovery is surfaced

## Participating Systems

- Snapshots / Backup / Restore / History
- Project Persistence / Local Save
- Save-State And Degraded-Writing Workflow
- Writing Surface
- Command Center Surface
- Project Index / Search / Retrieval
- Authorship Provenance AI Visibility
- Narrative Insertion / Narrative Assertion
- Import / Export / Document Interchange

## Source Owner

- Snapshots / Backup / Restore / History, with current-save confirmation still owned by Project Persistence / Local Save

## Destination Owner

- Project Persistence / Local Save for restore-as-current confirmation
- Writing Surface for resumed writing after recovery
- Snapshots / Backup / Restore / History for copy and recovery records

## Objects Read

- current saved state
- autosave state
- snapshot
- historical version
- application backup
- portable project archive
- publication export
- restore candidate
- provenance record
- verification result
- current work and recoverable work comparison

## Objects Created

- comparison view
- recovery session
- restore-as-copy result
- restored current-project state only if explicitly approved
- verification record
- failure, stale, or cancellation record where applicable

## Objects Transformed or Routed

- current and recoverable state routed into comparison
- restore candidate routed to governed restore mode
- restore-as-copy routed to a separate copy path
- restore-as-current routed to current-save replacement only when explicitly approved
- recovery session routed back into ordinary writing when the author re-enters the Writing Surface

## Required Distinctions

- current saved state
- autosave state
- snapshot
- historical version
- application backup
- portable project archive
- publication export
- restore candidate
- restored copy
- restored current project
- recovery session
- manuscript truth
- accepted planning truth
- provenance record
- verification result

## Path Matrix

| Path | State before | Actor | Owner responsible | Action | Object produced or changed | Truth mutation | Approval required | Author-visible result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Author opens recovery or history inspection | Project exists and recovery may be relevant | Author | Snapshots / Backup / Restore / History | Open recovery view | Recovery inspection context | No | No | Recovery entry points become visible |
| 2. Recoverable source is identified | Recovery view open | System | Snapshots / Backup / Restore / History | Select candidate source | Restore candidate | No | No | Candidate source appears |
| 3. Source type is shown | Candidate visible | System | Source owner remains original owner | Label source kind | Source-type label | No | No | Snapshot, history, backup, archive, or export identity stays visible |
| 4. Source timestamp/currentness is shown | Candidate visible | System | Source owner | Display currentness | Timestamp or freshness cue | No | No | Author sees age and freshness |
| 5. Source ownership and provenance are shown | Candidate visible | System | Source owner and provenance owner | Display ownership trail | Provenance view | No | No | Ownership and provenance remain visible |
| 6. Author compares recoverable source with current state | Comparison available | Author | Snapshots / Backup / Restore / History | Compare states | Comparison result | No | No | Differences are visible before any restore |
| 7. Author cancels without restoring | Comparison visible | Author | None | Cancel recovery | Cancellation record | No | No | No restore occurs |
| 8. Author leaves source for later | Comparison visible | Author | None | Defer decision | Deferred recovery state | No | No | Recovery remains available later |
| 9. Restore-as-copy | Recovery source chosen | Author | Snapshots / Backup / Restore / History | Create separate copy | Restored copy | No | Yes, governed restore choice | Current work stays intact |
| 10. Restore-as-current | Recovery source chosen | Author | Project Persistence / Local Save | Replace current durable project state | Restored current project | Yes, current-save mutation only | Yes, explicit author approval | Current state is visibly replaced |
| 11. Recovery re-entry without immediate restore | Recovery available | Author | Writing Surface | Return to work without restore | Recovery session continues | No | No | Author can write directly again |
| 12. Partial source availability | Some source material unavailable | System | Snapshots / Backup / Restore / History | Surface partial source | Partial recovery view | No | No | Incomplete source remains visible |
| 13. Corrupt or unreadable source | Candidate unreadable | System | Snapshots / Backup / Restore / History | Reject unreadable source for restore | Readability failure | No | No | Corruption or unreadability is visible |
| 14. Source copied but not yet verified | Copy created | System | Snapshots / Backup / Restore / History | Stage copied data | Unverified restored copy | No | No | Copy exists but is not yet proven usable |
| 15. Verification succeeds | Verification run | System | Verification owner | Confirm result | Verification result | No | No | Success is visible and separate from creation |
| 16. Verification fails | Verification run | System | Verification owner | Report failure | Failed verification result | No | No | Failure is visible |
| 17. Restoration partially applies | Partial apply encountered | System | Restore owner | Apply some portions only | Partial restore | No | Yes if current state changes | Partial result stays explicit |
| 18. Restoration fails before mutation | Restore not yet mutating | System | Restore owner | Abort early | Failed restore | No | No | No current-state change occurs |
| 19. Restoration fails after partial mutation | Partial mutation occurred | System | Restore owner | Stop and report failure | Failed partial restore | Yes, partial mutation may already have occurred | Yes, if recovery path permits | Partial effect is visible, not hidden |
| 20. Author abandons failed recovery | Failure visible | Author | None | Leave recovery path | Abandoned recovery | No | No | Recovery stops cleanly |
| 21. Recovery source is newer than current state | Current work lags behind recoverable source | System | Snapshots / Backup / Restore / History | Surface the newer candidate | Newer recovery candidate | No | No | Author sees the source is newer rather than older |
| 22. Recovery source becomes stale relative to newer current work | Current work advanced after source capture | System | Snapshots / Backup / Restore / History | Mark stale comparison | Stale recovery marker | No | No | Staleness is visible |
| 23. Author inspects history but performs no mutation | History visible | Author | Snapshots / Backup / Restore / History | Inspect only | Inspection state | No | No | History remains non-mutating |
| 24. Restored state contains unresolved Notes, Signals, candidates, or findings | Historical work includes open items | System | Owner-specific systems remain owners | Surface open items as-is | Restored work with open items | No | No | Open items remain open |
| 25. Restored material contains historical or stale provenance | Historical provenance exists | System | Authorship Provenance AI Visibility | Preserve provenance context | Provenance-preserved restored state | No | No | Provenance remains visible |
| 26. Current work must remain preserved or recoverable before destructive replacement | Current work exists | Author | Project Persistence / Local Save | Review replacement safety | Protected current work posture | No | Yes, for restore-as-current | Current work is not silently lost |
| 27. Author re-enters Writing Surface after recovery | Recovery decision complete | Author | Writing Surface | Resume writing | Ordinary writing posture | No | No | Writing Surface remains sovereign |

## Must Prove

- inspection is non-mutating
- copying data is not proof of successful restore
- successful parsing is not proof of full recovery
- verification result remains visible
- restore-as-current and restore-as-copy remain distinct
- restore-as-current requires explicit author approval
- destructive replacement cannot be silent
- restore-as-copy does not replace current state
- recovery re-entry does not automatically accept historical content as current truth
- restored content retains provenance and source identity
- snapshot, history, backup, archive, export, and current save remain distinct
- restoring a project state does not silently convert findings, Notes, Signals, candidates, or historical records into accepted manuscript truth
- recovery does not gain manuscript-truth ownership
- partial restore is not reported as complete
- failed restore does not silently leave an apparently healthy current state
- current work remains visible or recoverable where doctrine requires
- Writing Surface remains the sovereign place for resumed manuscript work
- Command Center may surface recovery status but does not own recovery truth

## Special Mutation Question

Restore must be understood as governed replacement or copy creation, not as a shortcut into manuscript acceptance.
Replacing current durable project state changes persistence posture only when the current-save owner authorizes it.
Opening a historical project state for inspection does not accept it as current.
Creating a separate restored project copy does not replace current state.
Historical identity and provenance remain visible through the recovery owner and provenance owner.

## Provenance Checkpoints

- source type remains visible
- timestamp or currentness remains visible
- source owner remains visible
- provenance record remains visible
- verification result remains visible
- historical identity remains visible
- restored copy or restored current state keeps its source trail

## Integrity Checkpoints

- copied content is not treated as verified recovery by default
- parsing success is not treated as restoration success by default
- verification stays separate from creation and comparison
- stale or corrupt source handling stays visible

## Approval Checkpoints

- author approval for restore-as-current
- governed restore choice for restore-as-copy
- any destructive replacement approval required by the current-save owner

## Mutation Checkpoints

- inspection does not mutate truth
- restore-as-copy does not replace current state
- restore-as-current mutates current-save state only through the current-save owner
- recovery re-entry alone does not mutate accepted manuscript truth

## Author-Visible State

- recoverable source type
- timestamp or freshness
- ownership and provenance
- compare current versus recoverable state
- restore mode choice
- verification result
- current work preservation
- fallback to direct writing

## Forbidden Shortcuts

- No silent restoration.
- No silent replacement of current work.
- No collapse of snapshot, history, backup, archive, export, and save.
- No automatic acceptance of historical material as current truth.
- No universal recovery owner.

## Unresolved Questions

- How much source detail should be shown by default?
- How should conflicting recovery candidates be ranked or grouped?
- How prominent should verification results be after a successful restore?

## Stage 9 Deferrals

- recovery source comparison presentation
- restore-as-current versus restore-as-copy labels
- destructive-action warnings
- verification-result presentation
- partial and failure presentation
- provenance and timestamp display
- recovery re-entry presentation
- focus and keyboard behavior

## Stage 10 Deferrals

- backup format
- restore implementation
- integrity verification
- corruption detection
- interruption safety
- retention policy
- migration compatibility
- realistic project-size testing
- operational rollback or transaction reliability
- security and privacy of backup material

## What This Proof Explicitly Does Not Prove

- It does not prove backup file format or storage layout.
- It does not prove restore algorithms or rollback mechanics.
- It does not prove every historical artifact is restorable.
- It does not prove operational recovery performance.

## Completion-Criteria Assessment

The workflow boundary is well defined if:

- inspection remains non-mutating,
- restore-as-current remains explicit and owner-governed,
- restore-as-copy remains separate from current state,
- verification stays visible,
- provenance and currentness stay visible,
- failed or partial recovery never masquerades as complete success.

## Official Result

Passed with Bounded Follow-up.
The recovery boundary is proved, inspection is non-mutating, restore-as-current, restore-as-copy, and recovery re-entry remain distinct, restore-as-current requires explicit author approval, Project Persistence retains current-save ownership, recovery does not gain manuscript-truth ownership, a previously valid state may be reinstated without reaccepting every prior Narrative Assertion, restore-as-copy does not replace current state, copying, parsing, verification, and successful recovery remain distinct, provenance and source identity remain visible, partial or failed restore is not presented as complete, and Notes, Signals, findings, candidates, history, and accepted truth retain their meanings.

Bounded follow-up remains routed to Stage 9 for comparison presentation, restore-mode labels, warnings, verification display, provenance presentation, and keyboard/focus behavior, and to Stage 10 for restore implementation, integrity, corruption detection, interruption safety, retention, migration, and rollback reliability.

The unresolved restored-copy identity question remains bounded to later workflow and architecture planning and does not block this proof.
