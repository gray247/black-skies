# Black Skies — Roadmap P0–P9

**Status snapshot**
- P0 Foundation … ✅ complete
- P1 Core backend API … ✅ complete
- P2 GUI skeleton & panes … ✅ complete
- P3 Draft → Critique loop … ✅ complete
- P4.0 Observability baseline (structured logs + /metrics) … ✅ complete
- P4.1 Documentation/tagging sweep … ✅ complete
- P5 Tools, Data, and Evaluation Harness … ✅ complete (adapters, registry, eval gate live)
- P6 End-to-End Integration & Contracts … ✅ complete (GUI ↔ `/api/v1` wiring, session restore proven)
- P7 Release Candidate (RC) … ◻ planned
- P8 Hardening, Performance, and Resilience … ◻ planned
- P9 GA (v1.0.0) & Post-GA Care … ◻ planned

---

## Phase objectives & deliverables

### P5 — Tools, Data, and Evaluation Harness
**Goal:** make the assistant useful with stable tools + offline evals you can run in CI.
**Deliverables**
1. Tool adapters (Python) for: file store, template renderer, summarizer, simple search (mock or local).
2. Tool registry + permissioning (“decision checklist” → which tools may run, logging for each call).
3. Dataset of 50–100 task cards (YAML) covering Wizard/Draft/Critique flows; golden outputs where possible.
4. Offline evaluator (`scripts/eval.py`): runs tasks against the current build; emits JSON + HTML summary.
5. Safety hooks: policy checks (see `docs/policies.md`) before/after tool calls; redact logs.
6. CI job to run `eval.py` on PRs; fails on regressions beyond thresholds.

**Status note:** Local-only summarizer and Markdown search adapters now ship alongside the file store
and template renderer tools, with the tool registry enforcing decision-checklist permissions. The P5
dataset and offline evaluator power the locked CI gate (`scripts/eval.py`) that now runs on PRs. These
CPU-friendly adapters operate on checked-in `data/` assets; they do not yet cover semantic embeddings or
fuzzy matching, so large documents and nuanced queries may still require manual follow-up.

### P6 — End-to-End Integration & Contracts
**Goal:** wire GUI ↔ API with versioned contracts and traceability.
**Deliverables**
1. Contract docs in `docs/endpoints.md`: request/response schemas (pydantic), status codes, error shapes.
2. Versioned `/api/v1` FastAPI router; deprecation header support.
3. Frontend integration (IPC/HTTP) for: suggest, accept, lock, diff, critique tabs.
4. Session state & autosave snapshots; restore from History pane.
5. Trace IDs on every request; correlate in logs/`/metrics` and GUI console.
6. Contract tests (pytest) exercising each endpoint with golden fixtures.

**Status note:** `/api/v1` contracts are now fully versioned, and the renderer drives every Wizard → Draft →
Critique interaction through those endpoints with trace IDs captured in logs. Session snapshots are
persisted locally and the History pane restore path has been smoke-tested end-to-end.

### P7 — Release Candidate (RC)
**Goal:** freeze interfaces; cut a candidate that can be installed and used end-to-end.
**Deliverables**
1. Freeze API & schema versions; tag `v1.0.0-rc1`.
2. Packaging: `pip install .` (backend) + reproducible node build (if enabled) or “API-only” mode.
3. Smoke test script `scripts/smoke.sh` (or `.ps1`) that boots API, runs 3 happy-path flows, exits 0.
4. User docs: quickstart, config via `.env`, known issues.
5. “Offline mode” path (no network): wheels cache, no remote model calls, predictable evals.

### P8 — Hardening, Performance, Resilience
**Goal:** make it boring to operate.
**Deliverables**
1. Load test profiles (`scripts/load.py`) to 95th/99th latency targets; budget & resize.
2. Timeouts, retries (tenacity), circuit breakers on tool calls; graceful shutdown.
3. Input validation strict mode; large payload guards; log redaction verified.
4. Error budget SLOs and alerts (even if local: exit codes in CI, thresholds in eval report).
5. Security pass: `.env` handling, dependency review, license scan.

### P9 — GA & Post-GA Care
**Goal:** ship v1.0.0 and define how we maintain it.
**Deliverables**
1. Tag `v1.0.0`; changelog.
2. “How we release” doc; PR template with checkboxes (tests, docs, eval).
3. Support playbook: bug triage labels, reproduction template, hotfix branch policy.
4. Backlog for v1.1 (quality-of-life fixes from RC feedback).

---

## Milestone checklist (what Codex can execute)

- [x] Add tool adapters and registry (P5)
- [x] Create eval dataset & `scripts/eval.py` (P5)
- [x] Add `/api/v1` router + contracts in `docs/endpoints.md` (P6)
- [x] Implement session snapshots & restore (P6)
- [x] Package RC, smoke tests, docs (P7)
- [ ] Add load/e2e tests; resilience settings (P8)
- [ ] Tag GA and add release/support docs (P9)
