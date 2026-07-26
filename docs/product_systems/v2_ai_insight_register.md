# AI Intelligence-Layer Register — Black Skies V1.0 to V2.0

Status: canonical forward-looking AI intelligence-layer register and evidence
index; not implementation authority

Verification date: 2026-07-17

Controlling audit: `BS-19.14-24A`

## 1. Register authority and maintenance rules

This is the single canonical register for the Black Skies V1.0-to-V2.0 AI
intelligence-layer program and for evaluation and orchestration insights found
during Stage 19 Package 19.14. It preserves knowledge without moving later
research or implementation into V1.0.

Package 19.14 qualification authority remains in the Package 19.14 scope,
disposition, qualification, acceptance, and closure records. This register
indexes that work as one intelligence-layer component; it does not replace,
expand, or reopen the package contract.

Terminology is strict throughout this record:

- **Black Skies V1.0, V2.0, and V3.0** are product versions.
- **Qualification Contract V1 and Qualification Contract V2** are protocol
  revisions inside Package 19.14.
- Qualification Contract V2 is not Black Skies V2.0, and the failed
  Qualification Contract V1 capture must never be relabeled as V2 evidence.

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
9. Future V1.0-to-V2.0 AI planning updates this register instead of creating a
   provider-specific or package-specific competing register.
10. Evidence, repository authority, inference, recommendation, and open
    question must remain visibly distinct.

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

- **Current-state note:** V2-AI-026 supersedes this entry's incomplete-status
  wording and records the completed qualitative review, G acceptance, and H
  closure. The evidence observations below remain historical.
- **Finding:** Package 19.14 introduces twelve synthetic selected-prose fixtures,
  content hashes, strict schema checks, two captured executions per fixture,
  24 structurally valid outputs, 89 exact-source evidence strings, no retry or
  fallback, and verifier-reconciled route evidence. The V2 live capture is
  complete. Numeric, two-human, and one-human-plus-AI scoring designs are
  superseded; a later four-field review and Jason's hands-on G acceptance remain.
- **Evidence source:**
  `app/main/__tests__/fixtures/aiCritiqueQualification.v1.ts`,
  `aiCritiqueQualification.test.ts`, and
  `stage19_package_19_14_model_qualification.md`.
- **Exact runtime/model/version:** Intended current API receipt is OpenAI
  `gpt-5.4-2026-03-05`; no local model has a receipt.
- **Authority classification:** `CURRENT_AUTHORITY` for objective route evidence;
  `ACTIVE_BUT_INCOMPLETE` for the future qualitative review and G/H sequence.
- **V1 disposition:** Preserve the immutable OpenAI capture for the bounded V1
  route and future regression/error analysis. Do not start another route or run.
- **V2 relevance:** Strong starting point for task-specific evaluation, but not
  a multi-model tournament framework.
- **Confidence:** High for fixture integrity; provider quality is unverified.
- **Unresolved questions:** Real-story usefulness, repeatability over time,
  drift detection, sample size by task, and honest editorial competence claims.
- **Required experiment:** Complete the separately authorized four-field review
  and G hands-on acceptance; design broader methodology only after V1 closure.
- **Dependencies:** Opaque packet handling, protected artifact handling, Jason's
  qualitative review, and hands-on acceptance.
- **Packaging implications:** Qualification gates releases but does not itself
  add packaged runtime dependencies.
- **Exact reopening trigger:** V2 defines task categories beyond selected-prose
  critique or evaluates more than the bounded V1 routes.
- **Expected resolution stage:** V2 evaluation-method design.
- **Supersession history:** Initial entry; current-state portions superseded by
  V2-AI-026 without rewriting the historical capture evidence.

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

### V2-AI-017 — Local runtime capability receipt (2026-07-15)

- **Finding:** Direct local inspection established Ollama client/server version
  `0.13.0`. Both Qwen candidates are installed, use `Q4_K_M` quantization, and
  advertise `completion`, `tools`, and `thinking` capabilities. The installed
  runtime explicitly supports `--think true|false|high|medium|low` and JSON
  formatting. Direct local API requests accepted `think:false` and a JSON
  Schema `format` object.
- **Evidence source:** 2026-07-15 `ollama --version`, `ollama list`, `ollama
  show`, `ollama help run`, direct loopback API behavior, and installed manifests.
- **Exact runtime/model/version:** Ollama `0.13.0`; `qwen3:4b` model layer
  `sha256:3e4cb14174460404e7a233e531675303b2fbf7749c02f91864fe311ab6344e4f`,
  2.326 GiB manifest layer, 4.0B parameters, 262144 context, Q4_K_M;
  `qwen3:8b` model layer
  `sha256:a3de86cd1c132c822487ededd47a324c50491393e6565cd14bafa40d0b8e686f`,
  4.867 GiB manifest layer, 8.2B parameters, 40960 context, Q4_K_M.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE` evidence; not provider
  selection authority.
- **V1 disposition:** At most one exact local route may later be qualified.
  Neither tag is selected by this receipt.
- **V2 relevance:** Establishes reproducible candidate identities and supported
  reduced-thinking/structured-output controls for later experiments.
- **Confidence:** High for installed metadata and accepted local request fields;
  not evidence of output quality across tasks.
- **Unresolved questions:** Full server-side structured-schema enforcement,
  model digest stability across future installations, and capability behavior
  under other task contracts.
- **Required experiment:** Repeat inventory and schema conformance using the
  selected model/runtime at any later qualification gate.
- **Dependencies:** Installed runtime, local-only synthetic fixtures, and no
  model update between receipt and later experiment.
- **Packaging implications:** Ollama and both model layers remain separately
  installed rather than bundled product dependencies.
- **Exact reopening trigger:** A bounded V1 local-route qualification or V2
  model-evaluation authorization names one exact tag and digest.
- **Expected resolution stage:** V1 local qualification or V2 runtime inventory.
- **Supersession history:** Adds dated detail to V2-AI-001; V2-AI-001 remains
  immutable installed-inventory evidence.

### V2-AI-018 — Qwen 4B direct selected-prose feasibility receipt

- **Finding:** Under representative busy-machine load, direct Ollama
  `think:false` requests completed all three frozen synthetic critique fixtures
  without transport failure, timeout, empty response, or truncation. Two of
  three passed the shared strict schema and verbatim-evidence validation; the
  mixed-defect fixture failed because evidence was not verbatim. Real fixture
  elapsed times were 139.55 s, 120.34 s, and 61.28 s; generation rates were
  7.65, 8.02, and 8.19 tokens/s.
- **Evidence source:** 2026-07-15 direct loopback Ollama feasibility harness;
  frozen fixture IDs `exposition-pacing` (`9660f2b8…eaa3f74`),
  `intentional-fragments` (`75774e46…345f6d32`), and
  `mixed-unsupported-backstory` (`f8338dba…2a219ab9`); temporary raw responses
  were not copied into the repository.
- **Exact runtime/model/version:** Ollama `0.13.0`; `qwen3:4b`; model layer
  `sha256:3e4cb14174460404e7a233e531675303b2fbf7749c02f91864fe311ab6344e4f`;
  `think:false`; temperature 0, top-p 1, top-k 1, seed 19, 1600 output-token
  ceiling, direct `POST /api/generate` with the Package 19.14 critique
  instruction and schema.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE` feasibility evidence.
