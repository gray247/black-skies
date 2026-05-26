# Mixed-Authority Header Concentration - Pass 8

## Purpose

This document classifies the mixed-authority concentration in `WorkspaceHeader.tsx` and related header-adjacent controls by authority class, survivability, maintenance safety, redesign pressure, and implementation waste risk.

It is a reconstruction-planning artifact only. These classifications are not implementation authorization, not header redesign approval, not command/search expansion approval, and not approval for topology architecture or Story Unit persistence.

This pass distinguishes current implementation evidence from current planning authority. It also distinguishes surface survival from underlying contract survival.

## Source Documents / Code Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/roadmap_reconstruction_inventory_pass1.md`
- `docs/audits/phase_status_reconciliation_pass2.md`
- `docs/audits/phase20_27_survivability_classification_pass3.md`
- `docs/audits/phase20_24_maintenance_vs_redesign_pass4.md`
- `docs/audits/phase20_24_surface_subsystem_survivability_pass5.md`
- `docs/audits/highest_waste_risk_surface_families_pass6.md`
- `docs/audits/command_search_bypass_risk_pass7.md`
- `docs/audits/phase29/workspace_header_density_review.md`
- `docs/audits/phase29/workspace_header_disposition_review.md`
- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/mutation_authority_review.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/persistence_and_recovery_surface_review.md`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/BudgetIndicator.tsx`
- `app/renderer/components/BudgetMeter.tsx`
- `app/renderer/components/CompanionOverlay.tsx`
- `app/renderer/components/CritiqueModal.tsx`
- `app/renderer/components/PreflightModal.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/commands/commandRegistry.ts`
- `app/renderer/App.tsx`

## Authority Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Authoring Authority`: direct draft/workflow action closely tied to normal writing flow.
- `Authoring-Adjacent Mutation`: mutates authoring or related project state, but carries extra blast-radius or review risk beyond ordinary writing.
- `Suggestion / Advisory Authority`: interpretation, guidance, or critique that should not impersonate judgment or mutation authority.
- `Inspect / Verification Authority`: reads, checks, or proves state without being equivalent to mutation.
- `Artifact Output Authority`: emits output artifacts and can imply maturity or completion even when no project state changes.
- `Recovery / Repair Authority`: restore, reopen, backup, or repair-oriented exception-path authority.
- `Support Status Authority`: runtime support visibility such as service availability or recovery-required state.
- `Model / Cost Status Authority`: budget/model/cost visibility that is informative but not itself workflow authority.
- `Shell / Layout Authority`: shell, visibility, or layout concerns rather than narrative or authoring authority.
- `Dev/Test Authority`: hidden harness or diagnostics-only power that must remain fenced from product-visible workflow.
- `Historical Scaffolding`: useful historical surface framing, not a future authority anchor.
- `Redesign-Bound`: current placement/expression likely does not survive intact.
- `Maintenance-Only`: safe to preserve narrowly without widening authority or locking in current structure.

## Executive Findings

- `WorkspaceHeader.tsx` is the strongest live mixed-authority concentration point in the repo. It mixes authoring mutation, intelligence entry, output, safety/support access, and runtime status in one strip.
- The primary problem is not that every control is illegitimate. It is that different authority classes share one header placement and therefore borrow trust from each other.
- Generation is the narrowest candidate for primary-visible survival, but even it remains scope-sensitive and mutative enough to require clearer separation from critique, export, and safety tooling.
- Verification, restore, and snapshot creation are materially different authority classes and should not remain mentally compressed into one vague safety bucket.
- The most durable survivors are the underlying contracts: explicit generation scope, proof/verification discipline, recovery honesty, service health honesty, budget transparency, export capability, and mutation-confirmation boundaries.

## Header Control Inventory

### Generation controls

- Current role:
  - trigger draft generation from the header via a direct action button
- Authority class:
  - `Authoring-Adjacent Mutation`
- Mutation risk:
  - high
- Support/dev leakage risk:
  - low
- Intelligence authority risk:
  - medium, because model-backed generation can be overread as product judgment
- Workflow-state dependency:
  - high
- Survivability classification:
  - `Authoring Authority` candidate with reconstruction caution
- Redesign pressure:
  - medium
- Maintenance-safe value:
  - narrow fixes to button correctness, disabled-state truth, and preflight wiring
- Wasted-effort risk if extended now:
  - medium if kept narrow, high if broadened across more contexts or entry points

### Generation scope controls

- Current role:
  - choose `active-scene` versus `all-scenes` generation scope
- Authority class:
  - `Authoring-Adjacent Mutation`
- Mutation risk:
  - high, especially `all-scenes`
- Support/dev leakage risk:
  - low
- Intelligence authority risk:
  - medium
