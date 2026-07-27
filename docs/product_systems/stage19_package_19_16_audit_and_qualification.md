# Stage 19 Package 19.16 Audit and Qualification

## 1. Authority and boundary

Package `19.16`, the architecture, integrity, security, accessibility,
performance, failure, dependency, language, and window audit, was explicitly
authorized by Jason on 2026-07-26.

The audit began from clean synchronized commit `424f75e` on
`salvage/minimal-two-surface-shell`. It covers the Stage 19 production
development path: the dedicated Writing Studio and Command Center, their
main/preload authority boundaries, Project Spine persistence/recovery/export,
and the bounded optional AI Critique path.

Historical renderer surfaces and inactive qualification tooling remain
reference evidence only unless a finding below assigns them to a later gate.
No protected evidence was opened, copied, regenerated, or used.

Package `19.16` classifies and owns findings. It does not qualify packaging,
perform Jason's Package `19.18` manual acceptance, or close Stage 19/V1.0.

## 2. Audit disposition

```text
PACKAGE_19_16_AUDIT_COMPLETE
P0_OPEN: 0
P1_OPEN: 0
P2_OPEN: 1 release-hardening item, owned by Package 19.19
REGRESSION_GATE_DEBT: owned by Package 19.17
PACKAGING_GATE_DEBT: owned by Package 19.19
```

The open P2 defense-in-depth item does not invalidate functional development
build acceptance. It must be fixed before packaging or receive Jason's
explicit acceptance under the Stage 19 blocker taxonomy.

## 3. Audit matrix

| Audit | Evidence and result | Disposition |
| --- | --- | --- |
| Architecture | Writing owns mutation and prose; Command receives scoped status/selection only; optional services remain non-blocking; the dedicated preload no longer receives legacy bridges | pass after correction |
| Integrity | 519 focused unit/component/contract tests plus 17 Electron scenarios cover lifecycle, project isolation, Save, recovery, export, optional AI, and immutable cross-window truth | pass |
| Security | context isolation on, Node integration off, dedicated bridge allowlists narrowed, new-window and external-navigation denial on both windows, CSP present, successful current dependency-lock security sweep | pass with one owned sandbox hardening item |
| Accessibility | Axe WCAG A/AA scan of populated Writing and Command surfaces reports zero violations; keyboard undo/redo added and qualified | pass; manual two-monitor/scaling remains 19.18 |
| Performance | real-bridge 100-unit manuscript: about 3.21 seconds to create all units and 50 ms to select unit 100, below 15-second and 3-second regression ceilings | pass |
| Failure | lifecycle, structural, dirty-status, optional AI, Save, recovery, renderer-loss, corrupt evidence, and optional-service failures remain bounded and preserve work/authority | pass after correction |
| Dependency | repository lock inputs match the same inputs used by successful GitHub Security Audit run `30194842915`; no Package 19.16 dependency was added | pass within stated audit limits |
| Language | UTF-8 scan of 14 active Stage 19 source/entry files reports zero suspicious mojibake lines; one active `Saving…` label was corrected | pass |
| Windows/windows | both windows deny uncontrolled navigation/new windows; role, lifecycle, close, restart, recovery, and Command isolation tests pass | pass; physical multi-monitor evidence remains 19.18 |

## 4. Corrected findings

### `BS-19.16-F01` — editor undo and redo

Classification: P2 user-workflow degradation, corrected.

