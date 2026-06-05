# Pass 173 - RDM-SYNTH-001 Synthetic-Mode Authority Limits Planning

## Files Inspected
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/contracts/harness_fixture_contract.md`
- `docs/contracts/truth_lane_claim_matrix_contract.md`
- `docs/specs/capability_truth_matrix.md`
- `docs/system_truth_map.md`
- `docs/audits/phase16/pass168_rdm_harness_closure_readiness_review.md`
- `docs/audits/phase16/pass172_rdm_truth_lane_closure_readiness_review.md`
- `services/src/blackskies/services/e2e_mode.py`
- `app/shared/modePolicy.ts`
- `app/renderer/testMode/testModeManager.ts`

## RDM-SYNTH-001 Scope
`RDM-SYNTH-001` is the lane that defines the authority limits of synthetic mode so synthetic success cannot be mistaken for real backend truth, real filesystem truth, persistence/readback truth, restore safety, operator workflow safety, or product readiness.

This lane is a proof-boundary lane. It does not implement synthetic behavior; it defines where synthetic evidence stops.

## Current Synthetic-Mode Surfaces Found
- `services/src/blackskies/services/e2e_mode.py`
  - defines e2e mode and the explicit synthetic bypass flag
  - distinguishes truth-lane verification from harness-only smoke that may opt into synthetic fixtures
- `app/shared/modePolicy.ts`
  - identifies synthetic mode and forbids it in truth lane
  - separates truth lane from harness/synthetic flags
- `app/renderer/testMode/testModeManager.ts`
  - routes harness/test-mode decisions through centralized policy helpers
  - supports harness visibility and diagnostic gating without making runtime truth claims
- `docs/specs/capability_truth_matrix.md`
  - states synthetic lanes can prove wiring, timing, and contract shape, but not backend/runtime truth
- `docs/system_truth_map.md`
  - classifies synthetic boundary evidence as A6 and blocks synthetic success from becoming runtime proof
- `docs/contracts/harness_fixture_contract.md`
  - establishes the lower-bound harness witness contract that synthetic lanes may rely on for setup, but not for runtime truth
- `docs/contracts/truth_lane_claim_matrix_contract.md`
  - blocks synthetic evidence from being promoted into truth-lane closure without real route and persistence/readback truth

## What Synthetic Evidence Can Prove
- wiring behavior
- timing behavior
- contract shape
- controlled stub/service response shape
- harness setup and lane readiness behavior when synthetic mode is explicitly enabled

## What Synthetic Evidence Cannot Prove
- real backend truth
- real filesystem truth
- persistence/readback truth
- restore safety
- operator workflow safety
- full product readiness
- truth-lane closure by itself

## How RDM-SYNTH-001 Consumes the Harness Fixture Contract
- The harness contract defines the lower-bound witness boundary.
- Synthetic lanes may reuse fixture roots, startup markers, and mocked services only as setup/witness evidence.
- Synthetic success must remain labeled as A6 evidence and cannot be elevated into runtime truth.
- If a synthetic lane uses harness fixture parity or startup dataset markers, it must still state that those markers are setup evidence, not product proof.

## How RDM-SYNTH-001 Consumes the Truth-Lane Claim Matrix Contract
- Synthetic evidence must not be treated as route truth.
- Synthetic evidence must not be treated as persistence/readback truth.
- Synthetic evidence may support a harness or contract-shape claim, but only if the claim explicitly stays within the synthetic boundary.
- The truth-lane claim matrix is the ceiling: synthetic evidence stops well below the required route + persistence/readback combinations.

## Known Overclaim Risks
- harness smoke and synthetic success being described as product truth
- route behavior under synthetic stubs being mistaken for real backend truth
- UI visibility under synthetic mode being mistaken for backend or filesystem authority
- fixture parity being mistaken for operator/project truth
- synthetic mode being used to claim restore safety or recovery safety
- synthetic mode being used to claim truth-lane closure

## Required Synthetic-Mode Authority Boundaries
- Synthetic mode is A6 evidence only.
- Synthetic mode may prove wiring, timing, and contract shape.
- Synthetic mode must not prove real backend, real filesystem, persistence/readback, restore, export, or operator workflow safety.
- Synthetic mode claims must name the evidence layer they prove and the claims they do not prove.
- Synthetic runs that depend on harness fixtures must still preserve the harness-contract witness boundary.

## Out-of-Scope Domains
- RDM-HARNESS-001 reopen
- RDM-TRUTH-001 reopen
- teardown governance implementation
- GUI redesign
- wrapper / launcher / CWD hardening
- Memory Lab
- export / packaging
- restore work
- `sc_0001` scene-authority cleanup
- runtime edits of any kind

## Proposed Next Implementation Boundary
The next implementation pass should be a narrow synthetic-mode authority contract pass that converts the boundary above into an explicit synthetic-mode claim matrix: what A6 can prove, what it cannot prove, and what wording must be avoided in docs and lane descriptions.

## Agent Mode Recommendation
Agent mode is useful before implementation. This lane benefits from a focused surface inventory so the synthetic boundary can be written without widening into runtime work.

## Human Spot-Check Recommendation
No human spot-check is required before this planning pass. Reserve human review for a future runtime-facing lane only if synthetic-mode behavior itself changes and needs user-visible validation.

## Final Recommendation
Proceed to a narrow `RDM-SYNTH-001` contract pass only after this scope note is accepted. Do not start runtime work yet.