- Workflow-state dependency:
  - high
- Survivability classification:
  - `Maintenance-Only` for truthful scope labeling
  - `Redesign-Bound` for current header placement
- Redesign pressure:
  - high
- Maintenance-safe value:
  - preserve explicit scope honesty and disable logic
- Wasted-effort risk if extended now:
  - high, because blast-radius controls in a mixed-authority strip are easy to over-normalize

### Critique entry

- Current role:
  - launches critique workflow from the header
- Authority class:
  - `Suggestion / Advisory Authority`
- Mutation risk:
  - medium at the entry itself, but it routes toward higher-risk rewrite flows
- Support/dev leakage risk:
  - low
- Intelligence authority risk:
  - high
- Workflow-state dependency:
  - high
- Survivability classification:
  - `Redesign-Bound`
- Redesign pressure:
  - high
- Maintenance-safe value:
  - narrow correctness and disabled-state fixes only
- Wasted-effort risk if extended now:
  - high because critique entry inherits nearby rewrite/apply trust risk

### Rewrite/apply family behind critique

- Current role:
  - `CritiqueModal` allows rewrite generation and syncing the draft view to the saved rewrite
- Authority class:
  - `Suggestion / Advisory Authority` crossing into `Authoring-Adjacent Mutation`
- Mutation risk:
  - very high
- Support/dev leakage risk:
  - low
- Intelligence authority risk:
  - very high
- Workflow-state dependency:
  - high
- Survivability classification:
  - `Redesign-Bound`
- Redesign pressure:
  - very high
- Maintenance-safe value:
  - preserve provenance and review language honesty only
- Wasted-effort risk if extended now:
  - very high

### Export controls

- Current role:
  - choose export format and export manuscript from the header
- Authority class:
  - `Artifact Output Authority`
- Mutation risk:
  - low for project content, medium for user trust because it can imply maturity
- Support/dev leakage risk:
  - low
- Intelligence authority risk:
  - low
- Workflow-state dependency:
  - medium
- Survivability classification:
  - `Maintenance-Only` for capability
  - `Redesign-Bound` for current prominence
- Redesign pressure:
  - medium to high
- Maintenance-safe value:
  - preserve output correctness and format selection honesty
- Wasted-effort risk if extended now:
  - medium to high if treated as a primary authoring control

### Snapshot creation access

- Current role:
  - create snapshot directly from the header
- Authority class:
  - `Recovery / Repair Authority`
- Mutation risk:
  - medium to high because it mutates recovery/version-state
- Support/dev leakage risk:
  - medium
- Intelligence authority risk:
  - low
- Workflow-state dependency:
  - medium
- Survivability classification:
  - `Maintenance-Only` for capability
  - `Redesign-Bound` for header placement
- Redesign pressure:
  - high
- Maintenance-safe value:
  - preserve safe snapshot creation semantics
- Wasted-effort risk if extended now:
  - high because it reads too easily as an ordinary writing control

### Verification access

- Current role:
  - trigger snapshot verification directly from the header
- Authority class:
  - `Inspect / Verification Authority`
- Mutation risk:
  - low to medium, depending on report/state writing side effects
- Support/dev leakage risk:
  - medium
- Intelligence authority risk:
  - low
- Workflow-state dependency:
  - medium
- Survivability classification:
  - `Maintenance-Only`
  - `Redesign-Bound` for current placement
- Redesign pressure:
  - high
- Maintenance-safe value:
  - preserve proof/verification capability and honest status signaling
- Wasted-effort risk if extended now:
  - high if kept fused with snapshot and restore semantics

### Snapshots panel access

- Current role:
  - opens a panel containing verification, backup, and restore-capable controls
- Authority class:
  - `Recovery / Repair Authority`
- Mutation risk:
  - medium at the button, high downstream
- Support/dev leakage risk:
  - medium
- Intelligence authority risk:
  - low
- Workflow-state dependency:
  - medium
- Survivability classification:
  - `Maintenance-Only` for access to real safety tooling
  - `Redesign-Bound` for header placement
- Redesign pressure:
  - high
- Maintenance-safe value:
  - preserve access to existing support tooling
- Wasted-effort risk if extended now:
  - high if the header remains the normal gateway for recovery tooling

### Backup/restore access behind snapshots panel

- Current role:
  - `SnapshotsPanel` contains create-backup, restore-backup, restore-ZIP-copy, and reveal actions
- Authority class:
  - `Recovery / Repair Authority`
- Mutation risk:
  - very high
- Support/dev leakage risk:
  - medium
- Intelligence authority risk:
  - low
- Workflow-state dependency:
  - medium
- Survivability classification:
  - `Maintenance-Only` for support capability
  - `Redesign-Bound` for user-facing routing assumptions
