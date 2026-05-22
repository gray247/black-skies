# Phase 29 Pass 1 Tool, Button, and Control Inventory

Status: Draft inventory
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 1 - Surface Inventory

## Purpose

This artifact catalogs visible controls, buttons, toggles, command-like actions, and IPC-backed actions found during Phase 29 Pass 1.
It is inventory evidence only.
It does not make final product disposition decisions.

Review status for all rows is `pending`.

## Inventory Rows

### P29-CTRL-001

- classification_id: `P29-CTRL-001`
- surface_or_item: Open Project controls
- type: project control
- source_area: renderer component and project-loader IPC
- file_or_component_path: `app/renderer/components/ProjectHome.tsx`; `app/shared/ipc/projectLoader.ts`
- owner_doc_or_runtime_source: `app/main/projectLoaderIpc.ts`; `app/main/preload.ts`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Project Home and command registry
- workflow_role: opens existing projects through dialog or recent entries
- overlaps_with: `P29-SURF-001`; `P29-CTRL-017`
- recommended_disposition: validate_first
- disposition_reason: Core control, but later workflow mapping should compare dialog, recent, and command-registry entry points.
- evidence: `app/renderer/components/ProjectHome.tsx:1194`; `app/renderer/components/ProjectHome.tsx:961`; `app/shared/ipc/projectLoader.ts:148`; `app/main/preload.ts:1905`; `app/renderer/commands/commandRegistry.ts:39`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: low
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: Nested-open correction is not re-audited in this pass.

### P29-CTRL-002

- classification_id: `P29-CTRL-002`
- surface_or_item: Create Project controls
- type: project creation control
- source_area: renderer component and project-loader IPC
- file_or_component_path: `app/renderer/components/ProjectHome.tsx`; `app/shared/ipc/projectLoader.ts`
- owner_doc_or_runtime_source: `app/main/projectLoaderIpc.ts`; `app/main/preload.ts`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Project Home
- workflow_role: creates fresh project from selected title/path
- overlaps_with: `P29-SURF-001`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed; later passes may need to verify this remains cleanly separated from nested-project risk.
- evidence: `app/renderer/components/ProjectHome.tsx:1231`; `app/renderer/components/ProjectHome.tsx:1258`; `app/shared/ipc/projectLoader.ts:6`; `app/main/projectLoaderIpc.ts:142`; `app/main/preload.ts:1916`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: Pass 1 does not reopen Phase 27 remediation.

### P29-CTRL-003

- classification_id: `P29-CTRL-003`
- surface_or_item: Generate Draft control
- type: generation action
- source_area: workspace header and service bridge
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`; `app/shared/ipc/services.ts`
- owner_doc_or_runtime_source: `app/renderer/App.tsx`; `app/main/preload.ts`; `docs/specs/generation_scope.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Workspace Header
- workflow_role: starts generation preflight and draft generation workflow
- overlaps_with: `P29-CTRL-004`; `P29-SURF-011`; `P29-CTRL-017`
- recommended_disposition: validate_first
- disposition_reason: Mutative generation control requires later workflow and risk mapping.
- evidence: `app/renderer/components/WorkspaceHeader.tsx:127`; `app/renderer/components/WorkspaceHeader.tsx:132`; `app/main/preload.ts:1765`; `app/shared/ipc/services.ts:534`; `docs/specs/generation_scope.md:17`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: Inventory only; no authoring behavior changed.

### P29-CTRL-004

