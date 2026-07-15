# V2 AI Insight Register

Status: canonical evidence-preservation register; not implementation authority

Verification date: 2026-07-14

## 1. Register authority and maintenance rules

This is the single canonical register for V2 AI evaluation and orchestration
insights discovered during Stage 19 Package 19.14 reconciliation. It preserves
knowledge without moving V2 work into V1.

An entry is evidence, a question, or a candidate experiment. It is not product
authority, implementation authorization, provider approval, model selection,
or a promise that the feature will ship. Package 19.14 remains independently
closable without implementing any entry in this register.

Maintenance rules:

1. Stable finding IDs never change or get reused.
2. Historical evidence is immutable. Corrections or later conclusions create
   a new entry and list the earlier ID under `Supersession history`.
3. Evidence sources identify repository files, Git objects, or a dated
   non-invasive machine inspection. They do not contain secrets or manuscript
   content.
4. Runtime/model identity must be exact where known and `unknown` where not
   proved.
5. Confidence describes the evidence, not product desirability.
6. Every deferral has an exact reopening trigger and expected resolution stage.
7. Credentials, API keys, manuscript prose, raw manuscript-bearing prompts,
   raw provider responses, and unnecessary private filesystem paths are
   prohibited.
8. A candidate model or experiment may not be promoted into V1 authority by
   editing this register.

Allowed authority classifications are `CURRENT_AUTHORITY`,
`ACTIVE_BUT_INCOMPLETE`, `HISTORICAL`, `SUPERSEDED`, `REFERENCE_ONLY`,
`CONTRADICTORY`, and `MISSING`.

## 2. Preserved findings

### V2-AI-001 — Installed local runtime and model inventory

- **Finding:** Dated machine inspection found Ollama installed and found local
  model tags including `qwen3:4b`, `qwen3:8b`, `qwen2.5:1.5b`,
  `qwen2.5-coder:7b`, `deepseek-coder:6.7b`, and `codellama:latest`. Ollama was
  not running during inspection. No llama.cpp repository implementation was
  found.
- **Evidence source:** non-invasive Ollama executable/process/manifest
  inspection on 2026-07-14; repository search; default configuration in
  `services/src/blackskies/services/config.py`.
- **Exact runtime/model/version:** Ollama executable installed; exact Ollama
  application version was not executed and remains unknown. Repository default
  is `qwen3:4b`; installed tags are evidence of availability, not qualification.
- **Authority classification:** `REFERENCE_ONLY`.
- **V1 disposition:** At most one exact local route may later be selected and
  qualified; all other installed models are outside Package 19.14.
- **V2 relevance:** Candidate inventory for later controlled model evaluation.
- **Confidence:** High for installed tags and repository default; unknown for
  current runtime health or output quality.
- **Unresolved questions:** Exact Ollama version, model digests to pin, license
  and redistribution constraints, and whether tags still identify immutable
  model content at V2 evaluation time.
- **Required experiment:** Re-inventory versions/digests under explicit V2
  authority before any model comparison.
- **Dependencies:** Local runtime permission, model-license review, isolated
  synthetic corpus, and hardware recording.
- **Packaging implications:** Ollama and model weights are not currently bundled.
- **Exact reopening trigger:** Approved V2 AI evaluation charter with permission
  to inspect and run installed models.
- **Expected resolution stage:** V2 AI qualification discovery, before any V2
  runtime route decision.
- **Supersession history:** Initial entry; none.

### V2-AI-002 — Historical successful provider-backed runs

- **Finding:** Historical long-form evidence records successful provider-backed
  adversarial runs and bounded rescue behavior, including earlier OpenAI
  `gpt-4o` use. It does not prove local selected-prose critique quality.
- **Evidence source:** Git object
  `fa4bd0c:docs/runbooks/long_form_integrated_pass_20260316.md` and the earlier
  long-form commits cited by that record.
- **Exact runtime/model/version:** OpenAI `gpt-4o` is named for a historical
  stronger retry; exact immutable model snapshot and provider request contract
  are not recorded.
- **Authority classification:** `HISTORICAL`.
- **V1 disposition:** Do not treat as Package 19.14 qualification or reuse its
  long-form orchestration.
