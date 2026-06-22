# Import Export Document Interchange

## 1. Status Header

- Dossier name: `Import Export Document Interchange`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-22`
- Depends on: `Writing Surface`, `Binder / Project Library`, `File Manager / Asset Pane`, `Authorship Provenance AI Visibility`, `Explicit Content Architecture`, `Model Routing And Budget Architecture`
- Feeds into: `Writing Surface`, `Binder / Project Library`, `File Manager / Asset Pane`, `Command Center Surface`, `Companion`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define the author-facing human document interchange capability so Black
Skies can import and export common document material without confusing
transfer workflows with autosave, storage authority, AI package doctrine,
or story truth.

This dossier inherits source and destination rules from
`document_interchange_source_destination_contract.md`, protection rules
from `protected_content_permission_matrix.md`, provenance posture from
`provenance_state_model.md`, execution limits from
`degraded_mode_execution_contract.md`, handoff rules from
`surface_to_owner_action_handoff_contract.md`, and truth or durable-state
authority limits from `truth_and_state_ownership_matrix.md`.

## 3. User Problem Solved

The writer needs to bring outside document material into Black Skies,
send Black Skies material out to common human-readable formats, and
review what will cross that boundary before transfer, loss, drift, or
protected-content mistakes happen.

## 4. What The System Does

Document Interchange:

- owns import-session workflow state,
- owns staged import state until owner-routed acceptance,
- owns import destination classification state,
- owns reimport, duplicate, and drift-comparison workflow state,
- owns export-job workflow state,
- owns transfer history and external-document linkage metadata,
- defines bounded human document import and export capability for common
  human-readable formats,
- defines posture for `docx`, `pdf`, markdown, plain text, pasted text,
  later publishing formats such as `ePub`, and Google Docs as one
  external source or destination,
- distinguishes clean export from annotated or provenance-aware export,
- provides author-controlled preview and approval points,
- surfaces format-loss, drift, duplicate, and conflict warnings,
- defines one-way import, one-way export, and manual reimport or update
  posture for external documents,
- protects masked, hidden, deleted, protected, local-only,
  never-send, or AI-excluded content at transfer boundaries.

## 5. What The System Does Not Do

Document Interchange does not:

- own accepted manuscript truth,
- own accepted project truth,
- own accepted character truth,
- own accepted lore truth,
- own notes, signals, or durable memory,
- own Google Docs-like autosave or instant-save feel,
- own local autosave,
- own local save-state behavior,
- own snapshots,
- own backup or restore,
- own crash recovery,
- replace `File Manager / Asset Pane` as storage or asset-identity
  authority,
- replace `Binder / Project Library` as organization or destination
  context authority,
- replace provenance doctrine, explicit-content policy, routing policy,
  package-construction policy, or `Memory Lab` durable-memory rules,
- silently canonize imported text as accepted story truth, accepted
  continuity truth, or author-owned story truth,
- silently export raw manuscript, silently sync, or silently rewrite
  local manuscript state from an external document,
- imply that Google Docs is live-sync authority,
- claim that any specific format path is build-ready.

## 6. User-Facing Behavior

Visible behavior should emphasize:

- clear import and export entry points,
- visible destination classification before import acceptance,
- visible clean-versus-annotated export selection,
- preview before export, external update, publish, or other outbound
  transfer,
- explicit warnings when formatting, comments, metadata, or structure
  may be lost,
- clear duplicate, conflict, drift, permission-failure, and offline
  messaging,
- explicit author approval before any outbound action mutates a selected
  external document,
- Google Docs treated as one external source or destination rather than
  the whole feature,
- no claim that future Google Docs sync is build-ready.

## 7. Hidden/Background Behavior

Background behavior may later include:

- format sniffing and parser selection,
- serializer selection,
- source-document identity comparison,
- duplicate or same-source detection,
- conflict or drift detection,
- permission and availability checks,
- degraded-mode transfer containment,
- temporary staging of previews, diffs, or package-ready output views.

Background behavior must not silently create truth, silently move
content outbound, or silently turn external document edits into accepted
local manuscript state.

## 8. What Appears First

What appears first:

- a clear choice to import, export, or inspect transfer state,
- the current project or destination context,
- the selected transfer scope,
- any blocking warnings that must be understood before the transfer
  continues.

## 9. What Is Summonable

Summonable later from Document Interchange:

- format-loss warnings,
- import destination choices,
- export previews,
- clean-versus-annotated export modes,
- Google Docs transfer choices,
- duplicate and drift comparisons,
- conflict comparisons,
- permission and failure detail,
- emergency raw-prose export options later if approved.

## 10. What Is Hidden Until Needed

Hidden until needed:

- low-level parser or serializer detail,
- raw document identity internals,
- duplicate-match heuristics,
- drift mechanics,
- per-format compatibility edge cases,
- future AI or memory transfer-format experiments,
- low-value status clutter.

## 11. Inputs

Inputs include:

- local `docx`, `pdf`, markdown, plain-text, or other later
  human-readable files,
- pasted text,
- selected Google Docs documents later as one external source,
- current manuscript or selected manuscript scope,
- prose projection, outline, assertions, or selected package view when
  an export mode explicitly uses them,
- Binder or destination context,
- provenance visibility settings,
- explicit-content clearance state,
- protected-content permissions,
- routing or approval state when a transfer crosses a governed external
  boundary,
- degraded-mode and storage-state signals from adjacent systems.

## 12. Outputs

Outputs include:

- staged import sessions,
- classified import outcomes,
- owner-routed acceptance candidates,
- export previews,
- formatted output files or external-document payloads later,
- format-loss warnings,
- duplicate, conflict, or drift warnings,
- transfer status,
- failure or fallback states,
- author-visible clean or annotated export selections.

Outputs remain transfer artifacts or workflow state until the author
explicitly accepts resulting local changes through the relevant owner.

Imported material defaults to `import staging`, `review`, or other
candidate-like intake states rather than accepted manuscript or accepted
truth.
Exported artifacts remain transfer artifacts rather than local truth
authority.
Binder may expose staged material in a distinct `Imports / Staging`
navigation area, but staged content remains owned by interchange until
explicit handoff.

## 13. Which Other Systems Consume Those Outputs

Likely downstream consumers:

- `Writing Surface`
- `Binder / Project Library`
- `File Manager / Asset Pane`
- `Command Center Surface`
- `Authorship Provenance AI Visibility`
- `Explicit Content Architecture`
- `Model Routing And Budget Architecture`
- `Project Index / Search / Retrieval`
- `Memory Lab` only through later author-approved, governed derivatives
  rather than silent raw transfer

## 14. What Gets Stored

Eventually stored:

- source-document references,
- import-session identity and lifecycle state,
- staged-content references,
- import destination classification,
- transfer history markers,
- document identity links for approved external-document relationships,
- duplicate or prior-import relationships,
- acknowledged format-loss warnings,
- author-chosen export mode preferences,
- export-job history,
- author-approved external-document linkage metadata.

Stored transfer metadata does not become manuscript truth by itself.

## 15. What Remains Temporary

Temporary or derived:

- parsed intermediary representations,
- import previews,
- export previews,
- temporary diffs,
- transient Google Docs reconnect state,
- temporary package-shaped export candidates,
- failed transfer attempts awaiting dismissal or retry,
- OCR-derived or other format experiments before any future doctrine
  explicitly preserves them.

These temporary artifacts must not be mistaken for the approved human
export payload, durable `Memory Lab` material, or final import-created
project truth.

## 16. Relationship To Narrative Insertion / Assertion

Document Interchange may import material that later becomes candidate
manuscript, notes, source material, or other author-reviewed input for
`Narrative Insertion / Narrative Assertion`.
It must not silently treat imported text as already accepted narrative
truth.

Export may use accepted manuscript text, prose projection, assertions,
outline, or another selected view only when the export mode explicitly
declares that source object.
Possible export sources are governed by source and destination doctrine
by mode and may include accepted manuscript text, prose projection,
selected package view, outline-derived structure, assertions or accepted
facts, or notes or signals or cards or lore only when explicitly
included.
No export view replaces narrative foundation authority, and no exported
artifact becomes local truth authority when it leaves Black Skies.

## 17. Relationship To Story Units

Story Units may supply optional export scope or import destination
context later, but Story Units are not a mandatory gate for import or
export.

## 18. Relationship To Prose / Scene Projection

Document Interchange may consume prose or projection views as export
sources when the author intentionally chooses that mode.
It must not assume scene-first or projection-first authority for
import.

## 19. Relationship To Writing Surface

The Writing Surface remains the sovereign drafting surface.
Document Interchange may bring material into or out of the Writing
Surface context, but it does not own local persistence, autosave feel,
save-state behavior, or crash recovery.

Google Docs-like instant-save behavior belongs with `Writing Surface`,
`Snapshots / Backup / Restore / History`, `Service Health / Offline /
Degraded Mode`, and `Workflow Spine / Author Journey`, not this dossier.
Google Docs is an external source or destination only.
It is not local truth authority, local autosave authority, or build-ready
sync doctrine here.

## 20. Relationship To Command Center Surface

The Command Center is the likely home for heavier preview, approval,
drift review, conflict review, duplicate review, and failure-inspection
workflows.
It may support transfer work, but it must not become a mandatory gate
before basic writing continues.

## 20A. Import Identity And Staging Model

An import begins as an interchange-owned intake record rather than as
accepted project truth.

Import state should distinguish:

- source-document identity,
- import-session identity,
- source format,
- parsing status,
- staged-content identity,
- provenance,
- protection classification,
- prior-import or duplicate relationship,
- partial, unsupported, rejected, or quarantined posture.

Source-document identity explains what external or local document the
import came from.
`File Manager / Asset Pane` owns the source file or asset identity.
Document Interchange owns the intake session that refers to that source
for staging, review, and transfer history.

Staged-content identity belongs to interchange while the material is
still under review.
It does not replace source identity, owner identity, or accepted truth
identity.

Unknown, messy, or weakly parsed imports default to reference-only
staging rather than candidate manuscript truth.

## 20B. Classification Outcomes

Import classification may yield one or more bounded outcomes:

- `File Manager asset only`
- `reference-only document`
- `staged manuscript candidate`
- `staged planning or structural candidate`
- `staged Character Card fact candidate`
- `staged Lore Card fact candidate`
- `rejected material`
- `quarantined material`

`File Manager asset only` means the source has been brought into the
project as an asset or linked source without creating staged truth
candidates.

`reference-only document` means the material may be browsed, cited,
organized, or searched according to owner rules without implying that it
should become accepted manuscript, planning, or fact state.

`staged manuscript candidate` means the import may later route to
`Narrative Insertion / Narrative Assertion` through explicit review.

`staged planning or structural candidate` means the import may later
route to `Outline` or `Story Unit` as planning or grouping support
through explicit review.

`staged Character Card fact candidate` and `staged Lore Card fact
candidate` remain support candidates until explicit owner acceptance.

`rejected` and `quarantined` remain interchange outcomes, not truth
owners.
Quarantine is appropriate when format integrity, provenance,
permissions, or protection state are too uncertain for ordinary review.

## 20C. Import Lifecycle

Import lifecycle posture should remain explicit:

- `created`
- `parsing`
- `partially parsed`
- `staged`
- `classified`
- `awaiting review`
- `accepted through owner`
- `rejected`
- `quarantined`
- `stale`
- `superseded`
- `failed`
- `cancelled`
- `archived`
- `deleted staging state`

`accepted through owner` means the relevant truth or support owner has
accepted some or all staged material through its own mutation path.
Interchange keeps provenance and transfer history, but it no longer owns
the accepted result.

Deleting staging state must not delete:

- the original source file or linked source unless separately
  authorized through `File Manager / Asset Pane`,
- already accepted owner state,
- transfer history that still needs to explain provenance or prior
  actions.

## 20D. Owner Routing And Acceptance

Accepted material routes explicitly to the proper owner:

- manuscript content -> `Narrative Insertion / Narrative Assertion`
- planning hierarchy or placement -> `Outline` or `Story Unit`
- project-level creative intent -> `Author Intent / Story Setup`
- character facts -> `Character Cards`
- lore or world facts -> `Lore Cards`
- organization reference -> `Binder / Project Library`
- source file and asset posture -> `File Manager / Asset Pane`

Document Interchange may preserve provenance, source labels, warnings,
and transfer history after handoff.
It does not preserve accepted truth on behalf of those owners.

Accepted routing must be explicit, reviewable, and owner-governed.
Import does not automatically create accepted manuscript truth, canon,
cards, `Author Intent`, notes, signals, or memory.

## 20E. Reimport, Duplicate, And Update Handling

Reimport and duplicate posture must stay comparison-first.

The dossier should distinguish:

- same-source reimport,
- changed external document,
- duplicate source,
- possible duplicate content,
- update candidate,
- merge candidate,
- conflict preview,
- removed-source-section candidate,
- stale prior import,
- partial reimport failure.

Settled behavior:

- compare before applying,
- preserve prior import history,
- never silently overwrite accepted project objects,
- removed source sections do not automatically delete accepted local
  material,
- uncertain matches remain advisory,
- merge and update require explicit review and owner-routed acceptance.

A same-source reimport may refresh a staged import session, create a new
update candidate, or create a merge candidate.
That choice remains explicit and reviewable.

A changed external document may stale prior staging or prior source
links.
It must not silently mutate accepted manuscript, planning, character,
lore, or project-intent objects.

## 20F. Export Job And Artifact Model

Export is an outbound artifact workflow, not save-state, persistence,
synchronization, or truth ownership.

An export job should carry:

- job identity,
- selected scope,
- source revision or snapshot reference,
- destination,
- format,
- package contents,
- protection and mask posture,
- approval state,
- generated artifact identity,
- provenance,
- success, partial failure, cancellation, refusal, or retry state.

Generated artifact identity belongs to interchange while the job is
being prepared, previewed, transmitted, or recorded in transfer history.
If the resulting artifact is retained as a local file, `File Manager /
Asset Pane` owns the durable file or asset metadata for that retained
artifact.

Export modes remain visibly distinct, including:

- clean export,
- annotated export,
- provenance-aware export,
- later emergency raw-prose export only if separately approved.

## 20G. Google Docs Boundary

Google Docs is a manual interchange endpoint.
It is not autosave authority, persistence authority, or live-sync
authority.

Supported boundary posture:

- import from a selected Google Doc,
- export to a new Google Doc,
- explicit update or replacement of a selected destination document,
- manual refresh or reimport,
- conflict preview,
- permission failure handling,
- unavailable service or account handling,
- offline fallback.

An update to a selected Google Doc requires preview and outbound
approval.
A changed Google Doc does not silently modify local accepted objects.
A changed local project object does not silently overwrite the external
Google Doc.

Document linkage metadata may preserve which external document was used,
but that linkage does not imply background sync or standing mutation
rights.

## 20H. Protection And Outbound Clearance

Protection checks apply to:

- document content,
- filenames and titles,
- comments and metadata,
- previews,
- explicit-content masks,
- approved summaries,
- local-only and never-send state,
- destination visibility,
- Companion-assisted summaries,
- AI-assisted classification or transfer.

Outbound preview must show:

- selected scope,
- destination,
- masked or excluded material,
- source revision,
- expected artifact,
- warnings and blocked content.

Protected, hidden, excluded, local-only, never-send, masked, or
AI-excluded material must not leak through raw content, filenames,
document titles, comments, metadata, previews, or summaries.

Refusal or failure must preserve safe local work and provide a non-AI or
local fallback where possible.

## 20I. Failure, Recovery, And Cleanup

Failure posture must be explicit for:

- parsing failure,
- unsupported formatting,
- partial import,
- partial export,
- interrupted operation,
- lost connection,
- permission failure,
- destination conflict,
- retry,
- saved staging state,
- temporary artifact cleanup,
- cancelled operation,
- return to local writing.

Partial failure must not present incomplete work as fully accepted or
fully exported.
Interrupted work may preserve bounded staging, job, or history state for
review or retry, but it must not simulate completion.

Failed interchange must not block safe local writing.
Local writing, local review, and manual navigation remain available even
when transfer, preview, parsing, indexing, AI assistance, or provider
access fails.

## 20J. Handoffs

Document Interchange handoffs should preserve:

- visible surface,
- source-document identity,
- import-session or export-job identity,
- staged-content or export-scope reference,
- source label,
- affected scope,
- protection state,
- warnings,
- provenance or history reference,
- requested action,
- return-to-prior-location anchor where available.

Document Interchange may hand off to:

- `File Manager / Asset Pane` for source identity, asset posture,
  retained export artifacts, relink, or repair,
- `Binder / Project Library` for optional organizational references,
- `Project Index / Search / Retrieval` for permitted indexing of
  classified import state or retained artifacts,
- the correct truth owner for explicit acceptance,
- `Writing Surface` for manuscript review or placement,
- `Command Center Surface` for deeper classification, comparison,
  conflict review, or outbound review,
- recovery or history systems for interrupted or historical interchange
  context.

The receiving system does not gain interchange ownership merely by
consuming the handoff.
If the owner blocks, downgrades, or refuses the requested action, the
surface must render that result honestly.

## 21. GUI Placement Principles

Placement rules:

- import and export entry points should be easy to find,
- heavy preview, warning, duplicate, and conflict detail should appear
  only when needed,
- transfer UI should not turn the app into a document-sync dashboard,
- autosave or persistence cues should stay separate from interchange
  cues,
- external-transfer risk should be visible before action, not buried
  after it.

## 22. Local LLM Role

Local models are not required for core human document interchange.
If later used for bounded format repair, OCR cleanup, duplicate hints,
or structure recovery, that remains a future governed experiment rather
than current doctrine.

## 23. Paid API Role

Paid API is not required for core human document interchange.
Any future paid OCR, cleanup, conversion, classification assist, or
publishing-assist path must remain separately governed and explicitly
approved.

## 24. Model Routing Notes And Cost / Budget Impact

Most local file import and local export paths should not require model
routing.

External transfer, provider-bound conversion, Google Docs exchange,
OCR-derived assistance, or AI-shaped export transformations must
respect `Model Routing And Budget Architecture`.
This dossier does not decide whether raw text, structured JSON or
markdown, `docx`, `pdf`, OCR text, or another format is best for AI
use.
AI or memory transfer-format questions remain future contract or testing
territory rather than settled human export doctrine in this dossier.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Document Interchange must respect:

- explicit-content clearance,
- author-approved package views,
- protected-content permissions,
- provenance visibility settings,
- AI exclusion zones,
- masked, hidden, deleted, and protected range boundaries,
- author-controlled export preview,
- no silent outbound transfer.

No export or external transfer may silently widen beyond the approved
view.
Clean export, annotated export, provenance-aware export, emergency
raw-prose export, and external document update must remain visibly
distinct choices.
Emergency raw-prose export, if later approved, must remain explicitly
bounded and must not bypass masking, permissions, provenance choices, or
other protection rules by accident.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Privacy and safety rules:

- no silent outbound transfer,
- no silent Google Docs sync,
- no silent export of raw manuscript,
- no silent local truth mutation from external drift,
- masked, hidden, deleted, protected, local-only, never-send, or
  AI-excluded content must not export by default,
- permission failures and blocked transfers must be shown honestly,
- degraded or offline state must not pretend a transfer succeeded.

## 27. Testing Requirements

Future proof set should include:

- import destination-classification tests,
- messy-manuscript import tests,
- imported-format metadata and loss-warning tests,
- same-source reimport and duplicate-detection tests,
- conflict-preview and update-candidate tests,
- clean-versus-annotated export selection tests,
- protected-content exclusion tests,
- provenance-aware export tests,
- Google Docs approval, update, and drift-protection tests,
- conflict and permission-failure tests,
- degraded-mode and fallback tests,
- emergency raw-prose export containment tests later if that mode is
  approved.

## 28. Governance Rules And Risks

Governance rules:

- imported text is not accepted canon by default,
- imported material defaults to staging, review, or candidate-like
  intake rather than direct truth placement,
- no silent outbound transfer,
- no silent sync,
- no silent raw-manuscript export,
- no silent external-document drift rewriting local project state,
- each export mode must declare its source object explicitly,
- exported artifacts are transfer artifacts rather than local truth
  authority,
- explicit-content, provenance, routing, degraded-mode, handoff, and
  permission boundaries must be respected,
- final author decisions remain outside this dossier's authority.

Risks:

- messy imported text being mistaken for accepted truth or silently
  canonized,
- reference-only material being mistaken for staged truth candidates,
- staging material being mistaken for ordinary Binder organization or
  default search canon,
- projection, outline, assertions, or package views being exported as if
  they were the same thing,
- same-source reimport silently overwriting accepted local work,
- removed source sections being treated as local delete instructions,
- round-trip formatting loss hiding content changes inside an apparently
  successful transfer,
- Google Docs drift quietly overwriting local work,
- external document drift becoming local project truth,
- protected or excluded material leaking through export, metadata,
  previews, or summaries,
- AI package-format decisions being confused with human export doctrine,
- emergency raw-prose export bypassing protection rules,
- dossier scope drifting into autosave, storage, or AI package doctrine.

## 29. Failure Modes

Failure modes include:

- imported documents with unreliable structure,
- messy imports being classified too aggressively as manuscript truth
  instead of source, reference, planning, candidate, or quarantined
  material,
- staged import material being mistaken for ordinary Binder
  organization or search-default canon,
- comments, headings, or metadata that cannot be mapped cleanly,
- same-source or duplicate-source matches that are too weak to trust,
- export preview not matching the final payload,
- permission failure on external destinations,
- offline or degraded reconnect mismatch,
- duplicate or stale Google Docs identity links,
- round-trip conflicts with no safe merge path,
- content changes being hidden by format-loss or projection-loss,
- user expectation that transfer history equals story truth.

## 30. v1 Boundary

`v1` should stay minimal and explicit once implementation planning
exists:

- bounded human-readable import and export,
- explicit import-session staging and classification,
- visible destination classification,
- visible duplicate, drift, and format-loss warnings,
- clear preview and approval before outbound transfer or selected
  external-document update,
- no silent sync,
- no silent raw-manuscript export,
- no claim that every listed format must ship in the first
  implementation slice.

## 31. v2 Boundary

`v2` may add:

- richer format coverage,
- stronger comments and formatting preservation,
- selected one-way Google Docs flows with stronger document-linkage
  review,
- stronger conflict review,
- more export package choices when provenance and explicit-content
  contracts are tighter.

## 32. Future-Only Boundary

Future-only items:

- Google Docs two-way sync as settled build doctrine,
- autonomous cloud sync,
- multi-author collaboration,
- publishing-platform integrations,
- settled AI or memory transfer-format doctrine,
- claims that OCR-derived, raw-text, `pdf`, `docx`, JSON, or markdown
  paths are inherently best for AI use.

## 33. Pre-Rough Alignment Questionnaire

Intake note:

- external question source reviewed:
  `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, selectively from import, export, Google
  Docs, provenance-export, degraded-mode, and build-order questions
