# Provenance State Model

## 1. Purpose

Define the canonical provenance state model for Black Skies.

This artifact exists so truth, AI output, memory, notes, signals, import/export, recovery, package construction, protection treatment, and diagnostics all share one provenance language for:

- what happened
- who owned the transition
- what protection state survived
- what may be shown, recalled, exported, or packaged
- what may never silently become truth or authority

## 2. Scope

This contract governs:

- which object classes may carry provenance
- provenance states and transitions
- visibility posture for provenance-bearing objects
- the relationship between provenance and truth
- failure behavior when provenance is missing, ambiguous, contradictory, or protected

This contract applies across:

- truth owners
- `Authorship Provenance AI Visibility`
- `Draft Generation / Rewrite Loop`
- `Memory Lab`
- `Signal Architecture`
- `Feedback Notes / Revision Resolution`
- `Import Export Document Interchange`
- `Snapshots / Backup / Restore / History`
- `LLM Package Construction Architecture`
- `Explicit Content Architecture`
- `Project Index / Search / Retrieval`
- `Diagnostics / Error Visibility / Debug Console`
- host surfaces such as `Writing Surface`, `Command Center Surface`, and `Companion`

## 3. Non-Goals

- database schema
- field-level type design
- UI indicator design
- exact export format behavior
- redesign of `Memory Lab`, `Snapshots`, or package construction
- runtime storage implementation

## 4. Core Doctrine

- Provenance is evidence and history, not truth by itself.
- Provenance does not override author truth.
- Provenance does not resurrect discarded material.
- Provenance does not authorize export.
- Provenance does not authorize AI package use.
- Provenance does not authorize `Memory Lab` recall.
- Provenance may record that an action, block, transform, recovery, or refusal occurred without retaining raw protected payload.
- When provenance and current truth conflict, current owner-governed truth wins unless the author explicitly changes it through the truth owner.

## 5. Provenance Object Taxonomy

| Object class | Provenance posture | Notes |
| --- | --- | --- |
| `manuscript ranges` | `required` | authorship, AI-origin lineage where relevant, acceptance, masking, removal, restore, and export-related transitions must be representable |
| `accepted assertions` | `required` | truth acceptance and later updates need provenance even though provenance is not authority |
| `lore facts` | `required` | accepted lore changes need provenance for source and acceptance history |
| `character facts` | `required` | accepted character changes need provenance for source and acceptance history |
| `AI suggestions` | `required` | must distinguish suggested, accepted, rejected, converted, discarded, or expired states |
| `generated text` | `required` | must distinguish generated, rewritten, accepted, retained, discarded, or rejected paths |
| `rewritten text` | `required` | accepted rewrite lineage must remain representable even when visible marks are hidden by author choice |
| `critique findings` | `required` | need provenance for evidence source, review, conversion, dismissal, retention, and expiry |
| `continuity findings` | `required` | need provenance for signal handoff, acceptance, dismissal, and supersession |
| `theme findings` | `optional` | minimum bounded provenance is needed once retained, converted, or accepted; transient hints may stay light |
| `relationship findings` | `optional` | transient graph hints may be light; retained or converted items need provenance |
| `emotion findings` | `optional` | transient graph hints may be light; retained or converted items need provenance |
| `notes` | `required` | durable note state, anchors, resolution, source class, and AI-origin acceptance require provenance |
| `signals` | `required` | durable signal lifecycle, suppression, resolution, conversion, and expiry require provenance |
| `memory records` | `required` | retained memory must preserve memory type, source class, forgetting, deletion, and exclusion posture |
| `imported material` | `required` | import source, staging, classification, format-loss warnings, acceptance path, and anti-canonization need provenance |
| `exported artifacts` | `required` | export mode, source class, protection treatment, and destination history require provenance |
| `package artifacts` | `summary-only` | record package class, scope, route, and protection treatment without preserving raw protected payload by default |
| `snapshots` | `required` | recovery source, restore mode, approval, and preserved protection states require provenance |
| `diagnostics evidence` | `protected/redacted` | provenance may exist, but raw sensitive content must be redacted or blocked by default |
| `file assets` | `optional` | durable asset links, attachment history, visibility state, and protected-file handling may need provenance; raw file content provenance may remain light |

## 6. Provenance States

