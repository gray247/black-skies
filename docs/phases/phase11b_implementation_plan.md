# Phase 11B Implementation Plan

Status: Living roadmap
Last Reviewed: 2026-05-08
Canonical Design Source: `docs/specs/design_system_v1.md`

## Implementation Baseline

Locked implementation decisions:
- The experimental Split Command shell is exposed only through the disabled-by-default `ui.experimental_split_command_workspace` runtime flag.
- The current Phase 11A shell remains the production default.
- The first shell wraps the existing stable workspace body inside Writing Studio instead of rewriting editor, preview, generation, critique, rewrite, snapshot, or export flows.
- Story Unit v1 is read-only and scene-derived only; it does not include loose notes/fragments and does not infer `drafted` from non-empty draft text.
- The active outline compatibility view is named `main` and derives from the current loaded outline without persistence or migration.
- Command registry metadata is descriptive only. It must not introduce execution, dispatch, middleware, routing, or plugin behavior.

Dev/test enablement note:
- The flag is defined in `app/shared/config/runtime.ts` as `UiConfig.experimentalSplitCommandWorkspace`.
- Runtime YAML uses `ui.experimental_split_command_workspace: true`.
- Renderer tests may enable it through `window.__runtimeConfigOverride`.
- The flag is experimental and must remain off by default until Split Command parity is explicitly closed.

Current progress snapshot:
- Completed passes: Pass 0, Pass 1, Pass 2, Pass 3, Pass 4, and Pass 5.
- Completed hardening lane: CI diagnostic hardening / preflight contract fix.
- This document is the canonical living roadmap for Phase 11B until closure.

Pass 2 parity guard:
- Renderer coverage now verifies flag-off default shell rendering, flag-on Split Command rendering, Writing Studio wrapping the stable workspace body, Command Center placeholder labeling, generation/preflight calls through the wrapped ProjectHome path, and Story Unit derivation without project mutation.

Pass 3 Story Navigation wrapper:
- Command Center Story Navigation now renders real read-only Story Unit v1 / active outline compatibility data instead of a generic placeholder.
- It shows the Main outline label, total unit count, ordered scene-derived units, active-scene marker, preview text where available, `placed` state chips, and `scene` source indicators.
- Click-to-select is deferred. Selection currently flows through `ProjectHome` and `App`; exposing it to Command Center should wait for an explicit shared selection interface rather than adding ad hoc shell plumbing.
- Other Command Center panels remain honest placeholders and must not show fake analytics, gap detection, AI output, or executable command palette behavior.

Pass 4 shared scene-selection interface:
- Split Command now receives the App-owned selection interface: `activeSceneId` plus `onSelectScene(sceneId)`.
- Story Navigation items are keyboard-accessible buttons that call the shared App selection path.
- `ProjectHome` receives a one-way `requestedActiveSceneId` sync prop so the stable Writing Studio surface follows App-owned selections without adding a competing selection store.
- Generation/preflight continues to use App-owned `activeSceneId`, so selecting a Story Navigation item changes the active-scene generation target through the same authority path.
- No selection state is persisted, no backend calls changed, and no project file format changed.

Pass 5 flagged-shell workflow surface smoke:
- Renderer smoke now covers critique entry through the wrapped Split Command shell.
- Renderer smoke now covers snapshot and export header actions through the wrapped Split Command shell.
- These tests assert the existing service call paths only; they do not add new UI, change workflow behavior, or widen shell responsibilities.
- Remaining deferred workflow parity items should stay small and renderer-level unless a real integration gap appears.

## 1. Current GUI Reality

The current renderer is a stable Electron workspace rooted in `app/renderer/App.tsx`. `App` owns the active project summary, active scene state, generation scope, preflight/generation flow, critique/rewrite state, snapshot/export actions, recovery state, and the dock workspace composition.

The shipping shell is still the current docked workspace, not the Phase 11B Split Command model. `DockWorkspace` renders the pane tree from `app/shared/ipc/layout.ts`, persists layout per project through `app/main/layoutIpc.ts`, supports reset, clamps offscreen floating windows, skips stale floating restores, and drops unknown floating pane ids. The shared pane registry already carries `scope` metadata for current panes.

`ProjectHome` is the current project surface. It loads projects, selects active scenes, renders outline/project summary, shows Draft Preview, displays Scene Metadata, and emits active-scene/draft changes back to `App`. Draft Preview is read-oriented at the workflow level, but `ProjectHome` also contains the current draft editing surface.