- **V2 relevance:** Demonstrates that task-specific quality and rescue behavior
  need controlled evaluation rather than provider reputation.
- **Confidence:** High that the record reported successful adversarial runs;
  insufficient for reproducible current-model comparison.
- **Unresolved questions:** Exact prompts, immutable model snapshot, costs,
  latency, raw scoring provenance, and reproducibility.
- **Required experiment:** Rebuild a synthetic, immutable V2 evaluation receipt
  rather than replaying manuscript-bearing historical artifacts.
- **Dependencies:** V2 evaluation authority, provider credentials, synthetic
  fixtures, cost approval, and privacy review.
- **Packaging implications:** Remote provider use adds no local model package but
  requires networking, credentials, disclosure, and budget controls.
- **Exact reopening trigger:** V2 approves provider-backed task benchmarking.
- **Expected resolution stage:** V2 provider qualification.
- **Supersession history:** Initial historical entry; never rewrite the cited
  record.

### V2-AI-003 — Historical failed local Qwen runs

- **Finding:** After an OpenAI-compatible base-URL repair, local Ollama-backed
  long-form reruns used `qwen3:4b` for drafting and `qwen3:8b` for the stronger
  retry. Clean and adversarial runs stopped immediately on `invalid_output`.
- **Evidence source:** Git object
  `fa4bd0c:docs/runbooks/long_form_integrated_pass_20260316.md`.
- **Exact runtime/model/version:** Ollama-compatible route; `qwen3:4b` and
  `qwen3:8b`; immutable weight digests and Ollama version were not recorded in
  the historical receipt.
- **Authority classification:** `HISTORICAL`.
- **V1 disposition:** This does not qualify either model for selected-prose
  critique. A V1 Local control must not ship on this evidence alone.
- **V2 relevance:** Preserves a concrete output-contract failure for later
  prompt, normalization, model, and task-fit investigation.
- **Confidence:** High for the recorded failure; low for conclusions about
  critique because the task was long-form generation/rewrite.
- **Unresolved questions:** Whether failure arose from prompt shape, compatible
  endpoint normalization, model capability, quantization, or validator rules.
- **Required experiment:** Isolate each factor with synthetic fixtures and
  frozen model/runtime identities.
- **Dependencies:** Explicit V2 model-run authority, local isolation, fixed
  fixtures, output capture rules, and resource monitoring.
- **Packaging implications:** Larger local models increase download, memory,
  startup, and disk requirements.
- **Exact reopening trigger:** V2 authorizes controlled local-model failure
  reproduction.
- **Expected resolution stage:** V2 local-model qualification lab.
- **Supersession history:** Initial historical entry; later experiments must
  reference rather than edit it.

### V2-AI-004 — Reusable provider router and policy concepts

- **Finding:** The Python service has provider registration, task capability,
  availability checks, policy evaluation, budget posture, and route metadata.
  `route_with_policy` is a stronger seam than `route`; existing behavior also
  contains automatic cross-provider fallback unsuitable for V1.
- **Evidence source:** `services/src/blackskies/services/model_router.py`,
  `services/src/blackskies/services/model_routing.py`,
  `services/src/blackskies/services/run_policy.py`,
  `services/tests/unit/test_model_router.py`, and
  `services/tests/unit/test_run_policy.py`.
- **Exact runtime/model/version:** Python/FastAPI service; Ollama and older
  OpenAI adapters; current repository default local model `qwen3:4b`.
- **Authority classification:** `REFERENCE_ONLY` for V2 orchestration.
- **V1 disposition:** Reuse vocabulary or repaired availability checks only;
  V1 route choice remains manual.
- **V2 relevance:** Candidate foundation for later policy-aware routing.
- **Confidence:** High for implemented mechanics; no evidence that current
  automatic behavior satisfies current governance.
- **Unresolved questions:** Whether V2 routing belongs in Python or main,
  whether policy and execution should be separate, and what audit history is
  durable.
- **Required experiment:** Contract-level policy simulations without provider
  execution, followed by separately authorized provider trials.
- **Dependencies:** Settled V2 route authority, task taxonomy, budget policy,
  provider registry, and observability/redaction rules.