| State | Meaning | Owner | Visibility posture | Retention posture | Export posture | Allowed transitions | Forbidden transitions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `authored` | created directly by the author through a truth or state owner path | relevant owner | author-visible; surface-visible where appropriate | durable if owner says so | export only through owner-governed mode | `author-edited`, `hidden`, `masked`, `removed`, `deleted`, `exported`, `restored`, `superseded` | direct jump to `AI-generated` or `AI-suggested` |
| `author-edited` | author changed an existing authored or accepted object | relevant owner | author-visible | durable if owner says so | export only through owner-governed mode | `accepted`, `hidden`, `masked`, `removed`, `deleted`, `superseded` | direct downgrade into unowned advisory state without explicit conversion |
| `AI-suggested` | advisory output proposed for review but not inserted as accepted truth | producing system until handoff | visible as advisory only | temporary by default | not exportable by default | `reviewed`, `accepted`, `rejected`, `dismissed`, `parked`, `converted`, `expired` | direct jump to `authored` or `accepted manuscript` without truth owner |
| `AI-generated` | AI created new content or artifact not yet accepted | producing system until handoff | visible as generated/advisory | temporary by default | not exportable as accepted truth by default | `reviewed`, `accepted`, `rejected`, `retained`, `discarded`, `converted`, `expired` | direct jump to `authored` without explicit acceptance |
| `AI-rewritten` | AI transformed existing text into a rewrite candidate or rewritten output | producing system until truth-owner acceptance | visible as rewritten/advisory comparison | temporary by default | not exportable as accepted truth by default | `reviewed`, `accepted`, `rejected`, `retained`, `discarded`, `converted`, `expired` | direct overwrite of current accepted manuscript without approval |
| `imported` | entered from outside Black Skies | `Import Export Document Interchange` until handoff | visible as staged or classified intake | durable only as import state until accepted elsewhere | not exportable as accepted truth by implication | `reviewed`, `transformed`, `accepted`, `rejected`, `retained`, `discarded`, `superseded` | direct jump to accepted truth without owner-governed path |
| `transformed` | represented in a changed but governed form such as masked summary, substitution, repair, or package view | relevant transforming owner, often `Explicit Content Architecture` or interchange owner | visible according to transformed-view rules | bounded by owner rules | only through explicit transformed mode | `reviewed`, `accepted`, `exported`, `retained`, `superseded` | treating transformed representation as raw authored truth automatically |
| `masked` | raw content exists, but an alternate representation is used in a given context | underlying owner plus protection policy owner | raw local view may exist; masked view shown where required | raw and masked views remain distinct | raw blocked from unauthorized export; masked export only by approved mode | `hidden`, `transformed`, `reviewed`, `superseded`, `restored` | silent unmask for AI, export, or public view |
| `hidden` | intentionally absent from default views while still existing | underlying owner | summonable where permitted | may remain durable | not authorized for default export | `visible again` via owner path, `masked`, `deleted`, `restored`, `superseded` | hidden state implying deletion or export permission |
| `removed` | taken out of current visible active use but not necessarily deleted from history | underlying owner | not default-visible | bounded history only | not default exportable | `deleted`, `restored`, `recovered`, `superseded` | direct treatment as accepted current state |
| `deleted` | removed from current active state, possibly still present historically | underlying owner or snapshot/history owner for record | not default-visible | historical only unless later recovered | not default exportable | `restored`, `recovered`, `superseded` | silent undelete into current active truth |
| `discarded` | intentionally rejected from active use as low-value or unwanted | owner of the artifact class | not active by default | should not remain active advisory context | not exportable by default | `superseded`, `provenance-only`, bounded historical retention | direct return to active use without review |
| `forgotten` | intentionally removed from active recall | `Memory Lab` | not available as active recall | not active recall; bounded historical provenance only | not exportable as recall | `provenance-only`, explicit governed recovery later if allowed | silent reactivation as active memory |
| `accepted` | explicitly accepted within the owner-governed lane | target owner | visible according to owner rules | durable if owner says so | export only through explicit mode | `retained`, `exported`, `superseded`, `author-edited`, `hidden`, `masked` | treating acceptance of advisory object as truth unless truth owner is the acceptor |
| `rejected` | explicitly declined after review | current decision owner | author-visible where useful; not active by default | bounded history only | not exportable by default | `superseded`, `discarded`, `provenance-only`, `expired` | silent conversion to accepted or retained durable state |
| `retained` | explicitly kept as bounded advisory history, durable memory, or other owner-approved retained state | relevant durable-state owner | visible according to owner rules | durable within owner contract | not exportable by default unless explicit mode exists | `forgotten`, `superseded`, `expired`, `exported` if explicit artifact mode exists | retention authorizing truth or AI use by itself |
| `exported` | rendered into an approved export artifact or outbound representation | `Import Export Document Interchange` or package owner for AI-bound transfer history | visible as artifact/provenance, not as truth | transfer history may persist | already exported by explicit mode | `superseded`, bounded archival retention | exported state becoming truth authority |
| `restored` | historical material was explicitly returned through recovery into active or candidate state | target owner via recovery contract | visible according to recovery mode and owner rules | durable if target owner says so | not exportable by implication | `accepted`, `retained`, `superseded`, `author-edited` | restore silently stripping prior protection state |
| `recovered` | historical material was inspected, copied, staged, or otherwise recovered without necessarily becoming current | `Snapshots / Backup / Restore / History` plus target owner for the destination | visible according to recovery mode | bounded recovery history | not exportable by implication | `restored`, `provenance-only`, `superseded`, `discarded` | recovered history becoming current truth automatically |
| `superseded` | replaced by newer evidence, state, or accepted decision | current owner or downstream owner | summonable, not primary | bounded historical retention | not exportable by default | `provenance-only`, `expired` | superseded material silently regaining authority |
| `provenance-only` | only the history/evidence record remains; the object no longer participates as active content | `Authorship Provenance AI Visibility` | local/private by default; summonable | durable metadata only | only in explicit provenance-aware modes | `superseded`, bounded retention, later purge if allowed | provenance-only state restoring content authority by itself |

