# Phase 11B Implementation Plan

Status: Pre-implementation architecture review
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

## 11. Phase 11B Implementation Sequence

### Pass 0: Architecture Plan Only
Goal: capture this plan and record planning state.
Files likely touched: docs only.
Tests: `git diff --check`.
Risk: low.
Rollback: revert docs.
Closure: implementation plan accepted.

### Pass 1: Runtime Token Seed
Goal: add first CSS variable slice without changing visible behavior.
Files likely touched: `app/renderer/styles/design-system.css`, `app/renderer/index.tsx` or existing style import path, `app/renderer/styles/app.css` only if needed.
Tests: app lint, production build, targeted visual/smoke if import path changes.
Risk: low.
Rollback: remove token import.
Closure: tokens exist and no visible regression expected.

### Pass 2: Flagged Workspace Shell Entry
Goal: add a disabled-by-default Phase 11B shell route/flag that renders placeholder Command Center and Writing Studio zones.
Files likely touched: `App.tsx`, new workspace shell components, tests.
Tests: shell renderer tests, app test, lint, build.
Risk: medium.
Rollback: disable flag path.
Closure: flag off equals current shell; flag on renders zones with no service calls.

### Pass 3: Writing Studio Wrap
Goal: render existing draft/preview/scene context inside Writing Studio behind the flag.
Files likely touched: shell components, `ProjectHome` extraction only if necessary.
Tests: ProjectHome, AppPreflight, shell tests.
Risk: medium.
Rollback: return flag path to placeholders.
Closure: active scene, preview, generation target, and draft sync still work.

### Pass 4: Command Center Wrap
Goal: render existing outline/navigation, Corkboard, Story Insights, and tool access inside Command Center behind the flag.
Files likely touched: shell components and wrapper components.
Tests: ProjectHome, Corkboard, StoryInsightsRegression, shell tests.
Risk: medium.
Rollback: use placeholder Command Center.
Closure: current project/scene navigation remains authoritative.

### Pass 5: Story Unit v1 Adapter
Goal: introduce read-only Story Unit types/selectors over current scenes.
Files likely touched: shared/renderer type utilities and tests.
Tests: Story Unit adapter tests, ProjectHome tests.
Risk: low to medium.
Rollback: remove adapter usage; scenes remain canonical.
Closure: no project file writes; adapters produce stable ids and metadata.

### Pass 6: One Active Outline Selector
Goal: centralize active outline id and scene membership checks.
Files likely touched: renderer selectors/hooks and tests.
Tests: AppPreflight, ProjectHome, shell tests.
Risk: medium.
Rollback: return to current active-scene state path.
Closure: stale active scene is cleared on project/outline mismatch.

### Pass 7: Contextual Intelligence Placeholder
Goal: add low-noise placeholder using existing metadata and Companion availability only.
Files likely touched: shell placeholder component and tests.
Tests: shell tests, ProjectHome if reused.
Risk: low.
Rollback: hide placeholder.
Closure: no backend calls, no always-on analysis.

### Pass 8: Workflow/Test Hardening
Goal: prove the flagged shell preserves Phase 11A workflows.
Files likely touched: tests primarily.
Tests: full app test, focused Playwright smoke for flag-on shell if stable, lint, build.
Risk: medium.
Rollback: keep flag off.
Closure: current shell still green; flagged shell has minimum workflow smoke.

### Pass 9: Closure Review
Goal: decide whether Phase 11B shell remains experimental or becomes default.
Files likely touched: docs/tracker and possibly config.
Tests: full app test, lint, build, safe Playwright smoke.
Risk: decision-dependent.
Rollback: keep current shell default.
Closure: explicit go/no-go for defaulting Split Command.

## 12. Deal Breakers / Do Not Build

Do not include these in Phase 11B:
- Full Story Constellation graph.
- Advanced emotional pulse.
- Orbital panels.
- Plugin marketplace.
- Graph database dependency.
- Autonomous AI restructure.
- Always-on AI intervention.
- Multi-outline branching.
- Real-time analysis on every keystroke.
- Backend rewrite redesign.
- Project file migration for Story Units.
- OS-level dual-monitor/detached-window expansion.
- New memory architecture.
- Local LLM routing changes.

## 13. Resolved Foundation Decisions

1. The Phase 11B experimental shell is available only behind an explicit runtime flag and remains off by default.
2. Story Unit v1 exposes only current scenes. Loose notes/fragments are deferred.
3. Phase 11B preserves existing workspace surfaces by wrapping the current stable workspace body inside Writing Studio.
4. Split Command cannot become default until generate, preview, critique, rewrite, snapshot, export, project switch, and recovery parity are verified.
5. Command registry metadata may exist before a visible command palette, but it remains declarative metadata only.
