# Command/Search Bypass Risk - Pass 7

## Purpose

This document classifies command/search subsystems by bypass risk, wasted-effort risk, workflow-state authority inheritance risk, and reconstruction survivability.

It is a reconstruction-planning artifact only. These classifications are not implementation authorization, not command/search redesign approval, and not approval for hidden command access, mutation-capable command routes, Story Unit persistence, or topology architecture.

This pass distinguishes current implementation evidence from current planning authority. Historical execution evidence is used here as reconstruction input, not as current authority by itself.

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
- `docs/audits/phase20/phase20_split_command_gui_foundation_plan.md`
- `docs/audits/phase20/phase20_closure_review.md`
- `docs/audits/phase21/phase21_command_center_panels_plan.md`
- `docs/audits/phase21/phase21_closure_review.md`
- `docs/audits/phase22/phase22_execution_plan.md`
- `docs/audits/phase23/phase23_execution_plan.md`
- `docs/audits/phase24/phase24_execution_plan.md`
- `docs/audits/phase29/tool_button_control_inventory.md`
- `docs/audits/phase29/workspace_header_density_review.md`
- `docs/audits/phase29/workspace_header_disposition_review.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/persistence_and_recovery_surface_review.md`
- `app/renderer/commands/commandRegistry.ts`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/CompanionOverlay.tsx`
- `app/renderer/App.tsx`
- `app/renderer/__tests__/CommandRegistry.test.ts`
- `app/renderer/__tests__/SplitCommandWorkspace.test.tsx`
- `app/tests/e2e/hotkeys-status.spec.ts`

## Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Maintenance-Safe`: safe to repair narrowly without widening command/search authority.
- `Maintenance-Safe With Caution`: repair-scoped work is probably safe, but the subsystem is authority-sensitive enough that maintenance can still harden the wrong model if it spreads.
- `Redesign-Bound`: the underlying need may survive, but the current command/search expression likely does not.
- `Governance-Blocked`: expansion depends on unresolved authority boundaries.
- `Workflow-Blocked`: expansion depends on unresolved workflow-state or workflow-shape decisions.
- `Reconstruction-Dependent`: potentially useful, but not safe as a future foundation until broader reconstruction decisions land.
- `Historical Scaffolding`: useful as historical staging or policy evidence, not as a live subsystem direction.
- `Unsafe To Expand`: additional feature growth is likely to waste effort or widen authority prematurely.
- `Unsafe To Continue`: the current form should not keep growing even if a nearby underlying contract survives.
- `Hidden/Internal Only`: must remain fenced away from product-visible command/search authority.

## Executive Findings

- The current repo does not contain a live command palette or live search surface. The implemented command/search risk is mostly a future-entry-seam risk already prefigured by metadata, header control duplication, and command-side shell organization.
- The highest bypass-risk subsystem is the latent `command registry -> future execution or palette route` seam because the registry already describes mutative commands, cross-zone visibility, confirmation needs, and model routes without a stable workflow-state authority inheritance model.
- The highest current runtime concentration of command-like power is not the registry. It is the `WorkspaceHeader`, which already clusters generation, critique, export, snapshot, verification, companion, and snapshots-panel access in one mixed-authority strip.
- `Search` is currently more dangerous as an implied future authority-compression seam than as a live implementation surface. No standalone search UI or execution path was found in current renderer code.
- Hidden/internal test event seams and recovery/support actions prove the bypass-risk thesis directly: there are already non-normal routes that can load projects, force service state, expose diagnostics, or reach restore-capable areas. Those routes must stay fenced and must not leak into a future command/search layer.

## Command/Search Subsystem Inventory

### Command registry metadata seam

- Current role:
  - declarative metadata for possible command entries including category, allowed zones, mutation status, confirmation requirement, model route, risk level, and result type
- Authority risk:
  - high, because it already encodes cross-zone eligibility and mutative capability
- Bypass risk:
  - very high if an execution layer is attached before workflow-state inheritance is classified
- Mutation risk:
  - high, because entries already include `draft.generateActiveScene`, `draft.generateAllScenes`, `rewrite.run`, and `snapshot.create`
- Workflow-state inheritance risk:
  - very high, because `allowedZones` and `preferredZone` are not the same as workflow-state authority
- Support/dev leakage risk:
  - medium now, high later if support or dev/test actions are ever added to the same registry family
- Wasted-effort risk if extended now:
  - very high
- Survivability classification:
  - `Governance-Blocked`
  - `Workflow-Blocked`
  - `Unsafe To Expand`

### Global Tools metadata panel

- Current role:
  - exposes registry counts as metadata only inside Split Command
