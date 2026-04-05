# Validation Failures and Blockers

## Purpose
This document records observed validation failures and classifies how they affect validation trust, environment stability, and roadmap readiness.

## Recording Rules

- Observed failures must be recorded even if they appear environment-specific.
- No failure should be silently dismissed as "just local" without evidence.
- Failures should be classified by the lane they affect.
- Failures should be ranked by how much they undermine trustworthy validation.

## Current Failure Inventory

### VF-001
- Title: Playwright worker spawn fails on Windows
- Lane Affected: Harness / UI-only Playwright
- Command: `cmd /c .\node_modules\.bin\playwright.cmd test tests/e2e/gui.insights.spec.ts --project=electron --workers=1`
- Observed Result: The previous `app/test-results/.playwright-artifacts-0` and `.last-run.json` failures were reduced by moving Playwright output to temp-sibling folders; the current failure is now `spawn EPERM` in the Playwright worker host before the spec body starts. A direct `fork()` probe against a trivial temp child with IPC also fails with `EPERM` in this workspace.
- Environment Notes: Observed in this Windows workspace after the output/report split was introduced. The old artifact-cleanup symptom no longer reproduces here, but the harness still cannot start a worker reliably. This now looks like a pipe/IPC child-process ceiling in the workspace rather than an artifact-path problem.
- Suspected Class:
  - workspace-specific
- Why It Matters: Harness validation is only trustworthy if the worker process itself can start. If Playwright cannot spawn its worker on Windows, the suite never reaches the test body and the result cannot be trusted.
- Blocks Truth Lane? no
- Blocks Memory Experiment? maybe
- Current Evidence: Direct command output from the attempted Playwright run; the error now comes from `WorkerHost.startRunner` with `spawn EPERM`, not from reporter cleanup. Direct `fork()` probes with IPC fail even for a trivial temp child, which sharply points to pipe-based child-process creation being blocked in this workspace.
- Needed Confirmation: Determine whether this pipe/IPC restriction is a local workspace ceiling, a sandbox policy, or a broader Windows environment restriction before any later hardening attempt is treated as durable.
- Proposed Next Action: Keep the worker-path failure explicit in docs and investigate whether the Windows validation environment can be changed to permit pipe-based child processes.
- Status: confirmed

### VF-002
- Title: Vitest / Vite transform hits `spawn EPERM`
- Lane Affected: Renderer/unit
- Command: `cmd /c pnpm --filter app test -- --run renderer/__tests__/DockWorkspace.test.tsx`
- Observed Result: The dedicated runner no longer loads `vite.config.ts`, but the suite still fails with `spawn EPERM` during Vite/esbuild transform and real-path resolution. Direct probes show that `esbuild.exe` can launch with inherited stdio, but spawning it with the pipe-based service protocol fails with `EPERM` in this workspace.
- Environment Notes: Observed in this Windows workspace during app-level unit-test startup. The failure moved from config-file bundling to the transform path, which means the runner is improved but still not reliable on Windows. The boundary now looks like pipe-based service startup, not path resolution.
- Suspected Class:
  - workspace-specific
- Why It Matters: Renderer/unit validation is not trustworthy if the runner fails before the suite starts. A broken transform path can make the repo appear healthier than it is by never exercising the test body.
- Blocks Truth Lane? no
- Blocks Memory Experiment? maybe
- Current Evidence: Direct stack trace from esbuild / Vite transform resolution, ending in `spawn EPERM`. Direct spawn probes show the native binary works with inherited stdio but fails when launched with the pipe-based service channel that Vite/esbuild requires.
- Needed Confirmation: Determine whether the pipe-based service launch is blocked by the workspace, a sandbox policy, or a broader Windows environment restriction before treating the runner as CI-durable.
- Proposed Next Action: Keep the failure boundary explicit and investigate whether this environment can support pipe-based child processes for the esbuild service channel.
- Status: confirmed

### VF-003
- Title: Remaining preload hook surface still provides harness escape hatches
- Lane Affected: Harness / validation trust
- Command: No single command. Observed through the preload inventory and containment review of `app/main/preload.ts`, `docs/reviews/preload_hook_inventory_and_containment.md`, and harness consumers.
- Observed Result: The broad preload surface is now fenced behind `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` in preload and launcher code. WP-10 removed the redundant `__selectSceneForTest` helper and collapsed the offline forcing path to dataset/event controls; WP-11 removed `__testApplyBudgetOverride` and moved the remaining active-flow, stable-dock, visual-stable, and recovery markers onto dataset/event controls. WP-11 also removed the broad `__testBudgetOverride` path and kept budget handling on the direct service-response path. The remaining harness-only cluster is now smaller and mainly consists of `data-test-needs-recovery`, `data-test-active-flow`, `data-test-stable-dock`, `data-test-stable-home`, `data-test-visual-stable`, `testModeFreezeServiceHealth` dataset handling, and the truth-safe marker `__testEnv`.
- Environment Notes: The authoritative truth lane no longer depends on these hooks, but harness runs still can. The remaining hooks are now fenced rather than free-floating, which reduces false confidence but does not remove the debt.
- Suspected Class:
  - repo-design
- Why It Matters: The remaining hooks can still make a harnessed run look more production-like than it is. That keeps false confidence alive even after the truth lane is fenced off.
- Blocks Truth Lane? no
- Blocks Memory Experiment? maybe
- Current Evidence: The preload inventory and containment document now show source fencing plus a smaller set of remaining harness-only dataset and event controls in renderer/test code.
- Needed Confirmation: Decide which of the remaining harness controls are still required, then remove or further fence the ones that are not.
- Proposed Next Action: Follow up with a narrower containment/removal pass on the remaining freeze, recovery, and mode-marker controls.
- Status: reduced