Current outline/editor/preview surfaces are scene-first. `LoadedProject.outline` contains `outline_id`, acts, chapters, and scene summaries. `LoadedProject.scenes` contains scene metadata. Drafts are keyed by scene id. The draft synthesizer and Companion guidance already consume scene metadata such as `purpose`, `emotion_tag`, `word_target`, `beats`, and narrative fields.

Styling is mostly `app/renderer/styles/app.css` plus stable test CSS files and a CodeMirror theme in `DraftEditor.tsx`. There are scattered CSS variables such as `--control-radius`, `--color-warning`, and `--color-danger`, but there is no formal design-token module or generated token pipeline.

Reuse:
- Existing `App` workflow state, service bridges, preflight/generation flow, critique/rewrite flow, snapshots, export, recovery, and layout IPC.
- Existing `ProjectHome`, `WorkspaceHeader`, `DockWorkspace`, `Corkboard`, `AnalyticsDashboard`, `CompanionOverlay`, `CritiqueModal`, and `SnapshotsPanel` as wrapped surfaces.
- Existing renderer tests and Playwright startup/smoke diagnostics as contract gates.

Do not touch yet:
- Backend rewrite persistence.
- Project file schema.
- Generation payload shape.
- Layout persistence schema beyond a planned shell-mode extension.
- Floating-window/dual-monitor OS behavior.
- Memory, plugin, local LLM, or visualization systems.

## 2. Design System Integration Plan

There is no complete runtime token system today. The current CSS uses direct colors, direct spacing, and a few isolated custom properties.

Token location later:
- Start with CSS variables in a renderer stylesheet, likely `app/renderer/styles/design-system.css`, imported before `app.css`.
- Add TypeScript constants only after runtime components need token metadata for logic, tests, or registry-driven rendering.
- Do not start with JSON generation. There is no existing token build pipeline, so JSON would add tooling before value.

Safest first runtime token slice:
- Color variables for app/workspace/panel/text/accent/semantic values from `design_system_v1.md`.
- Spacing variables for base unit, zone gap, panel gap, panel padding, and card padding.
- Radius/depth variables only where new Phase 11B shell styles consume them.

Existing style conflicts:
- `app.css` currently uses slate/indigo-heavy direct values.
- Stable test CSS files intentionally normalize rendering for tests and visual stability.
- CodeMirror has its own inline extension theme.

Keep docs-only until later:
- Full typography system.
- Motion language.
- Dual-monitor rules.
- Story Constellation visual language.
- Full command palette styling.
- Accessibility modes beyond preserving current focus and contrast behavior.

## 3. Workspace Shell Strategy

Chosen strategy: Option A, add a new experimental Phase 11B workspace shell behind a flag/route.

This should be implemented as a small parallel shell that wraps current surfaces, not a refactor of the existing shell. The flag should default off. Candidate gates are a runtime config flag, test-mode flag, or query/dev seam, with production continuing to render the current stable shell.

Likely files:
- `app/renderer/App.tsx`
- New shell components under `app/renderer/components/workspace/`
- `app/renderer/styles/design-system.css`
- `app/renderer/styles/app.css` only for import and minimal integration
- Renderer tests for shell selection and unchanged legacy behavior

Risk level: medium. It touches the top-level render path, but the flag keeps the current Phase 11A workspace as the default.

Rollback strategy:
- Disable or remove the Phase 11B flag path.
- Leave existing `DockWorkspace`, `ProjectHome`, and workflow state untouched.
- Keep all data and backend calls flowing through current `App` handlers.

Test strategy:
- Renderer tests for flag off rendering the current shell.
- Renderer tests for flag on rendering Command Center and Writing Studio regions.
- Smoke tests that generate, critique, snapshot, and export still call the same handlers.

Why this is safer:
- Refactoring the existing shell in place would destabilize a green Phase 11A workspace.
- A parallel component tree without a flag would expose unfinished UI.
- Tokens/contracts alone would not validate the new topology.

## 4. Single Monitor / Dual Monitor Strategy

Phase 11B should build one wide split layout first. The first implementation should treat dual monitor as a layout concept only: Command Center and Writing Studio are zones in one Electron window.

