# Stage 19 Package 19.17 Closure

## 1. Decision

Package `19.17`, the fixed Stage 19 automated regression program, is formally
closed.

```text
PACKAGE_19_17_CLOSED
STARTING_AUTHORITY_COMMIT: b78b967
FIXED_GATE_COMMIT: d270da6
FINAL_QUALIFIED_COMMIT: 611fc06
WINDOWS_CLEAN_GATE: PASS
LINUX_CI_GATE: PASS
PROTECTED_EVIDENCE: NOT_USED
```

The fixed gate, its design, development qualification, and every corrected
portability/run-order finding are preserved in
`stage19_package_19_17_regression_program_and_qualification.md`.

## 2. Exact accepted gate

```text
pnpm stage19:regression
```

The command requires a clean worktree and runs:

- tracked-path and diff hygiene;
- historical app lint with an explicit six-warning ceiling;
- active Stage 19 lint with zero warnings;
- active Stage 19 renderer no-emit typecheck;
- renderer and main production builds;
- 19 critical unit/component/contract files; and
- six critical serial Electron files.

The exact final commit `611fc06` passed locally on Windows:

```text
worktree: CLEAN
historical lint: 0 errors, 6 bounded warnings
active lint: 0 errors, 0 warnings
active renderer typecheck: PASS
production build: PASS
critical contract tests: 519 passed, 2 contract-defined skips
critical Electron tests: 17 passed
final status: STAGE19_REGRESSION_PASS / CLEAN_RC_ELIGIBLE
```

GitHub Actions run
`https://github.com/gray247/black-skies/actions/runs/30230183707`
passed the same command on Linux for exact head
`611fc069d5397a8d0003e46c3c137c3099733697`.

## 3. Corrected qualification findings

Package `19.17` corrected:

- three historical lint errors while capping rather than hiding the remaining
  six warnings;
- missing active renderer type/lint boundaries;
- Windows `.cmd` launch handling in the fixed runner;
- active main-process lint types;
- hard-coded Windows paths in cross-platform qualification tests;
- a restored-active-unit Electron run-order assumption; and
- renderer-loss observation through the real renderer OS-process boundary.

The failed intermediate Linux runs are retained evidence that the fixed gate
failed closed and drove repair. They do not qualify earlier commits.

## 4. Honest exclusions and residuals

The closure does not claim:

- the broad historical renderer/test no-emit tree is green;
- the six legacy React-hook warnings are repaired;
- the ESLint legacy-config migration is complete;
- dependency audit evidence beyond the documented Security Audit threshold;
- packaging or installer qualification;
- physical two-monitor or 60–90 minute human experience acceptance; or
- Stage 19/V1.0 closure.

The preload sandbox and version metadata findings remain owned by Package
`19.19` before packaging. None is silently accepted by this closure.

## 5. Next package

Package `19.18`, Jason's manual acceptance against the stable development
build, is next and already explicitly authorized.

Codex may prepare and launch the stable development build and supply one
consolidated checklist. Jason alone supplies the acceptance judgment for:

- happy path;
- project isolation;
- required failure paths;
- a 60–90 minute real writing session; and
- two-monitor placement, restart, disconnect/reconnect, scaling, and recovery.

Package `19.18` must be performed once against the fixed build before Package
`19.19` packaging begins. Stage 19 and V1.0 remain open.

