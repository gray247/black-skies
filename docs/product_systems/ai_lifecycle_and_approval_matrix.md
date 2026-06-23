# AI Lifecycle And Approval Matrix

## 1. Purpose

Define the end-to-end governance contract for AI behavior inside Black Skies from request formation through package construction, protection filtering, routing, execution, output receipt, classification, review, conversion, retention, export, and provenance.

This contract exists so AI systems may infer, compare, summarize, classify, critique, and generate without silently becoming truth owners, silent editors, silent archivists, or silent transfer agents.

## 2. Scope

This contract governs:

- local model execution
- paid API execution
- AI-facing package assembly
- masking and exclusion before AI use
- output classification
- review and acceptance paths
- durable retention boundaries
- provenance and historical trace requirements
- export-aware AI artifacts
- scheduled, idle, and overnight AI preparation

This contract applies across:

- `Model Routing And Budget Architecture`
- `LLM Package Construction Architecture`
- `Explicit Content Architecture`
- `Authorship Provenance AI Visibility`
- `Memory Lab`
- `Signal Architecture`
- `Critique / Evaluation`
- `Continuity`
- `Theme System`
- `Relationship Map`
- `Emotion Graph`
- `Draft Generation / Rewrite Loop`
- `Companion`
- `Import Export Document Interchange`
- visible host surfaces such as `Writing Surface` and `Command Center Surface`

## 3. Non-Goals

- exact prompt templates
- exact package schema or chunking format
- provider-specific behavior
- benchmark methodology
- model selection by genre or budget
- runtime storage schema
- runtime UI design
- exact retry accounting
- exact provenance rendering details

## 4. Core Doctrine

- AI is advisory unless explicitly accepted through the owning-system path.
- Inferred output is not authored truth.
- AI output is not canon.
- AI output is not accepted manuscript text by default.
- AI output is not accepted assertion, lore, character fact, or project truth by default.
- AI output is not durable signal state, durable note state, or durable memory by default.
- AI may not silently mutate truth.
- AI may not silently mutate manuscript.
- AI may not silently create canon.
- AI may not silently retain memory.
- AI may not silently create durable signals.
- AI may not silently create durable notes.
- AI may not silently export.
- AI may not silently spend money.
- AI may not silently transmit protected content.
- AI may not silently widen package scope.
- Temporary package payloads are not durable memory.
- Masked summaries, substitutions, transformed package views, and outbound payloads are package artifacts, not local truth.
- Provenance records visibility and history; provenance is not truth.

## 5. Contract Dependencies

- Truth ownership comes from [truth_and_state_ownership_matrix.md](/C:/Dev/black-skies/docs/product_systems/truth_and_state_ownership_matrix.md).
- Surface exposure and execution handoff come from [surface_to_owner_action_handoff_contract.md](/C:/Dev/black-skies/docs/product_systems/surface_to_owner_action_handoff_contract.md).
- Approval tiers reuse `T0` through `T6` from the handoff contract.

## 6. AI Lifecycle Stages

### Stage 0. Author Context

- Owner: author-owned truth systems plus current host surface
- Inputs: current manuscript, accepted assertions, accepted lore, accepted character facts, accepted project truth where parked, notes, workflow state, selected scope
- Outputs: current author context available for request formation
- Approvals: `T0` for reading already visible local current context; higher approvals are not granted here
- Prohibited behavior: no inference, no package widening, no retention, no route escalation, no truth mutation
- Downstream destinations: `Stage 1 Request Formation`

### Stage 1. Request Formation

- Owner: requesting system, usually `Companion`, `Critique`, `Continuity`, `Draft Generation / Rewrite Loop`, `Memory Lab`, or user-invoked surface action
- Inputs: author request, selected scope, current context, workflow posture, local owner rules
- Outputs: bounded task request with declared purpose, scope, and requested output class
- Approvals: `T1` for bounded local advisory requests; `T3 + T6` if the request class implies outbound, paid, destructive, or protected-content access
- Prohibited behavior: no silent scope widening, no silent provider choice, no silent durable retention, no implied truth acceptance
- Downstream destinations: `Stage 2 Package Construction`

### Stage 2. Package Construction

- Owner: `LLM Package Construction Architecture`
- Inputs: approved task intent, allowed scope, allowed source material, owning-system boundaries, package invariants
- Outputs: package artifact, package summary, scope declaration, package-view candidate, composed final preview artifact
- Approvals: `T1` for silent-local eligible packaging; `T2 + T6` or `T3 + T6` when approval is required by route, scope, or protection class
- Prohibited behavior: no silent package widening, no source substitution that changes mission or evidence scope, no raw excluded-span inclusion, no truth mutation
- Downstream destinations: `Stage 3 Protection Filtering`, `Stage 4 Routing Decision`

