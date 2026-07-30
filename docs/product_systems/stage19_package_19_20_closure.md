# Stage 19 Package 19.20 Closure

## 1. Decision

Package `19.20`, packaged release-candidate acceptance and retesting, is
formally closed.

```text
PACKAGE_19_20_CLOSED
JASON_OVERALL_DISPOSITION: PASS
QUALIFIED_IMPLEMENTATION_COMMIT: b916765196bde37e95968d3985ab5238b47ad797
WINDOWS_QUALIFICATION_RUN: 30509993912
INSTALLER_SHA256: 93220059613b1fd8fb78cdbbe08539b033c4d93c2e30cb8abe0d67a95623458b
SIGNATURE_STATUS: NotSigned
OPEN_P0_P1_P2_FINDINGS: NONE
PROTECTED_EVIDENCE: NOT_USED
```

Jason supplied the required explicit disposition:

```text
PACKAGE 19.20 OVERALL: PASS
```

## 2. Exact accepted candidate

```text
source commit:
  b916765196bde37e95968d3985ab5238b47ad797
installer:
  BlackSkies-Setup-1.0.0-rc1.exe
byte length:
  89275742
SHA-256:
  93220059613b1fd8fb78cdbbe08539b033c4d93c2e30cb8abe0d67a95623458b
signature:
  NotSigned
clean Windows qualification run:
  30509993912
artifact ID:
  8746806252
```

Any different source commit, installer byte length, installer hash, receipt,
or rebuilt binary is a different candidate and does not inherit this
acceptance.

## 3. Corrections and requalification

The original Package `19.19` candidate was disqualified after the installed
NSIS bootstrap failed on the acceptance host. The bounded per-user installer
correction produced candidate `ffcbed8`.

That replacement candidate was then disqualified by
`BS-19.20-P1-02`: valid editor prose ending in an intentional newline was
rejected because the renderer and main-process validator applied different
final-newline serialization rules. No data loss or dishonest Saved state
occurred; the application failed closed.

The correction at `b916765` aligned the main validator with the renderer's
deterministic serialization contract. It passed:

```text
focused IPC and renderer tests:
  83 passed
focused real Electron/Playwright reproduction:
  PASS
full fixed Stage 19 gate:
  558 passed / 2 intentional skips / 19 Electron passed
clean Windows build and artifact verification:
  PASS
offline installed lifecycle:
  PASS
exact Markdown comparison:
  PASS
forbidden Node/Python runtime descendants:
  0
clean uninstall and external-data preservation:
  PASS
protected evidence:
  NOT_USED
```

## 4. Final packaged acceptance

The accepted matrix is:

```text
A — install, launch, happy path, corrected Save path:
  PASS
B — project isolation and state truth:
  PASS
C — bounded failure, recovery, and offline core:
  PASS
D — packaged two-window behavior:
  PASS
E — uninstall, preservation, and same-candidate reinstall:
  PASS
overall:
  PASS
```

Sections A and B, native export replacement behavior, save-failure recovery,
physical two-window/monitor behavior, and readable state/error behavior were
accepted during the human campaign. The one-line serialization correction did
not alter those authorities.

The corrected candidate then received a narrow installed acceptance pass using
the real packaged Windows UI:

- a new disposable project saved two lines;
- the second line was deleted while preserving the intentional trailing
  newline;
- Ctrl+S changed `1 unsaved unit` to `Saved durably`;
- a clean close, relaunch, and reopen preserved the first line and intentional
  blank second line;
- recovery acceptance displayed the exact interrupted candidate, applied it
  as explicitly unsaved, and made it durable only after normal Save;
- recovery rejection deleted only the confirmed synthetic candidate,
  preserved the durable baseline, and did not offer the rejected marker after
  relaunch; and
- the running witness found one exact application process root and zero
  forbidden Node/Python runtime descendants.

Jason supplied action-time confirmation for the destructive synthetic recovery
rejection and the final overall `PASS`.

## 5. Uninstall and reinstall boundary

Before uninstall, the witness captured exact byte lengths and SHA-256 hashes
for all fresh external projects and the adjacent unrelated sentinel.

The final boundary proved:

```text
application files removed:
  PASS
HKCU registration removed:
  PASS
desktop and Start Menu shortcuts removed:
  PASS
external project bytes preserved:
  PASS
adjacent sentinel preserved:
  PASS
same installer hash rechecked before reinstall:
  PASS
reinstalled executable and ASAR hashes:
  PASS
registration and shortcuts recreated:
  PASS
preserved accepted-recovery project reopened:
  PASS
```

The accepted RC is left installed in the verified per-user test location:

```text
C:\Users\gray2\AppData\Local\BlackSkiesManualTests\Stage19-20-b916765\Black Skies
```

Synthetic acceptance data and evidence remain outside the installation:

```text
C:\BlackSkiesManualTests\Stage19-20-b916765
```

## 6. Evidence and residual posture

Machine-readable acceptance evidence is retained under the fresh acceptance
root and contains synthetic data, paths, identities, statuses, byte lengths,
and hashes only. Protected manuscript evidence and credentials were not used.

The installer is an unsigned internal RC. Package `19.20` does not claim code
signing, SmartScreen reputation, automatic updates, public release readiness,
or support for platforms other than Windows 11 x64.

No unresolved P0, P1, or P2 finding remains. Historical disqualified
candidates and their evidence remain historical and are not acceptance
authority.

## 7. Next package

Package `19.21`, user/release/operator documentation, is next eligible.

It is not started by this closure. Package `19.22` remains the final V1.0
closure/release boundary and still requires Jason's explicit final release
authorization.

