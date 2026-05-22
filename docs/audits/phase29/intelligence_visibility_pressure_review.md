# Phase 29 Pass 3 Intelligence Visibility Pressure Review

Status: Draft pressure review
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 3 - Intelligence Audit

## Purpose

This review analyzes where intelligence-related systems compete visually or conceptually with core authoring flow.
It does not decide final GUI layout.

## Workspace Header Overlap

- related_ids: `P29-SURF-002`; `P29-CTRL-005`; `P29-CTRL-007`; `P29-CTRL-006`; `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`; `P29-INTEL-009`; `P29-INTEL-010`
- pressure_assessment: over-promoted
- reason: the header combines intelligence-adjacent controls, output controls, safety controls, and budget/status signals at one visual tier
- workflow_effect: core writing and analysis signals compete for the same attention band before the user even enters the Writing Surface

## Analytics Overlap

- related_ids: `P29-SURF-006`; `P29-INTEL-001`; `P29-WFLOW-007`
- pressure_assessment: secondary but still interruptive
- reason: Story Insights is a pane-level analytics surface while docs still describe placeholder and future analytics drawer behavior
- workflow_effect: analytics can appear more mature and central than the current runtime truth supports

## Companion Overlap

- related_ids: `P29-SURF-012`; `P29-INTEL-002`; `P29-INTEL-003`; `P29-WFLOW-008`
- pressure_assessment: contextual trending toward interruptive
- reason: the overlay contains analytics, local guidance, model queue signals, and advisory language in one surface
- workflow_effect: can pull writers out of direct drafting into advisory review loops

## Rewrite / Apply Overlap

- related_ids: `P29-SURF-010`; `P29-INTEL-005`; `P29-INTEL-006`; `P29-WFLOW-004`
- pressure_assessment: contextual but high-authority
- reason: critique, provenance, and rewrite/apply mutation controls live in one modal
- workflow_effect: analysis and mutation pressure collapse into one decision surface

## Orchestration Overlap

- related_ids: `P29-SURF-015`; `P29-INTEL-007`; `P29-INTEL-008`; `P29-WFLOW-012`; `P29-WFLOW-013`
- pressure_assessment: hidden to advanced, but over-promoted in terminology
- reason: Split Command, Command Center, and command registry metadata imply future orchestration authority beyond current stable runtime
- workflow_effect: can distort expectations about which surfaces are truly active versus experimental or declarative

## Command-Like Workflow Overlap

- related_ids: `P29-CTRL-017`; `P29-INTEL-008`; `P29-WFLOW-013`
- pressure_assessment: hidden
- reason: command registry exists as metadata, but user-facing palette or routing UX is not proven
- workflow_effect: low current runtime pressure, medium future doc/authority pressure

## Primary / Contextual / Interruptive Assessment

- primary:
  none of the audited intelligence systems are justified as primary authority from current runtime evidence
- contextual:
  `P29-INTEL-005`; `P29-INTEL-009`; `P29-INTEL-010`
- interruptive:
  `P29-INTEL-001`; `P29-INTEL-002`; `P29-INTEL-006`
- hidden:
  `P29-INTEL-004`; `P29-INTEL-008`
- over-promoted:
  `P29-INTEL-001`; `P29-INTEL-002`; `P29-INTEL-006`; terminology around `P29-INTEL-007`

## Pressure Findings

- Intelligence-adjacent systems currently compete most heavily at the header, overlay, and modal layers rather than staying quietly contextual.
- The strongest user-trust risk is not raw clutter alone; it is authority inflation where partial analysis sits next to mutative or support actions.
- Budget and service-status signals are comparatively honest and should remain narrower in authority than analytics or rewrite surfaces.
- Split Command produces more terminology pressure than current runtime pressure because it remains experimental-flagged.
