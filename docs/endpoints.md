# docs/endpoints.md — API Contracts (Source of truth)
**Status:** LOCKED · 2025-10-10
**Version:** v1.1 (Phase 8 contract — supersedes v1)
Local-only FastAPI services the Electron app calls. All bodies are JSON (UTF-8). Keys are `snake_case`.

## Conventions
- **Base path:** all canonical routes live under `/api/v1`. Legacy unversioned aliases (e.g., `/draft/generate`) were retired in
  release `1.0.0-rc1`; clients must call the versioned paths directly.
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
  "details": { "optional": "endpoint-specific context" },
  "trace_id": "uuidv4"
}
```

- **VALIDATION** — malformed input or limits exceeded
- **RATE_LIMIT** — too many requests in a time window
- **BUDGET_EXCEEDED** — per-project budget hit (see policies)
- **CONFLICT** — request contradicts locked state (e.g., stale version)
- **INTERNAL** — unexpected server error (logged locally)
- Every error response echoes the correlation ID via the `x-trace-id` header; the same value is returned as `trace_id` in the payload.

---

## Request Limits (Updated for v1.1)
- **POST /api/v1/draft/generate** → max **5 scenes** (or **1 chapter**) per request
- **POST /api/v1/draft/rewrite** → **1 unit** per request
- **POST /api/v1/draft/critique** → up to **3 units** per request (batch if larger)
- **POST /api/v1/critique/batch** → up to **10 units** per batch; queue depth 3 per project
- **POST /api/v1/companion/query** → 1 active streaming response per project; enforce 30s minimum interval per user session
- **POST /api/v1/rubrics** → 5 custom rubrics per project (server validates uniqueness)
- **POST /api/v1/outline/build** → one active build at a time per project
- **POST /api/v1/exports/critique_bundle** → 1 build in-flight per project; exporting cancels and regenerates pending bundle
- **POST /api/v1/exports/analytics_summary** → synchronous for `md`, asynchronous for `pdf`; limit 3 queued exports per project

---

## Structured Output Validation (LOCKED)
Service outputs **must** validate against JSON Schema before writing to disk. On failure: return `VALIDATION` and **do not** write artifacts.

Schemas v1 (see `docs/data_model.md` / `docs/critique_rubric.md`):
- **OutlineSchema v1** (outline/build)
- **DraftUnitSchema v1** (draft/generate & rewrite)
- **CritiqueOutputSchema v1** (draft/critique)

---

## Health

### GET /api/v1/healthz
**200 OK**
```json
{ "status": "ok", "version": "0.1.0" }
```
- Response headers always include `x-trace-id` for correlation across services and logs.
- Operational tooling should probe only `/api/v1/healthz`; unversioned `/healthz` was removed in `1.0.0-rc1`.

---

### GET /api/v1/metrics
Exposes Prometheus-compatible counters and gauges for the service. Content-Type is `text/plain; version=0.0.4`. Example snippet:

```
# HELP request_latency_seconds Request latency histogram
# TYPE request_latency_seconds histogram
request_latency_seconds_bucket{le="0.1"} 42
```

---

## Outline

### POST /api/v1/outline/build
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
- Legacy `/outline/build` was removed in `1.0.0-rc1`; clients must use `/api/v1/outline/build`.

---

## Draft preflight

### POST /api/v1/draft/preflight
Returns a budget estimate for a potential generate request without writing files. Applies the same unit limits as
`/api/v1/draft/generate`.

**Request**
```json
{
  "project_id": "proj_123",
  "unit_scope": "scene",
  "unit_ids": ["sc_0001","sc_0002"]
}
```

**Response 200 (status: ok)**
```json
{
  "project_id": "proj_123",
  "unit_scope": "scene",
  "unit_ids": ["sc_0001"],
  "model": {
    "name": "draft-synthesizer-v1",
    "provider": "black-skies-local"
  },
  "scenes": [
    { "id": "sc_0001", "title": "Storm Cellar", "order": 1, "chapter_id": "ch_0001" }
  ],
  "budget": {
    "estimated_usd": 1.24,
    "status": "ok",
    "message": "Estimate within budget.",
    "soft_limit_usd": 5.0,
    "hard_limit_usd": 10.0,
    "spent_usd": 0.18,
    "total_after_usd": 1.42
  }
}
```

**Response 200 (status: soft-limit)**
```json
{
  "project_id": "proj_123",
  "unit_scope": "scene",
  "unit_ids": ["sc_0001","sc_0002"],
  "model": {
    "name": "draft-synthesizer-v1",
    "provider": "black-skies-local"
  },
  "scenes": [
    { "id": "sc_0001", "title": "Storm Cellar", "order": 1, "chapter_id": "ch_0001" },
    { "id": "sc_0002", "title": "Basement Pulse", "order": 2, "chapter_id": "ch_0001" }
  ],
  "budget": {
    "estimated_usd": 5.42,
    "status": "soft-limit",
    "message": "Estimated total $5.42 exceeds soft limit $5.00.",
    "soft_limit_usd": 5.0,
    "hard_limit_usd": 10.0,
    "spent_usd": 0.0,
    "total_after_usd": 5.42
  }
}
```

**Response 200 (status: blocked)**
```json
{
  "project_id": "proj_123",
  "unit_scope": "scene",
  "unit_ids": ["sc_0003"],
  "model": {
    "name": "draft-synthesizer-v1",
    "provider": "black-skies-local"
  },
  "scenes": [
    { "id": "sc_0003", "title": "Surface Impact", "order": 3, "chapter_id": "ch_0001" }
  ],
  "budget": {
    "estimated_usd": 11.38,
    "status": "blocked",
    "message": "Projected total $11.38 exceeds hard limit $10.00.",
    "soft_limit_usd": 5.0,
    "hard_limit_usd": 10.0,
    "spent_usd": 0.0,
    "total_after_usd": 11.38
  }
}
```

**Fields**
- `model` — resolver-selected draft synthesizer + provider string.
- `scenes` — ordered list of impacted scene IDs/titles (chapter and beat refs when available).
- `budget.status`
  - `ok` — projected total remains under the soft limit (modal shows “Within budget” and keep **Proceed** enabled)
  - `soft-limit` — projected total meets/exceeds the soft limit but remains under the hard limit (modal shows warning, **Proceed** stays enabled)
  - `blocked` — projected total meets/exceeds the hard limit (modal labels the button **Blocked** and keeps it disabled)

**Errors**
- `VALIDATION` (bad IDs, unit limits, missing outline)
- Legacy `/draft/preflight` was removed in `1.0.0-rc1`; clients must use `/api/v1/draft/preflight`.

---


## Draft generation

### POST /api/v1/draft/generate
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
  "budget": {
    "estimated_usd": 0.42,
    "status": "ok",
    "soft_limit_usd": 5.0,
    "hard_limit_usd": 10.0,
    "spent_usd": 0.42
  }
}
```

