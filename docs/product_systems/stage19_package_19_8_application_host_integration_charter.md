# Stage 19 Package 19.8 Application-Host Integration Charter

## 1. Charter status

This is a docs-only proposed boundary. It authorizes no implementation, test
mutation, dependency change, process termination, packaging action, or
protected-evidence access. Jason must separately authorize Package 19.8.

## 2. Purpose

Prove that the authoritative Electron production path reaches the intended
Black Skies Writing Surface and Command Center without a component-test page,
test-only flag, legacy shell takeover, or required optional service.

## 3. Likely authorized file boundary

If Jason authorizes implementation, the entry review may consider only:

- `config/runtime.yaml`
- `app/shared/config/runtime.ts`
- `app/main/main.ts`
- `app/main/preload.ts`
- directly required current contracts under `app/shared/ipc/`
- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
- narrowly corresponding main/preload/renderer tests

The entry review must narrow this list further to files with a demonstrated
gap. `app/electron/*` is historical/duplicated and prohibited.

## 4. Required behavior

1. normal development and production entry select the intended integrated
   Writing Surface/Command Center shell without a test-only flag;
2. the loaded-project authority remains the only source of visible project
   identity;
3. Writing Surface remains the prose-editing authority;
4. Command Center remains advisory/status-only and cannot mutate prose;
5. missing or unhealthy optional Python/services do not prevent the core
   writing shell from opening;
6. degraded optional-service state is understandable and does not claim that
   unavailable functions work;
7. main, preload, IPC, and renderer boundaries remain explicit; and
8. no alternate legacy or synthetic shell becomes production authority.

## 5. Explicit exclusions

Package 19.8 must not expand project creation/open/schema behavior, persistence
or save semantics, outline/binder behavior, recovery/history, AI/budget/routing,
export, packaging configuration, dependencies, broad lint/type repair,
diagnostic expansion, fixtures/witnesses/snapshots, protected evidence, or
unrelated cleanup.

The packaging `sample_project` conflict is recorded for Package 19.19 and must
not be repaired opportunistically here. The emitted-main file lock may be
resolved only through a separately approved bounded ownership action if it
persists and blocks Package 19.8 verification.

## 6. Focused automated verification

An authorized Package 19.8 must add or update only focused proof for:

- production renderer entry choosing the integrated shell;
- main/preload contract continuity;
- main window creation when optional services fail or are absent;
- honest degraded-service presentation;
- no project-identity or manuscript-authority regression;
- legacy/synthetic paths not taking over; and
- current Foundation Spine matrix continuity.

Required gates are focused tests, main no-emit, renderer production build, a
successful current main build, `git diff --check`, and a real Electron launch
smoke that does not use protected evidence.

## 7. Manual acceptance and closure

Before Package 19.8 closure, Jason must launch and inspect the real application
through the authoritative host. The receipt must confirm the intended two
surfaces are visible, project/status language is honest, direct writing is
available, and unavailable optional services do not block the shell.

Automated tests, a component preview, or a production bundle alone cannot
satisfy this receipt or close Package 19.8.

PZ_CONTINUE: Package 19.8 application-host integration charter ready for Jason authorization; no implementation authorized
