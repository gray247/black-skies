# Import Export Document Interchange

## 1. Status Header

- Dossier name: `Import Export Document Interchange`
- Status: `Exploring`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-10`
- Depends on: `Writing Surface`, `Binder / Project Library`, `File Manager / Asset Pane`, `Authorship Provenance AI Visibility`, `Explicit Content Architecture`, `Model Routing And Budget Architecture`
- Feeds into: `Writing Surface`, `Binder / Project Library`, `File Manager / Asset Pane`, `Command Center Surface`, `Companion`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define the author-facing human document interchange capability so Black Skies can import and export common document material without confusing transfer workflows with autosave, storage authority, AI package doctrine, or story truth.

## 3. User Problem Solved

The writer needs to bring outside document material into Black Skies, send Black Skies material out to common human-readable formats, and review what will cross that boundary before transfer, loss, drift, or protected-content mistakes happen.

## 4. What The System Does

Document Interchange:

- owns author-facing import workflow contracts,
- owns author-facing export workflow contracts,
- defines the human document import or export capability for common human-readable formats,
- defines common human document format posture for `docx`, `pdf`, markdown, plain text, pasted text, later publishing formats such as `ePub`, and Google Docs as one external source or destination,
- classifies where imported material lands, such as manuscript text, source material, archive material, candidate material, notes, or binder or project material,
- distinguishes clean export from annotated or provenance-aware export,
- provides author-controlled export preview and approval points,
- surfaces format-loss, drift, and conflict warnings,
- defines one-way import, one-way export, and future round-trip posture for external documents,
- protects masked, hidden, deleted, protected, or AI-excluded content at transfer boundaries.

## 5. What The System Does Not Do

Document Interchange does not:

- own Google Docs-like autosave or instant-save feel,
- own local autosave,
- own local save-state behavior,
- own snapshots,
- own backup or restore,
- own crash recovery,
- replace `File Manager / Asset Pane` as storage or browse authority,
- replace `Binder / Project Library` as organization or destination context,
- replace provenance doctrine, explicit-content policy, routing policy, package-construction policy, or `Memory Lab` durable-memory rules,
- silently canonize imported text as accepted story truth, accepted continuity truth, or author-owned story truth,
- silently export raw manuscript, silently sync, or silently rewrite local manuscript state from an external document,
- claim that any specific format path is build-ready.

## 6. User-Facing Behavior

Visible behavior should emphasize:

- clear import and export entry points,
- visible destination classification before import commits,
- visible clean-versus-annotated export selection,
- preview before export, sync, publish, or other external transfer,
- explicit warnings when formatting, comments, metadata, or structure may be lost,
- clear conflict, drift, permission-failure, and offline messaging,
- author approval before any external document transfer mutates local project state,
- Google Docs treated as one external source or destination rather than the whole feature,
- no claim that future Google Docs sync is build-ready.

## 7. Hidden/Background Behavior

Background behavior may later include:

- format sniffing and parser selection,
- serializer selection,
- document identity comparison,
- conflict or drift detection,
- permission and availability checks,
- degraded-mode transfer containment,
- temporary staging of previews, diffs, or package-ready output views.

Background behavior must not silently create truth, silently move content outbound, or silently turn external document edits into accepted local manuscript state.

## 8. What Appears First

What appears first:

- a clear choice to import, export, or inspect transfer state,
- the current project or destination context,
- the selected transfer scope,
- any blocking warnings that must be understood before the transfer continues.

## 9. What Is Summonable

Summonable later from Document Interchange:

- format-loss warnings,
- import destination choices,
- export previews,
- clean-versus-annotated export modes,
- Google Docs transfer choices,
- conflict comparisons,
- permission and failure detail,
- emergency raw-prose export options later if approved.

## 10. What Is Hidden Until Needed

Hidden until needed:

- low-level parser or serializer detail,
- raw document identity internals,
- sync drift mechanics,
- per-format compatibility edge cases,
- future AI or memory transfer-format experiments,
- low-value status clutter.

## 11. Inputs

Inputs include:

- local `docx`, `pdf`, markdown, plain-text, or other later human-readable files,
- pasted text,
- Google Docs documents later as one external source,
- current manuscript or selected manuscript scope,
- prose projection, outline, assertions, or selected package view when an export mode explicitly uses them,
- binder or destination context,
- provenance visibility settings,
- explicit-content clearance state,
- protected-content permissions,
- routing or approval state when a transfer crosses a governed external boundary,
- degraded-mode and storage-state signals from adjacent systems.

## 12. Outputs

Outputs include:

- imported material staged or placed into a chosen destination state,
- export previews,
- formatted output files or external-document payloads later,
- format-loss warnings,
- conflict or drift warnings,
- transfer status,
- failure or fallback states,
- author-visible clean or annotated export selections.

Outputs remain transfer artifacts or workflow state until the author explicitly accepts resulting local changes.

Import destination classes are rough product-definition labels rather than final storage schema:

- `manuscript text`
- `source material`
- `archive material`
- `candidate material`
- `notes`
- `binder or project material`

Imported material must not silently become accepted canon, accepted continuity truth, or author-owned story truth.

## 13. Which Other Systems Consume Those Outputs

Likely downstream consumers:

- `Writing Surface`
- `Binder / Project Library`
- `File Manager / Asset Pane`
- `Command Center Surface`
- `Authorship Provenance AI Visibility`
- `Explicit Content Architecture`
- `Model Routing And Budget Architecture`
- `Memory Lab` only through later author-approved, governed import or export derivatives rather than silent raw transfer

## 14. What Gets Stored

Eventually stored:

- import source references later,
- import destination classification later,
- transfer history markers later,
- document identity links later for approved external-document relationships,
- acknowledged format-loss warnings later,
- author-chosen export mode preferences later,
- author-approved external-document linkage metadata later.

Stored transfer metadata does not become manuscript truth by itself.

## 15. What Remains Temporary

Temporary or derived:

- parsed intermediary representations,
- import previews,
- export previews,
- temporary diffs,
- transient Google Docs reconnect state,
- temporary package-shaped export candidates,
- failed transfer attempts,
- OCR-derived or other format experiments before any future doctrine explicitly preserves them.

These temporary artifacts must not be mistaken for the approved human export payload, durable `Memory Lab` material, or final import-created project truth.

## 16. Relationship To Narrative Insertion / Assertion

Document Interchange may import material that later becomes candidate manuscript, notes, source material, or other author-reviewed input for `Narrative Insertion / Narrative Assertion`.
It must not silently treat imported text as already accepted narrative truth.

Export may use accepted manuscript text, prose projection, assertions, outline, or another selected view only when the export mode explicitly says so.
Possible export sources still need tighter doctrine by mode and may include accepted manuscript text, prose projection, selected package view, outline-derived structure, assertions or accepted facts, or notes or signals or cards or lore only when explicitly included.
No export view replaces narrative foundation authority.

## 17. Relationship To Story Units

Story Units may supply optional export scope or import destination context later, but Story Units are not a mandatory gate for import or export.

## 18. Relationship To Prose / Scene Projection

Document Interchange may consume prose or projection views as export sources when the author intentionally chooses that mode.
It must not assume scene-first or projection-first authority for import.

## 19. Relationship To Writing Surface

The Writing Surface remains the sovereign drafting surface.
Document Interchange may bring material into or out of the Writing Surface context, but it does not own local persistence, autosave feel, save-state behavior, or crash recovery.

Google Docs-like instant-save behavior belongs with `Writing Surface`, `Snapshots / Backup / Restore / History`, `Service Health / Offline / Degraded Mode`, and `Workflow Spine / Author Journey`, not this dossier.

## 20. Relationship To Command Center Surface

The Command Center is the likely home for heavier preview, approval, drift review, conflict review, and failure-inspection workflows.
It may support transfer work, but it must not become a mandatory gate before basic writing continues.

## 21. GUI Placement Principles

Placement rules:

- import and export entry points should be easy to find,
- heavy preview, warning, and conflict detail should appear only when needed,
- transfer UI should not turn the app into a document-sync dashboard,
- autosave or persistence cues should stay separate from interchange cues,
- external-transfer risk should be visible before action, not buried after it.

## 22. Local LLM Role

Local models are not required for core human document interchange.
If later used for bounded format repair, OCR cleanup, or structure recovery, that remains a future governed experiment rather than current doctrine.

## 23. Paid API Role

Paid API is not required for core human document interchange.
Any future paid OCR, cleanup, conversion, or publishing-assist path must remain separately governed and explicitly approved.

## 24. Model Routing Notes And Cost / Budget Impact

Most local file import and local export paths should not require model routing.

External transfer, provider-bound conversion, Google Docs sync, OCR-derived assistance, or AI-shaped export transformations must respect `Model Routing And Budget Architecture`.
This dossier does not decide whether raw text, structured JSON or markdown, `docx`, `pdf`, OCR text, or another format is best for AI use.
AI or memory transfer-format questions remain future contract or testing territory rather than settled human export doctrine in this dossier.

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

No export or external transfer may silently widen beyond the approved view.
Clean export, annotated export, provenance-aware export, emergency raw-prose export, and external sync must remain visibly distinct choices.
Emergency raw-prose export, if later approved, must remain explicitly bounded and must not bypass masking, permissions, provenance choices, or other protection rules by accident.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Privacy and safety rules:

- no silent outbound transfer,
- no silent Google Docs sync,
- no silent export of raw manuscript,
- no silent local truth mutation from external drift,
- masked, hidden, deleted, protected, or AI-excluded content must not export by default,
- permission failures and blocked transfers must be shown honestly,
- degraded or offline state must not pretend a transfer succeeded.

## 27. Testing Requirements

Future proof set should include:

- import destination-classification tests,
- messy-manuscript import tests,
- imported-format metadata and loss-warning tests,
- clean-versus-annotated export selection tests,
- protected-content exclusion tests,
- provenance-aware export tests,
- Google Docs approval and drift-protection tests,
- conflict and permission-failure tests,
- degraded-mode and fallback tests,
- emergency raw-prose export containment tests later if that mode is approved.

## 28. Governance Rules And Risks

Governance rules:

- imported text is not accepted canon by default,
- no silent outbound transfer,
- no silent sync,
- no silent raw-manuscript export,
- no silent external-document drift rewriting local project state,
- explicit-content, provenance, routing, and permission boundaries must be respected,
- final author decisions remain outside this dossier's authority.

Risks:

- messy imported text being mistaken for accepted truth or silently canonized,
- projection, outline, assertions, or package views being exported as if they were the same thing,
- round-trip formatting loss hiding content changes inside an apparently successful transfer,
- Google Docs sync or drift quietly overwriting local work,
- external document drift becoming local project truth,
- protected or excluded material leaking through export or sync,
- AI package-format decisions being confused with human export doctrine,
- emergency raw-prose export bypassing protection rules,
- dossier scope drifting into autosave, storage, or AI package doctrine.

## 29. Failure Modes

Failure modes include:

- imported documents with unreliable structure,
- messy imports being classified too aggressively as manuscript truth instead of source, archive, candidate, note, or binder material,
- comments, headings, or metadata that cannot be mapped cleanly,
- export preview not matching the final payload,
- permission failure on external destinations,
- offline or degraded reconnect mismatch,
- duplicate or stale Google Docs identity links,
- round-trip conflicts with no safe merge path,
- content changes being hidden by format-loss or projection-loss,
- user expectation that transfer history equals story truth.

## 30. v1 Boundary

`v1` should stay minimal and explicit once implementation planning exists:

- bounded human-readable import and export,
- visible destination classification,
- visible format-loss warnings,
- clear preview and approval before transfer,
- no silent sync,
- no silent raw-manuscript export,
- no claim that every listed format must ship in the first implementation slice.

## 31. v2 Boundary

`v2` may add:

- richer format coverage,
- stronger comments and formatting preservation,
- selected one-way Google Docs flows,
- stronger conflict review,
- more export package choices when provenance and explicit-content contracts are tighter.

## 32. Future-Only Boundary

Future-only items:

- Google Docs two-way sync as settled build doctrine,
- autonomous cloud sync,
- multi-author collaboration,
- publishing-platform integrations,
- settled AI or memory transfer-format doctrine,
- claims that OCR-derived, raw-text, `pdf`, `docx`, JSON, or markdown paths are inherently best for AI use.

## 33. Pre-Rough Alignment Questionnaire

Intake note:

- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, selectively from import, export, Google Docs, provenance-export, degraded-mode, and build-order questions
- stale or over-broad Google Docs-only framing removed: yes
- remaining blocker summary: `4 Fatal`, `6 Critical`, `6 Major`

### Fatal Questions

- Future contract need: what exact local object or destination state does import create first for each intake path, including manuscript, source material, archive material, candidate material, notes, binder material, or staged review state, so imported text does not silently become accepted truth?
- Future contract need: what exact source material may each export mode operate on, including accepted manuscript text, prose projection, assertions, outline, or selected package view, so export does not flatten different authority layers into one misleading output?
- Future contract need: what rules prevent imported or externally edited documents, including future Google Docs sync flows, from silently canonizing text or rewriting local manuscript or project state?
- Future contract need: what exact anti-canonization and anti-drift rules stop messy imports, external edits, reconnect events, or emergency transfer paths from becoming local project truth without explicit author approval?

### Critical Questions

- Future contract need: how must imported comments, headings, formatting, metadata, unknown structures, and `pdf` extraction ambiguity be preserved, downgraded, or dropped with visible format-loss warnings?
- Future contract need: what preview and approval steps are mandatory before export, publish, external transfer, or any sync mutation, especially when provenance visibility, explicit-content masking, or protected content is involved?
- Future contract need: what document identity, diff, conflict, permission-failure, offline, reconnect, and drift rules are required before any Google Docs round-trip or sync claim can exist?
- Future contract need: what safe failure and fallback paths must exist when import or export fails, including degraded mode, emergency raw-prose export, read-only fallback, or backup-export support?
- Future contract need: what exact limits must govern emergency raw-prose export so it can serve recovery without bypassing masking, protected-content boundaries, provenance choices, or explicit author approval?
- Future contract need: what exact format-loss handling contract is required when round-trip conversion drops comments, headings, structure, formatting, annotations, or provenance-visible distinctions?

### Major Questions

- Jason decision candidate: which common formats are mandatory for the first bounded implementation slice, and which remain deferred even though the dossier owns their future posture?
- Major: how should messy imported manuscripts with missing, wrong, or misleading structure be classified without forcing false chapters, false headings, or false story order?
- Major: which non-manuscript materials may export in which modes, including critique, signals, notes, lore, character data, relationship data, or card views, and what must stay excluded by default?
- Major: should `Existing Google Doc first`, pasted-text-first, folder-of-notes-first, and fragmented-mess-first imports all use one shared intake workflow or diverge into different guided paths?
- Future contract need: when `docx`, `pdf`, markdown, plain text, `ePub`, or later formats disagree in fidelity, what user-facing loss warnings, fallback choices, and recovery options are required?
- Future contract need: what testing should compare raw text versus file transfer, structured JSON or markdown packages versus `docx` or `pdf`, OCR-derived experiments, token or cost effects, fidelity, evidence quality, routing effects, temporary package artifacts, and durable `Memory Lab` artifact rules without confusing those studies with human export doctrine?

### Minor Questions

- Minor: what naming best distinguishes clean export, annotated export, provenance-aware export, package-view export, and emergency raw-prose export?
- Minor: how much Google Docs-specific wording should appear in primary UI when Google Docs is only one external source or destination inside a broader interchange system?

### Answered / Superseded Questions

- Answered / Superseded: Google Docs-like autosave or instant-save feel does not belong here. It belongs with `Writing Surface`, `Snapshots / Backup / Restore / History`, `Service Health / Offline / Degraded Mode`, and `Workflow Spine / Author Journey`.
- Answered / Superseded: Google Docs is one external source or destination inside the broader document-interchange scope, not the whole scope.
- Answered / Superseded: Story Units are not a mandatory gate for import or export.
- Answered / Superseded: `Companion` may explain or route transfer requests, but it does not own transfer authority.
- Answered / Superseded: clean export is valid by default, and provenance-aware export should be an author-controlled mode rather than a forced always-on export doctrine.
- Answered / Superseded: `File Manager / Asset Pane` does not own import, export, sync, or transfer authority.

### Deferred Questions

- Deferred: whether early `v1` interchange stays deliberately minimal and whether Google Docs is limited to deferred or one-way-only support in that slice.
- Deferred: whether later publishing integrations beyond bounded human-readable export, including broader publishing workflows, should remain outside near-term implementation.
- Deferred: Google Docs two-way sync, cloud sync, and multi-author collaboration remain future-only unless later doctrine narrows them safely.
- Deferred and future contract need: AI or memory transfer-format questions, including raw text versus file transfer, structured JSON or markdown versus `docx` or `pdf`, OCR-derived experiments, token or cost effects, fidelity, evidence quality, routing effects, temporary package artifacts, durable `Memory Lab` artifacts, and outbound safety boundaries, remain primarily owned by `LLM Package Construction Architecture`, `Model Routing And Budget Architecture`, and `Memory Lab` until later cross-dossier tightening says otherwise.

## 34. Acceptance Criteria

Implementation remains blocked by open Fatal and Critical questions.
This dossier is rough, investigative, and not build-ready.

This dossier is acceptable only if it states explicitly that:

- imported text does not become authored truth without author action,
- projection containers do not replace narrative foundation authority,
- Story Units are not treated as a mandatory import or export gate,
- inferred, derived, or `Companion` output does not become authored truth without author action,
- the dossier does not present fake certainty about format fidelity, sync safety, or build readiness,
- Google Docs-like autosave or instant-save behavior is excluded from this dossier,
- AI or memory transfer-format doctrine remains future contract territory rather than settled truth here,
- the dossier does not claim hidden runtime authority that the implementation does not actually own,
- active questions live in this centralized questionnaire rather than only in the external raw register,
- the dossier remains a living investigation file rather than a locked milestone claim.
