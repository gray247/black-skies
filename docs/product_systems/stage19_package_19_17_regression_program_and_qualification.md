# Stage 19 Package 19.17 Regression Program and Qualification

## 1. Authority and purpose

Jason explicitly authorized Package `19.17` on 2026-07-26 after authorizing
Codex to complete Packages `19.16` and `19.17` autonomously and to prepare
Package `19.18` for one human acceptance pass.

Package `19.17` begins from formally closed Package `19.16` authority commit
`b78b967`. Its exit gate is one fixed CI/RC regression program that passes
without protected evidence. It qualifies the stable development path; it does
not qualify an installer, perform Package `19.18` human acceptance, or close
Stage 19/V1.0.

## 2. Fixed command

```text
pnpm stage19:regression
```

The command fails closed if the worktree is dirty. During gate development
only, `pnpm stage19:regression --allow-dirty` permits execution but labels the
result `DEVELOPMENT_OVERRIDE`; that result is not RC-eligible.

The fixed command is implemented by `scripts/stage19-regression.mjs`. Linux CI
uses `xvfb-run` automatically when no display is present. Windows runs the same
phase list directly.

## 3. Fixed phase list

The command runs these phases in order and stops at the first failure:

1. clean-worktree policy;
2. tracked-path repository hygiene;
3. `git diff --check`;
4. historical app lint with a six-warning ceiling;
5. active Stage 19 lint with a zero-warning ceiling;
6. active Stage 19 renderer no-emit typecheck;
7. renderer and main production build;
8. 19-file critical unit/component/contract matrix; and
9. six-file, 17-scenario serial Electron matrix.

The final Electron matrix covers:

- stable startup and project lifecycle;
- dirty/Save/close and restart/reopen behavior;
- per-unit undo/redo isolation;
- recovery accept/reject, corruption, renderer loss, and fresh-process restart;
- Command Center status and cross-project isolation;
- bounded optional AI Critique;
- Axe WCAG A/AA checks on both populated windows; and
- the 100-unit performance regression.

No phase reads evidence partition E. Tests create disposable partition-B
projects and use repository-owned non-protected fixtures/contracts only.

## 4. Static gate design

### Historical app baseline

Package `19.16` inherited three lint errors and six React-hook warnings. Package
`19.17` removes the unused helper/import errors and records the intentional
focusable-scroll-region `main` exception in ESLint policy. The full historical
app lint now has zero errors.

The remaining six hook warnings are not hidden: `run-app-eslint.mjs` enforces
`--max-warnings 6`, so any new warning fails the gate and any repaired warning
reduces the baseline naturally.

### Active Stage 19 baseline

`run-stage19-eslint.mjs` enumerates the production main/preload/renderer/shared
files and six Electron specifications with `--max-warnings 0`.

`app/tsconfig.stage19-renderer.json` supplies an exact strict no-emit boundary
for the active renderer and its IPC contracts. The main process is checked by
the authoritative `tsconfig.main.json` production build.

The broad historical renderer/test no-emit tree remains excluded and is not
misrepresented as green. That migration remains documented maintenance debt.

## 5. CI lane

`.github/workflows/stage19-regression.yml` runs the same clean command on:

- pushes to `main`;
- pushes to `salvage/minimal-two-surface-shell`;
- pull requests; and
- manual workflow dispatch.

It installs frozen lockfile dependencies, supplies the Linux Electron display
runtime, runs the fixed command, and retains Playwright diagnostics only on
failure. The workflow does not silently retry or regenerate snapshots.

Security Audit workflow run `30194842915` remains the Package `19.16`
dependency-vulnerability evidence for the unchanged lock inputs. The fixed
regression lane does not duplicate a registry audit or transmit new dependency
metadata.

## 6. Development qualification result

The first complete development-mode execution passed on Windows:

```text
historical app lint: PASS, 0 errors, exactly 6 bounded warnings
active Stage 19 lint: PASS, 0 errors, 0 warnings
active Stage 19 renderer typecheck: PASS
production build: PASS, 463 renderer modules plus main TypeScript build
critical tests: 19 files passed; 519 passed; 2 contract-defined skips
Electron: 17 passed in approximately 1.6 minutes
100-unit creation: approximately 3440.6 ms
unit-100 selection: 86 ms
protected evidence: NOT_USED
final status: STAGE19_REGRESSION_PASS / DEVELOPMENT_OVERRIDE
```

The JSON `INVALID/SAFE_STOP` line emitted during the contract matrix is the
expected redacted stderr from a negative child-process score-import test. The
parent test and aggregate pass.

The gate also proved that omitting `--allow-dirty` while implementation changes
were present stops immediately with an explicit clean-worktree failure.

## 7. Corrected gate findings

### `BS-19.17-F01` — Windows child-command launch

The first development attempt reached the production-build phase but Windows
rejected direct `spawnSync` of `pnpm.cmd` with `EINVAL`. The runner now enables
the Windows command shell only for `.cmd` launchers. The complete rerun passed.
This was a gate implementation defect, not an application defect.

### `BS-19.17-F02` — active main lint types

The new zero-warning lint boundary found an `any` in the AI IPC registration
helper and the intentional Windows control-character filename regex. The IPC
helper is now generic over its request type, and the regex exception is
documented at the exact line. Main TypeScript compilation and the critical
tests pass after both corrections.

### `BS-19.17-F03` — cross-platform qualification paths

The first exact-commit Linux run reached the critical contract matrix and
correctly rejected two test-only Windows path assumptions. The AI
qualification-artifact test hard-coded `C:\Dev\black-skies`, and the Markdown
filename test supplied Windows separators to Linux's native path parser.

The tests now derive the repository root from `import.meta.url` and construct
test destinations with the host path library. This preserves the Windows-safe
product contract while allowing the same non-product qualification witnesses
to run on Windows and Linux. The affected 266-test aggregate passes on Windows
after correction; the superseding exact-commit CI run is required below.

## 8. Remaining qualification

Package `19.17` closure requires:

1. commit the fixed gate and this record;
2. run `pnpm stage19:regression` from that clean committed state;
3. push the commit;
4. obtain a successful `Stage 19 Fixed Regression Gate` GitHub Actions run for
   that exact commit; and
5. synchronize Package `19.17` closure/current-roadmap authority.

Until those five steps complete, this record is implementation qualification,
not the Package `19.17` closure receipt.
