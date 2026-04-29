# Phase 4 Warning Cleanup - Final State

## Summary
- CSP warning: resolved
- NO_COLOR/FORCE_COLOR: partially mitigated, deferred for shell-level control
- Dock layout warning: classified, deferred

## Resolved Warnings

### Electron CSP warning
- root cause:
  - the renderer HTML template shipped with no CSP, so Electron warned when loading `app/dist/index.html`.
- fix:
  - added a conservative CSP meta tag to `app/index.html`.
- validation results:
  - `pnpm --filter app run build:production` passed.
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line` passed.
  - `pnpm test:e2e -- --workers=1` passed.
- risk level:
  - low after validation.

## Deferred Warnings

### NO_COLOR / FORCE_COLOR
- current behavior:
  - Node/Playwright can still emit `Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.`
- why partially fixed:
  - repo-side launcher and Playwright env sanitization remove the contradiction in controlled launch paths.
- why remaining issue is environment-level:
  - a parent shell can still inject both variables before Node starts, so direct shell-level runs may still warn.
- recommended future handling:
  - optionally add a shell-level normalization layer or launch wrapper that clears `NO_COLOR` whenever `FORCE_COLOR` is already set.

### Dock Layout Warning
- root cause:
  - `sanitizeLayoutNode(...)` rejects legacy or mismatched saved layout payloads, including historical fixture layouts that do not match the current required schema.
- why safe fallback is acceptable:
  - the app intentionally ignores invalid saved layouts and falls back to the default layout, which keeps startup deterministic and avoids corrupting user state.
- recommended future phase:
  - layout migration and versioning strategy, so legacy layouts can be normalized instead of repeatedly rejected.

## Validation Evidence
- contract lane: 11 passed
- smoke lane: 3 passed
- CSP warning removed
- no regressions introduced

## Final Status
- Phase 4.2 Warning Cleanup: COMPLETE (with documented deferred items)