- Redesign pressure:
  - high
- Maintenance-safe value:
  - preserve bounded restore behavior and honest offline restrictions
- Wasted-effort risk if extended now:
  - very high if blurred with authoring-adjacent controls

### Companion entry

- Current role:
  - toggles the Companion overlay from the header
- Authority class:
  - `Suggestion / Advisory Authority`
- Mutation risk:
  - low at entry, but indirect authority pressure is high
- Support/dev leakage risk:
  - medium because service/model status and offline behavior are nearby
- Intelligence authority risk:
  - high
- Workflow-state dependency:
  - high
- Survivability classification:
  - `Redesign-Bound`
- Redesign pressure:
  - high
- Maintenance-safe value:
  - narrow correctness and visibility-state repair only
- Wasted-effort risk if extended now:
  - very high

### Service health/status indicator

- Current role:
  - `ServiceStatusPill` shows service state and supports retry on offline states
- Authority class:
  - `Support Status Authority`
- Mutation risk:
  - low direct content mutation, indirect operational effect through retry
- Support/dev leakage risk:
  - high because it carries test-offline wording branches and diagnostics-adjacent meaning
- Intelligence authority risk:
  - low
- Workflow-state dependency:
  - medium
- Survivability classification:
  - `Maintenance-Only`
- Redesign pressure:
  - medium
- Maintenance-safe value:
  - preserve service health honesty and retry truth
- Wasted-effort risk if extended now:
  - medium if it remains support-only, high if it is overpromoted as workflow authority

### Model/budget/status indicators

- Current role:
  - `BudgetIndicator` and optional `BudgetMeter` surface budget health, remaining/spent amounts, and status messaging
- Authority class:
  - `Model / Cost Status Authority`
- Mutation risk:
  - none direct
- Support/dev leakage risk:
  - medium because it can drift into telemetry or diagnostics prominence
- Intelligence authority risk:
  - medium because model/cost status can imply operational approval or capability readiness
- Workflow-state dependency:
  - low to medium
- Survivability classification:
  - `Maintenance-Only`
  - `Redesign-Bound` for current header prominence
- Redesign pressure:
  - medium
- Maintenance-safe value:
  - preserve truthful budget/model transparency
- Wasted-effort risk if extended now:
  - medium

### Command-like header action concentration as a family

- Current role:
  - the header acts as a live orchestration strip for multiple unrelated control families
- Authority class:
  - mixed `Authoring Authority`, `Artifact Output Authority`, `Recovery / Repair Authority`, `Support Status Authority`, and `Suggestion / Advisory Authority`
- Mutation risk:
  - very high overall
- Support/dev leakage risk:
  - medium
- Intelligence authority risk:
  - high
- Workflow-state dependency:
  - very high
- Survivability classification:
  - `Redesign-Bound`
- Redesign pressure:
  - highest
- Maintenance-safe value:
  - narrow stability repairs only
- Wasted-effort risk if extended now:
  - highest

### Support/recovery-adjacent entry points

- Current role:
  - header snapshot, verify, and snapshots-panel entry route into support/recovery surfaces; recovery banner exists elsewhere as exception-path support
- Authority class:
  - mixed `Inspect / Verification Authority` and `Recovery / Repair Authority`
- Mutation risk:
  - high once restore paths are reached
- Support/dev leakage risk:
  - high
- Intelligence authority risk:
  - low
- Workflow-state dependency:
  - medium
- Survivability classification:
  - `Maintenance-Only` for truthful support access
  - `Redesign-Bound` for steady-state header co-location
- Redesign pressure:
  - high
- Maintenance-safe value:
  - preserve honest separation between ordinary workflow and exception-path recovery
- Wasted-effort risk if extended now:
  - high

### Dev/test or diagnostics-adjacent exposure

- Current role:
  - not directly a header control family, but header-adjacent status concepts sit near test-offline branches, `__testInsights`, and service-state injection seams elsewhere
- Authority class:
  - `Dev/Test Authority`
- Mutation risk:
  - high if leaked
- Support/dev leakage risk:
  - severe
- Intelligence authority risk:
  - low
- Workflow-state dependency:
  - low in product terms, which is exactly why leakage is dangerous
- Survivability classification:
  - `Dev/Test Authority`
  - `Historical Scaffolding` for any product-visible interpretation
- Redesign pressure:
  - n/a as product surface; must remain fenced
- Maintenance-safe value:
  - keep hidden and isolated
- Wasted-effort risk if extended now:
  - very high

## Highest Mixed-Authority Risks