Real detachable windows should wait. The current floating-pane system is functional but still has deferred E2E coverage and UX polish risk. Phase 11B should not expand OS-level windowing while changing the main workspace topology.

First adaptive behavior:
- Compact: show Writing Studio first and collapse Command Center behind a simple toggle.
- Standard: keep Writing Studio primary and Command Center as a collapsible/sidebar zone.
- Wide: render Split Command as left Command Center and right Writing Studio.
- Ultrawide: widen both zones without adding new panes.

## 5. Story Unit Architecture Plan

Current scenes already act like the practical unit boundary. They have ids, titles, order, chapter membership, metadata, draft text, generation targeting, analytics cache keys, and critique/rewrite routing.

Story Unit should enter as a compatibility layer above current scenes, not a new canonical model in Phase 11B. The first Story Unit v1 should be a renderer/shared type adapter that maps `OutlineSceneSummary` plus `SceneDraftMetadata` plus draft-preview metadata into a normalized UI object.

Do not change project files in the first Story Unit pass. Do not add a sidecar file yet. Defer database, vector storage, and graph storage.

Migration risk:
- Changing scene ids or outline shape would break generation, draft reads, analytics cache, snapshots, rewrite, and tests.
- Introducing a new persisted unit file too early could create dual authority between scenes and units.

Smallest safe Story Unit v1 fields:
- `unitId`
- `sourceType: "scene"`
- `title`
- `contentPreview`
- `state`
- `placement`
- `chapterId`
- `order`
- `metadata`
- `draftStatus`
- `isAiGenerated`
- `updatedAt?: string`

Overlay rules:
- Keep derived UI state separate from canonical scene metadata.
- Use overlays only for UI annotations such as selected, stale, candidate placement, risk marker, or display grouping.
- Do not turn Story Unit into a bucket for generation prompt state, memory state, analytics cache, and draft content.

## 6. One Active Outline Plan

Current outline source of truth is `LoadedProject.outline`, loaded from the project filesystem through `projectLoader`. It already includes `outline_id`. Active scene is renderer state lifted from `ProjectHome` into `App`, then used by generation, preview, and critique.

One active outline in Phase 11B should be a contract and selector layer first:
- The active outline is `currentProject.outline`.
- The active outline id is `currentProject.outline.outline_id`.
- Active scene/unit selection must belong to the active outline.
- Project switch clears invalid active scene/unit state.

Do not add multi-outline branching in Phase 11B.

Tests:
- Project load exposes one active outline id.
- Active scene/unit belongs to that outline.
- Project switch with colliding scene ids does not preserve stale context.
- Generation still targets the selected active scene through current payloads.

## 7. Command Center / Writing Studio Component Plan

Command Center shell: create behind flag.

Writing Studio shell: create behind flag.

Story Navigation: wrap existing outline/scene selection from `ProjectHome` first; later extract into a standalone component.

Narrative Overview: wrap or reuse `AnalyticsDashboard`/Story Insights where data exists; placeholder where analytics is unavailable.

Narrative Gaps: create placeholder only.

Story Constellation: defer.

AI Companion: reuse existing `CompanionOverlay` entry point; do not change routing.

Thread Timeline: create later.

Character Arc Overview: create later.

Global Tools: wrap existing WorkspaceHeader actions later; do not build a new toolbar first.

Primary Editor: wrap existing draft editor surface.

Lightweight Outline: wrap current scene list or Corkboard-derived scene cards.

Scene Notes: placeholder or reuse current Scene Metadata display; no editing in Phase 11B start.

Contextual Intelligence: placeholder using current Companion/metadata signals only.

Quick Insert: defer.

Writing Tools: wrap existing generate/critique/snapshot/export commands later.

View Controls: create minimal shell controls for mode/toggle only after the shell flag exists.

## 8. Command Palette / Tool Registry Plan

Do not build a runtime command palette at the start of Phase 11B.

Begin with a docs contract and, later, a TypeScript registry object for existing UI commands only. The backend `services/tools/registry.py` is a permission/checklist registry, not a renderer command palette, so it should not be reused directly as UI registry authority.

Register later:
- Generate active scene
- Generate all scenes
- Critique
- Generate rewrite
- Sync draft view
- Snapshot
- Verify backups
- Export
- Reset layout
- Toggle/open panes

