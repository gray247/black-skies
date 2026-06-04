# Harness / Fixture Contract

## Purpose
Define the proof boundary for harness and fixture evidence so green harness lanes do not overclaim runtime truth.

## Fixture Roots Currently Used by the Harness
- `sample_project/Esther_Estate`
- `sample_project/proj_esther_estate`
- temporary project roots created by service tests
- renderer mocked bridge roots used by Playwright and renderer unit tests
- mocked filesystem roots used by harness fixtures and startup helpers

## Playwright Startup / Dataset Marker Contract
- startup markers are proof markers, not runtime proof by themselves
- dataset markers such as `projectLoaded`, `activeSceneId`, and `data-test-mode` are harness witnesses only
- startup snapshots and seeded dataset values must agree with the selected fixture root
- if startup markers disagree with the fixture, the run is a harness-contract failure, not a runtime success

## Synthetic Mode Boundary
- synthetic mode can prove wiring, timing, and contract shape
- synthetic mode cannot prove backend/runtime truth
- synthetic success must never be promoted into real-project correctness

## Truth-Lane Boundary
- truth-lane claims require a non-synthetic route plus persistence assertions
- truth-lane claims must check route truth and persistence truth, not UI visibility alone
- fixture-only or harness-only evidence cannot close a truth-lane claim

## What Harness Evidence Can Prove
- fixture materialization is complete for the selected alias/root
- startup markers converge on the expected project and scene context
- renderer behavior matches the harness contract
- negative-toast and degraded-state visibility remain observable
- teardown and cleanup behavior is bounded and deterministic within the harness lane

## What Harness Evidence Cannot Prove
- live project correctness outside the fixture boundary
- real backend safety or restore safety
- real filesystem authority beyond the seeded fixture scope
- current runtime truth when the lane used synthetic or mocked services
- operator/project truth when only dataset markers and fixtures agree

## Alias Parity Expectations
- `sample_project/Esther_Estate` and `sample_project/proj_esther_estate` are setup aliases, not separate operator truths
- alias parity is a harness setup contract
- alias parity does not prove current runtime identity on its own

## Negative-Toast / Degraded-State Expectations
- harness lanes must preserve visible failures and negative-toast behavior
- degraded-state visibility must remain explicit
- the harness must not normalize failure away to make the lane look green

## Teardown / Cleanup Caveat
- teardown must remain bounded and deterministic
- cleanup must remove fixture residue, but cleanup success does not prove runtime truth
- any new global helper, dataset marker, or cleanup rule must be added to the harness contract before it is trusted

## Human Spot-Check Expectation
- after the first runtime-aligned implementation pass that consumes this contract, run one focused human spot-check before closure
- the spot-check should confirm that harness-scoped evidence still matches live runtime expectations

## Authority Summary
- Harness / fixture evidence is A5 evidence
- Synthetic mode is A6 evidence
- Mocked bridge or mocked filesystem behavior is witness evidence only
- Debug logs are not authority