- **V1 disposition:** `DEFER_WITHOUT_DELETION`; not an interactive V1 candidate
  until strict-contract reliability and latency improve or are remeasured.
- **V2 relevance:** Preserves a small-model CPU baseline and a specific
  evidence-grounding failure mode.
- **Confidence:** High for the six measured fields and two-of-three validity;
  low for literary quality because no human scoring occurred.
- **Unresolved questions:** Whether the invalid evidence arose from output
  variability, prompt/schema tuning, or busy-machine timing; whether lower load
  materially improves the two longer runs.
- **Required experiment:** Only after authorization, repeat the same frozen
  corpus at controlled low load and require repeated strict-valid results before
  any model decision.
- **Dependencies:** Same model digest, isolated local runtime, synthetic-only
  corpus, human scoring plan, and explicit qualification authority.
- **Packaging implications:** Its 2.326 GiB layer is smaller, but CPU generation
  latency and strict-output reliability remain material product constraints.
- **Exact reopening trigger:** A later local-route qualification authorizes a
  repeated low-load or prompt-contract experiment.
- **Expected resolution stage:** V1 local-route qualification or V2 local-model
  baseline evaluation.
- **Supersession history:** Adds direct feasibility evidence after the historical
  long-form invalid-output entry V2-AI-003; it does not rewrite that evidence.

### V2-AI-019 — Qwen 8B direct selected-prose feasibility receipt

- **Finding:** Under the same representative load and `think:false` settings,
  direct Ollama `qwen3:8b` completed all three real fixtures without timeout,
  empty response, truncation, or transport failure. All three passed strict
  schema and verbatim-evidence validation and each contained at least one
  fixture-grounded priority. Real fixture elapsed times were 150.48 s, 166.50 s,
  and 163.08 s; generation rates were 4.99, 4.96, and 4.94 tokens/s. Warm-up
  took 239.54 s, including 118.23 s model-load duration.
- **Evidence source:** 2026-07-15 direct loopback Ollama feasibility harness;
  the same three frozen fixture IDs and hashes recorded in V2-AI-018; temporary
  raw responses were not copied into the repository.
- **Exact runtime/model/version:** Ollama `0.13.0`; `qwen3:8b`; model layer
  `sha256:a3de86cd1c132c822487ededd47a324c50491393e6565cd14bafa40d0b8e686f`;
  `think:false`; identical deterministic options, instruction, schema, and
  output ceiling to V2-AI-018.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE` feasibility evidence.
- **V1 disposition:** `DEFER_WITHOUT_DELETION`; provisional
  `BORDERLINE_INTERACTIVE` under representative load, not a current interactive
  V1 selection.
- **V2 relevance:** Preserves a higher-validity, slower local-model baseline
  for later task-specific and hardware-class qualification.
- **Confidence:** High for timing and structural validity; low for literary
  usefulness, factual-invention assessment, or broad task generalization.
- **Unresolved questions:** Whether memory pressure is the dominant cause of
  latency, whether an exact lower-load receipt materially changes latency, and
  whether quality warrants its interactive delay.
- **Required experiment:** A separately authorized controlled low-load rerun is
  justified only if its purpose is to isolate memory pressure; full qualification
  still requires repeated runs and human scoring.
- **Dependencies:** Same digest, an explicitly documented machine state,
  synthetic fixtures, human reviewers, and local runtime availability.
- **Packaging implications:** Its 4.867 GiB layer and observed 6.5 GiB loaded
  residency make optional-install and memory guidance necessary if ever shipped.
- **Exact reopening trigger:** Jason authorizes a controlled local-route
  qualification or a hardware-class feasibility rerun.
- **Expected resolution stage:** V1 local qualification or V2 hardware/local
  model evaluation.
- **Supersession history:** Adds direct selected-prose evidence after V2-AI-003;
  it does not supersede historical long-form findings.

### V2-AI-020 — Representative busy-machine resource receipt

- **Finding:** This was intentionally not a clean benchmark. Before inference,
  multiple ChatGPT, SnipBoard, Codex, PowerShell, ServiceShell, Explorer,
  security, and support processes were active. After the run, 2,593 MiB of
  memory was available; the loaded Ollama worker held about 5.12 GiB working
  set, and `ollama ps` reported Qwen 8B at 6.5 GiB resident with one CPU
  processor at 100%. Total physical memory was unavailable through the
  read-only CIM interface because access was denied.
- **Evidence source:** 2026-07-15 read-only process snapshot, performance
  counters, and `ollama ps` before/after the local experiment.
- **Exact runtime/model/version:** Windows representative workstation; Ollama
  `0.13.0`; final loaded model `qwen3:8b` at its installed digest. Exact total
  memory is intentionally unrecorded because the permitted interface denied it.
- **Authority classification:** `REFERENCE_ONLY` environment evidence.
- **V1 disposition:** Do not treat this as a supported-hardware benchmark or
  infer a clean-machine SLA.
- **V2 relevance:** Records why future hardware-class and low-load receipts
  need explicit state capture.
- **Confidence:** High for observed available memory/process residency; unknown
  for total-memory capacity and sustained thermal behavior.
- **Unresolved questions:** CPU core topology, GPU availability, storage speed,
  memory compression effects, and low-load token rate.
- **Required experiment:** Controlled synthetic low-load run with the same
  metrics and a documented hardware class, only if separately authorized.
- **Dependencies:** Jason-controlled application closure, unchanged model,
  local runtime, and an approved measurement policy.
- **Packaging implications:** Product messaging cannot promise interactive local
  performance without hardware-class evidence.
- **Exact reopening trigger:** An authorized low-load or hardware-class rerun.
- **Expected resolution stage:** V2 local-runtime feasibility and packaging.
- **Supersession history:** New dated representative-load receipt; does not
  supersede V2-AI-008's missing-evidence finding.

### V2-AI-021 — Reduced-thinking witness for Qwen 8B

- **Finding:** Ollama explicitly supports `think:false`, and the primary
  comparison used it. A single same-fixture `think:true` Qwen 8B witness also
  returned a strict-valid, fixture-grounded result in 107.26 s at 5.22 tokens/s,
  versus the primary `think:false` result's 150.48 s at 4.99 tokens/s. The
  default-thinking witness generated 508 tokens versus 690, so this is not an
  output-length-equivalent overhead comparison. Reduced-thinking material
  benefit was not demonstrated.
- **Evidence source:** 2026-07-15 direct loopback single-fixture witness using
  frozen `exposition-pacing`; temporary raw output remained outside repository.
- **Exact runtime/model/version:** Ollama `0.13.0`; `qwen3:8b` installed digest
  from V2-AI-019; identical prompt/schema/options except `think:true` versus
  `think:false`.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE` performance witness.
- **V1 disposition:** Do not claim a reasoning-overhead optimization or alter
  V1 route policy from this one non-equivalent witness.
- **V2 relevance:** Identifies a controllable reasoning-mode variable for later
  preregistered experiments.
