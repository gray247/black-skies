# Stage 19 Package 19.15 Closure Record

Status: closure record pending effective commit and push

Package: 19.15 — Markdown manuscript export

Closure audit date: 2026-07-26

## 1. Package identity and boundary

Package 19.15 is the bounded Stage 19 package for deterministic, project-
isolated Markdown manuscript export from the durable Writing Studio project.
It follows the formally closed Package 19.14 and precedes Package 19.16.

The accepted production path is main-owned and uses the Project Spine session,
native Save dialog, immutable validated source snapshot, deterministic byte
construction, explicit replacement confirmation, and atomic destination write.
The legacy `App.tsx` and Python export paths remain historical and are not part
of this closure.

This record closes Package 19.15 only. It does not close Stage 19, establish
V1.0 or release readiness, qualify an installer, or authorize Package 19.16.

## 2. Controlling authority

Closure was checked against:

- `stage19_package_19_15_markdown_export_contract.md`;
- `stage19_package_19_15_qualification.md`;
- `current_truth_index.md`;
- `current_product_roadmap.md`;
- `stage19_v1_master_implementation_and_acceptance_plan.md`; and
- `stage19_v1_scope_lock.md`.

No controlling-authority contradiction prevents closure. Implementation,
automated qualification, hands-on acceptance, and closure remained separate
gates.

## 3. Accepted commits

| Commit | Boundary | Accepted disposition |
| --- | --- | --- |
| `07019f2` | BS-19.15-02 contract | Fixed the clean-state, deterministic-byte, filename, destination, binding, replacement, evidence, and exclusion rules before implementation. |
| `bfb05fd` | BS-19.15-03 main-owned implementation | Added the production IPC, deterministic artifact builder, dialog flow, typed evidence, atomic write, and Writing-only preload capability. |
| `138933f` | BS-19.15-04 Writing Studio integration | Added the export control, exact remedy, neutral cancellation, original-project attribution, and success reporting without Command Center authority. |
| `6d283e4` | BS-19.15-05 qualification | Strengthened exact-byte, fingerprint, failure, immutable-snapshot, binding, and preload evidence. |
| `673a981` | Qualification authority | Recorded accepted automated evidence, manual checklist, and bounded deferred observations. |
| `7e05a5e` | Hands-on observations | Recorded successful manual results plus routed editor undo and terminal-framing findings. |

## 4. Implemented product contract

Package 19.15 provides:

- Writing-Studio-only Markdown export;
- a main-owned native Save dialog;
- export only from an entirely durably clean active project;
- the exact remedy `Save the project successfully before exporting.`;
- no automatic Save and no mixed saved/unsaved snapshot;
- exact binding to project ID, canonical path, generation, revision, and
  operation ID;
- fail-closed validation before immutable snapshot creation;
- completion for the original immutable snapshot after a later project switch;
- authoritative ordered inclusion of every unit, including empty units;
- deterministic UTF-8 without BOM, LF line endings, and exactly one final LF;
- governed title normalization/escaping without body editorial rewriting;
- Windows-safe suggested and edited filenames with exactly one `.md`;
- destinations outside the project;
- neutral cancellation and declined replacement;
- explicit replacement confirmation;
- atomic destination write and failure cleanup;
- destination path, byte length, and unit count in visible success;
- SHA-256, source identity, ordered unit IDs, snapshot fingerprint, operation,
  and UTC timestamp in typed qualification evidence; and
- exclusion of front matter, internal IDs and paths, AI, credentials, recovery,
  diagnostics, history, other projects, and legacy export metadata.

Export remains manuscript interchange. It is not Save, backup, restore,
recovery, project archive, AI evidence export, or editorial-report export.

## 5. Automated qualification

The accepted focused aggregate passed:

```text
Test Files  9 passed (9)
Tests       174 passed (174)
```

The accepted existing Stage 19 Electron regression aggregate passed:

```text
14 passed
electron_process_count=0
```

The following builds passed:

```text
pnpm --filter app run build:main
pnpm --filter app run build:renderer
pnpm --filter app run build:production
```

Evidence covers exact bytes, repeat identity, Unicode, punctuation, duplicate
and blank titles, empty bodies, order, filename rules, outside destinations,
cancellation, replacement, clean-state rejection, stale bindings, dialog
races, immutable completion, role isolation, write/sync/replacement failure,
cleanup, evidence identity, exclusions, and project non-mutation.

## 6. Jason hands-on acceptance

Jason explicitly accepted Package 19.15 on 2026-07-26.

The disposable `CON` project proved:

- reserved-name fallback to `manuscript.md`;
- four ordered units with duplicate, blank, empty, whitespace-only, Markdown,
  link, and Unicode cases;
- ordinary readable Markdown with faithful headings and bodies;
- absence of front matter and excluded operational data;
- destination outside the project;
- neutral cancellation;
- dirty-state blocking and successful Save-to-clean recovery;
- byte-identical repeat exports;
- declined replacement preserving the original destination;
- accepted replacement matching the qualified export;
- Windows native overwrite confirmation followed by the separate Black Skies
  confirmation;
- Unicode filename retention; and
- normalization of `Night 星.md.md` to exactly `Night 星.md`.

No API credential, provider request, Python service, internet access, or paid
operation was required.

## 7. Corrected defects and retained observations

Qualification corrected an unconfirmed-destination race and added permanent
witnesses for immutable completion, sync/replacement failure preservation, and
Writing-only preload exposure.

The qualification record retains these non-blocking future-work observations:

- `BS-DEFERRED-APP-LINT-01`;
- `BS-DEFERRED-RENDERER-TYPECHECK-01`;
- `BS-DEFERRED-VITEST-LISTENER-01`;
- `BS-DEFERRED-WRITING-EDITOR-UNDO-01`; and
- `BS-DEFERRED-WRITING-EDITOR-FRAMING-01`.

The hands-on undo observation is a real pre-existing editor limitation:
CodeMirror history/undo is not installed. The visually identical dirty-state
observation was an exact invisible terminal-newline difference. Normal Save
created the required durable clean baseline, after which export passed.

These observations authorize no additional Package 19.15 mutation. Reopen
Package 19.15 only if later evidence shows incorrect exported bytes, stale or
retargeted authority, silent replacement, source/destination damage, excluded
data leakage, false success, or inability to export a valid durably clean
project.

## 8. Explicit exclusions

Package 19.15 does not claim:

- editor undo/redo implementation or terminal-framing redesign;
- DOCX, PDF, EPUB, RTF, ZIP, import, backup, restore, or project archive;
- legacy renderer or Python exporter promotion or cleanup;
- AI critique, rewrite, generation, or editorial competence;
- repository-wide lint or renderer type-debt closure;
- installer, clean-install, packaging, or release-candidate acceptance;
- Package 19.16 through 19.22 implementation;
- Stage 19 closure; or
- V1.0 completion or release.

## 9. Package 19.16 handoff

After this closure becomes effective, Package 19.16 is next in the approved
sequence and is eligible for separate bounded inspection and authorization.

Package 19.16 does not begin by inference. This closure authorizes no Package
19.16 runtime, test, documentation, dependency, commit, or push mutation.

Stage 19 remains open. Package 19.22 remains the final V1.0 closure and release
boundary.

## 10. Closure condition

Package 19.15 is formally closed only when this exact closure record and the
accepted hands-on receipt update are committed and pushed.

Until that condition is met, the accepted implementation and qualification
boundary remains commit `7e05a5e`.

Subject to the effective commit-and-push condition, the controlling contract,
implementation, automated evidence, Jason's explicit hands-on acceptance,
failure containment, exclusions, and documented residual routing satisfy the
Package 19.15 exit gate. No remaining in-scope blocker is known.