- Authority risk:
  - medium, because it normalizes the idea of global command reach even while stating no command palette is active
- Bypass risk:
  - medium now, high if upgraded into executable entry
- Mutation risk:
  - low at runtime today because no execution path is active
- Workflow-state inheritance risk:
  - medium, because it frames command reach without workflow-state gating
- Support/dev leakage risk:
  - low now
- Wasted-effort risk if extended now:
  - high
- Survivability classification:
  - `Historical Scaffolding`
  - `Maintenance-Safe With Caution`
  - `Unsafe To Expand`

### Command palette concept

- Current role:
  - deferred concept only; current workspace explicitly says no command palette or execution path is active
- Authority risk:
  - very high as a future entry seam
- Bypass risk:
  - very high, because a palette could route around surface boundaries and workflow-state distinctions
- Mutation risk:
  - very high if palette execution is attached to mutative registry entries
- Workflow-state inheritance risk:
  - unresolved and high
- Support/dev leakage risk:
  - high if hidden, support-only, or dev-only routes become searchable alongside ordinary user actions
- Wasted-effort risk if extended now:
  - highest
- Survivability classification:
  - `Governance-Blocked`
  - `Workflow-Blocked`
  - `Unsafe To Continue`

### Search behavior concept

- Current role:
  - no standalone renderer search surface was found; current code usage of `search` is URL/query plumbing rather than product search behavior
- Authority risk:
  - high, because governance already classifies search as non-neutral
- Bypass risk:
  - very high if search is later used to expose hidden or cross-authority actions
- Mutation risk:
  - unclear in code today, high in future if search becomes an execution path
- Workflow-state inheritance risk:
  - very high, because a read-like surface can silently inherit or ignore the wrong state model
- Support/dev leakage risk:
  - high in any future unified search across product, support, and dev/test actions
- Wasted-effort risk if extended now:
  - very high
- Survivability classification:
  - `Governance-Blocked`
  - `Reconstruction-Dependent`
  - `Unsafe To Expand`

### Story Navigation command-side selection seam

- Current role:
  - authoritative scene-selection surface inside the command-side panel stack
- Authority risk:
  - medium, because it is a real navigation authority seam
- Bypass risk:
  - medium, because it can become over-privileged if command-side prominence stands in for workflow authority
- Mutation risk:
  - low direct content mutation risk
- Workflow-state inheritance risk:
  - high, because current command-side anchoring may not survive future workflow-state canon
- Support/dev leakage risk:
  - low
- Wasted-effort risk if extended now:
  - medium to high if command-side anchoring is hardened
- Survivability classification:
  - `Maintenance-Safe With Caution` for truth/order repairs
  - `Redesign-Bound` for command-side anchoring

### Workspace Header mixed-action strip

- Current role:
  - current runtime command-like concentration point for generation, critique, export, companion, snapshot, verification, and snapshots-panel access
- Authority risk:
  - very high, because many authority classes appear at one visual level
- Bypass risk:
  - high, because it already compresses authoring, intelligence, support, and output actions into one strip
- Mutation risk:
  - very high because generation, snapshot creation, and downstream rewrite/apply families are adjacent
- Workflow-state inheritance risk:
  - high, because the strip is organized by current shell convenience rather than settled workflow-state authority
- Support/dev leakage risk:
  - medium, because support and diagnostics-adjacent status concepts already sit close to ordinary actions
- Wasted-effort risk if extended now:
  - very high
- Survivability classification:
  - `Workflow-Blocked`
  - `Redesign-Bound`
  - `Unsafe To Expand`

### Mutation-capable command family

- Current role:
  - latent command family represented in registry metadata and mirrored by visible runtime actions such as generation and snapshot creation
- Authority risk:
  - very high
- Bypass risk:
  - very high if unified command access skips review, scope, or confirmation boundaries
- Mutation risk:
  - highest
- Workflow-state inheritance risk:
  - very high
- Support/dev leakage risk:
  - medium now, high if restore or support commands ever join the same family
- Wasted-effort risk if extended now:
  - highest
- Survivability classification:
  - `Governance-Blocked`
  - `Workflow-Blocked`
  - `Unsafe To Continue`

### Support/recovery command-adjacent family

- Current role:
  - recovery banner actions plus snapshots panel access to create, verify, backup, restore, and reveal workflows
- Authority risk:
  - high, because support/recovery actions are exceptional and high impact
- Bypass risk:
  - high if command/search later exposes these as ordinary actions
- Mutation risk:
  - high, especially restore flows
- Workflow-state inheritance risk:
  - medium to high, because support/recovery paths should not inherit normal authoring assumptions
- Support/dev leakage risk:
  - high, because diagnostics and restore sit near user-visible support paths already
