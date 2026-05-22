# Phase 29 Pass 5 Dev vs Product Surface Disposition

Status: Draft dev-versus-product classification
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 5 - Disposition Matrix and Governance Classification

## Purpose

This review finalizes the preliminary governance separation between product-visible systems, support systems, diagnostics, test seams, and dev infrastructure.

## `__testInsights`

- related IDs: `P29-DEV-003`; `P29-BOUND-009`
- current exposure: hidden main-world bridge used by tests
- recommended future exposure: dev_only
- leakage risk: severe
- rationale: directly changes visible service and scene state during tests and has no current product-facing justification
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-003`; `app/tests/e2e/gui.insights.spec.ts:25`

## Test mode bridge and manager

- related IDs: `P29-DEV-004`
- current exposure: test bridge exposed as `window.testMode`
- recommended future exposure: dev_only
- leakage risk: medium
- rationale: explicit test API with no current product-facing requirement
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-004`

## Diagnostics bridge and diagnostic specs

- related IDs: `P29-DEV-005`; `P29-SURF-014`
- current exposure: mixed hidden bridge plus diagnostic test evidence
- recommended future exposure: validate_first
- leakage risk: high
- rationale: some diagnostics appear support-adjacent, but the bridge and tests are not yet cleanly separated into product-visible support versus dev-only diagnostics
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-005`; `docs/audits/phase29/support_vs_dev_boundary_review.md`

## Service-health test events

- related IDs: `P29-DEV-006`; `P29-BOUND-009`
- current exposure: synthetic test events only
- recommended future exposure: dev_only
- leakage risk: medium
- rationale: test controls must not define operator-facing support behavior
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-006`

## Visual stable and animation-disable harness

- related IDs: `P29-DEV-007`
- current exposure: environment-gated visual-test stabilization
- recommended future exposure: dev_only
- leakage risk: low
- rationale: pure test stability infrastructure if containment remains intact
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-007`

## Test UI sandbox

- related IDs: `P29-DEV-008`
- current exposure: hidden or unverified renderer sandbox utility
- recommended future exposure: dev_only
- leakage risk: low
- rationale: no current runtime evidence supports product-visible authority
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-008`

## Recovery, offline, and toast surfaces

- related IDs: `P29-SURF-014`; `P29-INTEL-009`
- current exposure: contextual product-visible support UX
- recommended future exposure: support/recovery
- leakage risk: medium
- rationale: legitimate user-facing support surfaces, but they must remain separate from diagnostic bridges and test-only status semantics
- evidence: `docs/audits/phase29/support_vs_dev_boundary_review.md`

## Workspace status indicators

- related IDs: `P29-INTEL-009`; `P29-INTEL-010`; `P29-SURF-002`
- current exposure: primary strip status indicators in the Workspace Header
- recommended future exposure: contextual
- leakage risk: medium
- rationale: these are legitimate runtime status signals, but current grouping over-promotes them and keeps them too close to mixed intelligence and mutation authority
- evidence: `docs/audits/phase29/workspace_header_disposition_review.md`

## Split Command degraded-state notices

- related IDs: `P29-SURF-015`; `P29-DEV-009`
- current exposure: experimental shell notices and reset messages
- recommended future exposure: validate_first
- leakage risk: medium
- rationale: the notices are runtime-real but tied to an experimental shell that should not inherit stable product support authority
- evidence: `docs/audits/phase29/support_vs_dev_boundary_review.md`; `docs/audits/phase29/experimental_workflow_pressure_review.md`