## Blocker Ranking

### Critical blockers
- VF-001 - Playwright worker spawn fails on Windows
- VF-002 - Vitest / Vite transform hits `spawn EPERM`

### High-priority blockers
- VF-003 - Remaining preload hook surface still provides harness escape hatches

### Medium-priority blockers
- None currently observed.

### Deferred but tracked
- The exact root causes for VF-001 and VF-002 are now more specific: both appear to hit pipe-based child-process restrictions in this workspace, but the broader environment cause still needs confirmation before any runner redesign is considered durable.
- The remaining harness controls are fenced or dataset-only but still need a later removal or formal exception pass.
- Sample-project loading is now project-local and deterministic, but `sample_project/Esther_Estate` and `sample_project/proj_esther_estate` still expose historical snapshot layouts that can confuse reviewers if the contract is not checked first.

## Recommended Next Work Package

### WP-07
- Title: Stabilize Windows validation runners and shrink remaining preload escape hatches
- Goal: Make the observed Playwright and renderer/unit validation paths reliable on Windows while continuing to reduce the preload surface that can fabricate harness success.
- Weaknesses / Failures Addressed: VF-001, VF-002, VF-003
- Why This Comes Now: The truth lane is now explicit and passing, but the surrounding validation lanes still have Windows-specific breakpoints and a harness surface that can create misleading green results.
- Risk if Skipped: Harness and renderer/unit validation will keep failing or staying over-permissive, which weakens confidence in the roadmap and makes memory-experiment readiness hard to justify.
- Dependencies: The current truth-lane launcher, the preload hook inventory, and a clean reproduction of the Windows runner failures.
- Evidence Needed Before Change: Reproduce the Playwright artifact failure and the Vitest/esbuild spawn failure on the current Windows workspace, and confirm which remaining preload hooks are actually required.
- Planned Output: A stable Windows validation path, clearer artifact handling, and a smaller set of harness-only preload controls.
- Validation Required: Rerun the affected Playwright and renderer/unit commands after the stabilization work, plus `git diff --check` and the truth-lane command.
- Memory Experiment Impact: Before kickoff.
- Notes for Human Review: Keep this pass narrow. Do not collapse it into a broad harness or preload refactor unless the root cause investigation proves that is necessary.

### WP-08
- Title: Finish Windows runner spawn hardening and remove the last harness escape hatches
- Goal: Make the remaining Playwright worker-spawn and Vitest esbuild-spawn breakpoints fail fast with explicit pipe-spawn preflight errors, then remove or formally quarantine the last harness-only preload and renderer overrides.
- Weaknesses / Failures Addressed: VF-001, VF-002, VF-003
- Why This Comes Now: The earlier containment pass reduced the broad fake-control surface, but the Windows runners still fail before they can provide trustworthy non-truth validation.
- Risk if Skipped: Validation will continue to fail or remain misleading on Windows, and the remaining harness hooks will keep the project one step away from false confidence.
- Dependencies: The dedicated truth lane, the current preload containment fence, and the dedicated Vitest/Playwright runner changes in this pass.
- Evidence Needed Before Change: Confirm whether the remaining `spawn EPERM` failures are Windows-policy, workspace, or launcher-design issues; confirm which remaining harness overrides are still required; confirm whether the environment can support pipe-based child processes at all.
- Planned Output: Explicit pipe-spawn preflight failures for the affected Windows runner lanes, a smaller explicit harness-only override set, and a cleaner blocker ledger.
- Validation Required: Rerun the affected Playwright and renderer/unit commands, plus `git diff --check` and `pnpm test:truth`.
- Memory Experiment Impact: Before kickoff.
- Notes for Human Review: Keep the work focused on Windows process/spawn reliability and the last real harness escape hatches. Do not broaden this into app feature changes.

## Relationship to the Existing Plan

- These failures sit downstream of the false-confidence reduction plan because they are the remaining places where a green result could still be misleading or where the validation pipeline does not complete cleanly.
- VF-001 and VF-002 are validation stability issues, not truth-lane design problems, but they still block trustworthy review of the harness and renderer/unit lanes.
- VF-003 is now mostly a containment issue: the broad preload surface is fenced, but the remaining harness-only overrides still need either removal or a formal exception.
- Together, these failures show why the roadmap should not advance on the basis of truth-lane success alone. The surrounding validation environment still needs to be made reliable enough that the rest of the test matrix can be trusted.
- Memory/intelligence experiment readiness depends on the same thing: a truth lane that passes, plus harness and renderer/unit lanes that fail for real reasons and do not hide behind environment noise.

## Exit Criteria for This Blocker Phase

- The Playwright artifact path can be exercised on Windows without EPERM cleanup or reporter-write failures.
- The Playwright runner can start its worker process on Windows without `spawn EPERM`.
- The renderer/unit runner can complete the suite on Windows without `spawn EPERM`.
- The remaining preload escape hatches are either removed or formally contained and documented as harness-only.
- Truth-lane validation still passes while the harness and unit lanes are retested.
- The blocker register can be updated from "observed" to "mitigated" or "resolved" for the Windows-specific runner failures.
- Reviewers can tell, from the docs alone, which failures are validation blockers and which are already contained.
