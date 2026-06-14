# Protected Content Permission Matrix

## 1. Purpose

Define the canonical cross-system permission model for protected content inside Black Skies.

This artifact exists so masking, hiding, deletion, exclusion, retention, restore, export, package construction, diagnostics, retrieval, and AI use all inherit one shared doctrine instead of each dossier inventing its own partial protection rules.

## 2. Scope

This contract governs:

- protected-content classes
- protection-state vocabulary
- cross-system permissions
- summarization, packaging, retention, export, restore, and transform boundaries
- failure behavior when permissions are unclear or conflicting

This contract applies across:

- `Writing Surface`
- `Command Center Surface`
- `Companion`
- `Critique / Evaluation`
- `Continuity`
- `Memory Lab`
- `Signal Architecture`
- `Feedback Notes / Revision Resolution`
- `Draft Generation / Rewrite Loop`
- `Import Export Document Interchange`
- `Snapshots / Backup / Restore / History`
- `File Manager / Asset Pane`
- `Project Index / Search / Retrieval`
- `Model Routing And Budget Architecture`
- `LLM Package Construction Architecture`
- `Explicit Content Architecture`
- `Authorship Provenance AI Visibility`
- `Diagnostics / Error Visibility / Debug Console`
- `Service Health / Offline / Degraded Mode`

## 3. Non-Goals

- runtime ACL design
- database schema
- sync protocol design
- GUI workflow design
- exact export mode implementation
- exact restore UI
- redesign of `Memory Lab`, `Signal Architecture`, `Document Interchange`, `Snapshots`, `Provenance`, or `Diagnostics`

## 4. Core Doctrine

- Protected content must fail closed for transfer, packaging, retention, restore-over-current, and diagnostics exposure.
- Protected content must fail open for direct local writing where possible.
- Visibility does not grant authority.
- Summarization does not erase protection state.
- Provenance may record that protected treatment happened without retaining raw protected content by default.
- AI exclusion is stricter than masking.
- Local-only is stricter than ordinary protected status for outbound and transfer behavior.
- Deleted, discarded, and forgotten states must not quietly return as active current truth, active recall, or outbound payload.
- No system may silently reveal, silently export, silently route, silently retain, silently unmask, silently restore, or silently promote protected content.

## 5. Protected-Content Classes

