Canonical role: Phase 18 truth-classification audit for the hidden Split Command shell.
Scope: Classify what is real, mocked, placeholder, stale, broken, or unknown in the current hidden shell.
Owns: slices `18E` through `18Q` except the final target screenshot matrix.
Does not own: new implementation work or future phase execution.
Upstream dependencies: [phase18_activation_results.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_activation_results.md), [phase18_hidden_gui_activation_plan.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_hidden_gui_activation_plan.md)
Last reviewed: 2026-05-17.
Acceptance record: No operator acceptance recorded yet.

# Phase 18 Hidden GUI Truth Classification

## Core Answers

| Question | Result |
| --- | --- |
| Can the hidden GUI be activated under the flag? | Yes. Source, renderer tests, and packaged Electron smoke now prove the runtime-config flag path. |
| Does the stable GUI remain default? | Yes. |
| Does the hidden shell launch without crashing? | Yes in renderer tests and the packaged Electron runtime-config smoke lane. |
| Is it one-window or is there a real secondary surface? | One-window. No real secondary Split Command surface exists. |
| Does it load the active project correctly? | Yes in renderer tests and in the packaged Electron runtime-config smoke lane. |

## 18E - Authority / Data Truth Audit

`Exists and works`

- runtime flag default-off contract
- flag-on renderer branch selection
- Story Navigation from loaded outline/scenes
- Narrative Overview loaded-data counts
- wrapped generation/preflight path
- wrapped critique path
- wrapped snapshot/export path

`Exists but mocked`

- Narrative Gaps placeholder
- AI Companion placeholder
- Global Tools metadata summary

`Exists but stale`

- large-project evidence beyond bounded renderer tests
- long-session shell confidence

`Exists but broken`

- packaged Electron `__runtimeConfigOverride` activation seam

`Exists and works with the supported lane`

- packaged Electron runtime-config activation through `BLACKSKIES_CONFIG_PATH`
- Split Command-specific Playwright smoke via fixture-owned temporary runtime config and non-dock bootstrap

`Unknown until operator activation`

- whether live operator navigation through the hidden shell feels trustworthy enough for repeated use
- whether any authority wording becomes confusing once the shell is used outside harness conditions

Root-cause note:

- `window.__runtimeConfigOverride` works in renderer tests because it is installed before `App` renders.
- In packaged Electron E2E, the shared `page` fixture returns an already-loaded window, so spec-level `page.addInitScript(...)` is too late for the initial render gate in `App.tsx`.
- Supported packaged Electron activation should therefore use `BLACKSKIES_CONFIG_PATH`, which is read in main-process startup and exposed through preload before renderer boot.

## 18F - Layout Persistence / Workspace-State Classification

Findings:

- Dock layout persistence is real and separately implemented.
- `DockWorkspace` persists layout and floating pane metadata.
- `DockWorkspace` intentionally skips restoring persisted floating panes automatically and clears stale floating state in some cases.
- No Split Command-specific layout persistence contract exists.
- Split Command wraps `fullWorkspaceBody`; it does not introduce its own workspace-state model.

Classification:

- current dock layout persistence: `Exists and works`
- Split Command layout persistence as its own shell contract: `Unknown until activation`
- Split Command fallback/deactivation path: `Unknown until activation`

## 18G - Placeholder Inventory / Feature-Parity / Operator-Confusion Audit

Honest placeholders currently present:

- `Narrative Gaps`
  - text says no gap detection is running
- `AI Companion`
  - text says existing companion behavior remains elsewhere
- `Global Tools`
  - text says display-only command metadata
  - text says no command palette or execution path is active
- `Narrative Overview`
  - text says loaded workspace data only
  - text says story-health signals are not running in this wrapper

Assessment:

- placeholder labeling is currently honest in source and renderer tests
- operator confusion risk rises if later passes style these panels as active intelligence without changing the copy and backing behavior

## 18H - Workflow Continuity / Cognitive Load / Creative-State Protection Audit

Evidence quality: partial only

Findings:

- Writing Studio is still a wrapper around the stable workspace body
- current shell does not reduce workflow complexity structurally; it relocates it
- the wrapper adds Command Center framing but does not yet remove stable-shell noise from the writing surface

Classification:

- workflow continuity: `Unknown until activation`
- cognitive load: `Unknown until activation`
- creative-state protection: `Deferred / future phase`

## 18I - Session Durability / Recovery Audit

Findings:

- recovery, restore, backup, and snapshot trust work remains owned by earlier phases
- no Split Command-specific durability or recovery model exists
- no evidence that the shell breaks current recovery semantics

Classification:

- current app recovery flows: inherited, not reimplemented here
- Split Command session durability: `Exists but stale`
- Split Command recovery/fallback model: `Unknown until activation`

## 18J - Information Architecture / GUI-State Truth Model

Strengths:

- Story Navigation has a clear role and a real data source
- Command Center and Writing Studio labels are explicit

Weaknesses:

- most of Command Center is still future-surface framing
- Writing Studio is not yet an information architecture of its own; it is a container around the stable shell
- the hidden shell has no independent truth model for layout, modes, focus, or AI intelligence

Result:

- migration foundation quality: mixed

## 18K - Interaction Philosophy / Attention Economy / Trust Calibration / Choreography Audit

Findings:

- the shell is restrained enough not to fake intelligence
- it does not yet earn the target “command center plus immersive writing” choreography
- trust calibration is good where the UI says “placeholder” and weak where the shell’s styling could imply a more complete system than actually exists

Classification:

- trust calibration for placeholders: `Exists and works`
- attention economy: `Unknown until activation`
- interaction choreography toward north-star target: `Deferred / future phase`

## 18L - Workspace Scaling / Large-Project Stress Audit

Evidence:

- renderer tests cover a 75-scene case
- no real large-project Electron stress proof was collected in this phase

Classification:

- bounded renderer scaling: `Exists and works`
- real large-project stress: `Exists but stale`

## 18M - AI Collaboration / Focus Integrity / Trust-Erosion Audit

Findings:

- no live AI collaboration panel exists in the shell
- current shell avoids fake AI output
- focus integrity is unproven because the writing surface is still the stable workspace inside a new frame

Classification:

- AI collaboration in shell: `Missing entirely`
- focus integrity: `Unknown until activation`
- trust-erosion risk from fake AI: currently low because placeholders are explicit

## 18N - Time-Domain Workflow / Mode Transition / Latency Perception Audit

Findings:

- no new mode system exists
- no explicit latency masking or time-domain choreography exists for the shell itself
- action latency remains inherited from the stable workflows

Classification:

- mode transitions: `Deferred / future phase`
- shell-specific latency perception design: `Missing entirely`

## 18O - Environmental Tone / North-Star Workspace Philosophy

Assessment:

- the shell reads as an experimental structural wrapper, not as the target polished workspace
- it is useful as a directional sketch
- it is not yet persuasive as a north-star environment

Result:

- worth continuing only if later phases treat it as a foundation sketch, not as a nearly-finished GUI

## 18P - Resource Exhaustion / Subscription / Fallback Smoke

Findings:

- no shell-specific subscription or model-routing layer exists
- no evidence that the shell changes backend resource consumption
- fallback is still mostly “turn the flag off”

Classification:

- resource/subscription risk in current shell: `Unknown until activation`
- deactivation safety: `Exists and works` for default-off rollback only
- richer fallback path: `Deferred / future phase`

## 18Q - Migration Readiness Decision

Decision:

- continue only after limited repair

Reason:

- the shell is real enough to keep as an experimental migration foundation
- it already has a real Story Navigation panel and a real wrapped writing surface
- it remains honest about missing intelligence features
- it is still too incomplete and too shell-like to promote
- the packaged Electron activation path is now clean enough to support bounded smoke, but the shell still lacks the architecture and feature depth required for promotion

Not recommended:

- do not promote to default
- do not treat dock floating panes as Monitor 2
- do not build future AI or graph surfaces on top of unproven shell-state assumptions
