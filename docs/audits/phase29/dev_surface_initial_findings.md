# Phase 29 Pass 1 Dev Surface Initial Findings

Status: Draft inventory
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 1 - Surface Inventory

## Purpose

This artifact catalogs dev, test, diagnostic, and harness surfaces found during the bounded Phase 29 Pass 1 inspection.
It is inventory evidence only.
It does not decide final removal or containment.

Review status for all rows is `pending`.

## Inventory Rows

### P29-DEV-001

- classification_id: `P29-DEV-001`
- surface_or_item: `__testEnv` Playwright bridge
- type: test harness bridge
- source_area: preload and mode policy
- file_or_component_path: `app/main/preload.ts`; `app/shared/modePolicy.ts`
- owner_doc_or_runtime_source: `app/main/preload.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: exposed in main-world when preload runs
- workflow_role: lets runtime and tests detect Playwright/test state
- overlaps_with: `P29-DEV-002`; `P29-DEV-004`; `P29-DEV-006`
- recommended_disposition: dev_only
- disposition_reason: Direct evidence shows it is a test bridge and mode-policy input.
- evidence: `app/main/preload.ts:200`; `app/main/preload.ts:279`; `app/shared/modePolicy.ts:38`; `app/shared/modePolicy.ts:42`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Later dev-vs-production audit should confirm no product assumptions rely on this bridge.

### P29-DEV-002

- classification_id: `P29-DEV-002`
- surface_or_item: Stable home, stable dock, visual stable, and active-flow dataset flags
- type: test/stability mode flags
- source_area: preload, mode policy, and e2e fixture
- file_or_component_path: `app/main/preload.ts`; `app/shared/modePolicy.ts`; `app/tests/e2e/_electron.fixture.ts`
- owner_doc_or_runtime_source: `app/main/preload.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: DOM dataset flags during test/stable modes
- workflow_role: stabilizes visual, docking, and home modes for tests
- overlaps_with: `P29-DEV-001`; `P29-DEV-007`
- recommended_disposition: dev_only
- disposition_reason: Direct evidence ties flags to Playwright and stable visual test behavior.
- evidence: `app/main/preload.ts:283`; `app/main/preload.ts:313`; `app/main/preload.ts:315`; `app/main/preload.ts:322`; `app/shared/modePolicy.ts:78`; `app/tests/e2e/_electron.fixture.ts:59`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Needs containment review because DOM flags can affect visible rendering.

### P29-DEV-003

- classification_id: `P29-DEV-003`
- surface_or_item: `__testInsights` service-status and scene-selection bridge
- type: test harness bridge
- source_area: preload and e2e tests
- file_or_component_path: `app/main/preload.ts`; `app/tests/e2e/gui.insights.spec.ts`
- owner_doc_or_runtime_source: `app/main/preload.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: exposed in main-world for test harnesses
- workflow_role: manipulates service status and active scene for GUI tests
- overlaps_with: `P29-SURF-006`; `P29-SURF-012`; `P29-CTRL-019`
- recommended_disposition: dev_only
- disposition_reason: Direct evidence shows the bridge emits test events and is used by e2e tests.
- evidence: `app/main/preload.ts:566`; `app/main/preload.ts:568`; `app/main/preload.ts:569`; `app/tests/e2e/gui.insights.spec.ts:25`; `app/tests/e2e/gui.insights.spec.ts:38`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: High risk because it can alter visible service and scene state during tests.

### P29-DEV-004

- classification_id: `P29-DEV-004`
- surface_or_item: `testMode` main-world bridge and test mode manager
- type: test mode API
- source_area: preload and renderer test mode utilities
- file_or_component_path: `app/main/preload.ts`; `app/renderer/testMode/testModeManager.ts`
- owner_doc_or_runtime_source: `app/renderer/testMode/testModeManager.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: exposed as `window.testMode`
- workflow_role: reports flat, recovery, full, offline, and stable-dock modes
- overlaps_with: `P29-DEV-001`; `P29-DEV-002`
- recommended_disposition: dev_only
- disposition_reason: Direct evidence shows it is a test-mode API.
- evidence: `app/main/preload.ts:580`; `app/main/preload.ts:588`; `app/renderer/testMode/testModeManager.ts:85`; `app/renderer/testMode/testModeManager.ts:130`; `app/renderer/testMode/testModeManager.ts:183`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Later audit should determine whether any visible UI reads this outside test conditions.

### P29-DEV-005

