# Stage 13 Surface and UI Artifact Inventory

## 1. Purpose and scope
This inventory records the current Writing Surface, Command Center, Companion, workspace, navigation, status, and related UI artifacts that later Stage 13 passes may need to assess.

It is an evidence inventory only. It classifies current runtime structure, ownership risks, coupling, scene-first assumptions, and legacy UI remnants, but it does not authorize redesign, UI edits, implementation, runtime correction, archive work, cleanup, deletion, or Stage 14 work.

## 2. Repository and Pass 7 checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Pass 7 checkpoint: `0935672` `docs(product): inventory desktop packaging and installation boundaries`

## 3. Inspection limits
This pass inspected:
- current product-system authority records
- renderer surface components and shared renderer state files
- UI-facing IPC and runtime bridge artifacts when needed to verify visible claims
- scene, workspace, navigation, status, companion, and recovery surfaces

This pass did not inspect or classify:
- UI redesign work
- implementation corrections
- provider/model/queue/cost execution
- archive, cleanup, deletion, or salvage execution
- Stage 14 authorization

## 4. Writing Surface artifacts

| Path | Apparent role | Owning surface | Shared or duplicated state | Truth-mutation exposure | Operational burden | Current doctrine affected | Evidence quality | Later verification need | Final disposition pending |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `app/renderer/App.tsx` | Top-level renderer coordinator for the active workspace | Writing Surface and Command Center shell orchestration | High duplication: project, scene, service, recovery, split-command, and test-mode state are all coordinated here | High: scene selection, draft hydration, export, snapshot, critique, and companion actions all pass through this coordinator | Very high; this is the main orchestration surface for most user-visible flows | Writing Surface sovereignty, Command Center non-gating, advisory AI, scene-first drift | High | Break down by later surface/panel or workflow pass if needed | Pending |
| `app/renderer/components/ProjectHome.tsx` | Project landing, load, recent projects, scene sidebar, draft editor, diagnostics | Writing Surface home / project entry | Stores recent project list, last project path, active project, active scene, draft preview, diagnostics, and session-truth view state | High: project load, scene selection, draft editing, project creation, and recovery posture all originate here | High; combines project switching, draft preview, and diagnostics in one view | Project loading authority, scene-first assumptions, restored-copy labeling, session truth | High | Data/load and identity pass already exists; later UI refinement may inspect layout burden | Pending |
| `app/renderer/components/WorkspaceHeader.tsx` | Main action bar with Companion, generate, critique, export, snapshot, verify, and snapshots actions | Writing Surface header / shared action strip | Shared action gating across service status, budget state, export format, generation scope, snapshots, and companion open state | High: exposes mutation-facing actions and can gate or un-gate them | High; operational burden is concentrated in a single command strip | Writing Surface burden, Command Center overlap, package/export surface, proof-versus-readiness boundary | High | Later workflow pass may split action groups if needed | Pending |
| `app/renderer/components/CompanionOverlay.tsx` | Companion guidance and scene insights overlay | Companion surfaced from Writing Surface | Shares active scene, draft text, project, rubric, analytics, batch critique state, and service status with the main shell | Moderate to high: can trigger batch critique and advisory runs, but not manuscript acceptance directly | High; it mixes advisory text, analytics, batch review, and rubric editing in one overlay | Companion advisory status, AI output non-authority, scene-centric guidance | High | Later UI pass may separate analytics, critique, and advisory panels if needed | Pending |
| `app/renderer/components/workspace/SplitCommandWorkspace.tsx` | Split-command shell wrapper that embeds a writing studio and command center zone | Combined Writing Surface / Command Center experimental shell | Duplicates project, outline, active scene, and command registry views across two zones | Moderate: scene selection can be forwarded through the shell; actions remain bounded to loaded data surfaces | Very high; it is a shell-level coordinator with both sides visible at once | Writing Surface vs Command Center distinction, scene-first panels, metadata-only panels | High | Later follow-up may split shell responsibilities if this experiment remains active | Pending |
| `app/renderer/components/docking/DockWorkspace.tsx` | Dock layout, floating pane, preset, and restore manager | Shared workspace / dock host | Stores layout tree, hidden panes, floating panes, relocation state, focus state, and preset state | Moderate: layout persistence and floating-window open/close are UI-state mutations, not manuscript mutations | High; complex layout and persistence orchestration | Layout ownership, floating window behavior, per-project state separation | High | Later verification may inspect whether layout state stays isolated from project truth | Pending |
| `app/renderer/components/workspace/StoryNavigationPanel.tsx` | Story outline and scene list navigation | Writing Surface-adjacent navigation | Shares outline units, active scene, and project outline structure | Moderate: selecting a scene mutates active scene focus and downstream draft context | Medium; navigation and content selection are closely coupled | Scene-first UI assumptions, outline/scene hierarchy, active scene authority | High | Later UI pass may examine whether navigation stays presentation-only | Pending |
| `app/renderer/components/WizardPanel.tsx` | Wizard-style outline bootstrap and lock flow | Project setup / bootstrap UI | Stores wizard draft state, step locks, lock requests, and snapshot references in local storage | High: locking steps creates snapshots and can drive outline build | High; it is a setup workflow with nested state and explicit lock semantics | Project bootstrap, outline-first scaffolding, scene/chapter-first assumptions | High | Later UI routing may separate setup workflow from steady-state writing | Pending |
| `app/renderer/components/ServiceHealthBanner.tsx` | Backend-service status banner | Status / operational warning surface | Shares service status, port availability, and retry state | Low to moderate: status only, but it can influence retry and user perception of readiness | Medium; simple but high-visibility | Health/status certainty, service availability, test freeze behavior | High | Later pass may verify status language against backend reliability claims | Pending |
| `app/renderer/components/RecoveryBanner.tsx` | Crash recovery banner | Recovery / restart surface | Shares snapshot label, timestamp, and recovery action state | Moderate: can trigger restore, reopen, and diagnostics navigation | Medium; visible interruption surface with recovery actions | Recovery posture, current-vs-restored distinction, witness preservation | High | Later pass may review restore wording if recovery semantics change | Pending |
| `app/renderer/components/ToastStack.tsx` | Ephemeral notifications | Shared status / feedback layer | Pulls from global toast queue | Low: notifications are advisory only | Medium; can amplify certainty if wording drifts | Warning-state visibility, non-authoritative feedback | Medium | Later review only if toast copy becomes misleading | Pending |
| `app/renderer/components/PreflightModal.tsx` | Generate preflight dialog | Mutation-facing modal | Shared with generation scope, project state, and service bridge | High: prepares a generate action and can present estimates before mutation | Medium | Acceptance-facing action, preflight gating, budget/provisioning posture | Medium | Later workflow pass may inspect preflight/result wording | Pending |
| `app/renderer/components/CritiqueModal.tsx` | Critique and rewrite dialog | Mutation-facing modal / Companion-adjacent | Shares active scene, critique state, rewrite state, and provenance context | High: rewrite application and critique actions are mutation-adjacent | High | AI output non-authority, accepted-vs-suggested distinction | Medium | Later pass may inspect rewrite acceptance surfaces if needed | Pending |
| `app/renderer/components/SnapshotsPanel.tsx` | Snapshot listing and verification panel | Recovery / evidence surface | Shares project id, project path, service status, and verification state | Moderate: can request create/list/verify actions but should stay evidence-oriented | Medium | Snapshot evidence vs current truth, last-witness concerns | Medium | Later pass may inspect evidence wording and verification claims | Pending |

