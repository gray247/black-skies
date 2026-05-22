# Phase 29 Pass 5 Keep / Merge / Hide / Defer / Delete Matrix

Status: Draft disposition matrix
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 5 - Disposition Matrix and Governance Classification

## Purpose

This matrix converts accumulated Phase 29 evidence into explicit governance dispositions.
It does not redesign the GUI, define final workflow policy, or begin Phase 30.

## Matrix Rows

### P29-SURF-005

- classification_id: `P29-SURF-005`
- item_name: current Writing Surface authoring flow
- related_ids: `P29-WFLOW-002`; `P29-BOUND-001`
- current_authority_role: authoring
- current_visibility: primary
- workflow_role: scene and draft authoring in the current runtime Writing Surface
- intelligence_authority_level: low
- mutation_risk: direct
- support_or_dev_overlap: low
- current_problem: authoring is real but competes with adjacent generation, intelligence, and layout machinery
- recommended_disposition: keep
- disposition_reason: this is the core user-facing authoring authority and must survive even if surrounding shell controls are redistributed
- future_visibility_direction: Writing Surface
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/workflow_conflict_register.md:P29-WFLOW-002`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-001`
- confidence: high
- review_status: pending
- notes: Keep does not imply the current shell composition is final.

### P29-CTRL-003+004

- classification_id: `P29-CTRL-003+004`
- item_name: generation trigger and generation-scope controls
- related_ids: `P29-CTRL-003`; `P29-CTRL-004`; `P29-WFLOW-003`; `P29-BOUND-002`
- current_authority_role: authoring-adjacent mutation
- current_visibility: primary
- workflow_role: deliberate generation entry and scope selection
- intelligence_authority_level: medium
- mutation_risk: direct
- support_or_dev_overlap: low
- current_problem: generation entry is valid, but current placement contributes to header overload and duplicated mutation authority
- recommended_disposition: keep
- disposition_reason: generation is a core runtime-backed authoring action, but later policy must narrow where and how it is exposed
- future_visibility_direction: Writing Surface
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/workflow_conflict_register.md:P29-WFLOW-003`; `app/renderer/components/WorkspaceHeader.tsx:127`; `docs/specs/generation_scope.md:17`
- confidence: high
- review_status: pending
- notes: Keep does not mean the current Workspace Header placement is final.

### P29-SURF-002

- classification_id: `P29-SURF-002`
- item_name: Workspace Header mixed action surface
- related_ids: `P29-BOUND-002`; `P29-CTRL-003`; `P29-CTRL-005`; `P29-CTRL-006`; `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`
- current_authority_role: mixed orchestration shell
- current_visibility: primary
- workflow_role: concentrates generation, critique, export, snapshot, status, and companion entry points
- intelligence_authority_level: medium
- mutation_risk: high_risk
- support_or_dev_overlap: medium
- current_problem: strongest mixed-authority surface in the current GUI
- recommended_disposition: merge
- disposition_reason: the current header should not survive as a single authority bucket; later workflow policy must merge its functions into narrower authoring, support, and advanced classes
- future_visibility_direction: validate_first
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/workspace_header_density_review.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-002`
- confidence: high
- review_status: pending
- notes: This is a governance decision against concentration, not a layout prescription.

### P29-SURF-006

- classification_id: `P29-SURF-006`
- item_name: Story Insights / Analytics Dashboard
- related_ids: `P29-INTEL-001`; `P29-WFLOW-007`; `P29-BOUND-003`
- current_authority_role: analytics intelligence surface
- current_visibility: secondary
- workflow_role: exposes pacing, emotion, and summary metrics
- intelligence_authority_level: high
- mutation_risk: none
- support_or_dev_overlap: medium
- current_problem: visible authority exceeds proven usefulness and overlaps docs with future-state expectations
- recommended_disposition: contextualize
- disposition_reason: runtime analytics are real enough to survive, but not as a primary or self-justifying authority surface
- future_visibility_direction: Command Center
- requires_phase30_policy: yes
- requires_phase32_validation: yes
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-001`; `docs/audits/phase29/fake_intelligence_risk_register.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-003`
- confidence: high
- review_status: pending
- notes: If later treated as prescriptive intelligence, stronger qualitative validation is required.

### P29-SURF-012

- classification_id: `P29-SURF-012`
- item_name: Companion Overlay advisory surface
- related_ids: `P29-INTEL-002`; `P29-INTEL-003`; `P29-WFLOW-008`; `P29-BOUND-004`
- current_authority_role: advisory intelligence surface
- current_visibility: secondary
- workflow_role: local analytics, pacing/emotion guidance, and model-queue/status language
- intelligence_authority_level: high
- mutation_risk: indirect
- support_or_dev_overlap: medium
- current_problem: branding and breadth imply stronger AI companionship than the runtime proves
- recommended_disposition: contextualize
- disposition_reason: the runtime surface is more honest than some other intelligence surfaces, but it should not hold primary authority over authoring flow
- future_visibility_direction: contextual
- requires_phase30_policy: yes
- requires_phase32_validation: yes
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-002`; `docs/audits/phase29/intelligence_visibility_pressure_review.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-004`
- confidence: high
- review_status: pending
- notes: If model-backed guidance remains visible, later qualitative validation must prove trustworthiness.

