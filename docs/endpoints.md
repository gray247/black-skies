# docs/endpoints.md — API Contracts (Source of truth)
**Status:** Draft · 2025-10-07  
**Version:** v2 (Phase 9 staging)  
Local-only FastAPI services the Electron app calls. All bodies are JSON (UTF-8). Keys are `snake_case`.

## Conventions
- **Base path:** all canonical routes live under `/api/v1`. Legacy unversioned aliases (e.g., `/draft/generate`) were retired in
  release `1.0.0-rc1`; clients must call the versioned paths directly.
- **Model Router:** AI-facing endpoints (`/outline/build`, `/draft/generate`, `/draft/critique`, `/batch/critique`) invoke the Model Router (`docs/model_backend.md`) before sourcing models, keeping budgets/privacy centralized.
- **Project context:** `project_id` is held in the active project session and supplied automatically; clients should not prompt users to type it per request (see `docs/gui_layouts.md` for the UX contract).
- **Content-Type:** `application/json`
- **Auth:** none (same-machine services)
- **Idempotency:** non-mutating calls safe to retry; write calls return versioned artifacts
- **Timestamps:** ISO-8601 strings
- **Schema versions:** responses include `schema_version` where applicable

> **Phase 8 scope:** Voice-note recording/transcription routes described in `docs/voice_notes_transcription.md` are deferred to Phase 9; `/api/v1/voice/*` is not available in this release.

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

## Request Limits (LOCKED)
- **POST /api/v1/draft/generate** → max **5 scenes** (or **1 chapter**) per request
- **POST /api/v1/draft/rewrite** → **1 unit** per request
- **POST /api/v1/draft/critique** → up to **3 units** per request (batch if larger)
- **POST /api/v1/outline/build** → one active build at a time per project

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
Calls assume the renderer provides the active `project_id`; users should not re-type it once a folder is open (see `docs/gui_layouts.md`).