### Stage 3. Protection Filtering

- Owner: `Explicit Content Architecture` with provenance cooperation from `Authorship Provenance AI Visibility`
- Inputs: raw manuscript candidates, mask maps, AI exclusion zones, local-only rules, protected-content rules, package artifact
- Outputs: local-only classification, outbound-blocked classification, transform-required classification, author-approved package view candidate, summary candidate, author-approved summary, approved package use candidate
- Approvals: `T1` for local non-outbound classification; `T3 + T6` for transformed outbound package approval; `T5` where no permitted route exists yet
- Prohibited behavior: no silent censorship of local manuscript, no silent outward leakage of raw excluded content, no silent truth mutation, no silent raw-content persistence in provenance
- Downstream destinations: `Stage 4 Routing Decision`, `Stage 11 Export / Transfer`, block or refusal states

### Stage 4. Routing Decision

- Owner: `Model Routing And Budget Architecture`
- Inputs: protected package class, route mode, provider policy, route eligibility, local-only constraints, budget caps, explicit-content state, user approval state, requesting system priority
- Outputs: route decision, provider eligibility result, approval-needed state, blocked state, refused state, downgraded local-only path, `no-ai-route-available`, named fallback posture
- Approvals: `T1` only for `silent-local` eligible work; `T4 + T6` for repeated session-approved bounded work; `T3 + T6` for paid, outbound, provider-switch, or widened tasks
- Prohibited behavior: no silent paid spend, no silent outbound escalation, no silent provider-switch retry, no silent destructive route, no truth mutation
- Downstream destinations: `Stage 5 Model Execution`, fallback or block messaging

### Stage 5. Model Execution

- Owner: requesting intelligence system executes through approved route; route authority remains governed by `Model Routing And Budget Architecture`
- Inputs: approved route, approved package view, task intent, output-class expectation
- Outputs: raw model output, refusal, failure, partial result, route evidence
- Approvals: inherited from `Stage 4`
- Prohibited behavior: no execution outside approved route, no hidden secondary call, no implicit retry that spends or sends, no hidden package mutation
- Downstream destinations: `Stage 6 AI Output Receipt`

### Stage 6. AI Output Receipt

- Owner: requesting system plus `Authorship Provenance AI Visibility`
- Inputs: raw model output, route result, package summary, source trace
- Outputs: received AI artifact with provenance markers, route trace, initial temporary state
- Approvals: `T0` for receipt itself; no acceptance implied
- Prohibited behavior: no silent insertion into manuscript, no silent truth conversion, no silent durable-state creation, no silent export
- Downstream destinations: `Stage 7 Output Classification`

### Stage 7. Output Classification

- Owner: requesting system classifies; downstream owner validates before conversion
- Inputs: received AI artifact, task intent, source trace, owning-system rules
- Outputs: one or more output classes such as temporary response, signal candidate, rewrite candidate, continuity finding, package artifact
- Approvals: `T1` for local temporary classification; `T2 + T6` or higher for conversion into owner-governed durable state
- Prohibited behavior: no direct promotion from classification to truth, note, signal, memory, or export without owner-governed path
- Downstream destinations: `Stage 8 User Review`, temporary holding, possible expiry

### Stage 8. User Review

- Owner: visible surface hosts review; owning system controls decisions
- Inputs: classified output, provenance markers, source trace, approval options, fallback options
- Outputs: review decision such as accept, dismiss, park, convert, retain, forget, or rerun request
- Approvals: depends on target class; truth, durable-state, outbound, and destructive classes require at least `T2 + T6`
- Prohibited behavior: no surface-owned acceptance, no fake success when blocked, no hidden auto-apply
- Downstream destinations: `Stage 9 Conversion / Acceptance`, `Stage 10 Durable Retention`, dismissal, expiry

### Stage 9. Conversion / Acceptance

- Owner: target owning system
- Inputs: reviewed classified output, explicit author action where required, provenance history, protection state
- Outputs: accepted manuscript change, accepted truth update, durable signal, durable note, durable memory, or explicit rejection
- Approvals: `T2 + T6` minimum for truth or durable-state conversion; `T3 + T6` if conversion also causes outbound, destructive, or protected-content effects
- Prohibited behavior: no auto-conversion from advisory state, no truth mutation by non-owner, no silent multi-target conversion
- Downstream destinations: `Stage 10 Durable Retention`, `Stage 12 Historical Record / Provenance`

