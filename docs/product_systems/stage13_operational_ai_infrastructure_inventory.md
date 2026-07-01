# Stage 13 Operational AI And Infrastructure Artifact Inventory

## 1. Purpose And Scope
This inventory records the current source groups for provider and transmission, model routing and qualification, queue and restart semantics, telemetry and caches, cost and budget state, and hardware detection or resource-pressure handling.

It is a planning inventory only. It identifies authority class, identity assumptions, lifecycle posture, hidden fallback risk, and later verification needs. It does not authorize implementation, repair, provider execution, model execution, queue operation, cache cleanup, budget changes, or hardware benchmarking.

## 2. Repository And Pass 8 Checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Pass 8 checkpoint: `3d7a8ff docs(product): inventory surface and UI artifacts`

## 3. Inspection Limits
- Current authority was taken from `docs/product_systems/current_truth_index.md`, `docs/product_systems/current_product_roadmap.md`, `docs/product_systems/pre_code_discovery_plan.md`, the Stage 12 AI/infrastructure contracts, and the Stage 13 salvage program.
- Bridge authority also came from `docs/product_systems/model_routing_and_budget_architecture.md` and `docs/product_systems/async_job_queue_task_runner.md`.
- Runtime and source inspection was limited to representative paths needed to classify current operational groups.
- Historical code, tests, and diagnostics were treated as evidence, not current doctrine.
- No file was edited beyond this inventory.

## 4. Provider And Transmission Artifacts
| Field | Notes |
| --- | --- |
| Representative paths | `services/src/blackskies/services/model_routing.py`, `services/src/blackskies/services/model_router.py`, `services/src/blackskies/services/model_adapters.py`, `services/src/blackskies/services/memory_prototype/provider.py`, `services/src/blackskies/services/routers/draft/generation.py`, `services/src/blackskies/services/routers/draft/revision.py`, `app/main/main.ts`, `app/main/preload.ts`, `app/shared/ipc/services.ts`, `scripts/truth-with-backend.mjs`, `scripts/launch_truth_electron.py`, `scripts/run_service_truth.py` |
| Apparent owner | Routing and provider-policy authority is service-side; the Electron bridge only relays calls and state. |
| Runtime role | Select local versus API path, normalize provider responses, start services, expose bridge APIs, and run the authoritative truth lane. |
| Authority class | Current operational source, supported by Stage 12 provider-policy doctrine and the current routing/budget architecture doc. |
| Identity assumptions | Provider name, model name, and adapter config are treated as resolved runtime metadata; provider labels or availability checks are not independent truth. |
| Lifecycle assumptions | Provider availability, fallback eligibility, and route selection are revalidated per run and may change with policy, config, or health. |
| Hidden mutation or escalation risk | `model_router.py` allows local/API fallback when the policy and availability conditions permit it; `main.ts` also falls back among Python executables and launch paths. |
| Evidence quality | High for routing shape and bridge shape, low for live provider behavior because `model_adapters.py` is a stub layer and `memory_prototype/provider.py` is read-only. |
| Later verification need | Separate route-policy review if provider substitution or fallback behavior needs tighter disposition. |
| Final disposition pending | Preserve with constraints. |

## 5. Model Identity, Routing, And Qualification Artifacts
| Field | Notes |
| --- | --- |
| Representative paths | `services/src/blackskies/services/model_router.py`, `services/src/blackskies/services/model_routing.py`, `services/src/blackskies/services/model_adapters.py`, `services/src/blackskies/services/models/*.py`, `docs/product_systems/stage12_model_qualification_lifecycle_contract.md`, `docs/product_systems/model_routing_and_budget_architecture.md`, `docs/product_systems/ai_lifecycle_and_approval_matrix.md` |
| Apparent owner | Model identity and qualification are owned by the routing and model-lifecycle doctrine, not by UI, telemetry, or cache code. |
| Runtime role | Resolve a task to a provider/model pair, report route metadata, and enforce task-specific eligibility checks. |
| Authority class | Current operational source with current bridge doctrine plus Stage 12 model-qualification authority. |
| Identity assumptions | Model identity is provider plus exact model metadata; aliases and display labels are not sufficient. Mutable aliases require revalidation. |
| Lifecycle assumptions | Availability, qualification, dequalification, retirement, and substitution are all separate states; one successful run does not establish general qualification. |
| Hidden mutation or escalation risk | `route()` and `route_with_policy()` can move between local and API paths when policy allows; that is controlled fallback, not proof of equivalence. |
| Evidence quality | Moderate to high for route policy and adapter plumbing, lower for real model quality because adapter and provider code are still mostly policy or placeholder layers. |
| Later verification need | Combined disposition matrix should decide whether any provider/model path is replaceable, constrained, or only verifiable. |
| Final disposition pending | Preserve with constraints. |