- classification_id: `P29-CTRL-004`
- surface_or_item: Generation Scope toggle
- type: segmented control
- source_area: workspace header
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`
- owner_doc_or_runtime_source: `docs/specs/generation_scope.md`; `app/renderer/App.tsx`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Workspace Header
- workflow_role: selects active-scene or all-scenes generation scope
- overlaps_with: `P29-CTRL-003`; `P29-SURF-011`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed but later workflow pass must verify scope semantics remain understandable.
- evidence: `app/renderer/components/WorkspaceHeader.tsx:137`; `app/renderer/components/WorkspaceHeader.tsx:144`; `app/renderer/components/WorkspaceHeader.tsx:157`; `docs/specs/generation_scope.md:60`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: All-scenes generation is a higher-risk action.

### P29-CTRL-005

- classification_id: `P29-CTRL-005`
- surface_or_item: Run Critique control
- type: critique action
- source_area: workspace header and service bridge
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`; `app/renderer/components/CritiqueModal.tsx`
- owner_doc_or_runtime_source: `docs/specs/editorial_workflow_contract.md`; `app/shared/ipc/services.ts`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Workspace Header and Critique Modal
- workflow_role: runs critique and opens critique review
- overlaps_with: `P29-SURF-010`; `P29-CTRL-017`
- recommended_disposition: validate_first
- disposition_reason: Critique is non-mutative by contract, but modal also contains rewrite controls.
- evidence: `app/renderer/components/WorkspaceHeader.tsx:164`; `app/renderer/components/WorkspaceHeader.tsx:169`; `app/renderer/components/CritiqueModal.tsx:151`; `docs/specs/editorial_workflow_contract.md:36`; `docs/specs/editorial_workflow_contract.md:224`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2 and Pass 3
- review_status: pending
- notes: Intelligence quality is not assessed in this pass.

### P29-CTRL-006

- classification_id: `P29-CTRL-006`
- surface_or_item: Export format and export action
- type: export control
- source_area: workspace header and command registry
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`; `app/renderer/commands/commandRegistry.ts`
- owner_doc_or_runtime_source: `app/renderer/App.tsx`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: partial
- current_visibility: Workspace Header
- workflow_role: selects export format and triggers manuscript export
- overlaps_with: `P29-CTRL-017`
- recommended_disposition: validate_first
- disposition_reason: Runtime controls exist, but Phase 27 proof rules did not claim save/export proof.
- evidence: `app/renderer/components/WorkspaceHeader.tsx:181`; `app/renderer/components/WorkspaceHeader.tsx:228`; `app/renderer/components/WorkspaceHeader.tsx:233`; `app/renderer/commands/commandRegistry.ts:143`
- evidence_quality: direct_runtime_file
- confidence: medium
- risk_level: high
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: Later passes should keep export claims separate from runtime proof.

### P29-CTRL-007

- classification_id: `P29-CTRL-007`
- surface_or_item: Companion overlay toggle and insight actions
- type: overlay toggle and analysis controls
- source_area: workspace header and companion overlay
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`; `app/renderer/components/CompanionOverlay.tsx`
- owner_doc_or_runtime_source: `docs/gui/gui_layouts.md`; `app/renderer/components/CompanionOverlay.tsx`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: partial
- current_visibility: Workspace Header and overlay
- workflow_role: opens companion overlay and runs local/model insight actions
- overlaps_with: `P29-SURF-012`; `P29-SURF-006`; `P29-CTRL-019`
- recommended_disposition: validate_first
- disposition_reason: Needs intelligence audit before any capability claim is accepted.
- evidence: `app/renderer/components/WorkspaceHeader.tsx:116`; `app/renderer/components/WorkspaceHeader.tsx:121`; `app/renderer/components/CompanionOverlay.tsx:770`; `app/renderer/components/CompanionOverlay.tsx:784`; `docs/gui/gui_layouts.md:42`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 3
- review_status: pending
- notes: No-fantasy-promotion rule applies.

### P29-CTRL-008

- classification_id: `P29-CTRL-008`
- surface_or_item: Create Snapshot control
- type: snapshot action
- source_area: workspace header and snapshots service bridge
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`; `app/shared/ipc/services.ts`
- owner_doc_or_runtime_source: `app/main/preload.ts`; `docs/specs/editorial_workflow_contract.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Workspace Header and wizard lock flow
- workflow_role: creates snapshots for project or wizard state
- overlaps_with: `P29-SURF-013`; `P29-CTRL-015`; `P29-CTRL-017`
- recommended_disposition: validate_first
- disposition_reason: Mutates snapshot/history state and needs later survival/risk classification.
- evidence: `app/renderer/components/WorkspaceHeader.tsx:192`; `app/renderer/components/WorkspaceHeader.tsx:197`; `app/main/preload.ts:1809`; `app/shared/ipc/services.ts:556`; `docs/specs/editorial_workflow_contract.md:90`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2 and Pass 5
- review_status: pending
- notes: Snapshot action is not a normal text-authoring control.

### P29-CTRL-009