- **Confidence:** High for measured one-run values; low for causal inference.
- **Unresolved questions:** How reasoning mode changes output length, quality,
  schema adherence, hidden thinking behavior, and latency across fixtures.
- **Required experiment:** Paired, repeated, output-length-aware synthetic
  comparison before any reasoning-mode recommendation.
- **Dependencies:** Fixed model digest, frozen fixtures, scoring protocol, and
  explicit V2 experiment authority.
- **Packaging implications:** No extra package dependency, but UI claims about
  speed or reasoning controls need evidence.
- **Exact reopening trigger:** V2 authorizes a controlled reasoning-mode study.
- **Expected resolution stage:** V2 performance and prompt/runtime evaluation.
- **Supersession history:** Initial witness; no prior reasoning-mode receipt.

### V2-AI-022 — Direct Ollama versus historical Python/FastAPI path

- **Finding:** Direct local Ollama accepted the Package 19.14 critique
  instruction/schema and produced five strict-valid critiques across six real
  requests. Historical local long-form reruns through the Python/router path
  stopped on `invalid_output`. Direct results prove that the installed Qwen
  models are not categorically incapable of structured critique; they do not
  prove the historical long-form task or Python route is repaired.
- **Evidence source:** V2-AI-018/V2-AI-019 direct receipts; immutable historical
  record `fa4bd0c:docs/runbooks/long_form_integrated_pass_20260316.md`; local
  adapter/router/critique source inventory.
- **Exact runtime/model/version:** Direct Ollama `0.13.0` with installed Qwen
  tags/digests; historical path used local OpenAI-compatible Ollama-backed
  `qwen3:4b` and `qwen3:8b` after base-URL repair.
- **Authority classification:** `REFERENCE_ONLY` causal comparison.
- **V1 disposition:** Do not connect the legacy Python route to Package 19.14;
  any local gateway must use the shared authority and strict validation.
- **V2 relevance:** Narrows future investigation to adapter, prompt, parser,
  router, and task-contract seams rather than model absence alone.
- **Confidence:** High that direct and historical paths differ materially; low
  for isolating one exact historical failure cause.
- **Unresolved questions:** Historical raw response shape, exact long-form
  prompt/validator interaction, route metadata, and whether local normalization
  discarded usable output.
- **Required experiment:** Synthetic controlled replay of the historical
  contract through isolated seams; do not use manuscripts or repair production
  code during investigation.
- **Dependencies:** Explicit V2 or later salvage authority, historical contract
  reconstruction, redacted logs, and fixture-only data.
- **Packaging implications:** Reusing Python introduces additional failure and
  packaging seams; direct main-process local gateway remains an alternative.
- **Exact reopening trigger:** A later authorized local-gateway salvage or V2
  historical-contract investigation.
- **Expected resolution stage:** V2 provider-adapter and contract diagnosis.
- **Supersession history:** Refines, but does not rewrite, V2-AI-003.

### V2-AI-023 — Historical `invalid_output` causal classification

- **Finding:** `LIKELY`: the historical failure involved a Python/router,
  prompt/schema, adapter-normalization, or long-form validator seam in addition
  to any model variability. `VERIFIED`: direct local requests can return
  non-empty, non-truncated, strict-valid selected-prose critique for both model
  tags. `POSSIBLE`: Qwen 4B's one-of-three non-verbatim-evidence failure shows
  model output adherence can also contribute. `UNKNOWN`: the exact historical
  root cause cannot be assigned without the original raw response and full
  contract trace, neither of which should be reconstructed from private prose.
- **Evidence source:** V2-AI-018 through V2-AI-022, legacy source inspection,
  and immutable historical record `fa4bd0c`.
- **Exact runtime/model/version:** Direct Ollama `0.13.0`, Qwen digests in
  V2-AI-017; historical local tags as described in V2-AI-022.
- **Authority classification:** `REFERENCE_ONLY` diagnostic hypothesis.
- **V1 disposition:** No legacy-path repair or route connection is authorized by
  this classification.
- **V2 relevance:** Provides bounded hypotheses and prevents the unsupported
  claim that model size alone caused historical failure.
- **Confidence:** High for the verified direct behavior; medium for the likely
  multi-seam conclusion; low for a single-cause claim.
- **Unresolved questions:** Exact parser input/output, reasoning text handling,
  token truncation, schema differences, and legacy validator assumptions.
- **Required experiment:** Isolated synthetic seam tests with redacted summary
  artifacts and no production-code repair in the experiment.
- **Dependencies:** Future diagnostic authority, fixture-only inputs, and safe
  retention/redaction rules.
- **Packaging implications:** A Python local path cannot be assessed solely on
  model performance; its parser/router behavior is a release concern.
- **Exact reopening trigger:** A bounded future task explicitly authorizes
  historical invalid-output diagnosis.
- **Expected resolution stage:** V2 adapter/parser salvage investigation.
- **Supersession history:** Adds a classification to V2-AI-003 and V2-AI-022;
  neither historical record is altered.

### V2-AI-024 — Provisional V1 and off-hours disposition

- **Finding:** Neither model is an `INTERACTIVE_V1_CANDIDATE` on this busy
  machine. Qwen 4B is provisionally `BORDERLINE_INTERACTIVE` by latency but has
  insufficient strict-contract reliability. Qwen 8B is provisionally
  `BORDERLINE_INTERACTIVE` by structural validity but takes 150–167 s per real
  fixture after warm-up and has material memory residency. It is not currently
  a V1 interactive selection. A low-load rerun is not currently recommended as
  a V1 promotion gate: available evidence does not make a greater-than-twofold
  token-rate improvement plausible, and the default-thinking witness did not
  show a reduced-thinking benefit. A later manual low-load 8B run may still be
  useful as V2/hardware evidence if Jason independently wants it.
- **Evidence source:** V2-AI-018 through V2-AI-021.
- **Exact runtime/model/version:** Ollama `0.13.0`; Qwen 4B/8B digests in
  V2-AI-017; three direct synthetic fixtures with `think:false` plus one Qwen
  8B `think:true` witness.
- **Authority classification:** `ACTIVE_BUT_INCOMPLETE` feasibility conclusion.
- **V1 disposition:** `DEFER_WITHOUT_DELETION`; retain existing local code and
  evidence, but do not select, ship, or connect either model in Package 19.14.
- **V2 relevance:** Qwen 8B is a candidate for later off-hours or hardware-class
  investigation, not for automated scheduling or background work now.
- **Confidence:** Medium; the corpus is deliberately small and representative
  load is not a clean benchmark.
- **Unresolved questions:** Lower-load token rate, human critique scores,
  repeated-run reliability, model/prompt sensitivity, and acceptable user wait.
- **Required experiment:** If later authorized, run a manually initiated,
  synthetic-only low-load Qwen 8B receipt using the same three fixtures and
  metrics; do not schedule it and do not treat it as full qualification.
- **Dependencies:** Jason manually controls machine load; same model digest;
  explicit local experiment authority; no provider/network route.
- **Packaging implications:** Current results support optional local tooling or
  V2/off-hours investigation only, not an interactive packaged V1 promise.
- **Exact reopening trigger:** Jason authorizes a low-load local feasibility
  rerun or a full local-route qualification package.
