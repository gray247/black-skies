Canonical role: Lightweight manual operator smoke checklist for Phase 18 hidden Split Command verification.
Scope: Verify the hidden shell locally under the flag without promoting it, redesigning it, or broadening scope beyond Phase 18.
Owns: manual launch/inspection checklist, stop gates, and tiny report format.
Does not own: runtime changes, test changes, Phase 19 cleanup, or future GUI architecture work.
Upstream dependencies: [phase18_activation_results.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_activation_results.md), [phase18_hidden_gui_truth_classification.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_hidden_gui_truth_classification.md), [phase18_closure_review.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_closure_review.md)
Last reviewed: 2026-05-18.
Acceptance record: Manual operator smoke completed on 2026-05-18. Result: `Pass with warnings`.

# Phase 18 Operator Smoke Checklist

## Purpose

This is a manual Phase 18 verification pass for the hidden Split Command shell.

- It does not promote the hidden GUI.
- It does not start Phase 19 or Phase 20.
- It only checks whether the hidden shell behaves as expected under the flag.

## Latest Findings

Manual operator smoke on 2026-05-18 classified the hidden shell as `Pass with warnings`.

- backend drops
  - owner: `Phase 25`
  - note: possible cross-phase blocker if the stable GUI also drops
- flicker
  - owner: `Phase 20`
- layout cramming
  - owner: `Phase 20 / Phase 22`
- Story Navigation discoverability
  - owner: `Phase 21`
- diagnostics future tool
  - owner: `Phase 20 or Phase 21`

## Pre-Checks

- Workflow should be green before starting.
- Working tree should be clean.
- Stable GUI should launch normally before testing the hidden GUI.
- Do not run cleanup before this smoke unless absolutely necessary.

## Stable GUI Baseline

Verify before any hidden-shell launch:

- app launches normally without the hidden flag
- current/stable GUI remains default
- active project identity looks correct
- no obvious startup error appears
- hidden Split Command shell does not appear accidentally

## Hidden GUI Activation

Known activation method:

Create a temporary runtime YAML:

```yaml
ui:
  enable_docking: false
  experimental_split_command_workspace: true
```

Launch Electron with `BLACKSKIES_CONFIG_PATH` pointing to that file.

Operator-local examples, adapt as needed:

```powershell
$env:BLACKSKIES_CONFIG_PATH = "C:\path\to\temp-runtime.yaml"
pnpm --filter app dev
```

```powershell
$env:BLACKSKIES_CONFIG_PATH = "C:\path\to\temp-runtime.yaml"
pnpm --filter app run build:production
pnpm --dir app exec electron dist-electron/main/main.js
```

Remove the env var or close the shell session after the smoke.

## Hidden Shell Checks

Verify:

- hidden Split Command shell opens
- project identity is correct
- one-window layout appears
- `Command Center` area exists
- `Writing Studio` area exists
- `Story Navigation` appears if expected for the loaded project
- no true two-monitor workflow is implied
- mock/placeholder panels are visibly understood as mock/placeholder
- no panel pretends to be production intelligence
- no obvious console crash/error appears
- app remains usable for a few minutes
- disabling or removing the flag returns to stable GUI

## Rabbit-Hole Control

If something is wrong, classify it immediately:

- `Fix now`
  - only if it blocks launching stable GUI, breaks default-off behavior, corrupts project identity, or makes mock data appear real
- `Defer to Phase 20`
  - layout persistence, workspace-state model, fallback behavior, shell architecture issues
- `Defer to Phase 21`
  - missing Command Center panels
- `Defer to Phase 22`
  - missing Writing Studio/editor/notes/quick insert/focus mode features
- `Defer to Phase 23`
  - AI companion, contextual intelligence, trust calibration
- `Defer to Phase 24`
  - true two-monitor/detached workspace behavior
- `Defer to Phase 25`
  - long-session durability, cognitive load, accessibility, performance scale

## Stop Gates

Stop and report immediately if:

- stable GUI no longer launches
- hidden GUI appears without flag
- project identity is wrong or dangerous
- hidden shell crashes on launch
- disabling the flag does not return to stable GUI
- mock/placeholder data appears as real production output

## Report Format

Keep the result tiny:

- Stable GUI baseline: `pass` / `fail`
- Hidden shell launch: `pass` / `fail`
- Project identity: `correct` / `wrong`
- One-window shell: `yes` / `no`
- Two-monitor behavior: `absent` / `present` / `unclear`
- Mock/placeholder confusion: `none` / `some` / `severe`
- Console errors: `none` / `minor` / `severe`
- Fallback to stable GUI: `pass` / `fail`
- Overall classification:
  - `okay to proceed to Phase 19`
  - `fix narrow blocker first`
  - `defer to Phase 20+`
  - `stop and investigate`

No screenshots are required unless a weird or failing state appears.
