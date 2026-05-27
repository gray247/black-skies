# Provisional Workflow-State Family Inventory - Pass 21

## Purpose

This document creates a provisional inventory of workflow-state families for the next reconstruction cluster, using prior semantic governance findings without finalizing workflow-state canon.

It is a reconstruction-planning artifact only. It does not rewrite the roadmap, authorize implementation, finalize workflow states, redesign the GUI, authorize topology architecture, authorize Story Unit persistence, authorize command/search expansion, renumber phases, or activate Phase 32.

Assumption handling:
- Current GUI remains transitional evidence, not workflow-state canon.
- Families listed here may later merge, split, rename, or become constraints, overlays, or authority classes instead of states.
- Orchestrator rulings entering this pass are treated as governing constraints for this inventory.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/command_search_bypass_risk_pass7.md`
- `docs/audits/advisory_mutation_verification_separation_pass9.md`
- `docs/audits/semantic_escalation_authority_transition_pass10.md`
- `docs/audits/support_recovery_normalization_pressure_pass11.md`
- `docs/audits/runtime_truth_vs_transparency_truth_pass13.md`
- `docs/audits/diagnostics_bridge_authority_split_pass18.md`
- `docs/audits/canonical_diagnostics_audience_vocabulary_pass19.md`
- `docs/audits/workflow_state_reconstruction_preparation_pass20.md`

## Workflow-State Family Inventory Model

This inventory is provisional only. It is not final workflow-state canon, not implementation authorization, not GUI structure, and not roadmap sequencing.

Classification terms:
- `State Candidate`: may become a workflow state after later reconstruction.
- `Constraint Candidate`: may govern one or more states rather than stand alone.
- `Overlay Candidate`: may appear over or within another state under strict inheritance rules.
- `Authority Class`: semantic authority that can appear inside states but should not be treated as a state by default.
- `Too Ambiguous`: not stable enough to classify beyond carrying forward for later analysis.

States may later merge, split, rename, or be demoted into constraints, overlays, or authority classes.

## Executive Findings

- The initial inventory should preserve semantic separation rather than optimize for a small state count.
- Focused Drafting must be treated both as a `State Candidate` and as a `Constraint Candidate`.
- Generation, Rewrite / Apply, and Mutation-Boundary Authority should be split from the start because they carry different mutation and blast-radius risks.
- Support / Recovery Exception and Diagnostics / Developer-Test must be separate from the start.
- Command/Search should remain deferred as an overlay candidate until provisional workflow-state families exist.
- Export / Output is currently an `Authority Class` first, not a workflow-state candidate.

## Provisional Workflow-State Families

### Focused Drafting

- purpose: protect primary writing work from competing authority surfaces
- authority risks: authoring authority can be diluted by advisory, support, diagnostics, command, and status surfaces
- visibility risks: nearby non-writing controls can become perceived workflow peers
- mutation risks: generation/rewrite routes can borrow drafting legitimacy
- vocabulary risks: support, readiness, and analysis language can intrude into writing vocabulary
- diagnostic/support risks: diagnostics and recovery must not become ordinary drafting tools
- current confidence level: high as governing concern, medium as standalone state
- classification: `State Candidate` and `Constraint Candidate`

### Selection / Capture

- purpose: select, identify, or capture target material before review, generation, structure, or mutation
- authority risks: selection can imply scope approval before mutation boundary is explicit
- visibility risks: selected targets can make follow-on actions feel endorsed
- mutation risks: selection may define blast radius indirectly
- vocabulary risks: selection terms can sound low-risk while setting up high-impact actions
- diagnostic/support risks: low direct risk unless support/debug selection states leak in
- current confidence level: medium
- classification: `State Candidate`

### Generation

- purpose: produce new or replacement draft material under explicit scope
- authority risks: generation is mutation-bearing and can appear too ordinary if primary-visible without boundaries
- visibility risks: frequent generation visibility can normalize mutation
- mutation risks: direct draft mutation and replacement risk
- vocabulary risks: readiness or model/provenance language can imply endorsement
- diagnostic/support risks: runtime truth can be overread as generation readiness
- current confidence level: high
- classification: `State Candidate`

### Rewrite / Apply

- purpose: transform advisory output into saved rewrite or applied draft change
- authority risks: advisory legitimacy can transfer into mutation
- visibility risks: review and apply controls in one family can hide the transition
- mutation risks: consequential draft mutation after critique/rewrite framing
- vocabulary risks: soft words like sync or saved rewrite can understate mutation
- diagnostic/support risks: model/provenance truth can be overread as quality certification
- current confidence level: high
- classification: `State Candidate`

### Mutation-Boundary Authority

- purpose: define target, scope, confirmation, and blast radius for mutation
- authority risks: can be mistaken for a small setting instead of an authority decision
- visibility risks: compact controls can hide magnitude of action
- mutation risks: changes mutation scope without performing mutation itself
- vocabulary risks: scope labels can understate blast radius
- diagnostic/support risks: runtime readiness can imply mutation boundary is acceptable
- current confidence level: high
- classification: `Authority Class` and `Constraint Candidate`

### Advisory / Review

- purpose: interpret, critique, suggest, or guide without direct state mutation
- authority risks: advice can become pseudo-permission for nearby mutation
- visibility risks: advisory surfaces near action controls can become workflow peers
- mutation risks: indirect mutation escalation through rewrite/apply
- vocabulary risks: guidance language can sound authoritative
- diagnostic/support risks: model/service status can lend artificial confidence
- current confidence level: high
- classification: `State Candidate`

### Verification / Inspection

- purpose: inspect, prove, validate, or report state without recovery mutation
- authority risks: proof can be mistaken for repair or approval
- visibility risks: safety-adjacent placement can blend with restore and snapshot creation
- mutation risks: low direct mutation, high adjacency risk
- vocabulary risks: clean/verified/safe terms can imply broader readiness
- diagnostic/support risks: diagnostics can be over-promoted through inspection language
- current confidence level: high
- classification: `State Candidate`

### Support / Recovery Exception

- purpose: handle exceptional recovery, restore, reopen, offline, or degraded support paths
- authority risks: exception authority can normalize into ordinary workflow
- visibility risks: repeated support/recovery visibility creates ambient pressure
- mutation risks: restore and recovery actions are high-impact
- vocabulary risks: recovery wording can become routine maintenance language
- diagnostic/support risks: diagnostics may appear as peer action to restore/reopen
- current confidence level: high
- classification: `State Candidate`

### Recovery Diagnostics

- purpose: investigate exceptional recovery evidence without becoming ordinary diagnostics
- authority risks: can borrow recovery mutation/navigation legitimacy
- visibility risks: diagnostics beside restore/reopen can read as equivalent action
- mutation risks: low direct mutation, high recovery-adjacent authority risk
- vocabulary risks: diagnostics wording can become routine workflow language
- diagnostic/support risks: must remain separate from ordinary support diagnostics and developer/test diagnostics
- current confidence level: high as exceptional family, medium as standalone state
- classification: `State Candidate` or `Overlay Candidate`

### Diagnostics / Developer-Test

- purpose: support engineering diagnosis, validation scaffolding, harness state, logs, and test-only investigation
- authority risks: severe if exposed as product or advanced-user workflow
- visibility risks: any ordinary user visibility risks workflow contamination
- mutation risks: test seams can alter service or scene evidence
- vocabulary risks: internal/test terms can become product language
- diagnostic/support risks: highest if mixed with product-support diagnostics
- current confidence level: high
- classification: `State Candidate` for dev/test context, otherwise `Overlay Candidate` or hidden/internal family

### Structure / Organization

- purpose: navigate, arrange, or reason about structural story elements without automatically mutating content
- authority risks: organization can become architecture or hidden mutation
- visibility risks: structural tools can compete with writing surface authority
- mutation risks: can become consequential if movement, grouping, or persistence is added
- vocabulary risks: structure terms can imply Story Unit persistence or topology authority
- diagnostic/support risks: low direct risk, but can absorb command/search pressure
- current confidence level: medium-low
- classification: `State Candidate` and `Too Ambiguous`

### Advanced Analysis

- purpose: expose deeper intelligence, analytics, contextual review, or analysis surfaces
- authority risks: interpretation can impersonate judgment or product certainty
- visibility risks: analysis can become dashboard-like workflow authority
- mutation risks: indirect mutation through recommendations and follow-on actions
- vocabulary risks: metrics, readiness, quality, and provenance can imply certification
- diagnostic/support risks: diagnostics and runtime truth can be confused with analytic confidence
- current confidence level: medium
- classification: `State Candidate` or `Overlay Candidate`

### Command/Search Overlay Candidate

- purpose: later discovery, routing, or command access only after workflow-state authority inheritance exists
- authority risks: highest bypass risk if execution or hidden actions become reachable
- visibility risks: neutral-looking search/command can compress authority classes
- mutation risks: severe if mutation routes attach to registry entries
- vocabulary risks: search and command must not collapse retrieval, routing, and execution
- diagnostic/support risks: hidden support/dev/test routes can leak into product access
- current confidence level: high as risk family, low as state
- classification: `Overlay Candidate`; unauthorized and deferred

### Export / Output Authority Class

- purpose: emit artifacts or outputs without directly defining workflow state
- authority risks: output can imply maturity, completion, or readiness
- visibility risks: header-visible export can look more central than governance supports
- mutation risks: low direct draft mutation, but output state may have contract implications
- vocabulary risks: export/output terms can imply finality
- diagnostic/support risks: low direct risk unless support reports/logs are bundled with export
- current confidence level: high as authority class, low as state
- classification: `Authority Class`

## Focused Drafting As State And Constraint

Focused Drafting should remain both:
- a possible `State Candidate` representing the user's protected writing context
- a `Constraint Candidate` that limits authority compression across other states

As a state, it asks what must be visible for writing. As a constraint, it asks what must stay out of the way whenever writing remains primary.

Pass 21 finding:
- Focused Drafting should not be reduced to layout preference
- it is an authority-protection rule and possibly a workflow state

## Generation / Rewrite / Mutation-Boundary Split Findings

Generation, Rewrite / Apply, and Mutation-Boundary Authority should not be collapsed.

- `Generation` mutates draft content.
- `Rewrite / Apply` crosses from advisory/review into mutation and needs stronger transition governance.
- `Mutation-Boundary Authority` defines scope, target, confirmation, and blast radius before mutation.

Pass 21 finding:
- mutation-boundary semantics must be visible before mutation semantics are approved
- rewrite/apply needs separate treatment because it borrows advisory legitimacy

## Support / Recovery vs Diagnostics / Developer-Test Separation Findings

Support / Recovery Exception and Diagnostics / Developer-Test should be separate from the start.

- Support/recovery is product-visible only when exception or support condition requires it.
- Recovery diagnostics is exceptional and recovery-adjacent.
- Diagnostics/developer-test is internal, validation, or developer investigation authority.

Pass 21 finding:
- support/recovery may be user-facing
- diagnostics/developer-test must not become ordinary user workflow
- recovery diagnostics needs separate handling because it touches both exception support and diagnostics

## Export / Output As Authority Class Findings

Export / Output should be treated as an authority class first, not a workflow-state candidate.

It can appear in future states, but its governance issue is output authority:
- output can imply completion
- export can imply product maturity
- emitted artifacts can be treated as stable even when surrounding workflow remains transitional

Pass 21 finding:
- export capability may survive, but current placement and state ownership remain unresolved

## Command/Search Deferral Findings

Command/Search should wait until provisional workflow-state families exist.

Command/Search is currently:
- a bypass-risk family
- an overlay candidate
- unauthorized for expansion
- dependent on workflow-state authority inheritance

Pass 21 finding:
- command/search cannot define workflow authority
- it must inherit workflow-state authority later, if it is authorized at all

## Candidate Families That May Be Constraints Rather Than States

- `Focused Drafting`
- `Mutation-Boundary Authority`
- `Runtime truth / readiness separation`
- `Vocabulary audience matching`
- `Diagnostics audience separation`
- `Support/recovery exception framing`

These may govern multiple states rather than become states themselves.

## Candidate Families That May Be Overlays Rather Than States

- `Command/Search Overlay Candidate`
- `Recovery Diagnostics`
- `Diagnostics / Developer-Test`
- `Advanced Analysis`
- status/truth visibility surfaces

These may appear over specific states only if inheritance and visibility rules are later defined.

## Candidate Families Too Ambiguous To Stabilize Yet

- `Structure / Organization`
- `Advanced Analysis`
- `Command/Search Overlay Candidate`
- `Recovery Diagnostics` as state versus overlay
- `Diagnostics / Developer-Test` as state versus hidden/internal mode
- Story Unit-related structure pressure
- topology/relationship analysis pressure
- export/output placement inside future states

## What Must Not Be Promoted Yet

- final workflow-state canon
- current GUI as workflow architecture
- command/search expansion
- topology architecture
- Story Unit persistence
- diagnostics expansion
- recovery diagnostics as routine support tooling
- export/output as a workflow-state candidate
- provisional family names as product navigation
- Mutation-Boundary Authority as a minor setting

## Questions For Orchestrator

- Should Pass 22 build an authority-question matrix across these provisional families?
- Should Recovery Diagnostics be inventoried as a state candidate, overlay candidate, or exceptional subfamily under Support / Recovery Exception?
- Should Diagnostics / Developer-Test be treated as a workflow state only for dev/test contexts, or as hidden/internal infrastructure outside product workflow states?
- Should Structure / Organization wait until Story Unit pressure is separately reconstructed?
- Should Advanced Analysis split into advisory analysis and structural analysis before matrix work?
- Should Export / Output remain only an authority class through the next pass?

## Recommended Reconstruction Pass 22

Run a twenty-second reconstruction pass focused on a provisional workflow-state authority question matrix.

Pass 22 should:
- map each provisional family against authority, visibility, mutation, vocabulary, diagnostics, and support questions
- keep state, constraint, overlay, and authority class distinctions explicit
- avoid finalizing workflow-state canon
- keep command/search deferred until inheritance can be modeled
- keep topology, Story Unit persistence, diagnostics expansion, GUI redesign, roadmap rewrite, phase renumbering, and Phase 32 activation unauthorized
