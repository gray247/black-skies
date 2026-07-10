# Stage 19 V1.0 Salvage Traceability Matrix

## 1. Package 19.7 status

This matrix records non-protected repository evidence at starting commit
`818f75e`. File presence is not capability acceptance. No subsystem has manual
acceptance. Protected evidence was neither opened nor used.

Classifications may remain `absent`, `disconnected`, `duplicated`, `obsolete`,
`unsafe`, or `historical only` when the evidence supports them.

## 2. Authoritative production path

```text
app/package.json main
-> app/dist-electron/main/main.js
-> app/main/main.ts
-> app/main/preload.ts
-> app/shared/ipc/*
-> app/dist/index.html
-> app/renderer/index.tsx
-> app/renderer/App.tsx
-> app/renderer/components/ProjectHome.tsx
-> App workspace selection
-> app/renderer/components/workspace/SplitCommandWorkspace.tsx (flagged)
```

`App.tsx` renders `ProjectHome` on the normal renderer path. The intended
split-command host wraps the writing workspace only when
`ui.experimentalSplitCommandWorkspace` is true. The committed runtime default
is false and `config/runtime.yaml` does not enable it, so the Foundation Spine
two-surface host is not production-reachable by default.

## 3. Completed subsystem inventory

| Subsystem | Authoritative files | Production reachability | Classification | Automated evidence | Failure / uncertainty | Owner | Blocks 19.8? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| package/startup | root/app `package.json`, `electron-builder.yml` | app main points to `dist-electron/main/main.js` | reusable with repair | build scripts present | emitted main build locked; version mismatch root/app `1.0.0-rc1` vs builder `0.1.0` | 19.7/19.19 | yes: main build lock |
| Electron main | `app/main/main.ts` | authoritative compiled entry | reusable with repair | main tests; no-emit pass | waits for services before window; optional-service failure can block core shell; `sandbox:false` | 19.8/19.16 | yes |
| main/preload duplicate | `app/electron/projectLoader.ts`, `app/electron/preload.ts` | excluded from `tsconfig.main.json`; not referenced by package main | historical only / duplicated | no credited production proof | contains older loader/sample seams | 19.7 disposition complete | no |
| preload | `app/main/preload.ts` | loaded by `PRELOAD_PATH` | reusable with repair | preload/service/IPC tests | very broad bridge and test hooks require later security audit | 19.8/19.16 | yes: contract proof |
| IPC contracts | `app/shared/ipc/*` | imported by main/preload/renderer | accepted as current seam, not release-accepted | Foundation contract tests pass | broad optional-service surface unaccepted | 19.8/19.16 | yes |
| renderer entry | `app/renderer/index.tsx`, `App.tsx` | normal Vite entry | reusable with repair | renderer tests/build pass | App is very large; lint error and hook warnings | 19.8/19.16 | yes |
| active project host | `App.tsx`, `ProjectHome.tsx` | reachable normally | partially implemented | ProjectHome/App identity tests | manual host proof absent | 19.8/19.9 | yes |
| Writing Surface | `ProjectHome.tsx`, `DraftEditor.tsx`, App draft state | reachable in stable workspace | partially implemented | editor/save tests | no host/manual acceptance; multi-unit lifecycle incomplete | 19.8/19.10/19.11 | yes |
| Command Center | `SplitCommandWorkspace.tsx` | gated off by default | disconnected from default production config | focused component tests | intended surface not visible by normal config | 19.8/19.13 | yes |
| project creation | `ProjectHome.tsx`, `projectLoaderIpc.ts`, `projectBootstrap.ts` | reachable through current preload | reusable with repair | bootstrap/loader tests | lifecycle edge cases and manual isolation absent | 19.9 | no |
| project open/identity/schema | `projectLoaderIpc.ts`, `projectBootstrap.ts`, shared loader contract | reachable | reusable with repair | temporary-project load/identity tests | compatibility, unknown-version, concurrent/duplicate identity decisions incomplete | 19.9 | no |
| manuscript save | App/ProjectHome save flow, `projectLoaderIpc.ts` | reachable for loaded scenes | reusable with repair | atomic/stale/invalid/re-entry tests | failure/manual/large/rapid-edit/unsaved-close coverage incomplete | 19.10 | no |
| outline/binder/navigation | `StoryNavigationPanel.tsx`, ProjectHome scene list, story-unit utilities, Corkboard | portions reachable; ownership fragmented | partially implemented / duplicated presentation | component/utility tests | create/reorder/delete durable unit flow unaccepted | 19.11 | no |
| snapshots/history | `SnapshotsPanel.tsx`, snapshot utilities, service bridge | service-dependent and UI reachable in some modes | disconnected from locked recovery authority | component/service tests | persistence owner and isolation unproven | 19.12 | no |
| recovery | `useRecovery.ts`, `RecoveryBanner.tsx`, service bridge | reachable but service-dependent/test modes complicate path | partially implemented / unaccepted | hook/App recovery tests | real interruption, durable recovery, isolation, accept/reject manual proof absent | 19.12 | no |
| export | App export UI, preload service API | service-dependent reachable seam | partially implemented / unaccepted | mocked renderer/service tests | no authoritative ordered Markdown output or manual comparison | 19.15 | no |
| service startup/offline | `main.ts`, runtime config, health hooks/banners | service starts before main window | unsafe for offline-core promise | service/health tests | missing Python/service can prevent window creation | 19.8 | yes |
| optional AI/critique | App, critique hooks/modal, service bridge | reachable optional UI | partially implemented, optional | component/service tests | isolation/acceptance/budget trust not release-proven | 19.14 | no |
| budget/routing | budget hooks/components, runtime/service config | reachable optional UI | partially implemented, optional | focused tests | not required for core; routing evidence absent | 19.14 | no |
| docking/window | DockWorkspace, layout IPC, presets/hotkeys, split secondary window | docking enabled; split secondary gated | partially implemented | layout/dock/main tests | no manual two-monitor/off-screen/DPI proof | 19.16/19.18 | no |
| logging/configuration | main logging, debug log, runtime config | reachable | reusable with repair | focused tests | raw/developer detail and redaction need audit | 19.16 | no |
| test harness | Vitest offline runner, Playwright Electron fixtures | reachable tooling | reusable with repair | Foundation matrix 78/78 | several tests reference protected-path strings/snapshot seams; no protected content used here | 19.17 | no |
| lint gate | app ESLint runner | supported | failing | command executed | 2 errors, 6 warnings; deprecated eslintrc warning | 19.16/19.17 | no, but blocks RC |
| TypeScript gates | `tsconfig.main.json`; renderer via Vite/lint | main supported; no dedicated renderer no-emit script | partially implemented | main no-emit pass | known renderer-wide backlog; exact clean renderer type gate absent | 19.16/19.17 | no, but blocks RC |
| renderer production build | Vite config/scripts | supported | reusable | pass | generated ignored `dist` only | 19.17/19.19 | no |
| main production build | TypeScript emit + commonjs script | supported in scripts | blocked | no-emit passes | `EPERM` on `runtimeSessionTruth.js` and map | 19.8 prerequisite / 19.19 | yes |
| packaging | builder config/scripts | configured, not accepted | unsafe / partially implemented | none credited | includes `sample_project` in `extraResources`, portable despite scope, version mismatch, no install proof | 19.19 | no for 19.8; release blocker |

