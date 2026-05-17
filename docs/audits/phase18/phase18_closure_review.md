Canonical role: Phase 18 closure review.
Scope: Decide whether Phase 18 is closed, closed with exceptions, or not closed based on actual execution evidence.
Owns: final closure determination, residual exceptions, non-claims, and next-step posture.
Does not own: future implementation work.
Upstream dependencies: [phase18_activation_results.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_activation_results.md), [phase18_hidden_gui_truth_classification.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_hidden_gui_truth_classification.md), [phase18_target_screenshot_gap_results.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_target_screenshot_gap_results.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
Last reviewed: 2026-05-17.
Acceptance record: No operator acceptance recorded yet.

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

- packaged Electron activation through `window.__runtimeConfigOverride` is not reliable in the current harness lane
- live Electron activation is only partially proven automatically
- layout persistence, fallback behavior, cognitive load, long-session durability, and operator trust under sustained use remain unproven
- no operator/human verification was performed in this phase

These are exceptions, not hidden omissions.

## Recommended Posture

- keep the shell experimental only
- do not promote it to default
- continue only after limited repair
- treat future architecture work as Phase 20+ work, not as something Phase 18 already solved

## Explicit Non-Claims

- Phase 18 does not claim the target screenshot GUI exists today.
- Phase 18 does not claim the shell is ready to replace the stable GUI.
- Phase 18 does not claim a true two-monitor path exists.
- Phase 18 does not claim layout persistence or recovery semantics are proven for the hidden shell.

## Human Verification Still Needed

- live flag-on operator launch from a normal local build
- visible confirmation that Split Command renders as expected outside the harness
- layout persistence behavior under the hidden shell
- cognitive load / creative-state / long-session observation
- project identity and fallback behavior during repeated launches
