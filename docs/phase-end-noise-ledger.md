# Phase-End Noise Ledger

| Signal | Where it appears | Classification | Status | Owner | Blocks phase exit |
| --- | --- | --- | --- | --- | --- |
| `MODE-LEAK` warnings during Playwright live-flow boots | `app/renderer/App.tsx`, `app/renderer/testMode/testModeManager.ts`, e2e boot logs | Test-only boot timing noise | Accepted debt, documented | E2E harness / test-mode bootstrap | No |
| `Invalid saved layout ignored; using default layout` | `app/renderer/components/docking/DockWorkspace.tsx` | Expected in fixtures that restore malformed layouts | Accepted debt, documented | Dock workspace tests | No |
| `Warning: An update to DockWorkspace/AnalyticsDashboard inside a test was not wrapped in act(...)` | Renderer unit tests | Test harness timing noise from async state updates | Accepted debt, documented | Renderer test suites | No |
| `Warning: An update to DockWorkspace inside a test was not wrapped in act(...)` | `renderer/__tests__/MemoryUsage.test.tsx` | Async remount timing in a memory-safety regression test | Accepted debt, documented | Renderer memory tests | No |
| `Failed to load resource: the server responded with a status of 404 (Not Found)` during boot | Playwright/electron console | Browser/fixture request noise seen during sample-project boot; current harness does not surface the exact URL | Accepted debt, documented | E2E harness / fixture assets | No |
| Electron security warning about CSP | Electron boot console | Environment warning in packaged/unpackaged dev boots | Accepted debt, documented | App packaging/runtime | No |
| Startup favicon 404 | Browser boot console | Product noise from default favicon request | Fixed by inline icon in `app/index.html` | Renderer shell | No |
| `contextIsolation=false; skipping expose ...` in unit tests | `app/main/preload.ts` tests | Unit-test-only bridge configuration noise | Accepted debt, documented | Main-process tests | No |

Notes:
- Anything not listed here should be treated as unexplained noise until classified.
- If a future phase removes one of these signals, update this ledger instead of reintroducing ambiguity in test logs.
