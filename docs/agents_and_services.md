# docs/agents_and_services.md — Agents & Services (Source of truth)
**Status:** LOCKED · 2025-09-23  
**Version:** v1 (Phase 1 foundations, Phase 2 agents)

Defines the local services API (Phase 1) and the read‑only agent model to be introduced in Phase 2.

---

## 1) Purpose
Keep automation **contained and auditable**. Services return deterministic, schema‑valid artifacts. Agents (Phase 2) generate **reports and diffs**; they never auto‑apply changes to project files.

---

## 2) Services (Phase 1)
Backed by **FastAPI** (see `docs/endpoints.md` for full contracts).

- **outline** — builds `outline.json` from locked Wizard decisions.  
- **draft** — generates prose for scenes/chapters (≤5 scenes per call).  
- **rewrite** — rewrites a single unit and returns a word‑level diff.  
- **critique** — runs critique per rubric and returns structured suggestions.

**Execution model**
- Single worker per service; queue new jobs; allow **cancel** from UI.  
- Preflight cost estimate is **required**; block on hard budget.  
- Outputs validate against **Schema v1**; fail‑closed if invalid.

---

## 3) Common I/O Contracts
All service requests include:
```json
{
  "project_id": "proj_123",
  "seed": 42,                    // optional
  "temperature": 0.7,            // optional
  "budget_cap_usd": 10.0         // hard cap
}
```
All responses include (when applicable):
```json
{
  "schema_version": "… v1",
  "model": { "name": "…", "provider": "openai" },
  "budget": { "estimated_usd": 0.42 }
}
```

---

## 4) Agents (Phase 2)
### 4.1 Roles
- **Planner** — outline sanity checks; suggests beat/scene bucket fixes.  
- **Drafter** — expands scenes under locked beats; emits suggested diffs.  
- **Critic** — batch critique across scenes using the rubric.

### 4.2 Contracts
**Inputs (common):** project path, selected unit IDs, schema versions, style guide (optional), budget caps.  
**Outputs (common):** JSON artifact + optional Markdown report under `revisions/agents/`; diffs as `{range,replacement}` lists.

### 4.3 Guardrails
- **Read‑only:** agents never write to scene files directly.  
- **Budget‑aware:** respect soft/hard caps; preflight required.  
- **Determinism:** pass `seed` when provided.  
- **Cancelability:** long runs expose progress ticks and cancel signal.

### 4.4 Example Tasks (v1)
- **Batch Critique:** N scenes → `agents/critique_{ts}.md` with per‑scene summaries + diffs JSON.  
- **Outline Sanity:** find missing inciting/midpoint/climax; POV conflicts; produce patch suggestions.  
- **Export Suite:** compile chapters/MD bundles for review.

---

## 5) Plugin Seam (read‑only v1)
A plugin receives a **snapshot** JSON of the project and may emit a report. It **cannot modify** project files; apply happens in core UI. Plugin process runs sandboxed and is optional.

---

## 6) Configuration
Per‑project `agents.json` (optional):
```json
{
  "enabled": ["Planner","Critic"],
  "model_overrides": {
    "Planner": "scaffold_model_vX",
    "Drafter": "prose_model_vY"
  },
  "budgets": {
    "Planner": 1.50,
    "Drafter": 5.00,
    "Critic": 2.50
  },
  "max_concurrency": 1
}
```

---

## 7) Non‑Goals (v1)
- No autonomous continuous agents.  
- No internet retrieval/search.  
- No full‑book “rewrite everything.”

---

## 8) Versioning
- This document: **v1**. Any change to agent I/O, guardrails, or service contracts must update this file and be recorded in `phase_log.md`.
