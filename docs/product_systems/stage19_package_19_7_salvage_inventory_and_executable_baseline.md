# Stage 19 Package 19.7 Salvage Inventory and Executable Baseline

## 1. Starting commit and gate

- starting commit: `818f75e` `docs(product): define Stage 19 V1.0 implementation program`
- branch: `salvage/minimal-two-surface-shell`
- upstream: synchronized after Package 19.6 push
- worktree: clean before Package 19.7
- scope: read-only repository/code inspection, safe baseline execution, and
  documentation only

No runtime, test, dependency, fixture, witness, snapshot, protected evidence,
or cleanup mutation was performed.

## 2. Authoritative production path

The actual packaged entry declared by `app/package.json` is
`dist-electron/main/main.js`, compiled from `app/main/main.ts`. Main registers
`app/main/projectLoaderIpc.ts` and other IPC, loads `app/main/preload.ts`, and
loads Vite's `app/dist/index.html`. The renderer enters through
`app/renderer/index.tsx`, mounts `App.tsx`, and renders `ProjectHome.tsx` as the
active project/writing host.

The intended Writing Surface/Command Center wrapper is
`SplitCommandWorkspace.tsx`. It is selected in App only when
`runtimeConfig.ui.experimentalSplitCommandWorkspace` is true. The committed
default is false and `config/runtime.yaml` does not enable it. Therefore the
Foundation Spine split-command path has automated coverage but is not the
normal production configuration.

## 3. Duplicate and historical paths

`app/electron/projectLoader.ts` and `app/electron/preload.ts` duplicate parts of
the current main/preload authority. They are excluded by `tsconfig.main.json`,
are not the `app/package.json` main entry, and are not imported by current
`app/main/main.ts`. They are classified `historical only / duplicated`, not
production authority. Package 19.8 must not revive or modify them.

The synthetic `renderer/salvage/MinimalTwoSurfaceShell.tsx` is retained as
historical Foundation Spine proof, not a production application entry.

## 4. Subsystem inventory

The completed subsystem-by-subsystem file, reachability, classification,
automated/manual evidence, uncertainty, owner, and Package 19.8 blocker status
is recorded in `stage19_v1_salvage_traceability_matrix.md`.

Key findings:

1. project creation, loading, identity, explicit save, and normal re-entry have
   real current seams and focused automated evidence, but no manual acceptance;
2. outline/binder, recovery/history, and export code exists but is partial,
   fragmented, service-dependent, or unaccepted;
3. optional AI/budget/routing surfaces exist but earn no V1.0 credit;
4. main starts optional services before creating the window, contradicting the
   offline-core promise when Python/services are unavailable;
5. the split-command host is disabled by default;
6. packaging currently includes `sample_project` as an extra resource, a
   release-blocking protected-evidence boundary conflict; and
7. packaging version/target configuration conflicts with the V1.0 lock.

## 5. Baseline commands and outcomes

`git status --short` was recorded before and after every baseline. No command
changed tracked files or created unexpected controlled outputs.

### App lint

```powershell
cmd /c pnpm --dir app run lint
```

Result: fail, exit code `1`.

- `App.tsx`: unused `deriveProjectIdFromPath` error.
- `ProjectHomeDivergenceVisibilityWitness.test.tsx`: unused `React` error.
- six React-hook dependency warnings across App and ProjectHome.
- ESLint also reports deprecated eslintrc configuration.

### Main-process TypeScript no-emit

```powershell
cmd /c app\node_modules\.bin\tsc.CMD --project app\tsconfig.main.json --noEmit
```

Result: pass, exit code `0`.

### Foundation Spine focused matrix

The established 11-file Foundation Spine command was run unchanged.

Result: `11` test files passed; `78` tests passed; exit code `0`.

### Renderer production build

```powershell
cmd /c pnpm --dir app run build:renderer
```

Result: pass, exit code `0`; `460` modules transformed. Output remained ignored
and did not change repository status.

### Main emitted build / safe Electron build prerequisite

```powershell
cmd /c pnpm --dir app run build:main
```

Result: fail, exit code `2`.

TypeScript could not write:

- `app/dist-electron/main/runtimeSessionTruth.js`
- `app/dist-electron/main/runtimeSessionTruth.js.map`

Both failures were `EPERM`. Because the authoritative main output could not be
rebuilt, an Electron launch smoke was not represented as a clean current-build
proof. No process was killed and no generated output was deleted.

## 6. Generated-file behavior

Renderer and main build commands target ignored generated directories. The
renderer build completed without tracked changes. The main emit encountered
the pre-existing file lock. Final status before documentation edits remained
clean. No unexpected controlled file appeared.

## 7. Release-relevant risks

- **Package 19.8 blockers:** main emit lock; split-command host disabled by
  default; optional services gate window creation; no real-host manual proof.
- **RC blockers assigned later:** lint failure, missing clean renderer type
  gate, unaccepted lifecycle/recovery/export, no manual evidence.
- **Packaging blockers:** protected `sample_project` inclusion, version
  mismatch, portable target beyond locked requirement, no clean install proof.
- **Security hardening:** `sandbox:false`, broad preload surface, service and
  path boundaries require Package 19.16 audit.

## 8. Precise Package 19.8 boundary

Package 19.8 is limited to proving the intended shell through the authoritative
main/preload/renderer path. The likely mutation scope is:

- `config/runtime.yaml` and/or `app/shared/config/runtime.ts` only for the
  production split-command selection;
- `app/main/main.ts` only for optional-service-degraded launch and necessary
  main-window host behavior;
- `app/main/preload.ts` and current shared IPC only if a concrete host contract
  gap is proven;
- `app/renderer/App.tsx` and
  `app/renderer/components/workspace/SplitCommandWorkspace.tsx` only for
  production reachability and honest degraded status; and
- focused main/preload/renderer host tests.

It excludes project lifecycle expansion, persistence/save expansion,
outline/binder implementation, recovery/history, AI, export, packaging,
dependencies, broad lint/type repair, duplicate historical paths, and protected
evidence.

## 9. Blockers and final repository status

Package 19.7 itself is complete. Package 19.8 implementation remains blocked
pending Jason authorization and must account for the main emitted-build lock
before claiming launch proof. Package 19.7 leaves only its two new documents
and the traceability-matrix update pending; these outputs are not committed.

PZ_CONTINUE: Package 19.7 salvage inventory and executable baseline complete; Package 19.8 charter ready for Jason authorization
