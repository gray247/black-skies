# Human Gate 2 Repair Batch HG2-RPR-D Evidence Receipt

## Status

- Status: `LOCAL REPAIR QUALIFICATION PASSED; DURABLE EXACT-CANDIDATE AND HOSTED WINDOWS QUALIFICATION PENDING`
- Date: `2026-08-13`
- Starting commit: `1da56446295ac2477051e43e0c9e2ec867e1358b`
- Branch: `codex/foundation-audit`
- Scope: `HG2-RPR-D qualification-harness repair for the complete Human Gate 2 candidate only`
- Protected evidence: `NOT USED`
- Git authority: `Jason alone stages, commits, and pushes`

## Finding And Repair

The first hosted Windows qualification run for the complete repaired candidate
failed before packaging. Twenty-nine built-Electron journeys all stopped while
waiting for the optional `Open Command Center in second window` control.

This was one shared harness boundary, not twenty-nine product defects. The
Writing Studio was healthy, but its Command bridge was absent. Hosted Electron
can repeat an unchanged `additionalArguments` value in the renderer process.
The legacy and dedicated preloads treated every duplicate as a conflicting
identity, failed closed, and consequently hid the optional surface controls.

The repair keeps the safety rule while recognizing Electron's valid repetition:

- missing, blank, unknown, or *conflicting* split-window values still fail
  closed;
- repeated values are accepted only when every distinct value is identical;
- both development and packaged preloads apply the same rule; and
- no product workflow, project truth, manuscript text, provider route,
  credential, Companion memory, or physical-window policy changed.

## Local Evidence

| Check | Result |
| --- | --- |
| Repeated-identical and conflicting-identity preload contracts | Green: 17 focused tests passed |
| CI-style built-Electron Writing/Command handoff | Green: 3 focused journeys passed |
| Full type boundary, build, unit/component/contract matrix, and complete Electron matrix | Green through `pnpm stage19:regression -- --allow-dirty` |
| Protected evidence, author prose, credentials, provider calls, and local-model execution | Not used |

The full local regression used its documented dirty-development override only
because this repair is not yet a durable candidate. Its complete matrix
finished green; it is not substitute evidence for the clean hosted run.

## Explicit Non-Claims

This receipt does not claim:

- a committed exact candidate;
- GitHub Windows package/install, offline lifecycle, or project-reopen proof;
- Human Gate 2 author acceptance;
- local-LLM, provider, generic chat, durable Companion memory, or automatic
  writing/structure behavior; or
- full Program 5 long-manuscript intake, discovery, or Human Gate 3.

## Next Exact Step

Jason manually stages, commits, and pushes this repair together with this
receipt. The resulting exact commit must run the manual GitHub Windows
packaging workflow. Only if that clean hosted qualification passes may the
complete repaired candidate proceed to the already-planned Human Gate 2 repeat.
