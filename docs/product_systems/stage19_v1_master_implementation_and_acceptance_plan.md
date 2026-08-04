# Stage 19 V1.0 Master Implementation and Acceptance Plan

## 1. Program model

Stage 19 owns the bounded implementation and acceptance sequence through Black
Skies internal V1.0 baseline. `stage19_v1_scope_lock.md` controls the bounded
product promise. The `Foundation Spine` group (`19.1`-`19.5`) supplies the first local
project-open/save/re-entry proof only.

Every package follows:

```text
scope -> inspect -> implement -> focused tests -> package integration tests
-> Codex self-review -> Jason review -> user commit/push -> manual acceptance
when user-visible -> package closure
```

Runtime work never begins by inference. One package is authorized at a time.
Protected evidence remains sealed. Package reports must state the starting
commit, files inspected/changed, user-visible and authority behavior, tests,
commands/results, unrelated failures, exclusions, rollback posture, and final
Git status.

## 2. Program sequence

| Package | Deliverable | Dependencies | Primary exit gate |
| --- | --- | --- | --- |
| 19.6 | authority alignment, scope lock, master plan, initial traceability | Foundation Spine | Jason approves locked boundary |
| 19.7 | salvage inventory and executable baseline | 19.6 | one real app path and honest subsystem/test/build classifications |
| 19.8 | real application-host integration | 19.7 | intended shell launches through production entry without test flags |
| 19.9 | project lifecycle and isolation | 19.8 | create/open/reopen and two-project isolation accepted |
| 19.10 | durable manuscript save | 19.9 | no known silent loss or dishonest state |
| 19.11 | outline/binder/core writing workflow | 19.10 | small multi-unit manuscript can be organized, written, and reopened |
| 19.12 | history/recovery/interruption safety | 19.10-19.11 | project-scoped recovery accept/reject accepted |
| 19.13 | Command Center integrity | 19.9-19.12 | truthful, non-mutating, project-scoped status |
| 19.14 | optional AI decision and, only if retained, bounded implementation | stable core workflow | AI passes advisory/isolation gates or is explicitly deferred |
| 19.15 | Markdown manuscript export | manuscript authority stable | external readable export passes comparison and manual acceptance |
| 19.16 | architecture, integrity, security, accessibility, performance, failure, dependency, language, and window audits | feature scope stable | every finding owned and classified |
| 19.17 | automated regression program | 19.8-19.16 | fixed CI/RC gate passes without protected evidence |
| 19.18 | Jason manual acceptance against the stable development build | stable development build | happy, isolation, failure, real-session, and two-monitor receipts pass |
| 19.19 | packaging and installation proof | stable runtime/regression and 19.18 | NSIS install/launch/save/reopen/export packaging checks pass |
| 19.20 | packaged release-candidate acceptance and retesting | 19.18-19.19 | packaged RC acceptance matrix and defect retest cycle pass |
| 19.21 | user/release/operator documentation | RC behavior fixed | support and release records match reality |
| 19.22 | internal barebones V1.0 closure | all prior | CLOSED: exact candidate, Windows artifact/install proof, four CI runs, Jason core-writing check; no release action |

Dependency rules are binding: project identity precedes save; save precedes
recovery; manuscript authority precedes export; core workflow precedes optional
AI; stable runtime precedes development-build acceptance; development-build
acceptance precedes packaging; packaged-build acceptance precedes closure; and
Package `19.22` requires final Jason internal-milestone verification.

## 3. Package acceptance requirements

User-visible packages require focused automated evidence plus a Jason receipt.
Package `19.18` performs this manual program against the stable development
build and must cover:

- happy path: launch, create, organize, write, save, reopen, continue, export;
- isolation: distinct A/B projects with no manuscript, status, recovery,
  destination, or optional-AI crossover;
- failure path: invalid/missing/read-only projects, save/export failure,
  interruption, recovery accept/reject, and optional-service failure;
- 60-90 minute real writing session with friction/performance notes; and
- two-monitor placement, restart, disconnect/reconnect, scaling, and window
  recovery where required by the locked scope.

Codex may prepare scripts and checklists; Jason supplies acceptance judgment.
Package `19.20` repeats the release-critical paths against the packaged release
candidate after Package `19.19` proves packaging and installation.

## 4. Automated and internal-closure gates

The internal-closure gate must include static checks, critical unit/component/contract
tests, lifecycle/isolation/save/recovery/export integrations, critical Electron
E2E, renderer and main production builds, packaging, packaged smoke tests, and
a clean worktree. Tests use evidence partitions A-C only. Flakes, skips, broad
snapshot regeneration, run-order dependence, and protected-evidence dependence
are not accepted silently.

RC entry freezes scope and allows release-blocker fixes only. RC verification
must include development and clean packaged environments, offline operation,
optional-service failure, small and representative larger approved fixtures,
at least one full manual pass, one real writing session, one clean-install
pass, and retest after any blocker fix.

## 5. Required governance records

The useful program-level records are the authority decision, scope lock,
master plan, salvage traceability matrix, test/evidence matrix, manual
acceptance plan, blocker register, packaging/RC plan, known limitations, and
final closure review. Package records are created only at meaningful scope,
risk, blocker, acceptance, or closure boundaries.

## 6. Current package position

Packages `19.12` through `19.21` are closed through their respective package
closure records. Package `19.20` accepted exact candidate `b916765` and
installer `BlackSkies-Setup-1.0.0-rc1.exe` (89275742 bytes,
SHA-256
`93220059613b1fd8fb78cdbbe08539b033c4d93c2e30cb8abe0d67a95623458b`,
`NotSigned`).

Package `19.21`, **user/release/operator documentation**, aligned current
release-facing records to that accepted product, passed static documentation
checks, and passed a real installed-app Computer Use rehearsal. Its nine P1/P2
documentation findings are closed. One truthful non-blocking P3
export-notice-lifetime observation is owned by Package `19.22` with an exact
reopening trigger.

Stage 19 is closed. Package `19.22`, **internal barebones V1.0 closure**,
completed repository hardening and exact-candidate qualification; Jason's
core-writing human check passed. Public release is not authorized, and the
closure created no tag, publication, signing request, release announcement, or
alpha/beta claim.

Runtime work never begins by inference. One-package-at-a-time governance
remains in force, and the approved sequence through Package `19.22` is
unchanged.

## 7. Closure rule

Foundation Spine completion, a passing component matrix, or a production build
cannot close Stage 19. Only Package `19.22`, after all approved implementation,
automated, manual, packaging, RC, documentation, safety, and authority gates,
may recommend Stage 19/V1.0 closure.

PZ_CONTINUE: Package 19.22 closed; Stage 19 and the internal V1 baseline are complete; public release is not authorized
