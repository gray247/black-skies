Status: Active
Version: 1.1.0
Last Reviewed: 2026-03-31

# Phase Bridge

## Purpose
Clarify the transition from Phase 8 through Phase 8.5 into Phase 9 without reintroducing job-coordinator, background-worker, or agent-runtime assumptions.

## Gates
- **Phase 8** is complete once the core service-first writing flow, critique loop, recovery, and export stability are shipped.
- **Phase 8.5** is complete once the runtime/control-plane story is honest: docs match runtime, `AgentOrchestrator` is out of the runtime namespace, execution policy is centralized, budget authority is centralized, and resilience layers are explicitly separated.
- **Phase 9** begins after Phase 8.5 and focuses on analytics, visualization, and insight surfaces on top of the stabilized system.
- **Phase 10** remains the accessibility and export phase.
- **Phase 11** remains the extensions and optional-wrapper phase.

## Risks & Mitigations
- **Budget overruns:** enforce hard caps in `BudgetService`; do not invent a background-worker layer to manage spend.
- **Analytics scope drift:** keep Phase 9 focused on insight surfaces and diagnostics, not orchestration.
- **Export regressions:** verify MD/JSON/PDF/EPUB outputs against golden masters and include automated checksum comparisons in CI.
- **Future coordinator creep:** if a durable batch/job system is ever needed, document that decision separately and do not smuggle it into Phase 9 language.
