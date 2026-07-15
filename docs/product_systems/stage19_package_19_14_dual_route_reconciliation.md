# Stage 19 Package 19.14 Dual-Route Reconciliation

Status: documentation reconciliation complete; no runtime or test mutation authorized; the later V1 local-route disposition selects no local route, while provider qualification, Jason manual acceptance, and closure remain pending

Package: 19.14 — bounded selected-prose critique

Branch: `salvage/minimal-two-surface-shell`

Verification date: 2026-07-14

## 1. Purpose and authority

This record reconciles the existing local-AI system with the uncommitted
Package 19.14 OpenAI selected-prose critique work. It preserves both bodies of
evidence and identifies the smallest independently closable V1 boundary.

This record authorizes no runtime or test mutation. It does not authorize a
local route, provider connection, model execution, provider request, Package
19.14-G manual acceptance, Package 19.14-H closure, current-authority
synchronization, Package 19.15, Stage 19 closure, a commit, or a push.

V2 evaluation and orchestration findings are preserved separately in
[`v2_ai_insight_register.md`](./v2_ai_insight_register.md). Registration there
does not make an idea current authority or enlarge Package 19.14.

The later, controlling current-V1 linkage is
[`stage19_package_19_14_local_route_feasibility_disposition.md`](./stage19_package_19_14_local_route_feasibility_disposition.md).
It records that dual-route viability was investigated, no local route is
selected for V1 from current evidence, and the maximum dual-route architecture
remains a future possibility rather than current V1 scope. OpenAI remains the
only currently implemented V1 critique candidate, pending live qualification;
the canonical V2 register governs the preserved local findings.

## 2. Repository gate

The audit began and ended on:

- branch `salvage/minimal-two-surface-shell`;
- HEAD and upstream
  `3e77a1eb5bd68bb23e68e7f187b584f8ee458417`;
- ahead/behind `0/0`;
- the expected uncommitted Package 19.14 A-F work: nine modified tracked files
  and twelve untracked paths/files before these documentation records; and
- no staged, deleted, committed, pushed, or unexplained work.

The old local-AI files and new OpenAI files were both present. No provider or
local-model request was run, and no manuscript content was transmitted.

## 3. Authority classification

| Record | Classification | Reconciled reading |
| --- | --- | --- |
| `current_truth_index.md` | `CURRENT_AUTHORITY` and `CONTRADICTORY` | Its provider-neutral, advisory, privacy, and author-control doctrine remains current. Its statement that no 19.14 implementation is authorized predates Jason's later A-F authorization. |
| `current_product_roadmap.md` | `CURRENT_AUTHORITY` and `CONTRADICTORY` | The Stage 19 sequence remains controlling; its current-position 19.14 authorization wording is stale. |
| `stage19_v1_master_implementation_and_acceptance_plan.md` | `CURRENT_AUTHORITY` and `CONTRADICTORY` | Package order and acceptance gates remain controlling; its no-19.14-authorization statement predates the A-F authorization. |
| `stage19_v1_scope_lock.md` | `CURRENT_AUTHORITY` | AI is optional, advisory, project-isolated, and nonessential. Core writing must work without AI, cloud, internet, or Python. |
| Package 19.12 and 19.13 closure records | `HISTORICAL` closure receipts | Both packages remain closed and neither grants AI authority. |
| `stage19_package_19_14_scope_and_inspection.md` | `ACTIVE_BUT_INCOMPLETE` and partly `CONTRADICTORY` | It truthfully records A-F authority and the safe OpenAI slice. Its exclusion of all local models and multiple providers is not a final provider-neutral V1 decision. |
| `stage19_package_19_14_model_qualification.md` | `ACTIVE_BUT_INCOMPLETE` | The fixed corpus and scoring contract exist; live requests and two-human scoring remain pending. |
| `model_routing_and_budget_architecture.md` | `CURRENT_AUTHORITY` for governance; runtime incomplete | It owns route selection, refusal, fallback, spend posture, and author-facing route modes. It does not authorize automatic V1 routing. |
| AI lifecycle, approval, provenance, privacy, and protected-content records | `CURRENT_AUTHORITY` or `REFERENCE_ONLY` according to implementation maturity | They prohibit silent transmission, spending, durable AI-origin state, and manuscript mutation. |
| `docs/policies.md` | `CONTRADICTORY` where it permits broader rewrite/apply/persistence | Its local-first and optional-provider principles remain evidence, but it cannot override the Stage 19 bounded critique authority. |
| Stage 13 AI inventories and salvage dispositions | `HISTORICAL` and `REFERENCE_ONLY` | They preserve old runtime evidence, not current implementation authority. |

