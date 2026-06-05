# Truth Lane Claim Matrix Contract

## Purpose
Define the proof boundary for `RDM-TRUTH-001` so truth-lane claims can only be made when the evidence actually supports them.

## Evidence Classes

- `route truth`: the real backend route was exercised and returned the expected contract-level result.
- `persistence/readback truth`: the effect was written to disk or read back from storage and verified on the same project identity.
- `UI witness evidence`: the renderer showed the expected state, but the UI alone does not prove backend/runtime truth.
- `harness witness evidence`: fixture, startup, dataset, and mocked-bridge proof markers that support setup and lane readiness, but do not prove runtime truth.
- `synthetic evidence`: controlled stubbed or synthetic execution used for wiring/timing/contract-shape checks only.
- `backend-only truth`: backend route + persistence/readback evidence without making a renderer or operator-workflow claim.
- `artifact/receipt evidence`: receipt files, attachments, and saved diagnostics that record scoped evidence for review, but do not become product truth by themselves.

## Forbidden Overclaim Language

- Do not say harness success proves runtime truth.
- Do not say synthetic success proves live backend truth.
- Do not say route success alone proves persistence truth.
- Do not say UI visibility proves backend or filesystem authority.
- Do not say a reference or diagnostic spec is the authoritative truth lane.
- Do not say the truth lane proves full product readiness.

## Required Evidence Combinations

- `route truth` + `persistence/readback truth`:
  - required for closure-grade claims about real service behavior where persistence is part of the claim.
- `route truth` alone:
  - acceptable only for route reachability or contract-behavior claims that explicitly do not claim persistence truth.
- `persistence/readback truth` alone:
  - acceptable only for scoped readback or filesystem claims that explicitly do not claim route proof.
- `harness witness evidence` + `synthetic evidence`:
  - acceptable only for setup, readiness, and contract-shape claims.
- `UI witness evidence`:
  - acceptable only as supporting evidence when paired with the required backend truth for the claim being made.

## Surface Classification

### `scripts/truth-with-backend.mjs`
- authoritative receipt-producing truth lane
- may collect route truth, persistence/readback truth, and artifact/receipt evidence for the truth-lane claim set

### `scripts/run_service_truth.py`
- backend/service truth lane
- proves backend-side truth and backend contract behavior
- does not by itself prove renderer/product truth

### `app/tests/e2e/truth.real-service.spec.ts`
- real-service reference and sanity probe
- useful as reference evidence
- not the authoritative receipt-producing truth lane

### `app/tests/e2e/truth_active_scene_diagnostic.spec.ts`
- HARNESS_ONLY diagnostic witness evidence
- useful for readiness diagnosis
- not truth proof

## Route / Persistence Boundary Summary

### Health
- proves route reachability and liveness only
- does not prove persistence truth

### Analytics summary / scenes
- proves route contract behavior for the loaded project
- can support route truth and project identity checks
- does not prove persistence truth by itself

### Draft preflight
- proves route contract behavior for readiness checks
- does not prove persistence/readback truth by itself

### Critique
- proves route truth and response truth for the exercised path
- becomes closure-grade only when paired with the required claim-specific persistence evidence

### Rewrite
- proves route truth and response truth for the exercised path
- becomes closure-grade only when paired with the required claim-specific persistence evidence

### Accept
- proves route truth plus persistence/readback truth for accepted scene content and snapshot materialization

### Snapshots
- proves route truth plus snapshot materialization/readback truth for the exercised path

### Recovery
- proves route truth plus recovery-state readback truth for the exercised path

### Backup verifier report
- proves backend route truth plus persisted report/readback truth

### Export artifact
- proves route truth plus artifact/receipt evidence and on-disk export existence

## Closure-Grade Claim Rules

- A closure-grade truth-lane claim must name the evidence class for each statement it makes.
- If the claim includes persistence or filesystem correctness, it must include a non-synthetic route proof and a matching readback/persistence proof.
- If the claim includes UI behavior, it must state that UI visibility is witness evidence unless backed by the required backend truth.
- If the claim uses harness or synthetic execution, it must explicitly say that the result is setup/witness evidence only.
- If the claim is only about route availability, it must not imply persistence or full-product readiness.

## Downstream Contract

- Future truth-lane work must consume this contract before making product/runtime proof claims.
- Harness evidence remains witness evidence even when it is green.
- Synthetic evidence remains witness evidence unless the lane also proves the required real-route and persistence/readback truth.