### Stage 10. Durable Retention

- Owner: durable-state owner for the target class
- Inputs: accepted conversion result, retention class, discard or expiry rules, provenance reference
- Outputs: durable memory, durable signal, durable note, provenance record, route history, export record, or explicit non-retention
- Approvals: `T2 + T6` for memory, signal, note, and other durable-state creation unless the owning contract later authorizes a narrower accepted workflow; never silent for AI-origin durable state
- Prohibited behavior: no silent retention of raw excluded spans, temporary package payloads, discarded outputs, or protected raw content; no retention without owner class
- Downstream destinations: governed recall, review history, export-aware provenance, expiry

### Stage 11. Export / Transfer

- Owner: `Import Export Document Interchange` for human-facing transfer; routing and package owners govern AI-bound transfer
- Inputs: approved export source, approved provenance mode, approved package view, transfer rules
- Outputs: clean export, annotated export, provenance-aware export, emergency raw-prose export, outbound payload, or blocked transfer state
- Approvals: `T3 + T6` for outbound or external transfer; `T2 + T6` minimum for local export artifact creation where author control is required
- Prohibited behavior: no silent export, no silent sync, no silent raw-manuscript export, no transfer of protected or excluded material by default
- Downstream destinations: external document artifact, outbound provider payload, transfer history, provenance record

### Stage 12. Historical Record / Provenance

- Owner: `Authorship Provenance AI Visibility` plus relevant operational owner for route or transfer history
- Inputs: source trace, classification, acceptance action, retention action, export mode, masking or exclusion relationship
- Outputs: provenance metadata, acceptance lineage, linked approval-lifecycle references, route or run history reference, package-summary history reference, transfer history reference, bounded audit trace
- Approvals: `T1` for owner recording of required provenance; `T2 + T6` for retention beyond default bounded history where later contracts demand it
- Prohibited behavior: no raw excluded text retention by default, no provenance laundering, no story-truth substitution, no undeletable punitive scar
- Downstream destinations: summonable author review, export-aware rendering, bounded diagnostics, future evidence workflows

History ownership remains split:

- route or run history belongs to `Model Routing And Budget Architecture`,
- route-approval history, provider-permission history, spend-approval history, request-specific route-override history, and provider-pinning or fallback-permission history belong to `Model Routing And Budget Architecture`,
- protected-package approval history, approved-summary history, and mask or protected-package-view approval history belong to `Explicit Content Architecture`,
- destination-acceptance history belongs to the destination owner,
- transfer-approval history belongs to `Import Export Document Interchange`,
- package-summary history belongs to `LLM Package Construction Architecture`,
- provenance history belongs to `Authorship Provenance AI Visibility`,
- transfer history belongs to `Import Export Document Interchange`.

The Command Center may later compose a non-owning request timeline across these records.
This contract does not create a universal history owner.
It owns the approval contract, approval vocabulary, approval-state definitions, revalidation rules, and the linked approval-lifecycle view rather than every concrete approval decision record.

## 7. Output Classes

