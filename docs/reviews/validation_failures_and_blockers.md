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
- Title: Playwright artifact cleanup fails on Windows `app/test-results`
- Lane Affected: Harness / UI-only Playwright
- Command: `cmd /c .\node_modules\.bin\playwright.cmd test tests/e2e/gui.insights.spec.ts --project=electron --workers=1`
- Observed Result: `EPERM: operation not permitted, rmdir 'C:\Dev\black-skies\app\test-results\.playwright-artifacts-0'` and `EPERM: operation not permitted, open 'C:\Dev\black-skies\app\test-results\.last-run.json'`
- Environment Notes: Observed in this Windows workspace after the harness spec ran long enough to create Playwright artifacts. The failure hits artifact cleanup / reporter output, not the truth lane.
- Suspected Class:
  - mixed / uncertain
- Why It Matters: Harness validation is only trustworthy if artifact creation and cleanup complete reliably. If Playwright cannot finish cleanly, later runs can be contaminated by leftover state or reporter failures.
- Blocks Truth Lane? no
- Blocks Memory Experiment? maybe
- Current Evidence: Direct command output from the attempted Playwright run; the error names the artifact directory and `.last-run.json`.
- Needed Confirmation: Determine whether the failure is caused by a stale lock, ACL issue, antivirus interference, Playwright reporter behavior, or a repo path/layout issue on Windows.
- Proposed Next Action: Triage the Playwright artifact path and reporter output handling on Windows before treating harness results as stable.
- Status: observed

### VF-002
- Title: Vitest / Vite config load hits `spawn EPERM`
- Lane Affected: Renderer/unit
- Command: `cmd /c pnpm --filter app test -- --run renderer/__tests__/DockWorkspace.test.tsx`
- Observed Result: `spawn EPERM` while loading `vite.config.ts` through esbuild before the target test executed
- Environment Notes: Observed in this Windows workspace during app-level unit-test startup. The failure occurs in the config/bootstrap path, not in the test body.
- Suspected Class:
  - mixed / uncertain
- Why It Matters: Renderer/unit validation is not trustworthy if the runner fails before the suite starts. A broken bootstrap path can make the repo appear healthier than it is by never exercising the test body.
- Blocks Truth Lane? no
- Blocks Memory Experiment? maybe
- Current Evidence: Direct stack trace from esbuild / Vite config loading, ending in `spawn EPERM`.
- Needed Confirmation: Determine whether this is a Windows spawn policy issue, esbuild service startup problem, Vite config load issue, or an environment-level restriction.
- Proposed Next Action: Isolate the Vite/esbuild startup path on Windows and identify the smallest reproducible failure point.
- Status: observed

### VF-003
- Title: Remaining preload hook surface still provides harness escape hatches
- Lane Affected: Harness / validation trust
- Command: No single command. Observed through the preload inventory and containment review of `app/main/preload.ts`, `docs/reviews/preload_hook_inventory_and_containment.md`, and harness consumers.
- Observed Result: `__testEnvForceOffline*`, `__testBudgetOverride`, `__testApplyBudgetOverride`, `__testModeFreezeServiceHealth`, `__testEnvActiveFlow`, `__testEnvStableDock`, `__testEnvVisualStable`, `__testEnvNeedsRecovery`, and `__testEnv` remain present after the containment pass.
- Environment Notes: The authoritative truth lane does not depend on these hooks anymore, but harness runs still can. These are still active in the renderer/test surface and can create fake stability or fake service state.
- Suspected Class:
  - repo-design
- Why It Matters: The remaining hooks can still make a harnessed run look more production-like than it is. That keeps false confidence alive even after the truth lane is fenced off.
- Blocks Truth Lane? indirectly
- Blocks Memory Experiment? maybe
- Current Evidence: The preload inventory and containment document list the remaining hooks and their harness consumers. Some are explicitly marked risky / should be removed.
- Needed Confirmation: Decide which of these hooks are still required, then remove or further fence the ones that are not.
- Proposed Next Action: Follow up with a narrower containment/removal pass on the remaining runtime-override and budget/freeze globals.
- Status: observed

## Blocker Ranking

### Critical blockers
- VF-003 - Remaining preload hook surface still provides harness escape hatches

### High-priority blockers
- VF-001 - Playwright artifact cleanup fails on Windows `app/test-results`
- VF-002 - Vitest / Vite config load hits `spawn EPERM`

### Medium-priority blockers
- None currently observed.

### Deferred but tracked
- The exact root causes for VF-001 and VF-002 are still uncertain and must be confirmed before any broad fix is treated as durable.

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

## Relationship to the Existing Plan

- These failures sit downstream of the false-confidence reduction plan because they are the remaining places where a green result could still be misleading or where the validation pipeline does not complete cleanly.
- VF-001 and VF-002 are validation stability issues, not truth-lane design problems, but they still block trustworthy review of the harness and renderer/unit lanes.
- VF-003 is a trust issue in the harness surface itself. The truth lane no longer depends on these hooks, but the hooks still exist and can make non-truth runs look cleaner than they are.
- Together, these failures show why the roadmap should not advance on the basis of truth-lane success alone. The surrounding validation environment still needs to be made reliable enough that the rest of the test matrix can be trusted.
- Memory/intelligence experiment readiness depends on the same thing: a truth lane that passes, plus harness and renderer/unit lanes that fail for real reasons and do not hide behind environment noise.

## Exit Criteria for This Blocker Phase

- The Playwright artifact path can be exercised on Windows without EPERM cleanup or reporter-write failures.
- The renderer/unit runner can load the Vite config and start the suite on Windows without `spawn EPERM`.
- The remaining preload escape hatches are either removed or formally contained and documented as harness-only.
- Truth-lane validation still passes while the harness and unit lanes are retested.
- The blocker register can be updated from "observed" to "mitigated" or "resolved" for the Windows-specific runner failures.
- Reviewers can tell, from the docs alone, which failures are validation blockers and which are already contained.