- classification_id: `P29-CTRL-009`
- surface_or_item: Verify Snapshots control
- type: verification action
- source_area: workspace header and snapshots panel
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`; `app/renderer/components/SnapshotsPanel.tsx`
- owner_doc_or_runtime_source: `app/main/preload.ts`; `app/shared/ipc/services.ts`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Workspace Header and Snapshots Panel
- workflow_role: runs backup/snapshot verification and opens reports
- overlaps_with: `P29-SURF-013`; `P29-CTRL-010`; `P29-CTRL-011`
- recommended_disposition: validate_first
- disposition_reason: Support/safety control; later pass should classify final visibility.
- evidence: `app/renderer/components/WorkspaceHeader.tsx:202`; `app/renderer/components/WorkspaceHeader.tsx:207`; `app/renderer/components/SnapshotsPanel.tsx:1023`; `app/main/preload.ts:1898`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2 and Pass 5
- review_status: pending
- notes: Verification surface may belong in support or advanced UI rather than primary workflow.

### P29-CTRL-010

- classification_id: `P29-CTRL-010`
- surface_or_item: Open Snapshots Panel control
- type: panel toggle
- source_area: workspace header and command registry
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`; `app/renderer/commands/commandRegistry.ts`
- owner_doc_or_runtime_source: `app/renderer/App.tsx`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Workspace Header
- workflow_role: opens snapshot and verification panel
- overlaps_with: `P29-SURF-013`; `P29-CTRL-017`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed, but later control inventory should decide primary versus advanced placement.
- evidence: `app/renderer/App.tsx:943`; `app/renderer/App.tsx:1777`; `app/renderer/components/WorkspaceHeader.tsx:212`; `app/renderer/components/WorkspaceHeader.tsx:221`; `app/renderer/commands/commandRegistry.ts:156`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 5
- review_status: pending
- notes: Related to multiple persistence and restore controls.

### P29-CTRL-011

- classification_id: `P29-CTRL-011`
- surface_or_item: Backup and restore controls
- type: backup/restore actions
- source_area: snapshots panel and service bridge
- file_or_component_path: `app/renderer/components/SnapshotsPanel.tsx`; `app/shared/ipc/services.ts`
- owner_doc_or_runtime_source: `app/main/preload.ts`; `docs/specs/editorial_workflow_contract.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Snapshots Panel
- workflow_role: create backup, restore backup, restore ZIP copy, reveal restored folders
- overlaps_with: `P29-SURF-013`; `P29-CTRL-018`
- recommended_disposition: validate_first
- disposition_reason: High-risk persistence controls need later visibility and safety classification.
- evidence: `app/renderer/components/SnapshotsPanel.tsx:1053`; `app/renderer/components/SnapshotsPanel.tsx:1083`; `app/renderer/components/SnapshotsPanel.tsx:1337`; `app/main/preload.ts:1856`; `app/main/preload.ts:1863`; `docs/specs/editorial_workflow_contract.md:252`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 5
- review_status: pending
- notes: Later pass should verify these are not confused with normal save/export.

### P29-CTRL-012

- classification_id: `P29-CTRL-012`
- surface_or_item: Dock pane close, expand, detach, and focus controls
- type: pane controls
- source_area: docking component
- file_or_component_path: `app/renderer/components/docking/DockPaneTile.tsx`
- owner_doc_or_runtime_source: `docs/specs/pane_lifecycle.md`; `docs/specs/layout_persistence.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: dock pane titlebars
- workflow_role: close/hide, expand, float, and focus panes
- overlaps_with: `P29-SURF-003`; `P29-CTRL-013`; `P29-CTRL-014`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed; later pass should classify pane-control density and discoverability.
- evidence: `app/renderer/components/docking/DockPaneTile.tsx:103`; `app/renderer/components/docking/DockPaneTile.tsx:129`; `app/renderer/components/docking/DockPaneTile.tsx:143`; `app/renderer/components/docking/DockPaneTile.tsx:153`; `docs/specs/pane_lifecycle.md:45`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 5
- review_status: pending
- notes: Phase 27 smoke found pane usability concerns; this pass only inventories controls.

### P29-CTRL-013

