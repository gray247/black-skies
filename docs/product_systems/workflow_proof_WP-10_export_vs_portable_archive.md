# Workflow Proof WP-10 - Publication Export versus Portable Project Archive

## Status

Status: Passed with Bounded Follow-up
- Draft complete
- Official result recorded
- Bounded follow-up routed to Stage 9 and Stage 10

## Author Goal

Show that outward transfer can produce a manuscript-focused publication export or a durable portable project archive without collapsing either into current save, backup, or truth ownership.

## Scope

This proof covers publication export, portable project archive creation, package inspection, partial and failed package handling, cancellation, later re-entry where authorized, and manual handoff boundaries.
It proves the boundary between export, archive, backup, snapshot, history, and accepted truth.
It does not prove schema, serialization, file formats, migration, or implementation details.

## Preconditions

- The author has requested outward transfer or package creation.
- The system can identify included and excluded material.
- Source ownership and provenance are available.
- Manual transfer may be used without connector admission.

## Initiating Actor and Surface

- Initiating actor: author
- Initiating surface: Writing Surface, with outward-transfer support possibly surfaced in Command Center Surface

## Participating Systems

- Import / Export / Document Interchange
- Snapshots / Backup / Restore / History
- Project Persistence / Local Save
- Authorship Provenance AI Visibility
- Project Index / Search / Retrieval
- Outline
- Feedback Notes / Revision Resolution
- Signal Architecture
- Character Cards
- Lore Cards
- Timeline / Pacing / Pressure
- Relationship Map

## Source Owner

- Import / Export / Document Interchange for transfer packaging
- Source owners for any included content remain the owners of their content

## Destination Owner

- The external recipient or file destination for publication export
- The portable project archive package itself for durable escape or inspection
- Writing Surface or another owner-controlled re-entry path when later import is authorized

## Objects Read

- manuscript content
- project metadata
- authored planning material
- Notes
- Signals
- critique or continuity findings
- rewrite candidates
- accepted truth
- provenance records
- derived analysis
- excluded material
- package inclusion record concept
- current save, snapshot, and history context

## Objects Created

- publication export package
- portable project archive package
- preview or inspection view
- partial package or failed package marker where applicable
- later re-entry record when authorized

## Objects Transformed or Routed

- selected material routed into publication export or portable archive packaging
- included and excluded material routed into package decisions
- provenance routed with the package where doctrine permits
- later import or re-entry routed only through an owner-approved path

## Required Distinctions

- publication export
- portable project archive
- Black Skies application backup
- current project save
- snapshot
- history
- manuscript content
- project metadata
- authored planning material
- Notes
- Signals
- critique or continuity findings
- rewrite candidates
- accepted truth
- provenance records
- derived analysis
- excluded material
- package manifest or inclusion record as a concept
- package inspection
- later import or re-entry

## Path Matrix

