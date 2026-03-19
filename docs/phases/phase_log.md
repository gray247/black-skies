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
**2026-03-17** - Long-form reliability/control closeout now uses an explicit phase-exit runbook rather than ad hoc tiny rerun samples. See `docs/runbooks/long_form_rescue_phase_exit.md` for the replay regression pack, bounded live confirmation sample, and class-based close criteria.
**2026-03-17** - Long-form rescue-plumbing / reliability-control closeout is complete. Deterministic rescue-path issues such as slot binding/aliasing, stale-target handling, followthrough credit, and repair-only sentence-slot collapse were fixed and remained covered by replay. The bounded live sample landed at clean `6/10` and adversarial `5/5`; the remaining clean misses were classified as generation-side (`dialogue_grounding_unresolved`, `patch_dialogue_grounding_unresolved`, `patch_specificity_unresolved`) rather than plumbing regressions, so remaining work moves into generation-variance mitigation / editorial reliability.
**2026-03-17** - Next engine phase defined: **Outline-Faithful Editorial Reliability**. This phase focuses on generation-side rewrite/rescue variance, not bounded-slot plumbing. Priority workstreams are rescue model strategy by failure class, editorial prompt strategy for outline-faithful rescue, and generation-variance measurement on stable replay fixtures plus bounded live samples. The first milestone is a conditional stronger-model rescue trial for generation-side classes only.
**2026-03-18** - Rescue-model bakeoff completed on the repaired GPT-5.4-family adapter path. `gpt-5.4-mini` outperformed `gpt-4o-mini` on clean rescue reliability (`4/10` vs `2/10`) while preserving adversarial health at `5/5`, so `gpt-5.4-mini` is now the default rescue model. Remaining dominant editorial rescue misses in the bounded sample are `patch_dialogue_grounding_unresolved` and `patch_specificity_unresolved`, with one residual `patch_length_distortion` in each model batch.
**2026-03-18** - Next editorial reliability pass narrowed: attack `patch_dialogue_grounding_unresolved` first. It remains the single most persistent clean rescue class after the model switch, while specificity misses also remain but fell more noticeably under `gpt-5.4-mini`. Length distortion still appears, but only as an occasional secondary class rather than the dominant limiter.
**2026-03-18** - Rescue generation strategy bakeoff completed under the new default rescue model. `local_rewrite_block` improved the bounded clean sample over `slot_patch` (`7/10` vs `6/10`) while keeping adversarial healthy at `5/5`, but it also surfaced one `patch_length_distortion` recurrence. The repo now has explicit strategy-switch support for rescue generation, and the staged rescue architecture is documented as `slot_patch` primary repair with `local_rewrite_block` escalation fallback.
**2026-03-18** - Added canonical rescue architecture documentation in `docs/specs/rescue_pipeline_architecture.md`. The current system is now documented as a staged editorial repair pipeline with mandatory local validation, bounded escalation, and explicit separation between generation-side rescue quality work and closed rescue-plumbing concerns.
**2026-03-18** - Editorial rescue experiments after the stable `gpt-5.4-mini + slot_patch` baseline did not produce a better adoptable path. Dialogue anchor-term enforcement and specificity contract tightening were discarded after reducing clean reliability; hybrid escalation tied the clean baseline while reintroducing `patch_length_distortion`; scene-state-assisted rescue underperformed baseline; structured rescue generation tied clean and regressed adversarial. The stable editorial baseline therefore remains clean `6/10`, adversarial `5/5`.
**2026-03-18** - Decision fork documented for the next phase step. The recommended path is to hold the stable editorial baseline and move remaining generation-side misses into writer/product-level handling, rather than continue rescue-generation churn. A final higher-capability rescue comparison remains an explicit but non-default option. See `docs/runbooks/editorial_reliability_decision_record_20260318.md`.
**2026-03-18** - Writer-facing handling started on top of the stable editorial baseline. Long-form chunks now expose a narrow `review_snapshot` for unresolved generation-side rescue misses, including the failure class, short explanation, targeted lines, and scaffolded review actions (`accept_current_text`, `regenerate_local_repair`, `mark_for_manual_rewrite`, `show_flag_reason`). This is the first product-level handling layer for remaining rescue misses; it does not change rescue generation behavior.
**2026-03-18** - Carryover protection added for flagged editorial chunks. Review flagging and carryover approval are now treated as separate decisions: unresolved generation-side rescue failures receive a `carryover_snapshot` with `carryover_risk`, `carryover_mode`, and `carryover_allowed`. Restricted chunks no longer feed normal prior excerpts, and blocked chunks do not feed normal carryover at all pending review.
**2026-03-18** - First writer-facing editorial review workflow landed in the renderer. Project Home now surfaces flagged scene review state from `review_snapshot` and `carryover_snapshot`, including the failure class, summary, targeted lines, carryover mode, and scaffolded actions for human follow-up. This keeps the stable rescue baseline intact while making unresolved rescue misses visible to writers.

## Upcoming milestones
- ~~**P7 - RC1:** Smoke tests complete; publish quickstart.~~ *(closed 2025-10-10)*
- ~~**P8 - Companion overlay + batch critique prototype.**~~ *(landed 2025-10-15; engine milestone stays closed)*
- **P8 follow-up exceptions:** unresolved UI verification and scope gaps remain tracked without reopening the engine milestone. See `docs/phases/phase8_ui_gate_closeout.md`.
- **Current engine phase:** Outline-Faithful Editorial Reliability for long-form rewrite recovery, after rescue-plumbing closeout.
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