| Output class | Owner | Default retention | Approval requirement | Conversion path | Forbidden automatic conversions |
| --- | --- | --- | --- | --- | --- |
| `temporary response` | requesting system | temporary only | `T0` to display | may be dismissed, parked, rerun, or classified further | may not become truth, durable note, durable signal, durable memory, or export automatically |
| `informational response` | requesting system | temporary or session-only | `T0` to display, `T1` to keep in session | may remain session context or be cited into another owner review path | may not become canon, accepted manuscript, or durable memory automatically |
| `advisory recommendation` | requesting system | temporary by default | `T1` to show, `T2 + T6` to convert | may become note candidate, signal candidate, rewrite candidate, or manual author action | may not become accepted truth or durable state automatically |
| `signal candidate` | `Signal Architecture` intake | temporary until explicitly accepted | `T1` to create candidate, `T2 + T6` to durably create signal | candidate -> durable signal only through signal owner | may not become truth, note, or memory automatically |
| `feedback-note candidate` | `Feedback Notes / Revision Resolution` intake | temporary until explicitly accepted | `T2 + T6` to create durable note from AI-origin candidate | candidate -> durable note | may not become manuscript change, truth, or signal automatically |
| `memory candidate` | `Memory Lab` intake | temporary until explicitly retained | `T2 + T6` to retain | candidate -> durable author-approved advisory memory or discard | may not become truth, canon, signal, or note automatically |
| `rewrite candidate` | `Draft Generation / Rewrite Loop` until accepted into target truth owner | temporary comparison by default | `T2 + T6` to insert or replace text | candidate -> accepted manuscript text through `Narrative Insertion / Assertion` | may not become manuscript, assertion, note, or memory automatically |
| `continuity finding` | `Continuity` | temporary or bounded advisory history | `T1` to surface, `T2 + T6` to convert to note or truth via owner | may become signal candidate, continuity-local record, note candidate, or explicit truth update via owner | may not become accepted continuity truth on its own |
| `critique finding` | `Critique / Evaluation` | temporary or bounded advisory history | `T1` local, higher if paid/outbound; `T2 + T6` to convert | may become note candidate, signal candidate, rewrite prompt candidate | may not become truth, note, signal, or rewrite execution automatically |
| `theme finding` | `Theme System` | temporary by default | `T1` to surface, `T2 + T6` to accept theme note or truth elsewhere | may become candidate theme note or author-owned thematic intent through explicit owner path | may not silently canonize theme meaning |
| `relationship finding` | `Relationship Map` or upstream analysis feeding it | temporary by default | `T1` to surface, `T2 + T6` to accept | may become candidate relationship item or accepted relationship truth via truth owner | may not become accepted relationship fact automatically |
| `emotional finding` | `Emotion Graph` or upstream analysis feeding it | temporary by default | `T1` to surface, `T2 + T6` to accept | may become candidate emotional interpretation or accepted emotional intent through owner path | may not become accepted emotional truth automatically |
| `export artifact` | `Import Export Document Interchange` | transfer history durable, artifact per export policy | `T2 + T6` or `T3 + T6` depending on mode | may leave machine or stay local as approved export | may not become accepted local truth automatically |
| `package artifact` | `LLM Package Construction Architecture` | temporary by default, bounded summaries only when approved | `T1` local eligible packaging, `T3 + T6` if outbound approval required | may become approved package view or outbound payload | may not become durable memory, truth, or human export automatically |

## 8. Lifecycle States

- `candidate`: proposed, inferred, or AI-produced material not yet accepted by the owning system
- `accepted`: explicitly approved through the owning-system path
- `dismissed`: reviewed and rejected for current use
- `parked`: intentionally kept for later review without acceptance
- `converted`: transformed from one class into another through an explicit owner-governed path
- `retained`: durably kept by the appropriate durable-state owner
- `forgotten`: intentionally removed from active durable memory or recall by the memory owner
- `expired`: temporary or low-value artifact no longer kept active

Rules:

- `candidate` is not `accepted`
- `inferred` is not `accepted`
- `signal` is not `truth`
- `note` is not `truth`
- `memory` is not `truth`
- `package artifact` is not `export artifact`
- `export artifact` is not accepted manuscript truth unless separately re-imported and explicitly accepted later

## 9. Conversion Rules

### 9.1 Automatic Conversion Decisions

| Target state | May AI output become this automatically? | Required owner-governed path |
| --- | --- | --- |
| truth | no | explicit truth owner acceptance |
| canon | no | explicit truth owner acceptance |
| accepted manuscript | no | `Narrative Insertion / Assertion` acceptance |
| accepted assertion | no | `Narrative Insertion / Assertion` acceptance |
| accepted lore | no | lore truth owner acceptance |
| accepted character fact | no | character truth owner acceptance |
| durable signal | no | `Signal Architecture` acceptance |
| durable note | no | `Feedback Notes / Revision Resolution` acceptance |
| durable memory | no | `Memory Lab` retention approval |
| export content | no | `Import Export Document Interchange` export approval |

### 9.2 Allowed Conversion Paths

- `temporary response` -> dismissed, parked, or session context
- `advisory recommendation` -> signal candidate, note candidate, rewrite candidate, or manual action
- `critique finding` -> note candidate, signal candidate, rewrite prompt candidate
- `continuity finding` -> continuity-local advisory record, signal candidate, note candidate, or explicit truth update through truth owner
- `rewrite candidate` -> accepted manuscript text only through truth owner
- `memory candidate` -> durable author-approved advisory memory only through `Memory Lab`
- `signal candidate` -> durable signal only through `Signal Architecture`
- `feedback-note candidate` -> durable note only through `Feedback Notes / Revision Resolution`
- `theme`, `relationship`, and `emotional` findings -> candidate items or author-accepted truth elsewhere, never graph or theme-system canon by default
- `package artifact` -> approved package view or outbound payload, not truth, not memory

