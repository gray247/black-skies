# Programs 1–5 Corrected Priority Repair and Qualification Plan

## Status and authority

- Status: `CLOSED; PROGRAMS 1–5 AUDIT/QUALIFICATION COMPLETE; CLEANUP WAVE A CLOSED`
- Canonical branch: `codex/foundation-audit`
- Canonical worktree: `C:/Users/gray2/.codex/worktrees/4f0b/black-skies`
- Preserved comparison worktree: `C:/Dev/black-skies`
- Execution/review posture: `GPT-5.6 Luna, high`
- Model-change warning: runtime work is being executed under the requested Luna/high posture rather than the earlier Sol/Terra receipts; this change is recorded here and in subsequent receipts.
- Public release, signing, provider calls, local-LLM work, destructive cleanup, branch reset, and broad refactor are excluded.

## Current authority reconciliation — 2026-08-31

Programs 1 and 2 passed their bounded scopes and Human Gate 1 is closed. Program
3 is closed at `9ff07369`; Program 4 is closed-mechanical at `319b9c61` and
provides bounded orientation/routing only, without generic chat, a local
language model, or durable conversational memory. Program 5 and Human Gates 2
and 3 are closed at exact installed candidate
`6efec7b95c82759f51f6d8f47d4400637f48837a`. Cleanup Wave A is closed at
`dcf340a2db8033a679c8227a62a050ec47bb951b`; exactly four worktrees remain
intentionally protected or quarantined and do not reopen that closure.

Program 6 bounded planning is eligible and has not started. Runtime or
implementation work requires explicit future authorization. The current cleanup
HEAD is regression-validated, not a newly installed or package-qualified
release candidate, and this reconciliation makes no Programs 1–5 capability
claim beyond the established bounded evidence. Dated sections below retain
historical qualification chronology and are not current blockers.

This document is the implementation control point for the bounded Programs 1–5
repair work. It separates implementation, mechanical qualification, exact
installed qualification, human acceptance, deferred capability, and unproven
success. No public API or persistence-schema change is authorized unless a
bounded reproduced defect proves one is required.

## Operating rules

- Existing dirty files are preserved and classified before integration.
- Product-lane batches run sequentially because renderer, CSS, tests, and receipts overlap.
- Qualification checks may run in parallel only when they do not consume incomplete product artifacts or edit shared files.
- Every mutation has a focused test, recoverable commit or patch, rollback target, and evidence note.
- Dirty-development evidence never closes an exact candidate.
- Human Gate 2 cannot use a candidate that has not passed exact package qualification.

## Priority batches

### 1. Baseline reproduction and issue traceability

Capture branch, `HEAD`, worktree status, dirty paths, lock state, runtime
configuration, installer and receipt identifiers, and host privilege state.
Reproduce the known launcher, NSIS, firewall, geometry, rail, persistence,
theme, viewport, and stub/claim issues where possible.

Maintain an issue matrix with issue ID, user symptom, root cause or hypothesis,
reproduction, affected files, evidence class, regression test, owner batch,
exit condition, and non-claim. Every known issue must be assigned to a batch
or explicitly classified as deferred, historical, or externally blocked.

### 2. Candidate authority and documentation reconciliation

Classify the nine existing dirty files as carry-forward, excluded, retained for
later review, or requiring user decision. Reconcile the tracker, roadmap, truth
index, open-work register, Program 4/5 receipts, package receipts, installer
commit, and installer hash.

Add consistency validation for receipt commit existence, installer/receipt hash
binding, ancestor-evidence promotion, app-only versus exact firewall modes, and
test counts bound to command, commit, files, and skips.

### 3. Runtime, launcher, and qualification repair

Prove that normal development and installed application startup do not require
Administrator access or create firewall rules. Qualify renderer-port reuse,
occupied-port reporting, owned-process shutdown, renderer readiness, optional
service degradation, and missing-Python handling.

Keep firewall creation limited to the explicit elevated qualification harness.
The exact lane must report one of `exact-pass`, `exact-blocked-external`,
`application-only-pass`, `package-failed`, or `runtime-failed`; app-only evidence
must never satisfy the exact gate.

### 4. Writing Studio geometry and stable rails

The manuscript canvas owns long-document scrolling. The outer shell and open
Story, Review, Project, and Writing Session rails remain stable and usable.
Unit selection scrolls only the canvas. Notices, toasts, headers, edge controls,
Companion, and session surfaces never cover prose. Focus hides and restores
support chrome without losing editor state.