- **Packaging implications:** Python ownership retains interpreter/service
  packaging; main ownership may duplicate adapters.
- **Exact reopening trigger:** Approval of automatic or policy-assisted V2 route
  selection.
- **Expected resolution stage:** V2 routing architecture.
- **Supersession history:** Initial entry; current V1 manual routing remains
  controlling.

### V2-AI-005 — Provider adapter seams

- **Finding:** Existing Ollama and legacy OpenAI adapters normalize common text
  responses and expose task/profile capabilities. The new TypeScript OpenAI
  gateway has stricter request bytes, timeout, cancellation, validation, and
  redaction.
- **Evidence source:** `services/src/blackskies/services/model_adapters.py`,
  `services/tests/unit/test_model_adapters.py`, `app/main/aiCritiqueGateway.ts`,
  and its test.
- **Exact runtime/model/version:** Ollama adapter default `qwen3:4b`; legacy
  OpenAI configuration is not the new pinned contract; new gateway pins
  `gpt-5.4-2026-03-05`.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE` for the new gateway;
  `REFERENCE_ONLY` for old adapters.
- **V1 disposition:** Keep the new OpenAI gateway; repair or wrap only one local
  adapter if separately authorized.
- **V2 relevance:** Provider-specific gateways are the natural boundary for
  future controlled comparisons.
- **Confidence:** High for code shape; local real-output reliability remains
  unproved.
- **Unresolved questions:** Common gateway interface, streaming policy,
  cancellation truth, structured-output support, and provider-specific error
  taxonomy.
- **Required experiment:** Adapter conformance suite using synthetic payloads,
  then provider-specific qualification.
- **Dependencies:** Shared result contract, redaction contract, provider
  authority, and credentials/runtime access.
- **Packaging implications:** Native remote fetch is light; local adapters carry
  runtime/model distribution costs.
- **Exact reopening trigger:** V2 authorizes more than the two bounded V1 routes.
- **Expected resolution stage:** V2 provider gateway architecture.
- **Supersession history:** Initial entry.

### V2-AI-006 — Prompt-construction seams

- **Finding:** The repository contains Python task profiles/compiler logic,
  legacy critique prompts, long-form rescue prompts, and the new fixed
  critique-v1 OpenAI instructions. They are separate systems with different
  output contracts.
- **Evidence source:**
  `services/src/blackskies/services/prompt_profile_resolver.py`,
  `services/src/blackskies/services/prompt_compiler.py`,
  `services/src/blackskies/services/critique.py`,
  `services/src/blackskies/services/operations/long_form_execution.py`,
  `app/main/aiCritiqueCoordinator.ts`, and
  `app/main/aiCritiqueGateway.ts`.
- **Exact runtime/model/version:** Multiple historical Python provider routes;
  new fixed OpenAI `gpt-5.4-2026-03-05` critique request.
- **Authority classification:** `REFERENCE_ONLY` except the active fixed
  Package 19.14 OpenAI prompt.
- **V1 disposition:** Do not create a prompt library or experiment framework;
  freeze one prompt per qualified V1 route.
- **V2 relevance:** Candidate prompt architecture and versioning problem.
- **Confidence:** High that multiple prompt seams exist; their comparative
  quality is unknown.
- **Unresolved questions:** Task versus model specialization, system/user
  division, schema instruction placement, injection resistance, and prompt
  version migration.
- **Required experiment:** Later factorial prompt tests on synthetic fixtures,
  with prompts and scoring plans frozen before provider runs.
- **Dependencies:** V2 experiment authority, task taxonomy, model receipts,
  evaluation design, and privacy controls.
- **Packaging implications:** Prompt assets are small but version/provenance and
  migration rules affect releases.
- **Exact reopening trigger:** V2 explicitly authorizes prompt-template
  experimentation.
- **Expected resolution stage:** V2 prompt evaluation program.
- **Supersession history:** Initial entry.

### V2-AI-007 — Qualification seam

- **Finding:** Package 19.14 introduces twelve synthetic selected-prose fixtures,
  content hashes, strict schema checks, two-run scoring, two-human review, fixed
  thresholds, and adjudication rules. The live provider work remains pending.
- **Evidence source:**
  `app/main/__tests__/fixtures/aiCritiqueQualification.v1.ts`,
  `aiCritiqueQualification.test.ts`, and
  `stage19_package_19_14_model_qualification.md`.
- **Exact runtime/model/version:** Intended current API receipt is OpenAI
  `gpt-5.4-2026-03-05`; no local model has a receipt.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE`.
