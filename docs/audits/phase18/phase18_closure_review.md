Canonical role: Phase 18 closure review.
Scope: Decide whether Phase 18 is closed, closed with exceptions, or not closed based on actual execution evidence.
Owns: final closure determination, residual exceptions, non-claims, and next-step posture.
Does not own: future implementation work.
Upstream dependencies: [phase18_activation_results.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_activation_results.md), [phase18_hidden_gui_truth_classification.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_hidden_gui_truth_classification.md), [phase18_target_screenshot_gap_results.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_target_screenshot_gap_results.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
Last reviewed: 2026-05-18.
Acceptance record: Manual operator smoke completed on 2026-05-18. Result: `Pass with warnings`.

# Phase 18 Closure Review

## Closure Determination

Determination: `Closed with exceptions`

## Why It Closes

Phase 18 required:

- activation-path inspection
- default-off proof
- flag-on shell selection proof or failure classification
- one-monitor vs two-monitor classification
- real/mock/placeholder classification
- target screenshot gap matrix completion
- future ownership map
- confirmation that the current stable GUI was not broken

Those requirements were met.

## What Phase 18 Proved

- default-off behavior remains intact
- the hidden shell is `SplitCommandWorkspace`
- flag-on selection is real in renderer/source tests
- the shell is a one-window wrapper, not a true two-monitor GUI
- dock floating panes are separate infrastructure and must not be mistaken for Monitor 2
- Story Navigation is real
- Narrative Gaps, AI Companion, and Global Tools are still placeholder or metadata surfaces
- most target screenshot features are still missing entirely
- the shell is worth continuing only as an experimental foundation sketch

## Exceptions

- layout persistence, fallback behavior, cognitive load, long-session durability, and operator trust under sustained use remain unproven

These are exceptions, not hidden omissions.

Resolved follow-up:

- packaged Electron activation now has a clean supported smoke lane through `BLACKSKIES_CONFIG_PATH`
- the old `window.__runtimeConfigOverride` seam is now formally classified as renderer-test-only because it is injected too late for packaged Electron first render in the current shared fixture

## Recommended Posture

- keep the shell experimental only
- do not promote it to default
- continue only after limited repair
- treat future architecture work as Phase 20+ work, not as something Phase 18 already solved

## Manual Smoke Outcome

Manual operator smoke on 2026-05-18 passed with warnings.

- backend drops
  - ownership: `Phase 25`
  - note: if this also reproduces in the stable GUI, treat it as a possible cross-phase blocker rather than a hidden-shell-only warning
- flicker
  - ownership: `Phase 20`
- layout cramming
  - ownership: `Phase 20 / Phase 22`
- Story Navigation discoverability
  - ownership: `Phase 21`
- diagnostics future tool
  - ownership: `Phase 20 or Phase 21`

## Explicit Non-Claims

- Phase 18 does not claim the target screenshot GUI exists today.
- Phase 18 does not claim the shell is ready to replace the stable GUI.
- Phase 18 does not claim a true two-monitor path exists.
- Phase 18 does not claim layout persistence or recovery semantics are proven for the hidden shell.

## Human Verification Still Needed

- layout persistence behavior under the hidden shell
- cognitive load / creative-state / long-session observation
- repeated-launch project identity and fallback behavior
- whether backend drops are hidden-shell-specific or also present in the stable GUI
