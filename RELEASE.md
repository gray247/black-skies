# Black Skies Internal V1 Build Record

## Authority boundary

This file records internal build and installation evidence. It is not a public
release plan. Public release is not authorized, and Package `19.22` will not
create a tag, publish an artifact, request signing, announce availability, or
claim alpha, beta, production, or general-availability status.

The internal V1 baseline is deliberately bounded. A separate V3 product
program must finish before any future public alpha or beta readiness review
may be proposed under new authority.

## Current candidate

Package `19.20` accepted exactly:

```text
source commit:
  b916765196bde37e95968d3985ab5238b47ad797
version:
  1.0.0-rc1
platform:
  Windows 11 x64
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
protected evidence:
  NOT_USED
```

Any rebuilt binary, different source commit, filename, byte length, hash, or
receipt is a different candidate and inherits none of this acceptance.
Historical candidates and their hashes are not current internal-build
authority.

## Qualified internal-build capabilities

The accepted candidate provides:

- assisted per-user Windows 11 x64 install with custom-directory support,
  desktop/Start Menu shortcuts, and uninstall;
- isolated local project create/open/reopen and recent-project references;
- multi-unit binder creation, rename, reorder, delete confirmation, editing,
  undo/redo, durable Save, dirty/failed truth, and close protection;
- project-scoped interrupted-work recovery with explicit accept/reject and
  normal-Save requirement after acceptance;
- deterministic clean-state Markdown export with cancellation and explicit
  replacement confirmation;
- a read-only/navigation-only Command Center synchronized with Writing Studio;
- optional explicit selected-prose OpenAI critique with session-memory
  credential and exact outbound review; and
- offline core operation without installed Python, global Node.js, repository
  files, or provider credentials.

## Known limitations and support posture

- This is an unsigned internal RC (`NotSigned`), not a public,
  SmartScreen-trusted, or signed release.
- The supported product target is Windows 11 x64 only.
- There is no automatic update channel, portable target, per-machine
  installer, or signing workflow in this candidate.
- Command Center cannot edit prose or manuscript structure.
- Markdown is the only accepted V1 manuscript export.
- Recovery is interruption protection, not general version history, backup,
  restore, sync, or portable archive.
- Optional critique requires user-supplied OpenAI access, network availability,
  and explicit transmission approval. It is advisory only.
- Uninstall retains external projects/exports and the Electron per-user
  application-data directory; it is not a data-erasure workflow.
- After monitor disconnect, windows remain reachable but may overlap.
  Reconnect does not automatically restore their former monitor placement.

Support must follow `docs/ops/support_playbook.md`. Do not advise users to edit
project metadata, delete recovery artifacts, install Python/Node, run legacy
services, or substitute an unverified installer.

## Package 19.22 internal-closure record

Package `19.22` closed Stage 19 as the internal barebones V1 baseline after it
independently confirmed the following gates:

1. Packages `19.1` through `19.21` are closed with every residual owned.
2. The tracked worktree and exact source identity are clean and recorded.
3. `pnpm stage19:regression` passes on clean Windows and the exact Linux
   commit gate passes.
4. The exact Windows installer is rebuilt/verified only if candidate identity
   changes; otherwise the accepted artifact is reverified immediately before
   use.
5. Installer, receipt, version, byte length, SHA-256, and signature truth are
   mutually consistent.
6. Installed offline lifecycle and final Computer Use rehearsal pass.
7. No protected prose, credential, optional provider call, Python/global Node
   runtime, or repository dependency entered qualification.
8. No unresolved P0/P1 remains and every P2/P3 has an explicit disposition.
9. Jason supplies the final internal-milestone verification.

Package `19.22` prohibits a tag, public release, signing request, publication,
or release announcement. A future public alpha or beta requires completion of
the V3 product program, a separate readiness audit, and new explicit
authorization.

## Operator verification

From the directory containing the installer:

```powershell
Get-Item -LiteralPath .\BlackSkies-Setup-1.0.0-rc1.exe |
  Select-Object Name,Length
Get-FileHash -Algorithm SHA256 -LiteralPath .\BlackSkies-Setup-1.0.0-rc1.exe
Get-AuthenticodeSignature -LiteralPath .\BlackSkies-Setup-1.0.0-rc1.exe |
  Select-Object Status
```

Build and receipt generation remain documented in `docs/packaging.md`.
Rollback is governed by `docs/rollback_policy.md`.
