# Playwright Teardown Governance Contract

## Purpose
Define teardown governance so teardown stability is treated as harness reliability evidence, not runtime or product proof.

## Evidence Class
- `teardown evidence`: cleanup, shutdown, and artifact-finalization behavior observed during harness, test, or CI execution.
- Teardown evidence is `A5` / `A6` dependent evidence only.
- Teardown evidence may support lane reliability claims, but it does not prove runtime truth.

## Authority Boundary
- Teardown stability is harness reliability evidence.
- Teardown stability is not product truth.
- Teardown cleanup success can show that the lane terminated cleanly.
- Teardown cleanup success cannot show that a product feature is correct.

## Teardown Surfaces Classified
- Playwright bootstrap cleanup:
  - harness startup and per-spec reset behavior, including cleanup markers and fixture residue resets.
- Startup fixture cleanup:
  - seeded fixture state, dataset markers, and pre/post spec cleanup paths.
- Browser / Electron process cleanup:
  - `electronApp.close()`, page-close fallbacks, and child-process exit handling.
- Backend process cleanup:
  - backend `SIGTERM` / `SIGKILL` shutdown paths and health-bound stop logic.
- Temp project directory cleanup:
  - repo-local temp roots, pytest base temp, and sandboxed Windows temp cleanup.
- Trace / artifact cleanup:
  - Playwright trace, report, and test-results persistence / finalization behavior.
- Pytest temp compatibility shim:
  - repo-local temp basetemp protection and dead-symlink cleanup guardrails.
- CI/local parity risks:
  - host ACL differences, path semantics differences, and cleanup behavior that only appears under CI or sandboxed hosts.

## What Teardown Stability Can Prove
- worker/process shutdown completes within the harness contract
- fixture residue is bounded within the harness lane
- temp cleanup behavior is deterministic enough for harness reliability
- trace/report finalization behaves as expected for the lane
- cleanup markers and shutdown ordering match the teardown contract

## What Teardown Stability Cannot Prove
- runtime truth
- product readiness
- restore safety
- filesystem authority
- truth-lane closure
- absence of fixture contamination everywhere in the repo
- absence of future teardown regressions in other lanes

## Fixture Residue / Cleanup Boundary
- Teardown may remove harness-managed residue.
- Teardown does not prove the selected project or fixture root is authoritative outside the lane.
- Cleanup success within the fixture boundary does not imply the real project is uncontaminated.

## Worker / Process Cleanup Boundary
- Worker exit, browser close, and backend shutdown are teardown reliability signals.
- A teardown failure must be classified before it is treated as a product failure.
- A clean worker exit does not prove backend/runtime correctness.

## Temp Directory Cleanup Boundary
- Repo-local temp directories and pytest basetemp cleanup are harness hygiene signals.
- Sandbox-host or ACL cleanup warnings are environment / harness concerns first.
- Temp cleanup success does not prove the product feature under test is correct.

## Trace / Artifact Boundary
- Trace and report finalization are evidence packaging concerns.
- Missing traces or late artifact uploads are diagnostic regressions, not product truth.
- Artifact finalization can support audits, but it is not proof of runtime correctness.

## Forbidden Overclaim Language
- Do not say teardown stability proves runtime truth.
- Do not say teardown stability proves product readiness.
- Do not say teardown stability proves restore safety.
- Do not say teardown stability proves filesystem authority.
- Do not say teardown stability proves truth-lane closure.
- Do not say teardown cleanup success proves no fixture contamination anywhere.
- Do not say no teardown failure means the product feature is broken without classification.

## How Teardown Evidence May Be Cited in Audits
- Name the teardown surface that was exercised.
- Name whether the evidence came from harness, synthetic, or real-service execution.
- Name the cleanup boundary that was validated.
- State the exact claim being made and the exact claims being withheld.
- Cite the result as harness reliability evidence, not runtime truth.

## Relationship to Harness Evidence
- Harness evidence is the lower-bound witness boundary.
- Teardown evidence is part of harness reliability evidence.
- Teardown evidence may reuse harness fixture state, but it still does not prove runtime truth.

## Relationship to Synthetic Evidence
- Synthetic evidence may participate in teardown runs, but synthetic success does not upgrade teardown into runtime proof.
- If synthetic mode is used, teardown evidence remains synthetic witness evidence plus harness cleanup evidence.

## Relationship to Truth-Lane Evidence
- Truth-lane evidence requires real backend route truth plus persistence/readback truth.
- Teardown evidence can support the truth-lane receipt process, but it cannot close a truth-lane claim by itself.
- Truth-lane teardown success is still only proof of orderly shutdown, not product truth.

## Closure-Grade Claim Rules
- A closure-grade teardown claim must name the teardown surface, the cleanup boundary, and the evidence layer.
- A closure-grade teardown claim may say the lane is reliable within harness scope.
- A closure-grade teardown claim may not say the product is correct, safe, or fully ready.
- If a teardown failure is observed, it must be classified before product blame is assigned.

## Downstream Dependency
- Future runtime/test-harness work that relies on teardown evidence must consume this contract before making proof claims.
