Status: Active
Version: 1.0
Last Reviewed: 2026-03-31

# Critique Loop Terminology

This file keeps terminology honest.

## Insights Overlay

Renderer-only workspace for opening ChatGPT in an isolated pane. It is not the same thing as the service-side critique flow.

## Critique Automation

This is the idea of batch critique runs. The current backend does not implement a queued `/batch/critique` job system.

## Overseer

Do not use this term for current runtime behavior.

There is no runtime Overseer in the codebase. If the term appears in future design notes, it should mean a durable job coordinator, not the existing service layer.

## Run All

UI action that kicks off critique work in the current scope.

The current implementation still resolves through service endpoints, not a persisted batch queue.

## Accept / Rollback

Actions that apply or revert suggested edits from critiques.

Use these terms only for the actual accept/rewrite flow that exists in code.

## Canonical Usage

Use service names and endpoint names when you mean shipped behavior.

Use batch/job/Overseer language only for clearly labeled future designs.
