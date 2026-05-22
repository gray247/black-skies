# Phase 29 Pass 2 Persistence and Recovery Surface Review

Status: Draft review
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 2 - Workflow Mapping

## Purpose

This review separates normal authoring controls from high-impact persistence, recovery, safety, and output controls.
It does not make final disposition decisions.

## Surface Review

### Snapshots

- related_p29_ids: `P29-SURF-013`; `P29-CTRL-008`; `P29-CTRL-010`; `P29-CTRL-017`
- mutation_classification: mutates snapshot/history state
- workflow_classification: advanced safety workflow
- exposure_risk: snapshot creation sits in the Workspace Header and can look like a normal authoring action
- evidence: `app/renderer/components/WorkspaceHeader.tsx:192`; `app/renderer/components/SnapshotsPanel.tsx:983`; `app/main/preload.ts:1809`; `docs/specs/editorial_workflow_contract.md:90`
- recommendation_for_later_disposition_review: validate whether create/open snapshot controls remain primary, move to advanced/support, or become command-search actions

### Backup

- related_p29_ids: `P29-SURF-013`; `P29-CTRL-011`
- mutation_classification: mutates backup artifact state outside normal draft editing
- workflow_classification: advanced safety workflow
- exposure_risk: backup controls are contained in Snapshots Panel, but the panel is opened from the Workspace Header
- evidence: `app/renderer/components/SnapshotsPanel.tsx:1053`; `app/main/preload.ts:1856`; `app/shared/ipc/services.ts:583`
- recommendation_for_later_disposition_review: keep as validate_first until Pass 5 decides whether this belongs in visible product UI or support/advanced tooling

### Restore

- related_p29_ids: `P29-SURF-013`; `P29-SURF-014`; `P29-CTRL-011`; `P29-CTRL-018`
- mutation_classification: may mutate or replace project/recovery state depending on restore path; ZIP restore may materialize copy state
- workflow_classification: support/recovery workflow
- exposure_risk: restore controls are high-impact and must not be confused with save, export, or ordinary authoring
- evidence: `app/renderer/components/RecoveryBanner.tsx:58`; `app/renderer/components/SnapshotsPanel.tsx:1337`; `app/main/preload.ts:1822`; `app/main/preload.ts:1863`; `docs/specs/editorial_workflow_contract.md:252`
- recommendation_for_later_disposition_review: treat as high-risk support/recovery candidate and require explicit safety review before any final placement

### Verification

- related_p29_ids: `P29-SURF-013`; `P29-CTRL-009`
- mutation_classification: reads project/snapshot safety state and may write verification/report artifacts
- workflow_classification: support or advanced safety workflow
- exposure_risk: verification is useful but may crowd normal authoring controls when placed in the Workspace Header
- evidence: `app/renderer/components/WorkspaceHeader.tsx:202`; `app/renderer/components/SnapshotsPanel.tsx:1023`; `app/main/preload.ts:1898`
- recommendation_for_later_disposition_review: decide whether verification remains header-visible, moves into Snapshots Panel only, or becomes advanced/support action

### Recovery Banner Controls

- related_p29_ids: `P29-SURF-014`; `P29-CTRL-018`; `P29-DEV-005`
- mutation_classification: recovery restore can mutate project files; diagnostics access is support-only; reopen/reload affects app/session state
- workflow_classification: support/recovery workflow
- exposure_risk: necessary when recovery is required, but diagnostic and restore controls must not read as normal editing tools
- evidence: `app/renderer/components/RecoveryBanner.tsx:51`; `app/renderer/components/RecoveryBanner.tsx:58`; `app/renderer/components/RecoveryBanner.tsx:78`; `app/main/preload.ts:2133`
- recommendation_for_later_disposition_review: keep visible for recovery states, but Pass 4 must separate product support diagnostics from test diagnostics

### Export

- related_p29_ids: `P29-CTRL-006`; `P29-CTRL-017`
- mutation_classification: output artifact only based on current inventory; no Phase 27 save/export proof is claimed
- workflow_classification: output workflow, not normal draft persistence
- exposure_risk: header visibility can imply mature save/export routing even when proof is narrower
- evidence: `app/renderer/components/WorkspaceHeader.tsx:181`; `app/renderer/components/WorkspaceHeader.tsx:228`; `app/renderer/commands/commandRegistry.ts:143`
- recommendation_for_later_disposition_review: classify separately from save/autosave and require evidence before any export maturity claim

### Layout Persistence

- related_p29_ids: `P29-SURF-003`; `P29-CTRL-012`; `P29-CTRL-013`; `P29-CTRL-014`
- mutation_classification: mutates layout state, not project narrative content
- workflow_classification: advanced/settings or layout management workflow
- exposure_risk: layout machinery can distract from authoring and can become a support problem when panes collapse or float unexpectedly
- evidence: `app/renderer/components/docking/DockWorkspace.tsx:616`; `app/renderer/components/docking/DockWorkspace.tsx:772`; `app/shared/ipc/layout.ts:204`; `docs/specs/layout_persistence.md:33`
- recommendation_for_later_disposition_review: Pass 5 should decide which layout controls stay visible and which become recovery/reset affordances

## Cross-Cutting Risks

- Snapshot, backup, restore, verification, export, and layout reset controls are not equivalent to normal authoring actions.
- Some safety controls are useful but too prominent if they compete with Writing Surface work.
- Restore and backup language must remain distinct from save/export/autosave claims.
- Diagnostics should remain support-focused and must not be confused with dev/test harness controls.

## Later Disposition Review Requirements

- Pass 4 must separate diagnostic/test surfaces from support surfaces.
- Pass 5 must assign final keep, merge, hide, defer, delete_candidate, dev_only, or validate_first dispositions.
- Any future relocation or hiding recommendation must preserve a rollback note and evidence path.
