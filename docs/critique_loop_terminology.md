Status: Active
Version: 1.0
Last Reviewed: 2026-03-31

# Critique Loop Terminology

Historical terminology note: this file keeps legacy critique-loop wording honest. It does not define a live batch system, agent runtime, or job coordinator.

## Insights Overlay

Renderer-only workspace for opening ChatGPT in an isolated pane. It is not the same thing as the service-side critique flow.

## Critique Automation

This is the idea of batch critique runs. The current backend does not implement a persisted `/batch/critique` job system.

## Job Coordinator

Do not use this term for current runtime behavior.

There is no runtime job coordinator in the codebase. If the term appears in future design notes, it should mean a durable job coordinator, not the existing service layer.

## Run All

UI action that kicks off critique work in the current scope.

The current implementation still resolves through service endpoints, not persisted batch lifecycle state.

## Accept / Rollback

Actions that apply or revert suggested edits from critiques.

Use these terms only for the actual accept/rewrite flow that exists in code.

## Canonical Usage

Use service names and endpoint names when you mean shipped behavior.

Use batch/job/coordinator language only for clearly labeled future designs.