- **Expected resolution stage:** V2 hardware/local-model evaluation, or a later
  separately authorized V1 qualification decision.
- **Supersession history:** Adds dated feasibility evidence to V2-AI-008,
  V2-AI-009, and V2-AI-012 without changing their historical text.

### V2-AI-025 — Editorial research and route-qualification disposition

- **Finding:** User-supplied external editorial research separates controlled
  route execution from competence as a novel editor. Jason adopted that narrow
  Package 19.14 distinction and superseded numeric, two-human, and
  one-human-plus-AI literary scoring for V1 closure.
- **Evidence source:** Editorial research supplied by Jason on 2026-07-19 and
  explicit BS-19.14-25C1D authority. The research's internal citation tokens
  were not independently verified as repository sources.
- **Authority classification:** `CURRENT_AUTHORITY` only through Jason's adopted
  Package 19.14 disposition; the research itself remains external evidence.
- **V1 disposition:** Preserve the immutable capture, complete the future
  four-field review and hands-on G acceptance, and make no broad editorial claim.
- **V2 relevance:** After Package 19.22, a separately authorized package may
  define Editorial Doctrine, Story Editorial Charter, Editorial Findings
  Ledger, task taxonomy, visible hash-bound Context Manifest, claim boundaries,
  writer dispositions, precedence, provenance, staleness, and revision history.
- **Derived-view disposition:** Book Map / Reverse Outline, Anchored Manuscript
  Notes, Editorial Brief, Continuity Matrix, and Revision Plan remain derived
  views rather than additional truth owners. Former numeric dimensions may
  survive only as optional tags or fixture-coverage labels.
- **Exact reopening trigger:** Package 19.22 closes V1.0 and Jason separately
  authorizes a bounded editorial-authority package.
- **Expected resolution stage:** First explicitly authorized post-V1.0
  editorial-authority package.
- **Supersession history:** Supersedes the 25C1/25C1B scoring direction without
  altering the immutable capture or authorizing post-V1 implementation.

### V2-AI-026 — Package 19.14 closure evidence

- **Finding:** Package 19.14 is closed. The immutable V2 capture established
  bounded route evidence; the completed 24-output qualitative review is valid
  and preserved with documented output defects; and Jason accepted the
  hands-on Package 19.14-G route with `PASS_WITH_LIMITATIONS`.
- **Evidence source:** The sole canonical
  `stage19_package_19_14_model_qualification.md` closure contract and its
  externally preserved technical, qualitative-review, validation, and
  hands-on acceptance identities.
- **Exact runtime/model/version:** OpenAI Responses API,
  `gpt-5.4-2026-03-05`, under `black_skies_critique_v2`.
- **Authority classification:** `CURRENT_AUTHORITY` for the closed bounded V1
  selected-prose critique route.
- **V1 disposition:** Accept only the optional, advisory, explicitly
  human-authorized route. Preserve provider/model disclosure, no silent
  fallback, retry, reroute, or prose mutation, and the documented limitations.
- **V2 relevance:** Local-first critique remains future work. Broader editorial
  architecture, real-story usefulness, cross-task capability, routing, and
  long-context claims remain deferred.
- **Confidence:** High for the preserved bounded evidence and hands-on
  disposition; no general editorial-competence inference is authorized.
- **Unresolved questions:** The post-V1 editorial program questions already
  recorded by this register remain unresolved.
- **Required experiment:** None inside Package 19.14. Future work requires its
  own bounded authorization and evidence contract.
- **Dependencies:** Package 19.22 owns retain/archive/remove disposition for
  inactive historical scoring tooling.
- **Packaging implications:** Preserve the observed packaging-bloat/progress
  limitation as a separate cleanup concern, not an AI-route acceptance defect.
- **Exact reopening trigger:** Reopen only through a separately authorized
  package that changes the accepted route contract or begins a named post-V1
  intelligence/editorial program.
- **Expected resolution stage:** Package 19.22 for inactive-tooling disposition;
  otherwise the first applicable separately authorized post-V1 package.
- **Supersession history:** Supersedes the current-state portions of V2-AI-007
  and V2-AI-025 that described the qualitative review, G acceptance, and H
  closure as future or incomplete; resolves V2-GAP-001 without rewriting the
  historical evidence those entries preserve.

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

## 6. Product roadmap and terminology authority

Jason's product-version roadmap is controlling human authority:

| Product horizon | Controlling meaning |
| --- | --- |
| Black Skies V1.0 | Complete when Stage 19 and the remaining V1 framework work are complete. Package 19.14 is one bounded Stage 19 package, not the whole intelligence layer. |
| V1.0 to V2.0 | Write complete real stories; use the product intensively; refine subsystems, prompts, performance, providers, and local models; learn from normal author workflows; and mature the intelligence layer. |
| V2.0 to V3.0 | Perform the major GUI revision, visual polish, usability refinement, and broader product polish. |

The V1.0-to-V2.0 program may discover changes that later require product or
architecture authority. This register records those needs but does not grant
that authority. GUI work belongs in the V2.0-to-V3.0 horizon when it is mainly
visual or polish work; a user-experience issue that affects safety, approval,
truthfulness, or workflow ownership remains an earlier product concern.

## 7. Repository knowledge inventory and authority map

This inventory is content-based. A filename, status header, test name, or
historical `Active` label is not enough to promote a record over newer current
authority.