## 7. State Transition Rules

| Transition | Required owner | Required approval | Provenance retained | Protection state retained | Author truth changes? |
| --- | --- | --- | --- | --- | --- |
| `AI suggestion -> rejected` | producing system or target review owner | explicit review; usually `T2 + T6` if durable note/signal path was offered | source type, route/source trace, review decision | yes | no |
| `AI suggestion -> accepted manuscript` | `Narrative Insertion / Assertion` | explicit author action, `T2 + T6` minimum | suggestion source, acceptance action, target range | yes | yes |
| `generated text -> retained advisory artifact` | relevant durable-state owner, usually `Memory Lab` or bounded advisory history owner | `T2 + T6` | generation source, review, retention class | yes | no |
| `generated text -> discarded` | producing system or current decision owner | explicit review or explicit discard action | source, discard reason, class | yes | no |
| `imported material -> staged` | `Import Export Document Interchange` | `T1` or `T2 + T6` depending on risk | source identity, intake path, format-loss warnings | yes | no |
| `imported material -> accepted manuscript` | `Narrative Insertion / Assertion` after interchange handoff | explicit author action, `T2 + T6` | import source, staging history, acceptance action | yes | yes |
| `imported material -> accepted assertion` | `Narrative Insertion / Assertion` | explicit author action, `T2 + T6` | import source, destination class, acceptance action | yes | yes |
| `masked raw content -> approved package view` | `Explicit Content Architecture` with package owner cooperation | `T3 + T6` for outbound, lower only if local-safe path already allowed | masking/exclusion relationship, package class, approval | yes | no |
| `hidden content -> visible again` | underlying owner | explicit author or owner-governed view action; `T2 + T6` if durable visibility state changes | hidden status, reveal action, scope | yes | no |
| `deleted content -> restored as copy` | `Snapshots / Backup / Restore / History` plus destination owner | `T2 + T6` | snapshot id, recovery mode, destination | yes | no |
| `forgotten memory -> provenance-only record` | `Memory Lab` and `Authorship Provenance AI Visibility` | owner action under memory contract | forgetting action, memory type, source trace | yes | no |
| `signal candidate -> durable signal` | `Signal Architecture` | `T2 + T6` | source trace, normalization, acceptance action | yes | no |
| `critique finding -> note candidate` | `Feedback Notes / Revision Resolution` intake after critique handoff | classification plus explicit review path; durable note still needs `T2 + T6` | critique source, note-anchor context, handoff trace | yes | no |
| `rewrite candidate -> accepted manuscript` | `Narrative Insertion / Assertion` | explicit author acceptance, `T2 + T6` | rewrite source, comparison context, target range | yes | yes |
| `snapshot content -> restored candidate` | target owner through recovery path | `T2 + T6` | snapshot id, candidate class, recovery mode | yes | no |
| `snapshot content -> restored current` | target owner through recovery path | `T3 + T6` | snapshot id, comparison evidence, approval, restore scope | yes | maybe, if truth owner is target |
| `exported artifact -> provenance record` | `Import Export Document Interchange` with provenance owner recording | owner recording; higher approval not needed for minimal metadata | export mode, source class, destination class, protection treatment | yes | no |