## 5. Command Center artifacts

| Path | Apparent role | Owning surface | Shared or duplicated state | Truth-mutation exposure | Operational burden | Current doctrine affected | Evidence quality | Later verification need | Final disposition pending |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `app/renderer/components/workspace/SplitCommandWorkspace.tsx` | Experimental command-center shell and writing wrapper | Command Center + Writing Surface split shell | Duplicate outline, active scene, and project context are shown in both zones | Moderate: mostly display and scene selection, but shell state can influence focus and layout | Very high | Command Center must stay support-only; Writing Surface sovereignty must remain intact | High | Later review may split the shell into smaller bounded artifacts if this path persists | Pending |
| `app/renderer/components/WorkspaceHeader.tsx` | Top-level action surface for generate/critique/export/snapshot/verify | Command Center-like action strip in the main workspace | Shared service, budget, export, and companion state | High: exposes mutation-facing actions | High | Command Center support actions versus writing authority | High | Later pass may separate action groups by owner if needed | Pending |
| `app/renderer/components/docking/DockWorkspace.tsx` | Docked command panes, floating panes, and layout presets | Command Center / workspace host | Layout persistence, floating windows, hidden panes, relocation, and focus state are shared across many panes | Moderate | High | Surface-local layout ownership, no truth ownership by layout | High | Later verification may inspect whether dock state is only presentation-state | Pending |
| `app/renderer/components/AnalyticsDashboard.tsx` | Story-insights and analytics dashboard | Command Center / advisory analytics | Likely shares project, scenes, and service data with Companion and status views | Moderate: may present advisory certainty if labels drift | High | Advisory analytics must not become truth authority | Medium | Later pass may inspect analytics copy and certainty labels | Pending |
| `app/renderer/components/Corkboard.tsx` | Board-style organizer for scene or note grouping | Command Center / organization surface | Likely duplicates scene or note grouping state from other views | Moderate | Medium to high | Scene grouping is support-only, not manuscript foundation | Medium | Later pass may inspect whether the board duplicates durable structure | Pending |
| `app/renderer/components/RelationshipGraph.tsx` | Relationship visualization | Command Center / graph surface | Likely mirrors accepted entities and links from project state | Moderate | Medium to high | Graphs are derived support views, not truth owners | Medium | Later pass may inspect graph ownership boundaries | Pending |
| `app/renderer/components/WorkspaceHeader.tsx` | Global command strip that also lives over the writing area | Command Center-like shared action strip | Shares companion, export, snapshot, verify, budget, and service status state | High | High | Command Center support boundary, operational burden on writing flow | High | Later pass may split or regroup actions if burden remains high | Pending |
| `app/renderer/components/CompanionOverlay.tsx` | Advisory helper overlay with analytics and batch critique | Companion inside the writing shell | Shares scene, draft, rubric, analytics, batch results, and service status state | High for advisory actions, low for direct truth mutation | High | Companion must remain optional, advisory, and non-owning | High | Later pass may inspect whether the overlay mixes too many responsibilities | Pending |
| `app/renderer/components/ToastStack.tsx` | Shared feedback channel | Command Center / global feedback layer | Reuses a global toast queue across surfaces | Low | Medium | Advisory warning language must not become proof of readiness | Medium | Later pass only if toast copy becomes misleading | Pending |

