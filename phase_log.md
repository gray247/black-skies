# phase_log.md â€” Phase Log (Source of truth)
**Status:** ACTIVE Â· 2025-09-29

Chronological record of locked decisions and spec/version bumps. One-line summary first, details after.

---

## Open items snapshot
| Item | Owner | Artifact | Blocking PRs | Milestone |
| :--- | :----- | :-------- | :------------ | :--------- |
| Phase 8 docking verification | QA Lead (Jess K.) | `docs/phase8_gui_enhancements.md` checklist; `app/playwright-report/docking/index.html` | #482, #483 | GitHub milestone "Phase 8 - Docking Verification" |

---

## 2025-11-14 Phase 7 tightening (IN PROGRESS)
- Service health UX (port offline) - done
- Budget & analytics UX (indicator, near-cap hints, 402 guardrails in UI) - done
- Error-code-to-toast mapping (budget, analytics, sandbox) - done

## 2025-10-28 Phase 8 docking verification (IN PROGRESS)
- Owner: QA Lead (Jess K.)
- Artifact: `docs/phase8_gui_enhancements.md` checklist, Playwright report `app/playwright-report/docking/index.html`, pytest report `reports/docking-verification.xml`
- Blocking PRs: #482 (renderer docking), #483 (layout persistence service)
- Milestone: GitHub milestone "Phase 8 - Docking Verification"
- Summary: Dock manager integrated via `DockWorkspace`; runtime config toggles docking and preset focus order. Layout persistence writes schema v2 payloads with floating pane metadata; renderer reopens saved windows and hotkeys cover presets plus focus cycling. Vitest covers layout bounds and logging; pytest covers recovery and voice notes. Documentation updated with outstanding manual QA items.

## 2025-10-22 Phase 8 GUI enhancements scope (LOCKED)
- Added Phase 8 planning entry covering IDE-style docking: drag/drop panes, floating windows, and saved layouts.
- docs/gui_layouts.md and docs/architecture.md clarify the locked preset layout and capture serialization/multi-monitor requirements for the upcoming customization work.

## 2025-10-07 â€” Phase 9/11 planning docs added (DRAFT)
- Added planning documents for backup verification daemon (T-9142), dashboard initiatives (T-9143), smart merge tooling (T-9144), offline cache manager (T-9145), and accessibility toggles (T-9146).
- docs/architecture.md, docs/phase_charter.md, docs/gui_layouts.md cross-link the new plans; CHANGELOG/RELEASE/support playbook updated for Phase 9 readiness.

## 2025-10-21 â€” Companion analytics & export summaries (LOCKED)
- Companion overlay now surfaces emotion arc and pacing analytics within the workspace.
- Draft exports emit `analytics_report.json` and `critique_bundle.md` populated from stored batch critiques.

## 2025-09-29 â€” Phase 1 wrap release (LOCKED)
- Version bumped to 1.0.0+phase1 and annotated tag `v1.0.0-phase1` recorded.
- Verified python -m pytest -q and python -m build --wheel --no-isolation for release validation.

## 2025-09-29 - Agents and orchestration scaffolding (LOCKED)
- Created black_skies/agents package with retry-capable base and outline/draft/rewrite/critique agents.
- Added AgentOrchestrator coordinating serial and parallel flows with shared settings.
- Added unit tests covering retry behaviour and orchestration helpers.

## 2025-09-29 â€” Milestone P4.1 release wrap (LOCKED)
- Refreshed documentation set for P4.1, ensuring roadmap, phase logs, and supporting docs are aligned.
- Cut release tag and noted the documentation sweep across milestones and supporting references.
- Verified CI pipelines and documentation build paths after the tagging pass.
- Verification report: [`docs/milestone_p4_1_verification.md`](docs/milestone_p4_1_verification.md).

## 2025-09-29 - Observability baseline (LOCKED)
- Added structured JSON logging with trace IDs for every request and error handler responses.
- Introduced /metrics endpoint and in-memory counters covering HTTP and domain routes.
- Updated RUNBOOK with monitoring guidance for logs, trace IDs, and metrics consumption.

## 2025-09-29 - P0-P3 service refactor (LOCKED)
- Established the lightweight black_skies package with FastAPI endpoints (/outline, /draft, /rewrite, /critique) and unit tests (python -m pytest -q).
- Added storage, critique, export, run ledger, and cache modules with offline wheel manifest and constraints for sandboxed setup.
- Created settings, release/runbook docs, and populated vendor/wheels/ so scripts/setup and scripts/maint run without network access.

