# Phase 13 Pass 23 - Snapshot Authority Docs Alignment

## Goal
Document the authority matrix directly from the implemented behavior.

## Local Browsing vs Backend Availability
Local browsing means the app can inspect existing local snapshot/report paths without service help. This includes:
- opening the snapshots panel
- opening the report file
- revealing the snapshot folder
- revealing the manifest file
- refreshing the panel from current local/service state

Backend availability is required only for operations that mutate or re-derive service state:
- snapshot creation
- verification
- re-verification
- backup creation
- backup restore
- restore-latest-zip-as-copy

## What `Writing tools offline` Means
`Writing tools offline` is the shared service-bridge health state. It means backend-mutating controls are unavailable. It does not mean the local snapshot browser is broken.

## Expected Offline Behavior
- local browsing stays enabled when the target paths exist
- backend-required controls are disabled or clearly fail
- the UI should not imply that a missing bridge broke local path browsing

## Report / Reveal / Manifest Authority
- `Open report file` resolves the canonical report path.
- `Reveal` resolves the canonical snapshot directory path.
- `Manifest` resolves the canonical manifest path.
- Missing files produce controlled renderer feedback.

## Snapshot Freshness Expectations
- a new snapshot appears in the mounted panel after create
- the newest ordering remains obvious
- verification or rerun updates the last-check/report state without reopening the app
- the report/details modal should continue to reflect the current state

## Tracker Alignment
`docs/BLACK_SKIES_FIX_TRACKER.md` should describe these claims in the Phase 13 bullets so the tracker and the docs say the same thing.