- Wasted-effort risk if extended now:
  - high
- Survivability classification:
  - `Maintenance-Safe With Caution` for bounded support truth
  - `Governance-Blocked` for broader command/search exposure

### Dev/test internal command/event seams

- Current role:
  - hidden/internal test-only routes such as `test:set-project`, `test:service-status`, `test:select-scene`, `__testInsights.setServiceStatus`, and `__dev.overrideServices`
- Authority risk:
  - very high if ever user-exposed
- Bypass risk:
  - highest, because these routes bypass ordinary product workflow entirely
- Mutation risk:
  - high for project loading and service-state manipulation
- Workflow-state inheritance risk:
  - effectively none in the product sense, which is exactly why the leakage risk is severe
- Support/dev leakage risk:
  - highest
- Wasted-effort risk if extended now:
  - very high if mixed into product-visible command/search
- Survivability classification:
  - `Hidden/Internal Only`
  - `Unsafe To Continue` for any user-facing exposure

## Highest Bypass-Risk Subsystems

1. Command palette concept
   - would unify discovery and execution before workflow-state authority inheritance is settled
2. Dev/test internal command/event seams
   - already bypass product workflow and must stay fenced
3. Mutation-capable command family
   - combines high-impact actions with future command entry pressure
4. Search behavior concept
   - can look read-only while widening hidden authority
5. Support/recovery command-adjacent family
   - can normalize restore/diagnostics/verification as ordinary commandable work
6. Workspace Header mixed-action strip
   - already compresses multiple authority classes and could become the de facto command model

## Highest Wasted-Effort-Risk Areas If Extended Now

1. Building a real command palette on top of the current registry
2. Attaching executable routing to the registry before workflow-state authority inheritance is classified
3. Building unified search across user, support, and hidden/internal actions
4. Expanding header-visible mixed-authority controls instead of separating their classes
5. Exposing snapshot, restore, verification, or diagnostics flows through command-style convenience entry points
6. Hardening Story Navigation as a command-side anchor before workflow-state canon stabilizes
7. Adding command-side intelligence, companion, or Story Unit presentation commands beyond current shell-visible seams

## Maintenance-Safe Command/Search Work

- bug fixes that preserve current behavior without widening authority
- crash fixes
- broken shortcut or focus fixes that do not add new command reach
- diagnostics/logging for command/search evidence when fenced and non-authoritative
- renderer/test coverage for registry metadata honesty, non-execution guarantees, and visibility boundaries
- read-only label/copy honesty
- preserving explicit statements that no command palette or execution path is active
- narrow truth/order fixes for Story Navigation without increasing command-side prominence

## Command/Search Work That Should Pause

- command palette implementation
- search UI implementation
- registry execution hooks
- mutation-capable command routing
- hidden command exposure
- unified command/search across product and support flows
- command-driven reorganization of workflow/navigation
- command-side intelligence entry growth
- Story Unit presentation commands beyond current shell-visible seams

## Hidden Command Exposure Risks

- A future palette or search surface could expose actions that are currently hidden behind support, test, or debug-only seams.
- The current registry normalizes command identity and zone eligibility without yet classifying which classes of action should never become ambiently discoverable.
- `Global Tools Metadata` is honest today, but it also keeps the conceptual door open for future hidden-to-visible promotion if not re-governed.
- Test-event seams and service overrides prove that hidden/internal capability already exists in the codebase; command/search must not become the accidental promotion path.

## Mutation-Capable Command Risks

- Registry metadata already models mutative commands for draft generation, rewrite, and snapshot creation.
- `draft.generateAllScenes` is especially risky because it compresses broad mutation scope into a single future command seam.
- Rewrite-capable entry points are high-risk because critique and rewrite belong to different trust classes even when they share a family.
- Snapshot and restore-adjacent actions are not ordinary writing commands and should not be normalized into convenience command entry.

## Dev/Test Command Leakage Risks

- `test:set-project` can load projects outside ordinary product interaction.
- `test:service-status` and `__testInsights.setServiceStatus(...)` can alter insight/service state evidence.
- `test:select-scene` can move scene-selection state outside ordinary user flow.
- `__dev.overrideServices(...)` and related harness/test infrastructure confirm the repo already has command-like hidden control seams that must remain hidden/internal only.

## Support/Recovery Command Leakage Risks

- Recovery banner actions include restore, reopen, and diagnostics access and are necessary only in exceptional paths.
- Snapshots panel access leads toward backup, verification, restore, and reveal flows that are safety/support workflows, not ordinary authoring commands.
- Verification and diagnostics are especially easy to over-promote because they can look read-only while still widening operational authority.
- If support/recovery actions become searchable or palette-addressable too early, command/search would become a hidden second application for maintenance and exception handling.

