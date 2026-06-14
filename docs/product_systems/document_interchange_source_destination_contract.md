# Document Interchange Source And Destination Contract

## 1. Purpose

Define the canonical source and destination contract for `Import Export Document Interchange`.

This artifact exists to answer:

- what object is the source
- what object is the destination
- what truth is preserved
- what truth is forbidden
- what may become truth only after explicit owner-governed acceptance
- what may never become truth automatically

## 2. Scope

This contract governs:

- import source objects
- export source objects
- internal destination objects
- external destination objects
- staging, review, transfer, and sync vocabulary
- truth-safety rules at interchange boundaries
- failure behavior when source or destination is ambiguous

This contract applies to:

- `Import Export Document Interchange`
- truth owners such as `Narrative Insertion / Assertion`, `Lore Cards`, and `Character Cards`
- durable-state owners such as `Feedback Notes`, `Signal Architecture`, `Memory Lab`, `Authorship Provenance AI Visibility`, and `Snapshots`
- host surfaces such as `Writing Surface`, `Command Center Surface`, and `Workflow Spine / Author Journey`

## 3. Non-Goals

- Google Docs implementation
- sync implementation
- exact format fidelity rules for `docx`, `pdf`, markdown, `epub`, or later formats
- runtime schema
- runtime storage model
- package schema
- redesign of `Memory Lab`, `Signal Architecture`, `Snapshots`, or `Workflow Spine`

## 4. Core Doctrine

- Imported material is not automatically truth.
- Exported material does not become truth authority.
- External systems do not become truth authority.
- Google Docs is not truth authority.
- Package artifacts are not truth authority.
- Snapshots are not truth authority.
- Signals are not truth authority.
- Notes are not truth authority.
- Memory is not truth authority.
- Truth remains owned by truth owners.
- Import creates staged or classified intake objects first unless an explicit owner-governed acceptance path says otherwise.
- Export emits author-chosen projection or transfer artifacts, not new local truth.
- Transfer history is not manuscript truth.
- Source identity and destination identity must remain explicit by mode.

## 5. Source Object Taxonomy

| Source object | Owner | Export eligibility | Import eligibility | Truth status | Transfer restrictions |
| --- | --- | --- | --- | --- | --- |
| `accepted manuscript` | `Narrative Insertion / Assertion` | yes, primary human export source | no direct import as truth; imported text must stage first | accepted truth | no silent raw-manuscript export |
| `accepted truth` | truth owner for the object | no generic export by default; only by explicit mode | no direct import as truth | accepted truth | must not flatten into one export mode by accident |
| `accepted assertions` | `Narrative Insertion / Assertion` | yes only in explicit assertion-aware modes | no direct truth import | accepted truth | cannot silently replace manuscript or lore authority |
| `accepted lore` | lore truth owner | export only when explicit lore-inclusive mode exists | no direct lore truth import | accepted truth | no silent lore canonization from imports |
| `accepted character facts` | character truth owner | export only when explicit character-inclusive mode exists | no direct character truth import | accepted truth | no silent character-fact canonization from imports |
| `outline` | `Outline` | exportable only in explicit outline mode | importable only as staged/support structure, not truth | non-truth planning state | must not be mistaken for manuscript or canon |
| `story-unit structures` | `Story Unit` | exportable only in explicit structural mode | importable only as staged/support structure | non-foundational structure | Story Unit is not mandatory gate |
| `projections` | projection owners / display systems | exportable only when a mode explicitly names projection as source | importable only as compatibility or staged display material | non-truth display state | projection must not replace narrative foundation |
| `notes` | `Feedback Notes / Revision Resolution` or relevant note owner | exportable only in note-specific modes | importable into note destination only through explicit classification | non-truth durable note state | no silent note-to-truth conversion |
| `signals` | `Signal Architecture` | exportable only if a future explicit signal mode exists | importable only as staged advisory artifacts unless later defined | non-truth durable signal/advisory state | no silent signal-to-truth conversion |
| `memory` | `Memory Lab` | not normal human export source by default | no direct raw memory import path into truth | non-truth governed recall | no silent raw memory transfer or canonization |
| `provenance` | `Authorship Provenance AI Visibility` | exportable only in provenance-aware modes | importable only as provenance or review metadata | non-truth metadata | must not become story truth |
| `snapshots` | `Snapshots / Backup / Restore / History` | not normal human export source by default | may serve recovery intake only, not ordinary import truth | historical state, not current truth | no silent restore into current truth |
| `imported documents` | `Import Export Document Interchange` until handoff | may be re-exported only after explicit classification and mode selection | yes | staged/import-classified, not accepted truth | no auto-canonization |
| `generated content` | requesting AI system until owner acceptance | exportable only if explicitly selected as advisory/review artifact | importable only as staged/generated review artifact | advisory, non-truth | no silent acceptance as manuscript |
| `package artifacts` | `LLM Package Construction Architecture` | not human export source by default | importable only as technical/staged artifact if ever allowed | package-only artifact, non-truth | package artifact must not be confused with human document source |
| `export artifacts` | `Import Export Document Interchange` | yes, as already-produced transfer artifact | may re-enter only as imported material, not as truth | transfer artifact, non-truth | re-import does not imply truth authority |