Registry metadata should include:
- id
- label
- category
- required context
- allowed zone
- mutates data
- risk level
- requires confirmation
- service dependency
- disabled reason

Runtime command palette should wait until the Split Command shell is stable.

## 9. Test Strategy

Renderer tests:
- Feature flag off keeps current shell.
- Feature flag on renders Split Command zones.
- Existing generation, preflight, critique, snapshots, export, and recovery tests still pass.
- Story Unit adapter maps scenes without mutating source project data.
- One active outline selector rejects stale scene ids.

Layout tests:
- Existing `LayoutPersistence`, `LayoutRegression`, `DockWorkspace`, and main layout IPC tests remain mandatory.
- Add shell-mode tests only if shell state becomes persisted.

ProjectHome tests:
- Preserve active scene selection, metadata display, draft preview sync, and no stale metadata after scene switch.
- Add tests only when surfaces are extracted/wrapped.

Shell tests:
- Command Center and Writing Studio landmarks/roles.
- Adaptive compact/wide state using deterministic viewport or container constraints.
- Current actions still call existing handlers.

Story Unit tests:
- Adapter from outline scene and scene metadata.
- Draft preview/content preview derivation.
- AI/candidate flags remain display overlays only.

Accessibility tests:
- Use existing `a11y.smoke.spec.ts` after shell flag is testable.
- Verify region labels, focus visibility, and keyboard reachability for core actions.

Safe Playwright tests:
- Flag-on smoke with sample project.
- Startup diagnostics for mode rendering once stable.

Deferred Playwright tests:
- Dual-monitor/detached window behavior.
- Full floated-pane project-switch E2E until the temp-project recovery 400 blocker is fixed.
- Story Constellation and advanced visualization tests.

Likely brittle tests:
- `AppPreflight.test.tsx`
- `ProjectHome.test.tsx`
- `DockWorkspace.test.tsx`
- `LayoutPersistence.test.tsx`
- `startup.diagnostic.spec.ts`
- `gui-contract.spec.ts`
- `gui.flows.spec.ts`

## 10. Migration / Rollback Strategy

Implementation should be behind a feature flag until the new shell passes renderer and smoke coverage.

The old shell must remain available throughout Phase 11B. The default production path should stay on the current Phase 11A shell until the new shell proves parity for project load, scene selection, generation, preview, critique/rewrite, snapshots, export, and recovery.

Protect current contracts by:
- Reusing existing `App` handlers.
- Keeping generation payloads unchanged.
- Keeping rewrite persistence unchanged.
- Keeping project files unchanged.
- Keeping layout schema unchanged until a shell-mode persistence design is explicit.

Prevent data migration damage by:
- Not writing Story Units to disk in initial passes.
- Avoiding sidecar files until adapter semantics are verified.
- Treating Story Unit v1 as a read-only compatibility view over current scenes.

## 11. Canonical Phase 11B Roadmap

The pass list below is linear and expandable. It is a living sequence, not a hard cap. Additional passes may be inserted if tests, architecture, or safety require it. Do not rename the roadmap into subphase schemes such as `11B-A` through `11B-J`.

### Completed
- Pass 0 - Architecture / Planning
- Pass 1 - Foundation Layer
- Pass 2 - Shell Parity Smoke
- Pass 3 - Story Navigation Wrapper
- Pass 4 - Shared Scene Selection Interface
- Pass 5 - Workflow Surface Smoke
- CI Diagnostic Hardening / Preflight Contract Fix

### Remaining Proposed Linear Roadmap
- Pass 6 - Visual Shell Refinement V1
- Pass 7 - Command Center Hierarchy + Styling
- Pass 8 - Writing Studio Framing
- Pass 9 - Story Navigation Visual Polish
- Pass 10 - Narrative Overview Wrapper
- Pass 11 - Global Tools Wrapper
- Pass 12 - Command Registry Expansion
- Pass 13 - Story Unit V1 Hardening
- Pass 14 - Empty/Large Project Edge Cases
- Pass 15 - Adaptive Layout Rules
- Pass 16 - Accessibility Pass
- Pass 17 - Optional Safe Playwright Shell Smoke
- Pass 18 - Docs Alignment / Runtime Truth Review
- Pass 19 - Deferred Ledger Review
- Pass 20 - Cleanup + Closure Validation
- Pass 21 - Phase 11B Closure Review

