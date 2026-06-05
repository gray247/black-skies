# Synthetic Mode Claim Matrix Contract

## Purpose
Define the proof boundary for synthetic mode so synthetic success cannot be mistaken for real backend truth, real filesystem truth, persistence/readback truth, restore safety, operator workflow safety, or product readiness.

## Evidence Class
- `synthetic evidence`: controlled e2e execution that runs with explicit synthetic flags and stubbed or canned responses.
- Synthetic evidence is `A6` authority only.
- Synthetic evidence can support setup, wiring, timing, and contract-shape claims, but it cannot close runtime-proof claims on its own.

## Authority Boundary
- Synthetic mode is a governed witness lane, not runtime authority.
- Synthetic success may prove the synthetic boundary itself is wired correctly.
- Synthetic success may not be promoted into real-project truth or truth-lane closure.

## Enabling Flags
- `BLACKSKIES_E2E_MODE=1`
- `BLACKSKIES_E2E_SYNTHETIC_MODE=1`
- Synthetic mode must remain explicit; it is off by default.

## Blocking Rules
- Production mode must reject synthetic mode.
- Truth-lane mode must reject synthetic mode.
- Any run that depends on synthetic bypasses must label itself synthetic and must not claim live runtime truth.

## Production Ban
- Synthetic mode is forbidden in production.
- Synthetic helpers, canned responses, and stubbed routes are not a production truth source.

## Truth-Lane Ban
- Synthetic mode is forbidden in the truth lane.
- `scripts/truth-with-backend.mjs` must remain non-synthetic truth-lane evidence.
- If a truth-lane run is synthetic, it is no longer a truth-lane claim and must be treated as a synthetic witness run.

## Synthetic Response / Shortcut Surfaces
Synthetic mode may provide controlled responses for:
- preflight
- generate
- critique
- rewrite
- analytics budget
- snapshots
- backup verification
- recovery

Those shortcuts exist to prove wiring and contract shape only.

## What Synthetic Mode Can Prove
- wiring behavior
- timing behavior
- contract shape
- controlled stub/response shape
- harness setup and lane readiness when the synthetic boundary is explicit
- load-harness wiring in self-hosted synthetic mode

## What Synthetic Mode Cannot Prove
- real backend truth
- real filesystem truth
- persistence/readback truth
- restore safety
- operator workflow safety
- full product readiness
- truth-lane closure
- live load/performance truth

## Forbidden Overclaim Language
- Do not say synthetic success proves backend/runtime truth.
- Do not say synthetic success proves filesystem truth.
- Do not say synthetic success proves persistence/readback truth.
- Do not say synthetic success proves restore safety.
- Do not say synthetic success proves operator workflow safety.
- Do not say synthetic success proves truth-lane closure.
- Do not say synthetic success proves full product readiness.
- Do not say load-test synthetic success proves live load/performance truth.

## How Synthetic Evidence May Be Cited in Audits
- Name the synthetic flags that were enabled.
- Name the surface that produced the synthetic result.
- State the exact claim being made.
- State the exact claims that are not being made.
- Cite the result as `A6` witness evidence only.

## Relationship to Harness Evidence
- Harness evidence is the lower-bound witness contract.
- Synthetic mode may reuse harness setup, fixture parity, and startup markers only as witness evidence.
- Synthetic mode does not upgrade harness evidence into runtime truth.

## Relationship to Truth-Lane Evidence
- Truth-lane evidence requires non-synthetic route proof plus the required persistence/readback proof.
- Synthetic evidence cannot replace truth-lane evidence.
- Synthetic evidence may support a truth-lane investigation, but it cannot close the truth-lane claim by itself.

## Load-Harness Synthetic Caveat
- `scripts/load.py` self-hosted load runs explicitly opt into synthetic E2E mode.
- Those load runs are smoke/load-harness evidence only.
- Synthetic load success cannot be cited as live load/performance truth.

## Closure-Grade Claim Rules
- A closure-grade synthetic claim must name the `A6` boundary explicitly.
- A closure-grade synthetic claim must state that it proves wiring, timing, or contract shape only.
- A closure-grade synthetic claim must not claim runtime truth, filesystem truth, persistence/readback truth, restore safety, operator safety, or product readiness.
- If the claim is about load behavior, it must say synthetic load is harness evidence only.

## Downstream Dependency
- Future runtime-facing synthetic work must consume this contract before making proof claims.
- Future truth-lane work must continue to exclude synthetic evidence from closure-grade proof.
