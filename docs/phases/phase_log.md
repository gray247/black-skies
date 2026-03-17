Status: Active
Version: 1.2
Last Reviewed: 2026-03-15

# Phase log - change history
> Each entry corresponds to the scope tracked in `docs/BUILD_PLAN.md`.

**2025-09-15** - Locked Phase Charter v1.0 (original RC scope)
**2025-10-09** - Added Phase 8-11 roadmap (~30 feature expansion) and unlocked v1.1 docs
**2025-10-10** - P7 RC packaging complete, tagged `v1.0.0-rc1`, smoke + offline docs verified
**2025-10-15** - P8 companion overlay + batch critique UI landed; budget meter added to workspace header
**2026-03-15** - Backend milestone complete (P8 window): API-backed long-form execution loop verified. Routing policy `api_only` with `long_form.prefer_api` confirmed. Chunk persistence under `.blackskies/long_form/chunks`, per-chunk diagnostics under `.blackskies/long_form/diagnostics`, UTF-8 markdown persistence verified. Evidence chunks: `lf_5d6da836`, `lf_52501598`. Engine progression continues.
**2026-03-15** - Engine sequencing note: UI docking/accessibility polish remains important but is treated as non-blocking for core writing-engine progression. Next engine milestone focus: rewrite/critique loop, acceptance/retry logic, and quality gates.
**2026-03-15** - P8 remained closed for engine sequencing and roadmap progression, but the UI closeout is now treated as a tracked exception set rather than a fully repo-evidenced finish. See `docs/phases/phase8_ui_gate_closeout.md` and `docs/phases/phase8_verification_report.md`.
**2026-03-16** - Long-form reliability/control remains active. The engine now includes bounded borderline recovery retry, stronger-model escalation on retry, and outline-faithful rewrite guardrails (outline/scene anchors, length band, uncertainty persistence). Evidence still does not meet the near-zero-unexpected-failure exit bar, so the current phase stays open.
**2026-03-16** - Sequencing updated: the next engine milestone after reliability/control closeout is an outline-faithful editorial-partner phase. Rewrites must trail the outline, preserve scene intent and length band, and avoid autonomous story invention. Agent hooks and UI exceptions remain deferred.
**2026-03-16** - Rescue-mode pass landed: the stronger retry path now uses a precision rescue-edit contract with rescue-specific diagnostics and evaluation aggregates. Adversarial fresh-server samples remained healthy; clean fresh-server samples still failed, so the phase remains open.
**2026-03-16** - Rescue architecture upgraded again: the stronger retry path now uses span-level patch rescue instead of full-scene rescue rewriting. Local patch validation and splice-back are test-covered. Fresh-server evidence on the new code is currently blocked in this environment by provider `401 Unauthorized`, so the phase remains open.

## Upcoming milestones
- ~~**P7 - RC1:** Smoke tests complete; publish quickstart.~~ *(closed 2025-10-10)*
- ~~**P8 - Companion overlay + batch critique prototype.**~~ *(landed 2025-10-15; engine milestone stays closed)*
- **P8 follow-up exceptions:** unresolved UI verification and scope gaps remain tracked without reopening the engine milestone. See `docs/phases/phase8_ui_gate_closeout.md`.
- **Current engine closeout:** reliability/control for long-form rewrite recovery and outline-faithful guardrails must reach near-zero unexpected failures before progression.
- **P9:** Analytics visualisations + dashboard integration.
- **P10:** Accessibility & export suite.
- **P11:** Agents & plugin framework.

## Open follow-up items
- Track **budget constant reuse**: replace hard-coded `0.02` pricing in `DraftGenerationService` with `COST_PER_1000_WORDS_USD` and audit for other stragglers.
- Simplify **fingerprint generation** by relying on `json.dumps(..., sort_keys=True)` (no manual override sorting) and update tests to assert determinism.
- Document and standardise **threadpool usage** (`run_in_threadpool` vs `asyncio.to_thread`), and schedule tests/docs for the recovery state machine and snapshot validation scenarios.
- Harden budget meter with **live spend telemetry** (generation + critique) and persist the latest ledger snapshot for recovery screens.
- Track **Phase 8 follow-up exceptions** without reopening P8:
  - rubric editor scope gap versus the broader persisted-rubric docs
  - multi-tone rewrite options not shipped in current UI/API
  - PDF feedback export not shipped
  - live analytics/model-cost telemetry currently disabled in the budget hook
  - rubric-flow automation missing in Vitest/Playwright
  - manual docking smoke and keyboard-only walkthrough evidence incomplete in repo
  - docking/closeout docs still need wording alignment

- **2025-11-20** - Human verification run logged; C4.2 snapshot/verification UI polish and C5 analytics refinement remain open, refs: `work/phase6/verification_notes.md`, `docs/phases/phase6_passoff.json`.

---

## Phase deliverables & status index

| Phase | Charter section | Owner | Status | Scope snapshot | Tests / gates |
| :---- | :-------------- | :---- | :----- | :------------- | :------------ |
| P7 | Charter §7 | Release engineering | Locked 2025-10-10 | RC packaging + docs | `pnpm --filter app test`, smoke scripts |
| P8 | Charter §8 | Desktop UI | Closed with follow-up exceptions | Companion overlay, batch critique, rubric editor, docking resilience | Engine milestone closed; UI verification exceptions tracked in `docs/phases/phase8_ui_gate_closeout.md` |
| P9 | Charter §9 | Analytics squad | Planned | Emotion arc, pacing, dashboard | Planned Playwright + analytics contracts |
| P10 | Charter §10 | Accessibility | Planned | Voice notes, contrast mode, exports | Axe automation + export diff suite (planned) |
| P11 | Charter §11 | Extensions | Planned | Agent hooks, plugin registry, backup services | Plugin contract tests (planned) |

For scope details see `docs/phases/phase_charter.md`. For execution status see `docs/roadmap.md`.
