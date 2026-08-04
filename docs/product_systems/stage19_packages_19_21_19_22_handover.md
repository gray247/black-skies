# Black Skies Stage 19 Final Handover

## 1. Repository state

```text
branch:
  salvage/minimal-two-surface-shell
Package 19.20 closure commit:
  619f34b92e1e9f53084f4b41d570eab5969773ac
Package 19.20 implementation commit:
  b916765196bde37e95968d3985ab5238b47ad797
Package 19.20:
  CLOSED — JASON OVERALL PASS
next eligible:
  Package 19.22 internal baseline qualification
Package 19.21:
  CLOSED — commit 2dc8010
Package 19.22:
  CLOSED — INTERNAL V1 BASELINE COMPLETE — PUBLIC RELEASE NOT AUTHORIZED
protected evidence:
  NOT_USED
```

The authoritative closure is
`docs/product_systems/stage19_package_19_20_closure.md`.

## 2. Accepted packaged candidate

```text
source commit:
  b916765196bde37e95968d3985ab5238b47ad797
clean Windows qualification run:
  30509993912
artifact ID:
  8746806252
installer:
  BlackSkies-Setup-1.0.0-rc1.exe
byte length:
  89275742
SHA-256:
  93220059613b1fd8fb78cdbbe08539b033c4d93c2e30cb8abe0d67a95623458b
signature:
  NotSigned
```

The accepted RC is installed at:

```text
C:\Users\gray2\AppData\Local\BlackSkiesManualTests\Stage19-20-b916765\Black Skies
```

Fresh synthetic acceptance artifacts and evidence are retained at:

```text
C:\BlackSkiesManualTests\Stage19-20-b916765
```

Do not treat older `85c1524`, `ffcbed8`, or adjacent acceptance roots as the
accepted candidate.

## 3. Final Package 19.20 result

```text
A — install, launch, happy path, corrected Save:
  PASS
B — isolation and state truth:
  PASS
C — failure, recovery accept/reject, offline core:
  PASS
D — packaged two-window behavior:
  PASS
E — uninstall, preservation, same-candidate reinstall:
  PASS
overall:
  PASS
open P0/P1/P2:
  NONE
```

The trailing-newline Save defect was reproduced, corrected, covered by focused
contract tests and a real Electron/Playwright test, requalified through the
clean Windows packaging workflow, and retested in the actual installed Windows
UI.

The final Computer Use pass independently exercised:

- new-project creation through the native folder picker;
- exact trailing-newline Save and close/relaunch durability;
- interrupted recovery acceptance followed by explicit normal Save;
- interrupted recovery rejection followed by proof that it was not reoffered;
- process interruption bound to the exact installed executable path;
- uninstall preservation and same-candidate reinstall; and
- reopening preserved external data after reinstall.

## 4. Jason's requested remaining-work model

Jason requests an autonomous-first internal qualification workflow for the
bounded Stage 19 baseline:

```text
Codex builds, audits, fixes, and verifies the remaining work.

Codex runs the complete automated ladder:
  static and contract tests
  unit/component/integration tests
  Electron/Playwright tests
  clean Windows and Linux regression
  packaging and artifact verification
  installed offline lifecycle
  Computer Use against the real Windows application

Codex repairs in-scope failures and reruns every affected seam.

Codex documents out-of-scope observations with a future owner.

Jason is not used as the step-by-step test operator.

Codex stops only for:
  a decision that changes product or public-release authority
  a sensitive or destructive action requiring action-time confirmation
  a blocker that cannot be resolved inside the authorized package
  the final internal-milestone judgment required by Package 19.22

Only after the product, documentation, tests, package, and real GUI rehearsal
are complete does Codex hand Jason the candidate for the final
internal-milestone judgment.
```

This workflow authorizes autonomous preparation and verification. It does not
authorize a tag, signing request, publication, announcement, public
distribution, or alpha/beta claim.

## 5. Package 19.21 target

Package `19.21` owns user, release, and operator documentation. Its acceptance
condition is that support and release records match the accepted product.

The next thread should begin with a twice-reviewed Package `19.21` plan, then
execute it without routine human test handoffs. At minimum, inspect and align:

- first install, custom install, first launch, shortcuts, and uninstall;
- project creation/opening and exact folder-picker terminology;
- binder/unit creation, naming, ordering, editing, undo/redo, Save, reopen,
  and clean/dirty/failed state language;
- deterministic Markdown export, cancellation, replacement, and clean-state
  requirement;
- recovery acceptance and rejection behavior;
- Command Center's read-only role;
- optional selected-prose OpenAI critique, session-only credential handling,
  explicit outbound review, and honest V1 limitations;
- offline core behavior and lack of Python/global-Node dependency;
- Windows 11 x64, per-user NSIS, unsigned-internal-RC status, data retention,
  and uninstall boundaries;
- accessibility, keyboard, focus, scaling, and two-window/monitor guidance;
- troubleshooting for invalid projects, save failure, export failure,
  installer warnings, and recovery;
- release notes, known limitations, support posture, and rollback;
- every command, path, version, filename, hash, and UI label used by operators;
  and
- documentation link, terminology, version, and stale-authority checks.

Documentation must not copy protected manuscript prose, credentials, or
historical candidate identities into current user guidance.

After implementation, use Computer Use to follow the finished user/operator
documentation against the installed application. Treat a mismatch as a
Package `19.21` defect, correct the documentation or product only within
authority, and rerun the affected path.

## 6. Package 19.22 internal-closure target

Package `19.22` is the final internal barebones V1.0 closure boundary. Before
asking Jason for the final internal-milestone judgment, Codex should
autonomously prepare:

- a complete closure audit across Packages `19.1` through `19.21`;
- an explicit disposition for retained inactive Package `19.14`
  qualification/scoring tooling;
- clean current-truth, roadmap, internal-build, support, and V3 ownership
  authority;
- no unresolved P0/P1/P2 and an explicit owner and reopening trigger for
  every retained P3;
- clean tracked worktree and exact source identity;
- full fixed Stage 19 regression on Windows;
- Linux exact-commit regression;
- clean Windows package/build/artifact/install/offline/uninstall proof;
- exact installer/receipt hashes and signature truth;
- Playwright/Electron coverage for every internal-V1-critical path;
- a final Computer Use rehearsal of install, launch, create, edit, Save,
  reopen, export, recovery, two-window behavior, uninstall, and reinstall;
- evidence that no protected prose, real credential, optional provider call,
  Python/global Node runtime, or repository dependency entered qualification;
- version, installer-name, internal-build identity, and rollback consistency;
  and
- a concise final human checklist containing only judgments automation cannot
  honestly supply.

If Package `19.22` changes the executable, preload, renderer, main process,
dependencies, installer, version, icon, or packaging configuration, it creates
a new candidate. Rebuild and rerun all affected qualification and Computer Use
checks before asking Jason to verify it.

Do not create a tag, public release, signing request, publication,
announcement, or distribution artifact. Package `19.22` contains no authority
that can authorize those actions.

## 7. Final handoff condition

The next thread should not ask Jason to perform intermediate setup that Codex
can safely perform with repository tools, Playwright/Electron, packaging
automation, or Computer Use.

The final handoff is complete:

```text
Black Skies passed its exact-candidate CI, packaging, installed-app, and core
writing human checks. The bounded internal V1 foundation is complete; public
release authority was not granted.
```

Future work requires new authority and must not infer public-release scope.