### P29-SURF-008

- classification_id: `P29-SURF-008`
- item_name: Relationship Graph
- related_ids: `P29-INTEL-004`; `P29-WFLOW-009`; `P29-BOUND-006`
- current_authority_role: relationship-analysis surface
- current_visibility: advanced
- workflow_role: visual relationship analysis through analytics bridge
- intelligence_authority_level: high
- mutation_risk: none
- support_or_dev_overlap: medium
- current_problem: carries strong pattern-authority pressure despite only partial runtime support
- recommended_disposition: advanced_only
- disposition_reason: the graph may survive as a limited advanced surface, but current evidence does not justify wider authority
- future_visibility_direction: advanced/settings
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-004`; `docs/audits/phase29/fake_intelligence_risk_register.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-006`
- confidence: high
- review_status: pending
- notes: Advanced-only is a governance ceiling, not a promise of long-term retention.

### P29-SURF-010

- classification_id: `P29-SURF-010`
- item_name: Critique modal with rewrite/apply flow
- related_ids: `P29-CTRL-005`; `P29-INTEL-005`; `P29-INTEL-006`; `P29-WFLOW-004`; `P29-BOUND-005`
- current_authority_role: critique and rewrite mutation surface
- current_visibility: secondary
- workflow_role: critique review, rewrite generation, and optional apply action
- intelligence_authority_level: high
- mutation_risk: high_risk
- support_or_dev_overlap: low
- current_problem: interpretation and mutation authority are coupled before qualitative usefulness is proven
- recommended_disposition: validate_first
- disposition_reason: this surface survives only under explicit trust and usefulness review; it must not inherit automatic authority from being runtime-backed
- future_visibility_direction: validate_first
- requires_phase30_policy: yes
- requires_phase32_validation: yes
- evidence: `docs/audits/phase29/mutation_authority_review.md`; `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-006`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-005`
- confidence: high
- review_status: pending
- notes: Highest combined trust and mutation risk in the current stack.

### P29-SURF-013

- classification_id: `P29-SURF-013`
- item_name: Snapshots and Verification Panel
- related_ids: `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`; `P29-CTRL-011`; `P29-WFLOW-010`; `P29-BOUND-007`
- current_authority_role: persistence and safety tooling
- current_visibility: secondary
- workflow_role: snapshot browsing, verification, backup, and restore
- intelligence_authority_level: low
- mutation_risk: high_risk
- support_or_dev_overlap: high
- current_problem: high-impact persistence and restore actions sit too close to normal authoring interpretation
- recommended_disposition: support_only
- disposition_reason: the surface is legitimate and runtime-backed, but it belongs to support/safety authority rather than ordinary writing flow
- future_visibility_direction: support/recovery
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/persistence_and_recovery_surface_review.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-007`
- confidence: high
- review_status: pending
- notes: Support-only does not mean hidden during recovery needs.

### P29-CTRL-010+011

- classification_id: `P29-CTRL-010+011`
- item_name: open snapshots, backup, and restore controls
- related_ids: `P29-CTRL-010`; `P29-CTRL-011`; `P29-SURF-013`; `P29-WFLOW-010`; `P29-BOUND-007`
- current_authority_role: persistence mutation controls
- current_visibility: header plus support panel
- workflow_role: expose snapshot panel and execute backup or restore actions
- intelligence_authority_level: low
- mutation_risk: high_risk
- support_or_dev_overlap: medium
- current_problem: restore-capable controls can be read as ordinary workflow utilities instead of consequential safety operations
- recommended_disposition: support_only
- disposition_reason: explicit support-only classification keeps restore authority out of normal authoring semantics
- future_visibility_direction: support/recovery
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/mutation_authority_review.md`; `docs/audits/phase29/persistence_and_recovery_surface_review.md`
- confidence: high
- review_status: pending
- notes: Applies especially to restore and reveal-restored-copy actions.

