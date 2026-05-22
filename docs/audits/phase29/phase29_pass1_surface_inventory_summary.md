# Phase 29 Pass 1 Surface Inventory Summary

Status: Draft inventory complete
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 1 - Surface Inventory

## Scope Inspected

This pass inspected the bounded source areas required by the Phase 29 prompt and the correction-block execution plan.
It created initial inventories only.
It did not make final product policy decisions, begin Phase 30, change runtime code, renumber phases, or insert Candidate Phase 32.

## Source Areas Inspected

- `docs/audits/phase28_31/phase28_31_execution_plan.md`
- `docs/audits/phase28/phase28_authority_audit_closure.md`
- `docs/audits/phase28/runtime_truth_alignment_notes.md`
- `docs/audits/phase28_31/decision_log.md`
- `docs/audits/phase29/phase29_issue_risk_error_reconciliation.md`
- `app/renderer/App.tsx`
- `app/renderer/components/`
- `app/renderer/components/docking/`
- `app/renderer/components/workspace/`
- `app/renderer/commands/commandRegistry.ts`
- `app/renderer/testMode/`
- `app/renderer/__tests__/`
- `app/tests/e2e/`
- `app/main/preload.ts`
- `app/electron/preload.ts`
- `app/main/projectLoaderIpc.ts`
- `app/main/layoutIpc.ts`
- `app/shared/ipc/`
- `app/shared/config/runtime.ts`
- `app/shared/modePolicy.ts`
- `docs/gui/README.md`
- `docs/gui/gui_fix_plan.md`
- `docs/gui/gui_layouts.md`
- `docs/specs/design_system_v1.md`
- `docs/specs/workflow_spine.md`
- `docs/specs/pane_lifecycle.md`
- `docs/specs/layout_persistence.md`
- `docs/specs/editorial_workflow_contract.md`
- `docs/specs/generation_scope.md`

## Source Areas Intentionally Excluded

- Backend service internals were excluded because Phase 29 Pass 1 focused on user-visible, control, and dev/test surfaces.
- Broad repo-wide YAML/config searches were excluded after a preliminary recursive command hit inaccessible `.codex-*` temp folders.
- Unlisted docs under `docs/gui/` and `docs/specs/` were excluded to preserve the bounded source list.
- Full CSS/style auditing was excluded because visibility evidence was available from runtime components and layout metadata.

No source boundary was expanded beyond the approved plan.

## Inventory Counts

| Artifact | Prefix | Rows |
| --- | --- | ---: |
| `docs/audits/phase29/gui_surface_inventory.md` | `P29-SURF` | 15 |
| `docs/audits/phase29/tool_button_control_inventory.md` | `P29-CTRL` | 20 |
| `docs/audits/phase29/dev_surface_initial_findings.md` | `P29-DEV` | 9 |
| Total | all | 44 |

## User-Facing vs Dev-Only Counts

| Classification | Rows |
| --- | ---: |
| user_facing | 35 |
| dev_only | 9 |

## Runtime-Backed vs Placeholder Counts

| Classification | Rows |
| --- | ---: |
| runtime_backed | 29 |
| partial | 8 |
| experimental_flagged | 3 |
| mock | 1 |
| unknown | 3 |
| placeholder | 0 |
| future_only | 0 |
| historical | 0 |

## High-Risk Items Found

- `P29-SURF-002`: Workspace Header collects many unrelated actions in a single toolbar.
- `P29-SURF-006`: Story Insights / Analytics Dashboard mixes runtime UI with partial or future intelligence claims.
- `P29-SURF-008`: Relationship Graph is hidden by default and analytics-dependent.
- `P29-SURF-010`: Critique surface includes non-mutative critique and mutative rewrite controls.
- `P29-SURF-012`: Companion Overlay has local/model insight surfaces that need intelligence classification.
- `P29-SURF-013`: Snapshots and Verification Panel exposes high-impact backup and restore controls.
- `P29-SURF-015`: Split Command Workspace is experimental-flagged and must not be promoted as stable product workflow.
- `P29-CTRL-003`: Generate Draft is mutative and paired with scope controls and preflight warnings.
- `P29-CTRL-011`: Backup and restore controls need later visibility and safety classification.
- `P29-CTRL-017`: Command registry entries exist, but direct product command-palette exposure was not confirmed.
- `P29-DEV-003`: `__testInsights` can alter visible service status and scene selection in tests.

## Ambiguous Items Requiring Later Phase 29 Passes

- `P29-SURF-009`: Timeline / History pane is declared in layout metadata and docs, but rendering evidence was not confirmed in App pane mapping during this pass.
- `P29-DEV-005`: Diagnostics bridge has both user-support and test-diagnostic implications.
- `P29-DEV-008`: Test UI sandbox exists but runtime usage was not verified in this pass.
- `P29-DEV-009`: Phase 4 mock flow flag requires later containment or retirement review.
- `P29-CTRL-006`: Export controls are visible, but current proof should not be interpreted as save/export pipeline proof.

## Gaps Requiring Later Phase 29 Passes

- Workflow Mapping must connect the inventoried surfaces to actual user journeys and duplicate entry points.
- Intelligence Audit must classify Story Insights, Companion Overlay, Relationship Graph, analytics docs, and command-center claims.
- Dev vs Production Audit must separate test harness bridges, diagnostics, stable visual modes, and product support surfaces.
- Keep/Merge/Hide/Delete Matrix must assign final dispositions after human review.
- Line-level verification can be deepened for low-confidence rows where Pass 1 used component/file evidence.

## Stop Conditions

No stop condition was triggered.

- Runtime-backed versus placeholder classification was possible at the inventory level.
- User-facing versus dev-only classification was possible for major surfaces.
- Source boundaries stayed bounded.
- Required artifacts were produced.
- Phase 29 did not begin Phase 30 policy decisions.

## Pass 2 Readiness

Phase 29 Pass 2 may begin after operator review of this inventory pass.
Pass 2 should map workflows using these stable IDs and should not revise IDs silently.
