# Reconstruction Control Register Formalization - Pass 43

## 1. Purpose

Pass 43 formalizes the control machinery for the Reconstruction Planning Arc.

It converts prior reconstruction findings into stable registers, IDs, statuses, closure mechanics, reauthorization logic, dependency gates, and future-pass update rules. This artifact is governance infrastructure, orchestration infrastructure, and reconstruction control infrastructure.

This pass does not resolve all contradictions. It does not authorize implementation, rewrite the roadmap, finalize workflow-state canon, redesign the GUI, authorize topology architecture, authorize Story Unit persistence, authorize command/search, authorize structural retrieval, finalize product copy, renumber phases, or activate Phase 32.

## 2. Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/reconstruction_dependency_and_authority_map_pass40.md`
- `docs/audits/recovery_diagnostics_governance_pass41.md`
- `docs/audits/user_facing_condition_language_vs_internal_governance_vocabulary_pass42.md`
- `docs/audits/source_of_truth_vocabulary_stabilization_pass39.md`
- `docs/audits/restore_reopen_boundary_detail_pass38.md`
- `docs/audits/failed_retrieval_invalidity_semantics_pass37.md`
- `docs/audits/rollback_failure_semantics_reconstruction_pass36.md`
- `docs/audits/retrieval_batching_grouping_pressure_pass35.md`
- `docs/audits/structural_retrieval_governance_pass34.md`
- `docs/audits/topology_containment_reconstruction_pass33.md`
- `docs/audits/stale_state_source_of_truth_reconstruction_pass32.md`
- `docs/audits/structural_mutation_governance_pass31.md`
- `docs/audits/continuity_authority_reconstruction_pass30.md`
- `docs/audits/story_unit_pressure_reconstruction_pass29.md`
- `docs/audits/batch_authority_multiselection_governance_pass28.md`
- `docs/audits/recovery_restore_reopen_governance_pass27.md`
- `docs/audits/command_search_inheritance_reconstruction_pass26.md`
- `docs/audits/selection_scope_semantics_reconstruction_pass25.md`
- `docs/audits/mutation_boundary_authority_transition_map_pass24.md`
- `docs/audits/provisional_workflow_state_entry_exit_pass23.md`
- `docs/audits/workflow_state_authority_question_matrix_pass22.md`
- `docs/audits/provisional_workflow_state_family_inventory_pass21.md`
- `docs/audits/workflow_state_reconstruction_preparation_pass20.md`

## 3. Executive Findings

- Control registers are now needed because the reconstruction arc has accumulated enough interdependent findings that prose-only continuity is no longer reliable.
- Prose-only governance is insufficient because future passes can restate findings without changing status, closure state, dependency gates, or blocked-promotion eligibility.
- Stable IDs are required so contradictions, blocked promotions, dependency gates, authority families, vocabulary containment items, and safe-maintenance lanes can be updated without renaming the problem each pass.
- `Analyzed` is not the same as `stabilized enough to unblock`. Many areas have been examined in detail but still cannot support implementation sequencing, roadmap rewrite, workflow-state canon, command/search re-entry, recovery execution, or product copy.
- Reauthorization logic must exist before implementation planning resumes because no blocked promotion should reopen by implication, adjacency, repeated mention, or maintenance convenience.
- Future reconstruction passes should update affected registers by ID, not only produce new narrative findings.

## 4. Register Class Model

