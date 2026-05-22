# Phase 29 Pass 2 Workflow Conflict Register

Status: Draft workflow map
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 2 - Workflow Mapping

## Purpose

This register maps current surfaces and controls into observed workflow groups.
It is not a final product placement decision.
Routing hints are preliminary and must not be treated as Phase 30 workflow policy.

## Workflow Rows

### P29-WFLOW-001

- workflow_id: `P29-WFLOW-001`
- workflow_name: project open/create
- involved_surface_ids: `P29-SURF-001`
- involved_control_ids: `P29-CTRL-001`; `P29-CTRL-002`; `P29-CTRL-017`
- involved_dev_ids: none
- current_entry_points: Project Home open dialog, recent project buttons, create-project card, command registry `project.open`
- user-facing purpose: open an existing project or create a fresh project
- runtime-backed/partial/experimental/unknown: runtime_backed
- duplication_or_overlap: open project appears as direct Project Home UI and command-registry entry; recent-project open is a third entry path
- risk_level: medium
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-001`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-001`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-002`; `app/renderer/components/ProjectHome.tsx:1194`; `app/renderer/components/ProjectHome.tsx:1258`; `app/renderer/commands/commandRegistry.ts:39`
- preliminary_routing_hint: keep current until validated

### P29-WFLOW-002

- workflow_id: `P29-WFLOW-002`
- workflow_name: writing/editing
- involved_surface_ids: `P29-SURF-005`; `P29-SURF-001`; `P29-SURF-003`
- involved_control_ids: `P29-CTRL-003`; `P29-CTRL-004`
- involved_dev_ids: none
- current_entry_points: docked Draft Preview / Project Home surface, active-scene selection, generation scope controls
- user-facing purpose: view and edit active scene draft state in the current Writing Surface
- runtime-backed/partial/experimental/unknown: partial
- duplication_or_overlap: current Writing Surface is represented through Project Home / Draft Preview rather than a dedicated final authoring workflow
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-005`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-003`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-004`; `app/renderer/App.tsx:2698`; `app/shared/ipc/layout.ts:38`
- preliminary_routing_hint: Writing Surface candidate

### P29-WFLOW-003

- workflow_id: `P29-WFLOW-003`
- workflow_name: generation/preflight
- involved_surface_ids: `P29-SURF-002`; `P29-SURF-005`; `P29-SURF-011`
- involved_control_ids: `P29-CTRL-003`; `P29-CTRL-004`; `P29-CTRL-016`; `P29-CTRL-017`
- involved_dev_ids: none
- current_entry_points: Workspace Header generate button, generation scope buttons, Preflight Modal proceed button, command registry generation entries
- user-facing purpose: choose generation scope, review preflight warnings, and proceed with draft generation
- runtime-backed/partial/experimental/unknown: runtime_backed
- duplication_or_overlap: generation appears in header controls and command registry; scope and preflight are split across toolbar and modal
- risk_level: high
- evidence: `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-003`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-004`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-016`; `app/renderer/components/WorkspaceHeader.tsx:127`; `app/renderer/components/PreflightModal.tsx:130`; `docs/specs/generation_scope.md:17`
- preliminary_routing_hint: Writing Surface candidate

### P29-WFLOW-004

- workflow_id: `P29-WFLOW-004`
- workflow_name: critique/rewrite
- involved_surface_ids: `P29-SURF-002`; `P29-SURF-010`
- involved_control_ids: `P29-CTRL-005`; `P29-CTRL-017`
- involved_dev_ids: none
- current_entry_points: Workspace Header critique button, Critique Modal rewrite controls, command registry critique and rewrite entries
- user-facing purpose: run critique, review feedback, generate rewrite preview, and optionally apply rewrite
- runtime-backed/partial/experimental/unknown: runtime_backed
- duplication_or_overlap: non-mutative critique and mutative rewrite controls share one modal workflow
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-010`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-005`; `app/renderer/components/CritiqueModal.tsx:204`; `app/renderer/components/CritiqueModal.tsx:252`; `docs/specs/editorial_workflow_contract.md:36`; `docs/specs/editorial_workflow_contract.md:224`
- preliminary_routing_hint: validate_first

### P29-WFLOW-005

