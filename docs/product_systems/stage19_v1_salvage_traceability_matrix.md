# Stage 19 V1.0 Salvage Traceability Matrix

## 1. Status and interpretation

This is the initial non-protected inventory at the Package `19.6` planning
boundary. Presence of a file or test earns no capability credit. Ratings remain
provisional until Package `19.7` traces the executable production path and
records baseline results. No protected evidence was inspected.

Classification vocabulary: `accepted and reusable`, `reusable with repair`,
`partially implemented`, `disconnected`, `duplicated`, `obsolete`,
`historical only`, `unsafe`, or `absent`.

## 2. Initial matrix

| Capability / subsystem | Current implementation evidence | Initial classification | Automated evidence | Manual evidence | Required action/home |
| --- | --- | --- | --- | --- | --- |
| Electron main entry | `app/main/main.ts` plus service/project/IPC registration seams | partially implemented | main-focused tests exist | none | 19.7 trace entry; 19.8 host proof |
| legacy Electron path | `app/electron/projectLoader.ts`, `app/electron/preload.ts` alongside `app/main/*` | duplicated / possibly historical | unclassified | none | 19.7 ownership decision |
| preload and shared IPC | `app/main/preload.ts`, `app/shared/ipc/*` | reusable with repair pending full audit | project/split-command contract tests | none | 19.7 trace; 19.8 contract gate |
| renderer production entry | `app/renderer/index.tsx` -> `App.tsx` | partially implemented | renderer tests/build evidence | none | 19.7 trace; 19.8 packaged-host proof |
| Foundation Spine synthetic shell | `MinimalTwoSurfaceShell.tsx` | synthetic / historical proof | focused component test | none | retain as evidence, not production authority |
| integrated two-surface shell | `SplitCommandWorkspace.tsx` and App path | reusable with repair | 19.2 focused tests | none | 19.8 actual-host acceptance |
| Writing Surface/editor | `ProjectHome.tsx`, `DraftEditor.tsx` | partially implemented | component/save tests | none | 19.8-19.11 integration and acceptance |
| Command Center/status | split workspace and status components | partially implemented | focused authority/status tests | none | 19.13 truth/integrity gate |
| project loader/identity | `projectLoaderIpc.ts`, `projectBootstrap.ts`, shared project contract | reusable with repair | temporary-project identity/load tests | none | 19.9 lifecycle/schema/isolation |
| project creation | no accepted production creation flow established by Foundation Spine | absent or disconnected | unclassified | none | 19.7 locate; 19.9 implement if absent |
| explicit scene save | dedicated main save gate and preload/renderer flow | reusable with repair | atomic/stale/invalid/re-entry tests | none | 19.10 full durability/failure/manual gate |
| multi-unit binder/outline | `StoryNavigationPanel.tsx`, story-unit utilities, Corkboard/other surfaces | disconnected / partially implemented | component/utility tests exist | none | 19.7 authority trace; 19.11 bounded binder |
| history/snapshots | `SnapshotsPanel.tsx`, snapshot utilities and related tests | disconnected / unaccepted | tests exist | none | 19.12 decide durable owner and scope |
| recovery | `useRecovery.ts`, `RecoveryBanner.tsx`, actions and tests | disconnected / unaccepted | component/hook tests exist | none | 19.12 project-scoped interruption proof |
| Markdown export | no accepted V1.0 manuscript export path identified | absent or disconnected | none credited | none | 19.15 implement and compare output |
| service startup/offline | service resolution/health hooks and banners | reusable with repair | service/offline tests exist | none | 19.7/19.8 prove optional services non-gating |
| AI critique/drafting | critique hooks/modal and service seams | optional, disconnected from locked core | tests exist | none | 19.14 decide defer or bounded gate |
| budget/routing | budget indicators and runtime/service seams | optional / partially implemented | focused tests exist | none | 19.14 only if AI retained |
| docking/window layout | DockWorkspace, layout IPC, presets/hotkeys | optional / partially implemented | layout/dock tests exist | none | 19.16 window/accessibility audit |
| analytics/signals | analytics dashboard, story insights, narrative evaluators | optional / disconnected | many component/utility tests | none | defer unless scope decision admits |
| logging/diagnostics | main logging, debug utilities, diagnostic IPC | reusable with repair | focused tests exist | none | 19.16 security/privacy/language audit |
| test harness | Vitest plus Electron E2E fixture/launcher | reusable with repair | focused Stage 19 matrix passed | none | 19.7 baseline; 19.17 reliable layered gate |
| renderer-wide type gate | repository TypeScript configuration | unsafe as release claim due known backlog | targeted main no-emit and renderer build pass | none | 19.7 classify; 19.16/19.17 resolve gate |
| production builds | Vite renderer, main tsconfig, Electron builder config | partially implemented | renderer build and main no-emit pass | none | 19.7 baseline; 19.19 reproducible build |
| packaging/install | `electron-builder.yml` and package scripts exist | partially implemented, unaccepted | full build hit generated-file lock | none | 19.16 lock ownership; 19.19 install proof |
| configuration/secrets | shared runtime config and service configuration seams | reusable with repair | partial tests | none | 19.16 security/privacy audit |
| Windows two-monitor workflow | dock/layout mechanisms present | partially implemented | layout tests only | none | 19.18 manual two-monitor receipt |

## 3. Foundation Spine evidence classification

- `19.1`: synthetic first-slice proof only.
- `19.2`: integrated renderer authority/identity behavior with automated tests;
  no manual host acceptance.
- `19.3`: implemented narrow save contract with automated tests; no manual
  failure acceptance.
- `19.4`: generated-temporary-project normal re-entry evidence only.
- `19.5`: automated integrated verification; no manual, packaging, install,
  RC, or release evidence.

Nothing in the group is classified as manually accepted.

## 4. Package 19.7 completion obligations

Package `19.7` must replace provisional, `possibly historical`, and
`unclassified` findings with evidence-backed classifications. Final
classifications may remain `absent`, `disconnected`, `duplicated`, `obsolete`,
`unsafe`, or `historical only` when repository evidence supports them. It must
trace the authoritative launch-to-render path;
record baseline build/test/static commands and failures; classify duplicate
entry paths; and identify the precise Package `19.8` file and behavior boundary.

PZ_CONTINUE: Initial V1.0 salvage traceability recorded; Package 19.7 must complete executable-path and baseline classification
