# Foundation Audit Before V2

Date: 2026-08-03
Audit branch: `codex/foundation-audit`
Reference baseline: Package 19.22 closure commit `186a780`
Package 19.22 candidate: `c247bb86bf701c577e778356d60bf093a7319855`

## Decision at the boundary

Do not migrate the Package 19.22 baseline to `main` by merge, reset, or branch
replacement. The current closure branch is the only branch containing the
accepted Stage 19 writing-spine runtime and its qualification evidence.

`origin/main` is five commits ahead of the closure branch, but those commits
remove the Stage 19 writing-spine runtime, its dedicated-window tests, its
packaging and regression workflows, and the current salvage-shell authority.
That is a product-history divergence, not a routine fast-forward. Any future
integration must be a separately reviewed reconciliation that proves the V1
scope and exact-candidate evidence remain intact.

This audit is foundation work only. It does not design V2, authorize new
features, or change application behavior.

## Evidence captured

The following checks passed on the audit branch:

- current-authority documentation: 22 files, local links resolved, no stale
  public-release claim;
- tracked-path repository hygiene;
- app ESLint with the zero-warning ceiling;
- full app TypeScript boundary;
- full Vitest inventory: 102 files, 977 passed, 2 skipped;
- Python pytest suite: passed when given a writable project-local temporary
  root.

The full Stage 19 regression lane passed its static gates (hygiene, diff,
workflow policy, lint, TypeScript, production build, and the 31-file critical
unit matrix: 572 passed, 2 skipped). The first Electron test did not launch on
this workstation: Electron's GPU process exited with code `-1073741515`, no
window appeared, teardown escalated to `SIGKILL`, and the run was stopped. This
is an unresolved qualification-environment failure until reproduced on the
supported Windows and Linux lanes.

The backend command initially failed before test execution because this host
has Python 3.13 only, while the repository requires Python 3.11, and pytest's
default temp directory was inaccessible. With an explicit writable temp root,
the suite passed under 3.13. This proves the test code can run in that
environment; it does not prove Python 3.11 compatibility.

## Findings requiring foundation action

| ID | Severity | Finding and evidence | Required disposition |
| --- | --- | --- | --- |
| FND-001 | P0 process blocker | `origin/main` removes the current Stage 19 runtime, dedicated-window tests, and packaging/regression workflows. | Keep the closure branch as the reference. Create a separate reconciliation plan before any main-branch integration. Never overwrite the accepted baseline. |
| FND-002 | P1 evidence integrity | Tracked generated material exists under `app/temp-trace`, `build`, and `ci_artifacts`. A tracked PASS 3 receipt names commit `1947f94`, and a tracked PASS 4 receipt records `provider_called: true`; neither is current Package 19.22 evidence. | Inventory every tracked generated artifact, classify it as historical or authoritative, then untrack/archive stale evidence. Extend repository hygiene to reject generated traces, CI receipts, and provider-bearing receipts in the source tree. |
| FND-003 | P1 reproducibility | Seven `eval.yml` install steps use `pnpm install --recursive --no-frozen-lockfile`; the app-truth lane also uses the non-frozen form. | Use the committed lockfile for every qualification lane. A lockfile mismatch must fail, not silently rewrite the dependency graph. |
| FND-004 | P1 evidence integrity | The gauntlet manifest job downloads proof with `continue-on-error` and materializes `missing_artifact` placeholders. The placeholder is explicit, but the workflow does not itself run the verifier that rejects missing summaries. | Make proof verification a required job step. A successful manifest job must be impossible when any required artifact is missing, stale, or not `success`. |
| FND-005 | P1 qualification reliability | The critical Electron lane failed before the first window on this workstation with a GPU process exit and then leaked six Electron processes until explicitly cleaned up. A controlled headless retry then hit `EADDRINUSE` on `127.0.0.1:9999` before launching. | Reproduce on the supported CI/Windows lanes with process-leak and dynamically allocated-port receipts. Add a deterministic unsupported-host diagnostic and a hard teardown assertion; do not weaken assertions or add retries. |
| FND-006 | P1 coverage visibility | Vitest's two skips are the live-provider qualification case. Playwright contains opt-in analytics skips, a strict-visual skip, and a real-service reference skip. These are intentional but easy to mistake for coverage. | Emit a machine-readable skip inventory with test identity, reason, owner, and reopening trigger. Keep provider and visual lanes outside V1 unless separately authorized. |
| FND-007 | P1 truth/scope mismatch | Analytics is defaulted on in `feature_flags.py` and served by `analytics_stub.py`; the runtime truth ledger calls the analytics state `production`, while V1's core promise is offline writing without optional analysis systems. | Decide whether analytics is V1-supported, explicitly non-baseline, or disabled by default. Align code, UI exposure, health reporting, tests, and authority documents; do not leave “stub” behavior labelled production. |
| FND-008 | P2 portability | `services/pyproject.toml` contains the developer-machine path `C:/Dev/black-skies/services/whatever`. `services/requirements-dev.txt` is unpinned and conflicts with the locked root requirements. | Remove machine-specific configuration and make one documented dependency authority. Keep lock snapshots synchronized with the package manifests. |
| FND-009 | P2 architecture seam | `app/renderer/index.tsx` can render either the legacy `App` or the Stage 19 `Stage19WritingSpineApp`; the primary/secondary launch path depends on an experimental runtime flag and fallback behavior. | Produce a runtime-surface map before deleting or refactoring anything. Prove which path is packaged, which path is fallback-only, and that fallback cannot silently bypass V1 truth rules. |
| FND-010 | P2 security seam | Floating windows in `layoutIpc.ts` use `sandbox: false` even though context isolation and node integration are configured safely. Floating/docking is outside the required V1 core but remains reachable code. | Either remove the surface from packaged exposure or harden its sandbox/navigation/IPC contract before calling it supported. Add a focused security regression. |
| FND-011 | P2 deferred implementation | Provider adapters intentionally contain abstract `NotImplementedError` methods, and long-form execution returns explicit placeholder prose when no provider is available. | Keep these as deferred provider work only if the UI, health, docs, and telemetry clearly classify them as non-V1. Never present placeholder prose as successful authored output. |
| FND-012 | P1 test assurance | Coverage configuration declares a 60% branch threshold, but the normal CI/test scripts do not run coverage. When the declared command is run, the full services tree reports 32.15% coverage (13,699 statements; 8,464 missed) and fails the 60% gate. | Define the supported-core coverage denominator, exclude explicitly deferred code, then raise coverage with risk-weighted tests. Do not silently remove the threshold or claim coverage from the current green test count. |
| FND-013 | P2 repository hygiene | The hygiene checker bans common build/test artifacts but does not reject the tracked `build`, `ci_artifacts`, or `app/temp-trace` material found in this checkout. | Add rules and a migration procedure that preserve historical evidence outside the active source tree. Verify the package input remains unchanged after cleanup. |
| FND-014 | P2 package/size | The production renderer currently emits separate React, vendor, CodeMirror, and app chunks; the installer is approximately 89 MB. No size budget or regression receipt is enforced. | Measure unpacked/package size and startup cost before shrinking. Remove only proven dead/deferred inputs; set budgets after a baseline rather than optimizing blindly. |
| FND-015 | P1 security/evidence | `security.yml` deliberately turns `pip-audit`, Safety, pnpm audit, dependency-report generation, and load-ledger discovery into non-failing steps. If a tool fails before producing JSON, a synthetic `{"error": ...}` report is created and the final vulnerability parser can still pass; a missing load ledger skips SLO enforcement. | Preserve report upload, but fail closed when a scanner, report, or required ledger is missing or malformed. Distinguish “no findings” from “scan unavailable.” |
| FND-016 | P2 maintainability | The repository contains 1,801 tracked files and a very large historical documentation/evidence surface. The source tree also contains multiple legacy, salvage, prototype, analytics, provider, and optional UI families. | Build an ownership and reachability inventory before deleting or shrinking anything. Archive historical authority only after links, tests, package inputs, and current-authority references are reconciled. |

