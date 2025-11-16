Status: Active
Version: 1.1
Last Reviewed: 2025-11-15

# Phase log — change history
> Each entry corresponds to the scope tracked in `docs/BUILD_PLAN.md`.

**2025-09-15** — Locked Phase Charter v1.0 (original RC scope)
**2025-10-09** — Added Phase 8–11 roadmap (~30 feature expansion) · unlocked v1.1 docs
**2025-10-10** — P7 RC packaging complete · tagged `v1.0.0-rc1` · smoke + offline docs verified
**2025-10-15** — P8 companion overlay + batch critique UI landed; budget meter added to workspace header

## Upcoming milestones
- ~~**P7 — RC1:** Smoke tests complete; publish quickstart.~~ *(closed 2025-10-10)*
- ~~**P8 — Companion overlay + batch critique prototype.**~~ *(landed 2025-10-15; remaining docking verification tracked in `docs/phases/phase8_gui_enhancements.md`)*
- **P8 (remaining):** Docking persistence + accessibility sign-off (QA runs 2026-01-15/16).
- **P9:** Analytics visualisations + dashboard integration.
- **P10:** Accessibility & export suite.
- **P11:** Agents & plugin framework.

## Open follow-up items
- Track **budget constant reuse**: replace hard-coded `0.02` pricing in `DraftGenerationService` with `COST_PER_1000_WORDS_USD` and audit for other stragglers.
- Simplify **fingerprint generation** by relying on `json.dumps(..., sort_keys=True)` (no manual override sorting) and update tests to assert determinism.
- Document and standardise **threadpool usage** (`run_in_threadpool` vs `asyncio.to_thread`), and schedule tests/docs for the recovery state machine and snapshot validation scenarios.
- Harden budget meter with **live spend telemetry** (generation + critique) and persist the latest ledger snapshot for recovery screens.

---

## Phase deliverables & status index

| Phase | Charter section | Owner | Status | Scope snapshot | Tests / gates |
| :---- | :--------------- | :----- | :----- | :------------- | :------------ |
| P7 | Charter §7 | Release engineering | ✅ Locked 2025-10-10 | RC packaging + docs | `pnpm --filter app test`, smoke scripts |
| P8 | Charter §8 | Desktop UI | 🚧 In progress | Companion overlay, batch critique, rubric editor, docking resilience | Vitest/Playwright, manual smoke & a11y (2026-01-15/16) |
| P9 | Charter §9 | Analytics squad | ⏳ Planned | Emotion arc, pacing, dashboard | Planned Playwright + analytics contracts |
| P10 | Charter §10 | Accessibility | ⏳ Planned | Voice notes, contrast mode, exports | Axe automation + export diff suite (planned) |
| P11 | Charter §11 | Extensions | ⏳ Planned | Agent hooks, plugin registry, backup services | Plugin contract tests (planned) |

For scope details see `docs/phases/phase_charter.md`. For execution status see `docs/roadmap.md`.