| Class | Meaning | Owner | Visibility rules | Retention rules | Transfer rules | Restore rules | Export rules |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `normal content` | ordinary in-project content with no additional protection markers | owning truth or state owner | visible to normal authorized surfaces | retained per owning system rules | may move through normal approved paths | restorable per owner rules | exportable only when export mode permits |
| `authored content` | content explicitly created or accepted by the author | owning truth or state owner | visible according to owning system and current view | durable where owner says so | transfer only through owner-governed paths | restore per owner and snapshot rules | export only through approved mode |
| `accepted truth` | accepted truth-bearing content | truth owner | visible according to truth and surface rules | durable as truth | may not be silently transferred | may not be silently resurrected into current truth | export only when explicitly chosen |
| `accepted manuscript` | accepted authored manuscript text | `Narrative Insertion / Assertion` | visible in writing and selected views | durable as manuscript | no silent outbound transfer | restore requires explicit author approval when current text changes | no silent raw-manuscript export |
| `advisory content` | non-accepted advisory findings or suggestions | requesting system until conversion | visible as advisory only | temporary or bounded advisory history | not outward by default | may be preview-restored only as advisory artifact | not human-export content by default |
| `signal content` | signal candidates, durable signals, signal evidence | `Signal Architecture` | visible by signal rules; raw protected passages not exposed by default | durable only for accepted signal state | no silent transfer | restore only through signal/history rules | signal export only if later explicitly supported |
| `note content` | feedback notes and note candidates | `Feedback Notes / Revision Resolution` | visible by note rules and anchor permissions | durable only for accepted note state | no silent transfer | restore by note/history rules only | not exported by default unless explicit mode allows |
| `memory content` | governed recall, advisory memory, memory candidates | `Memory Lab` | visible by memory-type and permission rules | durable only for allowed memory classes | no silent raw transfer | forgotten/deleted memory must not silently reactivate | not exported by default |
| `imported content` | imported material not yet accepted into truth | `Import Export Document Interchange` until handed off | visible as staged/import-classified material | durable as import state only if explicitly stored | transfer remains governed by interchange | restore must preserve import status, not fake truth status | not re-exported as accepted truth by implication |
| `generated content` | AI-generated output not yet accepted | requesting system until conversion | visible as generated/advisory | temporary by default | no silent transfer | restore only as advisory artifact | not exportable as accepted local truth automatically |
| `masked content` | content whose outward or support-facing representation is intentionally substituted, summarized, or redacted | owning truth/state owner plus `Explicit Content Architecture` for outbound treatment | local raw view may still exist; masked view used where required | raw and masked views must stay distinct | raw form blocked from unauthorized transfer | restore must preserve raw-vs-masked distinction | export may use only approved masked/package view |
| `hidden content` | content intentionally absent from default views but still present | owning truth/state owner | summonable only where permitted | may remain durable | hidden state does not authorize export or packaging | restore may return hidden state, not default visibility | hidden content is excluded from default export |
| `deleted content` | content removed from current active state but still potentially present historically | owning truth/state owner or snapshot/history owner for the record | not shown in default active views | may exist in history under owner rules | no silent transfer | may restore only through explicit governed recovery | no default export |
| `discarded content` | non-truth or non-owned content intentionally rejected from active use | owner of the artifact class | not shown in active default views | should not remain active advisory context | no silent transfer | may be inspectable historically if owner keeps bounded history | not exportable by default |
| `forgotten content` | memory removed from active recall by `Memory Lab` | `Memory Lab` | not available as active recall | must not remain active advisory context | no transfer as active memory | restore only through explicit recovery path if later allowed | not exportable as recall |
| `AI-excluded content` | content barred from AI routing, package assembly, previews, summaries, and outbound payloads unless explicitly reauthorized | underlying content owner plus `Explicit Content Architecture` guard | local raw view may remain visible to the author; AI systems and AI-facing previews may not use raw form | raw excluded form must not become durable AI memory by default | blocked from AI transfer by default | restore must preserve exclusion state | blocked from AI-facing export/package behavior by default |
| `local-only content` | content or project state forbidden from leaving the local environment | underlying content owner plus routing/protection policy | local surfaces may show it according to owner rules | retained locally only | transfer blocked unless later explicitly reclassified | restore may preserve local-only state | outbound export/transfer blocked by default |
| `explicit content` | explicit sexual, violent, or other content that may require special outbound treatment | underlying content owner plus `Explicit Content Architecture` for outbound treatment | local authored form may remain visible | retained per owner rules | outbound treatment may require transform/block/local-only status | restore must not censor local truth silently | export depends on approved mode and clearance |
| `sensitive content` | content sensitive for privacy, secrecy, or safety even if not explicit | underlying content owner | minimized visibility outside owner-approved contexts | bounded retention only | transfer restricted | restore requires protection awareness | export restricted or blocked by mode |
| `protected content` | umbrella class for any content under heightened protection state | underlying content owner plus policy systems | only according to protection state and owner rules | only according to protection state | blocked or narrowed by default | restore constrained by protection state | export blocked or narrowed by default |
| `exported content` | content already rendered into an approved export artifact | `Import Export Document Interchange` | visible as export artifact, not local truth | export history may persist | may transfer only as approved artifact | restore does not make export artifact current truth | already governed by export mode |
| `provenance-only content` | metadata that records source, acceptance, masking, exclusion, deletion, or transfer history without carrying raw underlying protected content | `Authorship Provenance AI Visibility` | summonable, not always visible | durable local/private metadata | no silent external transfer | restore may restore metadata, not raw protected payload | only exported when explicit provenance-aware mode says so |

## 6. Protection-State Vocabulary

