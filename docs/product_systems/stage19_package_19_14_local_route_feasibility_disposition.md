# Stage 19 Package 19.14 local-route feasibility disposition

Status: V1 local-route disposition recorded; no local route selected or connected

Package: 19.14 — bounded selected-prose critique

Date: 2026-07-15

## 1. Package identity and current authority

Package 19.14 remains open. Its existing uncommitted selected-prose OpenAI
critique implementation is the only current V1 implementation candidate and
remains pending live qualification and two-human scoring. This disposition
records feasibility evidence only; it authorizes no runtime or test mutation,
does not close Package 19.14, and does not authorize Package 19.15.

The authoritative feasibility receipts are V2-AI-017 through V2-AI-024 in
[`v2_ai_insight_register.md`](./v2_ai_insight_register.md). They preserve V2
knowledge but do not create Package 19.14 implementation authority.

## 2. Evidence inspected

- the canonical V2 AI Insight Register, including the dated direct-Ollama
  capability, feasibility, resource, historical-path, and disposition entries;
- the Package 19.14 scope and dual-route reconciliation records;
- the historical Python/router `invalid_output` evidence; and
- the frozen synthetic selected-prose fixtures and strict validation contract.

The direct evidence used Ollama `0.13.0`. `qwen3:4b` is recorded at model layer
`sha256:3e4cb14174460404e7a233e531675303b2fbf7749c02f91864fe311ab6344e4f`;
`qwen3:8b` is recorded at model layer
`sha256:a3de86cd1c132c822487ededd47a324c50491393e6565cd14bafa40d0b8e686f`.
Both were direct local, synthetic-fixture feasibility runs, not a full human
quality qualification or a supported-hardware benchmark. No low-load or
overnight witness is treated as V1 evidence.

## 3. Feasibility findings

| Candidate | Result | V1 reading |
| --- | --- | --- |
| `qwen3:4b` | Three representative fixtures completed; two of three were strict-valid. The recorded real-fixture elapsed times were 139.55 s, 120.34 s, and 61.28 s. | Borderline by speed but not reliably strict-valid; not qualified for V1. |
| `qwen3:8b` | All three representative fixtures were strict-valid, at 150.48 s, 166.50 s, and 163.08 s; the loaded worker also showed material memory and CPU pressure under representative load. | Stronger small-sample structural result, but not suitable as an interactive V1 route from current evidence. |

Direct Ollama proved that both models can produce structured critique. It also
means the historical Python/router `invalid_output` failures are not evidence
of categorical model incapability. Their exact cause remains unresolved: the
Python/router, prompt/schema, adapter-normalization, and long-form validator
seams remain V2 investigation, with model adherence a possible contributor.

## 4. V1 disposition

No local critique route will be connected or exposed in Package 19.14. Package
19.14 will not implement dual-route selection or rerouting. The existing
bounded OpenAI route remains the only currently implemented V1 critique
candidate, pending its independent live qualification; this is not accepted
release evidence.

## 5. V2 preservation and reopening

Both models, their evidence, local adapters, prompts, and tests are preserved.
`qwen3:4b` remains a future lower-hardware candidate. `qwen3:8b` remains an
off-hours or higher-hardware candidate. Scheduling, hardware routing, model
comparison, prompt experimentation, and the Python/router `invalid_output`
investigation remain V2-only.

A local V1 route may be reconsidered only when all of the following are true:

1. one exact local model passes full task-quality qualification;
2. interactive performance is accepted for a defined hardware class;
3. main-owned Project Spine binding and advisory-only behavior are proven;
4. packaging and external Ollama/Python requirements are explicitly accepted;
   and
5. Jason issues separate authorization.

This decision deletes no local AI files, models, evidence, adapters, prompts,
or tests. It is neither condemnation nor permanent rejection of local AI.

## 6. Authority boundary

This record preserves a future option only. It authorizes no provider call,
local-model call, credential handling, runtime change, test change, local-route
exposure, provider selection, rerouting, Package 19.14 closure, or Package
19.15 work. Stage 19 and V1.0 remain open.