| Register class | Purpose | Tracks | Owner / updater expectation | Future-pass update trigger | Status-change evidence |
| --- | --- | --- | --- | --- | --- |
| Contradiction Register | Preserve unresolved tensions without silent resolution. | Conflicts between useful behavior and authority/legitimacy risk. | Every reconstruction pass updates affected `C-###` IDs. | Any finding changes contradiction scope, status, or closure path. | New artifact narrows risk, adds containment, or proves no current-arc closure. |
| Blocked-Promotion Register | Prevent provisional findings from becoming canon or implementation authority. | Items that must not be promoted yet. | Every pass touching a blocked area updates affected `BP-###` IDs. | Any pass discusses workflow canon, command/search, recovery, retrieval, topology, Story Units, vocabulary, implementation, or roadmap rewrite. | Required gates satisfied plus explicit orchestrator reauthorization later. |
| Dependency-Gate Register | Make dependencies explicit and testable before unblocking. | Gates that block promotions or planning moves. | Every pass affecting prerequisites updates affected `DG-###` IDs. | A dependency is added, partially reconstructed, stabilized, or deferred. | Named upstream artifacts and register statuses meet gate criteria. |
| Governance-Domain Register | Maintain domain boundaries across passes. | Governance areas such as recovery, retrieval, vocabulary, topology, and command/search. | Future passes update affected `GD-###` domains. | Domain scope changes or a domain becomes cross-blocking. | Domain has stable boundaries, related contradictions, and blocked promotions mapped. |
| Pressure-Field Register | Track legitimacy pressure that is not implementation authorization. | Visibility, adjacency, repetition, persistence, retrieval identity, topology, vocabulary drift, and bypass pressure. | Future passes update affected `PF-###` fields. | A pressure field strengthens, weakens, splits, or becomes a dependency. | Pressure is contained by language, placement, scope, or explicit blocked-promotion status. |
| Reconstruction-State Register | Separate analyzed, partial, stable, blocked, and closed states. | State of reconstruction artifacts and domains. | Each pass declares which `RS-###` state applies to its subject. | A pass claims progress, closure, deferral, or readiness. | Status change backed by register updates, not just prose. |
| Implementation-Eligibility Register | Define future eligibility language without reopening implementation. | Prohibited, maintenance-safe, conditionally reopenable, not evaluated, and stabilization candidates. | Updated only by explicit eligibility-oriented passes or control artifacts. | Any implementation lane is discussed. | Dependency gates and blocked-promotion statuses support the eligibility class. |
| Vocabulary-Containment Register | Prevent vocabulary leakage and accidental canonization. | Internal-only, diagnostics-only, recovery-exception, support-condition, structural/topology, and authority-transition terms. | Vocabulary passes update affected `VC-###` IDs. | Terms are exposed, translated, repeated, or proposed for product use. | Term has containment lane, prohibited inheritance, and exposure category. |
| Authority-Family Register | Track authority types and their non-inheritance rules. | Advisory, mutation, inspection, recovery, diagnostics, support, runtime, source-of-truth, continuity, structural, retrieval, batch, command/search, export/output. | Every pass that touches an authority family updates affected `AF-###` IDs. | Authority scope changes, reauthorization is proposed, or inheritance is claimed. | Authority boundary and blocked promotions are explicitly updated. |
| Safe-Maintenance Lane Register | Keep maintenance work possible without authority drift. | Allowed docs/tests/bugfix/support/logging/layout safety lanes. | Maintenance-oriented passes update affected `SM-###` lanes. | A pass claims work is safe maintenance. | Authority-impact note plus visibility, vocabulary, mutation, recovery, and command/search checks. |

## 5. Stable ID Model

- `C-###`: contradiction.
- `BP-###`: blocked promotion.
- `DG-###`: dependency gate.
- `GD-###`: governance domain.
- `PF-###`: pressure field.
- `RS-###`: reconstruction state.
- `IE-###`: implementation eligibility item.
- `VC-###`: vocabulary containment item.
- `AF-###`: authority family.
- `SM-###`: safe-maintenance lane.

ID rules:

- IDs are stable once assigned.
- IDs should not be reused if an item is closed or superseded.
- New IDs should be created only for non-trivial control items.
- Renaming a title does not change the ID.
- Future passes should reference IDs directly when changing scope, status, dependency, or closure state.

Entry-allocation note:

- Pass 43 creates concrete entries for `C-###`, `BP-###`, `DG-###`, `GD-###`, `PF-###`, `IE-###`, `AF-###`, and `SM-###`.
- Pass 43 reserves `VC-###` and `RS-###` as stable ID families, but does not itemize individual vocabulary-containment or reconstruction-state entries yet.
- Until a later artifact itemizes `VC-###` entries, future passes should reference Pass 42 vocabulary lanes and Pass 43 status values rather than inventing ad hoc IDs.
- Until a later artifact itemizes `RS-###` entries, reconstruction state should be expressed with the allowed status values in this pass and linked to the affected domain, dependency gate, blocked promotion, or authority family.
- This reservation avoids fake ID completeness and register sprawl while keeping the schema ready for later formalization.

## 6. Register State Model

Allowed status values:

- `exploratory`: early mapping; not enough structure for gates.
- `unstable`: known pressure or contradiction remains too ambiguous for use.
- `partially reconstructed`: analyzed and bounded in part, but still blocked by dependencies.
- `containment active`: risk is recognized and controlled for current planning, but not closed.
- `blocked`: cannot proceed until named gates are satisfied.
- `deferred`: intentionally postponed to a later pass or future arc.
- `maintenance-safe`: allowed only under safe-maintenance checks.
- `implementation-prohibited`: explicitly blocked from implementation.
- `canonization-prohibited`: explicitly blocked from final workflow/product canon.
- `conditionally reopenable`: may be reconsidered later if named gates are satisfied and orchestrator reauthorizes.
- `stabilization candidate`: may move toward planning stabilization if remaining gates are met.
- `stabilized for planning`: stable enough for planning discussion, not necessarily implementation.
- `closed for current arc`: sufficiently resolved or contained for this reconstruction arc only.

Clarification: `closed for current arc` does not mean permanently solved, product-authorized, implementation-ready, or immune to later reopening.

## 7. Contradiction Register Formalization