**Errors**
- `VALIDATION` (too many units, bad IDs)
- `BUDGET_EXCEEDED` (hard cap hit)
- `RATE_LIMIT` (burst control)
- `INTERNAL`
- Legacy `/draft/generate` was removed in `1.0.0-rc1`; use `/api/v1/draft/generate`.

---

## Draft rewrite

### POST /api/v1/draft/rewrite
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
- Legacy `/draft/rewrite` was removed in `1.0.0-rc1`; use `/api/v1/draft/rewrite`.

---

## Critique

### POST /api/v1/draft/critique
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
- Legacy `/draft/critique` was removed in `1.0.0-rc1`; use `/api/v1/draft/critique`.

---

## Notes on budgets & preflight (Phase 1 behavior)
- Every generate/critique call performs a **token/cost preflight** and returns an estimated USD value in the response.
- `/api/v1/draft/preflight` exposes the estimate along with **current spend** and **projected total** so the UI can gate actions.
- If the projected total exceeds the **soft budget** threshold, the app shows a confirmation; if the **hard budget** would be exceeded, services return `BUDGET_EXCEEDED` (`402`) and do not write any files.
- Budgets are persisted per project in `project.json` (`budget.spent_usd`).
- Phase 8 introduces `/api/v1/budget/summary` for real-time ledger data surfaced in the budget meter.

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
- This document: **v1.1**
- Schemas: **OutlineSchema v1**, **DraftUnitSchema v1**, **CritiqueOutputSchema v1**
- Future changes bump schema versions and are recorded in `phase_log.md`.
- Phase 8 endpoints introduce `CompanionMessageSchema v1`, `CritiqueBatchSchema v1`, `RubricTemplateSchema v1`, `BudgetSnapshotSchema v1`, `CritiqueBundleExportSchema v1`, and `AnalyticsSummarySchema v1` (definitions pending in `docs/data_model.md`).

