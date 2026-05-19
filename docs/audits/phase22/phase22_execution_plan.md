# Phase 22 Execution Plan - Writing Studio / Immersive Writing Surface

## Phase Objective
Phase 22 is the first real Writing Studio phase. The goal is to make the writing-side workspace feel like a useful, deterministic working surface while preserving the Phase 20 shell foundation and the Phase 21 Command Center foundation.

This phase is about construction, integration, and workflow continuity. It is not about proving creative quality, AI usefulness, or production readiness.

## Explicit Non-Goals
Phase 22 does not:

- add AI Companion or contextual intelligence
- add narrative-health, emotional, tension, foreshadow, or conflict-analysis claims
- add true two-monitor or detached-window workflow
- migrate Split Command to default
- change the stable GUI default path
- claim output-quality validation
- claim real author-material workflow maturity
- claim a complete start-from-scratch authoring workflow
- rewrite the roadmap system or orchestration model

## Stable GUI Protection Rules
The stable GUI remains sacred.

- default-off behavior must remain intact
- stable GUI launch must remain the canonical startup path
- no writing-side change may poison stable GUI state
- no writing-side change may depend on Split Command-only persistence
- any issue that threatens default launch, restart, or project loading requires immediate validation

## Split Command Protection Rules
Split Command remains experimental and flag-gated.

- Phase 22 work must not make Split Command the default experience
- shell-owned state must remain scoped to the Split Command path
- writing-side features must not leak mode-specific state back into stable GUI
- fallback behavior must remain honest and local to the affected mode
- any change that could affect shell mode identity or persistence must be tested before commit

## Writing-Side Authority Boundaries
Phase 22 may work on the writing side only within deterministic, current-project scope.

Allowed authority:

- current project outline/scene context
- editor-side UI state that is local to the writing surface
- deterministic view helpers and layout affordances
- current-project writing tools and indicators

Not allowed:

- hidden intelligence or speculative analysis
- cross-project persistence without explicit scope
- shell-owned authority leaks
- fake “smart” states that are not supported by real runtime truth

## Planned Implementation Batches

### 22A - Writing Studio Contract and Surface Inventory
Define the writing-side surface contract, identify which current-project data is deterministic, and map the writing surface boundaries before changing UI behavior.

### 22B - Deterministic Writing-Side Surfaces
Add or refine current-project writing surfaces such as outline access, notes, quick insert, writing tools, and saved-state indicators when they are clearly deterministic and not intelligence-driven.

### 22C - Focus and Density Cleanup
Make the writing side feel primary in the one-window shell. Improve spacing, focus cues, and local density so the editor remains the working surface rather than the command stack.

### 22D - Placeholder Cleanup and Honest Labels
Remove or demote placeholder content that could read like real intelligence or production-grade authoring support. Any deferred surface must be clearly labeled as deferred or unavailable.

### 22E - Validation and Closure Review
Prove that the writing-side additions behave safely in both stable GUI and Split Command modes, and that no new authority claims or mode leaks were introduced.

## Validation Cadence Per Batch

### Deferred Validation Is Acceptable For
- docs-only scope clarifications
- label and copy adjustments that do not change mode behavior
- purely visual demotion or honest placeholder wording
- deterministic layout tuning that does not touch persistence or startup behavior

### Immediate Validation Is Required For
- stable GUI default behavior
- Split Command activation and flag gating
- persistence or invalidation changes
- launcher or preload paths
- project loading or save/export behavior
- any authority or proof wording that could overclaim runtime truth

## High-Risk Touch Zones
Treat these as high risk for Phase 22:

- `app/renderer/App.tsx`
- `app/renderer/components/workspace/*`
- writing-side persistence helpers
- project load/reload paths
- save/export paths
- preload / IPC contracts
- any label or state that could be mistaken for AI or completed authoring capability

## Human Smoke Requirements
Human smoke in Phase 22 means build/runtime/workflow verification only.

The operator should confirm:

- the writing-side surfaces exist
- the surfaces launch without obvious runtime errors
- the stable GUI remains unaffected
- the Split Command path remains flag-gated
- obvious visual regressions are not present

Human smoke does not prove:

- literary quality
- AI usefulness
- final writing quality
- complete authoring readiness
- real-author workflow maturity
- output-quality validity

## Harness / Runtime Proof Requirements

### Runtime Proof
- the writing-side feature launches and behaves without obvious runtime errors
- default-off stable GUI remains intact
- Split Command remains experimental and isolated
- project-scoped behavior remains consistent

### Harness Proof
- renderer tests for deterministic writing-side surfaces
- App-level tests for default-off safety and flag-on activation
- targeted Playwright smoke only when visible workflow behavior changes
- no overclaim that test success proves creative quality

## Stop / Escalation Triggers
Stop and escalate if:

- stable GUI risk appears
- proof claims exceed evidence
- the same failure repeats during validation
- a batch requires architecture outside Phase 22 scope
- runtime and harness evidence conflict
- fake AI or intelligence would be introduced
- phase ownership becomes unclear

## Deferred Carry-Forward Items
Keep these explicitly deferred and tracked:

- AI Companion and contextual intelligence
- two-monitor / detached-window workflow
- output-quality validation
- creative-quality validation
- real author-material workflow maturity
- brand-new story-from-scratch workflow
- long-session and large-project hardening
- any future orchestration automation beyond the current semi-manual model

## Definition of Done
Phase 22 is complete when:

- the writing-side workspace is meaningfully improved
- the added surfaces are deterministic and current-project scoped
- stable GUI default behavior remains unchanged
- Split Command remains experimental and flag-gated
- no AI/intelligence or two-monitor claims landed
- placeholders are honest
- proof remains narrow and evidence-backed
- output-quality claims are not made

## Explicit Non-Claims
Phase 22 does not claim:

- output-quality validation is proven
- real author-material workflow is proven
- brand-new story-from-scratch workflow is proven
- AI intelligence is runtime-proven
- production readiness exists
- a new roadmap system exists

## Canary Warning Classification
The serial single-launch canary instability is a warning and deferred risk, not trusted runtime-green proof.

Phase 22 planning may continue, but any runtime claim that depends on single-launch serial canary health must be treated cautiously until the canary is stabilized or reclassified.