| ID | Short name | Current status | Affected domains | Blocked promotions affected | Dependency gates affected | Progress evidence | Closure for current arc |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | Transitional GUI vs workflow canon | contained | workflow-state, GUI, implementation eligibility | BP-001, BP-015, BP-017 | DG-007, DG-008, DG-009 | GUI evidence remains explicitly non-canonical. | Current GUI cannot be cited as workflow canon in roadmap rewrite. |
| C-002 | Visibility vs legitimacy pressure | open | support, recovery, diagnostics, visibility, vocabulary | BP-012, BP-013, BP-014, BP-015 | DG-002, DG-003, DG-006, DG-010 | Visibility rules distinguish support truth, diagnostics, recovery evidence, and workflow legitimacy. | Visibility pressure is contained by exposure categories and safe-maintenance checks. |
| C-003 | Advisory usefulness vs mutation permission | partially resolved | advisory, mutation, rewrite/apply, generation | BP-001, BP-003, BP-017 | DG-001, DG-007, DG-008 | Advisory remains non-mutating and cannot authorize rewrite/apply. | Advisory-to-mutation transition gates remain active. |
| C-004 | Verification safety vs repair permission | contained | inspection, verification, recovery, mutation | BP-003, BP-010, BP-011 | DG-002, DG-008 | Verification remains evidence-only. | Verification cannot be used as repair/recovery permission. |
| C-005 | Selection usefulness vs mutation scope | partially resolved | selection, mutation-boundary, batch, command/search | BP-003, BP-004, BP-017 | DG-001, DG-008 | Selection remains context/scope, not permission. | Selection inheritance cannot bypass mutation-boundary gates. |
| C-006 | Generation capability vs mutation governance | open | generation, mutation, workflow-state | BP-001, BP-003, BP-017 | DG-001, DG-007, DG-008 | Generation scope and blast radius remain governed separately from action. | Generation stays blocked from canon until mutation-boundary planning is stable. |
| C-007 | Restore protection vs replacement authority | open | recovery, source-of-truth, mutation, vocabulary | BP-010, BP-011, BP-014 | DG-002, DG-006, DG-008 | Restore-as-copy and restore-as-replacement remain separated. | Restore cannot imply rollback, replacement success, or source-of-truth authority. |
| C-008 | Reopen navigation vs authority resumption | open | recovery, navigation, source-of-truth, vocabulary | BP-010, BP-011, BP-014 | DG-002, DG-006, DG-008 | Reopen remains separated from resume authority and rehydration. | Reopen cannot be promoted as harmless navigation. |
| C-009 | Continuity support vs persistence implication | partially resolved | continuity, source-of-truth, structural, Story Unit | BP-007, BP-009, BP-014 | DG-004, DG-005, DG-006 | Continuity remains separate from persistence and durable identity. | Continuity language remains contained as pressure, not persistence. |
| C-010 | Structural grouping vs Story Unit identity | open | structural, Story Unit, batch, retrieval | BP-006, BP-007, BP-009 | DG-003, DG-004, DG-005 | Grouping remains non-identifying and non-persistent. | Structure/Organization remains blocked until Story Unit pressure is contained. |
| C-011 | Relationship usefulness vs graph identity | open | topology, structure, retrieval | BP-008, BP-009 | DG-005, DG-006 | Relationship and traversal remain pressure-only. | Topology/graph architecture remains unauthorized. |
| C-012 | Retrieval orientation vs persistence/authority | open | retrieval, source-of-truth, structure, vocabulary | BP-005, BP-006, BP-014 | DG-003, DG-006, DG-008 | Retrieval invalidity and retrieval visibility remain non-authorizing. | Retrieval cannot imply persistence, identity, execution, or authority. |
| C-013 | Grouped retrieval vs object set/batch authority | open | retrieval, batch, command/search | BP-003, BP-005, BP-006 | DG-001, DG-003, DG-008 | Retrieval sets remain separate from object sets and batch targets. | Grouped retrieval cannot become grouped execution authority. |
| C-014 | Recomputed structure vs durable identity | contained | structural, retrieval, source-of-truth, vocabulary | BP-006, BP-007, BP-009, BP-014 | DG-003, DG-004, DG-006 | Recomputed remains separate from persisted identity. | Recomputed vocabulary remains contained. |
| C-015 | Failure evidence vs rollback/recovery authority | open | failure, rollback, recovery, diagnostics | BP-010, BP-011, BP-012, BP-013 | DG-002, DG-008 | Failure evidence remains separate from retry, rollback, restore, and recovery permission. | Failure visibility cannot authorize recovery routes. |
| C-016 | Command/search access vs authorization bypass | open | command/search, retrieval, mutation, recovery | BP-002, BP-003, BP-004, BP-005, BP-011 | DG-001, DG-002, DG-003, DG-008 | Discover, navigate, preview, inspect, request, queue, and execute remain separated. | Command/search remains blocked until inherited authority gates are satisfied. |
| C-017 | Vocabulary stabilization vs canon drift | open | vocabulary, support, diagnostics, source-of-truth | BP-014, BP-016, BP-017 | DG-006, DG-009, DG-010 | Vocabulary lanes and containment rules remain active. | Stabilized vocabulary is not product copy unless separately authorized. |