Mechanical evidence covers internal scrolling, fixed-rail geometry, overlap,
100-unit behavior, substantial-manuscript behavior, narrow viewports, and 200%
text. Human usability remains a separate gate.

### 5. Unit/Note transactional interaction repair

Units remain the manuscript spine and Notes remain subordinate title/body
records. Linked Notes default to the selected Unit; unlinked Notes remain
explicit. Creation, cancellation, deletion, rename, navigation, persistence,
project isolation, stale-status clearing, multi-select explanation, and
related-item highlighting must be covered without changing manuscript or
sidecar ownership.

Cancel, Escape, outside-click, and failed-save paths must leave no placeholder
or durable mutation.

### 6. Visual, accessibility, state, and degraded-mode matrix

Qualify light and dark themes for saved, export-success, warning, error,
disabled, destructive, toast, unavailable, degraded, offline, Focus, help, and
comparison states. Include malformed sidecars, failed saves, project switches,
stale state, failed Command transitions, secondary-window loss, and
crash/restart recovery.

Cover tooltips, edge controls, keyboard focus and return, reduced motion, 200%
text, non-color cues, comparison readability, help readability, and
preview-only/no-manuscript-mutation behavior.

Use semantic assertions, targeted Windows references, and Human Gate 2. CSS
source matching is not visual proof. Viewport warnings must be fixed, proved
harness-only, or assigned an explicit external limitation and reopening rule.

### 7. Stub fencing, Program 1/2 reconciliation, and exact qualification

Record Program 1 as mechanically safe but not broadly quality-qualified;
deterministic fixtures do not prove provider quality. Record Program 2 as a
mechanically qualified basic loop with deferred graph, extraction, reorder,
branching, and deep Story Unit behavior. A reproduced defect creates a separate
bounded repair slice rather than expanding P5-UX-01.

Runtime-prove that the Companion is local-facts orientation only, unsupported
requests do not silently route to AI/provider behavior, mock routes are
unavailable by default, mock origins cannot appear in packaged flows,
`offline-stub` is test-only, and legacy renderer/analytics surfaces are not
selected by canonical packaged startup.

After Priorities 3–6 integrate, create one clean candidate, run the complete
type/lint/build/regression matrix, rebuild the installer, bind exact commit and
hashes, verify package contents, run install/startup/Command/export/100-unit/
uninstall/preservation/reinstall, and run the elevated firewall lifecycle.

### 8. Human Gate 2 and bounded repair loop

Use a disposable project with multiple Units, linked/unlinked Notes, saved and
unsaved content, a substantial manuscript, both themes, help, comparison, and
optional Command transition. Record each manual item as Pass, Fail, Confusing,
or Not Exercised.

Human Gate 2 passes only when the exact candidate is package-qualified, firewall
state is `exact-pass`, no P1/P2 product failure remains, and Jason accepts the
Writing Studio. A failure creates exactly one bounded repair slice, preserves
passing evidence, reruns the affected full matrix, and repeats review.

## Program 5 corrected closeout implementation boundary

The corrected closeout implementation now provides one-Markdown-file intake into
a new disposable project, LF normalization, a versioned project-local structure
sidecar, deterministic heading/separator/paragraph/fallback discovery, stable
source-offset anchors, ghost proposal state, explicit proposal mutations, and
transactional materialization into existing Units and `outline.json` entries.
Existing Units and drafts remain canonical manuscript truth; the intake source
and sidecar are provisional structure metadata. The renderer and IPC seam bind
every read and mutation to Writing Studio project identity, generation, and
expected revision. Discovery and proposals never silently become accepted
structure, reorder canonical Units, or overwrite later manuscript edits.

This implementation is mechanically tested development evidence only. It is not
package qualification, exact-installed evidence, Human Gate 2 acceptance, or
Human Gate 3 closure.

## Deferred Program 5 follow-up

Track separately with an owner and reopening trigger:

- substantial-manuscript reopen qualification;
- Human Gate 3.

These items must not be used to claim current Program 5 completion.

## Rollback and failure rules

- A failing batch remains open.
- App-only qualification never becomes exact qualification.
- External host privilege failure blocks Human Gate 2.
- Every mutation has a recoverable commit or patch.
- No broad cleanup or legacy deletion occurs in this cycle.
- New findings map to an existing batch or become one bounded follow-up item.

## Evidence contract

Every batch receipt records exact commit, changed boundary, root cause, command,
test files/counts/skips, package/install mode, firewall mode, artifacts and
hashes, non-claims, rollback reference, and next gate. Status vocabulary is:
`implemented`, `mechanically-tested`, `package-qualified`, `exact-installed`,
`author-accepted`, `external-blocked`, `deferred`, and `unproven`.