## 4. Foundation Spine evidence

- `19.1`: synthetic proof only.
- `19.2`: automated renderer integration evidence; no default-host/manual proof.
- `19.3`: narrow durable-save implementation and automated evidence; no manual
  failure acceptance.
- `19.4`: generated-temporary-project normal re-entry evidence.
- `19.5`: automated integrated verification only.

No Foundation Spine package is manually accepted, release-ready, or packaging
evidence.

## 5. Baseline summary

- app lint: fail, 2 errors and 6 warnings.
- main TypeScript no-emit: pass.
- focused Foundation Spine matrix: 11 files and 78 tests pass.
- renderer production build: pass.
- main emitted build: fail with `EPERM` on two generated runtime-session-truth
  outputs.
- tracked/unexpected controlled output: none; status remained clean after each
  baseline command.

## 6. Next boundary

Package `19.8` may address only real-host reachability: make the intended
Writing Surface/Command Center shell the normal app path, keep project identity
honest, allow core writing UI to launch when optional services are unavailable,
and prove main/preload/renderer integration. It must not absorb lifecycle,
persistence, recovery, export, AI, packaging, protected-evidence, or unrelated
lint/type repair.

PZ_CONTINUE: Package 19.7 traceability matrix completed; real-host integration gaps assigned to Package 19.8
