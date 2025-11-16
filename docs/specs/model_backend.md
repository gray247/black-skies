Status: Draft
Version: 1.0
Last Reviewed: 2025-11-05

# docs/specs/model_backend.md — DRAFT

## Purpose
Introduce the **Model Router** abstraction so every AI-powered call flows through a single, policy-aware layer instead of services invoking external providers directly.

## Responsibilities
- **Provider orchestration:** expose drivers for `local_llm`, `openai`, and other optional vendors (e.g., `deepseek`) via a pluggable registry.
- **Per-task routing:** determine which provider(s) execute specific jobs (`outline`, `draft`, `critique`, future `analytics`) based on policy configuration and budget state.
- **Token/cost accounting:** measure tokens in/out, map to dollar estimates, and update session/project budgets before and after every routed call.
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
2. **Budget state** (soft/hard caps from `project.json` + session tallies).
3. **Provider health** (model availability, rate limits, companion mode status).

When configured `local_first`, the router runs `local_llm` immediately and gates the API fallback behind success/failure or budget headroom. In `api_only` mode, the router bypasses the local fallback but still enforces budgets and consent.

## Policy Configuration
Policy keys live in `settings.json` and reference `Model Router` behaviors (`AiMode`). Valid values:

- `local_only` — only `local_llm` may run. Fall back to hints for blocked automation.
- `local_then_api_fallback` — prefer local, allow external call when fallback flag is enabled (per user toggle).
- `api_only` — explicit consent for remote execution; still subject to budgets and privacy rules.

Insights Overlay overrides these settings: when active, the router refuses to create outbound API calls regardless of policy.

## Token & Cost Accounting
- Track `tokens_in`, `tokens_out`, `estimated_cost_usd`, and update `project.json::budget` atomically.
- Expose budget state through `/api/v1/draft/preflight` and `critique` endpoints before running any provider call.
- Write budget events to `.perf/model_router_budget.jsonl` for auditing.

## Privacy Rules
- External providers only reachable from **API Mode** with a stored API key or explicit toggle.
- Insights Overlay sets a hard block; UI automations use the router to verify status before triggering critique threads.
- All routed calls redact manuscript text (hashes allowed) in logs and emit telemetry flagged as `companion=false` or `true`.

## Integration & References
- Architecture (`./architecture.md`): the router sits between FastAPI services and external LLMs.
- Endpoints (`./endpoints.md`): `/outline/build`, `/draft/generate`, `/draft/critique`, `/batch/critique` all invoke the router; responses stay unchanged but now include `router_trace`.
- Agents (`./agents_and_services.md`): agents should never call models directly; they call internal services that go through the router.
- Policies (`../policies.md`): reference this doc for cost/privacy expectations.
- Settings (`../settings.md`): AI mode selection toggles router behavior.

## Phase Alignment
- Router ships early (Phase 2+) to serve outline/draft/critique flows.
- Phase 9’s batch critique automation explicitly uses the Model Router to honor budget guards before spinning up remote evaluations.