### Roadmap Notes
- The roadmap is intentionally linear so future work has a single canonical ordering.
- The roadmap is also expandable, so new passes can be inserted when the codebase or validation plan demands it.
- Later passes may still be renumbered upward if an inserted pass is needed to preserve sequencing.
- The list is not a promise that all later ideas belong in Phase 11B; it only records the current working order.
- Phase 11B should continue to prefer small, safe, reversible steps behind the experimental flag.

## 12. Phase 11B Done

Phase 11B is done when all of the following are true:
- The experimental Split Command shell remains safely behind a flag.
- The old shell remains the production default unless explicitly promoted later.
- Flag-off behavior is validated.
- Flag-on shell is usable enough for continued development.
- Story Navigation and shared scene selection are stable.
- Story Unit v1 compatibility remains read-only and scene-derived.
- One active outline compatibility remains derived, not persisted.
- No backend, project format, generation, rewrite, or persistence behavior changed.
- Design tokens and shell styling are stable enough for future phases.
- The deferred ledger is current.
- Docs match runtime reality.
- Full app tests, lint, and build pass.
- A closure checklist exists and is green.

Phase 11B is not done when every dream GUI feature is implemented. It is done when the next phases have the shell, data, and UI foundation they need.

### Closure Checklist
- [ ] Split Command remains safely behind a flag.
- [ ] Old shell remains the production default unless explicitly promoted later.
- [ ] Flag-off behavior is validated.
- [ ] Flag-on shell is usable enough for continued development.
- [ ] Story Navigation and shared scene selection are stable.
- [ ] Story Unit v1 compatibility remains read-only and scene-derived.
- [ ] One active outline compatibility remains derived, not persisted.
- [ ] No backend, project format, generation, rewrite, or persistence behavior changed.
- [ ] Design tokens and shell styling are stable enough for future phases.
- [ ] Deferred ledger is current.
- [ ] Docs match runtime reality.
- [ ] Full app tests, lint, and build pass.
- [ ] Closure review is complete and all preceding items are green.

## 13. Deferred Ledger

Status key:
- `deferred` means the item is intentionally postponed but still expected later.
- `frozen` means the item is intentionally left unchanged for this phase.
- `revisit` means the item should be re-evaluated before the next phase boundary.
- `delete-candidate` means the item may be removed from future plans if it no longer fits the roadmap.

### Later Phase 11B
- Visual shell refinement - reason deferred: styling should follow the stable shell contract; risk level: medium; likely future phase: 11B; unblock condition: shell topology and wrapper contracts remain stable; blocks current phase: no; status: deferred.
- Command center styling - reason deferred: hierarchy needs shell layout stability first; risk level: medium; likely future phase: 11B; unblock condition: command center zones stop moving structurally; blocks current phase: no; status: deferred.
- Writing studio framing - reason deferred: immersive surface polish should follow shell contract stabilization; risk level: medium; likely future phase: 11B; unblock condition: writing studio wrapper stays behaviorally stable; blocks current phase: no; status: deferred.
- Story navigation polish - reason deferred: navigation structure should stay stable before visual tuning; risk level: low to medium; likely future phase: 11B; unblock condition: shared selection remains authoritative; blocks current phase: no; status: deferred.
- Narrative overview wrapper - reason deferred: should reflect runtime truth only after shell hierarchy is settled; risk level: medium; likely future phase: 11B; unblock condition: current overview data path remains honest; blocks current phase: no; status: deferred.
- Global tools wrapper - reason deferred: global actions should be wrapped after the shell layout and header semantics stop shifting; risk level: medium; likely future phase: 11B; unblock condition: command placement and ownership are stable; blocks current phase: no; status: deferred.
- Command registry metadata expansion - reason deferred: registry should track stable shell commands, not speculate ahead of the UI; risk level: low to medium; likely future phase: 11B; unblock condition: command surface is still declarative; blocks current phase: no; status: deferred.
- Story Unit v1 hardening - reason deferred: adapter semantics need stable scene derivation and test proof; risk level: medium; likely future phase: 11B; unblock condition: read-only derivation remains unchanged; blocks current phase: no; status: deferred.
- Adaptive layout - reason deferred: responsive rules should follow the settled shell hierarchy; risk level: medium; likely future phase: 11B; unblock condition: command center and writing studio proportions are stable; blocks current phase: no; status: deferred.
- Accessibility pass - reason deferred: ARIA/focus polish should land after the visual shell stops moving; risk level: medium; likely future phase: 11B; unblock condition: visible shell structure is stable enough for a final pass; blocks current phase: no; status: deferred.
- Safe shell smoke tests - reason deferred: shell smoke should wait until flag-on behavior is stable enough to exercise safely; risk level: medium; likely future phase: 11B; unblock condition: the current flagged shell path does not require frequent structural changes; blocks current phase: no; status: deferred.

