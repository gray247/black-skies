# C6-6 — New Playwright E2E Test:
# gui.snapshot_dark_theme_regression.spec.ts

## Goal
Ensure snapshot + verification UI remains readable and stable under dark theme:
- Snapshot toast readable in dark mode
- Verification modal readable under dark theme (contrast rules)
- No washed-out text
- No missing elements
- No React errors

## Read Before Coding
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
- `docs/policies.md`
- `app/renderer/components/modals/VerificationModal.tsx`
- Dark theme tokens inside global CSS

## Instructions

1. Create new spec at `app/tests/e2e/gui.snapshot_dark_theme_regression.spec.ts`.
2. Bootstrap with `_bootstrap.ts`, load `sample_project/Esther_Estate`, wait for `[data-testid="dock-workspace"]`.
3. Switch app to dark mode via `document.body.dataset.theme = "dark";`.
4. Trigger snapshot button (`workspace-action-snapshot`) and confirm sticky toast with view report action is readable in dark theme.
5. Open verification report from the toast and assert the modal body (snapshot ID, timestamp, file list, integrity) remains visible plus close button exists.
6. Ensure no React errors/console errors appear.
7. Report "Created gui.snapshot_dark_theme_regression.spec.ts — verifies snapshot/verification UI readability under dark theme."
