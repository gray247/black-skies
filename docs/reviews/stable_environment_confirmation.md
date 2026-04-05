# Stable Environment Confirmation

## Purpose
This document is the final confirmation pass for the stabilization program. It records what is now stable, what remains limited, and whether the repository is stable enough to proceed into the next roadmap stage without overclaiming the validation signal.

## Confirmation Summary

- Stable now: the canonical authority docs are explicit, the truth lane is distinct from harness/UI-only lanes, repo hygiene enforcement exists, fixture/layout assumptions are documented, and the truth lane passes in this workspace.
- Still limited: Windows Playwright and renderer/unit validation remain blocked by pipe-based child-process ceilings in this workspace, and a small harness-only control surface still exists.
- Ready to proceed: yes, with constraints. The repository is stable enough to proceed because the truth lane is authoritative and passing, the non-truth lanes are honestly classified, and the remaining limitations are bounded, documented, and not being mistaken for truth.

## Truth Lane Status

- Authoritative truth command: `pnpm test:truth`
- Current status: passes in this workspace.
- What it proves: the real backend starts, the real Electron app launches, the renderer connects over CDP, the loaded real project is explicit, and the live preflight bridge works without service stubs or preload-only truth bypasses.
- What it does not prove: broad UI polish, harness-only interactions, backend-only behavior in isolation, or the ability of the Windows runner lanes to spawn pipe-based child processes in this workspace.

## Non-Truth Lane Status

- Harness/UI-only lanes are still useful, but they are not truth-bearing.
- Backend contract/state tests prove backend behavior, not renderer truth.
- Renderer/unit tests prove local renderer logic, not real-service readiness.
- Repo hygiene checks prove the tracked tree is clean, not that the product is correct.
- Current environment limitation: on this Windows workspace, Playwright workers and Vitest/esbuild service startup can hit `spawn EPERM` because pipe-based child processes are blocked here. That limitation is now explicit and fail-fast rather than hidden.

## Fixture / Layout Status

- Truth-lane fixture contract: the truth launcher materializes a temp `Esther_Estate` project root from the bundled sample snapshot, then loads it through the real backend and Electron path.
- Harness-lane fixture contract: harness tests use project-local sample data and explicit stubs or dataset/event markers; they do not claim production truth.
- Remaining compatibility debt: the historical `proj_esther_estate` layout still has compatibility snapshot materialization paths, but those are documented as bounded compatibility behavior, not canonical truth.

## Preload / Harness Control Status

- Residual harness-only controls still present: `__testEnv`, `__test`, `__dev`, `__testInsights`, `testMode`, `__testEnvFlatMode`, `__testEnvFullMode`, `__testEnvRecoveryMode`, `data-test-active-flow`, `data-test-stable-dock`, `data-test-stable-home`, `data-test-visual-stable`, `data-test-needs-recovery`, `testModeFreezeServiceHealth`, `test:select-scene`, and `test:force-offline`.
- Why they remain: they are still needed by explicit harness flows for scene selection, recovery, stable-layout setup, and test-mode routing.
- Why they are bounded enough for now: they are fenced behind harness-only gates or dataset/event paths and are documented as non-truth evidence. They do not appear in the truth lane.
- What they do not prove: production-safe behavior, real-service readiness, or architecture truth.

## Blocker / Limitation Status

### VF-001
- Current status: deferred but bounded.
- Blocks proceeding: no.
- Class: workspace-specific.
- Notes: Playwright worker spawn still fails on Windows in this workspace because pipe-based child-process creation is blocked here. The failure boundary is explicit and does not masquerade as a product regression.

### VF-002
- Current status: deferred but bounded.
- Blocks proceeding: no.
- Class: workspace-specific.
- Notes: Vitest/Vite/esbuild still fails on Windows in this workspace for the same pipe-based child-process ceiling. The failure boundary is explicit and does not masquerade as a product regression.

### VF-003
- Current status: reduced and deferred.
- Blocks proceeding: no.
- Class: repo-design.
- Notes: The remaining harness-only control surface is smaller and documented. It is still a false-confidence risk if overread, but it is now bounded enough to defer while roadmap work proceeds.

## Exit Criteria Review

The stabilization exit criteria are met for proceeding with constraints:

- Truth-lane tests are clearly separated from UI-only and harness-only tests.
- Validation commands are explicit and authoritative.
- Preload test hooks are reduced and formally contained.
- Fixture assumptions are documented and bounded.
- Repo hygiene enforcement is part of the baseline.
- Known Windows runner ceilings are explicit rather than hidden.

What is not met: full Windows runner parity for the non-truth lanes. That is still a known limitation, not a reason to treat the repository as unstable overall.

## Proceed / Do Not Proceed Decision

Proceed with constraints.

Constraints:
- Do not cite harness/UI-only runs as proof of production truth.
- Keep VF-001 and VF-002 classified as bounded Windows workspace limitations until the pipe-based child-process ceiling is addressed.
- Treat the remaining harness-only controls as non-truth evidence only.
- Preserve the truth lane as the authoritative validation path.

## Recommended Next Work

Proceed into the next roadmap stage or memory/intelligence experiment groundwork, while keeping the bounded Windows runner limitations and residual harness controls documented as known constraints.