## 6. Destination Object Taxonomy

### 6.1 Internal Destinations

| Destination | Owner | Approval requirements | Truth implications | Retention implications |
| --- | --- | --- | --- | --- |
| `manuscript` | `Narrative Insertion / Assertion` | `T2 + T6` minimum for accepted placement | becomes accepted manuscript only after explicit owner-governed acceptance | durable manuscript truth |
| `assertion truth` | `Narrative Insertion / Assertion` | `T2 + T6` | becomes accepted assertion truth only after explicit author acceptance | durable truth |
| `lore truth` | lore truth owner | `T2 + T6` | becomes accepted lore only after explicit truth-owner acceptance | durable truth |
| `character truth` | character truth owner | `T2 + T6` | becomes accepted character fact only after explicit truth-owner acceptance | durable truth |
| `outline` | `Outline` | `T2 + T6` when creating durable outline state from import | no truth authority implied | durable planning state |
| `notes` | `Feedback Notes / Revision Resolution` | `T2 + T6` for durable note creation | note is not truth | durable note state |
| `signals` | `Signal Architecture` | `T2 + T6` for durable signal creation | signal is not truth | durable signal state |
| `memory` | `Memory Lab` | `T2 + T6` | memory is not truth | durable memory only if retention rules allow |
| `project library` | `Binder / Project Library` | `T2 + T6` for durable placement | organization only, not truth | durable organization metadata |
| `asset library` | `File Manager / Asset Pane` | `T2 + T6` for attach/link or durable metadata placement | not truth | durable file/asset metadata |
| `import staging` | `Import Export Document Interchange` | `T1` or `T2 + T6` depending on risk | no truth by default | durable or temporary staging state by interchange rules |
| `review queue` | `Import Export Document Interchange` or relevant reviewing owner | `T2 + T6` for queueing if it creates durable review state | review object, not truth | bounded durable review state if kept |
| `provenance records` | `Authorship Provenance AI Visibility` | owner recording only; later explicit controls for wider retention | metadata only, not truth | durable local/private metadata |
| `snapshots` | `Snapshots / Backup / Restore / History` | `T2 + T6` for storing special restore markers if needed | historical only, not current truth | durable recovery state |

### 6.2 External Destinations

| Destination | Owner | Approval requirements | Truth implications | Retention implications |
| --- | --- | --- | --- | --- |
| `document export` | `Import Export Document Interchange` | `T2 + T6` minimum | external artifact does not become local truth authority | transfer history may persist |
| `Google Docs` | `Import Export Document Interchange` | `T3 + T6` | external system is not truth authority | transfer/sync history only |
| `markdown` | `Import Export Document Interchange` | `T2 + T6` | format artifact only | transfer history only |
| `epub` | `Import Export Document Interchange` | `T2 + T6` | format artifact only | transfer history only |
| `pdf` | `Import Export Document Interchange` | `T2 + T6` | format artifact only | transfer history only |
| `package artifact` | `LLM Package Construction Architecture` | `T3 + T6` if outbound or provider-bound | not human export truth, not local truth | temporary package history only unless separately recorded |
| `archive artifact` | `Import Export Document Interchange` or `Snapshots` depending on mode | `T2 + T6` | historical artifact only | archival retention only |
| `review artifact` | `Import Export Document Interchange` or relevant review owner | `T2 + T6` | advisory/review only | bounded durable review history if kept |