### 9.3 Forbidden Multi-Hop Shortcuts

- AI output -> truth -> memory in one silent step
- AI output -> signal candidate -> durable signal silently
- AI output -> critique finding -> rewrite execution silently
- AI output -> package artifact -> export artifact silently
- AI output -> temporary response -> durable memory silently
- masked summary -> author-owned truth silently
- outbound payload -> local manuscript truth silently

## 10. Approval Matrix

### 10.1 Reused Approval Tiers

This contract reuses:

- `T0 no-approval-needed`
- `T1 implicit-current-context`
- `T2 explicit-user-confirmation`
- `T3 fresh-approval-required`
- `T4 session-approval-allowed`
- `T5 blocked-until-future-contract`
- `T6 never-silent`

### 10.2 Approval Decisions By Action Class

| Action class | Minimum approval |
| --- | --- |
| local informational display | `T0` |
| bounded local advisory execution with no outbound, no paid spend, no truth mutation, no durable retention | `T1` |
| repeated bounded low-risk already approved current-session local work | `T4 + T6` where later contracts allow it |
| paid API execution | `T3 + T6` |
| provider switch after refusal | `T3 + T6` |
| rewrite insertion or manuscript replacement | `T2 + T6` |
| memory retention from AI-origin material | `T2 + T6` |
| durable signal creation from AI-origin material | `T2 + T6` |
| durable note creation from AI-origin material | `T2 + T6` |
| export artifact creation | `T2 + T6` minimum, `T3 + T6` for external transfer or high-risk mode |
| package transmission outbound | `T3 + T6` |
| protected-content access beyond already approved local view | `T3 + T6` |
| explicit-content transformation for outbound use | `T3 + T6` |
| overnight or background AI execution | `T4 + T6` only for bounded local advisory prep; otherwise `T3 + T6` |
| destructive AI-adjacent actions such as delete, overwrite, restore-over-current, forget durable memory | `T2 + T6` or `T3 + T6` depending on risk |

Approval classes remain distinct and must not collapse into one generic approval:

- provider permission,
- paid-use permission,
- spend-threshold approval,
- protected-package approval,
- destination truth acceptance.

### 10.3 What May Be Pre-Approved

- Nothing may be globally pre-approved across all future AI behavior.
- Only local, free, non-destructive, advisory, non-outbound, non-retaining, non-truth-mutating work may later qualify for silent-local or bounded session approval.
- This contract owns the approval-state vocabulary plus the expiry, revocation, and revalidation doctrine that governing policy owners must follow when recording concrete approval decisions.
- Persistent preferences may include allowed providers, blocked providers, route default, paid-use policy, and an ordinary spend ceiling.
- Request-specific approval remains required when spend exceeds the persistent ceiling, protected or summarized content is newly included, provider or privacy posture changes, a stale approved summary is used, or destination truth mutation is requested.

### 10.4 What May Be Session-Approved

- repeated bounded critique runs inside an already approved route class
- repeated bounded local advisory scans
- scheduled local-only advisory preparation
- repeated low-risk model help that does not widen scope, destination, cost, or protection class

### 10.5 What Always Requires Fresh Approval

- first paid API use for a task
- provider switch after refusal
- outbound package transmission
- explicit-content transform-required outbound work
- newly included approved summary or stale approved summary reuse
- export, sync, publish, or external transfer
- raw excluded-span retention
- destructive conversion or overwrite
- any scope expansion beyond the originally approved package or target

### 10.6 What May Never Be Silent

- truth mutation
- canon creation
- accepted manuscript mutation from AI-origin output
- durable signal creation
- durable note creation
- durable memory creation
- paid spend
- outbound transmission
- export
- sync
- deletion
- restore-over-current
- protected-content exposure

## 11. Retention Matrix