## 6. Queue, Job, Attempt, Retry, Cancellation, And Restart Artifacts
| Field | Notes |
| --- | --- |
| Representative paths | `services/src/blackskies/services/resilience.py`, `services/src/blackskies/services/tools/resilience.py`, `docs/product_systems/stage12_queue_attempt_retry_cancellation_contract.md`, `docs/product_systems/async_job_queue_task_runner.md`, `services/src/blackskies/services/routers/recovery.py`, `services/src/blackskies/services/routers/draft/revision.py`, `services/src/blackskies/services/routers/draft/generation.py` |
| Apparent owner | Queue and retry policy live in service-side workflow control, not in the writer surface. |
| Runtime role | Retry bounded service work, persist circuit state, track recovery markers, and attach queue-like safety to long-running operations. |
| Authority class | Mostly current doctrine plus runtime evidence; there is no large standalone queue engine in this scan. |
| Identity assumptions | Job and attempt identity remain tied to project, task, route, and approval state; completion does not imply acceptance. |
| Lifecycle assumptions | Retry, cancellation, partial result, restart survival, and stale or superseded state are distinct and need revalidation after drift. |
| Hidden mutation or escalation risk | `ServiceResilienceExecutor` can retry failed work; `PersistentCircuitBreaker` can persist failure state across workers; `RecoveryTracker` persists accept workflow state. |
| Evidence quality | Moderate; the code shows resilience and recovery state, but full queue semantics are still mostly governed by contract and router behavior rather than a dedicated queue subsystem. |
| Later verification need | A disposition matrix should decide whether the queue family needs a narrower follow-up if a distinct queue runtime surface is later confirmed. |
| Final disposition pending | Preserve with constraints. |

## 7. Telemetry, Diagnostics, Logs, And Cache Artifacts
| Field | Notes |
| --- | --- |
| Representative paths | `services/src/blackskies/services/diagnostics.py`, `services/src/blackskies/services/logging_config.py`, `services/src/blackskies/services/get_logger.py`, `services/src/blackskies/services/cache.py`, `services/src/blackskies/services/analytics/cache.py`, `services/src/blackskies/services/memory_lab/diagnostics.py`, `app/main/logging.ts`, `app/shared/ipc/logging.ts`, `app/shared/ipc/diagnostics.ts`, `app/renderer/utils/debugLog.ts`, `app/renderer/utils/localAnalyticsCache.ts`, `app/renderer/hooks/useLocalAnalyticsCache.ts` |
| Apparent owner | Diagnostics and caches are support systems; they are non-owning and must not become shadow truth stores. |
| Runtime role | Write structured logs, redact sensitive fields, store scoped caches, and expose diagnostics bridges to the renderer. |
| Authority class | Current operational source with Stage 12 telemetry/cache doctrine. |
| Identity assumptions | Cache identity is content- or scope-addressed, not implied by filename alone; logs are evidence, not doctrine. |
| Lifecycle assumptions | Diagnostics and cache state can be created, redacted, cleared, invalidated, or retained as witness material depending on governing policy. |
| Hidden mutation or escalation risk | `diagnostics.py` and `logging.ts` can capture project-sensitive detail if callers over-share; `cache.py` and `localAnalyticsCache.ts` can become shadow truth if treated as authoritative state. |
| Evidence quality | High for log and cache plumbing, lower for claims about what the cache or telemetry should mean. |
| Later verification need | Any later pass that disposes of retained witnesses or cache records must keep evidence-retention doctrine in view. |
| Final disposition pending | Preserve with constraints. |