## 8. Visibility Rules

### 8.1 Author View

- The author may inspect provenance where local visibility rules allow.
- Writing view remains clean by default.
- Provenance details are summonable, not forced noise.
- `rejected`, `discarded`, `forgotten`, `hidden`, `masked`, `transformed`, `recovered`, and `provenance-only` items may be inspectable without becoming current truth or active recall.

### 8.2 `Companion`

- May mention provenance only in bounded explanatory form.
- Must not overclaim hidden, discarded, forgotten, masked, or AI-excluded material as active evidence.
- Must not treat provenance-only records as current truth, current notes, or current memory.

### 8.3 `Memory Lab`

- May recall only what its retention rules allow.
- May not recall `rejected`, `discarded`, `forgotten`, `provenance-only`, or raw `AI-excluded` material as active advisory context by default.
- May use provenance to explain why something was retained, forgotten, excluded, or superseded without turning provenance into recall authority.

### 8.4 Export

- Provenance is excluded from normal clean export by default.
- Provenance may appear only in explicit provenance-aware modes.
- `rejected`, `discarded`, `forgotten`, `hidden`, `masked-raw`, `AI-excluded`, and `provenance-only` states are not export authorization.

### 8.5 Diagnostics

- Diagnostics may expose bounded redacted provenance summaries when needed.
- Protected or excluded provenance must remain redacted or blocked by default.
- Diagnostics must not expose raw hidden, masked, excluded, or deleted payload merely because provenance exists.

### 8.6 Package Construction

- Package construction may use only approved package views and approved provenance summaries.
- Provenance must not authorize raw protected payload inclusion.
- `exported`, `rejected`, `discarded`, `forgotten`, and `provenance-only` states do not grant package eligibility.

## 9. Provenance Versus Truth Rules

- Provenance records how an object came to be, changed, was accepted, rejected, transformed, exported, recovered, or forgotten.
- Provenance does not itself decide whether the object is true.
- Provenance may show that accepted truth changed, but truth still lives in the truth owner.
- Provenance may show that material was discarded, forgotten, masked, deleted, or excluded, but that does not resurrect it.
- Provenance may show that export occurred, but export history does not become local truth authority.
- Provenance may show that AI touched content, but AI involvement does not erase author authority.

## 10. Failure Behavior

If provenance is missing, ambiguous, contradictory, or protected:

- fail closed for truth mutation
- fail closed for durable-state conversion
- fail closed for export and outbound AI use
- allow safe local review where possible
- preserve direct writing
- do not invent provenance
- mark uncertainty explicitly
- prefer staging, review, copy, or candidate paths over current-state mutation

## 11. Future Alignment Targets

- `authorship_provenance_ai_visibility.md`
- `writing_surface.md`
- `narrative_insertion_assertion.md`
- `draft_generation_rewrite_loop.md`
- `memory_lab.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `import_export_document_interchange.md`
- `snapshots_backup_restore_history.md`
- `llm_package_construction_architecture.md`
- `explicit_content_architecture.md`
- `project_index_search_retrieval.md`
- `diagnostics_error_visibility_debug_console.md`

## 12. Remaining Critical Questions

- What minimum provenance fields must every retained object share before runtime implementation starts?
- Which provenance states, if any, deserve user-facing distinction versus purely local metadata distinction?
- How should heavy human rewrite of AI-origin text be classified when visible markings are hidden but lineage remains?
- What exact purge, expiry, or long-term retention limits should govern provenance-only records?
- Which diagnostics-support scenarios, if any, justify more than redacted provenance summaries?

## 13. Acceptance Criteria

This contract is acceptable only if:

- provenance-bearing object classes are explicit enough to stop cross-dossier drift
- state meanings are explicit enough to keep authored, suggested, generated, accepted, rejected, removed, exported, recovered, and provenance-only distinct
- transitions preserve owner authority and protection state
- provenance is clearly separated from truth, export permission, AI package permission, and memory recall permission
- failure behavior is conservative enough to prevent silent mutation, silent export, and invented provenance
