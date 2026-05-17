Canonical role: Phase 18 hidden GUI activation and target-gap classification plan.
Scope: Plan the controlled activation, smoke proof, truth classification, and migration-readiness decision for the hidden Split Command shell.
Owns: default-off proof, flag-on activation path, screenshot target gap matrix, non-claim boundaries, continuation decision, and future-phase ownership map.
Does not own: building the target screenshot GUI, true two-monitor workflow, new AI intelligence, new graph systems, new editor architecture, large-project hardening, or cross-window state sync.
Upstream dependencies: [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [phase17_closure_review.md](/C:/Dev/black-skies/docs/audits/phase17/phase17_closure_review.md), [phase17_gui_authority_simplification_plan.md](/C:/Dev/black-skies/docs/audits/phase17/phase17_gui_authority_simplification_plan.md), [phase11b_implementation_plan.md](/C:/Dev/black-skies/docs/phases/phase11b_implementation_plan.md)
Downstream dependencies: Phase 19 hygiene, Phase 20 real GUI architecture foundation, Phase 21 Command Center panels, Phase 22 Immersive Writing surface, Phase 23 AI intelligence, Phase 24 true two-monitor workflow, and Phase 25 professional hardening.
Last reviewed: 2026-05-17.
Acceptance record: No operator acceptance recorded yet.

# Phase 18 Hidden GUI Activation Plan

## 1. Purpose

Phase 18 determines whether the hidden Split Command shell is worth continuing.

It does this by proving the shell remains off by default, activating it in a controlled test/dev path, smoke-checking the actual current behavior, and comparing that behavior against the operator-provided long-term Narrative Command / Immersive Writing target.

Explicit non-claim: Phase 18 does not build the screenshot GUI. Phase 18 only determines how far the current hidden shell is from that target and whether it is worth continuing.

## 2. Current Evidence Baseline

Current repository evidence shows:

- `app/shared/config/runtime.ts` defaults `ui.experimental_split_command_workspace` off.
- `app/renderer/App.tsx` selects `SplitCommandWorkspace` only when `runtimeUi.experimentalSplitCommandWorkspace === true`.
- `app/renderer/__tests__/runtimeConfig.test.ts` covers the default-off contract and YAML normalization.
- `app/renderer/__tests__/AppPreflight.test.tsx` covers flag-off default shell rendering and flag-on Split Command shell rendering.
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx` implements one Electron-window Command Center and Writing Studio zones.
- `app/renderer/components/workspace/StoryNavigationPanel.tsx` renders scene-derived Story Unit v1 navigation from loaded project data.
- `app/renderer/__tests__/SplitCommandWorkspace.test.tsx` covers Story Navigation, wrapped Writing Studio behavior, inert Global Tools metadata, empty state, large-project state, and active scene selection.
- `docs/phases/phase11b_implementation_plan.md` states real detachable windows and dual-monitor OS behavior were intentionally deferred.

This evidence is enough for planning classification. It is not evidence that the long-term target GUI exists.

## 3. Activation Gate

Phase 18 may open the hidden shell only after these gates are satisfied:

1. Phase 17 closure remains valid and no known current-GUI authority lie blocks controlled exposure.
2. The runtime flag is proven off by default from source and tests.
3. Flag-on activation happens only through an explicit dev/test runtime configuration path.
4. Smoke testing is limited to current shell behavior: shell selection, loaded project rendering, Story Navigation selection, wrapped generation/preflight path, critique entry, snapshot action, and export action.
5. Any failure during activation is classified as `Exists but broken` or `Unknown until activation`, not hidden by docs wording.
6. No production default, backend route, project format, persistence schema, generation payload, rewrite behavior, snapshot behavior, export behavior, or memory behavior changes in Phase 18.

## 4. Execution Slices

### 18A - Evidence Refresh

- Re-read current runtime flag, shell-selection, Split Command, Story Navigation, command registry, layout, and tests.
- Record any contradiction against the baseline above.
- Do not edit runtime code unless activation proof reveals a small documentation/test-only mismatch that is explicitly authorized.

### 18B - Default-Off Proof

- Prove the production default remains the current stable shell.
- Required evidence: source inspection plus `runtimeConfig` or renderer shell-selection tests.

### 18C - Flag-On Smoke

- Enable the shell only through the existing runtime override/config path.
- Smoke current behavior without expanding scope.
- Required evidence: targeted renderer tests or controlled local GUI smoke.

### 18D - Target Gap Matrix

- Complete or update the matrix in this document.
- Treat the target screenshot as operator-provided design intent, not current repo evidence.
- Mark unknowns explicitly.

### 18E - Continue / Stop Decision

- Decide whether the hidden shell should continue as the migration foundation.
- Valid outcomes:
  - continue with the shell as the Phase 20 foundation
  - continue only after limited repair
  - stop and replace the shell foundation later
  - keep the shell disabled and defer all visual work

## 5. Target Screenshot Gap Matrix / Future Phase Alignment

Allowed classification values:

- `Exists and works`
- `Exists but mocked`
- `Exists but broken`
- `Exists but stale`
- `Missing entirely`
- `Unknown until activation`
- `Deferred / future phase`

| Target area | Target feature | Current classification | Actual current evidence | Authority/truth risk | User/workflow importance | Future phase owner | Notes / open questions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Overall workspace model | One-monitor fallback | Exists and works | Flagged Split Command is a single-window Command Center / Writing Studio wrapper; Phase 11B docs record compact/standard/wide adaptive rules. | Medium: evidence is renderer/test-level unless activated in live GUI. | High | Phase 20 | Phase 18 should verify the live one-monitor path before using it as a foundation. |
| Overall workspace model | Optional two-monitor workflow | Missing entirely | Phase 11B docs explicitly deferred real detachable windows and dual-monitor OS behavior. | High if advertised; none if left disabled. | High for target vision | Phase 24 | Needs monitor ownership, window lifecycle, reconnect, and cross-window state sync. |
| Overall workspace model | Command-center surface | Exists and works | `SplitCommandWorkspace` renders `aria-label="Command Center"` behind the runtime flag. | Medium: hidden shell only. | High | Phase 20 | Surface exists, but most target panels inside it do not. |
| Overall workspace model | Immersive writing surface | Exists and works | `SplitCommandWorkspace` renders `aria-label="Writing Studio"` and wraps the stable workspace body. | Medium: wrapper may carry old workspace noise. | High | Phase 22 | Current surface is a wrapper, not a target-grade immersive editor. |
| Overall workspace model | Detachable/floating panes | Deferred / future phase | Current dock workspace has floating-pane behavior, but Phase 11B deferred expanding OS-level windowing for Split Command. | High: stale floating restores and cross-window authority can mislead users. | Medium | Phase 24 | Do not treat existing dock floating panes as target two-monitor behavior. |
| Overall workspace model | Layout persistence | Unknown until activation | Current `DockWorkspace` persists layout, but Split Command shell layout persistence under activation is not proven in this artifact. | Medium: stale or mismatched restored layout could confuse activation results. | High | Phase 20 | Phase 18 should classify live behavior, not assume dock persistence transfers. |
| Overall workspace model | Workspace recovery/fallback | Unknown until activation | Current app has recovery/restore flows; hidden shell fallback/deactivation behavior has not been proven here. | High: recovery claims can overstate state authority. | High | Phase 20 | Needs explicit fallback path if flag-on shell fails. |
| Monitor 1 Command Center | Story navigation | Exists and works | `StoryNavigationPanel` renders scene-derived units, active marker, empty state, large-project state, and selection callback; tests cover these. | Low to medium: read-only derived data, but activation still hidden. | High | Phase 21 | This is the strongest current Command Center panel. |
| Monitor 1 Command Center | Act/chapter/scene progress | Missing entirely | Story Navigation lists scene-derived units; no real act/chapter progress UI is present in the hidden shell. | Medium if implied by target visuals. | High | Phase 21 | Needs project outline aggregation and honest completion semantics. |
| Monitor 1 Command Center | Emotional pulse graph | Missing entirely | No emotional pulse graph in `SplitCommandWorkspace`; Narrative Overview explicitly says story-health signals are not running. | High if fake analytics are shown. | Medium | Phase 21 | Requires analytics model, source labels, and freshness. |
| Monitor 1 Command Center | Narrative health bars | Missing entirely | No health bars; current panels avoid fake story-health intelligence. | High if generated without authority. | High | Phase 21 | Must distinguish measured, generated, verified, and speculative signals. |
| Monitor 1 Command Center | Story constellation graph | Missing entirely | No graph panel in hidden shell; design-system target mentions graphs, but runtime shell does not implement them. | High: visual graph can imply nonexistent analysis. | Medium | Phase 21 | May need separate graph data model before UI. |
| Monitor 1 Command Center | Narrative gaps | Exists but mocked | Shell includes `Narrative Gaps` placeholder text saying no gap detection is running. | Low while honestly labeled; high if label loses placeholder wording. | High | Phase 21 | Keep placeholder honest until real detection exists. |
| Monitor 1 Command Center | AI companion suggestions | Exists but mocked | Shell includes `AI Companion` placeholder text; existing Companion behavior remains outside this shell. | High if suggestions are implied as live. | High | Phase 23 | Needs real AI surface and trust calibration. |
| Monitor 1 Command Center | Thread timeline | Missing entirely | No thread timeline component or data path is present in current shell. | Medium | Medium | Phase 21 | Needs thread model and large-project scaling plan. |
| Monitor 1 Command Center | Character arc overview | Missing entirely | No character arc overview panel in hidden shell. | Medium | Medium | Phase 21 | Requires character model and analysis authority. |
| Monitor 1 Command Center | Global tools cards | Exists but mocked | `GlobalToolsPanel` displays command metadata and states no command palette or execution path is active. | Low while inert; high if users expect execution. | Medium | Phase 21 | Phase 18 should keep it classified as metadata only. |
| Monitor 1 Command Center | World info | Missing entirely | No target-grade world info card in hidden shell. | Medium | Medium | Phase 21 | May reuse existing project data later if authority is clear. |
| Monitor 1 Command Center | Characters | Missing entirely | No character card/panel in hidden shell. | Medium | Medium | Phase 21 | Needs source-of-truth decision before display. |
| Monitor 1 Command Center | Themes | Missing entirely | No theme panel in hidden shell. | Medium | Medium | Phase 21 | Could be derived or manual later; current repo evidence does not prove either. |
| Monitor 1 Command Center | Consistency | Missing entirely | No consistency checker panel in hidden shell. | High if presented without verification. | High | Phase 23 | Needs explicit warning/verification model. |
| Monitor 1 Command Center | Stats reports | Missing entirely | Narrative Overview shows loaded workspace counts only; no report surface exists. | Medium | Medium | Phase 21 | Initial stats could be deterministic counts before AI reports. |
| Monitor 2 Immersive Writing | Focused editor | Deferred / future phase | Current Writing Studio wraps existing stable workspace rather than a new focused editor. | Medium: target may imply lower-noise mode than exists. | High | Phase 22 | Needs editor ownership decision and focus-preservation rules. |
| Monitor 2 Immersive Writing | Editor toolbar | Deferred / future phase | Wrapped workspace may contain current controls, but no target editor toolbar is implemented in the shell. | Medium | High | Phase 22 | Avoid duplicating command controls until editor architecture is chosen. |
| Monitor 2 Immersive Writing | Word count/save state | Deferred / future phase | Current app has draft/workflow state, but target-grade word-count/save-state indicators inside the shell are not proven here. | High if save state overclaims durability. | High | Phase 22 | Must use filesystem/backend authority, not renderer optimism. |
| Monitor 2 Immersive Writing | Right-side outline | Deferred / future phase | Current shell's outline/navigation is in Command Center, not a target right-side writing outline. | Medium | Medium | Phase 22 | Needs mode-specific duplication rules to avoid conflicting selection state. |
| Monitor 2 Immersive Writing | Notes | Missing entirely | No notes sidebar in hidden Writing Studio shell. | Medium | Medium | Phase 22 | Requires notes source-of-truth decision. |
| Monitor 2 Immersive Writing | AI chat | Missing entirely | `AI Companion` is a Command Center placeholder; no real chat panel inside Writing Studio. | High if chat output is treated as authoritative. | High | Phase 23 | Needs provenance and interruption rules. |
| Monitor 2 Immersive Writing | Contextual intelligence | Missing entirely | No contextual intelligence detections in hidden Writing Studio shell. | High | High | Phase 23 | Needs source labels and confidence language. |
| Monitor 2 Immersive Writing | Quick insert | Missing entirely | No quick-insert bar in current hidden shell. | Medium | Medium | Phase 22 | Should wait for editor command model. |
| Monitor 2 Immersive Writing | Writing tools bar | Deferred / future phase | Existing wrapped workspace has current writing actions; no target-grade tools bar exists. | Medium | High | Phase 22 | Must not create competing generate/critique authority. |
| Monitor 2 Immersive Writing | Focus mode | Missing entirely | Target-grade focus mode is not implemented in the hidden shell. | Medium: false focus claims can hurt drafting. | High | Phase 22 | Legacy Focus debt should not be overclaimed as target focus mode. |
| Monitor 2 Immersive Writing | View controls | Deferred / future phase | Current wrapped workspace may expose current view controls; target shell-specific controls are not present. | Low to medium | Medium | Phase 22 | Needs stable layout model first. |
| AI / Intelligence Surfaces | AI companion | Exists but mocked | Placeholder says existing Companion behavior remains in current overlay. | High if users trust placeholder as live AI. | High | Phase 23 | Phase 18 should verify placeholder labeling survives activation. |
| AI / Intelligence Surfaces | Contextual intelligence | Missing entirely | No contextual analysis panel or detection list in hidden shell. | High | High | Phase 23 | Needs trust calibration and provenance labels. |
| AI / Intelligence Surfaces | Tension rising | Missing entirely | No tension detector exists in hidden shell. | High | Medium | Phase 23 | Do not infer from emotion tags without a defined model. |
| AI / Intelligence Surfaces | Foreshadow opportunity | Missing entirely | No foreshadow detector exists in hidden shell. | High | Medium | Phase 23 | Requires speculative labeling if generated. |
| AI / Intelligence Surfaces | Character conflict detected | Missing entirely | No conflict detector exists in hidden shell. | High | Medium | Phase 23 | Requires character data authority. |
| AI / Intelligence Surfaces | Narrative gaps | Exists but mocked | Placeholder explicitly says no gap detection is running. | Low while honest; high if wording is weakened. | High | Phase 23 | Same surface may move from Phase 21 panel shell to Phase 23 intelligence. |
| AI / Intelligence Surfaces | Emotional analysis | Missing entirely | No emotional analysis runtime in hidden shell. | High | Medium | Phase 23 | Needs deterministic vs AI-generated distinction. |
| AI / Intelligence Surfaces | Thread risk | Missing entirely | No thread risk model or panel in hidden shell. | High | Medium | Phase 23 | Needs thread source model first. |
| AI / Intelligence Surfaces | Character arc analysis | Missing entirely | No character arc analysis in hidden shell. | High | Medium | Phase 23 | Requires data, model, and confidence labels. |
| AI / Intelligence Surfaces | Generated/verified/speculative labeling | Deferred / future phase | Phase 17 established authority wording principles; hidden shell has no full AI-intelligence labeling system. | High | High | Phase 23 | Required before any new AI panel can be trusted. |
| Workflow / Human Factors | Creative-state protection | Deferred / future phase | Phase 17 reduced authority ambiguity; hidden shell has no explicit creative-state protection model. | Medium | High | Phase 25 | Needs interruption, notification, and mode rules. |
| Workflow / Human Factors | Focus integrity | Deferred / future phase | Current shell wraps stable workspace and does not prove reduced attention load. | Medium | High | Phase 22 | Activation should observe whether the wrapper adds noise. |
| Workflow / Human Factors | Interruption rules | Deferred / future phase | No shell-specific interruption policy for AI/chat/alerts exists. | High | High | Phase 23 | Required before proactive intelligence surfaces. |
| Workflow / Human Factors | Attention load | Unknown until activation | Visual density and placeholder burden need live review under the flag. | Medium | High | Phase 18 | Phase 18 can classify, not redesign. |
| Workflow / Human Factors | Long-session fatigue | Exists but stale | Current evidence is historical GUI/test stability, not a long-session Split Command run. | Medium | Medium | Phase 25 | Needs stress and session-duration evidence later. |
| Workflow / Human Factors | Ideation mode transition | Deferred / future phase | No explicit ideation mode in hidden shell. | Medium | Medium | Phase 25 | Future mode system should avoid hidden state mutation. |
| Workflow / Human Factors | Outlining mode transition | Deferred / future phase | Story Navigation exists, but no mode transition model exists. | Medium | High | Phase 25 | Needs one active outline authority preserved. |
| Workflow / Human Factors | Drafting mode transition | Deferred / future phase | Wrapped stable writing surface handles current drafting; no target transition model. | Medium | High | Phase 22 | Needs save/focus authority. |
| Workflow / Human Factors | Editing mode transition | Deferred / future phase | Existing critique/rewrite paths are wrapped, not redesigned into a mode system. | High if rewrite state is hidden. | High | Phase 25 | Preserve Phase 12 editorial workflow contracts. |
| Workflow / Human Factors | Continuity review transition | Deferred / future phase | No target continuity review mode in hidden shell. | High | High | Phase 23 | Needs consistency and provenance model. |
| Workflow / Human Factors | Lore review transition | Deferred / future phase | No target lore review mode in hidden shell. | Medium | Medium | Phase 25 | Requires lore/world source-of-truth. |
| Workflow / Human Factors | Export/publishing transition | Deferred / future phase | Existing export action is wrapped and smoke-covered; no publishing workflow target exists. | High if export claims overstate output readiness. | Medium | Phase 25 | Keep current export authority scoped. |
| Technical Readiness | Runtime flag behavior | Exists and works | Default config is false; YAML can enable; tests cover both. | Low if default-off proof remains green. | High | Phase 18 | Required gate before any activation. |
| Technical Readiness | Default-off proof | Exists and works | `runtimeConfig.test.ts` covers default false; `AppPreflight.test.tsx` covers default stable shell. | Low | High | Phase 18 | Must rerun during Phase 18 execution. |
| Technical Readiness | Activation path | Exists and works | Runtime YAML and renderer override path can enable `experimentalSplitCommandWorkspace`. | Medium: dev/test path only. | High | Phase 18 | Do not broaden activation path in this phase. |
| Technical Readiness | One-monitor viability | Exists and works | Current implementation is one-window by design and covered by renderer tests. | Medium until live smoke. | High | Phase 20 | Viability should be rechecked with real project data. |
| Technical Readiness | Secondary-surface reality | Missing entirely | No second Electron window / monitor-specific Split Command surface is implemented. | High if claimed. | High | Phase 24 | Needs new architecture and fallback rules. |
| Technical Readiness | Mock/placeholder inventory | Exists and works | Placeholder panels are labeled: Narrative Gaps, AI Companion, Global Tools metadata, story-health non-running note. | Medium: inventory can go stale. | High | Phase 18 | Phase 18 should refresh inventory from source after activation. |
| Technical Readiness | Resource/subscription risk | Unknown until activation | Current shell has no new AI subscription flow; future intelligence may add cost/resource pressure. | Medium | Medium | Phase 25 | Must not be invented in docs. |
| Technical Readiness | Large-project scaling risk | Exists but stale | Renderer tests cover 75 story units, but not large real projects or long sessions. | Medium | High | Phase 25 | Good smoke evidence, not scaling proof. |
| Technical Readiness | Fallback/deactivation path | Unknown until activation | Default-off flag is a rollback path, but runtime fallback after activation failure is not proven here. | High | High | Phase 20 | Needs explicit deactivation and recovery behavior before rollout. |

## 6. Future Ownership Map

| Phase | Owner scope |
| --- | --- |
| Phase 18 | Activation, smoke, truth classification, screenshot gap matrix, migration-readiness decision. |
| Phase 19 | Hygiene, stale artifacts, restored-folder sprawl, dead flags/docs cleanup, experimental debris cleanup. |
| Phase 20 | Real GUI architecture foundation, stable one-monitor shell, optional second-window strategy, layout persistence, workspace-state model, fallback path. |
| Phase 21 | Command Center panels, story navigation, emotional pulse, narrative health, story constellation, thread timeline, character arcs, narrative gaps. |
| Phase 22 | Immersive Writing surface, editor, outline/notes sidebars, quick insert, writing tools, focus mode, saved-state indicators. |
| Phase 23 | AI Companion and Contextual Intelligence, AI suggestions, warnings, tension/foreshadow/conflict detection, trust calibration. |
| Phase 24 | True two-monitor workflow, Monitor 1 command center, Monitor 2 writing surface, detached windows, cross-window state sync, monitor disconnect recovery. |
| Phase 25 | Professional hardening, large-project stress, performance, memory, accessibility, beginner/advanced modes, long-session durability. |

## 7. Non-Goals

Phase 18 does not:

- build the screenshot GUI
- enable the hidden shell by default
- create a real two-monitor workflow
- create detachable windows
- add new AI intelligence
- add graph/constellation systems
- add emotional analysis, narrative health, thread risk, character arc analysis, or contextual warnings
- change backend behavior
- change project file schema
- change generation, critique, rewrite, snapshot, recovery, export, backup, or restore contracts
- introduce new layout persistence architecture
- clean restored folders or unrelated hygiene artifacts

## 8. Closure Criteria

Phase 18 can close only when:

- the runtime flag default-off contract is verified
- controlled flag-on activation is verified or failure is explicitly classified
- current shell behavior is smoke-checked against the current evidence baseline
- the target screenshot gap matrix is completed or explicitly marked incomplete with a reason
- mocked, stale, missing, broken, and unknown surfaces are clearly separated
- a continue/repair/stop/defer decision is recorded
- no target feature is claimed as current functionality without source or runtime evidence

Closure rule: Phase 18 cannot close unless the target screenshot gap matrix is completed or explicitly marked incomplete with a reason.

## 9. Assumptions

- The target screenshot is operator-provided design intent, not evidence that the current repo contains those features.
- The current hidden GUI remains the flagged Split Command shell until activation proves otherwise.
- Missing target features are classified and assigned future owners, not built during Phase 18 planning.
- If later inspection contradicts an initial classification, Phase 18 execution updates the matrix rather than forcing evidence to match the screenshot.