Current authority requires merely optional AI. It supports a provider-neutral,
privacy-preferred posture, but does not yet require local-only, remote-only, or
hybrid shipment. Silent fallback is not authorized. Explicit rerouting is a
separate author decision and must create a new request and approval boundary.

## 4. Existing local-AI inventory

| Seam | Runtime/model | Purpose and contract | Reachability and authority | Material behavior | Evidence |
| --- | --- | --- | --- | --- | --- |
| `services/src/blackskies/services/model_adapters.py` | Ollama HTTP adapter; repository default `qwen3:4b` | Generic prompt/system/options to normalized text; health check | `PARTIALLY_CONNECTED`, `REUSABLE_WITH_REPAIR` | No shared strict critique schema; no author-facing cancellation | Source and `services/tests/unit/test_model_adapters.py` |
| `services/src/blackskies/services/model_routing.py`, `services/src/blackskies/services/model_router.py`, `services/src/blackskies/services/run_policy.py` | Local Ollama and older OpenAI adapter registry | Provider eligibility, model selection, budget policy, fallback | `PARTIALLY_CONNECTED`, `REUSABLE_WITH_REPAIR` | `route_with_policy` respects policy better than `route`; existing tests encode automatic fallback behavior that is incompatible with V1 manual rerouting | Source, `services/tests/unit/test_model_router.py`, and `services/tests/unit/test_run_policy.py` |
| `services/src/blackskies/services/critique.py` | Offline rubric or routed provider | Whole-scene critique with a legacy result schema | `LEGACY_REACHABLE`, `REUSABLE_WITH_REPAIR` | Reads scene state; bounded JSON parsing; provider/malformed failure silently becomes deterministic critique | Source and `services/tests/unit/test_critique_adapter_validation.py` |
| `services/src/blackskies/services/routers/draft/revision.py` | FastAPI/Python | `/draft/critique` and `/draft/rewrite` | `LEGACY_REACHABLE`, `AUTHORITY_INCOMPATIBLE` for Package 19.14 | Critique persists summary/budget/diagnostics; rewrite can persist a revised scene | Source and `services/tests/test_app.py` contract/persistence tests |
| draft/long-form generation | FastAPI/Python plus provider router | Draft and long-form generation/recovery experiments | `LEGACY`, `OUTSIDE_V1` | Persists generated artifacts; diagnostics may retain output excerpts | Operations source and historical run records |
| Electron `services` bridge | Preload direct HTTP calls to FastAPI | Critique, rewrite, generate, accept, snapshots, recovery, export, analytics, and path reveal | `CURRENT_PRODUCTION_PATH` exposure but legacy use; `BYPASS_RISK` | Writing Studio receives a much broader surface than the narrow AI authority | `app/main/preload.ts` |
| `app/main/optionalServiceStartup.ts` | Main process starts Python service | Makes legacy service APIs available while allowing core startup to continue on failure | `PARTIALLY_CONNECTED` | Local AI depends on Python service availability | Source, `app/main/main.ts`, and `app/main/__tests__/optionalServiceStartup.test.ts` |

