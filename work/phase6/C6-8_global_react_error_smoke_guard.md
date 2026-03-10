# C6-8 — New Playwright E2E Test:
# gui.global_react_error_smoke_guard.spec.ts

## Goal
End-to-end smoke guard:
- App boots cleanly
- Sample project opens without React/console errors
- Floating panes open without reference/projectPath errors
- Dock workspace stable

## Read Before Coding
- `dock-workspace.spec.ts`
- `gui.flows.spec.ts`
- Known Phase 6 regression notes (projectPath, floats)

## Instructions
1. Create `app/tests/e2e/gui.global_react_error_smoke_guard.spec.ts`.
2. Bootstrap via `_bootstrap.ts`, open sample project, wait for dock workspace.
3. Attach console/page error listeners that throw on `msg.type() === 'error'` or `pageerror`.
4. Open a floating Insights pane via dock controls, ensure it renders without `projectPath` issues (no red overlay).
5. Verify all panes appear, hidden-pane dropdown works, no crashes on focus/close.
6. Expected output: “Created gui.global_react_error_smoke_guard.spec.ts — provides full app stability smoke test.”