| Source group | Representative records or code | What exists | Classification and use |
| --- | --- | --- | --- |
| Current product navigation and roadmap | `current_truth_index.md`; `current_product_roadmap.md`; `docs/product_systems/README.md` | Authority precedence, current product doctrine, product horizons, and dossier navigation. | `CURRENT_AUTHORITY`. The pre-A-F Package 19.14 status wording in the first two records was stale and is repaired by BS-19.14-24A; older embedded stage snapshots remain historical. |
| Cross-system AI governance | `ai_lifecycle_and_approval_matrix.md`; `model_routing_and_budget_architecture.md`; `llm_package_construction_architecture.md`; `protected_content_permission_matrix.md`; `authorship_provenance_ai_visibility.md` | Advisory-only doctrine, approval tiers, route modes, no silent fallback/spend/transmission/mutation, package/payload separation, protection, and provenance. | `CURRENT_AUTHORITY` for product and architecture boundaries; not runtime proof. |
| Task and workflow dossiers | `critique_evaluation.md`; `draft_generation_rewrite_loop.md`; `continuity.md`; `memory_lab.md`; `async_job_queue_task_runner.md`; `workflow_proof_WP-06_ai_route_package_queue_acceptance.md` | Task-specific ownership, critique output classes, memory questions, queue lifecycle, route/package/acceptance distinctions, and deferred background work. | Current product doctrine or completed workflow-boundary proof according to each record; not proof that the runtime implements the whole design. |
| Stage 10 and 11 audits | `stage10_ai_provider_queue_performance_cost_findings.md`; `stage11_ai_routing_approval_provenance_transmission_questions.md`; `stage11_queue_service_performance_cost_hardware_model_lifecycle_questions.md` | Missing operational evidence, fatal-question review, and named handoffs for routing, provider drift, queue, cost, hardware, and model lifecycle. | `HISTORICAL` campaign records with surviving evidence and handoffs; their embedded stage-status lines are not current sequencing authority. |
| Stage 12 architecture contracts | `stage12_package_payload_context_identity_contract.md`; `stage12_provider_policy_external_assurance_contract.md`; `stage12_queue_attempt_retry_cancellation_contract.md`; `stage12_cost_accounting_budget_persistence_contract.md`; `stage12_telemetry_generic_cache_governance_contract.md`; `stage12_evidence_retention_last_witness_contract.md`; `stage12_hardware_resource_pressure_protection_contract.md`; `stage12_model_qualification_lifecycle_contract.md` | Provider-neutral identity, invalidation, qualification, evidence, retry, cancellation, cost, cache, hardware, and lifecycle safety floors. | `CURRENT_AUTHORITY` for their owned architecture questions. They explicitly do not choose runtime schemas, models, providers, or implementation. |
| Package 19.14 authority | `stage19_package_19_14_scope_and_inspection.md`; `stage19_package_19_14_local_route_feasibility_disposition.md`; `stage19_package_19_14_model_qualification.md` | Closed selected-prose scope, one pinned OpenAI route, no local V1 route, frozen corpus, failed V1 capture, completed immutable V2 capture, narrow route evidence, completed four-field review, accepted G disposition, and H closure. | `CURRENT_AUTHORITY` for the closed bounded V1 route. The qualification record is the sole canonical qualification and closure contract; this register preserves later program context. |
| Package 19.14 implementation and focused tests | `app/shared/ipc/aiCritique.ts`; `app/main/aiCritiqueCoordinator.ts`; `aiCritiqueGateway.ts`; `aiCritiqueIpc.ts`; `aiCritiqueQualificationArtifacts.ts`; their focused tests; `Stage19WritingSpineApp.tsx`; `stage19-ai-critique.spec.ts` | Main-owned immutable request/approval lifecycle, exact selected-prose evidence, one narrow gateway, strict response validation, stale/late rejection, redaction, blinded review packets, receipt verification, and Writing-Studio-only advisory presentation. | Current implementation evidence for the exact Package 19.14 path. Tests prove exercised contracts, not live model usefulness or broad intelligence quality. |
| Current legacy model runtime | `docs/specs/model_runtime.md`; `model_routing.py`; `model_router.py`; `model_adapters.py`; `run_policy.py`; prompt modules and tests | Four coarse tasks (`outline`, `draft`, `critique`, `rewrite`), Ollama/OpenAI adapters, provider availability, prompt profiles, route metadata, budgets, and automatic-capable fallback. | Current or legacy runtime evidence according to the cited current-runtime record, but `REFERENCE_ONLY` for Package 19.14 and future architecture until reconciled with current no-silent-fallback, approval, and Project Spine doctrine. |
| Prompt and context code | `prompt_profile_resolver.py`; `prompt_compiler.py`; `prompt_pipeline.py`; `operations/long_form_execution.py`; Package 19.14 fixed instructions | Provider-oriented draft profiles, scene context compilation, memory-packet inputs, long-form prompts, and one fixed selected-prose critique prompt. | Implementation notes and evidence. No canonical multi-task prompt-family architecture or held-out prompt evaluation exists. |
| Older offline evaluation harness | `scripts/eval.py`; `services/.../eval/dataset.py`; `report.py`; `tests/test_eval_*`; 63 packaged YAML task cards | Schema-validated task cards for 21 outline, 21 draft, and 21 critique cases; adapter/tool checks; pass-rate, latency, and error-budget reporting. | `REFERENCE_ONLY` harness evidence. The default runners inspect expected artifacts and do not execute or rank real models; their passes are not literary-quality, grounding, hallucination, or model-capability evidence. |
| Package 19.14 qualification harness | `aiCritiqueQualification.v1.ts`; `aiCritiqueQualification.test.ts`; `aiCritiqueQualificationArtifacts.ts` and tests | Twelve synthetic selected-prose fixtures, two captured executions each, strict schema/evidence checks, two blinded legacy packet roles, fixed numeric thresholds, two-human calculation/adjudication implementation, immutable receipts, and tamper verification. | Objective capture and verifier evidence is current. Score-import, scoring, adjudication, and receipt behavior is inactive, unnecessary for closure, unauthorized for current use, and retained as historical qualification tooling pending Package 19.22 disposition. |
| Dated local-model receipts | V2-AI-017 through V2-AI-024; local-route disposition | Exact Ollama/Qwen identities, representative-load timing/resource observations, structural-validity samples, and the no-local-V1 disposition. | Dated evidence, not universal benchmarks, supported-hardware claims, or model qualification. |
| Historical provider and long-form evidence | Git object `fa4bd0c:docs/runbooks/long_form_integrated_pass_20260316.md`; current runbooks | Earlier provider-backed rescue attempts, Qwen `invalid_output` runs, long-form persistence, retries, and fallback behavior. | `HISTORICAL` or `REFERENCE_ONLY`. Useful for hypotheses and failure classes; incompatible behavior is not current Package 19.14 authority. |
| Memory prototype evidence | `docs/specs/memory_prototype_v1.md`; `docs/reviews/memory_prototype_v1_findings.md`; prototype tests and eval runner | Advisory derived-state, lineage, packet assembly, no-mutation, failure isolation, and replay/eval containment. | Explicitly historical prototype evidence. It does not authorize a product memory system or persistent learned intelligence. |
| Stale or competing legacy specifications | `docs/policies.md`; `docs/settings.md`; `docs/specs/model_backend.md`; `docs/critique_rubric.md`; provider experiment runbooks | Stored/global route settings, automatic fallback, persisted rewrite/critique artifacts, suggested edits, deterministic fallback, caching, and broader provider/model assumptions. | `CONTRADICTORY` or `REFERENCE_ONLY` where they conflict with current authority. Their old `LOCKED`, `Active`, or source-of-truth labels do not override current product-system and Stage 19 records. |

### 7.1 Overlap, conflict, and stale-material findings

1. Package 19.14 and the legacy Python service both contain critique,
   provider, prompt, result, and lifecycle seams. The Package 19.14 path is the
   current bounded implementation; the legacy path is evidence and a future
   salvage candidate, not a second production authority.
2. `model_router.py`, legacy critique, long-form operations, and the provider
   runbooks allow automatic provider or deterministic fallback. Current
   authority forbids silent fallback. Future reuse requires explicit rerouting,
   a new request identity, renewed approval, and task-specific qualification.
3. `docs/critique_rubric.md` describes suggested edits, persistent rubric CRUD,
   and broad critique APIs. The current V1 critique is advisory selected-prose
   output with no apply, persistence, or rewrite authority.
4. The 63-card offline harness and the 12-fixture Package 19.14 qualification
   suite overlap in the word `eval` but prove different things. The former
   proves dataset and reporting plumbing; the latter is the task-specific live
   model qualification contract.
5. Stage 12 defines the required shape of a future AI Model Capability Matrix,
   but no populated, current, provider/model/task capability matrix exists.
   Creating one before task taxonomy and evidence rules are authorized would
   manufacture authority.
6. The dual-route reconciliation preserved a possible two-route V1 design.
   The later local-route disposition controls current V1 and selects no local
   route. The earlier maximum architecture remains a future option only.
