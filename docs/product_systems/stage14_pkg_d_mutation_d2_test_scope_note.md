# PKG-D Mutation D2 Targeted Test Scope Note

## Purpose

Authorize only the minimum renderer test update needed to align an existing request-shape expectation with the already implemented amended PKG-D Mutation D2 contract.

## Current Context

- Amended PKG-D Mutation D2 is already implemented.
- Export and draft acceptance request shape now carries `projectPath` / `project_path` as write-target context while preserving `projectId` / `project_id` as canonical identity.
- The targeted divergent-root pytest passed.
- A targeted renderer preflight test run failed.
- At least one relevant failure is caused by an existing request-shape expectation that no longer matches the amended D2 export request contract because the request now includes `projectPath`.
- The impacted renderer test file was outside the prior authorized edit list, so it was not changed during amended D2 execution.

## Authorized Change

This note authorizes only targeted request-shape test updates in:

`app/renderer/__tests__/AppPreflight.test.tsx`

Permitted update shape:

- adjust existing export request expectations so they reflect the amended D2 request contract
- use narrow expectation changes only
- preserve existing test intent outside the request-shape alignment

## Forbidden By This Note

This note does not authorize:

- any production file changes
- any runtime behavior changes
- any broad renderer test refactor
- any new renderer feature behavior
- any App behavior change beyond the already implemented amended D2 contract
- any ProjectHome changes
- any loader changes
- any recovery changes
- any restore changes
- any snapshot changes
- any recents changes
- any UI visibility changes
- any runtime truth changes
- any protected evidence access or mutation
- any Stage 15 work

## Boundary

If additional renderer failures require anything beyond narrow request-shape expectation alignment in `app/renderer/__tests__/AppPreflight.test.tsx`, this note is insufficient and a new scope decision is required before further edits.

PZ_CONTINUE: PKG-D D2 targeted test update authorized