- classification_id: `P29-CTRL-013`
- surface_or_item: Hidden pane reopen controls
- type: pane recovery controls
- source_area: docking component
- file_or_component_path: `app/renderer/components/docking/DockWorkspace.tsx`
- owner_doc_or_runtime_source: `docs/specs/pane_lifecycle.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: visible when panes are hidden
- workflow_role: reopen hidden dock panes
- overlaps_with: `P29-SURF-003`; `P29-CTRL-012`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed recovery affordance; later pass should review user clarity.
- evidence: `app/renderer/components/docking/DockWorkspace.tsx:1269`; `app/renderer/components/docking/DockWorkspace.tsx:1275`; `docs/specs/pane_lifecycle.md:61`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 5
- review_status: pending
- notes: Related to pane collapse remediation and should remain visible in UX debt.

### P29-CTRL-014

- classification_id: `P29-CTRL-014`
- surface_or_item: Dock preset and reset controls
- type: layout controls
- source_area: docking component and layout IPC
- file_or_component_path: `app/renderer/components/docking/DockWorkspace.tsx`; `app/shared/ipc/layout.ts`
- owner_doc_or_runtime_source: `app/main/layoutIpc.ts`; `docs/specs/layout_persistence.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: dock workspace controls
- workflow_role: apply default layout preset and reset persisted layout
- overlaps_with: `P29-SURF-003`; `P29-CTRL-012`; `P29-CTRL-013`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed; later pass should decide final UX placement and labeling.
- evidence: `app/renderer/components/docking/DockWorkspace.tsx:772`; `app/renderer/components/docking/DockWorkspace.tsx:1158`; `app/renderer/components/docking/DockWorkspace.tsx:1300`; `app/renderer/components/docking/DockWorkspace.tsx:1309`; `app/shared/ipc/layout.ts:5`; `docs/specs/layout_persistence.md:33`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 5
- review_status: pending
- notes: Reset can affect layout state, not project content.

### P29-CTRL-015

- classification_id: `P29-CTRL-015`
- surface_or_item: Wizard step navigation, lock, reset, and build outline controls
- type: planning workflow controls
- source_area: wizard panel
- file_or_component_path: `app/renderer/components/WizardPanel.tsx`
- owner_doc_or_runtime_source: `docs/specs/workflow_spine.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Outline / Wizard pane
- workflow_role: navigate planning steps, lock steps with snapshots, build outline
- overlaps_with: `P29-SURF-004`; `P29-CTRL-008`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed but may overlap future Story Unit and command-center workflow.
- evidence: `app/renderer/components/WizardPanel.tsx:764`; `app/renderer/components/WizardPanel.tsx:890`; `app/renderer/components/WizardPanel.tsx:904`; `app/renderer/components/WizardPanel.tsx:923`; `app/renderer/components/WizardPanel.tsx:954`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2 and Phase 30 input
- review_status: pending
- notes: Inventory only; no future outline decision.

### P29-CTRL-016

- classification_id: `P29-CTRL-016`
- surface_or_item: Preflight close and proceed controls
- type: modal confirmation controls
- source_area: preflight modal
- file_or_component_path: `app/renderer/components/PreflightModal.tsx`
- owner_doc_or_runtime_source: `docs/specs/generation_scope.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: Preflight Modal
- workflow_role: cancel or proceed with generation after scope and budget review
- overlaps_with: `P29-SURF-011`; `P29-CTRL-003`; `P29-CTRL-004`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed guard controls; later pass should verify warnings remain accurate.
- evidence: `app/renderer/components/PreflightModal.tsx:105`; `app/renderer/components/PreflightModal.tsx:234`; `app/renderer/components/PreflightModal.tsx:245`; `app/renderer/components/PreflightModal.tsx:130`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: Guard surface for mutative generation.

### P29-CTRL-017