## 7. Import Contract

### 7.1 Default Import Rule

When material enters Black Skies, it becomes an `import staging` or `review` object first unless an explicit owner-governed destination path says otherwise.

Default doctrine:

- imported content is not accepted manuscript
- imported content is not accepted truth
- imported content is not accepted assertion truth
- imported content is not accepted lore truth
- imported content is not accepted character truth
- imported content is not durable signal state
- imported content is not durable memory

### 7.2 Conservative Default Destinations

Imported material may initially become:

- `import staging`
- `review object`
- `source material`
- `candidate material`
- `notes`, only when explicitly classified as note intake
- `project library` or `asset library` context, only when explicitly classified that way

### 7.3 Automatic Creation Rules

Imported material may automatically become:

- `import staging`: yes
- `review object`: yes
- `source material` or `candidate material`: yes, if explicitly chosen by interchange classification rules
- `notes`: only if the intake path is explicitly note-oriented and does not imply manuscript or truth authority

Imported material may not automatically become:

- manuscript
- accepted truth
- lore truth
- character truth
- signal
- memory

### 7.4 Approved Path Into Truth Or Durable State

Approved path:

1. import arrives as staged or classified intake
2. source identity, format-loss risk, and destination class are made visible
3. author chooses destination
4. owning destination system accepts or rejects the handoff
5. only then may the material become manuscript, assertion truth, lore truth, character truth, note state, signal state, memory, or structural support state

### 7.5 Import-Specific Safety Rules

- ambiguous imported material must stage, not auto-place into truth
- messy imported manuscripts must not be classified too aggressively as manuscript truth
- imported comments, notes, or metadata must not silently rewrite manuscript or canon
- imported review artifacts must remain review artifacts unless explicitly converted
- imported external edits must not silently drift local project truth

## 8. Export Contract

### 8.1 Export Doctrine

When material leaves Black Skies, it leaves as an explicitly chosen export mode from an explicitly named source object.
The export artifact is a transfer artifact, not a new truth owner.

### 8.2 Export Modes

| Export mode | Source object | Owner | Required approval | Protected-content behavior | Provenance behavior | Truth implications |
| --- | --- | --- | --- | --- | --- | --- |
| `manuscript export` | accepted manuscript | `Import Export Document Interchange` using manuscript owner source | `T2 + T6` | protected content excluded or transformed per protection rules | clean by default | exported manuscript is not new local truth authority |
| `annotated manuscript export` | accepted manuscript plus explicit annotation layer | `Import Export Document Interchange` | `T3 + T6` | protected annotations/content must obey protection rules | annotations included only by explicit mode | annotation layer is not canon |
| `provenance-aware export` | accepted manuscript plus provenance-visible data | `Import Export Document Interchange` with provenance owner cooperation | `T3 + T6` | protected raw provenance details may not leak by default | provenance included only by explicit mode | provenance remains metadata, not story truth |
| `notes export` | note objects | `Import Export Document Interchange` with note owner cooperation | `T3 + T6` | protected notes excluded or transformed as required | provenance optional by mode | notes remain non-truth review artifacts |
| `signal export` | signal objects | future explicit mode only | `T5` until later contract | protected signal evidence must not leak | provenance required if ever supported | signals remain advisory, not truth |
| `critique export` | critique findings or review artifact | future explicit mode only | `T5` until later contract | protected evidence bounded | provenance required if ever supported | critique remains advisory |
| `graph export` | relationship/emotion/theme graph views | future explicit mode only | `T5` until later contract | protected linked content bounded | provenance required if ever supported | graphs are projections, not truth authority |
| `archive export` | author-chosen historical or archive source | `Import Export Document Interchange` or archive owner | `T3 + T6` | protected content rules still apply | provenance optional by mode | archive artifact is historical, not current truth |
| `emergency raw export` | explicitly chosen recovery-safe manuscript source | `Import Export Document Interchange` | `T3 + T6` | must not bypass protection rules by accident | provenance choice still explicit | recovery artifact is not new truth authority |

