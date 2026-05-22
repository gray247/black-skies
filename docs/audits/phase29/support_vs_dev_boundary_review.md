# Phase 29 Pass 4 Support vs Dev Boundary Review

Status: Draft support and dev boundary review
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 4 - Boundary and Authority Separation Audit

## Purpose

This review separates product-visible support UX from diagnostics, runtime health indicators, test harness seams, and developer-only infrastructure.
It does not decide final GUI layout.

## Boundary Rows

### Service health banner and retry path

- related_ids: `P29-SURF-014`; `P29-CTRL-018`; `P29-INTEL-010`; `P29-WFLOW-011`
- classification: product-visible support UX
- evidence: `app/renderer/components/ServiceHealthBanner.tsx:33`; `app/renderer/components/ServiceHealthBanner.tsx:106`; `app/renderer/components/WorkspaceHeader.tsx:115`
- notes: Online/offline visibility and retry are legitimate operator-facing support behavior.

### Recovery banner

- related_ids: `P29-SURF-014`; `P29-CTRL-010`; `P29-WFLOW-011`
- classification: advanced/support-only
- evidence: `app/renderer/components/RecoveryBanner.tsx:51`; `app/tests/e2e/startup_authority_contract.spec.ts:505`
- notes: Recovery restore is product-visible when recovery is required, but it is still exception-path support behavior rather than normal authoring UX.

### Workspace service/budget indicators

- related_ids: `P29-SURF-002`; `P29-INTEL-008`; `P29-INTEL-010`
- classification: validate_first
- evidence: `app/renderer/components/WorkspaceHeader.tsx:78`; `app/renderer/components/WorkspaceHeader.tsx:115`; `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-008`
- notes: The indicators are runtime-backed, but their current prominence and interpretation boundary between support, diagnostics, and intelligence status remains unresolved.

### `__testInsights` state injection bridge

- related_ids: `P29-DEV-003`; `P29-DEV-005`; `P29-WFLOW-013`
- classification: dev/test-only
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-003`; `app/tests/e2e/hotkeys-status.spec.ts:255`; `app/tests/e2e/hotkeys-status.spec.ts:257`
- notes: This seam can change service state and scene-selection evidence in tests and must remain outside product-facing support interpretation.

### Test UI sandbox

- related_ids: `P29-DEV-007`
- classification: dev/test-only
- evidence: `app/renderer/testMode/testUISandbox.ts`; `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-007`
- notes: This is explicit sandbox infrastructure and should not be treated as product UX.

### Offline banner and toast stack

- related_ids: `P29-SURF-014`; `P29-WFLOW-011`
- classification: product-visible support UX
- evidence: `app/renderer/App.tsx:3228`; `app/renderer/App.tsx:3267`; `app/renderer/components/ToastStack.tsx:118`
- notes: These are ordinary runtime support signals when services or workflow prerequisites are unavailable.

### Diagnostics-flavored banner copy and test-offline states

- related_ids: `P29-SURF-014`; `P29-DEV-005`; `P29-WFLOW-011`
- classification: diagnostics-only
- evidence: `app/renderer/components/ServiceHealthBanner.tsx:57`; `app/tests/e2e/startup_authority_contract.spec.ts:583`; `app/tests/e2e/utils/serviceStubs.ts:276`
- notes: The runtime support banner is real, but test-specific offline reasons and frozen states are diagnostics scaffolding, not operator support language.

### Split Command shell notices and degraded-state resets

- related_ids: `P29-SURF-015`; `P29-DEV-009`; `P29-WFLOW-012`
- classification: validate_first
- evidence: `app/renderer/utils/splitCommandShellState.ts:164`; `app/renderer/utils/splitCommandShellState.ts:188`; `app/renderer/utils/splitCommandShellState.ts:219`
- notes: These notices are runtime-classified but tied to an experimental shell. They should not silently inherit product-visible support authority.

## Carry-Forward Findings

- Product-visible support UX is real around online/offline state, retry, toasts, and recovery banners.
- Test-only state injection and sandbox surfaces are distinct from support UX and must remain dev-only.
- The weakest boundary is where runtime support text and test-oriented diagnostics share the same banner family or status concepts.
- Workspace header status indicators still need later review to separate helpful operator status from over-promoted diagnostics or intelligence signaling.
