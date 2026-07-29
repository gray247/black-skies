# Stage 19 Package 19.19 Scope and Inspection

Status: implementation authorized; packaging output remains blocked until the
release-boundary defects in this record are corrected and verified

Package: `19.19` — packaging and installation proof

Branch: `salvage/minimal-two-surface-shell`

Starting commit: `17c59f52eb0f14ffcc2b90d6ad811e64f4b0a042`

Authorization date: 2026-07-29

## 1. Authority

Jason explicitly authorized Codex to implement the twice-reviewed Package
`19.19` plan, correct in-scope failures, commit and push verified batches, and
continue without human intervention. Package `19.20` manual packaged-RC
acceptance is not authorized by this package and may not begin by inference.

The only qualification target is:

```text
Black Skies 1.0.0-rc1
Windows 11 x64
per-user assisted NSIS installer
installed dedicated Stage 19 Writing Studio and Command Center
```

The portable target, macOS/Linux packaging, automatic update, public
distribution, code signing, and Package `19.20` acceptance are excluded.
This package produces an unsigned internal release candidate and must report
that signature status honestly.

## 2. Starting repository state

The package began with:

```text
HEAD: 17c59f52eb0f14ffcc2b90d6ad811e64f4b0a042
upstream ahead/behind: 0/0
tracked worktree: clean
Package 19.18: closed with PASS
```

Evidence is limited to synthetic unit data, generated temporary projects, and
the installer/application artifacts created from the authorized source.
Protected evidence remains sealed.

## 3. Disqualified baseline

Read-only inspection established that the existing builder configuration:

- overrides the application version to `0.1.0` while both manifests say
  `1.0.0-rc1`;
- requests both NSIS and the out-of-scope portable target;
- includes Python service source, development requirement locks, and
  `sitecustomize.py`;
- includes the entire `sample_project` directory;
- uses no Black Skies application icon; and
- packages windows whose active preload has `sandbox: false`.

A bounded `package:dir` inspection was stopped after the builder began copying
the configured whole-tree resources. Only path metadata was inspected. No
protected file content was opened, used, retained, hashed, or promoted. The
incomplete generated `app/release` directory was removed and the tracked
worktree returned clean.

The whole-tree `sample_project` rule is a release-blocking packaging defect.
No later package build may run until that rule is removed and a fail-closed
forbidden-content guard exists.

## 4. Required implementation boundary

Package `19.19` must:

1. use a sandbox-compatible dedicated preload for the packaged Stage 19
   windows;
2. prevent the packaged host from probing or spawning legacy Python services;
3. force the packaged host onto the dedicated two-window Stage 19 path;
4. reconcile all version identities to `1.0.0-rc1`;
5. build only the x64 per-user assisted NSIS installer;
6. package only an explicit runtime allowlist;
7. reject forbidden or protected-evidence path families before install or
   upload;
8. prove the installed application can launch, save, reopen, and export
   without development tooling, global Node/Python, internet, or provider
   credentials; and
9. uninstall the application without deleting external project/export data.

No project, manuscript, recovery, or Markdown-export schema may change.
Existing `projectSpine`, `splitCommand`, and `aiCritique` renderer contracts
must remain behaviorally compatible.

## 5. Stop and closure rules

Stop immediately for protected content in output, data loss, project
crossover, dishonest Save/export state, an unsandboxed packaged renderer,
version mismatch, an installed global-runtime dependency, installer damage
outside its exact disposable scope, or evidence that cannot be bound to one
commit.

P0/P1 findings must be fixed and fully requalified. P2 findings must be fixed
unless Jason explicitly accepts a documented deferral. P3 findings may defer
only with an owner and visible record.

Package `19.19` closes only after the exact implementation commit passes the
clean Windows Stage 19 gate, Linux Stage 19 CI, clean Windows
packaging/install/uninstall CI, artifact hashing and inspection, and repository
hygiene without protected evidence.

