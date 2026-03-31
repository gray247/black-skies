Status: Draft
Version: 1.0
Last Reviewed: 2026-03-31

# Phase 9-11 Scripts

This file documents the scripts that actually exist.

## `scripts/insights-rescue.ps1`

Purpose:
- rebuild the packaged renderer and main bundles
- run Playwright smoke and Insights specs
- capture trace output when the run fails

What it is not:
- it does not reset an Overseer
- it does not clear a model queue
- it does not repair a batch job system

Current behavior:
- `-SkipSmokeTest` skips the smoke gate
- it always runs the Insights spec after the build step

## `scripts/dev-runner.mjs`

Purpose:
- launch the renderer dev server
- launch the Electron shell
- stop both processes together on exit or signal

This is a local development launcher, not a job runner.

## Notes

If future Phase 9-11 utilities are added, they should be documented here only if they actually exist in the repo.