## What is not a defect yet

- `Smart Merge`, provider qualification, strict visual snapshots, and the real
  service reference spec are explicitly deferred or opt-in. They need owners
  and reopening triggers, not accidental inclusion in V1.
- `return None`, `pass`, and `NotImplementedError` matches are not by themselves
  stubs. They must be reviewed by call path and contract. The provider adapter
  abstract methods and long-form fallback are the first confirmed deferred
  seams; the remainder remains an inventory task.
- The existing Package 19.22 installer and the user's human writing-flow check
  remain valid closure evidence. The failed local Electron run is a new audit
  environment finding, not a retroactive invalidation of that exact Windows
  receipt.

## Repair order before any V2 discussion

1. **Freeze and reconcile authority.** Keep this branch separate, publish the
   branch/commit map, and decide the fate of the five `origin/main` commits by
   contract comparison—not by merge convenience.
2. **Make evidence and dependencies deterministic.** Remove non-frozen CI
   installs, require proof verification, establish Python 3.11 locally/CI, and
   eliminate tracked generated evidence from the active source tree.
3. **Restore executable confidence.** Re-run the Electron matrix on supported
   hosts, capture process-leak and window-creation evidence, and publish the
   exact skip inventory.
4. **Map and harden runtime seams.** Identify packaged entrypoints, legacy
   fallback behavior, floating windows, IPC trust boundaries, path/identity
   checks, service defaults, and lifecycle teardown. Add regression witnesses
   before refactoring.
5. **Audit deferred surfaces and remove ambiguity.** Classify analytics,
   provider adapters, placeholder output, salvage tooling, and optional UI as
   supported, disabled, or deferred. Update code and authority together.
6. **Measure cleanup and size.** Establish coverage, bundle, installer,
   startup, memory, and process budgets. Remove only dead or explicitly
   deferred inputs, then rerun the complete foundation gate.
7. **Human validation and closure.** After the repair batches, a human must
   launch the exact candidate, exercise create/open/edit/save/reopen/export and
   both windows, verify no data loss or crossover, and record an exact verdict.
   Only then should a docs-only audit closure be created.

## Audit exit criteria

The foundation audit is not complete when the code merely “looks cleaner.” It
is complete when every P0/P1 finding has reproducible evidence or a documented
blocker, every P2 item has an owner and disposition, every deferred seam has a
reopening trigger, the supported runtime path is unambiguous, and the complete
test/package/evidence ladder is repeatable from a clean checkout.

V2 planning begins only after those criteria are met. No V2 feature decision is
needed to perform this audit.
