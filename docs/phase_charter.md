# docs/phase_charter.md — Phase Charter (Source of truth)
**Status:** LOCKED · 2025-09-17  
**Version:** v1 (Phase 1 / 1.0)  
**Platform:** Windows 11 only

Single-page charter for Phase 1. Defines scope, milestones, DoD, risks, and success metrics.

---

## Baseline (confirmed)
- **Platform:** Windows-only (Windows 11 min). Packaging: **NSIS installer** + optional **portable ZIP**. Auto-updates **disabled** for 1.0.
- **Editor:** **CodeMirror 6** (merge view for diffs).  
- **Scene cap:** **20k words** per scene.  
- **Emotion tags:** **dread, tension, respite, revelation, aftermath**.  
- **Storage:** Project folder on disk (`outline.json`, `drafts/*.md`, `revisions/`, `history/`, `lore/`).  
- **Privacy:** Local-first. No telemetry. Diagnostics to `history/diagnostics/`.  
- **APIs:** Local FastAPI; API Mode only when user supplies their own key.

---

## Phase Objective (1.0)
Deliver a **stable, local-first novelist tool** that guides outline creation, generates a small set of scenes, supports rewrites with diffs, runs critique against a rubric, and exports clean Markdown—without internet dependence.

---

## Milestones
- **0.1 – Walking Skeleton**  
  - Electron app boots on Win11; project loader; CodeMirror mounts; sample project opens.  
  - `/health` endpoint; stub services returning fixtures; basic logging.

- **0.2 – Vertical Slice**  
  - Wizard → Outline build (deterministic).  
  - Draft generate for **3 scenes**, prompts & seeds recorded.  
  - Critique on those scenes; side-by-side diff; **Accept/Rollback**.  
  - Preflight panel + budget rails surfaced.

- **0.3 – Stability & Export**  
  - Crash recovery banner; autosave & snapshot restore verified.  
  - Export `draft_full.md` and validate `outline.json` write.  
  - Performance tuned to targets; a11y pass; installer built (NSIS + portable ZIP).

- **1.0 – Release Candidate**  
  - Docs finalized; smoke tests green; packaging repeatable; no known P0 defects.

---

## Definition of Done (Phase 1 / 1.0)
- **Wizard:** All steps functional; decisions **lock & snapshot**; restore from History works.  
- **Outline:** Builds **deterministically** from locked decisions; `outline.json` validates (`OutlineSchema v1`).  
- **Draft:** Generate **3 scenes** end-to-end; store **prompts & seeds** with outputs (`DraftUnitSchema v1`).  
- **Critique:** Run rubric; show **diff**; **Accept/Rollback** applies hunks and creates a Snapshot (`CritiqueOutputSchema v1`).  
- **Export:** `outline.json` and `draft_full.md` write without errors.  
- **Recovery:** On crash, next launch shows **Recovery** banner; reopen last project and view diagnostics.  
- **Performance:** **15k–20k** word scene edit with average keystroke latency **< 150 ms**; initial diff render **< 500 ms**.  
- **Budgets:** Soft **$5** warn; hard **$10** block with `BUDGET_EXCEEDED`.  
- **A11y:** Keyboard path complete; reduced-motion supported; contrast & focus rings meet policy.  
- **Packaging:** Win11 installer (NSIS) and portable ZIP produced; app ID set; icons/splash present.  
- **Docs:** `endpoints.md`, `data_model.md`, `gui_layouts.md`, `exports.md`, `policies.md`, **this charter** locked; `phase_log.md` updated.

---

## Non-goals (Phase 1)
- macOS/Linux builds; auto-update; telemetry; DOCX/PDF exports; multi-agent automation beyond critique; internet search; whole-book rewrite.

---

## Risks & mitigations
- **Editor performance at 20k words** → Virtualized decorations; debounce; measure keystroke latency in dev.  
- **Diff mis-anchors** → Use ±3–5 token anchors; manual override apply per hunk.  
- **Budget spikes** → Preflight estimator; caching identical requests; soft/hard caps enforced.  
- **Packaging friction** → Keep dependencies minimal; document prerequisites; provide portable ZIP.

---

## Success metrics
- **Adoption:** Project opened and edited for ≥3 sessions per user.  
- **Throughput:** ≥3 scenes generated and critiqued successfully on the sample project.  
- **Stability:** Zero data-loss incidents in test; crash recovery verified.  
- **Export:** 100% success writing `draft_full.md` and `outline.json` on test matrix.

---

## Versioning
- This document: **v1** (Phase 1). Changes require an entry in `phase_log.md`.
## P5 — Tools, Data, and Evaluation Harness
**Scope:** tool adapters (file, template, summarize, search), registry/permissions, eval dataset, evaluator, CI hook.  
**Non-goals:** fancy retrieval, external services.  
**Exit:** `scripts/eval.py` runs and produces an HTML/JSON report; CI gate in place; safety hooks on tool calls.

## P6 — End-to-End Integration & Contracts
**Scope:** versioned `/api/v1` endpoints, pydantic schemas, GUI wiring, session state, trace IDs, contract tests.  
**Non-goals:** new features beyond Wizard/Draft/Critique loop.  
**Exit:** GUI can drive end-to-end flows against `/api/v1`; contract tests green.

## P7 — Release Candidate
**Scope:** freeze interfaces, packaging, smoke tests, quickstart docs, offline mode.  
**Exit:** `v1.0.0-rc1` tag; smoke script exits 0 on a clean checkout.

## P8 — Hardening, Performance, Resilience
**Scope:** load testing, timeouts/retries/circuit-breakers, input limits, redaction, SLOs.  
**Exit:** load targets met; resilience toggles verified; security checklist ticked.

## P9 — GA & Post-GA Care
**Scope:** GA tag, changelog, release process, support playbook, backlog for v1.1.  
**Exit:** `v1.0.0` tag and docs published; support workflow defined.