### P29-SURF-014

- classification_id: `P29-SURF-014`
- item_name: recovery, service health, offline, and toast surfaces
- related_ids: `P29-INTEL-009`; `P29-CTRL-018`; `P29-WFLOW-011`; `P29-BOUND-008`
- current_authority_role: support and recovery status
- current_visibility: contextual
- workflow_role: retry, offline state, recovery notices, and notifications
- intelligence_authority_level: low
- mutation_risk: indirect
- support_or_dev_overlap: high
- current_problem: real support UX currently shares language and status concepts with diagnostics and test seams
- recommended_disposition: support_only
- disposition_reason: these surfaces are valid but should be governed as support and recovery authority, not as intelligence or ordinary authoring controls
- future_visibility_direction: support/recovery
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/support_vs_dev_boundary_review.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-008`
- confidence: high
- review_status: pending
- notes: Later policy must preserve honest support visibility while reducing diagnostics leakage.

### P29-DEV-003

- classification_id: `P29-DEV-003`
- item_name: `__testInsights` state injection bridge
- related_ids: `P29-DEV-006`; `P29-WFLOW-013`; `P29-BOUND-009`
- current_authority_role: dev/test harness bridge
- current_visibility: hidden
- workflow_role: manipulate service state and scene-selection context during tests
- intelligence_authority_level: low
- mutation_risk: indirect
- support_or_dev_overlap: high
- current_problem: can alter visible runtime state and therefore must not be mistaken for product diagnostics
- recommended_disposition: dev_only
- disposition_reason: direct test-only bridge with high leakage risk
- future_visibility_direction: dev_only
- requires_phase30_policy: no
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-003`; `docs/audits/phase29/support_vs_dev_boundary_review.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-009`
- confidence: high
- review_status: pending
- notes: Dev-only is firm unless runtime evidence later proves legitimate operator use, which is not currently shown.

### P29-DEV-008

- classification_id: `P29-DEV-008`
- item_name: test UI sandbox
- related_ids: `P29-DEV-004`; `P29-BOUND-009`
- current_authority_role: dev/test sandbox
- current_visibility: hidden or unknown
- workflow_role: renderer test sandbox utility
- intelligence_authority_level: none
- mutation_risk: indirect
- support_or_dev_overlap: medium
- current_problem: bounded test utility with weak runtime-usage proof
- recommended_disposition: dev_only
- disposition_reason: even with low-confidence usage evidence, nothing currently supports product-visible authority
- future_visibility_direction: dev_only
- requires_phase30_policy: no
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-008`; `docs/audits/phase29/support_vs_dev_boundary_review.md`
- confidence: medium
- review_status: pending
- notes: If later evidence shows broader usage, correction-block rollback rules should update this classification explicitly.

### P29-SURF-015

- classification_id: `P29-SURF-015`
- item_name: Split Command Workspace
- related_ids: `P29-INTEL-007`; `P29-WFLOW-012`; `P29-BOUND-010`
- current_authority_role: experimental orchestration shell
- current_visibility: advanced experimental
- workflow_role: command-center shell, navigation, and deterministic experimental panels
- intelligence_authority_level: medium
- mutation_risk: indirect
- support_or_dev_overlap: medium
- current_problem: terminology and shell framing create roadmap authority pressure beyond stable runtime proof
- recommended_disposition: defer
- disposition_reason: the shell may remain as an experimental probe, but it should not govern current product direction or stable workflow authority
- future_visibility_direction: hidden
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/experimental_workflow_pressure_review.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-010`
- confidence: high
- review_status: pending
- notes: Defer is a governance brake, not a deletion order.

### P29-CTRL-017

- classification_id: `P29-CTRL-017`
- item_name: command-like actions and registry entry surface
- related_ids: `P29-INTEL-008`; `P29-WFLOW-013`; `P29-BOUND-011`
- current_authority_role: advanced orchestration access
- current_visibility: mixed direct UI and hidden metadata
- workflow_role: alternate entry points for generation, critique, export, snapshots, and project actions
- intelligence_authority_level: medium
- mutation_risk: indirect
- support_or_dev_overlap: low
- current_problem: command surface overlaps direct controls and can imply more orchestration maturity than current stable UX proves
- recommended_disposition: advanced_only
- disposition_reason: command access may survive, but should not define primary workflow authority during the correction block
- future_visibility_direction: advanced/settings
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/workflow_conflict_register.md:P29-WFLOW-013`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-011`; `app/renderer/commands/commandRegistry.ts:39`
- confidence: high
- review_status: pending
- notes: This classification covers visible command-style access, not just hidden metadata.