## 6. Companion artifacts
- `app/renderer/components/CompanionOverlay.tsx`
  - Current role: advisory scene-insight overlay and batch critique panel.
  - Owning surface: Companion, surfaced from Writing Surface.
  - Shared state: active scene, active draft, project, rubric, analytics, batch critique state, service status.
  - Truth-mutation exposure: advisory suggestions and batch critique are visible here, but the overlay must not become manuscript authority.
  - Operational burden: high, because it mixes analytics, review, rubric editing, and action triggers in one panel.
  - Current doctrine affected: Companion optionality, AI advisory status, non-authoritative output, and source-vs-summary discipline.

- `app/renderer/components/WorkspaceHeader.tsx`
  - Current role: exposes Companion toggle and related actions.
  - Owning surface: Writing Surface header, with Command Center-like action density.
  - Shared state: companion open state, service status, budget state, export state, snapshot state, verification state.
  - Truth-mutation exposure: indirect, via companion opening and adjacent action entry points.

- `docs/product_systems/companion.md`
  - Governing doctrine: Companion is advisory, optional, non-owning, and not truth owner.
  - Current risk: the runtime overlay is broader and more operationally dense than the doctrine’s advisory framing.

## 7. Shared workspace and navigation artifacts
- `app/renderer/components/docking/DockWorkspace.tsx`
  - Shared layout host for docked panels and floating panes.
  - Owns layout tree state, hidden pane state, focus state, and floating-pane relocation state.
  - It is a presentation-state coordinator, not a manuscript owner.

- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
  - Shared shell between writing and command surfaces.
  - Duplicates outline, scene, and project context across the two zones.
  - It risks collapsing “workspace wrapper” into “surface owner” if read too aggressively.

- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
  - Scene list and story-unit navigation.
  - It treats scenes and chapters as visible navigation structure, but scene selection is still a support action, not a foundation claim.

