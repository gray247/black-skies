# Phase 28 Planning / Roadmap Authority Audit

Status: Draft
Date: 2026-05-21

## Purpose

Phase 28 audits which docs are acting as authority, which are historical, which are stale, and which are only future-direction evidence.

This phase is documentation-only. It does not change runtime behavior, product code, or phase execution order by itself.

## Correction Block Handoff

Phase 28 identifies authority. Phase 29 inventories what survives. Phase 30 defines the future workflow. Phase 31 rewrites the roadmap from that evidence.

Candidate Phase 32, if Phase 28-31 evidence proves it is required, is `Story Unit Data Model + Qualitative Evaluation Foundation`. It should resolve Story Unit persistence and model-quality evaluation before any GUI rebuild. It is not inserted permanently by Phase 28.

## Evidence Inputs

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap.md`
- `docs/specs/current_state.md`
- `docs/specs/workflow_spine.md`
- `docs/specs/editorial_workflow_contract.md`
- `docs/specs/design_system_v1.md`
- `docs/phases/phase11b_implementation_plan.md`
- `docs/phases/phase12_editorial_workflow_plan.md`
- `docs/audits/phase27/phase27_execution_plan.md`
- `docs/audits/phase27/phase27_validation_checklist.md`
- operator-provided GUI revamp report used as product-direction evidence only

## Authority Classification

### Current authority docs

| Document | Why it is authority |
| --- | --- |
| `docs/BLACK_SKIES_FIX_TRACKER.md` | Canonical operational status, blockers, closures, watch-items, and current phase notes. |
| `docs/roadmap/master_phase_allocation_plan.md` | Canonical future phase sequencing, gates, and renumbering authority. |
| `docs/roadmap/deferred_work_matrix.md` | Canonical deferred/backlog allocation authority. |
| `docs/specs/current_state.md` | Canonical current runtime reference. |
| `docs/specs/workflow_spine.md` | Canonical workflow spine contract. |
| `docs/specs/editorial_workflow_contract.md` | Canonical editorial workflow terminology and authority contract. |

### Historical docs

| Document | Why it is historical |
| --- | --- |
| `docs/phases/phase11b_implementation_plan.md` | Historical Split Command foundation roadmap; useful for provenance, not present-tense product authority. |
| `docs/phases/phase12_editorial_workflow_plan.md` | Closed editorial workflow planning record. |
| `docs/audits/phase27/phase27_execution_plan.md` | Phase 27 planning record, now superseded by Phase 27 closure evidence. |
| `docs/audits/phase27/phase27_validation_checklist.md` | Closure evidence and smoke record for Phase 27, not a live product authority. |
| `docs/archive/*` | Archived historical material by definition. |

### Stale claims to relabel

- Any doc that still describes `Phase 27` as "in planning" is stale after closure and must be rewritten or labeled historical.
- Any doc that still describes `Phase 28+` as the old provisional bucket family is stale after the new correction block is inserted.
- Any doc that treats the current shell as the final writer-focused editor is stale unless it is explicitly marked as future-facing design intent.
- Any doc that implies product-direction concepts are runtime truth is stale and should be relabeled as design intent or future-only.

### Future-only / fantasy claims

- Dual-monitor narrative command system claims remain future-direction evidence until explicitly implemented.
- Story Constellation, emotion systems, and other sexy visual systems remain future-only unless a phase explicitly authorizes them.
- Placeholder command surfaces should not be mistaken for shipped product capability.
- Attached GUI revamp report content is product-direction evidence only, not runtime authority.

### Conflicts to reconcile

- `docs/roadmap/master_phase_allocation_plan.md` needed renumbering because its old post-27 bucket labels no longer matched the Phase 28 correction block.
- `docs/roadmap.md` is a high-level status spine and should not be read as the post-27 sequencing authority.
- `docs/gui/README.md` is an index to GUI docs, not a substitute for the workflow and roadmap authority stack.

### Required labels

- `authority`
- `historical`
- `stale claim`
- `future only`
- `needs rewrite`
- `warning`

## Required Outputs

- authority map for current roadmap, tracker, spec, GUI, audit, and phase docs
- historical-doc list
- stale-claim list
- future-only / product-direction evidence list
- conflict register with owning doc for each conflict
- rewrite/archive/warning-label recommendations
- tracker note recording the audit result

## Acceptance Gates

- every inspected doc is classified as authority, historical, stale, future-only, or warning/needs-rewrite
- conflicts are assigned an owning document instead of left as ambiguous cross-doc disagreement
- runtime-truth docs are not overridden by planning docs
- product-direction evidence is not promoted to runtime truth
- Phase 29 has enough input to inventory real risks and surviving surfaces

## Stop Conditions

- a supposed authority doc contradicts runtime truth and cannot be safely labeled without operator decision
- a missing artifact is necessary to classify a current authority claim
- a doc claims shipped behavior that cannot be verified from current runtime/code/test evidence
- the audit starts requiring product code changes

## Handoff Requirements

- Phase 29 receives the authority map, stale-claim list, and conflict register
- any future-only GUI/intelligence claims are carried forward as candidate inventory items, not as accepted product scope
- unresolved authority questions remain visible rather than being collapsed into Phase 29 assumptions

## Validation Requirements

- docs-only diff check
- repository hygiene check for tracked files
- targeted doc grep for stale `Phase 27` and old `Phase 28+` claims where relevant
- no runtime tests unless runtime files are changed, which is out of scope

## Unresolved-Question Register

| Question | Current handling |
| --- | --- |
| Should the operator-provided GUI revamp report become a repo-tracked reference artifact? | Unresolved; treat as product-direction evidence only until explicitly added. |
| Do older GUI docs need warning headers or archive moves? | Forward to Phase 29/31 after classification. |
| Which doc owns final Story Unit governance before implementation? | Candidate Phase 32 unless Phase 30 fully resolves it. |

## Exit Criteria

- The authority/historical/stale/future-only split is recorded in the tracker.
- The roadmap phase sequence has a clear insertion point for the correction block.
- No runtime code is changed by this phase.