### Phase 12
- Deeper critique/rewrite comparison surfaces - reason deferred: current phase should not expand revision workflows beyond the current shell foundation; risk level: medium; likely future phase: 12; unblock condition: rewrite/provenance surfaces are stable; blocks current phase: no; status: deferred.
- Provenance viewer - reason deferred: provenance needs a revision-focused surface and stable history semantics; risk level: medium; likely future phase: 12; unblock condition: compare/sync workflows are settled; blocks current phase: no; status: deferred.
- Outline-driven generation targeting beyond current scene selection - reason deferred: this would change generation authority and payload semantics; risk level: high; likely future phase: 12; unblock condition: current scene selection and outline contracts are proven stable; blocks current phase: no; status: deferred.
- Richer revision/recovery workflows - reason deferred: recovery UX should be expanded only after the current rewrite/snapshot model is stable; risk level: medium; likely future phase: 12; unblock condition: revision state transitions are explicit; blocks current phase: no; status: deferred.

### Phase 13
- Persisted Story Units - reason deferred: persistence changes would alter project-format behavior; risk level: high; likely future phase: 13; unblock condition: read-only Story Unit v1 is fully stable; blocks current phase: no; status: deferred.
- Loose notes/fragments as Story Units - reason deferred: the current phase keeps Story Unit derived from scenes only; risk level: high; likely future phase: 13; unblock condition: a canonical persisted model exists; blocks current phase: no; status: deferred.
- Uploads decomposed into Story Units - reason deferred: ingestion and decomposition need a persisted unit model; risk level: high; likely future phase: 13; unblock condition: Story Unit persistence exists; blocks current phase: no; status: deferred.
- Memory lifecycle - reason deferred: memory changes are out of scope for the shell foundation; risk level: high; likely future phase: 13; unblock condition: Story Unit and outline contracts are stable; blocks current phase: no; status: deferred.
- Embeddings - reason deferred: vector storage introduces new backend behavior and infrastructure; risk level: high; likely future phase: 13; unblock condition: memory and Story Unit persistence exist; blocks current phase: no; status: deferred.
- Relationship graph foundation - reason deferred: graph data depends on stable persisted entities; risk level: high; likely future phase: 13; unblock condition: canonical entity model exists; blocks current phase: no; status: deferred.
- Continuity engine - reason deferred: continuity analysis depends on persisted units, memory, and relationships; risk level: high; likely future phase: 13; unblock condition: graph and memory foundations exist; blocks current phase: no; status: deferred.
- Thread tracking - reason deferred: thread state should follow persisted units and continuity data; risk level: medium to high; likely future phase: 13; unblock condition: continuity and memory contracts exist; blocks current phase: no; status: deferred.

### Phase 14
- Constellation graph - reason deferred: visualization should wait until relationship data is durable; risk level: high; likely future phase: 14; unblock condition: graph foundation is stable; blocks current phase: no; status: deferred.
- Emotional pulse graph - reason deferred: emotional trends need a durable continuity signal source; risk level: medium to high; likely future phase: 14; unblock condition: continuity and graph data exist; blocks current phase: no; status: deferred.
- Pacing heatmaps - reason deferred: pacing depends on stable scene and thread history; risk level: medium; likely future phase: 14; unblock condition: narrative history is reliable; blocks current phase: no; status: deferred.
- Character arc visualizations - reason deferred: arc views rely on richer narrative graph data; risk level: medium; likely future phase: 14; unblock condition: character/relationship data is mature; blocks current phase: no; status: deferred.
- Narrative health dashboards - reason deferred: dashboards should summarize stable upstream signals only; risk level: medium; likely future phase: 14; unblock condition: signals become durable and interpretable; blocks current phase: no; status: deferred.
- Thread timeline intelligence - reason deferred: timeline reasoning belongs after thread tracking is persisted; risk level: medium to high; likely future phase: 14; unblock condition: thread lifecycle data exists; blocks current phase: no; status: deferred.

