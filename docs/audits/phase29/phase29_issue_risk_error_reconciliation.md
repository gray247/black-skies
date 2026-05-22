# Phase 29 Issue / Risk / Error Reconciliation

Status: Draft
Date: 2026-05-21

## Purpose

Phase 29 inventories unresolved bugs, deferred risks, duplicated controls, hidden dev/test surfaces, fake intelligence surfaces, placeholder UI, stale claims, broken assumptions, qualitative gaps, model-routing ambiguity, local/API quality risks, and user-facing versus dev-only confusion.

This phase is documentation-only. It does not fix runtime behavior by itself.

## What Is Already Resolved

The following Phase 27 human-smoke blockers were remediated and should be treated as resolved, not reopened:

- false dirty/unsaved before edit
- nested project creation
- active-scene flicker / startup ping-pong
- pane collapse that blocked validation

## Current Risk Inventory

| Category | Examples | Current status | Handling |
| --- | --- | --- | --- |
| Watch-only UX issues | relocation popup overlap; floating-pane awkwardness that does not block validation | Watch-only | Keep visible in tracker, but do not expand Phase 29 into cosmetic redesign work. |
| Future GUI redesign debt | crowded panes; too many always-visible controls; raw metadata presentation; buttons and tasks mashed together; need for file/dropdown/contextual systems; transitional shell | Deferred future redesign | Preserve for later GUI phases and do not turn them into Phase 29 product scope. |
| Hidden dev/test surfaces | test toggles, debug controls, and temporary buttons that could leak into the final GUI | Deferred / removal candidate | Label as dev-only or remove when a later GUI phase owns the surface. |
| Fake intelligence surfaces | placeholder gap detection, placeholder tropes/foreshadowing/placement surfaces, fake narrative intelligence panels | Future-only until implemented | Do not present as shipped intelligence capability. |
| Placeholder UI | panels or tools that exist only as scaffolding or placeholder labels | Future-only or warning | Keep them clearly marked so operators do not mistake them for final product capability. |
| Model-routing ambiguity | local-first versus API/stronger-model selection, quality threshold visibility, escalation visibility | Unresolved planning risk | Needs explicit policy in the workflow realignment spec. |
| Local/API quality risks | unclear provenance, invisible escalation, quality claims that outpace routing visibility | Unresolved planning risk | Track in later workflow/spec phases before adding more AI surfaces. |
| User-facing vs dev-only confusion | debug affordances shown as normal UI, test-only controls exposed to operators | Warning / removal candidate | Separate dev tools from product GUI or clearly label them. |
| Stale claims | docs or comments that imply the current shell is final, or that Phase 28+ still means the pre-correction bucket family | Needs rewrite | Reword as historical, future-only, or corrected numbering. |
| Broken assumptions | any doc or note that treats placeholder intelligence or GUI scaffolding as runtime truth | Needs rewrite | Reconcile in the audit and workflow spec. |

## Reconciliation Rules

- If an item blocks validation or makes the operator misread truth, treat it as a blocker for the current smoke or audit pass.
- If an item is ugly but not blocking, keep it watch-only instead of inflating it into a product rewrite.
- If an item is part of the future GUI redesign, label it deferred and do not pull it into the current correction block.
- If a claim is not backed by runtime evidence, label it as design intent, placeholder, or future-only.

## Exit Criteria

- The tracker distinguishes resolved blockers from watch-only items and future redesign debt.
- Placeholder and dev-only surfaces are clearly separated from product GUI claims.
- Model-routing and AI-quality ambiguity are explicitly called out for later workflow/spec work.
