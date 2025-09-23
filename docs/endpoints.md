# docs/endpoints.md — API Contracts (Source of truth)
**Status:** LOCKED · 2025-09-17  
**Version:** v1 (Phase 1 / 1.0)  
Local-only FastAPI services the Electron app calls. All bodies are JSON (UTF-8). Keys are `snake_case`.

## Conventions
- **Content-Type:** `application/json`
- **Auth:** none (same-machine services)
- **Idempotency:** non-mutating calls safe to retry; write calls return versioned artifacts
- **Timestamps:** ISO-8601 strings
- **Schema versions:** responses include `schema_version` where applicable

---

## Error Model (LOCKED)
All endpoints return a common error shape.

```json
{
  "code": "VALIDATION | RATE_LIMIT | BUDGET_EXCEEDED | CONFLICT | INTERNAL",
  "message": "human-readable summary",
  "details": { "optional": "endpoint-specific context" }
}
```

- **VALIDATION** — malformed input or limits exceeded  
- **RATE_LIMIT** — too many requests in a time window  
- **BUDGET_EXCEEDED** — per-project budget hit (see policies)  
- **CONFLICT** — request contradicts locked state (e.g., stale version)  
- **INTERNAL** — unexpected server error (logged locally)

---

## Request Limits (LOCKED)
- **POST /draft/generate** → max **5 scenes** (or **1 chapter**) per request  
- **POST /draft/rewrite** → **1 unit** per request  
- **POST /draft/critique** → up to **3 units** per request (batch if larger)  
- **POST /outline/build** → one active build at a time per project

---

## Structured Output Validation (LOCKED)
Service outputs **must** validate against JSON Schema before writing to disk. On failure: return `VALIDATION` and **do not** write artifacts.

Schemas v1 (see `docs/data_model.md` / `docs/critique_rubric.md`):
- **OutlineSchema v1** (outline/build)
- **DraftUnitSchema v1** (draft/generate & rewrite)
- **CritiqueOutputSchema v1** (draft/critique)

---

## Health

### GET /health
**200 OK**
```json
{ "status": "ok", "version": "1.0.0" }
```

---

## Outline

### POST /outline/build
Builds an outline from **locked Wizard decisions**.

**Request**
```json
{
  "project_id": "proj_123",
  "force_rebuild": false
}
```

**Response 200**
```json
{
  "outline_id": "out_001",
  "schema_version": "OutlineSchema v1",
  "acts": ["Act I", "Act II", "Act III"],
  "chapters": [
    { "id": "ch_0001", "order": 1, "title": "Arrival" }
  ],
  "scenes": [
    {
      "id": "sc_0001",
      "order": 1,
      "title": "Storm Cellar",
      "chapter_id": "ch_0001",
      "beat_refs": ["inciting"]
    }
  ]
}
```

**Errors**
- `VALIDATION` (e.g., missing Wizard locks)
- `CONFLICT` (another build in progress)

---

## Draft generation

### POST /draft/generate
Generates prose for scenes/chapters. Applies request limits above. Stores prompt + seed with outputs.

**Request**
```json
{
  "project_id": "proj_123",
  "unit_scope": "scene",
  "unit_ids": ["sc_0001","sc_0002"],
  "temperature": 0.7,
  "seed": 42
}
```

**Response 200**
```json
{
  "draft_id": "dr_004",
  "schema_version": "DraftUnitSchema v1",
  "units": [
    {
      "id": "sc_0001",
      "text": "The cellar stairs were slick with silt...",
      "meta": {
        "pov": "Viki",
        "purpose": "escalation",
        "emotion_tag": "tension",
        "word_target": 1200
      },
      "prompt_fingerprint": "sha256:5f7a…",
      "model": { "name": "prose_model_vX", "provider": "openai" }
    }
  ],
  "budget": { "estimated_usd": 0.42 }
}
```

**Errors**
- `VALIDATION` (too many units, bad IDs)
- `BUDGET_EXCEEDED` (hard cap hit)
- `RATE_LIMIT` (burst control)
- `INTERNAL`

---

## Draft rewrite

### POST /draft/rewrite
Rewrite a single unit (scene or chapter). Returns revised text and a word-level diff.

**Request**
```json
{
  "draft_id": "dr_004",
  "unit_id": "sc_0001",
  "instructions": "Tighten sentences 40–55; keep POV strict.",
  "new_text": null
}
```

**Response 200**
```json
{
  "unit_id": "sc_0001",
  "revised_text": "The cellar stairs were slick...",
  "diff": {
    "added":   [ { "range": [120, 135], "text": "shorter beat." } ],
    "removed": [ { "range": [86, 119] } ],
    "changed": [ { "range": [200, 230], "replacement": "She steadied herself." } ],
    "anchors": { "left": 4, "right": 4 }
  },
  "schema_version": "DraftUnitSchema v1",
  "model": { "name": "prose_model_vX", "provider": "openai" }
}
```

**Errors**
- `VALIDATION` (missing fields)
- `CONFLICT` (stale version / unit not found)
- `BUDGET_EXCEEDED`
- `INTERNAL`

---

## Critique

### POST /draft/critique
Runs critique on a unit using the rubric (see `docs/critique_rubric.md`). Non-destructive; suggestions are diffs to apply later.

**Request**
```json
{
  "draft_id": "dr_004",
  "unit_id": "sc_0001",
  "rubric": ["Logic","Continuity","Character","Pacing","Prose","Horror"]
}
```

**Response 200**
```json
{
  "unit_id": "sc_0001",
  "schema_version": "CritiqueOutputSchema v1",
  "summary": "Clear goal/stakes. Mid-scene lulls around lines 48–55.",
  "line_comments": [
    { "line": 52, "note": "Break this sentence; sustain tension." }
  ],
  "priorities": [
    "Tighten run-ons at 48–55",
    "Keep POV strict; remove two omniscient asides"
  ],
  "suggested_edits": [
    { "range": [410, 432], "replacement": "She kills the light and listens." }
  ],
  "model": { "name": "critique_model_vY", "provider": "openai" }
}
```

**Errors**
- `VALIDATION` (rubric not recognized)
- `RATE_LIMIT`
- `BUDGET_EXCEEDED`
- `INTERNAL`

---

## Notes on budgets & preflight (Phase 1 behavior)
- Every generate/critique call performs a **token/cost preflight** and returns an estimated USD value in the response.  
- If the preflight exceeds the **soft budget** threshold, the app shows a confirmation; if the **hard budget** is exceeded, services return `BUDGET_EXCEEDED`.

---

## Status codes
- `200 OK` — success  
- `400 Bad Request` — maps to `VALIDATION`  
- `409 Conflict` — maps to `CONFLICT`  
- `429 Too Many Requests` — maps to `RATE_LIMIT`  
- `402 Payment Required` — maps to `BUDGET_EXCEEDED` (local signal for budget stop)  
- `500 Internal Server Error` — maps to `INTERNAL`

---

## Versioning
- This document: **v1**  
- Schemas: **OutlineSchema v1**, **DraftUnitSchema v1**, **CritiqueOutputSchema v1**  
- Future changes bump schema versions and are recorded in `phase_log.md`.
