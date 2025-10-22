# phase_log.md — Change Log

**2025-09-15** — Locked Phase Charter v1.0 (Original RC Scope)  
**2025-10-09** — Added Phase 8-11 Roadmap (~30 feature expansion) · Unlocked v1.1 docs
**2025-10-10** — P7 RC packaging complete · Tagged `v1.0.0-rc1` · Smoke + offline docs verified
**2025-10-15** — P8 Companion overlay + Batch Critique UI landed; budget meter added to workspace header

### Upcoming Milestones
- ~~**P7 → RC1:** Smoke tests complete; publish Quickstart.~~ *(closed 2025-10-10)*
- **P8:** Companion overlay + Batch Critique prototype.  
- **P9:** Analytics visualizations + Dashboard integration.  
- **P10:** Accessibility & Export Suite.  
- **P11:** Agents & Plugin Framework.

### Open Follow-up Items
- Track **budget constant reuse**: replace hard-coded `0.02` pricing in `DraftGenerationService` with `COST_PER_1000_WORDS_USD` and audit for other stragglers.
- Simplify **fingerprint generation** by relying on `json.dumps(..., sort_keys=True)` (no manual override sorting) and update tests to assert determinism.
- Document and standardise **threadpool usage** (`run_in_threadpool` vs `asyncio.to_thread`), and schedule tests/docs for the recovery state machine and snapshot validation scenarios.
- Harden budget meter with **live spend telemetry** (generation + critique) and persist the latest ledger snapshot for recovery screens.