- workflow_id: `P29-WFLOW-005`
- workflow_name: outline/wizard planning
- involved_surface_ids: `P29-SURF-004`; `P29-SURF-007`; `P29-SURF-015`
- involved_control_ids: `P29-CTRL-015`; `P29-CTRL-008`; `P29-CTRL-020`
- involved_dev_ids: none
- current_entry_points: Wizard Panel steps, step lock buttons, build outline button, Corkboard scene cards, Split Command story navigation when enabled
- user-facing purpose: plan structure, lock decisions, build outline, and browse scene cards
- runtime-backed/partial/experimental/unknown: runtime_backed
- duplication_or_overlap: Outline/Wizard, Corkboard, and experimental Split Command all expose structural navigation concepts
- risk_level: medium
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-004`; `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-007`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-015`; `app/renderer/components/WizardPanel.tsx:890`; `app/renderer/components/Corkboard.tsx:122`
- preliminary_routing_hint: Command Center candidate

### P29-WFLOW-006

- workflow_id: `P29-WFLOW-006`
- workflow_name: pane/docking/layout management
- involved_surface_ids: `P29-SURF-003`
- involved_control_ids: `P29-CTRL-012`; `P29-CTRL-013`; `P29-CTRL-014`
- involved_dev_ids: `P29-DEV-002`; `P29-DEV-007`
- current_entry_points: pane titlebar controls, hidden-pane controls, dock preset controls, reset layout, hotkeys, stable dock/test flags
- user-facing purpose: manage pane visibility, focus, detached windows, and layout recovery
- runtime-backed/partial/experimental/unknown: runtime_backed
- duplication_or_overlap: layout machinery is exposed through titlebar controls, hidden-pane region, preset/reset buttons, and test-stable modes
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-003`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-012`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-014`; `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-002`; `app/renderer/components/docking/DockPaneTile.tsx:103`; `app/renderer/components/docking/DockWorkspace.tsx:1309`
- preliminary_routing_hint: advanced/settings candidate

### P29-WFLOW-007

- workflow_id: `P29-WFLOW-007`
- workflow_name: story insights/analytics
- involved_surface_ids: `P29-SURF-006`; `P29-SURF-014`
- involved_control_ids: `P29-CTRL-019`
- involved_dev_ids: `P29-DEV-003`; `P29-DEV-006`
- current_entry_points: Story Insights pane, Analytics Dashboard render, service retry controls, test service-status events
- user-facing purpose: show scene metrics, emotion trend, pacing strip, and offline/service state
- runtime-backed/partial/experimental/unknown: partial
- duplication_or_overlap: analytics appears as a pane, docs-declared insight surface, companion-adjacent insight concept, and test-manipulated service state
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-006`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-019`; `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-003`; `app/renderer/components/AnalyticsDashboard.tsx:225`; `docs/gui/gui_layouts.md:41`
- preliminary_routing_hint: validate_first

### P29-WFLOW-008

- workflow_id: `P29-WFLOW-008`
- workflow_name: companion overlay
- involved_surface_ids: `P29-SURF-012`; `P29-SURF-006`
- involved_control_ids: `P29-CTRL-007`; `P29-CTRL-019`
- involved_dev_ids: `P29-DEV-003`; `P29-DEV-006`
- current_entry_points: Workspace Header companion toggle, Companion Overlay run-all-insights action, service status test bridge
- user-facing purpose: open assistance overlay and run local/model insight actions
- runtime-backed/partial/experimental/unknown: partial
- duplication_or_overlap: companion local/model insights overlap with Story Insights and future intelligence claims
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-012`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-007`; `app/renderer/components/CompanionOverlay.tsx:739`; `app/renderer/components/CompanionOverlay.tsx:770`; `docs/gui/gui_layouts.md:42`
- preliminary_routing_hint: validate_first

### P29-WFLOW-009

- workflow_id: `P29-WFLOW-009`
- workflow_name: relationship graph
- involved_surface_ids: `P29-SURF-008`; `P29-SURF-006`
- involved_control_ids: `P29-CTRL-019`
- involved_dev_ids: `P29-DEV-006`
- current_entry_points: hidden Relationship Graph pane, analytics/service retry path
- user-facing purpose: display character-scene relationship visualization when available
- runtime-backed/partial/experimental/unknown: partial
- duplication_or_overlap: hidden relationship graph overlaps Story Insights analytics and future intelligence/visualization claims
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-008`; `app/shared/ipc/layout.ts:63`; `app/renderer/components/RelationshipGraph.tsx:103`; `docs/specs/pane_lifecycle.md:22`
- preliminary_routing_hint: validate_first

### P29-WFLOW-010

