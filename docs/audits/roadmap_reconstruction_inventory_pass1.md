# Roadmap Reconstruction Inventory - Pass 1

## Purpose

This document is the first roadmap reconstruction inventory after the committed Phase R2 governance and survivability artifacts.

It is a planning input only. It does not rewrite the roadmap, does not renumber phases, does not activate Phase 32, does not promote Story Unit persistence, does not promote topology architecture, and does not make final implementation sequencing decisions.

Where evidence conflicts, this pass records the conflict instead of resolving it silently.

## Source Documents Inspected

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/roadmap.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/audits/phase28_31/phase28_31_execution_plan.md`
- `docs/audits/phase31/phase31_roadmap_rewrite_and_phase_renumbering.md`
- `docs/phases/phase_log.md`
- `docs/phases/phase12_runtime_audit.md`
- `docs/phases/phase13_audit_trust_validation_plan.md`
- `docs/audits/phase20/phase20_closure_review.md`
- `docs/audits/phase21/phase21_closure_review.md`
- `docs/audits/phase22/phase22_execution_plan.md`
- `docs/audits/phase23/phase23_execution_plan.md`
- `docs/audits/phase25/phase25_closure_review.md`
- `docs/audits/phase26/phase26_closure_review.md`
- `docs/audits/phase27/phase27_execution_plan.md`

## Current Known Phase List

Known phase families currently visible in the docs are:

- Legacy runtime/status phases in `docs/roadmap.md`: `P7` through `P11`
- Editorial/runtime follow-on phases visible through tracker and phase docs: `Phase 12` through `Phase 19`
- Split Command / workflow-foundation sequence visible through tracker and audit docs: `Phase 20` through `Phase 27`
- Correction / realignment block: `Phase 28` through `Phase 31`
- Shifted provisional future buckets: `Phase 32` through `Phase 40`
- Phase R2 artifacts exist as planning/governance artifacts, not numbered roadmap phases

Assumption:
Pass 1 treats the accepted roadmap-governance docs plus the tracker as stronger evidence for post-Phase-13 sequencing than the older `docs/roadmap.md` live summary.

## Orchestrator Rulings After Pass 1

- `docs/roadmap.md` is no longer treated as current live status authority. It is now legacy roadmap authority / historical active-plan artifact until reconciled or superseded.
- Current live planning authority for reconstruction is the tracker plus committed Phase R2 artifacts.
- `Candidate Phase 32` should no longer be used as a numbered-phase label because `Phase 32` is already occupied in the shifted provisional family.
- Replace that pressure concept with the label `Structural Governance Pressure Candidate`.
- The pressure remains tracked, but it is not an active phase, not roadmap law, and not implementation authorization.
- Phase 20-27 should be treated as historical completed/partial execution reality and survivability evidence, not active planning structure.
- Phase 14-19 governance spine should be preserved as historical roadmap authority, but demoted behind newer Phase 20-31 execution/correction evidence.

### Terminology Update

- Prefer `Structural Governance Pressure Candidate` over `Candidate Phase 32` in reconstruction-era docs.
- If older docs mention `Candidate Phase 32`, treat it as historical wording unless explicitly re-ratified.

### Do Not Promote

- Do not use this patch to rewrite the roadmap.
- Do not renumber phases.
- Do not activate any new phase.
- Do not treat `Structural Governance Pressure Candidate` as implementation authorization.

## Phase Status Inventory

| Phase | Working status | Basis / notes |
| --- | --- | --- |
| P7 | Complete | Explicitly `Complete` in `docs/roadmap.md`. |
| P8 | Partial | Explicitly `Partial` in `docs/roadmap.md`; docking/layout-heavy shell work is now governance-sensitive and partially transitional. |
| P9 | Partial | Explicitly `Partial` in `docs/roadmap.md`; analytics routes exist, but full visualization productization remains open and governance-sensitive. |
| P10 | Complete with Deferreds | `Complete` in `docs/roadmap.md` with deferred accessibility-toggle and voice-note productization notes. |
| P11 | Partial | Explicitly `Partial` in `docs/roadmap.md`; plugin/agent surfaces exist behind flags and remain incomplete. |
| Phase 12 | Complete with Deferreds | Tracker says Phase 12 editorial workflow foundation closed after Pass 10, with later carry-forward wording/test concerns preserved. |
| Phase 13 | Complete with Deferreds | Tracker says Phase 13 is closed as audit, trust validation, handoff, and governance-readiness only; authority closure moved onward. |
| Phase 14 | Complete with Deferreds | Tracker records `Closed with exceptions`; authority semantics closed for Phase 14 scope, but later owners still exist. |
| Phase 15 | Complete with Deferreds | Tracker records `Closed with exceptions`; restore/backup hardening complete for the scoped lane with deferred GUI/hygiene/perf debt. |
| Phase 16 | Complete with Deferreds | Tracker records `Closed with exceptions`; harness governance closed with explicit exceptions. |
| Phase 17 | Complete with Deferreds | Tracker records implementation and closure review completed with deferred items preserved. |
| Phase 18 | Complete with Deferreds | Tracker records `Closed with exceptions` / `Pass with warnings`; no promotion justified. |
| Phase 19 | Draft | Owned in the accepted master plan, but no clear tracker evidence of execution/closure in the inspected sources. |
| Phase 20 | Complete with Deferreds | `docs/audits/phase20/phase20_closure_review.md` says `Closed with exceptions`; shell foundation only. |
| Phase 21 | Complete with Deferreds | `docs/audits/phase21/phase21_closure_review.md` says `Closed with exceptions`; deterministic Command Center foundation only. |
| Phase 22 | Complete with Deferreds | Tracker records Phase 22A-22D implementation and 22E closure review with scope kept narrow. |
| Phase 23 | Complete with Deferreds | Tracker records closure review completed with exceptions; intelligence-governance foundation only. |
| Phase 24 | Complete with Deferreds | Tracker records Phase 24 closed as documented two-monitor authority/fallback/routing/proof closure, with major future gaps still deferred. |
| Phase 25 | Complete with Deferreds | `docs/audits/phase25/phase25_closure_review.md` says complete with deferred carry-forward. |
| Phase 26 | Complete with Deferreds | `docs/audits/phase26/phase26_closure_review.md` says complete with deferred carry-forward. |
| Phase 27 | Complete with Deferreds | Tracker and `phase27_validation_checklist.md` indicate closure after smoke remediation, while broader GUI debt remains deferred. |
| Phase 28 | Complete | `phase28_31_execution_plan.md` says Phase 28 is closed and input evidence for Phase 29. |
| Phase 29 | Complete with Deferreds | Correction-block docs show conditional/final closure-readiness with unresolved carry-forward into Phase 30/31; best inventory label is complete with deferreds rather than active. |
| Phase 30 | Partial | Strong governance/spec artifacts exist, but workflow/authority direction remains unresolved and non-final. |
| Phase 31 | Draft | `docs/audits/phase31/phase31_roadmap_rewrite_and_phase_renumbering.md` is still `Status: Draft`; roadmap rewrite not finalized. |
| Phase 32 | Draft | Shifted provisional future bucket only; separate structural-governance pressure must not reuse Phase 32 numbering. |
| Phase 33 | Draft | Shifted provisional future bucket only. |
| Phase 34 | Draft | Shifted provisional future bucket only. |
| Phase 35 | Draft | Shifted provisional future bucket only. |
| Phase 36 | Draft | Shifted provisional future bucket only. |
| Phase 37 | Draft | Shifted provisional future bucket only. |
| Phase 38 | Draft | Shifted provisional future bucket only. |
| Phase 39 | Draft | Shifted provisional future bucket only. |
| Phase 40 | Draft | Shifted provisional future bucket only. |

## Existing Roadmap Items Likely To Survive

- tests, audits, trackers, and documentation discipline
- crash fixes, dependency fixes, diagnostics, logs, and support reports
- basic export capability as a real product area
- support/recovery as a legitimate product need, even if authority presentation changes later
- dev/test tooling as a fenced, non-user-facing capability
- runtime/session continuity and recovery as a meaningful future roadmap area
- memory/context as a future roadmap area, though governance-blocked for now
- narrative tooling and collaboration/governance as future thematic areas

## Existing Roadmap Items Likely Transitional

- current GUI stabilization
- current pane/layout work
- docking/layout persistence as currently expressed
- Split Command shell framing and one-window Command Center framing
- toolbar-heavy or header-heavy control distribution
- present shell-specific writing-studio surfaces
- temporary bridge systems and migration-path surfaces

## Existing Roadmap Items Safe Maintenance Only

- implementation stabilization work
- patch/fix work
- diagnostics hardening
- safe layout reset/fallback behavior
- narrow export maintenance
- narrow support/reporting maintenance
- harness and truth-lane maintenance that does not overclaim authority

## Existing Roadmap Items Blocked By Governance

- command/search systems with mutation authority
- intelligence/analytics surfaces that present judgment or prescriptive authority
- Story Unit canonical systems
- memory/context systems that imply persistent authority
- topology/graph productization
- orchestration-space expansion
- any future phase work that smuggles in `Structural Governance Pressure Candidate` as active

## Existing Roadmap Items Blocked By Workflow

- final GUI workflow decisions
- workflow/navigation systems that depend on unresolved workflow-state canon
- toolbar prominence/layout decisions that depend on focused-drafting versus structure-review boundaries
- qualitative review tooling where review/apply boundaries are still unresolved
- final command palette behavior

## Existing Roadmap Items Likely Obsolete Or Superseded Candidate

- old `Phase 20+` placeholder language as active execution planning
- pre-correction `Phase 28+` bucket numbering as current numbering
- any assumption that the current GUI shell is final product direction
- any assumption that the older `docs/roadmap.md` phase family alone can describe current post-Phase-27 planning truth
- older `Candidate Phase 32` wording as an active numbered-phase concept

Important conflict:
The accepted master plan assigns `Phase 32-40` to shifted provisional future buckets, but older correction-block and Phase R2 wording still use `Candidate Phase 32` as pressure tracking for a possible inserted phase. Under the orchestrator ruling, reconstruction-era docs should replace that older wording with `Structural Governance Pressure Candidate` and should not treat it as active numbering.

## Missing Roadmap Areas Discovered

- an explicit reconstruction-era inventory that reconciles legacy `P7-P11` status authority with post-Phase-13 and correction-block planning
- a canonical status map for `Phase 12-27` in one place; today this is scattered across tracker and audit docs
- a clear historical-versus-current label for `docs/roadmap.md`
- a canonical rule for how `Structural Governance Pressure Candidate` should be represented now that `Phase 32` is already occupied in the shifted provisional family
- a reconstruction pass that classifies what from `Phase 20-27` is survivable foundation versus transitional shell debt

## Dependency Order Observations

- Existing accepted docs still preserve a strong dependency order through `Phase 14` to `Phase 19`.
- `Phase 20-27` represent later execution reality that now coexists awkwardly with that older accepted structure.
- `Phase 28-31` correction-block logic says new build work should not resume until the correction block is accepted and Phase 31 resolves numbering/gates.
- Phase R2 governance artifacts now add another planning constraint:
  workflow-authority reconciliation must settle safe lanes, blocked lanes, and reopening conditions before future implementation lanes resume.
- A likely reconstruction dependency chain now looks like:
  legacy roadmap authority audit -> phase/status inventory -> survivability mapping -> gap/dependency mapping -> roadmap rewrite pass

This is an observation only, not final sequencing.

## Items That Should NOT Consume Implementation Effort Yet

- final GUI workflow
- command mutation
- intelligence authority
- Story Unit persistence
- topology architecture
- topology/graph productization
- orchestration-space expansion
- memory mutation
- phase-activation behavior for `Structural Governance Pressure Candidate`
- any work that interprets mockups or experimental shell behavior as approved product direction

## Questions For Orchestrator

- Which later reconstruction artifact should explicitly replace `docs/roadmap.md` as the current live status surface once reconciliation is complete?
- Should a future reconstruction pass add warning headers or historical labels directly to older docs that still use `Candidate Phase 32` wording?
- Should `Phase 20-27` be inventoried next by survivability category as one grouped execution family or phase-by-phase?

## Recommended Next Reconstruction Pass

Run a second reconstruction pass that:

- classifies `Phase 20-27` by survivability category against the Phase R2 ledger
- records the `docs/roadmap.md` versus accepted-roadmap-artifact conflict explicitly
- proposes a historical/current/provisional label model for roadmap artifacts
- propagates the `Structural Governance Pressure Candidate` terminology update without activating it
- prepares the minimum evidence packet needed for an actual roadmap rewrite pass later

Pass 1 should not attempt to solve those issues yet.
