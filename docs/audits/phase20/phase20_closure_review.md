# Phase 20 - Closure Review

Status: Closed with exceptions
Date: 2026-05-18

## Determination

Phase 20 closes `Closed with exceptions`.

The shell-foundation objective is materially complete for the implemented one-window Split Command scope:

- Split Command now has a shell-owned state boundary in `app/renderer/App.tsx`
- shell persistence, reset, invalidation, and mode separation are implemented for the current shell lane
- layout ownership and command-center degradation rules are explicit
- listener and observer ownership is classified for the current shell surfaces
- fallback behavior is truthfully split between implemented reset paths and policy-only future fallback classes

Phase 20 does **not** prove long-session durability, true two-monitor support, a full diagnostics or operator layer, or a runtime forced-stable fallback path for non-recoverable shell activation failure. Those remain explicit exceptions rather than hidden claims.

## Runtime-Proven Behavior

The current runtime and renderer implementation prove:

- stable GUI remains the canonical default path when the Split Command runtime flag is off
- Split Command only activates through the explicit experimental runtime flag
- shell-owned state mutates through named shell actions and reducer paths
- shell-local persistence is isolated from stable GUI mode
- same-project shell state restores on reopen for the implemented persistence lane
- project-path changes invalidate project-scoped shell state
- corrupted shell persistence resets safely and stays shell-local
- unsupported shell schema resets safely and stays shell-local
- project-identity mismatch is classified as `recoverable-shell-failure` and handled as a shell-local reset
- shell reset notices remain inside Split Command mode and do not leak into stable GUI
- current one-window layout keeps Writing Studio primary and degrades Command Center first
- current shell resize listener, persistence write path, and shared health-listener classification are governed for the implemented shell lane

## Proven Test-Lane Behavior

The current green proof lanes cover:

- `DEFAULT_RUNTIME_CONFIG.ui.experimentalSplitCommandWorkspace === false`
- stable GUI default rendering when the experimental flag is off
- Split Command renderer activation when the flag is on
- same-scene selection churn suppression
- layout-mode diagnostic dedupe
- shell resize-listener cleanup and stable-GUI non-registration
- `useServiceHealth.ts` shared listener registration and cleanup behavior
- same-project shell-state restore
- cross-project shell-state invalidation
- corrupted persistence reset
- unsupported schema reset
- recoverable project-mismatch reset classification
- flag-off return to stable GUI mode without shell-state poisoning
- packaged Electron Split Command smoke through `tests/e2e/split-command-smoke.spec.ts`

## Policy-Only Behavior

The following are classified but **not** runtime-backed in Phase 20:

- `unsafe-shell-state` broader detection and forced handling
- `non-recoverable-shell-failure` runtime fallback
- `forced-stable-gui-fallback` runtime branch
- `degraded-shell-mode` runtime operator surface

These remain policy-only classifications. Phase 20 does not claim they exist as broader runtime behavior.

## Deferred Risks

- long-session flicker and durability are still not bounded by reproducible operator evidence
- shared health/debug observer churn is classified, but not deeply reworked
- Story Navigation discoverability remains deferred to Phase 21
- panel-admission governance is documented, not runtime-enforced
- diagnostics remains a debug-only foundation rather than a complete operator truth surface
- current shell fallback proof is strongest for reset/invalidation paths, not for future catastrophic activation failures

## Future Ownership

- Phase 21:
  - Story Navigation discoverability
  - any new panel proposal under the anti-fragmentation rule
  - any future operator-facing diagnostics growth, if justified
- Phase 22:
  - further layout density refinement if one-window ergonomics still need tuning
- Phase 25:
  - backend-drop investigation if stable GUI reproduces the same failures
- future dedicated safety lane:
  - broader runtime handling for `unsafe-shell-state`, `non-recoverable-shell-failure`, and `forced-stable-gui-fallback`

## Readiness Gate

Phase 21 implementation may begin only with these truths preserved:

- Split Command remains experimental and default-off
- future feature work stays inside the shell-owned authority model
- no new panel bypasses ownership, persistence, authority, and spatial-priority review
- policy-only fallback classes are not misrepresented as implemented runtime behavior
- deferred long-session durability risk remains visible in planning and QA

Phase 21 planning may begin. Phase 21 implementation must carry forward the explicit exceptions above instead of silently assuming they are solved.

## Validation Evidence

Validation for the final closure-proof pass:

- `pnpm --filter app test -- AppPreflight.test.tsx SplitCommandWorkspace.test.tsx splitCommandShellState.test.ts useServiceHealth.test.tsx`
- `pnpm --filter app lint`
- `pnpm --filter app exec playwright test tests/e2e/split-command-smoke.spec.ts -c ./playwright.config.ts --workers=1`
- `git diff --check`
- `git diff --cached --check`
- `git status --short`
