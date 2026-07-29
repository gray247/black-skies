# Stage 19 Package 19.19 Qualification

## 1. Qualified identity

Package `19.19`, packaging and installation proof, qualifies exactly:

```text
IMPLEMENTATION_COMMIT: 85c1524d486cf42d93fa057e3e8c00376071e8fb
VERSION: 1.0.0-rc1
PLATFORM: Windows 11 x64
TARGET: assisted per-user NSIS
INSTALLER: BlackSkies-Setup-1.0.0-rc1.exe
INSTALLER_BYTES: 89318050
INSTALLER_SHA256: 3f59db2f17566a99a269968cd9dba7785646cc7652f4948cb99dc4d1c163a0e0
SIGNATURE_STATUS: NotSigned
PROTECTED_EVIDENCE: NOT_USED
```

This is an unsigned internal release candidate. It is not claimed to be
publicly signed, SmartScreen-trusted, or approved by Package `19.20`.

The GitHub artifact is
`black-skies-1.0.0-rc1-85c1524d486cf42d93fa057e3e8c00376071e8fb`,
artifact ID `8740270981`. Its archive digest is
`sha256:92f5e08a35cf5d521206242425f531c3b6fb9a7f166fcaee749a3660be90ff15`
and its bounded retention expires 2026-08-12.

## 2. Exact-commit regression evidence

The clean local Windows command:

```text
pnpm stage19:regression
```

passed exact implementation commit `85c1524` with:

```text
tracked worktree: clean
historical lint: 0 errors, 6 bounded warnings
active lint: 0 errors, 0 warnings
active renderer typecheck: PASS
production build: PASS
unit/contract tests: 539 passed, 2 intentional skips across 24 files
Electron integration: 18 passed
final status: STAGE19_REGRESSION_PASS / CLEAN_RC_ELIGIBLE
protected evidence: NOT_USED
```

Before the full gate, the corrected live-document Save path also passed its
focused component set and ten consecutive redo-then-Ctrl+S Electron
repetitions.

GitHub Actions run
`https://github.com/gray247/black-skies/actions/runs/30492203812`
passed the fixed Linux Stage 19 regression gate for the same full commit SHA.

## 3. Clean Windows package and installed lifecycle

GitHub Actions run
`https://github.com/gray247/black-skies/actions/runs/30492203867`
used a clean Windows runner, frozen dependencies, and the same full commit SHA.
It passed, in order:

1. the fixed Stage 19 regression gate;
2. the NSIS build with signing disabled and publishing forced off;
3. the fail-closed pre-install artifact verifier;
4. silent per-user installation;
5. registration, uninstaller, Start Menu, desktop shortcut, and icon checks;
6. outbound-firewall-isolated installed application smoke;
7. silent uninstall and external-data preservation checks; and
8. post-success upload of only the installer and qualification receipt.

The machine-readable receipt reports:

```text
app.isPackaged: true
window count: 2
sandboxed window count: 2
forbidden runtime process count: 0
offline firewall rule applied: true
exact Markdown bytes matched: true
exported unit count: 3
external project preserved: true
external export preserved: true
application removed by uninstall: true
```

The installed smoke launched the real installed executable without
`PLAYWRIGHT=1`, provider credentials, a development server, repository runtime
files, global Node, or Python. It created and ordered synthetic Unicode and
Markdown-bearing units, saved them, closed normally, relaunched, reopened, and
exported exact expected Markdown bytes outside the installation directory.

## 4. Artifact inspection

The guarded application archive contains the required runtime surfaces:

```text
/dist/index.html
/dist-electron/main/main.js
/dist-electron/main/stage19Preload.js
/package.json
```

Recorded archive facts:

```text
ASAR bytes: 15073035
ASAR SHA-256: 2d1343640a53882d4a26589b526973886e899fd3dbabfc4625b8cd34396c3e4b
ASAR entries: 2565
ASAR integrity records: 2329
forbidden paths: 0
```

Version and Windows identity reconciliation passed:

```text
manifest/application/filename identity: 1.0.0-rc1
PE file version: 1.0.0.1
executable PE product version: 1.0.0.0
installer PE product version: 1.0.0-rc1
executable and installer signatures: NotSigned
```

The independently downloaded installer reproduced the receipt's byte length
and SHA-256 exactly.

## 5. Corrections made before qualification

No failed or superseded artifact was qualified. Package work corrected:

- whole-tree `sample_project` and protected-path exposure;
- version conflicts, portable output, update blockmap output, obsolete Python
  resources, development material, source maps, and default-icon packaging;
- unsandboxed packaged preloads and packaged legacy-service probing;
- dependency source maps first discovered by the artifact guard;
- unsafe use of a system-wide temporary custom install destination;
- assumptions about electron-builder registration fields;
- Windows PID-reuse false positives in the process-tree witness;
- incompatible inherited PowerShell module paths during signature inspection;
- electron-builder's implicit CI publishing mode;
- and an intermittent editor redo-then-Ctrl+S path that did not bind Save to
  the live CodeMirror document.

The first failed clean packaging workflow stopped before installation or
artifact upload. Every later candidate invalidated earlier evidence; only
commit `85c1524` and its exact installer are qualified.

## 6. Scope, hygiene, and residuals

Inspected or changed surfaces were limited to the Stage 19 main/preload host,
renderer Save coordination, builder configuration, product icon, package
verifier, installed smoke and lifecycle automation, fixed regression gate,
Windows packaging workflow, production dependency lock, packaging guidance,
and Package `19.19` authority records.

No project, manuscript, recovery, or Markdown-export schema changed. No real
manuscript, credential, provider request, `sample_project`, or protected
evidence entered the build or CI evidence.

There are no unresolved Package `19.19` P0, P1, P2, or P3 findings. The
unsigned status is an accepted package constraint, not a hidden defect. Public
signing remains a later release decision. The six historical root React-hook
warnings remain outside this package's changed runtime and are already bounded
by the fixed Stage 19 gate.