---

## Phase 8 Additions (v1.1)

### POST /api/v1/companion/query
Interactive Companion overlay prompt. Streams suggestions, critiques, and rewrite snippets referencing the active draft unit.

**Request**
```json
{
  "project_id": "proj_123",
  "draft_unit_id": "sc_0001",
  "message": "How can I raise the stakes in this confrontation?",
  "rubric_id": "rubric_custom_01",
  "context": {
    "selection_text": "The cellar trembled as...",
    "cursor_location": 412
  },
  "budget": {
    "allowance_usd": 1.25,
    "soft_cap_usd": 5.0,
    "hard_cap_usd": 10.0
  }
}
```

**Response 200**
```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "Consider forcing the antagonist to reveal a hidden ally...",
      "suggestions": [
        {
          "kind": "diff",
          "range": [400, 410],
          "replacement": "She hears the second set of footsteps above."
        }
      ],
      "critique_tags": ["Stakes", "Tension"],
      "schema_version": "CompanionMessageSchema v1"
    }
  ],
  "budget": {
    "estimated_usd": 0.18,
    "spent_usd": 3.42,
    "soft_cap_usd": 5.0,
    "hard_cap_usd": 10.0,
    "status": "ok"
  },
  "trace_id": "uuidv4"
}
```

**Errors**
- `VALIDATION` (missing project or draft unit context)
- `BUDGET_EXCEEDED` (estimated cost breaches hard cap)
- `RATE_LIMIT` (prompt interval <30s)
- `INTERNAL`

**Notes**
- Response may be delivered via server-sent events; when streaming the final frame matches shape above.
- `rubric_id` optional; omitted defaults to project rubric selection.

---

### POST /api/v1/critique/batch
Runs critique across multiple units asynchronously. Initiates a batch job and returns handle.

**Request**
```json
{
  "project_id": "proj_123",
  "unit_ids": ["sc_0001", "sc_0002", "sc_0003"],
  "rubric_id": "rubric_custom_01",
  "priority": "normal"
}
```

**Response 202**
```json
{
  "batch_id": "cb_20251010_001",
  "units": 3,
  "status": "queued",
  "schema_version": "CritiqueBatchSchema v1",
  "budget": {
    "estimated_usd": 0.96,
    "spent_usd": 3.42,
    "soft_cap_usd": 5.0,
    "hard_cap_usd": 10.0,
    "status": "warning"
  },
  "trace_id": "uuidv4"
}
```

**Errors**
- `VALIDATION` (no units or >10 units)
- `BUDGET_EXCEEDED` (batch pushes over hard cap)
- `CONFLICT` (existing batch running for same units)
- `RATE_LIMIT` (queue depth exceeded)

**Notes**
- Service persists per-unit critiques to standard manifest; batch metadata needed for critique bundle export.
- Batch completion events push notifications to History toast queue.

#### GET /api/v1/critique/batch/{batch_id}
Retrieves batch status and collected outputs.

**Response 200**
```json
{
  "batch_id": "cb_20251010_001",
  "status": "complete",
  "units": [
    { "unit_id": "sc_0001", "status": "complete" },
    { "unit_id": "sc_0002", "status": "complete" },
    { "unit_id": "sc_0003", "status": "failed", "error_code": "VALIDATION" }
  ],
  "manifest_path": "exports/critique/cb_20251010_001/manifest.json",
  "started_at": "2025-10-10T18:05:00Z",
  "completed_at": "2025-10-10T18:07:30Z",
  "schema_version": "CritiqueBatchSchema v1",
  "trace_id": "uuidv4"
}
```