| State | Meaning | Who may view | Who may summarize | Who may package | Who may export | Who may restore | Who may transform | Who may retain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `unrestricted` | normal owner-governed content | authorized consumers | authorized advisory systems | allowed by package and route rules | allowed by export mode | owner/history rules | owner or explicit-content systems when applicable | owner rules |
| `advisory-only` | visible for advisory use, not authoritative | authorized consumers | advisory systems | only if approved for the task | not by default | restore as advisory artifact only | may be converted only through owner path | temporary or bounded history only |
| `protected` | heightened protection applies | owner and authorized surfaces only | only bounded summaries | only through approved protected path | blocked by default unless mode permits | explicit review required | explicit approved transforms only | only if owner and policy permit |
| `restricted` | fewer systems may access than ordinary protected content | owner plus narrowly authorized systems | bounded summaries only | only if explicitly approved | generally blocked | explicit review required | explicit approved transforms only | only where doctrine requires |
| `hidden` | present but absent from default views | summonable authorized surfaces | only if hidden-state rules allow | not from hidden state by default | excluded from default export | may restore hidden state | no silent unhide transform | may remain durable |
| `masked` | raw content exists locally; outward/support-facing representation is redacted/summarized/substituted | author may view raw; other systems may view only approved masked form | masked summary only | package only from approved masked/package view | export only from approved masked mode | raw-vs-masked distinction must survive restore | transform allowed only through explicit-content rules | raw not retained in AI-facing systems by default |
| `deleted` | removed from current active state | not in active default views | only if historical review path allows | not by default | not by default | explicit governed recovery only | no silent undelete | historical retention only |
| `discarded` | rejected from active use | not in active default views | only bounded history if kept | not by default | not by default | may inspect history; no automatic restore to active use | no silent reuse | should not remain active advisory context |
| `forgotten` | removed from active recall | not available as active recall | not by active memory consumers | never from forgotten active recall | no | only explicit memory recovery path if later allowed | no silent reactivation | not active durable recall |
| `AI-excluded` | barred from AI routing, package assembly, AI previews, AI summaries, and outbound AI payloads | author and authorized non-AI local views only | only author-approved summary if one exists | never from raw excluded form | blocked for AI-facing export/package use | restore must preserve exclusion | no silent AI-facing transform | raw excluded form must not be durably retained in AI systems by default |
| `local-only` | may not leave local environment | local authorized systems only | local bounded summaries only | local-only package paths only if non-outbound and allowed | blocked | local restore only | may transform locally if non-destructive and allowed | local retention only |
| `export-blocked` | blocked from human-readable export | local authorized systems only | bounded internal summary only | may still be locally packaged if separately allowed | no | restore per owner rules | only to a safer non-export state | owner rules only |
| `transfer-blocked` | blocked from external transfer or sync | local authorized systems only | bounded internal summary only | not for transfer packaging | no external transfer | restore local only | only to safer local state | local only |

## 7. Permission Matrix By System

Legend:

- `yes`: allowed within owner and approval rules
- `bounded`: allowed only in narrowed or transformed form
- `no`: not allowed
- `owner-only`: only the owning system may do this durably