## 8. Blocked-Promotion Register

| ID | Blocked item | Reason blocked | Dependencies before reconsideration | Current status | Reauthorization gate | Risk if promoted early |
| --- | --- | --- | --- | --- | --- | --- |
| BP-001 | Workflow-state canon | Provisional families are not final workflow law. | DG-007, DG-006, DG-001, DG-002, DG-003 | canonization-prohibited | Orchestrator approval after closure gates. | Transitional GUI and pressure families become workflow architecture. |
| BP-002 | Command/search implementation | Command/search can bypass authority boundaries. | DG-001, DG-002, DG-003, DG-006, DG-008 | implementation-prohibited | Explicit command/search re-entry pass. | Discovery becomes authorization and execution. |
| BP-003 | Mutation-capable command routes | Mutation routes require blast-radius and authority inheritance. | DG-001, DG-008, DG-007 | implementation-prohibited | Mutation-boundary and command/search gates satisfied. | Mutation occurs through compressed or hidden authority. |
| BP-004 | Structural command/search inheritance | Structural identity, retrieval, and topology remain unstable. | DG-003, DG-004, DG-005, DG-006, DG-008 | implementation-prohibited | Structural re-entry authorization. | Structural pressure becomes commandable object architecture. |
| BP-005 | Retrieval-linked execution | Retrieval is not identity, persistence, or action authority. | DG-003, DG-006, DG-008 | implementation-prohibited | Retrieval execution gate explicitly reauthorized. | Retrieved material becomes executable target. |
| BP-006 | Structural retrieval authorization | Retrieval legitimacy and identity pressure remain unresolved. | DG-003, DG-004, DG-005, DG-006 | implementation-prohibited | Structural retrieval authorization artifact. | Retrieval becomes persistence and Story Unit pressure. |
| BP-007 | Story Unit persistence | Story Unit pressure is not persistence authorization. | DG-004, DG-005, DG-006 | implementation-prohibited | Dedicated Story Unit persistence authorization. | Narrative grouping becomes durable object identity. |
| BP-008 | Topology architecture | Topology remains pressure-only. | DG-005, DG-004, DG-006 | implementation-prohibited | Dedicated topology authorization. | Relationships become graph architecture by exposure. |
| BP-009 | Structural canon | Structure/Organization remains provisional. | DG-004, DG-005, DG-006, DG-007 | canonization-prohibited | Structural canon artifact. | Recomputed/grouped structure becomes product law. |
| BP-010 | Recovery execution | Restore/reopen/recovery authority remains unresolved. | DG-002, DG-006, DG-008 | implementation-prohibited | Recovery execution authorization. | Recovery actions overwrite or resume authority incorrectly. |
| BP-011 | Recovery-linked command routes | Recovery plus command/search is a bypass vector. | DG-002, DG-008, DG-006 | implementation-prohibited | Recovery route re-entry pass. | Diagnostics/failure visibility becomes recovery routing. |
| BP-012 | Diagnostics expansion | Audience and evidence boundaries remain unstable. | DG-002, DG-006, DG-010 | implementation-prohibited | Diagnostics audience and evidence grouping closure. | Diagnostics become ordinary workflow tooling. |
| BP-013 | Recovery diagnostics as ordinary workflow | Recovery diagnostics is exceptional only. | DG-002, DG-010 | canonization-prohibited | Recovery diagnostics closure plus orchestrator approval. | Recovery exceptions normalize into product workflow. |
| BP-014 | Provisional vocabulary as product copy | Vocabulary lanes are not final labels. | DG-006, DG-009 | canonization-prohibited | Product-copy authorization after vocabulary containment. | Governance terms become product canon. |
| BP-015 | Current GUI as final workflow architecture | GUI is transitional evidence only. | DG-007, DG-009 | canonization-prohibited | Workflow-state canon and GUI reconstruction authorization. | Existing placement becomes accidental architecture. |
| BP-016 | Roadmap rewrite | Closure gates and registers are not yet accepted. | DG-009, DG-007, DG-006, DG-010 | blocked | Orchestrator authorizes rewrite readiness. | Roadmap absorbs unresolved contradictions. |
| BP-017 | Implementation sequencing | Eligibility language exists, but gates remain open. | DG-008, DG-009, DG-007 | blocked | Implementation readiness planning authorization. | Implementation starts before authority model is stable. |

## 9. Dependency-Gate Register