## Workflow-State Authority Inheritance Findings

- Current implementation uses `allowedZones` and `preferredZone`, but those are spatial or shell hints, not settled workflow-state authority.
- The command registry therefore pre-classifies where commands might appear without proving when they are authority-valid.
- Story Navigation currently carries `data-panel-authority="authoritative"` inside the command-side stack, which is truthful for scene selection but still risky as a long-term workflow anchor.
- The current header and Split Command shell organize command-like actions by surface grouping, not by ratified workflow-state inheritance.
- Pass 7 conclusion: command/search currently lacks a reliable workflow-state inheritance model and should not expand until one exists.

## Underlying Contracts That Survive Better Than Current Command/Search Surface

- Surface survives:
  - some truthful scene selection
  - some metadata honesty
  - some bounded support visibility
- Underlying contract survives:
  - explicit mutation labeling
  - confirmation requirements for high-risk actions
  - deterministic truth labeling
  - no-execution-by-default registry discipline
  - provenance/trust skepticism when companion/intelligence seams are nearby
  - no-hidden-promotion logic for support, dev/test, and detached infrastructure

Current Pass 7 conclusion:
The underlying contract that command/search must not silently widen authority is more durable than any current command/search surface or future palette/search shape suggested by the Phase 20-24 shell.

## Contradictions Found

- The repo already treats the command registry as metadata-only, while also encoding mutative, cross-zone, and model-routed entries that could become high-power execution routes later.
- The command-side shell insists on deterministic honesty, while still using command-side organization that reconstruction treats as workflow-sensitive rather than neutral.
- The Workspace Header currently acts like a live mixed-authority command strip even though reconstruction says these authority classes should separate before future workflow approval.
- Recovery/support actions are legitimately user-visible in exceptional paths, but their proximity to ordinary controls keeps creating pressure toward ambient commandability.

## Areas Too Ambiguous To Classify Reliably

- whether future search should remain conceptually bundled with command palette behavior or separated into a stricter read-only discovery family
- how much Story Navigation survives if command-side prominence is later reduced sharply
- whether some verification actions eventually belong in contextual support rather than advanced-only handling
- whether the current companion entry should later be treated as command-adjacent, intelligence-adjacent, or fully separate from command/search classification

## Questions For Orchestrator

- Should Reconstruction Pass 8 stay inside command/search and classify `registry metadata`, `header action strip`, and `support/recovery entry points` as separate waste-risk families, or should it move outward to mixed-authority header concentration more broadly?
- Should future reconstruction treat `search` as a distinct family from `command palette` by default even though no live search UI currently exists?
- Should command/search-related survivability work later classify `verification` separately from `restore` and `snapshot creation`, or keep them together under one support/recovery command family?

## Recommended Reconstruction Pass 8

Run a focused eighth reconstruction pass that classifies the current mixed-authority entry concentration around the `WorkspaceHeader` and adjacent support/intelligence entry points.

Pass 8 should:

- separate visible header actions by authority class
- classify which entry points are true primary authoring controls versus contextual/support/intelligence access points
- keep `surface survives` separate from `underlying contract survives`
- preserve the rule that command/search must not become a hidden second application

Pass 8 should not rewrite the roadmap, authorize command/search expansion, authorize hidden command access, authorize Story Unit persistence, or expand Story Unit analysis beyond shell-visible presentation seams.

## Orchestrator Rulings After Pass 7

- Reconstruction Pass 8 should move outward to mixed-authority header concentration.
- Reason: the strongest live command-like risk is `WorkspaceHeader.tsx`, not a nonexistent command palette or search UI.
- Future reconstruction should treat `search` as distinct from command palette by default.
- Search retrieves; command executes or routes.
- Merging search and command behavior is a bypass-risk trap unless later governance explicitly approves it.
- Verification should later be classified separately from restore and snapshot creation.
- Verification is inspect/prove authority.
- Restore is project-state mutation authority.
- Snapshot creation is recovery/version-state creation authority.
- These should not be collapsed into one vague safety/tooling bucket.

## Pass 8 Direction

Roadmap Reconstruction Pass 8 should classify mixed-authority header concentration, especially `WorkspaceHeader.tsx` and related header-adjacent controls, by authority class, survivability, maintenance safety, redesign pressure, and implementation waste risk.

Pass 8 should pay special attention to:

- generation controls
- critique/rewrite/apply entry
- export controls
- snapshot/backup/restore access
- companion entry
- service/model/budget/status indicators
- command-like header actions
- support/recovery-adjacent entry points
