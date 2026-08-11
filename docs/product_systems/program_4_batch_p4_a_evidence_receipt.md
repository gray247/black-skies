# Program 4 Batch P4-A Evidence Receipt

## Status

- Status: `IMPLEMENTATION AND AUTOMATION GREEN; AWAITING JASON'S GIT CHECKPOINT`
- Date: `2026-08-11`
- Starting commit: `294274e8e4a31398d064b23b0adf57cac62f3479`
- Branch: `codex/foundation-audit`
- Model: `GPT-5.6 Terra`
- Reasoning effort: `high`
- Mutation authority: `Program 4 P4-A only`
- Git authority: `Jason alone stages, commits, and pushes`

## Delivered Boundary

P4-A adds a small shared local contract for the first Companion route:

- `Where am I?`
- `Where was I?`
- `What am I working on?`

The router returns either `orientation` or `not-routed`. The orientation reducer
uses only the existing project-session and Living Outline projections to report
project title, unit count, current unit title and position, local save state,
and the active unit's outline relationship or availability.

The contract intentionally does not include manuscript drafts or prose,
project paths, credentials, providers, request transmission, persistent
storage, generic actions, or any mutation capability. Its only allowed
presentation actions are `return-to-writing` and `dismiss`.

## Changed Files

- `app/shared/companionOrientation.ts`
- `app/renderer/__tests__/companionOrientation.test.ts`
- this receipt and current-authority/register records

## Automated Evidence

| Check | Result |
| --- | --- |
| Focused Companion contract test | Green: 1 file, 6 tests |
| Full application TypeScript check | Green |
| Diff whitespace check | Green |
| Current-authority documentation check | Green: 44 files, local links resolved, no stale public-release claim |

The focused tests prove:

- natural-language normalization accepts only the three bounded phrases;
- an unsupported request receives a transparent `not-routed` result and no
  fallback route;
- orientation facts preserve source owners and currentness;
- manuscript prose, drafts, and project path do not enter the result;
- degraded outline and absent active-unit states remain explicit; and
- stale project generation fails unavailable rather than producing a summary.

## Exclusions Preserved

- no Writing Studio or Command Center visual change yet;
- no provider call, credential, API, cost, or outbound boundary;
- no sidecar, note, signal, task, analytics, memory, or conversation
  persistence;
- no manuscript, outline, feedback-note, or accepted-truth mutation;
- no legacy `CompanionOverlay` or old `App` reuse; and
- no Human Gate 2 product review.

## Next Step

Jason commits and pushes this exact P4-A batch. P4-B then adds the summonable
bottom entry and temporary Command task-canvas result using this contract.