- **V1 disposition:** Reuse the frozen corpus for at most one local and one API
  route, with separate receipts.
- **V2 relevance:** Strong starting point for task-specific evaluation, but not
  a multi-model tournament framework.
- **Confidence:** High for fixture integrity; provider quality is unverified.
- **Unresolved questions:** Inter-rater calibration, repeatability over time,
  drift detection, sample size by task, and when a receipt expires.
- **Required experiment:** Complete V1 receipts first; design broader V2
  methodology only under separate authority.
- **Dependencies:** Test credentials/runtime, second reviewer, randomized
  scoring, provider terms, and protected artifact handling.
- **Packaging implications:** Qualification gates releases but does not itself
  add packaged runtime dependencies.
- **Exact reopening trigger:** V2 defines task categories beyond selected-prose
  critique or evaluates more than the bounded V1 routes.
- **Expected resolution stage:** V2 evaluation-method design.
- **Supersession history:** Initial entry.

### V2-AI-008 — Hardware-class questions

- **Finding:** Installed local models vary materially in size, but no accepted
  repository evidence maps them to CPU, RAM, GPU, VRAM, startup, throughput, or
  thermal classes.
- **Evidence source:** dated 2026-07-14 installed-manifest inspection and absence
  of an accepted hardware qualification record.
- **Exact runtime/model/version:** Ollama with installed Qwen and other tags;
  exact runtime version/hardware profile not recorded here to avoid unnecessary
  private-machine data.
- **Authority classification:** `MISSING`.
- **V1 disposition:** No hardware-aware selection or benchmarking.
- **V2 relevance:** Required before claiming that a local route is usable across
  supported hardware.
- **Confidence:** High that the evidence is missing.
- **Unresolved questions:** Supported hardware tiers, cold-start ceiling,
  concurrency, battery/thermal limits, and fallback UX on weak machines.
- **Required experiment:** Controlled synthetic benchmark matrix on approved,
  anonymized hardware classes.
- **Dependencies:** Hardware inventory policy, metrics schema, model/runtime
  pinning, and resource-measurement tools.
- **Packaging implications:** Determines model-size limits, optional downloads,
  and minimum/recommended specifications.
- **Exact reopening trigger:** V2 hardware-support targets are approved.
- **Expected resolution stage:** V2 local-runtime feasibility and packaging.
- **Supersession history:** Initial entry.

### V2-AI-009 — Quality questions

- **Finding:** Real local long-form attempts failed their output contract, while
  mocked adapter tests pass. No evidence ranks candidate models for critique,
  drafting, continuity, or other tasks.
- **Evidence source:** historical record at Git object `fa4bd0c`, current local
  unit tests, and Package 19.14 qualification records.
- **Exact runtime/model/version:** Historical `qwen3:4b`/`qwen3:8b`; new API
  target `gpt-5.4-2026-03-05`.
- **Authority classification:** `MISSING` for comparative V2 quality.
- **V1 disposition:** Qualify only the exact route proposed for V1; do not infer
  quality from installation or connectivity.
- **V2 relevance:** Central evidence gap for task-to-model decisions.
- **Confidence:** High that comparison evidence is absent.
- **Unresolved questions:** Task taxonomy, acceptable variance, style respect,
  hallucination severity, refusals, and human-review workload.
- **Required experiment:** Preregistered, blinded, synthetic task evaluations
  with provider/model-specific receipts.
- **Dependencies:** Human reviewers, scoring calibration, fixtures, provider
  access, and experiment budget.
- **Packaging implications:** Quality thresholds may rule out small models that
  otherwise package well.
- **Exact reopening trigger:** V2 task taxonomy and evaluation budget are
  approved.
