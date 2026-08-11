# Program 4 Batch P4-C Evidence Receipt

## Status

- Status: `P4-C INSTALLED-QUALIFICATION MEASUREMENT REPAIR QUALIFIED LOCALLY; AWAITING CLEAN-CANDIDATE CHECKPOINT`
- Date: `2026-08-11`
- Starting commit: `f6090498a8ea04f011fc30c890af521aa712940e`
- Branch: `codex/foundation-audit`
- Model: `GPT-5.6 Terra`
- Reasoning effort: `high`
- Mutation authority: `Program 4 P4-C only`
- Git authority: `Jason alone stages, commits, and pushes`

## Post-Checkpoint Repair Qualification

The first hosted combined Program 3 plus Program 4 run exposed two bounded
qualification defects before any human review:

- the optional Command notice could alter the Command grid's implicit row
  placement, allowing the task canvas to cover return controls; and
- the existing targeted Windows visual references could vary by a one-pixel
  native content-area rounding seam when executed within the full Electron
  matrix; and
- the JSDOM test host did not provide the standard `Range.getClientRects()`
  layout API that CodeMirror can call after a deferred restored-selection
  measurement.

The repair makes the Command notice slot explicit, confines task-canvas
overflow to the canvas, and keeps the header/footer above it. The visual
reference files remain unchanged. A later exact hosted run showed that
Playwright rejects a changed capture rectangle before it can evaluate the
measured host-only rasterization seam. The final follow-up repair therefore
freezes only the test capture frame to the approved reference dimensions,
while retaining a 2.5 percent maximum pixel-difference ratio for material
presentation changes. It does not change the product viewport, layout, or
reference images. That same hosted run showed all 672 tests passing before
the missing JSDOM geometry method was reported as an unhandled CodeMirror
error. The editor now requests CodeMirror's scroll-into-view effect only when
the current runtime exposes Range layout measurement. It still restores and
focuses the selection in layout-free environments, while production browsers
and Electron retain the scroll behavior.

The pre-follow-up fixed Stage 19 regression was green: 42 unit or component
files, 672 passing tests, 2 intentional skips, and 28 Electron journeys. The
follow-up P3 visual-reference witness, DraftEditor restored-selection suite,
Stage 19 lint, application type check, and documentation check are green
locally. The full exact clean-candidate regression, package, and installed
lifecycle remain required after this repair is committed.

## Installed-Qualification Reconciliation

The repeated hosted installed-lifecycle failure was not a third instance of
the earlier visual or editor-harness defects. It exposed a qualification
boundary that still mixed the retained V1 startup topology with the approved
Program 3 and Program 4 topology:

- the historical V1 reference starts two physical windows; but
- the current product must start one sandboxed Writing Studio window, use an
  explicit in-window transition to Command Center when summoned, and create a
  second physical Command Center window only when the author asks for it.

The repair therefore separates the historical V1 record from the current
combined-candidate qualification rather than weakening either one. The
current installed protocol now proves all of the following independently:

1. canonical startup has exactly one Writing Studio window;
2. the author can move to and return from current-window Command Center;
3. an explicit request can open the optional second Command Center window;
4. both final windows retain their narrow, role-specific preload contracts;
5. no packaged launch can silently enable a second window merely because two
   displays are connected; and
6. the combined receipt uses a Program 3 and Program 4 verifier with no V1
   paired-reference comparison.

The historical V1 two-window performance evidence remains intact for its own
accepted V1 claim. It is no longer a comparison candidate for this different
product topology. A focused contract test, the affected Electron paths, and
the complete dirty-development regression cover the new qualification lane
locally. The exact hosted package/install lifecycle remains the authority for
the clean candidate.

## Measurement-Lifecycle Follow-Up

The first clean hosted run of the Writing-first protocol passed the complete
regression and successfully built the installer. The installed lifecycle then
reached the new cold-launch measurement and failed before evaluating any
product qualification because the measurement code cleared its local launch
handle immediately after clean teardown, then attempted to read its canonical
window facts from that cleared handle.

This is a harness bookkeeping defect, not a second-window behavior failure.
The repair snapshots the canonical and optional-window facts before teardown,
then closes the installed application. A direct deterministic test now covers
that ordering, alongside the existing topology and receipt-validator tests.
The clean hosted package/install run remains required after this narrow repair
is committed.