**Errors**
- `VALIDATION` (unknown batch)
- `INTERNAL`

---

### GET /api/v1/budget/summary
Provides data for the budget meter footer and ledger export.

**Response 200**
```json
{
  "project_id": "proj_123",
  "budget": {
    "soft_cap_usd": 5.0,
    "hard_cap_usd": 10.0,
    "spent_usd": 3.42,
    "pending_usd": 0.18,
    "projected_next_usd": 0.32,
    "status": "warning"
  },
  "ledger": [
    { "timestamp": "2025-10-10T17:55:00Z", "action": "companion_query", "cost_usd": 0.12 },
    { "timestamp": "2025-10-10T18:00:00Z", "action": "critique_batch", "cost_usd": 0.24 }
  ],
  "schema_version": "BudgetSnapshotSchema v1",
  "trace_id": "uuidv4"
}
```

**Errors**
- `VALIDATION` (project missing)
- `INTERNAL`

**Notes**
- Endpoint must respond within 200 ms; cache ledger entries in-memory with 30s TTL.
- Supports query params `?since=` ISO timestamp to trim ledger list.

---

### GET /api/v1/rubrics
Returns project rubric templates (system + custom).

**Response 200**
```json
{
  "project_id": "proj_123",
  "rubrics": [
    {
      "rubric_id": "rubric_default",
      "name": "Core Horror",
      "description": "Baseline rubric shipped with Black Skies.",
      "criteria": [
        { "id": "stakes", "label": "Stakes", "weight": 0.2 },
        { "id": "atmosphere", "label": "Atmosphere", "weight": 0.2 }
      ],
      "schema_version": "RubricTemplateSchema v1",
      "locked": true
    }
  ],
  "trace_id": "uuidv4"
}
```

**Errors**
- `VALIDATION`
- `INTERNAL`

---

### POST /api/v1/rubrics
Creates or updates a project-specific rubric template.

**Request**
```json
{
  "project_id": "proj_123",
  "name": "Claustrophobic Horror",
  "description": "Highlights sensory detail and pacing.",
  "criteria": [
    { "id": "tension", "label": "Tension", "weight": 0.3 },
    { "id": "sensory", "label": "Sensory Detail", "weight": 0.2 }
  ]
}
```

**Response 201**
```json
{
  "rubric_id": "rubric_custom_01",
  "schema_version": "RubricTemplateSchema v1",
  "created_at": "2025-10-10T18:10:00Z",
  "trace_id": "uuidv4"
}
```

**Errors**
- `VALIDATION` (duplicate name, >12 criteria, weight totals not 1.0)
- `RATE_LIMIT` (more than 5 custom rubrics)
- `INTERNAL`

---

### POST /api/v1/exports/critique_bundle
Materialises critique bundle (Markdown or PDF) based on latest batch results.

**Request**
```json
{
  "project_id": "proj_123",
  "batch_id": "cb_20251010_001",
  "format": "pdf"
}
```

**Response 202**
```json
{
  "export_id": "exp_critique_001",
  "status": "queued",
  "output_path": "exports/critique/cb_20251010_001/critique_bundle.pdf",
  "schema_version": "CritiqueBundleExportSchema v1",
  "trace_id": "uuidv4"
}
```

**Errors**
- `VALIDATION` (missing batch or format not in `["md","pdf"]`)
- `CONFLICT` (export already running)
- `INTERNAL`

**Notes**
- Export reuses analytics snapshot metadata; ensures budgets appended to bundle.
- When `format` is `md`, respond `200` with inline payload if `?inline=true` query param provided.

---

### POST /api/v1/exports/analytics_summary
Generates analytics summary (Markdown/PDF) as described in `docs/exports.md`.

**Request**
```json
{
  "project_id": "proj_123",
  "format": "md",
  "include_companion_notes": true
}
```

**Response 200**
```json
{
  "content": "## Analytics Snapshot...",
  "schema_version": "AnalyticsSummarySchema v1",
  "trace_id": "uuidv4"
}
```

**Errors**
- `VALIDATION` (format not md/pdf)
- `INTERNAL`

**Notes**
- When `format` is `pdf` respond `202` with `export_id` similar to critique bundle export.