Machine inspection on 2026-07-14 established that Ollama is installed and
that `qwen3:4b` and `qwen3:8b` are present. Other installed model tags are
recorded only in the V2 register because Package 19.14 may qualify at most one
local route.

Historical Git record
`fa4bd0c:docs/runbooks/long_form_integrated_pass_20260316.md` proves that a
local OpenAI-compatible Ollama path used `qwen3:4b` for drafting and
`qwen3:8b` for a stronger retry. Its clean and adversarial post-fix reruns
stopped immediately on `invalid_output`. Earlier successful adversarial runs
in the same record used provider-backed behavior, including OpenAI evidence;
they do not qualify local selected-prose critique.

The current repository therefore proves local installation, adapter
connectivity, routing construction, mocked behaviors, and historical real
generation attempts. It does not prove useful or qualified real local
selected-prose critique.

## 5. New OpenAI Package 19.14 inventory

| Component | Classification | Reconciled ownership |
| --- | --- | --- |
| `app/shared/ipc/aiCritique.ts` | `SHARED_PROVIDER_NEUTRAL_CORE`, partly OpenAI-shaped | Preserve bridge, lifecycle, selection, result, error, and provenance types; generalize provider-specific fields only under later authority. |
| `app/main/aiCritiqueCoordinator.ts` | `NEW_STRONGER_IMPLEMENTATION`, `DUPLICATES_EXISTING_SYSTEM` | Preserve main authority, immutable artifact, expiration, replay, stale, and cancellation logic; extract OpenAI request/pricing construction before adding a local route. |
| `app/main/aiCritiqueGateway.ts` | `OPENAI_GATEWAY_ONLY` | Retain as the fixed OpenAI Responses API adapter. |
| `app/main/aiCritiqueIpc.ts` | `NEW_STRONGER_IMPLEMENTATION` | Retain sender-role, process-session, Project Spine, credential, and lifecycle enforcement. |
| `app/main/main.ts` integration | `NEW_STRONGER_IMPLEMENTATION` | Retain registered-window authority and coordinator registration. |
| `app/main/preload.ts` AI additions | `NEW_STRONGER_IMPLEMENTATION` | Retain the narrow Writing-Studio-only `aiCritique` bridge. Existing broad globals remain a separate bypass finding. |
| `DraftEditor.tsx` and `Stage19WritingSpineApp.tsx` | `OPENAI_UI_POLICY`, `NEW_STRONGER_IMPLEMENTATION` | Retain exact selection evidence, preview/approval, progress, stop-waiting, stale state, and advisory result; provider presentation must become route-specific if local is retained. |
| Qualification fixtures and tests | `TEST_OR_EVIDENCE_ONLY`, provider-reusable | Use the same frozen corpus with separate provider/model receipts. |
| Scope and qualification records | `ACTIVE_BUT_INCOMPLETE` | Preserve historical OpenAI decisions while linking this reconciliation and the V2 register. |

The new work created a second coordinator, lifecycle, prompt system, result
schema, credential path, bridge, and critique UI. It did not create a general
router or a persistence path. It did not delete, gut, or rewrite the old local
system, and it did not change `app/renderer/index.tsx`.

## 6. Production reachability and AI entry map