## 2025-09-28 â€” Milestone P1 locked (LOCKED)
- Verified P1.2 docs and renderer coverage; Vitest now pulls in `@testing-library/jest-dom` and passes via `pnpm --filter app test`.
- Confirmed service regressions with `PYTHONPATH=services/src python -m pytest` (17 passed) and budget warnings format lint fixes.
- Phase 1 Preflight milestone declared complete; roadmap advances to Critique Accept (P2.0).

## 2025-09-29 â€” Milestone P2 locked (LOCKED)
- Service: `/draft/accept` applies critique diffs, emits snapshots/manifest, and snapshot restore path covered by pytest (`services/tests/test_app.py`).
- Recovery: desktop surfaces banner + restore toast; Vitest ensures happy-path + cleanup (`app/renderer/__tests__/AppRecovery.test.tsx`).
- UI: critique accept/reject flows polished, history surfaced, renderer tests green via `pnpm --filter app test`.

## 2025-09-29 â€” Milestone P3.0 export pipeline (LOCKED)
- Export endpoint compiles `draft_full.md` with deterministic chapter/scene ordering and meta header toggle (`services/src/blackskies/services/app.py`).
- Snapshot persistence now emits `snapshot.yaml` manifests; pytest asserts export success/error + manifest fidelity (`services/tests/test_app.py`).
- Renderer + service suites verified via `corepack pnpm --filter app test` and `PYTHONPATH=services/src python -m pytest`.

## 2025-09-29 â€” Milestone P3.1 packaging (LOCKED)
- Added electron-builder configuration + scripts to emit NSIS installer and portable builds (`app/electron-builder.yml`, `app/package.json`).
- Main process now resolves packaged Python assets; Vite/tsc build pipeline compiles renderer + main before packaging (`app/main/main.ts`, `app/tsconfig.main.json`).
- Authored `docs/packaging.md` with Windows prerequisites, build commands, and verification checks.

## 2025-09-23 â€” Docs synced to Phase 1 (v1)
- Locked and published: docs/endpoints.md (v1), docs/data_model.md (v1), docs/gui_layouts.md (v1), docs/exports.md (v1), docs/policies.md (v1), docs/phase_charter.md (v1),
  docs/architecture.md (v1), docs/agents_and_services.md (v1).
- Scope: Windows 11 only; local-first; CM6 editor; scene cap 20k; emotion tags (5); preflight & budgets.

## 2025-09-24 â€” Preflight docs & renderer coverage (LOCKED)
- Milestone P1.2 complete; documentation and renderer coverage accepted for release.
- Expanded README and docs/endpoints.md with `/draft/preflight` walkthroughs for ok, soft-limit, and blocked responses.
- Added Vitest regression coverage for soft-limit warnings and blocked hard-limit states in the renderer harness.

## 2025-09-25 â€” Milestone 0 automation verified (LOCKED)
- Verified scripts/setup, scripts/maint, scripts/freeze_wheels.sh against Milestone 0 requirements.
- Confirmed requirements.lock, requirements.dev.lock, tooling configs, and wheel cache guard rails are committed.

## 2025-09-17 â€” Phase-1 Definition of Done (LOCKED)
- Wizard: all steps functional; decisions **lock & snapshot**; restore from History works.
- Outline: builds **deterministically** from locked decisions (`OutlineSchema v1`).
- Draft: generate **3 scenes**; store **prompts & seeds** with outputs (`DraftUnitSchema v1`).
- Critique: rubric run; **diff** shown; **Accept/Rollback** applies hunks and snapshots (`CritiqueOutputSchema v1`).
- Export: `outline.json` and `draft_full.md` write without errors.
- Recovery: crash â†’ next launch shows Recovery banner; reopen last project; view diagnostics.
- Performance: **15kâ€“20k** scene edit < **150 ms** avg keystroke; initial diff < **500 ms**.
- Budgets: soft **$5** warn; hard **$10** block with `BUDGET_EXCEEDED`.
- A11y: keyboard path complete; reduced-motion supported; contrast & focus rings per policy.
- Packaging: NSIS installer + portable ZIP produced; app ID set; icons/splash present.

## 2025-09-17 â€” Platform lock (LOCKED)
- 1.0 targets **Windows 11 only**. macOS/Linux deferred postâ€‘1.0.
- Packaging: **NSIS installer** + optional **portable ZIP**.
- Auto-updates disabled for 1.0. No telemetry; diagnostics local-only.

---

## Change control
- Any spec change to **limits, budgets, schemas, error model, a11y, or platform** requires:
  1) Update the relevant doc(s) and bump **Version** if shape/behavior changes.
  2) Add a dated entry here with the new version(s) and a single-sentence rationale.

Template:
```
## YYYY-MM-DD â€” <change summary> (LOCKED|AMENDED)
- Affected docs: <files & versions>
- Rationale: <why>
- Notes: <migration/back-compat if any>
```