### Phase 15
- Mature local/API orchestration - reason deferred: orchestration should follow the continuity and graph foundation; risk level: high; likely future phase: 15; unblock condition: the app has stable analysis inputs; blocks current phase: no; status: deferred.
- Local LLM execution path - reason deferred: local model routing is a later architecture choice; risk level: high; likely future phase: 15; unblock condition: orchestration and analysis routing are defined; blocks current phase: no; status: deferred.
- Local tagging/classification - reason deferred: classification should depend on the mature orchestration layer; risk level: medium; likely future phase: 15; unblock condition: model routing and analysis workflows exist; blocks current phase: no; status: deferred.
- Route transparency UI - reason deferred: route visualization belongs to the later orchestration phase; risk level: medium; likely future phase: 15; unblock condition: local/API paths are explicit; blocks current phase: no; status: deferred.
- Model cost/status panel - reason deferred: cost reporting depends on stable routing and provider data; risk level: medium; likely future phase: 15; unblock condition: orchestration emits reliable status data; blocks current phase: no; status: deferred.
- Background analysis workers - reason deferred: worker orchestration should not land before the analysis model is fixed; risk level: high; likely future phase: 15; unblock condition: local/API orchestration is stable; blocks current phase: no; status: deferred.

### Phase 16+
- True detached multi-window / dual-monitor OS windows - reason deferred: the current phase uses a single-window split shell, not detachable OS windows; risk level: high; likely future phase: 16+; unblock condition: the single-window shell and state sync are proven stable; blocks current phase: no; status: deferred.
- Orbital panels - reason deferred: this is a later visualization and workspace-expansion concept; risk level: medium to high; likely future phase: 16+; unblock condition: the windowing model is established; blocks current phase: no; status: deferred.
- Plugin system - reason deferred: plugin architecture is a broad capability change; risk level: high; likely future phase: 16+; unblock condition: command and orchestration layers are mature; blocks current phase: no; status: deferred.
- Command execution middleware - reason deferred: middleware changes should wait for stable command registry and execution semantics; risk level: high; likely future phase: 16+; unblock condition: command registry expansion is complete; blocks current phase: no; status: deferred.
- Graph database dependency - reason deferred: graph DB adoption should not be introduced during shell foundation work; risk level: high; likely future phase: 16+; unblock condition: persisted relationship/continuity needs outgrow current storage; blocks current phase: no; status: deferred.
- Multi-outline branching - reason deferred: branching would change the single-active-outline contract; risk level: high; likely future phase: 16+; unblock condition: current outline contract is stable and explicitly superseded; blocks current phase: no; status: deferred.
- Autonomous restructuring - reason deferred: autonomous restructuring conflicts with the current user-decides doctrine; risk level: high; likely future phase: 16+; unblock condition: explicit product policy and guardrails exist; blocks current phase: no; status: deferred.
- Real-time analysis on every keystroke - reason deferred: this would introduce constant interruption and performance risk; risk level: high; likely future phase: 16+; unblock condition: performance, consent, and interruption rules are redesigned; blocks current phase: no; status: deferred.

### Known Technical / Testing Deferrals
- Floated-pane project-switch Playwright E2E - reason deferred: harness recovery is still blocked by the temp-project backend recovery 400 issue; risk level: medium; likely future phase: 11B or later; unblock condition: the recovery 400 blocker is fixed and safe to exercise; blocks current phase: no; status: deferred.
- Temp-project backend recovery 400 blocker - reason deferred: this is an environment/harness issue, not a product feature; risk level: medium; likely future phase: 11B or later; unblock condition: recovery flow is stable in temp-project runs; blocks current phase: no; status: revisit.
- Playwright shell coverage unless harness supports it safely - reason deferred: shell smoke should not be forced through an unsafe harness path; risk level: medium; likely future phase: 11B or later; unblock condition: the harness can support the shell route without port or recovery noise; blocks current phase: no; status: deferred.

### Ledger Maintenance Notes
- Items should stay in this ledger until they are either implemented, formally deleted, or moved into a later phase plan.
- If an item is duplicated elsewhere, this ledger stays canonical and the other location should cross-link instead of repeating the full decision tree.
- If a new risk emerges during Phase 11B, add it here immediately with a likely future phase and unblock condition.
