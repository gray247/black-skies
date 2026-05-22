# Phase 29 Pass 4 Mutation Authority Review

Status: Draft mutation-risk review
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 4 - Boundary and Authority Separation Audit

## Purpose

This review isolates surfaces where visible controls can mutate project, recovery, or session state after intelligence-like, support, or orchestration steps.
It does not decide final GUI placement.

## Mutation Rows

### Rewrite and apply flow

- related_ids: `P29-BOUND-005`; `P29-CTRL-005`; `P29-INTEL-006`; `P29-WFLOW-004`
- what_mutates: active scene draft content after critique-assisted rewrite generation
- mutation_scope: direct project-authoring state
- user_trust_implications: users can read critique output as authoritative and then apply a rewrite without qualitative proof that the rewrite is better
- visibility_concerns: critique and apply live close to normal authoring controls and inherit the authority of the critique surface
- workflow_placement_concerns: interpretation and mutation are coupled in one flow instead of being clearly separated into critique, review, and deliberate apply
- evidence: `app/renderer/components/CritiqueModal.tsx:204`; `app/renderer/components/CritiqueModal.tsx:252`; `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-006`
- qualitative_authority_concerns: strongest fake-smart and trust-risk surface in the current intelligence stack because it crosses from advice into mutation
- preliminary_mitigation_direction: validate_first

### Snapshot restore and backup restore

- related_ids: `P29-BOUND-007`; `P29-CTRL-010`; `P29-CTRL-011`; `P29-WFLOW-010`
- what_mutates: snapshot recovery state, project files, or restored project copies depending on restore path
- mutation_scope: high-risk project and recovery state mutation
- user_trust_implications: restore actions can be mistaken for normal safety confirmation rather than consequential state replacement or recovery operations
- visibility_concerns: restore pathways sit near snapshot browsing and verification surfaces, which can blur review versus mutation authority
- workflow_placement_concerns: restore belongs to support and recovery handling, not ordinary authoring flow
- evidence: `app/tests/e2e/startup_authority_contract.spec.ts:505`; `app/tests/e2e/startup_authority_contract.spec.ts:538`; `app/tests/e2e/utils/serviceStubs.ts:372`; `docs/audits/phase29/persistence_and_recovery_surface_review.md`
- qualitative_authority_concerns: trust depends on explicit safety framing rather than intelligence quality, but the visible authority is still high because state replacement is consequential
- preliminary_mitigation_direction: support/recovery candidate

### Recovery banner actions

- related_ids: `P29-BOUND-008`; `P29-SURF-014`; `P29-CTRL-018`; `P29-WFLOW-011`
- what_mutates: reopen, reload, and recovery restoration paths can alter session state or recover project state
- mutation_scope: indirect to direct recovery-state mutation
- user_trust_implications: appropriate when recovery is required, but users should not absorb these actions as normal editing tools
- visibility_concerns: visible banners are justified during failure states, but any persistent or over-broad recovery authority would crowd ordinary workflow
- workflow_placement_concerns: these actions belong to exception handling, not steady-state authoring
- evidence: `app/renderer/components/RecoveryBanner.tsx:51`; `app/renderer/components/ServiceHealthBanner.tsx:106`; `docs/audits/phase29/persistence_and_recovery_surface_review.md`
- qualitative_authority_concerns: low intelligence risk, high support-authority sensitivity
- preliminary_mitigation_direction: support/recovery candidate

### Generation and orchestration-triggered mutation

- related_ids: `P29-BOUND-002`; `P29-CTRL-003`; `P29-CTRL-004`; `P29-CTRL-017`; `P29-WFLOW-003`; `P29-WFLOW-013`
- what_mutates: generated draft content and possibly multiple-scene authoring state after preflight or command-registry triggers
- mutation_scope: direct authoring-state mutation
- user_trust_implications: generation is an intentional authoring action, but command and scope surfaces can dilute where mutation authority actually resides
- visibility_concerns: mutation can be triggered through header controls, scope controls, and command entries, increasing workflow density and authority blur
- workflow_placement_concerns: entry-point duplication matters because mutation-authority consistency is part of user trust
- evidence: `app/renderer/components/WorkspaceHeader.tsx:127`; `app/renderer/components/PreflightModal.tsx:130`; `app/renderer/commands/commandRegistry.ts:39`; `docs/audits/phase29/workflow_conflict_register.md:P29-WFLOW-003`
- qualitative_authority_concerns: lower fake-smart risk than rewrite/apply, but still sensitive because model-backed output becomes authoring state
- preliminary_mitigation_direction: Writing Surface candidate

### Docking and layout reset mutation

- related_ids: `P29-BOUND-012`; `P29-WFLOW-006`; `P29-WFLOW-012`
- what_mutates: persisted layout state, pane visibility, and shell arrangement
- mutation_scope: session/layout mutation rather than project-content mutation
- user_trust_implications: lower content risk, but excessive visible layout authority can still erode usability and blur product versus shell mechanics
- visibility_concerns: pane-management machinery can take space and attention from authoring while still feeling operationally important
- workflow_placement_concerns: layout mutation is a shell concern, not a primary writing task
- evidence: `app/shared/ipc/layout.ts:16`; `docs/specs/layout_persistence.md:1`; `docs/audits/phase29/workflow_conflict_register.md:P29-WFLOW-006`
- qualitative_authority_concerns: not an intelligence risk, but a clear authority-boundary risk
- preliminary_mitigation_direction: advanced/settings candidate

## Carry-Forward Findings

- Mutation authority is most dangerous when critique-like interpretation and draft mutation are coupled in one visible flow.
- Snapshot and recovery restore controls are legitimate, but they belong to safety and support authority rather than normal authoring authority.
- Generation is expected to mutate authoring state, but duplicated entry points still create avoidable authority blur.
- Layout mutation is lower risk to content but still contributes to shell-over-authoring pressure.