| ID | Gate description | Blocks what | Depends on what | Current status | Evidence required to move status |
| --- | --- | --- | --- | --- | --- |
| DG-001 | Mutation-boundary and blast-radius gate | BP-003, BP-017 | Selection scope, generation scope, rewrite/apply boundaries, batch scope | partially reconstructed | Explicit transition rules and authority-family updates. |
| DG-002 | Recovery-linked route gate | BP-010, BP-011, BP-013 | Restore/reopen detail, recovery diagnostics, rollback/failure, support/recovery exception framing | blocked | Recovery entry/exit, evidence grouping, and authority resumption separation. |
| DG-003 | Structural retrieval gate | BP-005, BP-006, BP-004 | Retrieval governance, grouped retrieval, invalidity, source-of-truth vocabulary | blocked | Retrieval remains non-authorizing or receives explicit authorization. |
| DG-004 | Story Unit persistence gate | BP-007, BP-009 | Structural identity, continuity, source-of-truth, topology, mutation governance | blocked | Dedicated persistence decision artifact. |
| DG-005 | Topology containment gate | BP-008, BP-004 | Relationship pressure, traversal, graph identity, structural retrieval | partially reconstructed | Topology remains pressure-only or receives explicit architecture authorization. |
| DG-006 | Source-of-truth and vocabulary gate | BP-014, BP-016, BP-017 | Source-of-truth vocabulary, condition language, recovery language, retrieval invalidity language | partially reconstructed | Vocabulary containment plus product-copy non-authorization explicitly retained. |
| DG-007 | Workflow-state canon gate | BP-001, BP-015, BP-017 | Workflow family inventory, authority questions, entry/exit, mutation, recovery, retrieval, vocabulary | blocked | Candidate states have authority/visibility/mutation/vocabulary answers. |
| DG-008 | Implementation sequencing gate | BP-017, BP-002, BP-003, BP-010 | BP register, DG register, authority families, closure gates, safe-maintenance hardening | blocked | Eligibility register marks a lane conditionally reopenable and orchestrator approves. |
| DG-009 | Roadmap rewrite gate | BP-016 | Closure mechanics, contradiction register, blocked promotions, dependency queue, safe-maintenance lanes | blocked | Closure gates accepted and unresolved promotions stay active. |
| DG-010 | Safe-maintenance gate | SM-001 through SM-008 | Authority-impact notes, visibility/vocabulary/mutation/recovery checks | partially reconstructed | Safe-maintenance lane hardening defines required checklist. |

## 10. Authority-Family Register

| ID | Authority family | Description | Current state | Blocked promotions | Related contradictions | Reauthorization considerations |
| --- | --- | --- | --- | --- | --- | --- |
| AF-001 | Advisory authority | Suggestions, critique, review, interpretation. | containment active | BP-001, BP-003 | C-003 | Cannot authorize rewrite/apply or mutation. |
| AF-002 | Mutation authority | Generation, rewrite/apply, restore/recovery mutation, structural mutation. | unstable | BP-003, BP-017 | C-005, C-006 | Requires mutation-boundary and blast-radius gates. |
| AF-003 | Mutation-boundary authority | Transition governor for mutation scope and blast radius. | partially reconstructed | BP-003, BP-017 | C-005, C-006 | Must remain distinct from mutation execution. |
| AF-004 | Inspection / verification authority | Evidence and proof without repair permission. | containment active | BP-010, BP-011 | C-004 | Verification remains evidence-only. |
| AF-005 | Recovery authority | Restore, reopen, recover, retry, rollback, rehydrate, resume authority. | unstable | BP-010, BP-011 | C-007, C-008, C-015 | Requires recovery route and source-of-truth gates. |
| AF-006 | Recovery diagnostics authority | Investigation/evidence for recovery exception contexts. | partially reconstructed | BP-012, BP-013 | C-002, C-015, C-017 | Cannot inherit recovery permission. |
| AF-007 | Diagnostics evidence authority | Logs/traces/evidence for investigation. | partially reconstructed | BP-012 | C-002, C-015 | Needs diagnostics evidence grouping. |
| AF-008 | Support truth authority | Bounded explanation of support/runtime conditions. | partially reconstructed | BP-013, BP-014 | C-002, C-017 | Must not leak diagnostics or recovery authority. |
| AF-009 | Runtime truth authority | Runtime state truth without readiness inference. | containment active | BP-014, BP-017 | C-017 | Must not become operational readiness. |
| AF-010 | Transparency truth authority | Visibility/transparency without permission. | containment active | BP-014 | C-002 | Must not become authorization. |
| AF-011 | Source-of-truth authority | Current/accepted/authoritative/canonical state. | unstable | BP-014, BP-016, BP-017 | C-007, C-008, C-009, C-012 | Requires vocabulary and recovery boundaries. |
| AF-012 | Continuity authority | Narrative/structural/recovery continuity pressure. | partially reconstructed | BP-007, BP-009 | C-009, C-014 | Cannot imply persistence. |
| AF-013 | Structural authority | Structure, hierarchy, grouping, Story Unit pressure. | unstable | BP-006, BP-007, BP-009 | C-010, C-014 | Requires Story Unit and topology decisions. |
| AF-014 | Retrieval authority | Retrieval visibility, invalidity, grouped retrieval. | unstable | BP-005, BP-006 | C-012, C-013 | Cannot imply persistence or execution. |
| AF-015 | Batch authority | Multi-selection, grouped scope, batch mutation/recovery pressure. | unstable | BP-003, BP-005 | C-005, C-013 | Requires batch blast-radius and failure semantics. |
| AF-016 | Command/search inheritance authority | Discover, navigate, inspect, request, queue, execute inheritance. | blocked | BP-002, BP-003, BP-004, BP-011 | C-016 | No self-authorization; depends on inherited states. |
| AF-017 | Export/output authority | Output/finality authority class. | exploratory | BP-017 | C-017 | Needs later authority-class treatment before implementation planning. |