- stale or over-broad Google Docs-only framing removed: yes
- remaining blocker summary: `0 Fatal`, `3 Critical`, `5 Major`

### Fatal Questions

- None currently.

### Critical Questions

- Future contract need: what exact per-format preservation, downgrade,
  and warning contract should govern comments, headings, metadata,
  tracked changes, and ambiguous `pdf` extraction before runtime wiring?
- Future contract need: what exact emergency raw-prose export limits are
  acceptable so recovery help never bypasses masking, protected-content
  boundaries, provenance choices, or explicit approval?
- Future contract need: which first-slice format set is mandatory for
  bounded implementation and which listed formats remain deferred?

### Major Questions

- Major: how should mixed imports that contain both manuscript-like
  content and card- or planning-like material best present
  classification choices without crowding review?
- Major: what naming best distinguishes reference-only material, staged
  candidate material, quarantined material, update candidate, and merge
  candidate?
- Major: how much Google Docs-specific language should appear in the
  primary UI when Google Docs is only one endpoint inside a broader
  interchange system?
- Major: which export presets are useful enough early to surface by
  name, and which should remain summonable?
- Major: how much transfer history should appear by default versus
  summonable only?

### Minor Questions

- Minor: what copy best explains that protected metadata, filenames, and
  titles may themselves be blocked from outbound transfer?