- **Expected resolution stage:** V2 model qualification.
- **Supersession history:** Initial entry.

### V2-AI-010 — Cost questions

- **Finding:** The new API path provides request estimates and a local UI
  ceiling; the legacy system has budget services and policy concepts. No
  comparable total-cost model covers local hardware, electricity, downloads,
  maintenance, and remote usage.
- **Evidence source:** `aiCritiqueCoordinator.ts`, `aiCritiqueGateway.ts`, legacy
  budgeting/run-policy modules, and `model_routing_and_budget_architecture.md`.
- **Exact runtime/model/version:** New API pricing is dated and model-specific;
  local cost has no accepted model.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE`.
- **V1 disposition:** Show route-specific facts only; do not optimize or select
  automatically by cost.
- **V2 relevance:** Supports later author-controlled budget policy and route
  comparison.
- **Confidence:** High for current code seams; low for cross-route total cost.
- **Unresolved questions:** Amortization, cached-token policy, local energy,
  download/storage cost, rate changes, and per-task budget controls.
- **Required experiment:** Dated cost model using synthetic workloads and
  measured resource usage.
- **Dependencies:** Provider pricing snapshots, hardware metrics, task volumes,
  and author budget policy.
- **Packaging implications:** Large local weights shift cost from per-call spend
  to disk/download/hardware requirements.
- **Exact reopening trigger:** V2 budget and routing policy design begins.
- **Expected resolution stage:** V2 cost-governance architecture.
- **Supersession history:** Initial entry.

### V2-AI-011 — Privacy and data-boundary questions

- **Finding:** The new OpenAI path has exact preview and remote-transmission
  approval. Local service execution avoids remote transmission but broad
  bridges, caller-owned project IDs, diagnostics, and persistence create local
  privacy and isolation risks.
- **Evidence source:** Package 19.14 scope/gateway/UI, preload `services` bridge,
  local critique/revision operations, diagnostics, and current privacy/approval
  governance.
- **Exact runtime/model/version:** Provider-specific; current new API target is
  OpenAI `gpt-5.4-2026-03-05`; local default is Ollama `qwen3:4b`.
- **Authority classification:** `CURRENT_AUTHORITY` for no-silent-transmission;
  `ACTIVE_BUT_INCOMPLETE` for implementation.
- **V1 disposition:** Exact per-request disclosure and Project Spine binding;
  no persistence or broad local-service bypass.
- **V2 relevance:** Any future background, multi-provider, or package-building
  system needs stronger data classification and retention rules.
- **Confidence:** High for identified boundaries; cross-project local isolation
  remains unproved.
- **Unresolved questions:** Local logs, crash dumps, prompt caches, encrypted
  storage, provider retention variants, redaction, and multi-project queues.
- **Required experiment:** Data-flow threat model and synthetic leakage tests;
  never use private manuscripts as fixtures.
- **Dependencies:** Protected-content taxonomy, provider terms, logging policy,
  and security review.
- **Packaging implications:** Local does not automatically mean private if logs,
  caches, or broad APIs retain content.
- **Exact reopening trigger:** V2 proposes background, durable, or multi-provider
  AI work.
- **Expected resolution stage:** V2 AI trust-boundary review.
- **Supersession history:** Initial entry.

### V2-AI-012 — Latency and cancellation questions

- **Finding:** New OpenAI work has a 90-second timeout, local abort, and
  late-result rejection. Legacy local calls have adapter/service timeouts and
  resilience, but renderer cancellation often only ignores the response. No
  comparable measured latency distribution exists.
- **Evidence source:** new gateway/coordinator, legacy adapter/resilience code,
  `useCritique.ts`, batch-critique behavior, and focused tests.
- **Exact runtime/model/version:** New OpenAI pinned model; historical/default
  local Ollama Qwen routes.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE`.
- **V1 disposition:** Preserve honest provider-specific cancellation and do not
  claim provider-side cancellation.
- **V2 relevance:** Required for scheduling, queue, and route-choice policy.
- **Confidence:** High for semantics; missing measured production distributions.
- **Unresolved questions:** Cold/warm local starts, token throughput, queueing,
  provider tail latency, cancellation cleanup, and concurrency.