7. The prior V1 live provider capture is immutable `CAPTURE_FAILED` evidence.
   Qualification Contract V2 clarifies serialization while retaining the exact
   evidence rule; it does not rewrite the V1 failure or create product V2.0.
8. Current truth and roadmap records still carried pre-A-F Package 19.14 status
   wording. BS-19.14-24A repairs only the current status and discoverability
   lines; it does not rewrite older historical receipts.

## 8. V1.0-to-V2.0 intelligence-layer program

This is a program definition, not execution authorization. Each workstream
needs a separately bounded package, explicit data and provider permissions,
and evidence proportional to the claim.

### 8.1 Real-use refinement

- Use Black Skies to write complete real stories and exercise normal author
  workflows, not only fixtures.
- Record failures, friction, strong outputs, weak outputs, interruption cost,
  and author value without storing manuscript prose in this register.
- Maintain a bounded failure/insight ledger tied to task, product version,
  model/prompt identity where applicable, and reproducible non-private evidence.
- Distinguish a workflow problem, a prompt problem, a model problem, a context
  problem, and a product-experience problem before proposing a repair.

### 8.2 Task architecture and specialization

- Define a provider-neutral task taxonomy before broad routing. Candidate
  classes include critique, brainstorming, planning, revision, continuity
  checking, summarization, research, metadata extraction, drafting, and
  comparison.
- Specify for each task its owner, source scope, output class, mutation limits,
  context needs, latency tolerance, evaluation method, and acceptance path.
- Do not assume the model qualified for selected-prose critique is qualified
  for another task.
- Preserve reusable infrastructure only where the request artifact, approval
  binding, gateway, validation, and evidence semantics are genuinely shared.

### 8.3 Provider and model evaluation

- Compare multiple OpenAI models when authorized and useful; compare hosted and
  local routes without treating either class as inherently superior.
- Preserve manual provider/model selection and no silent fallback. Explicit
  rerouting is a new approved action.
- Reverify exact provider, model snapshot, local digest/quantization, runtime,
  wrapper, prompt, schema, and task contract for every receipt.
- Treat Ollama and llama.cpp as relevant research directions. No repository
  llama.cpp implementation currently exists.
- Preserve the Qwen receipts as workstation-specific evidence: smaller models
  may be more interactively practical; larger models may suit later manual
  background/off-hours study; neither claim is universal without new evidence.

### 8.4 Prompt and context program

- Develop task-specific prompt structures only after each task contract is
  defined.
- Compare prompt families with preregistered factors, held-out fixtures, fixed
  model/runtime identities, and human usefulness scoring.
- Preserve source grounding, evidence fidelity, author intent, uncertainty,
  and injection resistance; schema compliance alone is insufficient.
- Define how project, unit, generation, revision, selection, outline, timeline,
  character, lore, metadata, memory, and external context are selected,
  declared, invalidated, and bounded.
- Prevent stale, cross-project, hidden, or uncontrolled context growth. Context
  compression and whole-chapter/long-context work require separate evidence.

### 8.5 Performance, hardware, and scheduling

- Measure cold and warm latency, token throughput, system and available memory,
  CPU/GPU pressure, storage, cancellation cleanup, responsiveness, concurrency,
  and interference with ordinary applications.
- Use normal-user-load testing because idle-machine benchmarks do not represent
  Jason's ordinary environment; record clean-load evidence separately when it
  answers a named causal question.
- Separate interactive, deferred, manually initiated background, and scheduled
  or overnight execution classes.
- Keep scheduled and overnight jobs in the V1.0-to-V2.0 program. Do not infer
  authority from the existing scheduler or queue doctrine.

### 8.6 Privacy, cost, and reliability

- Prefer privacy-preserving routes where practical and keep local processing
  available as a strategic option.
- Measure real API usage and calculated cost while labeling provider invoices,
  estimates, local energy/hardware cost, and unobserved provider work
  separately.
- Preserve explicit cost caps, approvals, provider-policy revalidation, and
  protected-content rules.
- Test outage, timeout, rate limit, refusal, invalid response, partial result,
  stale result, cancellation, app/project close, retry, and explicit rerouting.
- Keep advisory AI optional so provider or local-runtime failure never becomes
  a hidden dependency for opening, editing, saving, recovery, export, or close.

### 8.7 Evaluation program

- Create reusable synthetic task fixtures and separately governed real-story
  evaluation sets.
- Evaluate structure, evidence fidelity, usefulness, hallucination, tone fit,
  consistency, author value, latency, resource pressure, privacy, and cost.
- Use blinded or independent human review where it adds value; preserve
  reviewer disagreement and adjudication rather than averaging it away.
- Add held-out sets and drift/regression receipts so prompt or model changes do
  not overfit one frozen qualification corpus.
- Develop a populated model capability record or matrix only after task
  taxonomy, evidence levels, receipt lifetime, and promotion rules receive
  authority.

### 8.8 Program evidence sequence

The default evidence sequence is:

1. authorize task, data, provider/model, hardware, budget, and retention scope;
2. freeze task contract and source/output boundaries;
3. freeze synthetic baselines and held-out fixtures;
4. verify adapter and result-schema conformance without broad quality claims;
5. establish one-model baselines before comparisons;
6. perform blinded usefulness and grounding review;
7. measure normal-load and controlled hardware/performance behavior;
8. test privacy, injection, lifecycle, and failure behavior;
9. simulate routing policy only after task-specific receipts exist; and
10. promote a capability only through a separate explicit product decision.

## 9. Package 19.14 as an intelligence-layer component

Package 19.14 establishes the first current operational component of a future
intelligence layer. It is not the intelligence architecture by itself.

### 9.1 Strengths and proof boundary

| Dimension | What Package 19.14 establishes | What it does not establish |
| --- | --- | --- |
| Task architecture | One explicit `selected-prose critique` task with a fixed advisory result contract and no rewrite/apply path. | A provider-neutral task taxonomy or proof that critique, brainstorming, planning, revision, continuity, summarization, research, drafting, and extraction share one contract. |
| Request authority | Main-owned project, unit, generation, session, revision, selection, payload bytes, hash, TTL, and one-use approval binding. | General context assembly for whole chapters, whole projects, cross-project work, memory, retrieval, or external sources. |
| Provider execution | One fixed OpenAI Responses API gateway, pinned model snapshot, exact request bytes, timeout, redaction, and strict result validation. | Multiple-provider routing, local qualification, provider substitution, streaming, tool use, or generic gateway conformance. |
| Routing and fallback | Fixed provider truth and fail-closed behavior with no automatic fallback or retry. | A model capability matrix, route recommendation, hardware-aware policy, or automatic routing. |
| Safety and trust | Selected prose is treated as quoted data; embedded instructions are rejected by contract; output is advisory, ephemeral, separate, source-grounded, and non-mutating. | Protection detection, broad project-content injection defense, external research citation verification, or safety for tools and proposed manuscript mutations. |
| Lifecycle | Prepared/approved/executing/terminal states, expiration, replay prevention, stale/late rejection, local cancellation, and project/unit/generation invalidation. | Provider-side cancellation, durable background jobs, restart recovery, partial-output workflows, or long-lived queue cleanup/retention. |
| Evaluation | Twelve frozen synthetic fixtures, strict schema and verbatim-evidence checks, two captured executions, 24 structurally valid outputs, 89 exact-source evidence strings, no retry/fallback/reroute, verifier reconciliation, a completed four-field human review, and accepted hands-on G evidence with documented limitations. | Novel-editor or developmental-editing competence, literary PASS/FAIL, human or expert consensus, real-story usefulness, repeatability across time/tasks, model drift, long context, local models, or other providers. |
| Observability and cost | Bounded provider failure classes, redacted main-only diagnostics, provider token usage, calculated cost, and external qualification evidence. | A general intelligence telemetry model, provider invoice truth, cross-task regression dashboard, local total cost, or production performance distributions. |
| Product experience | A Writing-Studio-only preview, credential/clearance/approval flow, separate advisory result, stale state, and no Command Center AI surface. | Result comparison/history, multi-task information architecture, background-job controls, or the V2.0-to-V3.0 GUI revision. |
| Extensibility | Strong candidate seams in immutable artifacts, approval binding, gateway isolation, result validation, receipt generation, and evidence verification. | Authority to generalize critique-specific OpenAI fields, the selected-prose schema, fixtures, UI, or qualification thresholds into universal AI infrastructure. |