| Entry | Complete path | Classification | Reads/sends/writes |
| --- | --- | --- | --- |
| Stage 19 selected-prose critique | `Stage19WritingSpineApp` → `window.aiCritique` → narrow IPC → main coordinator → OpenAI gateway → ephemeral advisory UI | `AUTHORIZED_CURRENT` within A-F implementation authority; qualification pending | Reads exact selected prose; remote send only after preview/approval; no manuscript write |
| Legacy header Critique | `WorkspaceHeader` → `useCritique` → `window.services.critiqueDraft` → FastAPI → `CritiqueService`/router → persisted summary | `LEGACY_REACHABLE`, `BYPASS_RISK` | Reads whole scene; may invoke local/API/deterministic route; persists support state |
| Legacy saved Rewrite | `CritiqueModal` → `services.rewriteDraft` → FastAPI → provider/fallback → draft persistence | `LEGACY_REACHABLE`, `AUTHORITY_INCOMPATIBLE` | Reads and durably replaces scene content before renderer sync |
| Legacy Generate/Write draft | legacy `App` → `services.generateDraft` → FastAPI/provider/fallback → generated artifacts | `LEGACY_REACHABLE`, `OUTSIDE_V1` | Reads project context and writes artifacts |
| Legacy acceptance/snapshot/recovery/export | legacy `App` or broad bridge → fixed service methods | `BYPASS_RISK` | Can affect durable state, snapshots, recovery, exports, or budget state |
| Companion batch critique | `App`/Companion → repeated `services.critiqueDraft` | `LEGACY_REACHABLE` | Whole-scene requests; renderer cancellation only ignores late results |
| Companion model-insight labels | renderer deterministic calculations | `SYNTHETIC`, `LEGACY` | No provider call in the inspected implementation |
| Phase 4 mock flows | environment/test flag → mock critique/rewrite routes | `TEST_ONLY` | Privileged if hostile production configuration enables the flags |
| Command Center | narrow `projectSpine` and passive `splitCommand` surfaces | no AI route | Receives no AI bridge, prose, services, filesystem, or test escape global under its validated secondary role |

Normal split-workspace launch renders the dedicated Stage 19 application. The
legacy `App` remains conditionally reachable when no recognized dedicated role
is present. The dedicated Writing Studio also receives `services`,
`projectLoader`, and `__electronApi.fs`, even though its current UI does not use
those globals for Package 19.14. Unused is not unreachable.

No arbitrary generic IPC invocation was found. The fixed broad globals are
nevertheless sufficient to bypass the narrow Package 19.14 authority.

## 7. Old-versus-new seam comparison

| Capability | Existing local implementation | New implementation | Recommended V1 owner |
| --- | --- | --- | --- |
| Selected prose | Whole scene or submitted legacy text | Exact UTF-16 selection, revision, buffer and selection fingerprints | New Writing Studio/editor seam |
| Request identity | Trace/request identifiers | Immutable canonical bytes, SHA-256, UUID, five-minute expiry | Shared main coordinator |
| Project/session/generation | Caller project/unit IDs | Main-owned Project Spine and process session | Shared main coordinator |
| Prompt construction | Python task profiles and legacy critique prompt | Fixed critique-v1 OpenAI body | Provider gateways behind one shared critique contract |
| Provider/model identity | Router decision | Pinned exact OpenAI model | Shared provenance; gateway-specific truth |
| Routing | Automatic-capable Python router | Fixed OpenAI route | Explicit author selection contract; no automatic router |
| Rerouting | Not distinct from fallback | Not yet implemented | New artifact and new approval in shared coordinator |
| Silent fallback | Provider and deterministic fallbacks exist | Prohibited | Prohibited V1-wide |
| Cancellation/staleness | Timeout or renderer ignore; weak stale binding | Abort, late-result rejection, invalidation, replay protection | New lifecycle |
| Validation | Legacy bounded parsing then fallback | Strict schema and verbatim-evidence checks | Shared strict result contract plus gateway normalization |
| Credentials | Service environment | Main-memory session credential, no readback | Gateway-specific credential owner |
| Privacy/cost | Governance and legacy budget data | Exact remote preview, retention, pricing, and estimate | Shared UI with gateway-specific disclosure |
| Local health | Ollama health adapter | Not applicable | Repaired local gateway |
| Presentation | Legacy critique/rewrite modal | Advisory-only and unmistakable stale result | New UI |
| Mutation/persistence | Rewrite/generation and critique history persist | None | No Package 19.14 persistence or mutation |
| Recovery/Command Center | Broad legacy surface; no safe AI contract | Explicitly excluded and not exposed to Command Center | New boundary |
| Diagnostics | Extensive but may include output excerpts | Redacted errors; no prose/credential logging | New redaction standard |
| Packaging | External Python and Ollama/model | Native main-process HTTPS | Provider-specific; local remains optional or blocked |
| Qualification | Mocked tests and failed historical local output | Frozen twelve-fixture program; live scoring pending | Same corpus, separate receipts |
| Electron acceptance | Legacy workflow evidence | Dedicated Stage 19 workflow evidence | New production path |