- `app/renderer/components/ProjectHome.tsx`
  - Project open/recent/list/welcome surface and draft preview.
  - It also owns the scene sidebar and draft editor launch point, making it the most coupled navigation and content surface in steady-state mode.

- `app/renderer/utils/splitCommandShellState.ts`
  - Local storage for split-command shell mode and project path.
  - It persists UI posture, not manuscript truth.

## 8. Status, warning, and blocking-message surfaces
- `app/renderer/components/ServiceHealthBanner.tsx`
  - Shows backend-service availability and retry affordances.
  - Risk: service availability can be mistaken for product readiness if the wording is read too broadly.

- `app/renderer/components/RecoveryBanner.tsx`
  - Shows crash recovery availability and offers restore/reopen/diagnostics actions.
  - Risk: a recovery prompt can be mistaken for restored truth unless the banner remains explicit about current-vs-restored state.

- `app/renderer/components/ToastStack.tsx`
  - Ephemeral warning/confirmation channel.
  - Risk: toast text can overstate certainty even when the underlying state is provisional.

- `app/renderer/components/WorkspaceHeader.tsx`
  - Shares service, budget, and export/snapshot/verify status inline with action buttons.
  - Risk: a dense status strip can look like an operational control center instead of a writing surface header.

- `app/renderer/components/ProjectHome.tsx`
  - Displays loader issues, session truth, and recovery-related state.
  - Risk: diagnostics and session-truth blocks can read like authority claims rather than evidence summaries.

## 9. Project-loading and project-switching UI
- `app/renderer/components/ProjectHome.tsx`
  - Project open/create/recent list logic lives here.
  - Scene sidebar, draft preview, and project details are all bound to the loaded project.
  - It stores recent projects and last project path in local storage, which is UI convenience, not project authority.
  - It labels restored copies explicitly, which is correct and necessary.

- `app/main/projectLoaderIpc.ts`
  - Project loading and bootstrap authority live in the main process.
  - The UI is dependent on this, but it does not own it.

- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
  - Scene selection happens via scene list buttons.
  - It displays acts, chapters, and scenes as navigation structure, which is acceptable as long as scene lists remain presentation and not base truth.

- `app/renderer/components/WizardPanel.tsx`
  - Bootstrap and outline creation flow.
  - It treats project ID and scene/chapter structure as setup inputs, not as final manuscript authority.

## 10. Truth-mutation and acceptance-facing actions
- `WorkspaceHeader`
  - Generate, critique, export, snapshot, verify, and snapshots actions are all reachable from one place.
  - This is the main mutation-adjacent action strip in the current shell.

- `ProjectHome`
  - Create project, open project, select scene, and edit draft all originate here.
  - Scene selection and draft editing are the main author-facing truth-touching flows in the home view.

- `PreflightModal`
  - Acts as an explicit gate before generation.
  - It is acceptance-facing and should stay visibly distinct from manuscript truth.

- `CritiqueModal`
  - Acts as an acceptance/rewrite surface.
  - It must not collapse advisory critique into authored truth by appearance alone.

- `WizardPanel`
  - Can lock steps and trigger snapshot creation, then build an outline.
  - It is a setup/approval workflow, not a general-purpose truth owner.

- `CompanionOverlay`
  - Can trigger batch critique and advisory insight generation.
  - It is not permitted to accept truth silently.