## 11. Governance-Domain And Pressure-Field Registers

Governance domains:

| ID | Domain | Current status | Affected registers | Risks | Next likely control need |
| --- | --- | --- | --- | --- | --- |
| GD-001 | Semantic governance | partially reconstructed | C, VC, AF, BP | Vocabulary becomes canon. | Register updates by ID. |
| GD-002 | Workflow-state governance | blocked | BP, DG, AF | Provisional families become canon. | Workflow-state gate closure. |
| GD-003 | Recovery governance | unstable | C, BP, DG, AF | Recovery visibility becomes permission. | Recovery entry/exit and evidence grouping. |
| GD-004 | Retrieval governance | unstable | C, BP, DG, AF | Retrieval becomes identity/execution. | Retrieval gate closure. |
| GD-005 | Diagnostics governance | partially reconstructed | C, BP, VC, AF | Diagnostics become ordinary workflow. | Diagnostics evidence grouping. |
| GD-006 | Vocabulary governance | partially reconstructed | C, BP, VC, DG | Terms become product copy. | Vocabulary containment enforcement. |
| GD-007 | Continuity governance | partially reconstructed | C, AF, BP | Continuity implies persistence. | Source-of-truth gate refinement. |
| GD-008 | Structural governance | unstable | C, BP, DG, AF | Structure implies Story Units. | Story Unit and structural retrieval gates. |
| GD-009 | Topology containment | partially reconstructed | C, BP, DG, PF | Relationship visibility implies graph identity. | Topology-aware mutation/recovery later. |
| GD-010 | Command/search governance | blocked | C, BP, DG, AF | Search/command bypass. | Re-entry preconditions only. |
| GD-011 | Implementation eligibility governance | exploratory | IE, BP, DG, SM | Maintenance and implementation blur. | Safe-maintenance lane hardening. |

Pressure fields:

| ID | Pressure field | Current status | Affected registers | Risks | Next likely control need |
| --- | --- | --- | --- | --- | --- |
| PF-001 | Visibility legitimacy pressure | containment active | C-002, VC, SM | Exposure becomes legitimacy. | Visibility check in safe-maintenance lanes. |
| PF-002 | Adjacency authority pressure | containment active | C-002, C-007, C-008 | Nearby controls transfer authority. | Recovery/diagnostics placement rules. |
| PF-003 | Repetition normalization pressure | containment active | C-017, VC | Repeated terms become canon. | Vocabulary containment updates by ID. |
| PF-004 | Persistence pressure | unstable | C-009, C-010, C-012 | Continuity/retrieval/structure imply persistence. | Story Unit and source-of-truth gates. |
| PF-005 | Topology pressure | partially reconstructed | C-011, GD-009 | Relationships become graph architecture. | Topology containment remains active. |
| PF-006 | Retrieval identity pressure | unstable | C-012, C-013 | Retrieval implies identity or object sets. | Retrieval gate. |
| PF-007 | Recovery legitimacy pressure | unstable | C-007, C-008, C-015 | Recovery evidence implies permission. | Recovery evidence grouping. |
| PF-008 | Vocabulary canon drift | open | C-017, VC | Provisional terms become product law. | Vocabulary containment register. |
| PF-009 | Batch amplification pressure | unstable | C-005, C-013 | Grouped context becomes grouped execution. | Batch authority gate later. |
| PF-010 | Source-of-truth pressure | unstable | C-007, C-008, C-009, C-012 | Current/accepted/restored become authority. | Source-of-truth vocabulary gate. |
| PF-011 | Command/search bypass pressure | open | C-016, BP-002, DG-008 | Access becomes authorization. | Command/search re-entry preconditions. |

## 12. Safe-Maintenance Lane Register