## 8. Duplicate and bypass findings

The repository contains two critique coordinators, prompt systems, result
schemas, API credential sources, and renderer critique surfaces. The duplicate
systems must not both remain production authority.

Material bypasses are:

1. broad `services`, `projectLoader`, and filesystem globals in Writing Studio;
2. conditionally reachable legacy `App` selection;
3. legacy rewrite and generation persistence;
4. automatic provider and deterministic fallback;
5. caller-owned project identifiers without the new Project Spine binding;
6. long-form diagnostics capable of retaining output excerpts;
7. environment-controlled mock/harness surfaces; and
8. privileged non-secondary preload behavior when the trusted role is missing
   or malformed.

These are fencing and classification findings. They do not prove that the new
OpenAI gateway itself mutates or persists manuscript truth.

## 9. Preservation and backdoor audit

| Check | Disposition |
| --- | --- |
| Old local implementation/configuration preserved | `PASS` — no tracked deletion or replacement found |
| New OpenAI implementation preserved | `PASS` — all expected A-F files remain uncommitted |
| Command Center AI/prose exposure | `PASS` for the validated secondary role |
| New OpenAI mutation/persistence | `PASS` — no apply, save, recovery, snapshot, export, or history path |
| New credential renderer readback or documented secret | `PASS` — no readback and no credential value entered in documentation |
| New session credential exposure to local services | `PASS` — the new credential is held by the main coordinator/gateway and is not forwarded to the Python service |
| Legacy environment credential path | `BYPASS_RISK` — Python service settings retain a separate environment-configured OpenAI credential path; it is not the new session credential and must not become an alternate Package 19.14 route |
| Broad services bypass | `BYPASS_RISK` |
| Conditional legacy renderer | `BYPASS_RISK` |
| Alternate AI persistence/mutation | `BYPASS_RISK` through legacy routes |
| Fallback without new author authorization | `BYPASS_RISK` in legacy router/service behavior |
| Local Project Spine isolation | `UNKNOWN` — caller project IDs do not prove main-owned active-project binding |
| Generic IPC bypass | No arbitrary invocation found; fixed broad APIs remain risky |
| Test switches in normal production | `TEST_ONLY` by default; hostile environment configuration remains a risk |
| Ignored artifacts | No credential-shaped `sk-...` value found in ignored Playwright report/result paths; absence of all sensitive prose cannot be proved from a pattern-only check |

## 10. V1 hybrid viability

A coherent two-route V1 could be viable only if the local route is separately
qualified and the broad legacy paths are fenced. It is not current V1 scope.
The preserved maximum architecture is:

```text
one selected-prose critique UI
  -> one narrow aiCritique bridge
  -> one main-owned provider-neutral authority/lifecycle coordinator
  -> one immutable provider-specific request artifact
  -> either one qualified local gateway or the pinned OpenAI gateway
  -> one strict ephemeral advisory result
```

The new coordinator is not fully provider-neutral because it currently owns
OpenAI request construction, model, and pricing. Its authority, selection,
artifact, lifecycle, result, stale, cancellation, and replay machinery are
strong shared seams. `aiCritiqueGateway.ts` can remain the OpenAI adapter.

A two-provider interface is justified, not speculative, if and only if Jason
retains one local route. It must expose gateway-specific preparation and
execution without automatically selecting or substituting providers.