The completed Qualification Contract V2 capture proves only that the exact
pinned route, prompt/instruction, wrapper, schema, selected-prose task, corpus,
provider policy, and repository revision satisfied the objective route contract.
It does not prove that the model is a competent novel editor, that all critiques
are useful, that the provider is best, or that other tasks, prompts, contexts,
routes, models, and hardware are safe.

### 9.2 Intentional V1 deferrals versus planning omissions

Intentional V1 deferrals are multiple providers, local AI, automatic routing,
fallback, prompt optimization, background or scheduled work, memory,
persistence, history, whole-project context, broad task support, and GUI
redesign. They remain non-blocking for the frozen V2 live qualification.

The planning omissions that need a future explicit home are a task taxonomy,
a populated capability/receipt model, general context-construction and
invalidation rules, intelligence-specific observability, a real-use evaluation
program, prompt-family promotion rules, background-job cleanup and retention,
and a product decision on persistent learned/advisory state. Stage 12 and the
current product dossiers supply safety floors for several of these questions;
they do not supply the missing V2 program decisions or runtime evidence.

## 10. Classified weakness and gap ledger

`Source kind` distinguishes repository authority, evidence, inference,
recommendation, and open question. Each finding has one controlling
classification from the BS-19.14-24A classification set.

| ID | Major finding | Source kind | Controlling classification | Reopening trigger / required next evidence |
| --- | --- | --- | --- | --- |
| V2-GAP-001 | Resolved: Qualification Contract V2 capture and objective route verification, the four-field 24-output review, Jason's hands-on G acceptance, and H closure are complete; Package 19.14 is closed with documented limitations. | Closed evidence and acceptance gap | `resolved Package 19.14 closure requirement` | Reopen only if a separately authorized package changes the accepted bounded route contract; do not reopen for deferred post-V1 architecture work. |
| V2-GAP-002 | A second evidence-compliance failure would leave the product choice unresolved; automatic V3 contract creation is forbidden. | Repository authority and open question | `requires human authority` | A failed V2 capture requires explicit product-level disposition before any prompt, model, provider, schema, or contract change. |
| V2-GAP-003 | Package 19.14 implements one selected-prose critique task. | Repository authority | `intentional V1 limitation` | Reopen only after V1.0 when a bounded task-taxonomy package is authorized. |
| V2-GAP-004 | No canonical provider-neutral taxonomy separates critique, brainstorming, planning, revision, continuity, summarization, research, drafting, and extraction capability classes. | Inference from current dossiers and code | `future V2 architecture decision` | Authorize task architecture and define owners, inputs, outputs, risk, latency, context, and evaluation per class. |
| V2-GAP-005 | Stage 12 defines a capability-matrix contract, but no populated current model/provider/task matrix exists. | Repository authority plus evidence gap | `V1.0-to-V2.0 refinement item` | Define task taxonomy, evidence grades, receipt lifetime, and promotion rules before populating the matrix. |
| V2-GAP-006 | V1 has one pinned provider/model and no manual multi-route control or automatic routing. | Repository authority | `intentional V1 limitation` | Reopen after task-specific alternative-route receipts and an explicit product routing decision. |
| V2-GAP-007 | Current context is exactly selected prose plus fixed instruction, with main-owned identity bindings. | Repository authority | `intentional V1 limitation` | Reopen for a named task that requires additional context; preserve preview-to-payload identity and source declarations. |
| V2-GAP-008 | General context selection, growth limits, stale-summary invalidation, cross-project isolation, and whole-chapter/long-context behavior are not operationally proved. | Open question and evidence gap | `future V2 architecture decision` | Define a task-bound context contract and prove source/currentness/protection/project bindings with synthetic tests. |
| V2-GAP-009 | Whether the intelligence layer needs persistent learned state, summaries, embeddings, or other derived memory remains unresolved. | Open question | `requires human authority` | Human decision must name value, ownership, retention, invalidation, deletion, protection, and prohibited storage before design. |
| V2-GAP-010 | Package qualification establishes route validity; real-story usefulness and cross-task editorial quality remain unknown. | Evidence gap | `V1.0-to-V2.0 refinement item` | After Package 19.22 and separate authorization, establish governed real-story sets, held-out fixtures, blinded review where useful, and author-value measures. |
| V2-GAP-011 | General intelligence telemetry, trace, redacted diagnostic, cost, latency, and regression records are not defined as one operational program. | Open question with existing safety floors | `future V2 architecture decision` | Build on Stage 12 telemetry/evidence/cost contracts; define minimum data, redaction, retention, and claim scope before runtime work. |
| V2-GAP-012 | Package 19.14 treats selected manuscript instructions as data, but broader project-content, retrieved-content, provider-returned-instruction, and tool injection behavior is not proved. | Evidence gap | `V1.0-to-V2.0 refinement item` | Add task-specific adversarial fixtures after context and tool boundaries are authorized. |
| V2-GAP-013 | Package 19.14 relies on exact preview and manual clearance because automatic protected-content detection does not exist. | Repository authority | `already governed elsewhere` | The protected-content matrix and package/payload contracts remain controlling; reopen only for a separately authorized detection/transform path. |
| V2-GAP-014 | Cancellation stops local waiting and rejects late results; it does not prove provider-side cancellation or zero cost. | Repository authority | `intentional V1 limitation` | Preserve honest wording; later measure provider and local cleanup under a lifecycle/reliability package. |
| V2-GAP-015 | Background, scheduled, overnight, restart-surviving, and partial-result execution is absent from Package 19.14. | Repository authority | `future V2 architecture decision` | Authorize a background-work product decision, then resolve queue ownership, revalidation, cleanup, retention, budgets, protection, and review UX before execution. |
| V2-GAP-016 | Result comparison, durable history, revisit workflows, and author-preference learning are absent. | Repository authority and open question | `V1.0-to-V2.0 refinement item` | Gather real-use demand; define retention and owner boundaries before making results durable. |
| V2-GAP-017 | Some current request, approval, validation, and receipt seams are reusable, but the coordinator, schema, fixtures, and UI are partly critique/OpenAI-specific. | Inference | `future V2 architecture decision` | Generalize only after a second task or provider demonstrates a shared invariant; do not pre-generalize. |
| V2-GAP-018 | Legacy Python routes permit fallback, persistence, broad service exposure, and caller-owned identifiers that conflict with current Package 19.14 boundaries. | Implementation evidence | `already governed elsewhere` | Keep disconnected from the Package 19.14 path; reopen under a bounded salvage/fencing package if production reachability or reuse is proposed. |
| V2-GAP-019 | Complete-story and normal-workload learning has not yet been converted into a governed intelligence-layer evidence program. | Recommendation | `V1.0-to-V2.0 refinement item` | Begin after V1.0 with privacy-safe issue records and explicit separation of manuscript content from register metadata. |
| V2-GAP-020 | Cross-route total cost, normal-load performance, supported hardware, and interference with ordinary applications remain incomplete. | Evidence gap | `V1.0-to-V2.0 refinement item` | Authorize dated task workloads, hardware classes, normal-load measurements, provider pricing snapshots, and cost claim rules. |
| V2-GAP-021 | Task priorities, supported providers/models, hardware floors, experiment budgets, real-story data use, reviewer availability, retention, routing automation, and promotion gates are product choices. | Open question | `requires human authority` | Jason must approve each bounded program charter before execution or promotion. |
| V2-GAP-022 | Final multi-task layout, visual comparison, control density, polish, and broader Writing Studio redesign are not defined. | Open question | `V2.0-to-V3.0 GUI/polish concern` | Reopen after intelligence behavior and workflow evidence are mature enough to support the major GUI revision. |
| V2-GAP-023 | Connector admission, connector-specific AI routing, and external workspace integration are not part of this register package. | Repository authority | `out of scope` | Reopen only through the existing workflow-proof and Missing Connector Review gates plus explicit connector authority. |