| Path | State before | Actor | Owner responsible | Action | Object produced or changed | Truth mutation | Approval required | Author-visible result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Author initiates outward transfer | Transfer requested | Author | Import / Export / Document Interchange | Open outward transfer flow | Transfer session | No | No | Export/archive choices become visible |
| 2. Author selects publication export | Transfer session open | Author | Import / Export / Document Interchange | Choose publication export | Publication export candidate | No | Yes if policy requires outbound approval | Manuscript-focused path is visible |
| 3. Author selects portable project archive | Transfer session open | Author | Import / Export / Document Interchange | Choose portable archive | Archive candidate | No | Yes if policy requires outbound approval | Durable escape path is visible |
| 4. System identifies included material | Candidate visible | System | Source owners remain original owners | Gather included scope | Inclusion list | No | No | Included material is visible |
| 5. System identifies excluded material | Candidate visible | System | Source owners remain original owners | Mark exclusions | Exclusion list | No | No | Excluded material is visible |
| 6. Source owners remain visible | Package in preparation | System | Source owners | Label ownership | Ownership display | No | No | Source ownership does not disappear |
| 7. Publication export completes | Manuscript-focused export approved | System | Import / Export / Document Interchange | Emit export artifact | Publication export package | No | No | Export completes as outward transfer |
| 8. Archive creation completes | Archive candidate approved | System | Import / Export / Document Interchange | Emit archive artifact | Portable project archive | No | No | Archive completes as durable escape package |
| 9. Author cancels before package creation | Candidate visible | Author | None | Cancel transfer | Cancellation record | No | No | No package is created |
| 10. Cancellation after partial package creation | Partial package exists | Author | Import / Export / Document Interchange | Cancel transfer | Partial-package stop record | No | No | Partial result remains visible |
| 11. Package creation partially succeeds | Some material packaged | System | Import / Export / Document Interchange | Finish partial output | Partial package | No | No | Partial package is not hidden |
| 12. One source owner is unavailable | Needed source missing or offline | System | Source owner | Mark unavailable source | Unavailable-source marker | No | No | Missing source remains visible |
| 13. Some material is excluded by author choice | Scope reviewed | Author | Author-controlled transfer path | Exclude material | Exclusion set | No | Yes if exclusion changes outbound scope | Chosen exclusions remain visible |
| 14. Some material cannot be represented | Format limit encountered | System | Transfer owner | Mark unrepresentable material | Representation warning | No | No | Unrepresentable material stays explicit |
| 15. Package becomes stale after project changes | Project changed after packaging | System | Import / Export / Document Interchange | Mark stale package | Stale-package marker | No | No | Staleness is visible |
| 16. Package inspection | Package exists | Author | Import / Export / Document Interchange | Inspect package | Inspection view | No | No | Package contents can be reviewed |
| 17. Integrity or completeness status remains visible | Package inspected | System | Transfer owner | Show integrity state | Integrity or completeness view | No | No | Package health remains visible |
| 18. Publication export is later edited outside Black Skies | Export externalized | External editor | External destination | Edit exported file | External edit | No | External edit owner rules apply | External provenance remains external |
| 19. External file is later re-imported where authorized | External file exists | Author | Import / Export / Document Interchange | Re-import or re-entry | Imported material | No | Yes, import approval where required | Imported material is staged, not auto-true |
| 20. Portable archive is later inspected | Archive exists | Author | Import / Export / Document Interchange | Inspect archive | Archive inspection view | No | No | Archive can be reviewed later |
| 21. Portable archive is later used for re-entry where authorized | Archive exists | Author | Import / Export / Document Interchange | Re-enter from archive | Re-entry session | No | Yes, governed re-entry approval | Re-entry remains distinct from truth acceptance |
| 22. Import or re-entry fails | Package or re-entry rejected | System | Import / Export / Document Interchange | Report failure | Failure record | No | No | Failure is visible |
| 23. Package includes provenance | Provenance available | System | Authorship Provenance AI Visibility | Include provenance | Provenance-bearing package | No | No | Provenance remains visible |
| 24. Package excludes sensitive or private material where requested | Protected scope present | System | Protected-content rules via transfer owner | Exclude protected material | Privacy-filtered package | No | Yes, if policy requires protected-scope approval | Protected material stays excluded |
| 25. Project continues to change after export or archive creation | Transfer completed earlier | Author | Source owners | Continue writing | New project changes | No | No | Transfer does not freeze the project |
| 26. Application backup remains a separate operation | Recovery copy requested | Author | Snapshots / Backup / Restore / History or Project Persistence / Local Save as applicable | Create backup instead | Application backup | No | Yes, if recovery policy requires it | Backup is separate from export/archive |
| 27. Author resumes ordinary project work after outward transfer | Transfer complete or aborted | Author | Writing Surface | Continue work | Manuscript work | No | No | Writing Surface remains sovereign |

## Must Prove

- publication export is manuscript-focused outward transfer
- publication export is not a complete Black Skies project
- portable project archive is intended for durable escape or inspection
- portable project archive is not an application backup
- application backup remains recovery-oriented
- export, archive, backup, snapshot, history, and current save remain distinct
- package creation does not mutate project truth
- package creation does not transfer source ownership
- package inspection does not accept material as truth
- later import or re-entry does not automatically become accepted truth
- included and excluded material remain visible
- partial package is not presented as complete
- unavailable source material remains visible
- unrepresentable material remains visible
- stale packages remain identifiable
- external edits retain external or imported provenance
- Notes, Signals, findings, candidates, history, provenance, and accepted truth do not collapse
- portable archive does not become a universal project database
- Import / Export does not gain current-save, recovery, or truth ownership
- no connector is required for manual file-based transfer
- live synchronization or automated round-trip behavior remains connector-gated

