# Program 4 Batch P4-C Evidence Receipt

## Status

- Status: `P4-C FOLLOW-UP REPAIR QUALIFIED LOCALLY; AWAITING CLEAN-CANDIDATE CHECKPOINT`
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
  matrix.

The repair makes the Command notice slot explicit, confines task-canvas
overflow to the canvas, and keeps the header/footer above it. The visual
reference files remain unchanged. A later exact hosted run showed that
Playwright rejects a changed capture rectangle before it can evaluate the
measured host-only rasterization seam. The final follow-up repair therefore
freezes only the test capture frame to the approved reference dimensions,
while retaining a 2.5 percent maximum pixel-difference ratio for material
presentation changes. It does not change the product viewport, layout, or
reference images.

The pre-follow-up fixed Stage 19 regression was green: 42 unit or component
files, 672 passing tests, 2 intentional skips, and 28 Electron journeys. The
follow-up P3 visual reference witness and Stage 19 lint are green locally.
The full exact clean-candidate regression, package, and installed lifecycle
remain required after this repair is committed.

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
- `app/renderer/Stage19WritingSpineView.tsx`
- `app/renderer/styles/app.css`
- `scripts/stage19-regression.mjs`
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
| Follow-up Stage 19 lint | Green |

## Exact-Candidate Next Sequence

Jason first commits and pushes the P4-C follow-up repair. The next automated
step runs the exact combined Program 3 plus Program 4 regression, packaging,
and installed offline lifecycle against that pushed runtime candidate. It
remains automation, not a human product review. Only after that evidence is
green is the complete candidate ready for Human Gate 2.

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