| ID | Lane | Allowed scope | Prohibited drift | Required authority-impact note | Required checks | Current status |
| --- | --- | --- | --- | --- | --- | --- |
| SM-001 | Docs-only governance updates | Audits, tracker, registers, non-authorizing plans. | Roadmap rewrite, product copy, canonization. | State affected IDs and non-authorization. | Vocabulary, blocked-promotion, dependency gates. | maintenance-safe |
| SM-002 | Tests that do not alter authority | Existing behavior coverage and regressions. | New authority, visibility, recovery routes, command/search. | Explain tested behavior is existing. | Visibility, mutation, recovery, command/search. | maintenance-safe |
| SM-003 | Bug fixes without authority drift | Crashes, broken flows, contract preservation. | New workflow legitimacy or expanded authority. | Explain preserved runtime contract. | Visibility, vocabulary, mutation, recovery. | maintenance-safe |
| SM-004 | Crash/startup fixes | Stability and launch safety. | Readiness claims, workflow-state canon. | Explain no readiness/authority expansion. | Runtime truth vs readiness. | maintenance-safe |
| SM-005 | Export safety | Existing export integrity and failure handling. | Export as workflow-state canon or source-of-truth. | Explain output authority unchanged. | Source-of-truth and vocabulary. | maintenance-safe |
| SM-006 | Logging/diagnostics internal only | Internal logging, developer/test diagnostics. | User-visible diagnostics expansion. | Explain audience containment. | Diagnostics exposure and vocabulary. | maintenance-safe |
| SM-007 | Layout reset/fallback safety | Restore stable layout defaults and fallback behavior. | GUI redesign or workflow canon. | Explain no authority/placement promotion. | Visibility, adjacency, workflow-state. | maintenance-safe |
| SM-008 | Support truth corrections | Clarify bounded support/runtime conditions. | Recovery permission, diagnostics leakage, readiness inference. | Explain support truth and authority boundaries. | Support, diagnostics, recovery, vocabulary. | maintenance-safe |

## 13. Implementation-Eligibility Register

| ID | Eligibility class | Current meaning | Current examples | Reopen condition |
| --- | --- | --- | --- | --- |
| IE-001 | Prohibited | Implementation must not proceed. | Command/search, recovery execution, topology, Story Unit persistence, structural retrieval. | Explicit blocked-promotion reauthorization later. |
| IE-002 | Maintenance-safe only | Narrow maintenance allowed with authority-impact checks. | Docs, tests, crash fixes, existing-contract bug fixes. | Safe-maintenance lane remains satisfied. |
| IE-003 | Conditionally reopenable later | May be reconsidered after gates close. | Workflow-state canon, implementation sequencing, roadmap rewrite. | DG statuses support reconsideration plus orchestrator approval. |
| IE-004 | Not yet evaluated | No eligibility classification yet. | Future export/output authority detail, topology-aware recovery detail. | Dedicated reconstruction pass. |
| IE-005 | Stabilization candidate | May become stable for planning, not implementation. | Register formalization, vocabulary containment, recovery diagnostics boundaries. | Registers updated and contradictions contained for current arc. |

This register does not reopen implementation. It defines future control language for eligibility.

## 14. Reauthorization Logic

No blocked promotion reopens implicitly.

Reauthorization requires:

- Required dependency gates are `stabilized for planning` or `closed for current arc`.
- Related contradictions are `contained`, `stabilized for planning`, `blocked until future arc`, or `closed for current arc`.
- Vocabulary containment IDs are updated and product-copy promotion remains separate.
- Authority-family IDs are updated and prohibited inheritance is not violated.
- Safe-maintenance review confirms the change is not being smuggled through a maintenance lane.
- Evidence is recorded in a named artifact and linked from the Pass 40/Pass 43 control system.
- The orchestrator explicitly authorizes reentry later.

Blocked-promotion class requirements:

- Workflow-state canon requires DG-007, DG-006, DG-009, and C-001/C-017 containment.
- Command/search implementation requires DG-001, DG-002, DG-003, DG-008, and C-016 containment.
- Structural retrieval requires DG-003, DG-004, DG-005, DG-006, and C-012/C-013 containment.
- Recovery execution requires DG-002, DG-006, DG-008, and C-007/C-008/C-015 containment.
- Diagnostics expansion requires DG-002, DG-006, DG-010, and C-002/C-015/C-017 containment.
- Story Unit persistence requires DG-004, DG-005, DG-006, and C-009/C-010/C-014 containment.
- Topology architecture requires DG-005, DG-004, DG-006, and C-011 containment.
- Roadmap rewrite requires DG-009 plus active blocked-promotion register retention.
- Implementation sequencing requires DG-008 plus orchestrator authorization.

## 15. Closure Mechanics

Closure for the current arc is provisional and control-oriented.

Closure requires:

- Register status updates by ID.
- No silent contradiction burying.
- Blocked promotions remain active unless explicitly reauthorized.
- Safe-maintenance lanes are hardened enough to prevent authority drift.
- Dependency gates are detailed enough to support roadmap rewrite planning.
- `Contained` is not treated as `closed`.
- `Analyzed` is not treated as `stabilized`.
- `Closed for current arc` is not treated as permanent solution or implementation approval.

Candidate closure states:

- `unresolved`: open risk remains and no containment is adequate.
- `contained`: risk is controlled for current planning but not solved.
- `stabilized for planning`: stable enough for planning discussion, not implementation.
- `blocked until future arc`: intentionally out of current arc scope.
- `closed for current arc`: no further current-arc work needed unless later evidence reopens it.

## 16. Future Pass Update Rule

Future reconstruction passes should update affected registers by ID.

At minimum, future passes should identify:

- contradiction IDs affected
- blocked-promotion IDs affected
- dependency-gate IDs affected
- authority-family IDs affected
- vocabulary-containment IDs affected
- safe-maintenance lanes affected

If a pass makes a finding without updating relevant IDs, the finding remains analytical only and should not be treated as a control-state change.

## 17. What Must Not Be Promoted Yet

- workflow-state canon
- command/search implementation
- mutation-capable command routes
- structural command/search inheritance
- retrieval-linked execution
- structural retrieval authorization
- Story Unit implementation or persistence
- topology or graph architecture
- structural canon
- recovery execution
- recovery-linked command routes
- diagnostics expansion
- recovery diagnostics as ordinary workflow
- provisional vocabulary as product copy
- final user-facing labels from Pass 42
- current GUI as final workflow architecture
- roadmap rewrite
- implementation sequencing

## 18. Current Safe Maintenance Lanes

Safe only when authority-impact checks pass:

- docs-only governance updates
- tests that do not alter authority
- bug fixes that preserve existing authority, visibility, vocabulary, and mutation contracts
- crash/startup fixes that do not imply readiness or workflow-state canon
- export safety that does not create source-of-truth claims
- internal logging/diagnostics that do not expand user-visible diagnostics
- layout reset/fallback safety that does not redesign workflow authority
- support truth corrections that do not imply diagnostics, recovery, readiness, or mutation permission

## 19. Current Forbidden Implementation Lanes

- command/search expansion, execution routing, or mutation-capable routes
- structural command/search inheritance
- topology, graph, or traversal architecture
- Story Unit implementation or persistence
- structural retrieval/search systems
- workflow-state canon implementation
- restore/reopen/recovery execution changes based on reconstruction findings
- recovery-linked command routes
- retrieval-linked execution
- batch mutation or batch recovery
- diagnostics expansion or recovery diagnostics normalization
- GUI redesign based on provisional workflow families
- product-copy finalization from provisional vocabulary lanes
- roadmap rewrite before closure gates are satisfied

## 20. Areas Still Too Fragmented

- Register updates are not yet enforced by tooling or review ritual.
- Safe-maintenance lanes are defined but not hardened into a required checklist.
- Vocabulary containment IDs are not yet itemized below lane level.
- Dependency gates do not yet have acceptance evidence templates.
- Implementation eligibility classes exist, but no lane is reopened.
- Roadmap rewrite closure criteria remain dependent on orchestrator acceptance.
- Export/output authority remains less developed than recovery, retrieval, diagnostics, and command/search authority.
- Diagnostics evidence grouping remains deferred.
- Topology-aware mutation and topology-aware recovery remain deferred.

## 21. Questions For Orchestrator

- Should Pass 40 remain the mandatory control artifact, with Pass 43 acting as the formal register schema?
- Must every future reconstruction pass update affected register IDs before its findings count as control-state changes?
- How strict should safe-maintenance authority-impact notes be: short note per pass, or itemized note per touched lane?
- Should Pass 44 harden safe-maintenance lanes before closure gates are stabilized?
- Should Pass 43 be handed to the next orchestrator as the operating model for the remaining reconstruction arc?
- Should export/output authority receive its own formal register pass before roadmap rewrite readiness?
- Should vocabulary-containment items be expanded into individual `VC-###` entries in the next vocabulary-focused pass, or remain lane-level for now?

## 22. Recommended Pass 44

Recommended Pass 44: Safe Maintenance Lane Hardening.

Reasoning:

- Pass 43 defines the register system but safe-maintenance lanes are still too permissive without a required authority-impact checklist.
- Maintenance work can accidentally change visibility, vocabulary, recovery legitimacy, diagnostics exposure, command/search affordance, or workflow authority even when it is not framed as implementation.
- Safe-maintenance hardening should define required notes, examples, prohibited drift, and review checks for each `SM-###` lane before closure-gate stabilization or roadmap rewrite readiness.

Pass 44 should not authorize implementation, roadmap rewrite, workflow-state canon, command/search, topology, Story Unit persistence, structural retrieval, recovery execution, diagnostics expansion, or product copy.