### 8.3 Export Source Rules

- every export mode must declare its source object explicitly
- no export mode may imply that projection, outline, assertion, note, signal, memory, package view, and manuscript are interchangeable
- no export view replaces narrative foundation authority
- no export mode may silently widen from approved source to broader project scope

## 9. Transfer Vocabulary

### `import`

Material enters Black Skies from outside and becomes staged, reviewed, or explicitly classified internal intake.

### `export`

Material leaves Black Skies as an author-approved external artifact from an explicitly selected source and mode.

### `sync`

A future bidirectional or drift-aware external relationship.
Not equivalent to ordinary import or export and not implemented by this contract.

### `transfer`

Umbrella term for any boundary crossing in or out of Black Skies.
Includes import, export, external sync, and provider-bound payload movement.

### `package construction`

AI-facing payload assembly.
Not the same thing as human document export.

### `staging`

A non-authoritative intake or preparation state used before owner-governed placement or conversion.

### `review`

A human approval step or bounded review state used before conversion into owned truth or durable state.

## 10. Truth Safety Rules

- imported material is not automatically truth
- imported material is not automatically manuscript
- imported material is not automatically lore truth
- imported material is not automatically character truth
- imported material is not automatically signal state
- imported material is not automatically memory
- exported material does not become local truth authority
- external systems do not become local truth authority
- Google Docs is not truth authority
- package artifacts are not truth authority
- snapshots are not truth authority
- signals are not truth authority
- notes are not truth authority
- memory is not truth authority
- transfer history is not truth authority
- provenance is not truth authority
- only truth owners may create accepted truth through explicit owner-governed paths

## 11. Failure Behavior

When source or destination is ambiguous:

- stage the material
- require review
- require explicit owner approval before any truth or durable-state placement
- preserve authorship
- preserve provenance
- preserve format-loss warnings
- avoid silent mutation
- avoid silent source widening
- avoid silent destination guessing
- preserve direct writing access where possible

If export source is ambiguous:

- block the export
- ask for explicit mode and source selection
- offer safer narrower modes if available

If import destination is ambiguous:

- keep the material in staging or review
- do not auto-place into manuscript or truth

## 12. Future Alignment Targets

- `import_export_document_interchange.md`
- `narrative_insertion_assertion.md`
- `writing_surface.md`
- `workflow_spine_author_journey.md`
- `memory_lab.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `snapshots_backup_restore_history.md`
- `authorship_provenance_ai_visibility.md`
- `llm_package_construction_architecture.md`
- `file_manager_asset_pane.md`
- `project_index_search_retrieval.md`
- `explicit_content_architecture.md`

## 13. Remaining Critical Questions

- What exact import-created object types should exist for each common intake path before runtime wiring starts?
- What exact export-mode catalog is in scope for the first bounded implementation slice?
- Which non-manuscript objects, if any, may gain first-class export modes early without flattening authority layers?
- What exact diff/conflict/identity rules must future sync flows obey so external edits never silently rewrite local truth?
- What exact format-loss warning contract is required before messy imports can move beyond staging safely?

## 14. Acceptance Criteria

This contract is acceptable only if:

- source objects and destination objects are explicit
- import defaults are conservative
- export modes declare source objects explicitly
- truth owners remain the only truth owners
- staging and review are clearly distinct from acceptance
- package construction is clearly distinct from human document interchange
- external artifacts do not become local truth authority by accident
- future dossier alignment can inherit this contract instead of recreating object-boundary doctrine ad hoc
