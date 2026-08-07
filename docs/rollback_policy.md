# Black Skies V1 Release-Candidate Rollback Policy

Status: Package `19.22` internal-baseline operator guidance

## Trigger

Rollback preparation begins when a candidate has a confirmed release-blocking
regression, candidate-identity mismatch, installer-boundary failure, dishonest
Save/recovery/export claim, security issue, or explicit release-authority
rejection.

Rollback does not mean deleting external projects or rewriting repository
history.

## Current accepted baseline

```text
source commit:
  3060c36448a946b1f2294575129abc42a12d98a9
installer:
  BlackSkies-Setup-1.0.0-rc1.exe
bytes:
  87066061
SHA-256:
  16bb75a766392d407dbd728f51a6d3a34e66b570f781ea07d499aa7f12b7867d
signature:
  NotSigned
```

This identity is a comparison baseline, not standing permission to tag,
publish, install, uninstall, or release.

## Decision and preservation

Before an authorized rollback action:

1. record the defect, severity, affected candidate, and exact reopening owner;
2. stop distribution of the affected artifact without deleting evidence;
3. preserve installer/receipt identity and non-content diagnostic evidence;
4. ask users to Save and normally close where safe;
5. confirm projects and exports are outside the installation directory;
6. back up external projects without collecting protected prose; and
7. obtain action-time confirmation for any uninstall, recovery rejection,
   artifact removal, tag change, or other destructive/external action.

Uninstall retains external projects/exports and Electron per-user application
data, but it is not a backup or data-erasure mechanism.

## Candidate invalidation

Any change to source identity, executable, preload, renderer, main process,
dependencies, installer, version, icon, packaging configuration, filename,
byte length, hash, or receipt produces a new candidate. It does not inherit the
accepted baseline's qualification.

A replacement candidate must rerun every affected Stage 19 regression,
packaging, artifact, installed offline lifecycle, uninstall/reinstall, and
Computer Use seam before release consideration.

## Restore of service

Only an explicitly authorized, exactly verified candidate may be used to
restore application service. Verify filename, byte length, SHA-256, and
signature immediately before execution. Reopen preserved projects through
**Open project…** by choosing the project folder containing `project.json`.

Do not use a retained historical candidate merely because it launches.

## Re-entry and release

Record:

- affected and replacement candidate identities;
- why the prior candidate was invalidated;
- preservation evidence;
- rerun results;
- every P0/P1/P2/P3 disposition; and
- Jason's exact internal-milestone judgment for the qualified candidate.

Package `19.22` is the closed internal barebones V1.0 baseline boundary.
This policy does not authorize tags, public releases, signing requests,
announcements, history rewrites, or automatic rollback.