The second clean hosted run passed regression and packaging again and confirmed
the teardown-order repair. It then found that the post-request runtime window
record did not carry each window's visibility state, even though the verifier
correctly required that state. The record now includes the native visibility
fact and the direct measurement test asserts both post-request visible windows.
This closes the currently identified measurement-field omission; the exact
hosted lifecycle remains required after this repair is committed.

## Delivered Qualification Boundary

P4-C adds a built-Electron route witness for the complete first Companion
workflow. It proves that a supported orientation request:

- enters from the quiet Writing Studio bottom seam;
- moves the temporary answer to current-window Command even when an optional
  Command window had been open;
- reports local facts without reading prose or calling an AI/provider;
- leaves `project.json` and the manuscript draft byte-for-byte unchanged;
- creates no Companion-named project artifact; and
- disappears after a clean application close, relaunch, and project reopen.

This is a deterministic fixture test only. It does not use author prose,
credentials, provider activity, or a human visual judgment.

## Changed Files

- `app/tests/e2e/stage19-companion-orientation.spec.ts`
- `app/tests/e2e/stage19-program3-visual.spec.ts`
- `app/renderer/DraftEditor.tsx`
- `app/renderer/Stage19WritingSpineView.tsx`
- `app/renderer/styles/app.css`
- `scripts/stage19-regression.mjs`
- `app/scripts/stage19-installed-smoke.mjs`
- `scripts/stage19-installed-lifecycle.ps1`
- `scripts/verify-program3-combined-performance.mjs`
- `app/main/main.ts`
- `app/main/__tests__/program3CombinedInstalledQualification.test.ts`
- `app/main/__tests__/splitCommandSecondaryLaunchHook.test.ts`
- `app/tests/e2e/stage19-electron-support.ts`
- `app/tests/e2e/stage19-surface-host.spec.ts`
- `.github/workflows/stage19-packaging.yml`
- `docs/testing/program3_surface_performance_protocol.json`
- `docs/product_systems/program_4_batch_p4_b_evidence_receipt.md`
- `docs/product_systems/program_4_minimal_companion_owner_routing_implementation_plan.md`
- this receipt and current-authority/register records

## Automated Evidence

| Check | Result |
| --- | --- |
| Built-Electron P4 temporary-state/reopen witness | Green: 1 journey |
| Built-Electron P3 topology, shell, presentation, and P4 witness group | Green: 4 journeys |
| Full Stage 19 renderer component suite | Green: 1 file, 91 tests |
| Full application TypeScript check | Green |
| First-party application lint | Green with zero warnings |
| Production renderer and main-process build | Green |
| Package-safe preflight | Green; protected evidence not used |
| Full fixed Stage 19 regression | Green with the dirty-development override; protected evidence not used |
| Current-authority documentation check | Green: 46 files, local links resolved |
| Diff whitespace check | Green |
| Follow-up P3 visual-reference frame witness | Green locally: 1 journey |
| Follow-up DraftEditor selection-restore suite | Green locally: 1 file, 8 tests |
| Follow-up Stage 19 lint | Green |
| Current Program 3/4 installed-qualification contracts | Green: 34 focused tests |
| Current Writing-first and optional-secondary Electron paths | Green: 5 targeted journeys |
| Affected split-command, spine, and recovery Electron paths | Green: 14 targeted journeys |
| Comprehensive Stage 19 regression with dirty-development override | Green; protected evidence not used |
| Measurement-lifecycle ordering contract | Green: 4 focused tests |

## Exact-Candidate Next Sequence

Jason first commits and pushes the P4-C measurement repair. The next
automated step runs the exact combined Program 3 plus Program 4 regression,
packaging, and installed offline lifecycle against that pushed runtime
candidate. It remains automation, not a human product review. Only after that
evidence is green is the complete candidate ready for Human Gate 2.

The fixed regression now includes both the P4 local-orientation contract and
the P4 built-Electron temporary-state/reopen witness. Its exact clean-candidate
mode is reserved for the post-checkpoint package/install qualification.

## Exclusions Preserved

- no provider, credential, network, or AI-model activity;
- no prose extraction, rewrite, accepted-truth change, note creation, or
  Living Outline mutation;
- no Companion history, recap, analytics, cache, or persistent sidecar;
- no generic chat, owner-routing expansion, or secondary-window result state;
  and
- no Human Gate 2 review yet.
