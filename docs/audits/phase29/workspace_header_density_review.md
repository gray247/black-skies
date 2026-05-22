# Phase 29 Pass 2 Workspace Header Density Review

Status: Draft review
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 2 - Workflow Mapping

## Purpose

This review analyzes `P29-SURF-002` as a concentration point for unrelated controls.
It does not decide final placement.
It identifies what Phase 29 Pass 5 must classify.

## Related IDs

- Surface: `P29-SURF-002`
- Controls: `P29-CTRL-003`; `P29-CTRL-004`; `P29-CTRL-005`; `P29-CTRL-006`; `P29-CTRL-007`; `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`; `P29-CTRL-016`; `P29-CTRL-017`

## Action Groups

### Writing / Generation

- related_ids: `P29-CTRL-003`; `P29-CTRL-004`; `P29-CTRL-016`
- current_actions: Generate Draft, active-scene/all-scenes scope toggle, Preflight proceed/cancel
- evidence: `app/renderer/components/WorkspaceHeader.tsx:127`; `app/renderer/components/WorkspaceHeader.tsx:137`; `app/renderer/components/PreflightModal.tsx:245`
- workflow_risk: generation is mutative and scope-sensitive; all-scenes generation increases accidental blast radius
- later_review_need: decide whether generation controls stay primary, move closer to the Writing Surface, or require stronger progressive disclosure

### Critique / Rewrite

- related_ids: `P29-CTRL-005`; `P29-SURF-010`
- current_actions: Run Critique, generate saved rewrite, apply rewrite, close review
- evidence: `app/renderer/components/WorkspaceHeader.tsx:164`; `app/renderer/components/CritiqueModal.tsx:204`; `app/renderer/components/CritiqueModal.tsx:252`
- workflow_risk: critique is non-mutative by contract, but rewrite/apply behavior is mutative and shares the same workflow family
- later_review_need: separate critique visibility from rewrite persistence risk before final disposition

### Export

- related_ids: `P29-CTRL-006`; `P29-CTRL-017`
- current_actions: select export format, export project manuscript, command registry `project.export`
- evidence: `app/renderer/components/WorkspaceHeader.tsx:181`; `app/renderer/components/WorkspaceHeader.tsx:228`; `app/renderer/commands/commandRegistry.ts:143`
- workflow_risk: export can read as save/export pipeline maturity even though Phase 27 did not prove save/export authority
- later_review_need: classify export as author workflow, advanced output workflow, or validate-first surface

### Snapshot / Recovery

- related_ids: `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`
- current_actions: create snapshot, verify snapshots, open Snapshots Panel
- evidence: `app/renderer/components/WorkspaceHeader.tsx:192`; `app/renderer/components/WorkspaceHeader.tsx:202`; `app/renderer/components/WorkspaceHeader.tsx:212`
- workflow_risk: snapshot and verification actions sit beside generation and critique even though they are safety/support workflows
- later_review_need: decide whether snapshot and verification controls remain primary or move to support/advanced areas

### Companion / Intelligence

- related_ids: `P29-CTRL-007`; `P29-SURF-012`
- current_actions: toggle Companion Overlay, run local/model insights inside overlay
- evidence: `app/renderer/components/WorkspaceHeader.tsx:116`; `app/renderer/components/CompanionOverlay.tsx:770`; `app/renderer/components/CompanionOverlay.tsx:784`
- workflow_risk: companion and insight controls can imply intelligence maturity before Pass 3 classifies what is runtime-backed
- later_review_need: feed Phase 29 Pass 3 Intelligence Audit before any visibility or prominence decision

### Budget / Status

- related_ids: `P29-SURF-002`
- current_actions: budget indicator display in header
- evidence: `app/renderer/components/WorkspaceHeader.tsx:111`
- workflow_risk: low direct mutation risk; may still compete for header attention
- later_review_need: decide whether budget/status is primary writing context or advanced telemetry

## Why This Creates Workflow Risk

- High-impact, mutative, support, output, and intelligence actions appear in one toolbar.
- A writer can encounter generation, export, snapshot, critique, companion, and verification controls at the same level of prominence.
- Safety/support actions can look like normal authoring actions.
- Intelligence actions can appear beside runtime-backed actions before their actual capability level is classified.

## Dangerous Or Persistence-Affecting Items

- `P29-CTRL-003`: Generate Draft can mutate draft text after preflight.
- `P29-CTRL-004`: All-scenes scope can increase generation blast radius.
- `P29-CTRL-006`: Export may imply unproven save/export maturity.
- `P29-CTRL-008`: Create Snapshot mutates snapshot/history state.
- `P29-CTRL-009`: Verify Snapshots reads and reports safety state.
- `P29-CTRL-010`: Opens a panel containing backup/restore controls.

## Safer Or Lower-Risk Items

- `P29-CTRL-007`: Companion toggle is lower persistence risk, but high intelligence-claim risk.
- Budget indicator is low mutation risk.
- Opening the Snapshots Panel is lower direct mutation risk than restore actions, but it exposes high-impact controls.

## Phase 29 Pass 5 Must Decide

- Which header controls are primary authoring actions.
- Which controls belong in support/recovery or advanced/settings areas.
- Whether snapshot, verification, export, and companion actions should remain equally prominent.
- Whether command registry actions should mirror visible toolbar controls or serve a separate command/search strategy.
- What rollback note is required for any future hide, merge, or relocation recommendation.
