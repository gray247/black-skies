# Phase 29 Pass 4 Boundary and Authority Summary

Status: Draft summary
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 4 - Boundary and Authority Separation Audit

## Scope

This pass audited visible and hidden authority boundaries between authoring, intelligence, orchestration, support, persistence/recovery, dev/test, and experimental systems.
It did not make final keep/merge/hide/delete decisions and did not begin Phase 30 workflow policy.

## Major Authority Conflicts

- `P29-BOUND-002`: Workspace Header remains the strongest mixed-authority surface.
- `P29-BOUND-005`: critique and rewrite/apply couple interpretation authority with direct mutation authority.
- `P29-BOUND-007`: snapshot and restore controls remain too close to ordinary authoring interpretation.
- `P29-BOUND-010`: Split Command keeps exerting experimental workflow pressure through terminology even while self-disclaimed.
- `P29-BOUND-011`: command-registry routing metadata is useful internally but would overstate orchestration maturity if surfaced directly.

## Highest Mutation and Trust Risks

- Rewrite/apply is the highest combined mutation and trust risk because it turns intelligence-like output into direct authoring mutation.
- Snapshot restore, backup restore, and recovery actions are high-risk support mutations that must not be confused with routine authoring.
- Generation is legitimate mutation authority, but its duplicated triggers still create avoidable authority blur.

## Systems Likely Needing Later Demotion or Backgrounding

- Story Insights / Analytics Dashboard
- Companion advisory and model-status surfaces
- Relationship Graph
- command-registry routing metadata as visible authority
- visible docking/layout machinery beyond what is needed for immediate operator control

## Support vs Dev Leakage Findings

- Service health, retry, offline banners, and toasts are legitimate product-visible support UX.
- `__testInsights`, service-health test events, and test UI sandbox infrastructure are dev/test-only seams and must stay outside product support authority.
- The weakest boundary is where runtime support states and diagnostics-flavored test states share similar banner or status concepts.

## Experimental Workflow Pressure Findings

- Split Command remains experimental and must not be read as stable workflow authority.
- Docking flexibility is runtime-backed but should not be allowed to imply that pane-heavy shell complexity is the validated product spine.
- Future-state documentation language remains a material source of authority inflation if not read through the Phase 28 runtime-truth rules.

## Unresolved Authority Ambiguities

- Whether Workspace Header budget and service indicators should resolve as support status, intelligence status, or a smaller background signal remains unresolved.
- Whether some recovery and verification affordances need a clearer separation between normal operator support and advanced safety tooling remains a later disposition question.
- Whether Split Command degraded-state notices should stay purely experimental or partially inherit support semantics remains `validate_first`.

## Stop Conditions

No stop condition was triggered.
The pass stayed within Phase 29 scope and did not require Phase 30 policy decisions.

## Pass 5 Readiness

Phase 29 Pass 5 may begin.
Pass 5 should use the accumulated `P29-SURF`, `P29-CTRL`, `P29-DEV`, `P29-WFLOW`, `P29-INTEL`, and `P29-BOUND` evidence to produce the keep/merge/hide/defer/delete matrix without silently promoting experimental, support, or intelligence surfaces.