## 8. Cost, Usage, Reservation, And Budget Artifacts
| Field | Notes |
| --- | --- |
| Representative paths | `services/src/blackskies/services/budgeting.py`, `services/src/blackskies/services/operations/budget_service.py`, `services/src/blackskies/services/tools/safety.py`, `services/src/blackskies/services/routers/draft/revision.py`, `app/renderer/components/BudgetMeter.tsx`, `app/renderer/components/BudgetIndicator.tsx`, `app/renderer/hooks/useBudgetIndicator.ts`, `app/renderer/utils/budgetIndicator.ts`, `docs/product_systems/stage12_cost_accounting_budget_persistence_contract.md`, `docs/product_systems/model_routing_and_budget_architecture.md` |
| Apparent owner | Budget truth is service-side; the UI can display and warn, but it does not own spend authority. |
| Runtime role | Load project budget state from `project.json`, classify spend, enforce hard limits, and present budget status. |
| Authority class | Current operational source with Stage 12 cost doctrine and bridge-level routing/budget architecture. |
| Identity assumptions | Budget identity is tied to project identity, job identity, route, provider, and model metadata; amount display alone is not authority. |
| Lifecycle assumptions | Estimates, reservations, spent state, correction state, and unknown cost state are distinct. Cancellation is not automatically zero cost. |
| Hidden mutation or escalation risk | `tools/safety.py` can block or flag invocations based on budget and privacy metadata; `revision.py` persists spend updates; `BudgetMeter` and `BudgetIndicator` can expose budget state without proving accounting accuracy. |
| Evidence quality | High for local budget persistence and guardrail shape, lower for external billing and provider-reported cost because those remain subject to separate evidence. |
| Later verification need | Later disposition work should separate estimate, reservation, observed spend, and externally billed cost rather than collapsing them. |
| Final disposition pending | Preserve with constraints. |

## 9. Hardware Detection, Qualification, And Pressure Artifacts
| Field | Notes |
| --- | --- |
| Representative paths | `docs/product_systems/stage12_hardware_resource_pressure_protection_contract.md`, `docs/product_systems/stage11_queue_service_performance_cost_hardware_model_lifecycle_questions.md`, `docs/product_systems/timeline_pacing_pressure.md`, `docs/product_systems/async_job_queue_task_runner.md`, `app/main/main.ts`, `services/tests/unit/test_memory_lab_diagnostics_slo.py`, `app/tests/e2e/startup.diagnostic.spec.ts` |
| Apparent owner | Hardware qualification is doctrine-led and pressure-aware; no dedicated runtime hardware service surfaced in the current source scan. |
| Runtime role | Gate workload eligibility, refuse unsafe pressure states, and keep local-model execution from silently assuming current machine safety. |
| Authority class | Mostly Stage 12 doctrine and evidence-adjacent tests/docs; the source tree does not show a separate hardware-management runtime module. |
| Identity assumptions | Installation identity, device identity, and environmental context are relevant; benchmark labels or prior success do not establish current qualification. |
| Lifecycle assumptions | Detection, qualification, pressure warning, degradation, refusal, and recovery are separate states; qualified hardware can become unqualified after environment drift. |
| Hidden mutation or escalation risk | `main.ts` can fall back among Python executables and launch paths; that is an environment choice, not hardware qualification by itself. |
| Evidence quality | Lower than the other families because most of the observed posture is doctrine, diagnostics, or test-adjacent rather than a direct hardware service implementation. |
| Later verification need | If hardware logic becomes execution-facing later, it should get its own narrower follow-up instead of inheriting authority from route, budget, or queue code. |
| Final disposition pending | Verify. |

## 10. Ownership Boundaries
- Author remains final authority over project truth.
- Systems own workflows; models do not own workflows.
- Providers do not own project truth, provider policy does not silently redefine doctrine, and provider acknowledgment is not independent verification.
- Telemetry, logs, caches, and diagnostics are non-owning evidence surfaces.
- Queue state does not own manuscript truth or accepted truth.
- Budget status can warn or block, but it does not own spending policy.
- Writing Surface remains the primary authoring surface; Command Center and Companion are support surfaces, not truth owners.

