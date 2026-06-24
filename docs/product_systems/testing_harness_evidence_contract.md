# Testing / Harness / Evidence Contract

## 1. Status Header

- Dossier name: `Testing / Harness / Evidence Contract`
- Status: `drafted`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition lane`
- Product-definition maturity target: `Category 4`
- Last reviewed: `2026-06-09`
- Depends on: all build-bearing systems
- Feeds into: implementation planning, validation, and operational confidence
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `no`
- Hidden/background: `yes`

## 2. Purpose

Define the testing, harness, and evidence expectations that must exist before runtime behavior can be trusted or marked verified.
This dossier inherits evidence, protection, provenance, and degraded-mode boundaries from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `provenance_state_model.md`, `degraded_mode_execution_contract.md`, and `snapshot_protected_recovery_contract.md`.

## 3. User Problem Solved

The project needs proof that critical behavior, boundaries, and recovery rules actually hold rather than being assumed from doctrine alone.

## 4. Ownership And Non-Ownership

This contract owns:

- evidence vocabulary,
- claim-to-evidence boundaries,
- verification scope discipline,
- false-green prevention,
- stale and superseded evidence handling.

This contract does not own:

- product truth,
- runtime behavior,
- domain acceptance,
- test frameworks,
- CI systems,
- implementation readiness by itself.

Domain systems remain responsible for producing their own evidence.
Readiness claims stay with the owning or governing authority that actually observed the evidence.

## 5. Minimum Evidence Distinctions

Use a small useful set, not an oversized certification taxonomy:

- document or contract inspection
  - useful for reading doctrine, interface promises, and readiness rules
- fixture, mock, stub, or simulated evidence
  - useful for bounded setup and controlled scenarios, but never live proof by itself
- component or renderer evidence
  - useful for local UI or widget behavior inside a narrower execution boundary
- runtime evidence
  - useful for actual product behavior in the runtime under discussion
- packaged-application evidence
  - useful for the installed, bundled, or shell-level behavior that differs from loose local execution
- live-provider evidence
  - useful when the claim depends on a real external provider or service
- manual witness evidence
  - useful when a person or recorded human process directly observed the intended workflow
- degraded or offline evidence
  - useful when the claim is specifically about constrained or unavailable conditions
- historical versus current-revision evidence
  - useful for separating old observations from current behavior

## 6. Claim Boundaries

Every verification claim must identify, where applicable:

- subject or workflow tested,
- evidence type,
- source revision or build,
- environment,
- scope,
- observed result,
- limitations,
- freshness,
- protection constraints.

No claim may exceed what was directly observed.

Explicitly prevent:

- fixture evidence being called runtime proof,
- stub evidence being called live integration,
- renderer evidence being called packaged desktop proof,
- passing commands being called user-workflow proof without a witness,
- historical evidence being treated as current proof,
- harness self-reporting being treated as independent confirmation.

## 7. Evidence Lifecycle

Evidence states are:

- collected,
- reviewed,
- sufficient,
- insufficient,
- provisional,
- blocked,
- stale,
- superseded,
- no longer reproducible,
- deferred pending a required environment or witness.

Evidence does not become accepted product truth.
If evidence is stale or superseded, the claim must not present it as current without lineage.

## 8. Manual Witness

Manual witness is valid but bounded evidence.

It must record enough context to know:

- what was observed,
- by whom or by what recorded process,
- in which environment,
- against which revision,
- what supporting logs, screenshots, or traces exist,
- what remains unproven.

Screenshots and logs support a claim.
They do not automatically prove the entire workflow.

## 9. Degraded Evidence

Unavailable providers, missing hardware, offline operation, or unavailable packaging environments must be reported honestly.

Degraded evidence may support only the behavior actually observed.
Unproven claims remain explicit deferred obligations.
The contract must not convert a degraded path into proof of healthy-path behavior.

## 10. Protection And Provenance

Evidence artifacts must respect protected-content rules.

Logs, screenshots, traces, fixtures, and reports must not expose protected source material without governed permission.
Synthetic or generated test content must not be confused with author content or accepted project truth.
Provenance is part of the evidence record, not a license to reveal more than the governing protection rules allow.

## 11. Readiness Boundaries

This contract should make the following separations explicit:

- Category 4 means the evidence contract is product-definition mature.
- Architecture Readiness will later test architectural sufficiency.
- workflow proofs will later test cross-system behavior.
- vertical-slice evidence and implementation evidence require their own proof.
- no single generic `verified` state covers every readiness level.

The contract may support readiness claims, but it does not author implementation readiness by itself.

## 12. Surface And Reporting Expectations

This dossier is mostly non-user-facing.

Its visible effect is clearer confidence reporting, clearer failure proof, and narrower verification claims.
It should support evidence records and reports without turning the testing lane into a general product dashboard.

## 13. Deferred Decisions

Keep these open for later construction or later readiness work:

- exact framework choice,
- CI provider choice,
- coverage percentages,
- repository workflow syntax,
- test directory layout,
- screenshot tooling,
- packaging automation,
- concrete schemas,
- storage formats,
- runtime implementation details.

## 14. Acceptance Criteria

This dossier is acceptable only if:

- verification remains evidence-based and bounded,
- false-green cases are blocked by contract language,
- evidence classes remain distinguishable,
- manual witness is bounded and explicit,
- degraded evidence stays honest,
- protected-content rules remain intact,
- readiness claims do not overreach the observed evidence.