- **Required experiment:** Synthetic latency/cancellation matrix with no private
  prose and with orphan-process checks.
- **Dependencies:** Approved runtime/provider execution, metrics policy, and
  hardware classes.
- **Packaging implications:** Slow cold starts or large weights may require
  optional preload or installation UX later.
- **Exact reopening trigger:** V2 performance and scheduling work is authorized.
- **Expected resolution stage:** V2 performance qualification.
- **Supersession history:** Initial entry.

### V2-AI-013 — Background and off-hours work concepts

- **Finding:** Governance and historical systems contain concepts useful for
  scheduled, queued, long-context, or overnight analysis, but Package 19.14 has
  no authority for background work.
- **Evidence source:** current AI governance/routing dossiers, legacy long-form
  operations, scheduler/service infrastructure, and the explicit V1/V2 boundary.
- **Exact runtime/model/version:** No selected runtime/model; concept only.
- **Authority classification:** `REFERENCE_ONLY`.
- **V1 disposition:** `DEFER_WITHOUT_DELETION`.
- **V2 relevance:** Possible future continuity, analysis, or maintenance jobs.
- **Confidence:** High that supporting concepts exist; product value and safe
  authority are unproved.
- **Unresolved questions:** User initiation, idle detection, queue ownership,
  shutdown/recovery, budgets, protected content, stale project state, and
  review UX.
- **Required experiment:** Begin with paper threat/authority models and a
  synthetic queue simulator, not provider execution.
- **Dependencies:** Background-work product decision, scheduler authority,
  durable job schema, privacy, budgets, recovery, and packaging.
- **Packaging implications:** Persistent workers and local models affect startup,
  shutdown, updates, resources, and installer size.
- **Exact reopening trigger:** Jason explicitly authorizes V2 background-work
  discovery after V1 closure.
- **Expected resolution stage:** V2 background execution architecture.
- **Supersession history:** Initial entry.

### V2-AI-014 — Provider-selection ideas

- **Finding:** Current governance names route modes such as Local Only, Privacy
  Preferred, Free Only, Balanced, and Best Within Budget. Package 19.14 permits
  only manual choice between at most one local and one API route.
- **Evidence source:** `model_routing_and_budget_architecture.md`, current truth
  index, legacy router, and the dual-route reconciliation.
- **Exact runtime/model/version:** Provider-neutral concept; no V2 model selected.
- **Authority classification:** `CURRENT_AUTHORITY` for author control and no
  silent spend; `REFERENCE_ONLY` for automatic selection.
- **V1 disposition:** Manual per-request selection and explicit new-request
  rerouting only.
- **V2 relevance:** Candidate future policy-assisted routing.
- **Confidence:** High for governance vocabulary; automatic behavior is not
  authorized or qualified.
- **Unresolved questions:** Explainability, override history, task eligibility,
  local health, quality thresholds, budget caps, and whether any automatic
  choice is desirable.
- **Required experiment:** Policy simulations over synthetic provider receipts;
  do not call providers initially.
- **Dependencies:** Qualified task/model matrix, hardware and cost evidence,
  privacy policy, and author UX decisions.
- **Packaging implications:** Automatic local selection requires reliable
  runtime/model discovery and truthful degraded states.
- **Exact reopening trigger:** V2 explicitly authorizes automatic or assisted
  provider selection.
- **Expected resolution stage:** V2 routing and approval architecture.
- **Supersession history:** Initial entry.

### V2-AI-015 — Prompt-experiment ideas

- **Finding:** Multiple prompt families and output-contract failures make later
  prompt experiments potentially valuable, but no prompt evolution or automated
  optimization system is authorized.
- **Evidence source:** prompt seams in V2-AI-006 and historical failures in
  V2-AI-003.
- **Exact runtime/model/version:** Candidate experiments must pin each runtime,
  model, prompt, schema, and fixture version; none selected here.
- **Authority classification:** `REFERENCE_ONLY`.
- **V1 disposition:** Freeze provider-specific prompts; no experimentation
  platform.
- **V2 relevance:** Could distinguish model weakness from prompt/schema mismatch.
- **Confidence:** Medium; experiments are justified only after task and metric
  design.