### P29-INTEL-008

- classification_id: `P29-INTEL-008`
- item_name: command registry model-route and risk metadata
- related_ids: `P29-CTRL-017`; `P29-BOUND-011`
- current_authority_role: internal routing metadata
- current_visibility: hidden
- workflow_role: stores route, zone, and risk metadata for commands
- intelligence_authority_level: medium
- mutation_risk: indirect
- support_or_dev_overlap: low
- current_problem: visible exposure would overstate orchestration and model-routing maturity
- recommended_disposition: background
- disposition_reason: the metadata is useful as internal infrastructure but not justified as a user-visible authority surface
- future_visibility_direction: background automation
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-008`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-011`
- confidence: high
- review_status: pending
- notes: Background here means internal declaration or later automation, not user-facing dashboard status.

### P29-SURF-003

- classification_id: `P29-SURF-003`
- item_name: docking and layout machinery
- related_ids: `P29-WFLOW-006`; `P29-BOUND-012`
- current_authority_role: shell support machinery
- current_visibility: secondary
- workflow_role: pane management, layout persistence, and docking flexibility
- intelligence_authority_level: none
- mutation_risk: direct
- support_or_dev_overlap: medium
- current_problem: layout machinery competes with authoring attention and inflates shell complexity when overexposed
- recommended_disposition: advanced_only
- disposition_reason: the capability is real, but broad visible emphasis should be capped as shell/settings authority
- future_visibility_direction: advanced/settings
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/experimental_workflow_pressure_review.md`; `docs/audits/phase29/authority_boundary_matrix.md:P29-BOUND-012`
- confidence: high
- review_status: pending
- notes: This is a governance limit on visible prominence, not a removal of docking capability.

### P29-INTEL-010

- classification_id: `P29-INTEL-010`
- item_name: budget indicator and budget meter
- related_ids: `P29-SURF-002`; `P29-INTEL-009`
- current_authority_role: transparent status indicator
- current_visibility: contextual
- workflow_role: show budget and cost status without autonomous decision-making
- intelligence_authority_level: low
- mutation_risk: none
- support_or_dev_overlap: medium
- current_problem: when grouped with critique, companion, and service state, the indicator can read as intelligence authority instead of narrow transparency
- recommended_disposition: contextualize
- disposition_reason: the signal is useful, but should remain a narrow contextual status rather than a prominent workflow driver
- future_visibility_direction: contextual
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-010`; `docs/audits/phase29/support_vs_dev_boundary_review.md`
- confidence: high
- review_status: pending
- notes: This is a transparency signal, not proof of smart routing authority.

### P29-CTRL-006

- classification_id: `P29-CTRL-006`
- item_name: export format and export action
- related_ids: `P29-WFLOW-013`; `P29-SURF-002`
- current_authority_role: artifact-output control
- current_visibility: primary
- workflow_role: choose export format and trigger manuscript export
- intelligence_authority_level: none
- mutation_risk: indirect
- support_or_dev_overlap: low
- current_problem: output-artifact control is currently grouped with generation, critique, and snapshot authority despite separate proof and workflow concerns
- recommended_disposition: advanced_only
- disposition_reason: export is real and important, but current correction-block evidence does not justify treating it as a primary authoring control
- future_visibility_direction: advanced/settings
- requires_phase30_policy: yes
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-006`; `docs/audits/phase29/workspace_header_density_review.md`
- confidence: medium
- review_status: pending
- notes: This is governance containment, not an export removal decision.

### P29-DEV-005

- classification_id: `P29-DEV-005`
- item_name: diagnostics bridge and diagnostic specs
- related_ids: `P29-SURF-014`; `P29-BOUND-009`
- current_authority_role: mixed diagnostics and support seam
- current_visibility: hidden bridge plus test evidence
- workflow_role: diagnostics folder access, harness readiness, and recovery-related diagnostic checks
- intelligence_authority_level: none
- mutation_risk: indirect
- support_or_dev_overlap: high
- current_problem: product-support implications and test-diagnostics scaffolding are not yet cleanly separated
- recommended_disposition: validate_first
- disposition_reason: the seam is too mixed to classify as pure product support or pure dev-only without later targeted review
- future_visibility_direction: validate_first
- requires_phase30_policy: no
- requires_phase32_validation: no
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-005`; `docs/audits/phase29/support_vs_dev_boundary_review.md`
- confidence: medium
- review_status: pending
- notes: This is a correction-block carry-forward item for further containment review.
