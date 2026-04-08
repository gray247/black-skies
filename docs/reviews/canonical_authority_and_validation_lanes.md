# Canonical Authority and Validation Lanes

## Purpose
This document reduces false confidence by naming which docs are authoritative, which are derivative or transitional, and what each validation lane does and does not prove.

## Canonical Authority Map

| Area | Canonical source | Supporting sources | Non-canonical / derivative / transitional sources | Known conflicts or ambiguity |
| --- | --- | --- | --- | --- |
| Phased scope | `docs/phases/phase_charter.md` | `docs/specs/architecture.md`, `docs/BUILD_PLAN.md` | `docs/phase_bridge.md`, `docs/phases/README.md`, review docs, archive docs | `docs/BUILD_PLAN.md` has historically over-claimed authority; treat it as supporting implementation context, not scope authority. |
| Current status / phase progress | `docs/roadmap.md` for the snapshot, with `phase_log.md` as the dated ledger | `docs/phases/phase_log.md` | `docs/BUILD_PLAN.md`, `docs/phase_bridge.md`, review docs | `phase_log.md`, `docs/roadmap.md`, and `docs/phases/phase_charter.md` overlap on status language; the roadmap is the current snapshot, while the phase logs record locked history. |
| Architecture boundaries | `docs/specs/architecture.md` | `docs/specs/data_model.md`, `docs/specs/endpoints.md`, `docs/specs/agents_and_services.md`, `docs/gui/gui_layouts.md` | `docs/BUILD_PLAN.md`, `docs/phase_bridge.md`, review docs | `docs/BUILD_PLAN.md` references architecture work but does not override the spec. |
| Testing / validation guidance | `docs/reviews/canonical_authority_and_validation_lanes.md` for lane meanings; `docs/reviews/test_taxonomy_and_truth_matrix.md` for current classification; `docs/reviews/truth_lane_definition_and_gap_report.md` for the current truth-lane path; `docs/reviews/preload_hook_inventory_and_containment.md` for hook containment; `docs/tests.md` as a practical guide | `docs/ops/repo_hygiene.md`, `docs/phases/phase_charter.md`, `docs/roadmap.md` | `docs/tests.md` when read as an older gate map, smoke-only launchers, UI-only harness docs, review artifacts | `docs/tests.md` should not be treated as the source of lane truth; the taxonomy matrix, truth gap report, and preload hook inventory are the classification references. |
| Operational hygiene guidance | `docs/ops/repo_hygiene.md` | `.gitignore`, repo hygiene scripts, local hook installer docs | generated reports, backup files, cache directories, review artifacts | Hygiene policy is stable; generated artifacts should not be treated as active documentation. |

## Current Authority Conflicts

- `phase_log.md`, `docs/roadmap.md`, and `docs/phases/phase_charter.md` overlap on scope and status wording.
- `docs/phases/README.md` combines index language with authority claims, which can make it sound more canonical than it is.
- `docs/BUILD_PLAN.md` still reads like a broad authoritative roadmap even though the phase charter and roadmap are the stronger live references.
- `docs/tests.md` is an older gate map and can be mistaken for current validation authority.
- `docs/phase_bridge.md` is transition guidance, not live scope authority.

## Validation Lane Definitions

### Truth lane
The truth lane exists to prove real-service behavior against the canonical production boundary.

- What it is for: confirming that the system works when the real service path is exercised.
- What it can prove: backend contracts, real-service routing, architecture boundary behavior, and interactions that do not depend on injected harness state.
- What it cannot prove: UI polish, harness correctness by itself, or behavior that only exists because a test hook changed the environment.
- What should never be overclaimed: smoke-only e2e coverage, UI-only workflows, or any result produced while hidden test globals are standing in for production conditions.

### UI-only lane
The UI-only lane exists to prove presentation, workflow, and interaction behavior that does not assert backend truth.

- What it is for: renderer behavior, visual workflow checks, and user-facing presentation paths.
- What it can prove: that the UI responds correctly to the harnessed scenario.
- What it cannot prove: real-service readiness, backend contract correctness, or architecture boundary integrity.
- What should never be overclaimed: claims that a passing UI-only flow proves production truth.

