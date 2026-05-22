# Phase 29 Pass 2 Workflow Mapping Summary

Status: Draft mapping complete
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 2 - Workflow Mapping

## Workflows Mapped

| Workflow ID | Workflow | Risk |
| --- | --- | --- |
| `P29-WFLOW-001` | project open/create | medium |
| `P29-WFLOW-002` | writing/editing | high |
| `P29-WFLOW-003` | generation/preflight | high |
| `P29-WFLOW-004` | critique/rewrite | high |
| `P29-WFLOW-005` | outline/wizard planning | medium |
| `P29-WFLOW-006` | pane/docking/layout management | high |
| `P29-WFLOW-007` | story insights/analytics | high |
| `P29-WFLOW-008` | companion overlay | high |
| `P29-WFLOW-009` | relationship graph | high |
| `P29-WFLOW-010` | snapshots/backup/restore | high |
| `P29-WFLOW-011` | recovery/service health/offline | high |
| `P29-WFLOW-012` | Split Command experimental navigation | high |
| `P29-WFLOW-013` | command registry and dev/test diagnostic workflows | high |

## Duplicate Or Overlapping Entry Points Found

- Project open appears through Project Home dialog, recent projects, and command registry.
- Generation appears through Workspace Header controls, Preflight Modal, and command registry.
- Snapshot creation appears through Workspace Header, Wizard lock flow, Snapshots Panel, and command registry.
- Verification appears in Workspace Header and Snapshots Panel.
- Story Insights, Companion Overlay, Relationship Graph, and analytics docs overlap as partial intelligence surfaces.
- Docking/layout management appears through pane titlebars, hidden-pane controls, preset/reset controls, hotkeys, persisted layout, and stable test flags.
- Split Command overlaps the stable docked workspace, outline/wizard planning, Corkboard, and Writing Surface concepts while remaining experimental-flagged.
- Diagnostics and service/offline controls overlap real support behavior and test harness behavior.

## High-Risk Workflows

- `P29-WFLOW-002`: Writing/editing is currently represented through Project Home / Draft Preview and needs careful future separation from status and project-entry behavior.
- `P29-WFLOW-003`: Generation/preflight mutates draft state and depends on scope clarity.
- `P29-WFLOW-004`: Critique/rewrite mixes non-mutative critique with mutative rewrite/apply controls.
- `P29-WFLOW-006`: Pane/docking/layout management exposes machinery that can interrupt authoring.
- `P29-WFLOW-007`, `P29-WFLOW-008`, `P29-WFLOW-009`: intelligence-adjacent workflows require Pass 3 classification before capability claims.
- `P29-WFLOW-010`: Snapshot/backup/restore contains high-impact persistence and recovery controls.
- `P29-WFLOW-011`: Recovery/service health/offline workflows mix support controls with diagnostic/test-adjacent behavior.
- `P29-WFLOW-012`: Split Command is experimental and must not be promoted as stable workflow.
- `P29-WFLOW-013`: Command registry and dev/test diagnostic workflows can mirror or influence user-visible behavior.

## Unresolved Workflow Ambiguities

- Whether the Timeline / History pane is dormant, hidden, or represented by another surface remains unresolved from Pass 1.
- Whether command registry entries are only metadata or intended command-palette/product entry points remains unresolved.
- Whether diagnostics are product support UX, dev/test UX, or both must be separated in Pass 4.
- Whether Story Insights, Companion Overlay, and Relationship Graph provide runtime-backed intelligence, partial analytics, or placeholder/future claims must be classified in Pass 3.
- Whether snapshot, verification, backup, restore, and export controls should remain header-visible is a Pass 5 disposition question.

## Stop Conditions

No stop condition was triggered.

- Workflows were mapped without changing runtime code.
- Stable Pass 1 IDs were preserved.
- Only `P29-WFLOW` IDs were added.
- Phase 30 product policy decisions were not made.
- Future intelligence was not promoted as runtime capability.

## Pass 3 Readiness

Phase 29 Pass 3 may begin after operator review of this mapping pass.
Pass 3 should focus on intelligence classification for `P29-WFLOW-007`, `P29-WFLOW-008`, and `P29-WFLOW-009`, plus related command-center and analytics claims.
