Status: Draft
Version: 1.0
Last Reviewed: 2025-11-05

# docs/specs/model_backend.md — DRAFT

## Purpose
Introduce the **Model Router** abstraction so every AI-powered call flows through a single, policy-aware layer instead of services invoking external providers directly.

## Responsibilities
- **Provider orchestration:** expose drivers for `local_llm`, `openai`, and other optional vendors (e.g., `deepseek`) via a pluggable registry.
- **Per-task routing:** determine which provider(s) execute specific jobs (`outline`, `draft`, `critique`, future insight scoring) based on policy configuration and caller-supplied budget status.
- **Token/cost accounting:** measure tokens in/out, map to dollar estimates, and leave budget persistence to `BudgetService`.
- **Privacy enforcement:** honor Insights Overlay by blocking external API calls, require explicit user consent before enabling API Mode, and log decisions for audits.
- **Telemetry hooks:** emit routing decisions, durations, and rejection reasons to `.perf/` (see `./performance_telemetry_policy.md`).

## Routing Rules
Each task has a dedicated helper and routing table. Example signatures:

- `generate_outline(project_id, scope, context, policy_hint)`
- `generate_draft(project_id, unit_ids, rubric, policy_hint)`
- `run_critique(project_id, job_id, unit_ids, rubric, policy_hint)`
- Future analytics work (`build_analytics`, `refresh_heatmap`) will invoke the same router.

The router evaluates:
1. **Policy mode** (`local_only`, `local_then_api_fallback`, `api_only`).
2. **Budget status** (the caller passes `ok`, `soft-limit`, or `blocked` after consulting `BudgetService`).
3. **Provider health** (model availability, rate limits, companion mode status).

When configured `local_first`, the router runs `local_llm` immediately and gates the API fallback behind success/failure or caller-supplied budget status. In `api_only` mode, the router bypasses the local fallback but still respects the budget status and consent inputs it is given.

Long-form rewrite recovery adds one bounded exception path:
- draft generation uses the default draft route
- first rewrite uses the default rewrite route
- if that rewrite fails only as `borderline_quality_after_rewrite`, one retry may escalate to a stronger rewrite model
- that retry now uses span-level patch rescue with stricter fidelity constraints rather than a full-scene rescue rewrite
- the stronger rewrite path is explicit and persisted in retry/model diagnostics
- hard failures are not retried through the stronger path

Long-form rescue generation now has an explicit generation-strategy layer under the rescue path:
- primary repair strategy: `slot_patch`
- escalation repair strategy: `local_rewrite_block`

The detailed staged rescue architecture is defined in [rescue_pipeline_architecture.md](./rescue_pipeline_architecture.md). This model-backend spec only defines routing/model responsibilities, not rescue-edit contracts.

## Policy Configuration
Policy keys live in `settings.json` and reference `Model Router` behaviors (`AiMode`). Valid values:

- `local_only` — only `local_llm` may run. Fall back to hints for blocked automation.
- `local_then_api_fallback` — prefer local, allow external call when fallback flag is enabled (per user toggle).
- `api_only` — explicit consent for remote execution; still subject to budgets and privacy rules.

Insights Overlay overrides these settings: when active, the router refuses to create outbound API calls regardless of policy.

## Token & Cost Accounting
- Track `tokens_in`, `tokens_out`, and `estimated_cost_usd`.
- Expose budget state through `/api/v1/draft/preflight` and `critique` endpoints before running any provider call. Those endpoints derive their budget decision from `BudgetService`.
- Write budget events to `.perf/model_router_budget.jsonl` for auditing.

## Privacy Rules
- External providers only reachable from **API Mode** with a stored API key or explicit toggle.
- Insights Overlay sets a hard block; UI automations use the router to verify status before triggering critique threads.
- All routed calls redact manuscript text (hashes allowed) in logs and emit telemetry flagged as `companion=false` or `true`.

## Integration & References
- Architecture (`./architecture.md`): the router sits between FastAPI services and external LLMs.
- Endpoints (`./endpoints.md`): `/outline/build`, `/draft/generate`, and `/draft/critique` route through services first and then use the router for provider selection; responses stay unchanged but now include `router_trace`.
- Agents (`./agents_and_services.md`): test-support wrappers should never call models directly; production services go through the router.
- Policies (`../policies.md`): reference this doc for cost/privacy expectations.
- Settings (`../settings.md`): AI mode selection toggles router behavior.

## Phase Alignment
- Router ships early (Phase 2+) to serve outline/draft/critique flows.
- Phase 9 control, visibility, and insight surfaces may call the Model Router if they need model-backed scoring, but they do not imply a persisted batch system or a new control plane.

## Current Engine Priority (Sequencing)
API-backed long-form execution is validated, and rescue-plumbing / reliability-control closeout is complete. The active engine phase is now **Outline-Faithful Editorial Reliability**. Current focus:
- reduce generation-side variance inside rewrite and rescue generation
- preserve outline-faithful rewrite guardrails: no subject drift, no invented story changes, and no wild length drift
- improve rescue quality stability without reopening bounded-slot plumbing
- use replay-backed evidence plus bounded live samples to measure progress

The rescue-model comparison milestone is complete. `gpt-5.4-mini` is now the default bounded rescue model because it materially outperformed `gpt-4o-mini` on clean rescue reliability while preserving adversarial stability.

The current stable editorial baseline is:
- rescue model: `gpt-5.4-mini`
- rescue strategy: `slot_patch`
- bounded clean sample: `6/10`
- bounded adversarial sample: `5/5`

Subsequent rescue-generation experiments did not produce a stronger adoptable path. The current decision point is therefore whether to hold this stable baseline and move remaining generation-side misses into writer/product-level handling, or run one final bounded higher-capability rescue comparison. See [../runbooks/editorial_reliability_decision_record_20260318.md](../runbooks/editorial_reliability_decision_record_20260318.md). UI docking/accessibility polish and plugin hook experiments remain tracked separately.
