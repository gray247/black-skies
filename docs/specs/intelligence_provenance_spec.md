Status: Planning / future scope, not current runtime authority
Owner: Phase 23 intelligence-governance planning
Last Reviewed: 2026-05-19

# Intelligence Provenance Spec

## Purpose

This spec defines the authority, provenance, classification, trust, and fallback vocabulary for future Narrative Consequence Engine / Intelligence Layer surfaces.

It exists so later intelligence work can stay honest about what is generated, what is verified, what is speculative, and what is unavailable.

This is a foundation artifact only. It does not implement runtime behavior.

## Scope

In scope:

- machine-usable intelligence vocabulary
- source-label rules
- confidence and trust language rules
- read and infer boundaries for future intelligence surfaces
- fallback and empty-state requirements for future intelligence surfaces

Out of scope:

- live AI behavior
- model prompting
- narrative scoring
- hidden inference
- output-quality validation
- real-author-workflow claims
- start-from-scratch workflow claims
- detached-window or two-monitor behavior

## Machine-Usable Terms

Future intelligence surfaces must classify their state using the following terms:

| Term | Meaning | Operator reading |
| --- | --- | --- |
| `generated` | Produced by a model or rule engine, but not necessarily verified | machine-produced content |
| `verified` | Checked against a trusted source or explicit proof lane | externally supported claim |
| `speculative` | An inference that should not be treated as fact | candidate interpretation |
| `deferred` | Intentionally not available yet or intentionally hidden behind a future phase | not ready |
| `unavailable` | The data needed to make the claim is absent | cannot say |
| `current-project scoped` | Bound to the active loaded project and not intended to generalize outside it | local only |

Rules:

- `generated` does not mean true
- `verified` must not be used unless the claim has actual proof support
- `speculative` must remain visibly tentative
- `deferred` must remain visibly non-authoritative
- `unavailable` must not be disguised as a low-confidence answer
- `current-project scoped` must not be used to imply global story truth

## Source-Label Rules

Every intelligence claim must expose where it came from.

Required source labels:

- deterministic project data
- loaded outline data
- loaded scene data
- current project metadata
- user-provided input
- generated inference
- verified observation
- deferred / unavailable

Rules:

- the source label must be visible in the UI or output copy wherever a claim is shown
- a generated conclusion must not be styled or phrased as verified
- missing evidence must be labeled unavailable, not guessed
- source labels must remain stable across the current project unless the evidence changes
- future intelligence surfaces must not hide provenance behind polished copy

## Trust / Confidence Language

Trust language must stay plain and explicit.

Rules:

- confidence language must be readable in the product text, not hidden in color alone
- high confidence does not equal verification
- low confidence must not be presented as authority
- no text may imply the system can judge writing quality end-to-end
- no text may imply the system has complete authorship understanding
- no text may imply the system knows the story better than the available evidence supports

## What Intelligence Surfaces May Read

Allowed reads are narrow and deterministic:

- loaded project identity
- loaded outline data
- loaded scene data
- deterministic counts and metadata
- user-entered content already present in the current project
- explicit project-scoped configuration needed for the contract

## What Intelligence Surfaces May Not Infer

Intelligence surfaces may not infer:

- final writing quality
- literary merit
- editorial success
- author readiness
- brand-new story completion
- hidden emotional truth as fact
- unverified narrative consequences
- silent story health or scoring without an explicit proof lane
- operator intent beyond the declared input contract

## Fallback And Empty-State Requirements

If an intelligence surface cannot prove what it is showing, it must fail honestly.

Requirements:

- show deferred or unavailable copy rather than invented intelligence
- keep placeholders visibly marked as placeholder or deferred
- do not use blank state as fake authority
- fallback behavior must never widen authority beyond the underlying proof class
- if data is missing, the surface must say so directly

## Classification Rules

Future intelligence output must choose one of the following states at presentation time:

- `generated`
- `verified`
- `speculative`
- `deferred`
- `unavailable`

Rules:

- `generated` is for machine-produced content that is not yet verified
- `verified` is for claims supported by a trusted source or explicit proof lane
- `speculative` is for inference that should remain visibly tentative
- `deferred` is for intentionally hidden or future-phase content
- `unavailable` is for missing evidence or missing data

## Readiness Rules For Future Intelligence UI

Before any future intelligence panel can be shown, it must have:

- an owner
- an explicit authority level
- a provenance source list
- trust and confidence wording
- fallback behavior
- a proof class
- a current-project scope statement
- a reason it cannot remain deferred

If a surface cannot satisfy those rules, it stays deferred.

## Non-Claims

This spec does not claim:

- output-quality validation is proven
- real-author-material workflow maturity is proven
- brand-new story-from-scratch workflow is proven
- AI intelligence is runtime-proven
- production readiness exists
- Split Command is the default experience
- detached-window or two-monitor behavior exists

## Relationship To Existing Governance

This spec supplements, and does not replace:

- `docs/specs/agent_orchestration_spec.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`

Phase numbers may shift only through the existing tracker, roadmap, and deferred-matrix process.