The Writing Studio editor previously lacked bounded undo history. It now
supports `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, and `Ctrl/Cmd+Y`, groups adjacent
typing, caps history at 200 entries, and clears history at external
unit/project boundaries. Electron evidence proves undo removes a new edit,
redo restores it, and dirty/Save/close truth remains correct.

This closes `BS-DEFERRED-WRITING-EDITOR-UNDO-01`.

### `BS-19.16-F02` — durable terminal-newline framing

Classification: P2 user-workflow degradation, corrected.

The durable draft format requires a final newline, but the editor previously
treated that structural byte as visible prose. A visibly identical paste could
therefore remain dirty. Project parsing now removes exactly one durable framing
LF from the editor body while composition continues to write exactly one final
newline. Unit tests prove that framing alone does not create dirty state and
that authored body content is otherwise preserved.

This closes `BS-DEFERRED-WRITING-EDITOR-FRAMING-01`.

### `BS-19.16-F03` — dedicated preload overexposure

Classification: P2 security/authority risk, corrected.

The dedicated Writing Studio inherited legacy `projectLoader`, service,
diagnostic, layout, runtime-configuration, filesystem, and test/dev bridges.
Dedicated Writing now receives only `projectSpine`, `aiCritique`, and
`splitCommand`; Command remains limited to `projectSpine` and `splitCommand`.
The no-split legacy renderer retains its historical bridges for compatibility.
Permanent preload tests prove both positive and negative allowlists.

### `BS-19.16-F04` — inconsistent navigation containment

Classification: P2 security hardening, corrected.

The two Electron windows now share a fail-closed navigation guard. Both deny
new windows and external navigation while permitting the current development
origin or local packaged file origin. Main-process tests exercise each role.

### `BS-19.16-F05` — unbounded renderer bridge rejection paths

Classification: P2 failure-containment risk, corrected.

Lifecycle, directory-picker, structural mutation, dirty-status, and optional
AI bridge rejections now produce bounded user-visible status or safe silent
cleanup instead of unhandled renderer promise rejections. Tests prove that
local prose and recovery truth remain visible after transport failure.

### `BS-19.16-F06` — repeated test-process listeners

Classification: regression-harness defect, corrected.

Repeated intentional main-module imports in Vitest attached production
process handlers on every import and produced `MaxListenersExceededWarning`.
Production process diagnostics and signal cleanup are now excluded only when
`PLAYWRIGHT=1`. The 19-file aggregate passes without listener warnings.

This closes `BS-DEFERRED-VITEST-LISTENER-01`.

### `BS-19.16-F07` — active-source lint and language defects

Classification: maintainability/language debt, corrected in the active path.

Unused active main/preload variables and types, active Stage 19 hook
dependencies, a malformed ellipsis, and similar local issues were corrected.
The fixed active-source ESLint selection passes. The wider historical lint
gate is separately owned below.

## 5. Open and routed findings

### `BS-19.16-R01` — Electron preload sandbox remains disabled

Classification: P2 defense-in-depth security hardening.

Owner: Package `19.19` pre-packaging security hardening.

Mitigation today: `contextIsolation: true`, `nodeIntegration: false`, a
role-scoped dedicated preload allowlist, no raw `ipcRenderer`/filesystem/shell
exposure to the Stage 19 renderer, CSP, main-side role validation, and
fail-closed window/navigation rules.

The monolithic compatibility preload still imports Node-backed legacy services,
so changing `sandbox: false` to `true` is not a safe one-line correction.
Package `19.19` must introduce and package-prove a sandbox-compatible dedicated
preload or obtain Jason's explicit P2 acceptance. This item blocks packaging
readiness, not Package `19.17` automation or functional Package `19.18`
development-build acceptance.

### `BS-19.16-R02` — repository-wide app lint is not green

Classification: automated-gate debt, not an observed Stage 19 runtime defect.

Owner: Package `19.17`.

The full app lint command reports three historical errors and six React-hook
warnings in legacy App/Project Home code and one legacy witness. Active Stage
19 production sources pass their fixed lint selection. Package `19.17` must
make the fixed static gate truthful and green; it may correct the three bounded
errors but must not silently suppress the six warnings.

This supersedes the count in `BS-DEFERRED-APP-LINT-01`.

### `BS-19.16-R03` — broad historical renderer no-emit debt

Classification: automated-gate architecture debt, not an observed production
build failure.

Owner: Package `19.17` for the V1 fixed gate and post-V1 maintenance for the
excluded historical migration.

The broad historical renderer/test configuration has extensive pre-existing
type debt across inactive services, analytics, layout, tests, and legacy
components. Both authoritative renderer and main production builds pass.
Package `19.17` must publish the exact active production type/build boundary
and may not claim the historical no-emit tree passes.

This carries forward `BS-DEFERRED-RENDERER-TYPECHECK-01`.

### `BS-19.16-R04` — package version metadata mismatch

Classification: P1 packaging-entry blocker; no packaged candidate has yet been
qualified.

Owner: Package `19.19`.

`app/electron-builder.yml` still sets `extraMetadata.version: 0.1.0` while the
current manifests identify `1.0.0-rc1`. Package `19.19` must reconcile version
authority before installer evidence is accepted.

### `BS-19.16-R05` — dependency audit coverage limit

Classification: documented evidence limit, not a known vulnerability.

Owner: Package `19.17` to retain the security workflow in the fixed gate and
Package `19.22` for final release review.

The successful security workflow fails on HIGH/CRITICAL findings. It does not
prove that no lower-severity advisory exists. A direct local registry audit was
not used because that would transmit local dependency metadata without a
separately approved network disclosure. This limit must remain visible.

### `BS-19.16-R06` — manual physical-window evidence

Classification: required human evidence, not an automated defect.

Owner: Package `19.18`.

Automated placement, lifecycle, resize-safe minimums, role, close, restart, and
recovery behavior pass. Only Jason can judge the required physical two-monitor,
disconnect/reconnect, scaling, and 60–90 minute writing experience.

## 6. Qualification evidence

### Production build

```text
pnpm --dir app run build:production
PASS
renderer: 463 modules transformed
main: TypeScript compilation and CommonJS marker completed
```

### Focused unit/component/contract aggregate

```text
19 test files passed
519 tests passed
2 tests skipped by their existing qualification contract
0 failed
0 MaxListeners warnings
```

The expected JSON written by the negative score-import child-process test is
test output, not a failed parent test. No protected qualification evidence was
used.

### Electron integration aggregate

```text
17 tests passed
duration: 1.6 minutes
workers: 1
trace: on
```

After the final terminal-framing and per-unit undo-boundary self-review, the
affected four-test Project Spine Electron file was rebuilt and rerun: four
passed.

Covered files:

- `stage19-project-spine.spec.ts`
- `stage19-recovery.spec.ts`
- `stage19-command-center-integrity.spec.ts`
- `stage19-ai-critique.spec.ts`
- `stage19-accessibility.spec.ts`
- `stage19-performance.spec.ts`

### Accessibility and performance

```text
Writing Studio Axe WCAG A/AA violations: 0
Command Center Axe WCAG A/AA violations: 0
100-unit creation: approximately 3207.7 ms
unit-100 selection: 50 ms
```

The performance ceilings are regression bounds, not a broad benchmark claim.

### Security and dependencies

GitHub Security Audit run
`https://github.com/gray247/black-skies/actions/runs/30194842915` completed
successfully on 2026-07-26 for Ubuntu and macOS. It ran `pip-audit`, Safety,
`pnpm audit`, a load SLO, dependency reporting, repository hygiene, and the
HIGH/CRITICAL failure gate.

