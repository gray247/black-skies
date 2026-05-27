# Command/Search Inheritance Reconstruction - Pass 26

## Purpose

This document reconstructs command/search inheritance semantics across workflow-state families, Mutation-Boundary Authority, selection scope semantics, support/recovery boundaries, and diagnostics separation without authorizing command/search implementation or workflow-state canon.

It is a reconstruction-planning artifact only. It does not rewrite the roadmap, renumber phases, finalize workflow states, implement changes, redesign the GUI, authorize topology architecture, authorize Story Unit persistence, authorize command/search implementation, convert inheritance semantics into implementation requirements, or activate Phase 32.

Assumption handling:
- Current GUI remains transitional evidence, not workflow-state canon.
- Search inheritance is analyzed before command execution inheritance.
- Multi-selection and batch authority are deferred to a later dedicated pass.
- Recovery restore/reopen governance must stabilize before recovery-adjacent command routes are authorized.
- Story Unit pressure reconstruction must happen before structural selection stabilizes.
- Where evidence conflicts, this pass reports conflict instead of silently resolving it.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/provisional_workflow_state_family_inventory_pass21.md`
- `docs/audits/workflow_state_authority_question_matrix_pass22.md`
- `docs/audits/provisional_workflow_state_entry_exit_pass23.md`
- `docs/audits/mutation_boundary_authority_transition_map_pass24.md`
- `docs/audits/selection_scope_semantics_reconstruction_pass25.md`
- `docs/audits/command_search_bypass_risk_pass7.md`
- `docs/audits/advisory_mutation_verification_separation_pass9.md`
- `docs/audits/semantic_escalation_authority_transition_pass10.md`
- `docs/audits/support_recovery_normalization_pressure_pass11.md`
- `docs/audits/runtime_truth_diagnostics_support_leakage_pass12.md`
- `docs/audits/diagnostics_bridge_authority_split_pass18.md`

## Command/Search Inheritance Model

This model is provisional only. It is not implementation authorization, not workflow-state canon, and not final product navigation.

Command/search cannot self-authorize. It can only inherit authority from:
- active workflow-state family
- active selection semantics
- active Mutation-Boundary Authority, if mutation is being considered
- support/recovery exception framing
- diagnostics audience boundaries
- status/truth exposure constraints

Read-only search inheritance is analyzed before command execution inheritance.

Provisional semantic families:
- `Search`: read-only retrieval, filtering, locating, or surfacing evidence.
- `Command Route`: navigation or preparation toward a workflow state or action without execution.
- `Command Execution`: mutation, recovery, diagnostics, export, or other authority-bearing action. This remains unauthorized.

Required distinctions:
- discover is not permission
- search result is not executable authority
- route is not execute
- inspect is not mutate
- preview is not apply
- visibility is not authorization
- selection inheritance is not mutation permission

## Executive Findings

- Command/search is an inheritance problem, not an authority source.
- Read-only search may be reconstructable earlier than command execution, but only if results do not imply permission, readiness, or executable authority.
- Command routes must distinguish discover, navigate, prepare, preview, inspect, queue, request, and execute.
- Mutation-capable command routes remain blocked until workflow-state canon, selection semantics, Mutation-Boundary Authority, and blast-radius governance are stable.
- Support/recovery routes require exception-state inheritance and cannot be ambient command/search entries.
- Diagnostics routes must inherit audience boundaries and remain separate from ordinary workflow.
- Story Unit persistence and structural selection remain unauthorized, so structural command/search routes remain unstable.

## Read-Only Search Inheritance Findings

### Workflow-State Inheritance

- Read-only search should inherit the current workflow state's visibility and vocabulary constraints.
- Search results should not surface actions outside the active state's allowed authority.
- Search should not create a hidden second workflow that bypasses Focused Drafting, Advisory / Review, Verification / Inspection, or Support / Recovery boundaries.
- If workflow-state canon is provisional, search inheritance must remain provisional.

### Selection Inheritance

- Search may use selection as context, target, evidence, or structural hint only if the active semantic meaning is explicit.
- Search must not convert selected context into selected execution target.
- Stale, broad, ambiguous, recovery-adjacent, diagnostics-adjacent, and structural selections should not silently shape search authority.
- Multi-selection and batch semantics are deferred and must not be inferred by search.

### Visibility Inheritance

- Search result visibility creates legitimacy pressure.
- Results visible during Focused Drafting should not make support, diagnostics, recovery, structure, or mutation routes feel like peers to writing.
- Search ranking, grouping, and repeated surfacing can normalize unavailable or exceptional authority.
- Hidden/dev/test content must not become product-visible through search.

### Diagnostics/Support Inheritance

- Product-support content, recovery diagnostics, and developer/test diagnostics must remain separate in search inheritance.
- Support truth may be searchable only within bounded support context.
- Recovery diagnostics may appear only under recovery exception framing.
- Developer/test diagnostics must not appear in ordinary user search.

### Status/Truth Inheritance

- Runtime truth may inform search availability or explain missing results, but it must not imply operational readiness.
- Transparency truth is not permission to expose hidden routes.
- Service status should not rank or enable mutation-capable routes.
- Search results should not turn status signals into endorsement.

### Evidence Versus Mutation Semantics

- Search may retrieve evidence without authorizing repair, restore, rewrite, apply, generation, or structure mutation.
- Search result selection must not become mutation scope unless later Mutation-Boundary Authority is entered.
- Search can help locate evidence for Verification / Inspection but cannot collapse inspection into recovery or repair.

## Command Route Inheritance Findings

Command route semantics must be separated before any implementation discussion.

- `Discover`: surface that something exists. Discoverability is not permission.
- `Navigate`: move the user to a context or surface. Navigation is not execution.
- `Prepare`: gather context or preconditions. Preparation is not confirmation.
- `Preview`: show possible effect or candidate result. Preview is not apply.
- `Inspect`: view evidence or state. Inspection is not mutation.
- `Queue`: defer or stage potential work. Queueing is not approval.
- `Request`: ask for an action to be considered. Request is not authorization.
- `Execute`: perform authority-bearing action. Execution remains unauthorized for command/search.

Findings:
- Command routes can only inherit authority from active workflow context.
- A command that changes state must enter Mutation-Boundary Authority before execution.
- A command that opens support or diagnostics must inherit support/recovery or diagnostics audience framing.
- A command that navigates to structure remains unstable pending Story Unit pressure reconstruction.

## Mutation-Capable Command Boundary Findings

Mutation-capable command routes remain blocked.

Blocked mutation families include:
- generation
- rewrite/apply
- restore/recovery mutation
- repair
- structure mutation
- Story Unit persistence
- topology-related mutation
- diagnostics actions that alter runtime/test state
- batch or multi-selection mutation

Boundary requirements before future reconsideration:
- active workflow-state authority
- selection semantic meaning
- mutation target
- mutation scope
- destination, if any
- preview or inspection evidence
- confirmation boundary
- blast radius
- recovery or reversibility expectations

## Workflow-State Inheritance Findings

- Focused Drafting should strongly limit command/search visibility to writing-relevant retrieval unless later canon says otherwise.
- Selection / Capture may allow locating selected context but not acting on it.
- Generation and Rewrite / Apply require Mutation-Boundary Authority before any command route can progress beyond prepare or preview.
- Advisory / Review may allow search for context or prior advice, but not apply commands.
- Verification / Inspection may allow evidence search and inspection routes, not repair or restore execution.
- Support / Recovery Exception may allow bounded support navigation, but recovery-adjacent commands remain blocked until restore/reopen governance stabilizes.
- Diagnostics / Developer-Test must remain dev/test-only or hidden/internal for normal product use.
- Structure / Organization remains paused pending Story Unit pressure reconstruction.
- Advanced Analysis may allow retrieval and preview of analysis context, not executive judgment or mutation.

## Selection-Scope Inheritance Findings

- Command/search must inherit selection as context, target, mutation scope, destination, evidence, or structural hint.
- Selection is not permission and must not become command permission.
- A selected target is not blast radius.
- A selected destination is not execution.
- Selected evidence is not repair permission.
- Structural selection is not Story Unit persistence.
- Command/search should fail closed when selection is stale, broad, ambiguous, multi-selected, or detached from the active workflow state.

## Support/Recovery Inheritance Findings

- Support/recovery inheritance requires explicit exception framing.
- Support truth may explain condition, limitation, retry state, or recovery need without becoming workflow tooling.
- Recovery-adjacent command routes remain blocked until recovery restore/reopen governance stabilizes.
- Search may locate support evidence only within bounded support context.
- Commands must not expose restore, repair, reopen, or recovery diagnostics as ordinary actions.
- Recovery urgency must not bypass mutation-boundary review.

## Diagnostics Audience Inheritance Findings

- Diagnostics search and routes must inherit audience boundaries.
- Product-support diagnostics, recovery diagnostics, and developer/test diagnostics must not collapse into one command/search family.
- Developer/test diagnostics must remain hidden from ordinary product workflow.
- Recovery diagnostics may be reachable only from Support / Recovery Exception after recovery framing exists.
- Diagnostics folder access remains context-dependent and must not become a generic command/search result.
- Internal reason keys and test-state semantics must not surface through ordinary search.

## Readiness / Legitimacy Drift Findings

- Search result presence can imply legitimacy.
- Search ranking can imply recommendation.
- Command availability can imply permission.
- Repeated search surfacing can normalize support, recovery, diagnostics, or mutation actions.
- Runtime truth can become readiness inference if shown near command availability.
- Transparency truth can become permission if hidden routes are exposed as searchable.
- Preview can become apply pressure if placed too close to execution semantics.

## Highest-Risk Inheritance Ambiguities

- Whether search result visibility implies workflow legitimacy.
- Whether command discovery implies command permission.
- Whether navigation to a state implies authority to execute actions in that state.
- Whether selected context becomes selected target or mutation scope.
- Whether preview becomes apply.
- Whether inspection becomes repair.
- Whether support truth becomes recovery tooling.
- Whether recovery diagnostics becomes ordinary diagnostics access.
- Whether developer/test routes become advanced-user routes.
- Whether structure search implies Story Unit persistence.
- Whether command/search can inherit authority before workflow-state canon stabilizes.

## Future Batch-Authority Implications

- Multi-selection and batch authority remain deferred.
- Batch commands would multiply selection ambiguity, blast-radius risk, and command/search bypass risk.
- Batch search results may be harmless as retrieval but dangerous if converted into grouped command targets.
- Batch mutation cannot be reconstructed until selection persistence, broad scope, mutation-boundary authority, and workflow-state inheritance stabilize.
- Structural batch selection is especially blocked by Story Unit pressure and topology risk.

## Future Recovery-Route Implications

- Recovery-adjacent command/search routes remain blocked until recovery restore/reopen governance stabilizes.
- Read-only search for recovery evidence may be possible later only inside Support / Recovery Exception.
- Restore/reopen/repair commands must not appear as global command/search results.
- Recovery Diagnostics cannot be a generic searchable destination.
- Recovery routes must distinguish inspect, prepare, preview, request, and execute before any execution route is reconsidered.
- Recovery mutation must preserve source, target, overwritten state, reversibility, and post-recovery evidence boundaries.

## What Must Not Be Promoted Yet

- final workflow-state canon
- command/search implementation
- mutation-capable command routes
- command execution inheritance
- discoverability as permission
- search results as executable authority
- selection inheritance as mutation permission
- route as execute
- inspect as mutate
- preview as apply
- visibility as authorization
- Story Unit persistence
- topology architecture
- structural command/search stabilization
- recovery-adjacent command routes
- diagnostics expansion
- current GUI placement as command/search design

## Contradictions Found

- Search can reduce friction, yet search visibility itself creates legitimacy pressure.
- Command routes can improve navigation, yet routing can look like authorization.
- Read-only retrieval is safer than execution, yet retrieved evidence can pressure mutation or repair.
- Selection inheritance is necessary for usefulness, yet selection is not permission.
- Support/recovery must be discoverable during exceptions, yet discovery normalizes exception authority.
- Diagnostics can support recovery, yet diagnostics search can leak developer/test authority.
- Command/search needs workflow-state inheritance, yet workflow-state canon remains provisional.

## Areas Too Ambiguous To Stabilize Yet

- exact boundary between search retrieval and command routing
- whether any command route can be non-mutating enough to stabilize before workflow-state canon
- selection persistence rules for command/search
- stale, broad, and multi-selection handling
- batch authority
- recovery restore/reopen command semantics
- diagnostics search by audience
- structural search before Story Unit pressure reconstruction
- Advanced Analysis search versus advisory routing
- status/truth signals in search result ranking or availability

## Questions For Orchestrator

- Should Pass 27 reconstruct batch authority and multi-selection risk before recovery routes?
- Should read-only search receive its own stricter retrieval-only canon before command routing is revisited?
- Should recovery restore/reopen governance be the next pass because recovery routes remain blocked?
- Should Story Unit pressure reconstruction occur before structural search is analyzed further?
- Should diagnostics audience search be split from general command/search inheritance?
- Should command execution remain entirely out of scope until workflow-state canon is closer to stable?

## Recommended Reconstruction Pass 27

Run a twenty-seventh reconstruction pass focused on multi-selection and batch-authority pressure.

Pass 27 should:
- keep command/search implementation unauthorized
- analyze how multi-selection affects scope, blast radius, batch mutation, search grouping, and command routing
- preserve selection is not permission
- preserve search result visibility is not authorization
- keep recovery restore/reopen governance deferred unless orchestrator redirects
- keep workflow-state canon provisional
- keep Story Unit persistence, topology architecture, diagnostics expansion, GUI redesign, roadmap rewrite, phase renumbering, and Phase 32 activation unauthorized