## Baseline evidence

Captured on 2026-08-22 at `2026-08-22T11:05:23.1906246-04:00` from the canonical
worktree:

- Branch: `codex/foundation-audit`.
- `HEAD`: `052da6753764469c780e2eba939beec014d9f12d`.
- Host privilege: non-Administrator (`IsInRole(Administrator) = false`).
- Existing Black Skies firewall rules: none found.
- Node: `v22.19.0`; pnpm: `8.15.9`.
- `pnpm-lock.yaml` SHA-256: `179AA21463C557E7E424923FAEEC20F101F399673BE08A077663D3021650A477`.
- `config/runtime.yaml` SHA-256: `37A129F4E6521FF6BEE7CD9681B8A3454531C5B3F322C0F0092B3FB4AF008202`.
- Dirty tracked paths preserved: `app/main/main.ts`,
  `app/renderer/__tests__/companionOrientation.test.ts`,
  `app/shared/companionOrientation.ts`, five product-system authority docs,
  and `scripts/electron-dev.mjs`.
- New in-scope plan path: `docs/product_systems/program_1_to_5_priority_repair_plan.md`.
- Existing installer: `app/release/BlackSkies-Setup-1.0.0-rc1.exe`,
  SHA-256 `2e762ad6fb147aa5ddfdd7fef68c4725f4e94eb7a164ad2c10ab828aa08204ad`.
- Existing package receipt binds that installer to `985dd98d892db20bcc101b9b148d24c7a42d16f6`,
  not the current `HEAD`; it is historical/app-only evidence until a clean
  current-candidate rebuild is completed.

The baseline does not claim exact installation, exact offline firewall
qualification, Human Gate 2 acceptance, or a clean candidate. The current
non-elevated host is an external blocker for the elevated firewall lane.

### Initial issue traceability matrix

| ID | Symptom / boundary | Initial root cause or hypothesis | Batch | Evidence / regression | Current exit condition | Non-claim |
|---|---|---|---|---|---|---|
| P1 | Launcher port reuse, occupied-port handling, owned shutdown | Port-health and process-ownership seams require explicit lifecycle proof | 3 | `scripts/dev-runner.test.mjs`; launcher smoke | Normal startup reuses healthy renderer, reports occupied owner, and kills only owned processes | Does not prove installed package behavior |
| P2 | NSIS long-path staging failure | Historical electron-builder include path exceeded Windows/NSIS path limits | 3, 7 | package/installer verification receipts | Clean current-HEAD NSIS build and unpacked verification | Existing installer is ancestor-bound |
| P3 | Firewall/elevation errors | Qualification harness needs elevation; application must not own firewall setup | 3, 7 | installed lifecycle receipt | `exact-pass`, or explicit `exact-blocked-external` with no gate advance | App-only pass is not exact offline proof |
| P4 | Mixed or stale evidence | Receipt commit/hash and current worktree are not aligned | 1, 2, 7 | authority consistency checks | All promoted receipts bind the same clean candidate | No ancestor evidence promotion |
| P5 | Long manuscript covers or loses rails | Canvas/outer-shell scroll ownership and rail geometry need runtime proof | 4 | renderer/Electron geometry journeys | 100-unit, substantial, narrow, and 200% layouts pass | Automated pass is not human usability acceptance |
| P6 | Notices, toasts, headers, edge controls overlap prose | Overlay reservation and viewport boundaries need state-matrix proof | 4, 6 | no-overlap assertions and visual references | No important state obscures manuscript content | CSS source matching is not visual proof |
| P7 | Units and Notes appear equivalent or mutate wrong surface | Story-rail hierarchy and sidecar ownership need explicit behavioral proof | 5 | renderer/IPC/persistence suites | Unit spine, subordinate Note, and no manuscript mutation verified | Does not prove deferred discovery/intake |
| P8 | `+`, `−`, cancel, Escape, outside click, failed save | Creation/deletion transaction boundaries need failure-path coverage | 5 | transactional renderer/IPC tests | No cancelled or failed transaction leaves durable data | No broad workflow-quality claim |
| P9 | Rename and persistence fail after navigation/reopen | Selection identity, persistence, and project isolation may race or retain stale state | 5 | rename/reopen/project-isolation journeys | Double-click/F2 and title/body persistence pass across navigation | Human ease-of-use remains open |
| P10 | Multi-select/status messages are confusing or stale | Selection explanation and status lifecycle need explicit clearing rules | 5, 6 | selection/status tests and human checklist | Selection intent is visible; Unit changes clear stale status | Technical highlighting is not author acceptance |
| P11 | Theme/status/accessibility states unreadable | Semantic state tokens and keyboard/large-text boundaries need full matrix | 6 | semantic, keyboard, theme, visual-reference checks | Light/dark, 200%, focus, reduced-motion, and degraded states pass | Targeted refs are not Human Gate 2 |
| P12 | Help/comparison technically present but unclear | Copy, preview boundaries, and no-mutation behavior need qualification | 6 | help/comparison tests and review checklist | Readable, preview-only, no manuscript mutation | No claim of broad editorial usefulness |
| P13 | Viewport stabilization warnings | Harness warning may be environment-only or an unproven product signal | 4, 6 | Electron logs plus reproducibility check | Fixed, proven harness-only, or documented external limitation with reopen rule | Warnings are not silently waived |
| P14 | Stubs, mocks, legacy/analytics surfaces, unproven claims | Runtime boundaries may be test-only but lack packaged-flow proof | 7 | static/runtime guard tests and packaged startup | Mock/offline-stub cannot leak to normal customer flow; deferred surfaces named | Fixtures do not prove provider or critique quality |
| P15 | Programs 1–4 status overclaims | Evidence is distributed across receipts and current docs with different scopes | 2, 7 | truth-index/tracker/receipt reconciliation | One status vocabulary and evidence identity across Programs 1–5 | Program 5 stays open through Human Gate 2 and deferred follow-up |