## 11. Scene/chapter-first UI assumptions
Observed scene/chapter-first pressure appears in:
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
- `app/renderer/components/WizardPanel.tsx`
- `app/renderer/components/CompanionOverlay.tsx`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`

Observed pattern:
- scenes are the dominant navigation unit in the active workspace
- chapter and act structure is shown as supporting hierarchy
- story-unit language is present in the split-command shell and navigation panels
- scene lists and scene metadata are treated as primary control affordances

Risk:
- the UI can drift back toward scene-first or outline-first gravity unless the Writing Surface remains the sovereign drafting surface and Story Unit/outline language remains optional and support-only.

## 12. Surface ownership and sovereignty risks
- `ProjectHome` is the strongest risk surface because it mixes project entry, recents, diagnostics, recovery, draft editing, and scene selection.
- `WorkspaceHeader` is the strongest action-strip risk because it centralizes generate, critique, export, snapshot, verify, and companion access.
- `CompanionOverlay` is the strongest advisory-to-authority risk because it combines analytics, rubric editing, and batch critique in one overlay.
- `SplitCommandWorkspace` is the strongest shell risk because it shows the Writing Studio and Command Center together and can make the support layer look like a sibling owner.
- `DockWorkspace` is the strongest layout-state risk because it owns floating and hidden pane posture across a project.

## 13. Operational burden on the Writing Surface
The Writing Surface carries a substantial operational load in the current shell:
- it hosts the header actions,
- it hosts the project home and scene editor,
- it may host the Companion overlay,
- it hosts recovery and service warnings,
- it can be wrapped by the split-command shell.

That burden is acceptable only if the writing area remains the sovereign drafting area and the supporting controls stay visibly optional and non-gating.

## 14. Cross-surface coupling and duplicated state
Observed duplicated or shared state:
- `ProjectHome` and `StoryNavigationPanel` both display scene and outline structure.
- `ProjectHome` and `CompanionOverlay` both read active scene and project data.
- `WorkspaceHeader` and `CompanionOverlay` both expose service-adjacent and review-adjacent state.
- `SplitCommandWorkspace` duplicates project and outline context between the command zone and writing zone.
- `DockWorkspace` and `ProjectHome` both participate in project-specific layout and recovery posture.

Risk:
- duplicated display state can be mistaken for duplicated authority.

## 15. Legacy or abandoned UI evidence
- `app/main/preload.ts` still exposes several test and harness helpers, which is expected in this repo but remains a legacy-risk surface if treated as production UI doctrine.
- `app/renderer/components/WizardPanel.tsx` still uses a step-lock workflow and `wizard` vocabulary, which reads like an older setup model rather than the final steady-state writing model.
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx` is explicitly experimental and labels some panels as deferred or future surfaces.
- `docs/product_systems/system_interaction_map.md` still contains rough doctrine language about old surfaces and future-only items, which is evidence, not runtime doctrine.

## 16. Accessibility and responsive-layout observations
Observed from the component structure:
- major buttons and controls use explicit labels, `aria-label`, `aria-pressed`, `aria-expanded`, `aria-controls`, `role`, and `aria-live` where appropriate
- the scene list, story list, and status banners expose semantic containers and readable labels
- the dock workspace includes keyboard-focus and hidden-pane affordances
- the split-command shell includes dedicated writing and command zones with separate headings

Observed risk:
- the current runtime packs a lot of status, action, and navigation chrome into the same view hierarchy, so responsive behavior must keep labels and action rows readable without collapsing the writing area into a dashboard.

## 17. Unknowns and later routing
Unknowns that remain visible:
- whether the split-command shell is intended to remain a long-lived product mode or only a transitional experiment
- whether Companion should remain a single overlay or split into narrower panels
- whether `ProjectHome` should remain the single project entry surface or be broken down later
- whether the header action strip should be redistributed into more bounded controls
- whether the dock and split-command layouts should stay coupled to the main shell

Later routing:
- provider/model/queue/cost/hardware inventory is the next bounded pass candidate once this surface map is closed.
- further UI refinement should stay inventory-only until later authority explicitly authorizes implementation.

## 18. Stop and reopening conditions
Stop conditions for this pass:
- if a UI artifact is found to own manuscript truth, not just display or navigation
- if Companion or Command Center is found to have become required, authoritative, or gating
- if a scene-first or outline-first artifact is found to override Writing Surface sovereignty
- if a status surface is making unsupported claims of readiness, release, or certainty
- if the current shell is hiding an implementation or authority decision inside UI wording

Reopening condition:
- any material Stage 12 contradiction must be routed to the appropriate Stage 12 reopening path rather than corrected inside this inventory.

## 19. Recommended next bounded pass
Recommended next pass: **Provider, model, queue, telemetry, cache, cost, and hardware inventory**.

Reason:
- the current surface map shows many AI-adjacent, service-adjacent, and status-adjacent control points.
- the remaining high-risk boundary is how those controls connect to provider/model selection, queue execution, telemetry, cache behavior, cost, and hardware pressure.
- that follow-up can remain inventory-only and stay separate from implementation or release work.

