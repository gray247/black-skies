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
- Observed Result: The previous `app/test-results/.playwright-artifacts-0` and `.last-run.json` failures were reduced by moving Playwright output to temp-sibling folders; the current failure is now `spawn EPERM` in the Playwright worker host before the spec body starts.
- Environment Notes: Observed in this Windows workspace after the output/report split was introduced. The old artifact-cleanup symptom no longer reproduces here, but the harness still cannot start a worker reliably.
- Suspected Class:
  - mixed / uncertain
- Why It Matters: Harness validation is only trustworthy if the worker process itself can start. If Playwright cannot spawn its worker on Windows, the suite never reaches the test body and the result cannot be trusted.
- Blocks Truth Lane? no
- Blocks Memory Experiment? maybe
- Current Evidence: Direct command output from the attempted Playwright run; the error now comes from `WorkerHost.startRunner` with `spawn EPERM`, not from reporter cleanup.
- Needed Confirmation: Determine whether the worker spawn is blocked by Windows policy, workspace permissions, antivirus, or an environment restriction in this shell.
- Proposed Next Action: Triage Playwright worker spawning on Windows and confirm whether a worker-free launcher path exists before treating harness results as stable.
- Status: observed

### VF-002
- Title: Vitest / Vite transform hits `spawn EPERM`
- Lane Affected: Renderer/unit
- Command: `cmd /c pnpm --filter app test -- --run renderer/__tests__/DockWorkspace.test.tsx`
- Observed Result: The dedicated runner no longer loads `vite.config.ts`, but the suite still fails with `spawn EPERM` during Vite/esbuild transform and real-path resolution.
- Environment Notes: Observed in this Windows workspace during app-level unit-test startup. The failure moved from config-file bundling to the transform path, which means the runner is improved but still not reliable on Windows.
- Suspected Class:
  - mixed / uncertain
- Why It Matters: Renderer/unit validation is not trustworthy if the runner fails before the suite starts. A broken transform path can make the repo appear healthier than it is by never exercising the test body.
- Blocks Truth Lane? no
- Blocks Memory Experiment? maybe
- Current Evidence: Direct stack trace from esbuild / Vite transform resolution, ending in `spawn EPERM`.
- Needed Confirmation: Determine whether this is a Windows spawn policy issue, esbuild service startup problem, symlink/realpath handling, or an environment-level restriction.
- Proposed Next Action: Isolate the Vite/esbuild transform path on Windows and identify the smallest reproducible failure point.
- Status: observed

### VF-003
- Title: Remaining preload hook surface still provides harness escape hatches
- Lane Affected: Harness / validation trust
- Command: No single command. Observed through the preload inventory and containment review of `app/main/preload.ts`, `docs/reviews/preload_hook_inventory_and_containment.md`, and harness consumers.
- Observed Result: The broad preload surface is now fenced behind `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` in preload and launcher code. The remaining concern is a narrower harness-only cluster around `__testEnvForceOffline*`, `__testBudgetOverride`, `__testApplyBudgetOverride`, `__testModeFreezeServiceHealth`, `__selectSceneForTest`, `__testEnvNeedsRecovery`, and the truth-safe marker `__testEnv`.
- Environment Notes: The authoritative truth lane no longer depends on these hooks, but harness runs still can. The remaining hooks are now fenced rather than free-floating, which reduces false confidence but does not remove the debt.
- Suspected Class:
  - repo-design
- Why It Matters: The remaining hooks can still make a harnessed run look more production-like than it is. That keeps false confidence alive even after the truth lane is fenced off.
- Blocks Truth Lane? no
- Blocks Memory Experiment? maybe
- Current Evidence: The preload inventory and containment document now show source fencing plus a smaller set of remaining harness-only overrides in renderer/test code.
- Needed Confirmation: Decide which of the remaining harness overrides are still required, then remove or further fence the ones that are not.
- Proposed Next Action: Follow up with a narrower containment/removal pass on the remaining runtime-override, budget, and freeze globals.
- Status: mitigated

## Blocker Ranking

### Critical blockers
- None currently observed.

### High-priority blockers
- VF-001 - Playwright artifact cleanup fails on Windows `app/test-results`
- VF-002 - Vitest / Vite config load hits `spawn EPERM`
- VF-003 - Remaining preload hook surface still provides harness escape hatches

### Medium-priority blockers
- None currently observed.

### Deferred but tracked
- The exact root causes for VF-001 and VF-002 are still uncertain and must be confirmed before any broad fix is treated as durable.
- The remaining preload overrides are fenced but still need a later removal or formal exception pass.

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
- Goal: Eliminate the remaining Playwright worker-spawn and Vitest esbuild-spawn breakpoints on Windows, then remove or formally quarantine the last harness-only preload and renderer overrides.
- Weaknesses / Failures Addressed: VF-001, VF-002, VF-003
- Why This Comes Now: The earlier containment pass reduced the broad fake-control surface, but the Windows runners still fail before they can provide trustworthy non-truth validation.
- Risk if Skipped: Validation will continue to fail or remain misleading on Windows, and the remaining harness hooks will keep the project one step away from false confidence.
- Dependencies: The dedicated truth lane, the current preload containment fence, and the dedicated Vitest/Playwright runner changes in this pass.
- Evidence Needed Before Change: Confirm whether the remaining `spawn EPERM` failures are Windows-policy, workspace, or launcher-design issues; confirm which remaining harness overrides are still required.
- Planned Output: A runnable Playwright harness path, a runnable renderer/unit lane, and a smaller explicit harness-only override set.
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
