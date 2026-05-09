# Phase 13 Pass 9 - Feature Flag + Canonical GUI Decision Record

Status: Completed
Reviewed: 2026-05-09

## Summary

The current canonical production GUI is the flag-off workspace shell. The Split Command workspace remains experimental and hidden behind `ui.experimental_split_command_workspace`.

No feature flag defaults changed in this pass.

## Evidence Inspected

- `app/shared/config/runtime.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
- `app/renderer/__tests__/runtimeConfig.test.ts`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/__tests__/AppCritique.test.tsx`
- `docs/phases/phase11b_implementation_plan.md`
- `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md`
- `docs/audits/phase13/pass7_snapshot_report_path_integrity_fix.md`

## Feature Flag Inventory

| Flag / control | Default | Defined in | Enabled through | Affected path | Current status |
| --- | --- | --- | --- | --- | --- |
| `ui.experimental_split_command_workspace` / `experimentalSplitCommandWorkspace` | `false` | `app/shared/config/runtime.ts` | `config/runtime.yaml` or `window.__runtimeConfigOverride` in tests | `App.tsx` renders `SplitCommandWorkspace` | Experimental hidden GUI |
| `ui.enable_docking` / `enableDocking` | `false` | `app/shared/config/runtime.ts` | `config/runtime.yaml` or harness overrides | `App.tsx` renders `DockWorkspace` when eligible | Alternate docked layout route, not Split Command |
| `ui.hotkeys.enable_preset_hotkeys` | `true` | `app/shared/config/runtime.ts` | `config/runtime.yaml` | Dock hotkeys | Supporting behavior |
| `ui.hotkeys.focus_cycle_order` | default pane order | `app/shared/config/runtime.ts` | `config/runtime.yaml` | Dock focus cycling | Supporting behavior |
| `window.__runtimeConfigOverride` | none | renderer tests / e2e harness | test-only window override | Can force UI flags in tests | Harness-only |

## Production / Default GUI

`App.tsx` computes:

- `splitCommandWorkspaceEnabled = runtimeUi?.experimentalSplitCommandWorkspace === true`
- `dockingEnabled = runtimeUi?.enableDocking === true && !isFloatingHost && !isStableHomeMode`

The production default is therefore the current flag-off workspace path. `DEFAULT_RUNTIME_CONFIG.ui.experimentalSplitCommandWorkspace` is `false`, and `DEFAULT_RUNTIME_CONFIG.ui.enableDocking` is also `false`.

## Experimental / Hidden GUI

The Split Command workspace is experimental. It is available only when `ui.experimental_split_command_workspace: true` is supplied in runtime YAML or a test override sets `experimentalSplitCommandWorkspace: true`.

The Split Command path wraps existing stable surfaces and remains a future-facing shell foundation, not the shipping default.

## Conditions Before Switching Default GUI

- Human verification must confirm the production shell workflow remains understandable.
- Snapshot/report controls must no longer rely on operator guesswork.
- Split Command must have parity for generation, critique, snapshot, export, recovery, and scene selection workflows.
- Tests must cover flag-off and flag-on paths without stale label assumptions.
- Docs and tracker must explicitly record the default switch decision.
- The switch must be reversible through configuration.

## Risks If Switched Too Early

- Operators may see the newer shell before snapshot/recovery/report authority is clear.
- Hidden placeholder surfaces could be mistaken for shipped intelligence.
- Existing e2e and truth harnesses could start validating a different shell than production users expect.
- Feature-flag drift could make CI green while the actual default user path is weak.

## Decision

Keep the flag-off production shell as default.

Do not promote Split Command in Phase 13. Revisit only after Pass 14 human verification and a separate default-switch decision record.