### 10.1 Exact resolution-stage map

The classification column states disposition. This map separately names one
exact expected resolution stage for every deferral; the final ledger column
remains the corresponding reopening trigger and required evidence.

| Finding | Expected resolution stage |
| --- | --- |
| V2-GAP-001 | Resolved by Package 19.14 four-field qualitative review, hands-on G acceptance, and H closure. |
| V2-GAP-002 | Package 19.14 post-V2-failure product-disposition decision, only if V2 evidence compliance fails again. |
| V2-GAP-003 | First explicitly authorized post-V1.0 task-architecture package. |
| V2-GAP-004 | First V1.0-to-V2.0 task-architecture package. |
| V2-GAP-005 | V1.0-to-V2.0 capability-matrix package after task taxonomy and evidence rules. |
| V2-GAP-006 | V1.0-to-V2.0 routing-policy decision after alternative-route receipts. |
| V2-GAP-007 | First future task package whose named contract requires broader context. |
| V2-GAP-008 | V1.0-to-V2.0 context-construction architecture package. |
| V2-GAP-009 | Human product decision before any learned-state, summary, embedding, or derived-memory design. |
| V2-GAP-010 | V1.0-to-V2.0 real-use evaluation program. |
| V2-GAP-011 | V1.0-to-V2.0 intelligence observability architecture package. |
| V2-GAP-012 | V1.0-to-V2.0 task-specific adversarial safety evaluation. |
| V2-GAP-013 | Applicable protected-content detection or transformation package, before such a path is designed. |
| V2-GAP-014 | V1.0-to-V2.0 reliability and lifecycle evidence program. |
| V2-GAP-015 | V1.0-to-V2.0 background-work architecture package. |
| V2-GAP-016 | V1.0-to-V2.0 history, comparison, retention, and preference-learning product decision. |
| V2-GAP-017 | Shared-seam architecture review after evidence from a second task or provider. |
| V2-GAP-018 | Bounded legacy salvage/fencing package before any reuse or production reachability. |
| V2-GAP-019 | First explicitly authorized post-V1.0 real-story evidence program. |
| V2-GAP-020 | V1.0-to-V2.0 performance, hardware, and total-cost evidence program. |
| V2-GAP-021 | Human approval before each bounded V1.0-to-V2.0 program charter. |
| V2-GAP-022 | V2.0-to-V3.0 GUI and product-polish program. |
| V2-GAP-023 | Missing Connector Review followed by an explicitly authorized connector package. |

No new `V1 blocking defect` was found. The V2 live capture, objective verifier
reconciliation, qualitative review, hands-on G acceptance, and H closure are
complete. Package 19.14 is closed, and Package 19.15 is eligible to begin
separately.

## 11. Package 19.14 stopping boundary and sequencing

The closed Package 19.14 boundary is:

```text
The Qualification Contract V2 capture and objective route verification are
complete and immutable. The qualitative review, hands-on G acceptance, and H
closure are complete. Package 19.14 is closed.

Do not run another capture or automatically create Qualification Contract V3.

Do not begin repeated prompt optimization, model bake-offs,
alternate-provider qualification, local-model qualification,
local-first critique, or broad intelligence-layer refinement inside Package
19.14. Package 19.15 requires separate bounded authorization.
```

BS-19.14-24A sequencing assessment, dated 2026-07-17:

```text
PROCEED_WITH_BS_19_14_24
```

That 2026-07-17 sequencing assessment is historical: the authorized run later
completed. Current sequencing authority is the closed Package 19.14
qualification record plus the current truth index and roadmap. No provider
call or Package 19.15 implementation is authorized by this closure.

## 12. Discovery and maintenance rules

1. `current_truth_index.md` and `current_product_roadmap.md` must link this file
   as the canonical forward-looking AI intelligence-layer register.
2. Package 19.14 scope and qualification records must link here for later
   program context while retaining their own qualification authority.
3. New evidence receives a stable `V2-AI-*` entry; new audit gaps receive a
   stable `V2-GAP-*` entry. Do not renumber or rewrite historical entries.
4. Corrections add a new entry and explicit supersession link. They do not
   silently revise a dated model, run, cost, failure, or hardware receipt.
5. Future planning must state source kind, authority class, product horizon,
   reopening trigger, expected resolution stage, and human decisions needed.
6. A code path, test, harness, provider document, benchmark, or successful run
   is evidence only for its observed scope. Promotion requires an explicit
   product decision and current authority update.
7. Keep providers, models, prompts, task contracts, wrappers, schemas,
   fixtures, hardware, and dates exact where known and visibly unknown where
   not proved.
8. Never store API credentials, manuscript prose, raw provider responses,
   private qualification contents, authorization headers, reviewer identity,
   private paths, or temporary operational secrets in this register.
9. Re-review the register at V1.0 closure, before the first V1.0-to-V2.0 AI
   program package, when a new AI task/provider/local runtime/background lane is
   proposed, and before any capability-matrix or routing-policy promotion.
10. Maintenance is documentation/governance work only unless a later explicit
    task separately authorizes implementation, model execution, provider calls,
    benchmarking, or private-data handling.