Both routes can share the strict result schema. A local gateway may perform
bounded extraction and normalization before validation, but invalid output
must fail closed. It may not weaken the schema or silently substitute the
offline rubric. Existing evidence does not prove that `qwen3:4b` or `qwen3:8b`
can pass that contract.

Local-first plus explicit OpenAI quality escalation is technically feasible,
but remains a human product decision. No Local control may ship merely because
Ollama is installed.

## 11. Recommended V1 architecture and rerouting

1. The author selects exact prose.
2. The author explicitly chooses the qualified Local route or pinned OpenAI
   route.
3. Main resolves the registered Writing Studio sender and current Project
   Spine authority.
4. The chosen gateway prepares provider-specific immutable bytes.
5. Local preview identifies exact runtime/model. OpenAI preview identifies
   exact provider/model/payload/privacy/retention/cost.
6. The author approves that exact request.
7. Only the selected gateway executes.
8. Failure terminates the request without fallback.
9. Choosing another route creates a new UUID, canonical payload, hash,
   expiration, preview, and approval.
10. Request, credential, approval, and result state are not reused across
    providers.

Either provider may fail without blocking open, edit, Save, recovery, close,
shutdown, or the other provider's later explicitly authorized request.

## 12. Dispositions

| Component | Disposition |
| --- | --- |
| New selection capture, authority lifecycle, strict result, narrow bridge, advisory UI, fixtures | `KEEP_AND_USE` |
| New OpenAI gateway | `KEEP_AND_USE` as the API gateway |
| Ollama adapter, health checks, provider vocabulary, and policy concepts | `REPAIR_AND_MIGRATE` only if one local route is retained |
| Legacy critique/rewrite/generation UI and broad AI service methods | `KEEP_BUT_DISCONNECT_AND_DOCUMENT` |
| Long-form generation, rewrite/apply, AI history, automatic routing/fallback | `DEFER_WITHOUT_DELETION` |
| Duplicate coordinator/UI/result paths | `REMOVE_LATER_AFTER_ACCEPTED_MIGRATION`; no immediate deletion authorized |

## 13. Smallest coherent V1 implementation horizon

This record does not authorize the horizon. A later bounded authorization
would need to:

1. reconcile current authority to allow at most one local and one OpenAI
   selected-prose critique route;
2. fence broad legacy globals from the dedicated Stage 19 renderer while
   preserving closed Package 19.12/19.13 behavior;
3. extract provider-neutral artifact/lifecycle/result behavior from
   `aiCritiqueCoordinator.ts` without changing approved OpenAI request bytes;
4. retain `aiCritiqueGateway.ts` as the OpenAI gateway;
5. add manual provider selection and new-artifact explicit rerouting;
6. decide whether the local gateway reuses a dedicated, ephemeral Python
   service boundary or a narrow TypeScript Ollama adapter;
7. bind local execution to the same main-owned Project Spine authority;
8. prohibit persistence, mutation, fallback, retry, output-excerpt logging,
   and broad service exposure;
9. qualify the one selected local runtime/model separately; and
10. requalify the pinned OpenAI route and complete Jason's manual acceptance.

No multi-model comparison, hardware-aware routing, automatic selection,
prompt-experiment platform, background job, model management, or Package
19.15 work belongs in this horizon.

## 14. Likely files and protected files

Provider-neutral refactoring would likely involve:

- `app/shared/ipc/aiCritique.ts`;
- `app/main/aiCritiqueCoordinator.ts`;
- `app/main/aiCritiqueIpc.ts`;
- `app/main/preload.ts`;
- `app/main/main.ts`;
- `app/renderer/Stage19WritingSpineApp.tsx`;
- `app/renderer/types/global.d.ts`; and
- their existing Package 19.14 tests.

The API gateway remains:

- `app/main/aiCritiqueGateway.ts`; and
- `app/main/__tests__/aiCritiqueGateway.test.ts`.