| System | View | Summarize | Classify | Package | Retain | Create signals from | Create notes from | Create memory from | Export | Transfer | Restore | Transform |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Writing Surface` | yes, local-author view | bounded | bounded | no | no | no | bounded request only | no | no | no | no | no, except local author editing not protection transform |
| `Companion` | bounded | bounded | bounded | no | no | bounded candidate only | bounded candidate only | no | no | no | no | no |
| `Critique / Evaluation` | bounded | bounded | yes | bounded local or approved outbound only | no | bounded candidate only | bounded candidate only | no | no | no | no | no |
| `Continuity` | bounded | bounded | yes | bounded local or approved outbound only | bounded advisory history only | bounded candidate only | bounded candidate only | no | no | no | no | no |
| `Memory Lab` | bounded by memory-type rules | bounded | yes | bounded local or approved outbound only | owner-only for durable memory | bounded candidate only | no | owner-only | no | no | no | bounded summary only, never raw protected rewrite |
| `Signal Architecture` | bounded | bounded | yes for signal normalization | bounded summary/package references only | owner-only for durable signal state | owner-only | no | no | no by default | no | bounded signal-history restore only | bounded display/state transform only |
| `Feedback Notes / Revision Resolution` | bounded | bounded | yes for note state | no | owner-only for durable note state | no | owner-only | no | no by default | no | bounded note-history restore only | bounded note-state transforms only |
| `Draft Generation / Rewrite Loop` | bounded | bounded | yes for rewrite classes | bounded approved package only | no, except temporary artifacts until discarded | no | bounded candidate only | no | no | no | no | bounded generated rewrite proposals only |
| `Import Export Document Interchange` | bounded | bounded | owner-only for import/export class and destination class | bounded approved export/package view only | owner-only for transfer history | no | no | no | owner-only by approved mode | owner-only by approved mode | no | bounded export rendering only |
| `Snapshots / Backup / Restore / History` | bounded historical view | bounded historical summary | yes for recovery classification | no | owner-only for snapshot history | no | no | no | no | no | owner-only via governed recovery | no |
| `File Manager / Asset Pane` | bounded by file visibility state | bounded preview only | bounded metadata classification | no | owner-only for file metadata only | no | no | no | no | no | no | no |
| `Project Index / Search / Retrieval` | bounded | bounded snippet only | owner-only for index/retrieval class | no | owner-only for index state only | no | no | no | no | no | no | no |
| `Model Routing And Budget Architecture` | view route/protection status only | no | classify route eligibility | no direct content packaging ownership | owner-only for route history only | no | no | no | no | no direct transfer authority | no | no |
| `LLM Package Construction Architecture` | bounded to approved sources | bounded package summary only | classify package components | owner-only for package artifact | no durable content retention by default | no | no | no | no human export ownership | outbound payload handoff only after approvals | no | bounded package-view construction only |
| `Explicit Content Architecture` | bounded | bounded | owner-only for protection classification | bounded approved package view only | owner-only for protection/refusal history only | no | no | no | no direct export ownership | no direct transfer ownership | no | owner-only for masking/summarization/substitution policy paths |
| `Authorship Provenance AI Visibility` | bounded metadata view | bounded metadata summary | owner-only for provenance classification | no direct package ownership | owner-only for provenance metadata | no | no | no | bounded only in provenance-aware export mode chosen elsewhere | no direct transfer ownership | bounded provenance restore only | bounded metadata/render transform only |
| `Diagnostics / Error Visibility / Debug Console` | bounded operational/historical view | bounded protected summaries only | yes for diagnostic classification | no | owner-only for diagnostic evidence state only | no | no | no | evidence bundle only if later explicitly allowed and protected | no by default | bounded diagnostic-history restore only | bounded redaction of evidence only |

## 8. Cross-System Rules

### 8.1 May Protected Content Become Memory?

- Raw protected content may not become durable memory automatically.
- Raw `AI-excluded`, `local-only`, `forgotten`, `discarded`, `deleted`, and masked-raw content must not become active durable memory by default.
- `Memory Lab` may retain:
  - explicit author-owned truth already allowed under its rules
  - author-approved advisory memory
  - author-approved summaries of masked or excluded material
- Required approval: `T2 + T6`

### 8.2 May Protected Content Become Signal?

- Raw protected content may not directly become durable signal state.
- Protected material may produce a `signal candidate` only if:
  - the source system is allowed to observe it
  - raw protected content is not leaked in summaries or previews
  - provenance preserves protection state
- Durable signal creation still requires `Signal Architecture` acceptance.
- Required approval for durable signal: `T2 + T6`

### 8.3 May Protected Content Become Note?

- Protected material may produce a bounded note or note candidate only if anchor and visibility rules are preserved.
- AI-origin protected-content note candidates require explicit author acceptance before durable note creation.
- Raw excluded content must not leak through note previews.
- Required approval for durable note from AI-origin material: `T2 + T6`

### 8.4 May Protected Content Become Package Content?

- Only through an approved package view or approved local-only package path.
- Raw `AI-excluded` content may not become package content.
- Raw `local-only` content may not become outbound package content.
- Masked, summarized, or substituted package views may be used when explicitly approved.
- Required approval:
  - local bounded non-outbound path: `T1` only if already allowed
  - outbound package path: `T3 + T6`

### 8.5 May Protected Content Become Export Content?

- Not by default.
- Export requires an explicit mode that names the allowed source and protection treatment.
- Hidden, deleted, masked-raw, protected, or AI-excluded content must not export by default.
- Emergency raw-prose export remains separately bounded and does not bypass this matrix.
- Required approval: `T2 + T6` minimum, `T3 + T6` for external transfer/high-risk modes

### 8.6 May Protected Content Become Provenance?

- Provenance may record that masking, exclusion, substitution, deletion, hiding, forgetting, or protected treatment occurred.
- Provenance must not retain raw excluded text by default.
- Provenance may keep references to author-approved package views or summaries without keeping raw protected payload.
- Required approval: owner recording only; no special fresh approval for minimal required metadata, but extended retention remains governed

### 8.7 May Protected Content Become Diagnostic Evidence?

- Only as bounded, privacy-aware, redacted witness material.
- Diagnostics must prefer protected summaries over raw passages.
- Raw protected evidence must be blocked or redacted unless an explicit later contract permits a narrower support/export path.
- Required approval: `T2 + T6` for evidence-bundle creation paths that retain sensitive witness data

### 8.8 May Protected Content Become Restored Content?

- Only through explicit governed recovery.
- Restore must preserve status distinctions such as hidden, masked, deleted, discarded, forgotten, AI-excluded, and local-only.
- Restore must not silently reactivate forgotten memory, deleted truth, or blocked outbound eligibility as active current state.
- Required approval:
  - restore as copy: `T2 + T6`
  - restore as current: `T3 + T6`

## 9. Redaction And Masking Vocabulary

### `hidden`

Content still exists and may remain durable, but it is removed from default views.
It is a visibility state, not a deletion state.

### `masked`

Content still exists in local raw form, but an alternate redacted, summarized, substituted, or transformed representation is used for a specific support, package, preview, or export context.
Masking is a representation change, not a truth change.

### `deleted`

Content is removed from the current active state but may remain in bounded history or snapshots.
Deletion does not grant ordinary visibility or export rights.

### `discarded`

A non-truth or non-authoritative artifact is intentionally rejected from active use.
Discarded material should not remain active advisory context.

### `forgotten`

Memory retained by `Memory Lab` is intentionally removed from active recall.
Forgotten content is a memory-governance state, not a truth-owner state.

### `AI-excluded`

Content may still exist locally, but AI-facing systems may not read, summarize from raw form, package, preview, or transmit it unless the author later gives a different authorization.
This is stricter than masking.

## 10. Failure Behavior

When permissions are unclear, conflicting, missing, or stale:

- block the risky action
- downgrade to a safer local-only or non-retaining path if one exists
- require explicit review or approval for any truth-adjacent, durable-state, outbound, restore-over-current, or diagnostic-evidence action
- preserve direct writing access wherever possible
- do not silently choose a weaker protection interpretation
- do not silently widen source scope because one allowed source is unavailable
- do not silently retry outbound or paid work on protected material

Priority order when protection rules collide:

1. explicit author refusal or block
2. `AI-excluded`
3. `local-only`
4. protected-content and masking rules
5. export and transfer mode rules
6. routing and spend rules
7. convenience or automation

## 11. Future Alignment Targets

- `explicit_content_architecture.md`
- `authorship_provenance_ai_visibility.md`
- `memory_lab.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `import_export_document_interchange.md`
- `snapshots_backup_restore_history.md`
- `model_routing_and_budget_architecture.md`
- `llm_package_construction_architecture.md`
- `file_manager_asset_pane.md`
- `project_index_search_retrieval.md`
- `service_health_offline_degraded_mode.md`
- `diagnostics_error_visibility_debug_console.md`
- `companion.md`
- `writing_surface.md`
- `command_center_surface.md`
- `workflow_spine_author_journey.md`

## 12. Remaining Critical Questions

- What exact object-level provenance fields must distinguish hidden, masked, deleted, discarded, forgotten, AI-excluded, local-only, export-blocked, and transfer-blocked states?
- What exact restore contract governs deleted, hidden, masked, excluded, local-only, and forgotten material across snapshots, memory, notes, and signals?
- What exact diagnostics evidence path, if any, may carry more than protected summaries without violating this matrix?
- What exact first-scope attach or link behavior is safe for `File Manager / Asset Pane`?
- What exact non-manuscript export modes, if any, may include signals, notes, critique, provenance, or graph outputs without flattening authority layers?

## 13. Acceptance Criteria

This contract is acceptable only if:

- protected-content vocabulary is explicit and non-overlapping enough to govern later alignment
- cross-system permissions are stated clearly enough to prevent silent leakage
- raw protected material is distinct from summaries, masked views, package views, export artifacts, and provenance metadata
- AI-excluded and local-only states are stricter than ordinary protected status where required
- deleted, discarded, and forgotten states do not silently reactivate as active truth, active recall, or outbound payload
- unclear permissions fail closed for risky operations and fail open for direct writing where possible
- future dossier alignment can inherit this matrix instead of recreating it piecemeal