### Answered / Superseded Questions

- Answered / Superseded: import defaults to staging, review, candidate,
  reference-only, or other explicitly classified intake states rather
  than accepted manuscript or accepted truth.
- Answered / Superseded: each export mode must declare its source object
  explicitly rather than flattening manuscript, assertions, outline,
  projection, package views, or support artifacts into one authority
  layer.
- Answered / Superseded: imported material does not silently canonize,
  and externally edited material does not silently rewrite local
  manuscript or project truth.
- Answered / Superseded: exported artifacts are transfer artifacts
  rather than local truth authority.
- Answered / Superseded: Google Docs-like autosave or instant-save feel
  does not belong here.
- Answered / Superseded: Google Docs is one external source or
  destination inside the broader document-interchange scope, not the
  whole scope.
- Answered / Superseded: Google Docs is not truth authority, local
  autosave authority, persistence authority, or build-ready sync
  doctrine in this dossier.
- Answered / Superseded: Story Units are not a mandatory gate for import
  or export.
- Answered / Superseded: `Companion` may explain or route transfer
  requests, but it does not own transfer authority.
- Answered / Superseded: clean export is valid by default, and
  provenance-aware export should be an author-controlled mode rather
  than a forced always-on export doctrine.
- Answered / Superseded: `File Manager / Asset Pane` does not own
  import, export, sync, or transfer authority.