- classification_id: `P29-DEV-005`
- surface_or_item: Diagnostics bridge and diagnostic e2e specs
- type: diagnostic/support surface
- source_area: preload, recovery tests, and e2e diagnostics
- file_or_component_path: `app/main/preload.ts`; `app/tests/e2e/startup.diagnostic.spec.ts`; `app/tests/e2e/path-normalization.diagnostic.spec.ts`
- owner_doc_or_runtime_source: `app/shared/ipc/diagnostics.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: partial
- current_visibility: diagnostics bridge is exposed; diagnostic specs are test-only
- workflow_role: supports diagnostics folder access and harness readiness checks
- overlaps_with: `P29-CTRL-018`; `P29-SURF-014`
- recommended_disposition: validate_first
- disposition_reason: Diagnostic bridge has user-facing support implications, while diagnostic specs are test-only.
- evidence: `app/main/preload.ts:2133`; `app/renderer/__tests__/AppRecovery.test.tsx:453`; `app/tests/e2e/startup.diagnostic.spec.ts:14`; `app/tests/e2e/path-normalization.diagnostic.spec.ts:5`
- evidence_quality: inferred_from_multiple_sources
- confidence: medium
- risk_level: medium
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Needs separation of product support diagnostics from test diagnostics.

### P29-DEV-006

- classification_id: `P29-DEV-006`
- surface_or_item: Service health test events
- type: test event controls
- source_area: renderer tests and e2e tests
- file_or_component_path: `app/renderer/__tests__/useServiceHealth.test.tsx`; `app/tests/e2e/hotkeys-status.spec.ts`
- owner_doc_or_runtime_source: `app/renderer/hooks/useServiceHealth.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: synthetic window/document events during tests
- workflow_role: force service online/offline and health status changes in tests
- overlaps_with: `P29-CTRL-019`; `P29-SURF-014`; `P29-DEV-003`
- recommended_disposition: dev_only
- disposition_reason: Test evidence explicitly uses `test:service-status`, `test:service-health`, and `test:force-offline`.
- evidence: `app/renderer/__tests__/useServiceHealth.test.tsx:141`; `app/renderer/__tests__/useServiceHealth.test.tsx:143`; `app/tests/e2e/hotkeys-status.spec.ts:255`; `app/tests/e2e/hotkeys-status.spec.ts:257`
- evidence_quality: test_reference
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Later pass should ensure test events do not define product UX behavior.

### P29-DEV-007

- classification_id: `P29-DEV-007`
- surface_or_item: Visual stable and animation-disable harness
- type: visual test stabilization
- source_area: preload and e2e launcher
- file_or_component_path: `app/main/preload.ts`; `app/tests/e2e/_electron.fixture.ts`
- owner_doc_or_runtime_source: `app/shared/modePolicy.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: environment-gated visual attributes and style stabilization
- workflow_role: stabilizes screenshots and visual tests
- overlaps_with: `P29-DEV-002`
- recommended_disposition: dev_only
- disposition_reason: Direct environment gates show this is test/visual-stability behavior.
- evidence: `app/main/preload.ts:137`; `app/main/preload.ts:1921`; `app/main/preload.ts:2171`; `app/tests/e2e/_electron.fixture.ts:480`; `app/shared/modePolicy.ts:78`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: low
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Low product risk if contained to test/visual-stable modes.

### P29-DEV-008

- classification_id: `P29-DEV-008`
- surface_or_item: Test UI sandbox
- type: test-only renderer utility
- source_area: renderer test mode utilities
- file_or_component_path: `app/renderer/testMode/testUISandbox.ts`
- owner_doc_or_runtime_source: `app/renderer/testMode/testUISandbox.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: unknown
- current_visibility: not classified during Pass 1
- workflow_role: possible sandbox helper for test UI behavior
- overlaps_with: `P29-DEV-004`
- recommended_disposition: validate_first
- disposition_reason: File exists in a bounded source area, but runtime usage was not line-verified in this pass.
- evidence: `app/renderer/testMode/testUISandbox.ts`
- evidence_quality: weak_needs_review
- confidence: low
- risk_level: low
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Requires targeted usage search in the dev-vs-production audit.

### P29-DEV-009

- classification_id: `P29-DEV-009`
- surface_or_item: Phase 4 mock flow enablement
- type: mock/test behavior flag
- source_area: preload
- file_or_component_path: `app/main/preload.ts`
- owner_doc_or_runtime_source: `app/main/preload.ts`
- user_facing_or_dev_only: dev_only
- runtime_backed_or_placeholder: mock
- current_visibility: environment-gated preload behavior
- workflow_role: enables older mock flow behavior under an environment flag
- overlaps_with: `P29-DEV-001`; `P29-DEV-004`
- recommended_disposition: validate_first
- disposition_reason: Mock flow flag exists and needs later classification for removal or containment.
- evidence: `app/main/preload.ts:203`
- evidence_quality: direct_runtime_file
- confidence: medium
- risk_level: medium
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Later pass should verify whether this still has live product impact.