### POST /api/v1/outline/build
Builds an outline from **locked Outline decisions**.

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
- `VALIDATION` (e.g., missing Outline locks)
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
  "project_id": "proj_123",
  "draft_id": "dr_004",
  "unit_id": "sc_0001",
  "instructions": "Tighten sentences 40–55; keep POV strict.",
  "unit": {
    "id": "sc_0001",
    "text": "The original cellar scene text…",
    "meta": {
      "title": "Storm Cellar",
      "word_target": 850
    },
    "prompt_fingerprint": "fp_demo_001",
    "model": {
      "name": "draft-generator-v1",
      "provider": "black-skies-local"
    }
  }
}
```

**Response 200** *(x-trace-id header echoed)*
```json
{
  "unit_id": "sc_0001",
  "revised_text": "The cellar stairs were slick…",
  "diff": {
    "added":   [ { "range": [120, 135], "text": "shorter beat." } ],
    "removed": [ { "range": [86, 119] } ],
    "changed": [ { "range": [200, 230], "replacement": "She steadied herself." } ],
    "anchors": { "left": 4, "right": 4 }
  },
  "schema_version": "DraftUnitSchema v1",
  "model": { "name": "draft-rewriter-v1", "provider": "black-skies-local" }
}
```

**Errors**
- `VALIDATION` (missing fields)
- `CONFLICT` (stale version / unit not found)
- `BUDGET_EXCEEDED`
- `INTERNAL`
- Legacy `/draft/rewrite` was removed in `1.0.0-rc1`; use `/api/v1/draft/rewrite`.

---

## Draft accept

### POST /api/v1/draft/accept
Persist an accepted unit, update snapshots, and record budget spend.

**Request**
```json
{
  "project_id": "proj_123",
  "draft_id": "dr_004",
  "unit_id": "sc_0001",
  "message": "Accept after QA fixes",
  "snapshot_label": "accept-20251007",
  "unit": {
    "id": "sc_0001",
    "previous_sha256": "4a1fe87d18d4cf2d8a7df85e8e4c4df3cc3734fdcc61ac07d7fa2f2b0a9d4d69",
    "text": "Final cellar draft text…",
    "meta": {
      "title": "Storm Cellar",
      "word_target": 900
    },
    "estimated_cost_usd": 0.18
  }
}
```

**Response 200** *(x-trace-id header echoed)*
```json
{
  "project_id": "proj_123",
  "unit_id": "sc_0001",
  "status": "accepted",
  "snapshot": {
    "snapshot_id": "snap_20251007T120301Z",
    "label": "accept-20251007",
    "created_at": "2025-10-07T12:03:01Z",
    "path": "history/snapshots/snap_20251007T120301Z.zip"
  },
  "diff": {
    "added": [],
    "removed": [],
    "changed": [
      { "range": [312, 347], "replacement": "She steadied herself." }
    ],
    "anchors": { "left": 4, "right": 4 }
  },
  "budget": {
    "soft_limit_usd": 5.0,
    "hard_limit_usd": 10.0,
    "spent_usd": 1.82
  },
  "schema_version": "DraftAcceptResult v1"
}
```

**Errors**
- `VALIDATION` (payload shape, checksum mismatch)
- `CONFLICT` (snapshot write failed, stale SHA)
- `BUDGET_EXCEEDED`
- `INTERNAL`

---

## Critique

### POST /api/v1/draft/critique
Runs critique on a unit using the rubric (see `docs/critique_rubric.md`). Non-destructive; suggestions are diffs to apply later.

**Heuristic output:** Each critique includes a `heuristics` object (`pov_consistency`, `goal_clarity`, `conflict_clarity`, `pacing_fit`) derived from the metadata emitted by the synthesizer and the configured heuristics lists (`docs/data_model.md#heuristics-overrides`).

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
  ,
  "heuristics": {
    "pov_consistency": 1.0,
    "goal_clarity": 0.8,
    "conflict_clarity": 0.9,
    "pacing_fit": 0.75
  }
}
```

**Errors**
- `VALIDATION` (rubric not recognized)
- `RATE_LIMIT`
- `BUDGET_EXCEEDED`
- `INTERNAL`
- Legacy `/draft/critique` was removed in `1.0.0-rc1`; use `/api/v1/draft/critique`.

---

## Analytics (Deferred to Phase 9)

Phase 8 does not expose analytics endpoints. See the Deferred (Phase 9) section below for the roadmaped analytics router and payloads.


## Export Builder

### POST /api/v1/export/build
**Request**
```json
{
  "project_id":"proj_123",
  "targets":["md","pdf","zip"],
  "options":{"appendix":true,"template_id":"print-compact"}
}
```
**Response**
```json
{ "job_id":"export_789" }
```

### GET /api/v1/export/status/{job_id}
**Response**
```json
{
  "job_id":"export_789",
  "status":"done",
  "artifacts":[
    { "type":"md","path":"/exports/draft_full.md","bytes":102400,"sha256":"sha256:abc..." }
  ]
}
```

## History

### GET /api/v1/history/list
**Request**
```json
{ "project_id":"proj_123" }
```
**Response**
```json
{
  "items":[
    { "id":"ss_20251112_213045","created_at":"2025-11-12T21:30:45Z","reason":"accept_edits","bytes":20480,"diff_summary":{"added":12,"removed":8,"changed":4} }
  ],
  "total":1
}
```

### POST /api/v1/history/restore
**Request**
```json
{ "project_id":"proj_123","id":"ss_20251112_213045" }
```
**Response**
```json
{ "restored_units":5 }
```

---

## Deferred (Phase 9)

### Analytics endpoints

Analytics routes are deferred to Phase 9 per the charter: they remain in the spec only for reference.

- `GET /api/v1/analytics/summary` (emotion arc, pacing statistics, conflict heatmap)
- `POST /api/v1/analytics/build` and `/api/v1/analytics/refresh` (trigger rescore/cache refresh)
- `GET /api/v1/analytics/scene/{scene_id}` and `/api/v1/analytics/graph` (Visuals Layer hover cards and graph data)

Refer to `docs/analytics_service_spec.md` for full payload definitions.