- classification_id: `P29-CTRL-017`
- surface_or_item: Command registry entries
- type: command registry
- source_area: renderer command registry
- file_or_component_path: `app/renderer/commands/commandRegistry.ts`
- owner_doc_or_runtime_source: `app/renderer/commands/commandRegistry.ts`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: partial
- current_visibility: command-like registry exists; direct palette visibility not confirmed in this pass
- workflow_role: declares project, navigation, generation, critique, snapshot, export, and view-state commands
- overlaps_with: `P29-CTRL-001`; `P29-CTRL-003`; `P29-CTRL-005`; `P29-CTRL-006`; `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`
- recommended_disposition: validate_first
- disposition_reason: Registry entries are runtime code, but UI exposure and final command-palette policy need later review.
- evidence: `app/renderer/commands/commandRegistry.ts:37`; `app/renderer/commands/commandRegistry.ts:39`; `app/renderer/commands/commandRegistry.ts:65`; `app/renderer/commands/commandRegistry.ts:91`; `app/renderer/commands/commandRegistry.ts:143`; `app/renderer/commands/commandRegistry.ts:156`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2 and Phase 30 input
- review_status: pending
- notes: Do not infer a final command palette from registry presence.

### P29-CTRL-018

- classification_id: `P29-CTRL-018`
- surface_or_item: Recovery restore, reopen, reload, and diagnostics controls
- type: recovery controls
- source_area: recovery banner and app fallback surfaces
- file_or_component_path: `app/renderer/components/RecoveryBanner.tsx`; `app/renderer/App.tsx`
- owner_doc_or_runtime_source: `app/shared/ipc/diagnostics.ts`; `app/main/preload.ts`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: recovery banner or fallback error state
- workflow_role: restore latest recovery snapshot, reopen project, reload app, view diagnostics
- overlaps_with: `P29-SURF-014`; `P29-DEV-005`
- recommended_disposition: validate_first
- disposition_reason: User-facing recovery controls are high-impact and need later dev/prod and safety review.
- evidence: `app/renderer/components/RecoveryBanner.tsx:58`; `app/renderer/components/RecoveryBanner.tsx:70`; `app/renderer/components/RecoveryBanner.tsx:78`; `app/renderer/App.tsx:3380`; `app/renderer/App.tsx:3393`; `app/main/preload.ts:2133`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 4 and Pass 5
- review_status: pending
- notes: Diagnostics are user-visible support behavior, not proof of recovery repair quality.

### P29-CTRL-019

- classification_id: `P29-CTRL-019`
- surface_or_item: Service retry controls
- type: connectivity controls
- source_area: service health and offline surfaces
- file_or_component_path: `app/renderer/components/ServiceHealthBanner.tsx`; `app/renderer/components/AnalyticsDashboard.tsx`; `app/renderer/components/Corkboard.tsx`; `app/renderer/components/RelationshipGraph.tsx`
- owner_doc_or_runtime_source: `docs/gui/gui_layouts.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: conditional when services are unavailable
- workflow_role: retries service health or analysis requests
- overlaps_with: `P29-SURF-006`; `P29-SURF-007`; `P29-SURF-008`; `P29-SURF-014`; `P29-DEV-006`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed but shared with test health override logic.
- evidence: `app/renderer/components/ServiceHealthBanner.tsx:69`; `app/renderer/components/ServiceHealthBanner.tsx:112`; `app/renderer/components/AnalyticsDashboard.tsx:217`; `app/renderer/components/Corkboard.tsx:108`; `app/renderer/components/RelationshipGraph.tsx:111`; `docs/gui/gui_layouts.md:52`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Later pass should separate real offline behavior from harness events.

### P29-CTRL-020

- classification_id: `P29-CTRL-020`
- surface_or_item: Split Command story navigation scene select controls
- type: experimental navigation controls
- source_area: split-command workspace
- file_or_component_path: `app/renderer/components/workspace/StoryNavigationPanel.tsx`
- owner_doc_or_runtime_source: `app/renderer/components/workspace/SplitCommandWorkspace.tsx`; `app/shared/config/runtime.ts`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: experimental_flagged
- current_visibility: only when Split Command workspace flag is enabled
- workflow_role: selects scenes from story navigation list
- overlaps_with: `P29-SURF-015`; `P29-SURF-004`; `P29-SURF-007`
- recommended_disposition: validate_first
- disposition_reason: Experimental surface exists, but stable GUI policy cannot be inferred from it.
- evidence: `app/renderer/components/workspace/StoryNavigationPanel.tsx:35`; `app/renderer/components/workspace/StoryNavigationPanel.tsx:96`; `app/renderer/components/workspace/StoryNavigationPanel.tsx:99`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:407`; `app/shared/config/runtime.ts:115`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2 and Pass 4
- review_status: pending
- notes: Do not promote Split Command as stable product workflow.