Baseline disposition: P1–P15 are assigned to bounded batches. P2, P3, and
P4 are already observed qualification/authority blockers or historical drift;
they are not treated as product regressions until the current clean candidate
is rebuilt. No issue is marked verified by this baseline capture.

### Dirty-worktree authority classification

The pre-existing dirty paths were inspected without reset, cleanup, or
overwrite. They are retained as user-owned carry-forward changes because they
align with the active repair boundary:

- `app/main/main.ts` and `scripts/electron-dev.mjs`: packaged/development
  optional-Python startup boundary and non-blocking missing-runtime handling;
- `app/shared/companionOrientation.ts` and its renderer test: Unit/Note
  vocabulary alignment for the local-facts Companion boundary;
- the five product-system authority documents: current UX direction, roadmap,
  execution control, and Human Gate 2 repair scope;
- the new surface-host E2E metadata declarations: test-only evidence fencing;
- `docs/BLACK_SKIES_FIX_TRACKER.md`: this execution receipt.

No dirty path has been deleted, reset, or moved into the preserved comparison
checkout. The candidate remains unclean until these carry-forward changes and
the implementation changes in this cycle are assembled into one reviewed
commit. The ancestor-bound installer is therefore retained as historical,
application-only evidence and is not promoted to exact current-candidate
evidence.

### Execution evidence so far

- `pnpm lint:docs`: passed; 52 authority documents and local links checked.
- `git diff --check`: passed.
- `node --test scripts/dev-runner.test.mjs`: passed, 4/4.
- `pnpm stage19:lint`: passed.
- `pnpm --filter @blackskies/app typecheck:all`: passed.
- `pnpm --filter @blackskies/app lint`: passed.
- Focused renderer/IPC/persistence suites: 11 files, 197/197 tests passed.
- Stub/evidence fencing suite: 13/13 Python tests passed after adding explicit
  `HARNESS_ONLY` ownership metadata to both surface-host specs. The initial
  run failed 1 metadata guard because those two specs were unclassified; no
  product behavior failure was found.
- Rebuilt dirty-candidate Electron slice: 7/7 targeted tests passed.
- Complete Stage 19 dirty-development regression: 44 critical test files,
  709 passed, 2 skipped; startup preflight 1/1; Electron matrix 31/31.
- The complete Electron run emitted one non-failing `Viewport failed to
  stabilize` warning during a Writing Studio shell case. The affected
  `stage19-writing-shell.spec.ts` rerun passed 4/4 without the warning, so the
  signal is currently classified as `harness/host-transient-unreproduced`,
  not waived. P13 remains open with a reopen trigger if it repeats in the next
  clean-candidate regression.

These results are mechanically tested development-candidate evidence only.
They do not establish package-qualified, exact-installed, author-accepted,
or Human Gate 2 status.

### Current authority status after the repair pass

- P1 launcher boundary: `mechanically-tested`.
- P2 package boundary: `historical-app-only`; current clean rebuild still
  required.
- P3 firewall boundary: `exact-blocked-external` on the non-elevated host;
  normal application runtime remains separate from firewall administration.
