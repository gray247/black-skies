# File Manager / Asset Pane

## 1. Status Header

- Dossier name: `File Manager / Asset Pane`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Binder / Project Library`, `Writing Surface`
- Feeds into: `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define file and asset support for project materials without letting asset containers become narrative truth owners.
This dossier inherits asset, protection, provenance, and degraded-mode boundaries from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `document_interchange_source_destination_contract.md`, `provenance_state_model.md`, `degraded_mode_execution_contract.md`, and `snapshot_protected_recovery_contract.md`.

## 3. User Problem Solved

The writer needs access to supporting files and assets without losing focus or blurring asset state with narrative authority.

## 4. What The System Does

- own file and asset identity, availability posture, metadata, preview references, linked-versus-local-copy distinction, missing-file and repair posture, and explicit detach or replacement actions,
- organize assets,
- support file browsing,
- expose bounded asset references near writing,
- keep missing or unavailable files visible as repairable placeholders by default.

## 5. What The System Does Not Do

- own narrative truth,
- force asset workflows before writing,
- leak protected files by default,
- decide manuscript, lore, note, signal, memory, or imported-source truth,
- replace `Import Export Document Interchange` as import or transfer authority.

## 6. User-Facing Behavior

Visible behavior should emphasize lightweight access, clear file context, visible distinction between project artifacts and external files, and inspectable source status.

## 7. Hidden/Background Behavior

Background indexing or preview prep may exist, but remains operational.

## 8. What Appears First

- relevant files,
- clear asset categories,
- current-project context,
- visible linked-versus-local-copy posture where relevant,
- unavailable sources as repairable placeholders rather than silent disappearance.

## 9. What Is Summonable

- previews,
- metadata,
- related links,
- heavier file operations,
- affected references,
- replacement or detach posture,
- last-known source context for unavailable items.

## 10. What Is Hidden Until Needed

- dense metadata,
- archive views,
- advanced file operations.

## 11. Inputs

- project files,
- author asset organization,
- file metadata,
- interchange-created asset placements,
- availability and repair state.

## 12. Outputs

- asset views,
- file links,
- project-context references,
- file-status references such as linked, local copy, unavailable, protected, or repair-needed.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- asset metadata,
- organization preferences,
- preview references,
- file and asset identity,
- availability posture,
- linked-versus-local-copy distinction,
- missing-file and repair posture.

## 15. What Remains Temporary

- transient previews,
- temporary filters,
- current selections,
- ephemeral preview caches or availability probes that do not redefine durable file state.

## 16. Relationship To Narrative Insertion / Assertion

Files may support narrative work but do not replace narrative truth.
Attaching, previewing, indexing, or placing a file does not make it manuscript truth.

## 17. Relationship To Story Units

Assets may be linked to Story Units only as optional support context.

## 18. Relationship To Prose / Scene Projection

Projection may reference assets without turning assets into story authority.

## 19. Relationship To Writing Surface

The asset pane may support current-text work without crowding the manuscript by default.

## 20. Relationship To Command Center Surface

Heavier asset review or cleanup may belong in the Command Center.

## 20A. Relationship To Binder / Project Library

Binder may place file references in project organization, but it does not own file identity, file availability, or repair posture.

## 20B. Relationship To Import / Export Document Interchange

`Import Export Document Interchange` owns import classification and staged intake.
`File Manager / Asset Pane` owns durable file and asset metadata after asset placement is explicitly chosen.

## 20C. Relationship To Project Index / Search / Retrieval

Search may index permitted asset metadata and references, but it does not own file identity or availability state.

## 20D. File And Asset Identity Model

`File Manager / Asset Pane` owns file and asset source posture.
It may track product-relevant identity and status such as:

- durable managed asset identity,
- linked-source identity,
- local managed-copy identity,
- source filename and display name,
- path or source locator,
- content type,
- availability,
- size or other product-relevant metadata,
- provenance,
- protection posture,
- project references.

These are product semantics, not a database schema or file-system
layout.
A file may contain material that later becomes an accepted product
object, but the file itself does not automatically become manuscript
truth, project truth, lore truth, character truth, notes, signals, or
memory.

## 20E. Asset Classes

The file manager should distinguish at least these classes:

- managed local project file,
- linked external file,
- imported staged file,
- accepted imported object,
- generated export artifact,
- temporary transfer artifact,
- missing external source,
- archived managed asset,
- deleted or trashed asset,
- unsupported or unreadable asset.

`Import Export Document Interchange` owns import classification,
staging, transfer history, export artifacts, and destination handoff.
File Manager owns durable file and asset metadata after asset placement
or source posture is explicitly chosen.

