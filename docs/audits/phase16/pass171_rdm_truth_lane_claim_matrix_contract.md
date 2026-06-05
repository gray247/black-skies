# Pass 171 - RDM-TRUTH-001 Truth-Lane Claim Matrix Contract

## Files Changed
- `docs/contracts/truth_lane_claim_matrix_contract.md`
- `docs/specs/capability_truth_matrix.md`
- `docs/system_truth_map.md`
- `docs/tests.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase16/pass171_rdm_truth_lane_claim_matrix_contract.md`

## Contract Summary
This pass defines the truth-lane claim matrix so truth-lane evidence is separated into route truth, persistence/readback truth, UI witness evidence, harness witness evidence, synthetic evidence, backend-only truth, and artifact/receipt evidence.

The contract makes the lane explicit about what it can prove and what it cannot prove. It also blocks the common overclaim failure mode where a passing harness or synthetic run is treated as product/runtime truth.

## Truth-Lane Surfaces Classified
- `scripts/truth-with-backend.mjs`: authoritative receipt-producing truth lane.
- `scripts/run_service_truth.py`: backend/service truth only; not renderer/product truth.
- `app/tests/e2e/truth.real-service.spec.ts`: real-service reference/sanity probe; not authoritative receipt-producing truth.
- `app/tests/e2e/truth_active_scene_diagnostic.spec.ts`: HARNESS_ONLY diagnostic witness evidence; not truth proof.

## Route / Persistence Boundary Summary
- Health: route reachability and liveness only.
- Analytics summary / scenes: route contract behavior and identity checks; not persistence truth by itself.
- Draft preflight: route contract behavior for readiness; not persistence truth by itself.
- Critique: route truth for the exercised path; closure-grade only when paired with required persistence/readback evidence.
- Rewrite: route truth for the exercised path; closure-grade only when paired with required persistence/readback evidence.
- Accept: route truth plus persistence/readback truth for accepted content and snapshot materialization.
- Snapshots: route truth plus snapshot materialization/readback truth.
- Recovery: route truth plus recovery-state readback truth.
- Backup verifier report: backend route truth plus persisted report/readback truth.
- Export artifact: route truth plus artifact/receipt evidence and on-disk export existence.

## Overclaim Language Blocked
- Harness success proves runtime truth.
- Synthetic success proves live backend truth.
- Route success alone proves persistence truth.
- UI visibility proves backend or filesystem authority.
- A reference or diagnostic spec is the authoritative truth lane.
- The truth lane proves full product readiness.

## Out-of-Scope Domains
- RDM-HARNESS-001 reopen
- RDM-SYNTH-001 implementation
- RDM-TEARDOWN-001 implementation
- GUI redesign
- wrapper / launcher / CWD hardening
- Memory Lab
- export / packaging
- restore work
- `sc_0001` scene-authority cleanup

## Validation Results
- `git diff --check` passed.
- `pnpm lint:docs` passed.

## Human Spot-Check
- Not required for this docs-only claim-matrix pass.
- Reserve human review for a runtime-facing truth-lane pass that consumes the contract.

## Recommended Next Pass
- A narrow `RDM-TRUTH-001` implementation-planning or contract-consumption pass that uses this matrix to map exact proof markers and forbidden claims into the live truth-lane docs.

