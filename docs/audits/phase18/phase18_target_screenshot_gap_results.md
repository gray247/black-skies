Canonical role: Phase 18 executed target screenshot gap matrix.
Scope: Classify the actual hidden Split Command shell against the operator-provided target screenshot and assign future ownership.
Owns: slice `18R`.
Does not own: implementation of the target screenshot GUI.
Upstream dependencies: [phase18_activation_results.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_activation_results.md), [phase18_hidden_gui_truth_classification.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_hidden_gui_truth_classification.md), [phase18_hidden_gui_activation_plan.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_hidden_gui_activation_plan.md)
Last reviewed: 2026-05-17.
Acceptance record: No operator acceptance recorded yet.

# Phase 18 Target Screenshot Gap Results

Allowed classification values:

- `Exists and works`
- `Exists but mocked`
- `Exists but broken`
- `Exists but stale`
- `Missing entirely`
- `Unknown until activation`
- `Deferred / future phase`

## Executed Matrix

| Target area | Target feature | Actual Phase 18 classification | Actual evidence | Future phase owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Overall workspace model | one-monitor fallback | Exists and works | Renderer/source proof and runtime-config Electron evidence show a one-window shell. | Phase 20 | Live operator ergonomics still pending. |
| Overall workspace model | optional two-monitor workflow | Missing entirely | No Split Command second window exists. | Phase 24 | Dock floating panes are separate infrastructure. |
| Overall workspace model | command-center surface | Exists and works | `SplitCommandWorkspace` renders Command Center. | Phase 20 | Mostly framing plus one real panel. |
| Overall workspace model | immersive writing surface | Exists and works | Writing Studio wraps the stable workspace body. | Phase 22 | Wrapper, not a new editor architecture. |
| Overall workspace model | story navigation | Exists and works | Real scene-derived panel with selection. | Phase 21 | Strongest current Command Center feature. |
| Overall workspace model | project identity | Exists and works | Header display uses project name and restored-copy labeling rules from `App.tsx`. | Phase 20 | Alias debt still exists outside the shell. |
| Overall workspace model | layout persistence | Unknown until activation | Dock persistence exists; Split Command-specific persistence is unproven. | Phase 20 | Needs explicit shell-state model. |
| Overall workspace model | fallback path | Unknown until activation | Default-off rollback is real; richer fallback path is not. | Phase 20 | Phase 18 found no shell-specific recovery contract. |
| Monitor 1 Command Center | emotional pulse graph | Missing entirely | No graph component. | Phase 21 | |
| Monitor 1 Command Center | narrative health bars | Missing entirely | No health bars; current wrapper explicitly says story-health signals are not running. | Phase 21 | |
| Monitor 1 Command Center | story constellation | Missing entirely | No constellation/relationship surface in Split Command. | Phase 21 | |
| Monitor 1 Command Center | narrative gaps | Exists but mocked | Placeholder text explicitly says no gap detection is running. | Phase 21 | |
| Monitor 1 Command Center | AI companion | Exists but mocked | Placeholder panel only. | Phase 23 | |
| Monitor 1 Command Center | thread timeline | Missing entirely | No timeline panel in Split Command. | Phase 21 | Current dock timeline is separate and not integrated here. |
| Monitor 1 Command Center | character arcs | Missing entirely | No character arc surface. | Phase 21 | |
| Monitor 1 Command Center | global tools | Exists but mocked | Metadata display only; no command execution path. | Phase 21 | |
| Monitor 2 Immersive Writing | focused editor | Deferred / future phase | Stable writing surface is wrapped; not replaced. | Phase 22 | |
| Monitor 2 Immersive Writing | outline / notes / AI chat | Missing entirely | No writing-side outline, notes, or chat surface in Split Command. | Phase 22 / 23 | |
| Monitor 2 Immersive Writing | quick insert | Missing entirely | No quick insert surface. | Phase 22 | |
| Monitor 2 Immersive Writing | writing tools | Deferred / future phase | Existing controls remain in the wrapped stable workspace. | Phase 22 | |
| Monitor 2 Immersive Writing | view controls | Deferred / future phase | No new shell-specific view controls. | Phase 22 | |
| AI / Intelligence | contextual intelligence | Missing entirely | No contextual detections or analysis panel. | Phase 23 | |
| AI / Intelligence | trust calibration | Exists and works | Placeholder labeling is explicit and mostly honest. | Phase 23 | Needs a fuller model once AI surfaces exist. |
| AI / Intelligence | placeholder labeling | Exists and works | Narrative Gaps, AI Companion, Global Tools, and Narrative Overview remain explicit about limits. | Phase 23 | |
| Technical readiness | default-off production behavior | Exists and works | `DEFAULT_RUNTIME_CONFIG.ui.experimentalSplitCommandWorkspace === false`; renderer tests pass. | Phase 18 | |
| Technical readiness | packaged Electron override seam | Exists but broken | `__runtimeConfigOverride` did not activate the shell in packaged Playwright harness. | Phase 18 | Test seam issue, not a reason to change default. |
| Technical readiness | runtime-config activation path | Exists and works | Temp `BLACKSKIES_CONFIG_PATH` changed live Electron behavior away from dock assumptions. | Phase 18 | Still needs a cleaner supported smoke path. |
| Technical readiness | secondary-surface reality | Missing entirely | No second Split Command `BrowserWindow`, no monitor-specific integration. | Phase 24 | |

## Target Gap Summary

- The hidden shell is a legitimate one-window experimental wrapper.
- The current shell is materially closer to a shell sketch than to the target screenshot.
- One real Command Center panel exists today: Story Navigation.
- The Writing Studio side is real only as a wrapper around the stable UI.
- Nearly all target intelligence surfaces remain missing or explicit placeholders.
- Two-monitor language remains future-only and must not be implied by the current code.

## Future Ownership Map

| Phase | Owner scope |
| --- | --- |
| Phase 19 | hygiene, stale artifacts, restored-folder sprawl, dead flags/docs cleanup, experimental debris cleanup |
| Phase 20 | real GUI architecture foundation: stable one-monitor shell, optional second-window strategy, layout persistence, workspace-state model, fallback path |
| Phase 21 | Command Center panels: story navigation, emotional pulse, narrative health, story constellation, thread timeline, character arcs, narrative gaps |
| Phase 22 | Immersive Writing surface: editor, outline/notes sidebars, quick insert, writing tools, focus mode, saved-state indicators |
| Phase 23 | AI Companion and Contextual Intelligence: suggestions, warnings, tension/foreshadow/conflict detection, trust calibration |
| Phase 24 | true two-monitor workflow: Monitor 1 command center, Monitor 2 writing surface, detached windows, cross-window state sync, monitor disconnect recovery |
| Phase 25 | professional hardening: large-project stress, performance, memory, accessibility, beginner/advanced modes, long-session durability |