## 11. Identity And Binding Assumptions
- Project identity remains distinct from installation identity, device identity, display name, path, alias, cache key, or model/provider label.
- Model identity remains distinct from provider availability, model family, or marketing label.
- Queue identity remains distinct from completion or transmission success.
- Budget identity remains distinct from estimated or displayed amount.
- Cache identity remains distinct from cache presence.
- Restored, copied, or migrated state does not inherit authority merely because nearby metadata matches.
- Missing or ambiguous authority fails closed.

## 12. Lifecycle And Invalidation Risks
- Provider-policy drift can invalidate routes, permissions, approvals, cached assumptions, and fallback permissions.
- Model substitution or alias movement can invalidate model qualification.
- Retry, cancellation, or restart can invalidate queue assumptions when identity or approval changes.
- Cache and telemetry can drift into shadow truth if their retention or scope is not bounded.
- Budget state can become stale if project identity or spend history changes.
- Hardware pressure can invalidate a previously safe execution posture.

## 13. Hidden Fallback, Substitution, Retry, Or Escalation Risks
- `model_router.py` contains explicit local/API fallback paths.
- `main.ts` resolves a Python executable from environment, bundled, or default paths and warns when it has to fall back.
- `resilience.py` and `tools/resilience.py` include retry and circuit-breaker behavior that can repeat work if policy allows it.
- `tools/safety.py` can reject unsafe sharing, but the caller still has to respect the failure instead of silently escalating.
- `preload.ts` and the Electron bridge can expose harness or synthetic-state behavior; that is useful for tests but not product authority.

## 14. Evidence-Strength Limits
- Adapter stubs prove routing shape, not live provider competence.
- Harnesses and e2e fixtures prove exercised lanes only.
- Logs and diagnostics prove captured state only.
- Cache files prove cached results only.
- Budget reports prove local accounting rules only.
- Hardware posture is currently the least direct family; most evidence is doctrine or diagnostics rather than a dedicated runtime service.

## 15. Unknowns And Later Routing
- The AI/provider family and the cost/budget family are coherent enough to stay together for disposition work.
- The queue/retry/cancellation family is still coherent with the same bridge and service boundaries, but it may need a narrower appendix if a separate queue engine appears later.
- Hardware posture is under-evidenced compared with the other families and may need its own follow-up if execution-facing hardware logic is later found.
- Later routing should stay inventory-first and split only when the source family, authority chain, or evidence class materially differs.

## 16. Combined-Scope Coherence
This combined scope remains coherent enough for one inventory pass.

Reason: the same route, approval, budget, diagnostics, and fallback doctrine cuts across provider, model, queue, telemetry, cache, cost, and hardware pressure handling. The source tree does not show a separate hardware-runtime subsystem that would force an immediate split.

The weakest subfamily is hardware qualification, because the current evidence is mostly doctrine and diagnostics rather than direct runtime ownership.

## 17. Stop And Reopening Conditions
- Stop if a lower-tier source starts claiming current authority over route, model, queue, cost, telemetry, cache, or hardware truth.
- Stop if a Stage 12 contract is missing, contradictory, or infeasible in a way that would require a Stage 12 reopening path.
- Stop if implementation work, provider execution, model execution, queue operations, cache cleanup, budget changes, or hardware benchmarking are implied.
- Stop if a separate hardware-runtime or queue-runtime engine is discovered and the current inventory no longer captures the correct authority boundary.
- Stage 14 remains unauthorized until the Stage 13 program explicitly makes it eligible and a later gate authorizes it.

## 18. Recommended Next Bounded Pass
Recommended next pass: combined disposition matrix.

That pass should classify the inventoried provider, model, queue, telemetry, cache, budget, and hardware groups as preserve, preserve with constraints, replace, retire, verify, or archive later where those decisions are actually permitted. It should stay planning-only and should not execute any cleanup, archive, deletion, provider call, model call, or hardware action.