| Artifact or class | Allowed retention class | Owner | Automatic durability allowed? |
| --- | --- | --- | --- |
| raw model output | temporary only by default | requesting system | no |
| temporary response | temporary or session-only | requesting system | no |
| informational response | session-only by default | requesting system | no |
| advisory recommendation | temporary, parked, or converted | requesting system then target owner | no |
| critique finding | temporary or bounded advisory history | `Critique / Evaluation` | no |
| continuity finding | temporary, bounded advisory history, or signal candidate | `Continuity` | no |
| signal candidate | temporary until accepted | `Signal Architecture` intake | no |
| durable signal | durable signal state | `Signal Architecture` | no, requires acceptance |
| feedback-note candidate | temporary until accepted | `Feedback Notes / Revision Resolution` intake | no |
| durable note | durable note state | `Feedback Notes / Revision Resolution` | no, requires acceptance |
| memory candidate | temporary until retained | `Memory Lab` intake | no |
| durable advisory memory | durable memory | `Memory Lab` | no, requires retention approval |
| accepted truth used by AI | truth remains truth in its own owner; may also be cited in provenance | truth owner | already durable as truth, not because AI touched it |
| package artifact | temporary by default; bounded summary later | `LLM Package Construction Architecture` | no |
| author-approved summary | bounded approved package artifact | `Explicit Content Architecture` | no |
| approved package view reference | provenance-bounded reference only | `Authorship Provenance AI Visibility` | no by default |
| outbound payload trace | bounded route or transfer history | route or transfer owner | yes only as operational history, not content truth |
| provenance metadata | durable local/private metadata | `Authorship Provenance AI Visibility` | yes when required by doctrine, but not as truth |
| export record | durable transfer metadata | `Import Export Document Interchange` | yes as transfer history only |

## 12. AI Prohibitions

- AI may not silently mutate truth.
- AI may not silently mutate manuscript.
- AI may not silently create canon.
- AI may not silently create accepted assertions, lore facts, character facts, relationship facts, emotional intent, or project truth.
- AI may not silently create durable signals.
- AI may not silently create durable notes.
- AI may not silently retain memory.
- AI may not silently persist raw excluded spans.
- AI may not silently export.
- AI may not silently sync.
- AI may not silently spend money.
- AI may not silently transmit protected content.
- AI may not silently widen package scope.
- AI may not silently retry paid or outbound work after failure or refusal.
- AI may not silently convert temporary package payloads into durable memory.
- AI may not silently turn masked summaries or substitutions into truth.
- AI may not silently convert provenance into judgment or truth authority.

## 13. Future Validation Hooks

These are future validation programs, not implementation permission:

- local model validation
- paid API validation
- routing validation
- long-form memory transfer validation
- trilogy and series continuity transfer validation
- genre stress testing
- censorship versus writer-freedom boundary testing
- explicit-content transform fidelity testing
- package-boundary integrity testing
- provenance and acceptance-lineage validation
- recovery and degraded-mode AI-behavior validation

Each future validation program must stay subordinate to this contract and must not loosen approval, protection, or ownership doctrine.

## 14. Remaining Critical Questions

- What exact output-shape vocabulary should be shared across `Critique`, `Continuity`, `Theme System`, `Relationship Map`, `Emotion Graph`, and `Companion` so classifications stay interoperable without collapsing different meanings?
- What exact object-level provenance model is required for authored, suggested, generated, accepted, rejected, removed, masked, transformed, exported, and forgotten states?
- What exact `T4 session-approval-allowed` scope, revocation, and visibility rules are safe across local advisory work?
- Which continuity, critique, theme, relationship, and emotional artifacts justify durable advisory history versus expiry?
- What exact import-created states must exist before AI-assisted imports can safely hand off into manuscript, notes, binder, or archive destinations?
- What exact degraded-mode behavior should block, pause, downgrade, or permit local-only AI execution?

## 15. Dossiers Requiring Future Alignment

- `model_routing_and_budget_architecture.md`
- `llm_package_construction_architecture.md`
- `explicit_content_architecture.md`
- `authorship_provenance_ai_visibility.md`
- `memory_lab.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `critique_evaluation.md`
- `continuity.md`
- `theme_system.md`
- `relationship_map.md`
- `emotion_graph.md`
- `companion.md`
- `draft_generation_rewrite_loop.md`
- `import_export_document_interchange.md`
- `writing_surface.md`
- `command_center_surface.md`
- `workflow_spine_author_journey.md`

## 16. Acceptance Criteria

This contract is acceptable only if:

- the AI lifecycle is explicit from request formation through provenance
- every AI output class has an owner
- every AI output class has a retention default
- every AI conversion path is owner-governed
- no AI output silently becomes truth, manuscript, canon, durable signal, durable note, durable memory, or export
- paid and outbound AI work is never silent
- protected-content handling is upstream of routing and execution
- package artifacts remain distinct from memory, truth, and human export artifacts
- provenance remains visible or summonable without becoming truth
- future validation work stays subordinate to the governance contract rather than rewriting it implicitly