- Answered / Superseded: protected-content, explicit-content,
  provenance, routing, and degraded-mode behavior inherit from the
  canonical governance contracts rather than being reinvented inside
  this dossier.
- Answered / Superseded: unknown or messy imports default to
  reference-only or other safe staging posture rather than truth
  acceptance.
- Answered / Superseded: same-source reimport, duplicate handling, and
  external drift are comparison-first and never silently overwrite
  accepted project objects.

### Deferred Questions

- Deferred: whether early `v1` interchange stays deliberately minimal
  and whether Google Docs is limited to deferred or one-way-only support
  in that slice.
- Deferred: whether later publishing integrations beyond bounded
  human-readable export should remain outside near-term implementation.
- Deferred: Google Docs two-way sync, cloud sync, and multi-author
  collaboration remain future-only unless later doctrine narrows them
  safely.
- Deferred and future contract need: AI or memory transfer-format
  questions, including raw text versus file transfer, structured JSON or
  markdown versus `docx` or `pdf`, OCR-derived experiments, token or
  cost effects, fidelity, evidence quality, routing effects, temporary
  package artifacts, durable `Memory Lab` artifacts, and outbound safety
  boundaries, remain primarily owned by
  `LLM Package Construction Architecture`,
  `Model Routing And Budget Architecture`, and `Memory Lab` until later
  cross-dossier tightening says otherwise.

## 34. Acceptance Criteria

Implementation remains blocked by open Critical and Future contract
questions.
This dossier is drafted, implementation-neutral, and not build-ready.

This dossier is acceptable only if it states explicitly that:

- imported text does not become authored truth without author action
  through the correct owner,
- staging, reference-only material, quarantined material, and accepted
  owner state remain distinct,
- projection containers do not replace narrative foundation authority,
- Story Units are not treated as a mandatory import or export gate,
- inferred, derived, or `Companion` output does not become authored
  truth without author action,
- the dossier does not present fake certainty about format fidelity,
  sync safety, or build readiness,
- Google Docs-like autosave or instant-save behavior is excluded from
  this dossier,
- AI or memory transfer-format doctrine remains future contract
  territory rather than settled truth here,
- the dossier does not claim hidden runtime authority that the
  implementation does not actually own,
- active questions live in this centralized questionnaire rather than
  only in the external raw register,
- the dossier remains a living investigation file rather than a locked
  milestone claim.
