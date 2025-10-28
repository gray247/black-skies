# docs/critique_rubric.md — Critique Rubric & Output (Source of truth)
**Status:** LOCKED · 2025-09-23
**Version:** v1

Categories are used by services and the GUI to filter feedback. Output must validate against **CritiqueOutputSchema v1** (see below).

## Categories (baseline)
- Logic
- Continuity
- Character
- Pacing
- Prose
- Horror

## Output shape — CritiqueOutputSchema v1
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

## Notes
- Categories are filter chips in the UI; they don’t change the schema.  
- Services may include only a subset of categories per run.

## Custom Rubric Editor Roadmap

### Requirements
- Allow editors to create, duplicate, update, and retire rubric definitions per project while retaining bundled defaults.
- Persist custom rubrics under `history/rubrics/` with schema parity to fixtures plus audit metadata (`created_at`, `created_by`, `updated_at`).
- Support batch critique requests that reference custom rubric IDs or attachment of an inline rubric for trusted operators.

### Data Model
- New `RubricDefinition` model:
  - `rubric_id`: slug `[a-z0-9_-]{3,64}`
  - `label`, `description`
  - `steps`: 1–20 entries (`title`, `prompt`, `severity`, optional `prompt_tokens_max`)
  - `categories`: whitelist of permitted critique categories
  - `project_id`, `is_global`, `created_at`, `updated_at`, `created_by`
- Extend critique request schema to accept `rubric_id` or inline `rubric` (inline gated to admin endpoints only).

### API Surface
- `GET /api/v1/critique/rubrics?project_id=` — list fixture + custom rubrics, include `is_editable`, `source` (fixture/custom/global).
- `POST /api/v1/critique/rubrics` — create custom rubric (auth required, validates schema, assigns slug if omitted).
- `PUT /api/v1/critique/rubrics/{rubric_id}` — update editable rubrics (optimistic concurrency with `updated_at`).
- `DELETE /api/v1/critique/rubrics/{rubric_id}` — soft delete (move to archive folder) for restore.
- `POST /api/v1/critique/batch` — accept optional `rubric_id`; reject IDs not visible to caller.

### Validation & Security
- Enforce prompt length ≤ 1500 characters and prohibit blocked keywords listed in `policies.md`.
- Require at least one step with severity `warning` or `error` to keep critiques actionable.
- Ensure `rubric_id` uniqueness per project; normalize to lowercase slug.
- CRUD endpoints require authenticated user with `editor` role (future auth hook); all writes sanitise HTML/script content.
- Store SHA256 checksum per rubric for tamper detection; verify before critique execution.

### UI Integration
- Add “Rubric Manager” modal within critique tools:
  - List rubrics with badges (`Fixture`, `Custom`, `Global`), last-updated metadata, and quick filters.
  - Editor form with live validation (slug uniqueness, blocked categories, max steps) and preview of compiled prompts.
  - Allow selecting default rubric per project; remember last-used rubric in local storage.
- Batch critique dialog exposes rubric dropdown plus link to edit/duplicate.

### Persistence
- Persist JSON via `write_json_atomic` to `history/rubrics/{rubric_id}.json`.
- Maintain `history/rubrics/index.json` summarising rubrics for quick load.
- Archive removed rubrics to `history/rubrics/archive/` with timestamped filenames.

### Testing
- Unit tests for `RubricDefinition` validators (invalid slug, blocked keywords, step limits).
- API tests for CRUD lifecycle, permission handling, and critique runs with custom rubrics.
- UI tests for rubric editor workflows and batch critique selection.
