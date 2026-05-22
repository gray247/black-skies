# Phase 29 to Phase 30 Dependency Map

Status: Draft dependency map
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 6 - Closure Synthesis and Carry-Forward Governance

## Purpose

This map defines exactly what Phase 30 is allowed to use from Phase 29 and what it must not assume.

## Proven Governance Findings

- The current Writing Surface authoring path is the core surviving authority seam.
- The current Workspace Header is an overloaded mixed-authority surface and must not be preserved as a single workflow bucket by default.
- Story Insights, Companion, Relationship Graph, and Split Command are not approved as primary authoring authority.
- Support, recovery, diagnostics, and dev/test seams must remain explicitly distinguished.
- Rewrite/apply is the highest trust and mutation risk in the current intelligence stack.

## Likely Direction

- Story Insights and Companion trend toward contextual rather than primary authority.
- command-registry routing metadata trends toward background/internal infrastructure rather than visible authority.
- export, docking/layout machinery, and command-style access trend toward advanced/settings or otherwise constrained visibility.
- snapshots and recovery tooling trend toward support/recovery governance rather than ordinary authoring flow.

## Validate-First Findings

- `P29-SURF-010` critique plus rewrite/apply
- `P29-DEV-005` diagnostics bridge and diagnostic specs

Phase 30 may reference these as unresolved governance seams, but must not treat them as approved workflow authority.

## Unresolved Governance Areas

- final Workspace Header decomposition
- exact support-versus-diagnostics policy
- command-style access visibility policy
- export workflow authority policy
- exact contextual-versus-background thresholds for intelligence/status surfaces

## Prohibited Assumptions

- Do not assume runtime-backed means qualitatively validated.
- Do not assume Story Insights, Companion, or Relationship Graph have earned trusted narrative authority.
- Do not assume Split Command is accepted product direction.
- Do not assume command-registry metadata is meant for direct user visibility.
- Do not assume restore/recovery tooling belongs in normal authoring flow.

## Areas Requiring Qualitative Validation Before Promotion

- rewrite/apply
- visibly prescriptive Story Insights
- visibly trusted Companion guidance

## Areas Requiring Candidate Phase 32 Consideration Before Implementation

- any attempt to promote intelligence-assisted mutation into a central authoring workflow
- any attempt to turn descriptive analytics into trusted prescriptive narrative guidance
- any attempt to establish model-backed advisory authority as a durable writer-facing system without stronger evaluation discipline

## Phase 30 Usage Rule

Phase 30 may use Phase 29 as governance evidence and boundary input.
Phase 30 may not reinterpret likely direction as approved final policy without the human-review checkpoints defined in `phase29_human_review_checkpoints.md`.