The JavaScript/Python lock and constraint inputs on this branch match the
audited `origin/main` inputs. `app/package.json` differs only by the
non-dependency `qualification:import-scores` script inherited from Package
`19.14`.

### Static, language, and hygiene

```text
active Stage 19 ESLint selection: PASS
active UTF-8 source files scanned: 14
suspicious mojibake lines: 0
tracked repository hygiene: PASS
git diff --check: PASS
```

The separate full app lint failure and broad renderer no-emit debt are
explicitly routed in `R02` and `R03`; neither is misreported as passing.

## 7. Files changed

Runtime:

- `app/main/main.ts`
- `app/main/preload.ts`
- `app/renderer/DraftEditor.tsx`
- `app/renderer/Stage19WritingSpineApp.tsx`

Focused tests:

- `app/main/__tests__/splitCommandPreload.test.ts`
- `app/main/__tests__/splitCommandSecondaryLaunchHook.test.ts`
- `app/renderer/__tests__/Stage19WritingSpineApp.test.tsx`
- `app/tests/e2e/stage19-project-spine.spec.ts`
- `app/tests/e2e/stage19-accessibility.spec.ts`
- `app/tests/e2e/stage19-performance.spec.ts`

Authority/evidence:

- this record

## 8. Rollback and closure posture

The changes are bounded to editor history/framing, renderer failure
containment, dedicated preload/window hardening, and permanent audit witnesses.
They do not change Project Spine durable formats, export Markdown bytes,
optional AI request authority, or protected evidence.

Every discovered finding is corrected, assigned to Package `19.17`,
assigned to Package `19.18`, assigned to Package `19.19`, or retained as an
explicit evidence limit. Package `19.16` therefore satisfies its primary exit
gate. Stage 19 remains open; Package `19.17` is next and separately authorized
by Jason's 2026-07-26 instruction.
