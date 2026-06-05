# Pass 169 - RDM-TRUTH-001 Truth-Lane Authority Scope Planning

## Files Inspected
- `docs/contracts/harness_fixture_contract.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/specs/capability_truth_matrix.md`
- `docs/system_truth_map.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase16/pass168_rdm_harness_closure_readiness_review.md`
- `docs/tests.md`
- `scripts/truth-with-backend.mjs`
- `scripts/run_service_truth.py`
- `app/tests/e2e/truth.real-service.spec.ts`
- `app/tests/e2e/truth_active_scene_diagnostic.spec.ts`

## RDM-TRUTH-001 Scope
`RDM-TRUTH-001` is the lane that defines what the truth lane can prove, what it cannot prove, and what evidence it must collect before it can make a runtime or product-claim statement. It is a proof-boundary lane, not a product-implementation lane.

This lane must stay narrower than:
- full product readiness
- harness smoke success
- synthetic-mode success
- GUI correctness claims
- restore-safety claims
- wrapper/CWD or launcher claims

## What Truth-Lane Evidence Can Prove
- real backend route truth for the exercised path
- persistence/readback truth for the exercised path
- route and persistence agreement for the same project identity
- non-synthetic project/scene selection convergence where the lane requires it
- current, live behavior of the explicitly exercised truth surface

## What Truth-Lane Evidence Cannot Prove
- full product correctness
- GUI-wide stability
- harness-only or synthetic-only confidence
- restore safety unless restore is explicitly part of the lane and supported by persistence proof
- operator workflow safety beyond the exercised path
- fixture completeness by itself
- that a green smoke or harness run means live runtime truth

## How RDM-TRUTH-001 Consumes the Harness Fixture Contract
- `docs/contracts/harness_fixture_contract.md` is the lower-bound witness contract for fixture and harness evidence.
- Harness fixture parity, startup snapshots, and dataset markers are input evidence only; they do not become truth-lane proof on their own.
- Synthetic/harness success must be treated as setup or wiring evidence unless the truth lane also proves a real backend route plus persistence truth.
- If the truth lane reuses fixture roots or startup markers, it must still show non-synthetic route truth and persistence truth before making a claim.

## Existing Truth-Lane Surfaces Found
- `scripts/truth-with-backend.mjs` is the authoritative truth-lane launcher path and contains the real scene-selection and route/persistence checks.
- `scripts/run_service_truth.py` is the authoritative PASS 2 backend truth lane entry point.
- `app/tests/e2e/truth.real-service.spec.ts` is explicitly described as a reference scenario, not the authoritative receipt-producing lane.
- `app/tests/e2e/truth_active_scene_diagnostic.spec.ts` is a diagnostic guard for truth-lane active-scene readiness.
- `docs/tests.md` states that the truth lane is for real-service claims only.
- `docs/specs/capability_truth_matrix.md` already identifies the `App Truth Lane` as the workflow-truth gate.
- `docs/system_truth_map.md` already defines the truth-lane boundary as real backend + persistence + non-synthetic route path.

## Known Proof-Overclaim Risks
- treating harness-only evidence as if it were runtime truth
- treating synthetic success as if it were real backend truth
- treating route truth as if it were enough without persistence truth
- treating persistence truth as if it were enough without non-synthetic route proof
- treating diagnostic or smoke passes as proof of product readiness
- widening the lane into GUI, launcher, wrapper, Memory Lab, export, or restore claims

## Minimum Evidence Requirements for Future Truth-Lane Claims
- a real backend route was exercised
- persistence/readback was asserted for the same project identity
- the route and persistence results agreed
- the lane did not depend on synthetic-only stubs for the claimed truth
- the lane explicitly states what it does not prove
- any harness or fixture materialization used by the lane is clearly labeled as witness evidence only

## Out-of-Scope Domains
- Phase 15 backup/restore authority
- restore-as-copy implementation or performance work
- snapshot ontology
- recovery routes
- GUI redesign
- wrapper / launcher / CWD hardening
- Memory Lab
- export / packaging
- teardown governance
- synthetic-mode implementation
- `sc_0001` scene-authority cleanup

## Proposed Next Implementation Boundary
The next implementation pass should be a narrow truth-lane contract pass that converts the evidence boundary above into an explicit truth-lane claim matrix: which proof markers are required, which are merely witness markers, and which claims are forbidden unless route and persistence truth both exist.

## Agent Mode Recommendation
Agent mode is useful before implementation. This lane benefits from a focused pass that inventories truth-lane surfaces, maps claim boundaries, and checks for any stale wording that still overstates proof.

## Human Spot-Check Recommendation
No human spot-check is required before the planning pass. Reserve human review for the first runtime-facing truth-lane pass that actually consumes this scope contract.

## Final Recommendation
Proceed to a narrow `RDM-TRUTH-001` implementation-planning or contract pass only after this scope note is accepted. Do not start runtime work yet.
