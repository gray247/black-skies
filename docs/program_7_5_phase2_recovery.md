# Program 7.5 Phase 2 recovery checkpoint

The authorized continuation is `codex/program7-5-stabilization`, starting at
`6523e515b8b05e4ab5d3859c7cb90396d6867351`. Phase 2 changes are a bounded
development checkpoint. They do not relabel the accepted `feee2e2e` installer,
grant AI admission, or establish Program 8 readiness.

## Reproduced baseline

Use Node 22.19.0, pnpm 8.15.9 and a separate Python 3.11.9 environment.
Keep `pnpm-lock.yaml`, `requirements.dev.lock`, package versions and the
existing package patch unchanged. The independent installation used a new
pnpm store and downloaded Electron; it did not reuse old worktree modules.
The Python environment uses the explicitly located machine interpreter,
with dependencies installed from the existing pinned requirements.

From the continuation root, the existing commands are:

```text
pnpm install --recursive --frozen-lockfile --store-dir <new-store>
<python311> -m venv <new-environment>
<new-environment>/Scripts/python -m pip install -r requirements.dev.lock
pnpm --filter @blackskies/app run build:production
pnpm typecheck:all
pnpm stage19:lint
pnpm --filter @blackskies/app run lint
pnpm --filter @blackskies/app run test
<new-environment>/Scripts/python -m pytest services/tests
```

On Windows, use a short, newly created test temporary directory **outside any
Git worktree**. Qualification-output guards intentionally reject Git-contained
output. Set both `TEMP` and `TMP`; isolate `APPDATA`, `LOCALAPPDATA`, Electron
user-data directories and `BLACKSKIES_DEV_LOG_BASE`. Keep normal GPU behavior
and disable real local AI for these synthetic tests. No original author project
or profile is a test input. Exact commands, environment overrides, initial
failures, counts and source hashes are recorded in the separate Phase 2 output
packet, `outputs/program-7.5-phase2-2026-10-19` in the parent workspace.

The unchanged baseline production build, type check, 1,571 app assertions
(two skips), 38 focused Python tests and two Electron startup/save/reopen
checks passed before application-source integration. The inherited lint
launcher failed under the actual checkout path containing spaces.

## Bounded repairs

- **P75-LINT-01:** both lint wrappers run the installed ESLint JavaScript entry
  through Node, without a command shell. Paths containing spaces and shell
  punctuation remain intact; ESLint arguments, zero-warning limits and exit
  codes are preserved. Four behavioral launcher tests cover success/failure.
- **P75-RESTORE-01:** legacy directory restore moves the previous target to a
  unique sibling backup before committing its replacement. A failed commit
  attempts rollback through the existing retry helper. If rollback also fails,
  the error identifies the preserved backup; it is never deleted as cleanup.
  Existing process-local path locking is reused. This is per-directory rollback,
  not a whole-project transaction or process-crash recovery guarantee.
- **P75-SNAPSHOT-01:** manual snapshot listing and retention exclude `.tmp`
  directories. In-progress work cannot displace the newest committed snapshot
  in the retention count. Existing snapshot IDs and commit helpers are retained.
- **P75-LOCAL-ONLY-01:** the legacy service router neither probes nor selects
  remote providers under `LOCAL_ONLY`, including policy-aware routing. Unsupported
  local tasks fail closed. Other routing policies and adapter capabilities remain
  unchanged; no model was run or admitted.
- **P75-ANALYTICS-01:** opt-in legacy analytics uses the shared project-ID
  validator and a canonical root confined to the configured project base,
  including budget reads. Invalid requests retain the existing structured
  validation-error envelope. The feature remains opt-in.
- **P75-DIAGNOSTICS-01:** service diagnostic redaction covers nested manuscript
  and credential fields and common credential patterns in messages/strings.
  Caller-owned detail objects are not mutated. This does not admit arbitrary
  sensitive data into diagnostics or change manuscript ownership.

## Retained boundaries and open verification

Original repositories, worktrees, recovery snapshots and historical evidence
are retained. The Phase 1 dispositions remain seven verified relocations,
ten unavailable historical references and eight unresolved evidence gaps.
New tests are separate evidence; no historical Fail, Uncertain or human decision
was rewritten.

Do not transplant the older broad preload, export controller, runtime witness,
or authority documents. The accepted Program 7 two-surface owners remain in
place. External-service token enforcement and the older rewrite-to-advisory
conversion need explicit contract review before integration. Blanket filesystem
reparse denial, new snapshot-ID schemes and model identity/provider changes are
not admitted by these repairs.

The full service suite on short temporary paths has one inherited metadata
failure: seven existing E2E specs lack harness/truth declarations. The metadata
test and all E2E spec inputs match the starting commit. Phase 3 should classify
those declarations with actual owner/retirement evidence; adding labels merely
to make a test pass would misrepresent qualification.

The fixed Stage 19 development gate passes 36 Electron cases. A separate
four-case Program 7 revision/Create-Develop run passes three and fails exact
source-passage viewport visibility after switching chapters and returning to
a revision task (P75-SOURCE-RETURN-01). Selection/focus succeeds, but the
first source line is outside the visible writing canvas. The failure was
reproduced with the accepted desktop source; its root cause is unresolved.
An animation-cancellation experiment did not qualify and was removed. The
accepted desktop implementation and E2E assertions remain unchanged. The
other three cases cover optional Foundation/Ideas behavior, changed-source
write blocking, and manual replacement through restart. This does not verify
the remainder of the failed revision workflow or all Program 7 features.

Source changes remain reviewable in the continuation working tree. A Stage 19
run with `--allow-dirty` is development evidence, never `CLEAN_RC_ELIGIBLE`.
Clean-candidate qualification, installed lifecycle, release packaging and any
human review remain later authorization boundaries. Phase 2 ends at the Phase 3
authorization gate.