Local salvage candidates are:

- `services/src/blackskies/services/model_adapters.py`;
- `services/src/blackskies/services/model_router.py`;
- `services/src/blackskies/services/model_routing.py`;
- `services/src/blackskies/services/run_policy.py`;
- `services/src/blackskies/services/critique.py`; and
- their focused adapter/router/policy/critique tests.

Legacy fencing may involve `app/renderer/index.tsx`, legacy `App`,
`useCritique.ts`, `CritiqueModal.tsx`, and the broad preload service exposure.
Exact files must be inspected and separately authorized before mutation.

Package 19.12/19.13 closure records and runtime behavior, recovery, Save,
Command Center projection/UI, export, manifests, dependencies, and lockfiles
remain protected from this documentation task.

## 15. Test and qualification impact

Preserve the existing Package 19.14 coordinator, gateway, IPC, preload,
renderer, qualification-integrity, and Electron tests. Prior implementation
evidence recorded 84 focused Vitest passes, one qualification-integrity pass
with the live qualification skipped, and 15 distinct Electron scenarios after
a focused cleanup rerun. This documentation task did not rerun those suites.

Later hybrid work requires:

- provider-neutral lifecycle tests for both gateway artifacts;
- manual selection and new-approval reroute tests;
- no-fallback and cross-provider replay rejection;
- broad-global absence and malformed-role fail-closed tests;
- local timeout, cancellation, late-result, strict normalization, and
  redaction tests;
- Project A/B and generation-change isolation tests; and
- separate 24-output qualification receipts for the chosen local model and
  pinned OpenAI model.

The frozen fixture corpus may be shared. Scores, model/runtime identity, hashes,
and adjudications remain provider-specific. Raw credentials, manuscript
content, prompts containing manuscript prose, and raw provider responses must
not enter repository evidence.

## 16. Packaging impact

The OpenAI path uses native main-process `fetch` and adds no dependency. The
existing local path requires an external Python interpreter, Python service
dependencies, a separately installed/running Ollama, and an installed model.
The Electron packaging configuration includes service source/requirements but
does not supply a Python runtime, Ollama, or model.

Because the V1 scope lock requires core operation without Python or AI, a local
route can be optional and truthfully unavailable. Making Python, Ollama, or a
model mandatory requires a separate packaging and scope decision. A direct
TypeScript Ollama gateway would remove Python from this critique path but would
duplicate adapter work and still require Ollama/model installation.

## 17. Human decisions required

Jason must decide:

- whether V1 ships a local route at all;
- the one exact local runtime/model to qualify;
- whether Local is the initial UI choice and OpenAI a manual quality
  escalation;
- whether selection is always per request or a session preference merely
  preselects the UI;
- Python reuse versus a narrow TypeScript Ollama gateway;
- whether deterministic offline critique is a named third route later or is
  deferred;
- whether any legacy critique history remains product-visible;
- whether production may ever fall back to the legacy `App`; and
- whether external Python/Ollama prerequisites are acceptable for optional V1
  functionality.

## 18. Stop conditions

Stop later implementation if:

- authority is not reconciled before adding a local route;
- legacy globals cannot be fenced without changing closed-package behavior;
- provider-neutral extraction changes the exact approved OpenAI request bytes;
- local execution cannot bind to main-owned Project Spine authority;
- the selected local model cannot pass the strict schema and qualification
  thresholds;
- parsing would weaken the result contract;
- any failure invokes another provider or deterministic result automatically;
- either route persists prose, prompts, results, or credentials;
- packaging makes Python/Ollama/model availability a core requirement;
- test switches or malformed roles grant production privilege; or
- the work implies Package 19.14-G/H, Package 19.15, Stage 19 closure, or V1.0
  completion.

Package 19.14 remains open. This reconciliation preserves a possible V1
dual-route architecture; it does not select, connect, qualify, or authorize
either route.
