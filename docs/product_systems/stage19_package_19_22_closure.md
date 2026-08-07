# Package 19.22 Internal V1 Closure Receipt

> Superseded: the candidate recorded below predates the required receipt-bound
> Package 19.22 qualification witness. This document is historical evidence
> only and cannot close Stage 19 or the internal V1 baseline.

Status: `CLOSED` — internal V1 baseline only

## Binding result

The exact candidate is:

```text
3060c36448a946b1f2294575129abc42a12d98a9
```

Jason's human validation passed on 2026-08-07. The binding verdict is:

```text
PASS — candidate 3060c36448a946b1f2294575129abc42a12d98a9 — internal V1 baseline only — no public release authority.
```

This receipt is the docs-only closure record following that verdict. The
closure commit contains documentation and tracker updates only; it does not
change application, test, workflow, dependency, manifest, resource, or
packaging inputs.

## Exact qualification evidence

All four workflows reported `success` and the same full candidate SHA:

| Gate | Workflow run | Job/evidence | Result |
| --- | ---: | --- | --- |
| Stage 19 Fixed Regression Gate | `31190997301` | job `92907474081`; supported-core receipt artifact `8998887232` | success |
| Validation & Eval Harness | `31190997340` | E2E job `92907473499`; eval job `92907912440`; observability `92908733383` | success |
| Security Audit | `31190997287` | hygiene `92907468691`; Ubuntu `92907468736`; macOS `92907468712`; observability `92907869668` | success |
| Stage 19 Windows Packaging Proof | `31190997377` | job `92907467672`; authoritative artifact `8999087600` | success |

Every receipt and observability record names candidate
`3060c36448a946b1f2294575129abc42a12d98a9`; mixed-SHA evidence is not used.

### Coverage and evaluation

- Supported-core branch coverage: `81.913499344692%` against the retained
  `60%` threshold; `96` tests, `0` failures, `0` skips. The receipt digest is
  `sha256:96de7375e0ffbfea942a68f7dc0be94a1d27f688955e8be0c032689a86008d55`.
- Validation/evaluation: `63/63` scenarios passed; pass rate `1.0`.
- Load truth: `16` requests, `0` errors, `0` service warnings, no threshold
  breach; the Ubuntu security ledger names the exact candidate SHA.
- Security evidence: all expected dependency and load artifacts were present;
  the fail-closed security gate passed on Ubuntu and macOS.
- Electron inventory: the existing four opt-in lanes remain the only allowed
  skips (budget indicator, snapshots panel, real-service reference, and strict
  visual snapshot). No new skip, retry, or teardown escalation was introduced.

## Authoritative Windows artifact

The only installed-validation artifact is the artifact uploaded by Windows
run `31190997377`:

```text
artifact ID:       8999087600
artifact name:     black-skies-1.0.0-rc1-3060c36448a946b1f2294575129abc42a12d98a9
archive SHA-256:   4d47afb2e81de934c8b7a5ba851d667dbbd9054b943e09f11fa49708ebb9cb17
receipt SHA-256:   e90fd0e9675a325c75a068870bdbaa0efca344c2c82def21e19d0dcec734c631
installer:         BlackSkies-Setup-1.0.0-rc1.exe
installer bytes:   87066061
installer SHA-256: 16bb75a766392d407dbd728f51a6d3a34e66b570f781ea07d499aa7f12b7867d
signature:         NotSigned
version:           1.0.0-rc1
publication:       disabled
```

The receipt records executable SHA-256
`11601a01695d0eb8fe336998c3f75d0049e441e84f4ac292db6053abcb6abe5d` and ASAR
SHA-256 `0212e3719510cbc554002df247e885736fdfe42cc3e28730283553cc58d8fc75`.
The independently downloaded installer hash matches the receipt, and the
independently downloaded archive hash matches the GitHub artifact digest.

Package measurements are: unpacked app `356259428` bytes, ASAR `14753558`
bytes, executable `210956800` bytes, and renderer chunks `1206374` bytes.
The V5 cold-start protocol recorded candidate median `450.4497 ms`, paired
reference median `438.0178 ms`, ratio `1.0283821799022779`, and steady-state
working set `420810752` bytes. Each of five samples proved two visible,
sandboxed windows and zero survivors; the 5% foundation budget passed.

## Installed lifecycle and human validation

The authoritative artifact passed clean per-user installation, two-window
launch, offline operation, project isolation, Save/reopen, deterministic
Markdown export, recovery handling, uninstall preservation, reinstall, and
teardown. The receipt records `0` forbidden runtime descendants,
`0` survivor processes, exact Markdown matching, preserved external project
and export data, and successful uninstall.

Human validation used only this exact artifact and synthetic data. It confirmed
two-window reachability, project A/B isolation, edit and durable Save truth,
close/reopen, export, recovery accept/reject, offline operation, uninstall
preservation, reinstall, and the repaired dirty-switch **Continue editing** /
**Discard changes** focus behavior.

## Finding disposition

The exact candidate closes the remaining Package 19.22 and foundation exit
criteria, including `BS-19.22-P1-23`, `BS-19.22-P3-04`,
`BS-19.22-P3-24`, `BS-19.22-P1-25`, `FND-012`, `FND-014`, `FND-016`,
`FND-017`, and `FND-018`. Earlier candidates and their evidence are
historical only. Deferred and retained non-core surfaces remain governed by
their named owner and reopening trigger; they are not silently promoted into
V1 support.

```text
PACKAGE_19_22: CLOSED
STAGE_19: CLOSED
INTERNAL_V1_BASELINE: COMPLETE
PUBLIC_RELEASE: NOT_AUTHORIZED
ALPHA_OR_BETA: NOT_CLAIMED
V3_PRODUCT_PROGRAM: NOT_STARTED_BY_THIS_PACKAGE
```

No tag, signing request, public artifact, announcement, release, production
readiness claim, or V2 authorization was created by Package 19.22.