- workflow_id: `P29-WFLOW-010`
- workflow_name: snapshots/backup/restore
- involved_surface_ids: `P29-SURF-013`; `P29-SURF-002`; `P29-SURF-009`
- involved_control_ids: `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`; `P29-CTRL-011`; `P29-CTRL-017`
- involved_dev_ids: none
- current_entry_points: Workspace Header snapshot button, verify button, snapshots panel button, Snapshots Panel backup/restore rows, command registry snapshot entries
- user-facing purpose: create snapshots, verify records, create backups, and restore copies
- runtime-backed/partial/experimental/unknown: runtime_backed
- duplication_or_overlap: snapshot creation appears in header, wizard lock flow, command registry, and Snapshots Panel; verification appears in header and panel
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-013`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-008`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-011`; `app/renderer/components/SnapshotsPanel.tsx:1053`; `app/renderer/components/SnapshotsPanel.tsx:1337`; `docs/specs/editorial_workflow_contract.md:90`
- preliminary_routing_hint: support/recovery candidate

### P29-WFLOW-011

- workflow_id: `P29-WFLOW-011`
- workflow_name: recovery/service health/offline
- involved_surface_ids: `P29-SURF-014`; `P29-SURF-001`
- involved_control_ids: `P29-CTRL-018`; `P29-CTRL-019`
- involved_dev_ids: `P29-DEV-005`; `P29-DEV-006`
- current_entry_points: Recovery Banner, service health banner, offline banners, diagnostic controls, test service events
- user-facing purpose: warn about recovery state, retry services, reopen/reload, and access diagnostics
- runtime-backed/partial/experimental/unknown: runtime_backed
- duplication_or_overlap: real service/offline controls overlap diagnostic bridge and test event controls
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-014`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-018`; `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-005`; `app/renderer/components/RecoveryBanner.tsx:58`; `app/renderer/components/ServiceHealthBanner.tsx:112`
- preliminary_routing_hint: support/recovery candidate

### P29-WFLOW-012

- workflow_id: `P29-WFLOW-012`
- workflow_name: Split Command experimental navigation
- involved_surface_ids: `P29-SURF-015`; `P29-SURF-004`; `P29-SURF-005`; `P29-SURF-007`
- involved_control_ids: `P29-CTRL-020`
- involved_dev_ids: `P29-DEV-002`; `P29-DEV-004`
- current_entry_points: runtime flag `experimentalSplitCommandWorkspace`, Split Command story navigation buttons, shell-local state tests
- user-facing purpose: experimental command-center and Writing Surface shell with story navigation
- runtime-backed/partial/experimental/unknown: experimental_flagged
- duplication_or_overlap: experimental shell overlaps stable docked workspace, outline, corkboard, and Writing Surface concepts
- risk_level: high
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-015`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-020`; `app/shared/config/runtime.ts:115`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:407`; `app/renderer/components/workspace/StoryNavigationPanel.tsx:96`
- preliminary_routing_hint: validate_first

### P29-WFLOW-013

- workflow_id: `P29-WFLOW-013`
- workflow_name: command registry and dev/test diagnostic workflows
- involved_surface_ids: `P29-SURF-002`; `P29-SURF-014`
- involved_control_ids: `P29-CTRL-017`; `P29-CTRL-018`; `P29-CTRL-019`
- involved_dev_ids: `P29-DEV-001`; `P29-DEV-002`; `P29-DEV-003`; `P29-DEV-004`; `P29-DEV-005`; `P29-DEV-006`; `P29-DEV-007`; `P29-DEV-008`; `P29-DEV-009`
- current_entry_points: command registry file, preload test bridges, diagnostics bridge, e2e test events, mode flags
- user-facing purpose: command declarations and support diagnostics exist, while test harness controls should remain separate from product UX
- runtime-backed/partial/experimental/unknown: partial
- duplication_or_overlap: command-like actions may mirror toolbar controls; diagnostics and test events can affect visible app state during harness runs
- risk_level: high
- evidence: `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-017`; `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-001`; `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-003`; `app/renderer/commands/commandRegistry.ts:37`; `app/main/preload.ts:566`; `app/main/preload.ts:2133`
- preliminary_routing_hint: dev-only candidate

## Pass 2 Notes

- No final placement decision is made by this register.
- `P29-WFLOW-007`, `P29-WFLOW-008`, and `P29-WFLOW-009` must feed Phase 29 Pass 3 Intelligence Audit.
- `P29-WFLOW-013` must feed Phase 29 Pass 4 Dev vs Production Audit.
- `P29-WFLOW-006` and `P29-WFLOW-010` must feed Phase 29 Pass 5 disposition review.