- generation, critique, export, snapshot, verification, companion, and status indicators share one visible authority band
- critique entry sits too near rewrite/apply mutation pressure
- verification is compressed mentally toward restore and snapshot creation even though it is a different authority class
- support/recovery entry points are close enough to normal authoring controls to look routine
- budget/model/service indicators sit beside actionable controls and can inherit more workflow authority than they deserve

## Controls Likely Safe As Maintenance-Only

- service health/status indicator honesty
- budget/model transparency indicators
- export capability preservation
- snapshot capability preservation
- verification capability preservation
- snapshots-panel access correctness
- generation button disabled-state correctness
- generation scope truth labeling

## Controls Likely Redesign-Bound

- the header as one mixed-action strip
- critique entry in current proximity to rewrite/apply authority
- companion entry as a primary-visible peer of authoring controls
- snapshot/verification/snapshots-panel controls as steady-state header peers
- generation scope controls as current header-adjacent blast-radius management
- budget/service/model indicators in current prominence band

## Controls That Should Pause

- adding new header-visible command-like actions
- expanding companion/header intelligence entry
- expanding header-visible support/recovery tooling
- broadening generation entry duplication
- adding more mixed-authority status indicators to the same strip
- any header-level routing that collapses verification, restore, and snapshot creation together

## Controls That Should Be Split Into Separate Authority Families Later

- `verification` versus `restore` versus `snapshot creation`
  - verify is `Inspect / Verification Authority`
  - restore is `Recovery / Repair Authority`
  - snapshot creation is recovery/version-state creation authority
- `generation` versus `critique/rewrite/apply`
  - generation is expected authoring-adjacent mutation
  - critique/rewrite/apply couples suggestion and mutation in a higher-risk way
- `companion/advisory` versus command/search or ordinary workflow entry
  - companion is advisory/intelligence pressure, not a neutral command seam
- `status indicators` versus actionable controls
  - budget/service/model status should not borrow the trust of direct actions
- `support/recovery controls` versus normal authoring controls
  - recovery is not normal workflow and should not read as one more toolbar action

## Underlying Contracts That Survive Better Than Header Placement

- explicit generation target and scope
- preflight disclosure before consequential generation mutation
- critique provenance and rewrite provenance honesty
- proof/verification discipline
- recovery safety and explicit restore framing
- service health honesty and retry truth
- model/cost transparency
- export capability
- mutation confirmation and review boundaries

Pass 8 conclusion:
Most of the durable value is in the contracts underneath the header controls, not in the fact that they currently share one toolbar-like placement.

## Waste-Risk Ranking If Header Work Continues Now

1. Expanding the header as a mixed-action orchestration strip
2. Growing critique/companion prominence without resolving authority separation
3. Keeping verification, snapshot, and restore mentally compressed as one support bucket
4. Hardening generation scope and blast-radius controls as permanent header structure
5. Adding more status or telemetry signals beside primary actions
6. Treating export maturity as implied by current header presence

## Contradictions Found

- The header contains both relatively legitimate primary authoring entry and clearly non-primary safety/support/intelligence entry at the same visual level.
- Verification is an inspect/prove function, but current placement lets it borrow the visual weight of mutation-capable neighbors.
- Companion is advisory pressure, but its header button makes it look like a peer workflow pillar.
- Budget and service indicators are honest status signals, but their proximity to action controls risks turning telemetry into ambient workflow authority.

## Areas Too Ambiguous To Classify Reliably

- how much generation should remain primary-visible after future workflow-state canon stabilizes
- whether export ultimately belongs as contextual workflow output or advanced-only output tooling
- how visible support/recovery entry can remain without becoming ambient normal workflow
- whether model/cost indicators should survive as ordinary runtime status or become more contextual/support-oriented

## Questions For Orchestrator

- Should Reconstruction Pass 9 stay on the header and classify exact control relocatability by authority family, or move next to companion/critique as the highest remaining advisory-mutation pressure cluster?
- Should future reconstruction treat generation scope as part of authoring authority classification, or as a separate mutation-boundary family because of `all-scenes` blast radius?
- Should Pass 9 classify `service status` and `budget/model status` together as status authority, or separately because support truth and model/cost transparency carry different risks?

## Recommended Reconstruction Pass 9

Run a ninth reconstruction pass that classifies the advisory-mutation pressure cluster centered on critique, rewrite/apply, companion, and nearby status framing.

Pass 9 should:

- keep `surface survives` separate from `underlying contract survives`
- classify suggestion, review, and mutation boundaries more explicitly
- preserve the separation between verification authority and recovery mutation authority
- avoid redesigning the header while still clarifying what should not continue to accumulate there

Pass 9 should not rewrite the roadmap, redesign the header, authorize command/search expansion, authorize Story Unit persistence, or treat current placement as future workflow canon.
