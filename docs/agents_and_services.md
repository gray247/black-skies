# docs/agents_and_services.md — Agent Hooks (Source of truth)
**Status:** LOCKED · 2025-09-15 · Phase 2  
Covers: where agents plug in post-MVP; guardrails & allowed ops.

## Allowed Agent Tasks (examples)
- Generate boilerplate files or tests; lint/format runs.
- Suggest refactors (non-destructive) with diffs for review.
- Batch critique runs or batch scene exports.

## Guardrails
- Read-only until explicit approval; diffs must be human-applied.
- Respect token budgets and privacy policy.