## 20F. Linked External Asset

A linked external asset is a reference to a source outside the managed
project storage boundary.
It retains:

- external source identity,
- source location or locator,
- availability state,
- last-known metadata where appropriate,
- provenance,
- protection posture,
- broken-link or unavailable state.

A linked asset must not silently become a managed copy.
External source changes do not automatically mutate accepted project
objects.
If imported or parsed content is later accepted, that acceptance follows
the relevant owner or interchange workflow rather than file ownership.

## 20G. Managed Local Copy

A managed local copy is a project-managed file or asset copy stored
within the project's governed storage boundary.
It retains:

- managed identity,
- origin provenance,
- local availability state,
- revision or replacement posture,
- protection posture,
- relationship to the original external source where relevant.

A managed copy must not pretend to remain a live external link.
Replacing or revising a managed copy does not silently rewrite accepted
manuscript, project, character, lore, note, signal, or memory state.

Conversion between linked and copied posture must be explicit and
provenance-bearing.

## 20H. File Manager Operations

File Manager-owned operations include:

- add linked asset,
- import as managed copy,
- replace source,
- relink,
- rename display label,
- rename managed file,
- move managed file,
- archive,
- restore,
- remove project reference,
- delete managed asset,
- reveal source,
- inspect provenance,
- convert linked asset to managed copy,
- create a new linked reference to an existing managed or external
  asset where allowed.

Non-destructive operations adjust references, labels, views, or
availability posture without deleting source content.
Destructive or high-risk operations include deleting a managed asset,
overwriting or replacing a source, detaching all project references,
restore-over-current, and any action that may reveal protected material
or cross a local boundary.
Those operations require owner-governed approval and must never be
silent.

Renaming a display label is not renaming the managed file.
Renaming or moving a managed file is a file-owner action and should
update dependent project references through governed repair or reference
update posture.
Moving a Binder reference is not moving or renaming the file.

## 20I. Broken Links And Repair

Broken-link and unavailable-source states include:

- missing external source,
- moved external source,
- inaccessible source,
- permission failure,
- changed source identity,
- corrupted or unreadable content,
- stale metadata,
- relink candidate,
- deliberate detachment.

Repair must be explicit.
The system must not silently bind to a merely similar file, silently
convert a linked asset into a managed copy, silently treat stale metadata
as current content, or silently delete accepted product objects derived
from the unavailable source.

Relink candidates are advisory until the author chooses the intended
source.
When source identity is uncertain, destructive actions should be blocked
or downgraded to inspection, copy, or repair-first paths.

## 20J. Archive, Deletion, And Recovery

The following states are distinct:

- archiving a file or asset,
- removing a Binder reference,
- removing a project reference,
- deleting a managed asset,
- losing an external source,
- restoring from project recovery or snapshot,
- restoring only metadata,
- restoring actual file content.

Archiving a managed asset hides or lowers its prominence according to
file-owner posture; it is not operating-system deletion.
Removing a Binder reference removes project organization only.
Removing a project reference detaches the asset from that project
context without necessarily deleting the underlying managed file.
Deleting a managed asset is destructive and must preserve any required
provenance or recovery posture.
Losing an external source creates unavailable or broken-link posture,
not deletion.

Recovery from snapshot or project recovery is governed by
`Snapshots / Backup / Restore / History` and recovery contracts.
Metadata-only recovery must not imply that actual file content was
restored.
Actual file-content recovery must preserve protection posture and
source lineage.

## 20K. Protection And Local-Only Behavior

File Manager must enforce:

- protected and excluded files,
- local-only assets,
- never-send restrictions,
- masked or approved-summary posture,
- outbound-package exclusion,
- restricted previews and thumbnails,
- safe metadata display,
- author-known and reader-visible distinctions where relevant.

A filename, preview, thumbnail, summary, repair placeholder, search-facing
asset summary, or metadata field must not leak restricted content merely
because the underlying file is hidden or unavailable.
Local-only assets remain local-only after linking, copying, archiving,
relinking, recovery, or Binder placement unless an explicit later owner
path reclassifies them.

## 20L. Provenance And Source Lineage

File Manager provenance should distinguish:

- linked external asset creation,
- copied or imported asset creation,
- renamed or moved managed file,
- replaced source,
- relinked source,
- conversion from link to managed copy,
- recovery-restored asset,
- asset used to create an accepted project object.

Provenance explains origin and changes.
It does not become truth ownership, export permission, Memory Lab
retention permission, or proof that derived accepted product objects
should update.

## 20M. Handoffs

File Manager handoffs should preserve:

- visible surface,
- file or asset identity,
- linked-versus-managed-copy posture,
- source label and locator where permitted,
- availability and protection state,
- affected project references,
- provenance or lineage reference,
- requested action,
- return-to-prior-location anchor where available.

File Manager may hand off to:

- `Binder / Project Library` for organization references,
- `Import Export Document Interchange` for import, staging, parsing, or
  transfer workflows,
- `Project Index / Search / Retrieval` for permitted metadata and
  source labels,
- `Snapshots / Backup / Restore / History` for recovery inspection,
- `Writing Surface` or `Command Center Surface` for task-appropriate
  opening or inspection.

The receiving system does not gain file ownership by consuming the
handoff.
If the owner blocks, downgrades, or refuses the requested action, the
surface must render the result honestly.

## 20N. Series Boundary

File Manager / Asset Pane is a project file and asset support system.
Series-scale sharing, cross-story exposure, or cross-project asset
meaning belongs to later `Series Binder / Cross-Story Linking` doctrine
or another explicit owner.
Single-project file support must not silently become a series truth
owner or cross-project permission broker.

## 21. GUI Placement Principles

Keep asset access lightweight and avoid turning it into a dashboard.

## 22. Local LLM Role

Not required for core asset behavior.

## 23. Paid API Role

Not required for core asset behavior.

## 24. Model Routing Notes And Cost / Budget Impact

Any later asset-analysis AI use remains optional and governed elsewhere.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Asset previews and file references must respect masking and outbound rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Private, hidden, or excluded files must stay protected by default.

## 27. Testing Requirements

Prove asset browsing does not leak protected material or block writing.

## 28. Governance Rules And Risks

- no file-container authority drift,
- no protected-file leakage,
- no writing gate through asset tooling,
- a missing file is not a deleted file,
- losing or detaching a source file must not silently delete or decanonize manuscript, notes, lore, or other project artifacts derived from it,
- protected, masked, local-only, private, or AI-excluded material must not leak through previews, metadata summaries, repair placeholders, or search-facing asset summaries.

## 29. Failure Modes

If asset support fails, writing should continue and files should remain safely local.
Unavailable assets, broken links, failed previews, parsing failures,
indexing failures, external-drive disconnects, permission failures, and
support-service failures must not block unrelated manuscript editing.
File Manager must label uncertainty honestly.
Repair suggestions remain advisory until explicitly chosen.
Destructive operations remain blocked when source identity is uncertain.

## 30. v1 Boundary

Basic asset browsing and reference support.

## 31. v2 Boundary

Richer previews, grouping, and cross-links.

## 32. Future-Only Boundary

Deep media analysis or automated asset orchestration.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from project-file, folder-location, import, attachment, external-drive, and protected-folder questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `1 Fatal`, `3 Critical`, `2 Major`
- remaining blocker summary: `0 Fatal`, `3 Critical`, `2 Major`

### Fatal Questions

- None. Protected-content behavior for files and assets is governed by the protection matrix, provenance rules, and handoff contract.

### Critical Questions

- Critical: what file or asset states are visible by default versus protected, archive-only, summonable, or blocked entirely?
- Critical: how much of the linked-versus-local-copy distinction and unavailable-source posture should remain constantly visible versus inspectable on demand?
- Critical: how should the system behave when project folders are on external drives, cloud-synced locations, protected folders, low-space environments, or paths with dangerous permissions or disconnect risks?

### Major Questions

- Major: how much asset context belongs near drafting versus deeper asset browsing and cleanup in support surfaces?
- Major: what exact repair and replacement language is most understandable when an external source is unavailable but the project reference remains?
- Jason decision candidate: should early file support focus on browse-and-reference only, or may it include bounded attach/link workflows from day one?

### Minor Questions

- Minor: should `File Manager` and `Asset Pane` remain paired, or should one become the clearer user-facing concept?

### Answered / Superseded Questions

- Direct writing must remain valid.
- File and asset containers do not own narrative truth.
- Protected, local-only, or AI-excluded assets must not silently feed AI packages, diagnostics, export, memory, or search summaries.
- Browse-only is the safest early scope unless attach/link is explicitly bounded.
- Missing or unavailable files remain visible as repairable placeholders by default.
- A missing file is not a deleted file.
- Removing or losing a source file must not silently delete or decanonize derived project artifacts.
- Questions better owned elsewhere: exact import, export, sync, and Google Docs movement rules belong to the future `Import / Export / Google Docs` dossier.

### Deferred Questions

- Deferred: exact media-type support, preview rules, and attachment metadata policy.

## 34. Acceptance Criteria

This dossier is acceptable only if file support remains bounded, safe, and non-authoritative.