- **Unresolved questions:** Prompt-factor isolation, multiple-comparison bias,
  overfitting to fixtures, human review, and version promotion.
- **Required experiment:** Preregister small factorial tests with held-out
  synthetic fixtures and immutable receipts.
- **Dependencies:** V2 prompt authority, qualification framework, provider/model
  access, and experiment budget.
- **Packaging implications:** Promoted prompts become versioned release assets
  requiring migration and qualification.
- **Exact reopening trigger:** V2 approves a prompt-evaluation program.
- **Expected resolution stage:** V2 prompt qualification.
- **Supersession history:** Initial entry.

### V2-AI-016 — Candidate V2 experiment program

- **Finding:** A safe future program could compare task quality, schema validity,
  evidence grounding, uncertainty, latency, memory, privacy, and cost across
  explicitly approved models and hardware classes. This is a candidate program,
  not a Package 19.14 recommendation.
- **Evidence source:** consolidated gaps in V2-AI-001 through V2-AI-015.
- **Exact runtime/model/version:** None selected. Candidate inventory must be
  reverified at experiment authorization time.
- **Authority classification:** `REFERENCE_ONLY`.
- **V1 disposition:** `DEFER_WITHOUT_DELETION`; do not implement in Package 19.14.
- **V2 relevance:** Provides a possible evidence sequence for later model and
  routing decisions.
- **Confidence:** Medium; usefulness depends on V2 product goals.
- **Unresolved questions:** Which AI jobs belong in V2, supported hardware,
  provider set, budget, reviewers, acceptable data, and promotion gates.
- **Required experiment:** Sequence only after authority: inventory freeze;
  synthetic corpus freeze; adapter conformance; single-model baselines;
  blinded quality scoring; resource/cost measurements; adversarial privacy and
  injection tests; then policy simulation. Never begin with automatic routing.
- **Dependencies:** V2 product scope, governance approval, privacy/security,
  experiment budget, reviewers, packaging strategy, and rollback rules.
- **Packaging implications:** Results may choose optional downloads, external
  runtimes, remote-only routes, or no shipped AI for a task.
- **Exact reopening trigger:** V1 is accepted and Jason authorizes a bounded V2
  AI evaluation-and-orchestration discovery package.
- **Expected resolution stage:** V2 AI discovery, before V2 implementation.
- **Supersession history:** Initial synthesis entry.

## 3. V2 open questions

The next authorized V2 orchestrator must inherit, without silently resolving:

- which AI jobs are valuable after selected-prose critique;
- whether local execution is a product requirement or optional route;
- supported hardware classes and installation constraints;
- provider/model/task qualification methodology and receipt lifetime;
- prompt versioning and held-out evaluation rules;
- acceptable provider transmission, logging, caching, and retention;
- local/runtime total cost versus remote spend;
- truthful cancellation and background-job ownership;
- whether automatic selection should exist at all; and
- the authority, recovery, shutdown, budget, and review model for background
  work.

## 4. V2 candidate experiments

Candidate experiments remain blocked until V2 authority exists:

1. Reproducible runtime/model inventory using immutable digests.
2. Adapter conformance against a provider-neutral strict result schema.
3. Single-model selected-task baselines before any comparison.
4. Blinded synthetic quality scoring with held-out fixtures.
5. Hardware-class cold/warm latency, memory, and cancellation measurements.
6. Provider-specific privacy, redaction, and injection tests.
7. Dated local/remote total-cost comparison.
8. Prompt-factor experiments only after baseline receipts exist.
9. Offline policy simulation only after qualified provider receipts exist.
10. Background-work paper design and simulator only after product authority.

## 5. V2 authority needed

Before any experiment, V2 requires explicit Jason authorization covering:

- task and provider/model scope;
- model execution/download permissions;
- synthetic data and prohibited-data rules;
- hardware information collection;
- provider credentials and maximum spend;
- human reviewer availability;
- artifact retention and redaction;
- packaging assumptions;
- stop and rollback conditions; and
- whether results may influence product routing or remain research-only.

DO NOT IMPLEMENT IN PACKAGE 19.14.