- P4 evidence identity: `unproven` until the dirty carry-forward changes are
  committed and a new receipt binds the resulting clean commit and installer.
- P5–P12 product/state boundaries: `mechanically-tested`; Human Gate 2 remains
  open for author usability and visual acceptance.
- P13 viewport signal: `harness/host-transient-unreproduced`, still open for
  clean-candidate confirmation.
- P14 stub/legacy boundary: `mechanically-tested` for the covered default/mock
  guards; no provider-quality or broad analytics claim is made.
- P15 Programs 1–4 reconciliation: documented non-claims remain active;
  deferred Program 5 intake/discovery and Human Gate 3 remain open.

### Exact package/install qualification update

The package-qualified exact candidate is `e3b6ea95cafd3eac35d5c72f09b1f20408a8aab9`.
`pnpm --filter @blackskies/app package:win` passed from that commit and
produced:

- installer: `app/release/BlackSkies-Setup-1.0.0-rc1.exe`;
- installer SHA-256:
  `88bed96614a1ff674593749c71505f5ea943c3a55ca4ec1d94b28de0ad08c866`;
- unpacked forbidden-path count: `0`;
- package receipt commit and installer hash: exact match;
- signature: `NotSigned`, consistent with the private unsigned-internal-RC
  policy;
- application-only installed lifecycle: `passed`;
- qualification mode: `application-only-no-firewall`;
- packaged startup: one canonical sandboxed Writing window;
- optional Command transition: two sandboxed windows;
- forbidden runtime processes: `0`;
- exact Markdown export: passed;
- representative 100-unit workflow: passed;
- uninstall, external-data preservation, and same-installer reinstall: passed.

The no-skip firewall probe correctly returned `exact-blocked-external` before
installation because the current host is not elevated. No Black Skies firewall
rule exists after the probe, and no normal application lane creates one. The
exact package is therefore package-qualified and application-only installed,
but not exact-installed and not eligible for Human Gate 2 until an elevated
  firewall-isolated witness passes.

The final evidence reconciliation that records this artifact is documentation-
only and does not change product/runtime files; the package receipt remains
bound to `e3b6ea95`.

The first application-only witness exposed and repaired a qualification-script
compatibility defect: Windows PowerShell on this host does not implement
`[System.IO.Path]::GetRelativePath`. The bounded compatibility helper is in
`scripts/stage19-installed-lifecycle.ps1`, committed in `7208b8b8`, and the
full lifecycle was rerun successfully afterward.

### 2026-08-23 pre-human correction pass

The clean `8e54788e` candidate audit identified bounded gaps that must close
before a new exact candidate is offered for Human Gate 2: closing Structure
did not cancel an unsaved staged order; a small set of Writing Studio labels
fell below the scoped `0.8rem` text floor; packaged-state fencing for
deterministic chooser paths was implicit; and renderer bridge plus post-Apply
immutability evidence was incomplete. The current repair cancels hidden staged
order on disclosure close, raises the scoped text floor, forces packaged
native choosers, and adds controller, repository, IPC, layout/contrast, and
Electron evidence for those boundaries. Focused verification is green at
`7` files / `172` tests plus production build, typecheck, and the targeted
Electron Structure journey. Full dirty regression, exact clean commit,
clean regression, and exact package/install qualification remain the next
mechanical gates; Human Gate 2/3 and human acceptance remain unclaimed.

The complete dirty-candidate gate subsequently passed `49` critical files
with `745` tests passed and `2` skipped, startup preflight `1/1`, and Electron
`32/32`. One earlier run and its immediate isolated rerun exceeded the fixed
100-Unit creation ceiling at `18.4s`; controlled prior/current comparisons
ruled out the readability and Structure-close changes, and the successful full
rerun measured `4.17s` creation and `156ms` selection. The signal remains a
documented host/filesystem-contention reopening trigger; the ceiling was not
raised and the failure was not waived. Clean commit/regression and exact
package/install qualification are still required before Human Gate 2.

The product boundary is now committed at `13da251c`. Its clean regression
passed `49` files / `745` passed / `2` skipped, startup preflight `1/1`, and
Electron `32/32`. The exact rebuilt installer SHA-256 is
`09a41ef179b9d42a32ee42fb2cc0aa3cfe91bae838c2206145d0d30ca056aa69`;
the receipt matches the product commit, unpacked forbidden paths are zero, and
the application-only install/smoke/uninstall/reinstall lifecycle passed. The
candidate is ready for hands-on product review. Exact firewall isolation is
still `exact-blocked-external` on the non-elevated session, so formal Human
Gate 2 acceptance remains blocked until that witness and the author review
both pass.