### Harness lane
The harness lane exists to validate the test harness, launchers, and fixture glue itself.

- What it is for: launcher behavior, fixture wiring, hook execution, and test orchestration sanity.
- What it can prove: that the harness is wired the way the test expects.
- What it cannot prove: production correctness, service correctness, or truth-lane readiness.
- What should never be overclaimed: any architecture or backend claim based only on a harness pass.

### Backend contract/state lane
The backend contract/state lane exists to prove API shapes, error handling, and service state transitions in the backend layer.

- What it is for: HTTP contract checks and backend state transition coverage.
- What it can prove: response shapes, status codes, and backend state behavior.
- What it cannot prove: renderer reachability, UI health, or whether a UI test path used the real service.
- What should never be overclaimed: end-to-end readiness or UI correctness from backend-only coverage.

### Renderer/unit lane
The renderer/unit lane exists to prove local component and adapter behavior.

- What it is for: Vitest or similar local logic checks.
- What it can prove: component behavior, adapter logic, and renderer-level regressions.
- What it cannot prove: service integration, production routing, or truth-lane readiness.
- What should never be overclaimed: backend or architecture proof from local unit tests alone.

### Repo hygiene lane
The repo hygiene lane exists to prove the tracked tree is clean and that generated artifacts are not polluting review signals.

- What it is for: tracked-file hygiene, diff cleanliness, and banned artifact detection.
- What it can prove: the repository is not hiding junk in tracked paths and the working tree is reviewable.
- What it cannot prove: correctness, architecture integrity, or lane trustworthiness.
- What should never be overclaimed: product quality or truth-lane readiness from a clean tree alone.

## Authoritative Validation Commands

Commands are grouped by lane. The truth lane section is the one that should be used for architecture claims.

### Truth lane

- `pnpm test:truth`
- Launcher path: `scripts/truth-with-backend.mjs`

Use these only for real-service truth claims. Do not treat smoke-only, UI-only, or harness-only runs as equivalent. The launcher path is explicit and does not use the smoke fallback from `scripts/e2e-with-backend.mjs`.

### Playwright (UI-only)

- `pnpm --dir app exec playwright test tests/e2e/visual.home.spec.ts --project=electron --workers=1`
- `pnpm --dir app exec playwright test tests/e2e/a11y.smoke.spec.ts --project=electron --workers=1`

Use this for presentation and interaction checks only. It is not truth-bearing. Note: a previously cited
`editorial-review-workflow.spec.ts` is not present in the current repo inventory and must not be treated as an authoritative lane command.

### Harness lane

- `git hook run pre-commit`

Use this to validate hook wiring and staged-path scanning. It proves harness execution, not product correctness.

### Backend contract/state lane

- `python -m pytest services/tests/test_analytics_endpoints.py -q`
- `python -m pytest services/tests -q`

Use these for backend contract and state checks. They do not prove renderer truth.

### Renderer/unit lane

- `pnpm --filter app test`

Use this for renderer/component logic. It does not prove real-service behavior.

### Repo hygiene lane

- `python scripts/check_repo_hygiene.py --tracked`
- `python scripts/check_repo_hygiene.py --staged`
- `git diff --check`

Use these to prove the tracked tree is clean and that no banned generated artifacts are leaking into review.

## Documentation Change Rules

- Do not duplicate phase truth casually.
- Derivative docs must link back to the canonical doc for the area they summarize.
- Archived or deferred docs must not read like live scope authority.
- Testing docs must state whether a command proves truth, UI behavior, harness behavior, backend contract behavior, renderer behavior, or repo hygiene.
- If a command only proves a lane-specific subset, say so explicitly.

## Immediate Follow-on Work Enabled by This

- Truth-lane vs UI-only test taxonomy cleanup.
- Preload and test-hook containment.
- Fixture dependency cleanup.
- Canonical validation path enforcement in docs and tests.
- Further reduction of authority drift in phase and roadmap references.