## Publication-Export Branch

- manuscript-only export
- optional selected metadata where doctrine permits
- loss of Black Skies-specific structure
- editing outside Black Skies
- later import as new or external material
- no promise of lossless round trip

## Portable-Project-Archive Branch

- project escape and inspection intent
- meaningful project material
- source ownership preservation
- inclusion and exclusion transparency
- unresolved exact contents
- unresolved candidate, deleted, private, rejected, historical, and derived-material inclusion rules
- unresolved schema and versioning
- no promise of perfect reconstruction in unrelated software

## Manual Handoff Boundary

- manual export or package handoff does not require connector admission
- external editor feedback remains external contribution until explicitly imported or routed
- live collaboration, connected-document exchange, and automated synchronization remain outside this proof and connector-gated

## Provenance Checkpoints

- source owners remain visible
- provenance packages with the transfer
- external edits retain external provenance
- imported re-entry preserves source identity
- package inspection does not erase provenance

## Integrity Checkpoints

- included material remains visible
- excluded material remains visible
- partial package remains visible
- stale package remains visible
- unrepresentable material remains visible
- integrity or completeness status remains visible

## Approval Checkpoints

- outbound transfer approval where required
- protected-scope approval where required
- later import or re-entry approval where required
- manual handoff remains manual and does not imply connector approval

## Mutation Checkpoints

- package creation does not mutate project truth
- package creation does not transfer source ownership
- package inspection does not mutate truth
- later re-entry does not auto-accept truth

## Author-Visible State

- transfer choice
- included and excluded material
- source ownership
- package type
- integrity or completeness status
- stale-package warning
- inspection result
- later re-entry warning

## Forbidden Shortcuts

- No silent export.
- No silent archive creation that becomes truth.
- No silent import acceptance.
- No silent round-trip synchronization.
- No collapse of export, archive, backup, snapshot, history, and save.
- No universal package owner.

## Unresolved Questions

- How much export metadata should be included by default?
- How should archive versus publication export be labeled in compact views?
- How much package detail should appear before the author drills in?

## Stage 9 Deferrals

- export versus archive labels
- inclusion and exclusion presentation
- package-scope explanation
- partial and failure presentation
- stale-package warnings
- sensitive-material controls
- inspection presentation
- import and re-entry warnings

## Stage 10 Deferrals

- publication format fidelity
- archive format
- archive schema
- versioning
- package integrity
- corruption detection
- migration compatibility
- realistic project-size testing
- security and privacy
- import fidelity
- operational partial-failure behavior
- exact backup, archive, and export implementation

## What This Proof Explicitly Does Not Prove

- It does not prove export or archive file format choice.
- It does not prove archive schema or serialization design.
- It does not prove the best UI for package inspection.
- It does not prove live sync or multi-author collaboration.

## Completion-Criteria Assessment

The workflow boundary is well defined if:

- publication export remains manuscript-focused,
- portable archive remains an escape or inspection package,
- application backup remains separate,
- package creation and inspection do not mutate truth,
- manual handoff remains possible without connectors,
- later re-entry stays owner-governed.

## Official Result

Passed with Bounded Follow-up.
The transfer boundary is proved, publication export, portable project archive, and application backup remain distinct, export is manuscript-focused and not a complete project, archive supports durable escape or inspection, backup remains recovery-oriented, package creation and inspection do not mutate truth, source ownership remains intact, inclusion, exclusion, unavailable, unrepresentable, partial, stale, and sensitive material remain visible, later import or re-entry is not automatic acceptance, imported or externally edited material retains provenance, archive contents, schema, format, versioning, and reconstruction guarantees remain unresolved, and manual file handoff requires no connector while live collaboration and automated round-trip synchronization remain connector-gated.

Bounded follow-up remains routed to Stage 9 for export/archive labels, inclusion/exclusion presentation, stale warnings, and inspection and re-entry warnings, and to Stage 10 for formats, schema/versioning, integrity, corruption detection, migration compatibility, fidelity, security/privacy, and operational recovery behavior.
