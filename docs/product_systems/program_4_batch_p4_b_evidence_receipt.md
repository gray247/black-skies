# Program 4 Batch P4-B Evidence Receipt

## Status

- Status: `DURABLY CLOSED`
- Date: `2026-08-11`
- Starting commit: `fc759a6847d82531eb4a8939d20a71d90ab423d7`
- Branch: `codex/foundation-audit`
- Model: `GPT-5.6 Terra`
- Reasoning effort: `high`
- Mutation authority: `Program 4 P4-B only`
- Git authority: `Jason alone stages, commits, and pushes`

## Delivered Workflow

P4-B turns the P4-A local orientation contract into one small, optional
workflow:

1. The author opens the closed-by-default bottom Writing Studio seam.
2. The author enters one supported local-orientation question.
3. The existing Command host shows a temporary result in its task canvas.
4. The author can return to Writing or dismiss the result.

The entry names its local scope before submission. It is disabled until a
project is open, and it states that no AI is called. The result reports only
the owner-labelled local facts already permitted by P4-A. It adds no permanent
Command workspace, conversation history, memory, saved note, outline item, or
manuscript action.

## Placement Decision

The result always opens in the primary current-window Command surface for this
first renderer-local slice. When an optional second-window Command placement
is already open, the existing host safely returns Command to the primary
window. This deliberately avoids introducing cross-window result injection,
caching, persistence, or a second temporary state owner. Optional secondary
presentation remains a later, explicitly authorized decision.

## Changed Files

- `app/renderer/Stage19WritingSpineApp.tsx`
- `app/renderer/Stage19WritingSpineView.tsx`
- `app/renderer/styles/app.css`
- `app/renderer/__tests__/Stage19WritingSpineApp.test.tsx`
- `docs/product_systems/program_4_minimal_companion_owner_routing_implementation_plan.md`
- this receipt and current-authority/register records

## Automated Evidence

| Check | Result |
| --- | --- |
| Focused Companion renderer tests | Green: 1 file, 5 P4-B tests |
| Full Stage 19 renderer component suite | Green: 1 file, 91 tests |
| Full application TypeScript check | Green |
| Production renderer and main-process build | Green |
| Diff whitespace check | Green |

The focused checks prove:

- the bottom seam is closed by default, exposes local scope, and submits by
  keyboard without replacing or saving manuscript prose;
- a supported question reaches the temporary Command result with project,
  manuscript-unit, and Living Outline owner labels and limitation language;
- unsupported text is explicitly not routed and does not expose an AI workflow;
- return restores the Writing Studio and editor focus; dismissal removes only
  the temporary result;
- Focus mode hides the entry; a failed Command move leaves Writing usable and
  reports that the request was not saved; and
- an existing optional second-window placement safely returns to the primary
  Command surface instead of gaining a cross-window temporary-state bridge.

## Exclusions Preserved

- no AI, provider, credential, privacy, cost, or outbound request path;
- no prose reading, rewrite, selection restoration, manuscript mutation,
  outline mutation, note creation, signal creation, or truth change;
- no request logging, durable history, recap cache, analytics, or project
  sidecar; and
- no legacy Companion overlay, generic chat, new Command workspace, or
  secondary-window state projection.

## Closure

Jason committed and pushed this exact P4-B batch at
`f6090498a8ea04f011fc30c890af521aa712940e` on `codex/foundation-audit`.
P4-C is the active batch. It qualifies the full temporary workflow against
project reopen, isolation, changed-surface checks, and the combined Program 3
plus Program 4 candidate.
