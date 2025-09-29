# docs/exports.md — Exports & Reports (Source of truth)
**Status:** LOCKED · 2025-09-17
**Version:** v1 (Phase 1 / 1.0)

Authoritative spec for manuscript/outline exports and built-in reports. All paths are **inside the project folder**.

---

## Export targets (LOCKED)

### 1) Manuscript — `draft_full.md`
Compiles the project into a single Markdown manuscript.

- **Input:** `outline.json` order + `drafts/*.md` scene files
- **Output:** `/draft_full.md` at project root
- **Structure:**
  - `# {chapter.title}` for each chapter
  - `## {scene.title}` for each scene in chapter order
  - Scene prose = body of the scene file (YAML front‑matter stripped)
  - Optional scene meta header (toggle in UI): `> purpose: … · emotion: …`
- **Validation before compile:**
  - All referenced scene IDs in `outline.json` exist on disk
  - Each scene has `id`, `title`, `order` front‑matter fields
  - No duplicate `order` within a chapter
- **Failures:** return a visible error with a list of missing/invalid scenes; do not write partial files

**Notes**
- No styling beyond Markdown headers. No TOC. Line endings LF.
- Phase 1 focuses on clean Markdown; other formats arrive later (see roadmap).

---

### 2) Outline — `outline.json` (already canonical)
The canonical index is produced by the Wizard/Outline builder and lives at project root. The **export action** simply validates
schema and writes the current in‑memory outline back to disk.

- **Validation:** `schema_version = "OutlineSchema v1"` and all chapters/scenes have unique IDs and valid `order` integers.
- **On failure:** return `VALIDATION` with details; keep existing file untouched.

**Optional mirror (Phase 1.5):** `outline.md` = human‑readable outline (acts/chapters/scenes as a nested Markdown list).

---

### 3) Selected Scenes — `exports/selection_{timestamp}.md`
Exports a user selection (one or more scenes) to a single Markdown file for sharing/review.

- **Input:** scene IDs in the current order
- **Output:** `/exports/selection_{YYYYMMDD_HHMMSS}.md`
- **Structure:** `## {scene.title}` followed by prose per scene

---

## Built‑in reports (LOCKED)

### Problem Finder — `/revisions/problem_finder.md`
Local, non‑AI lint pass that **never blocks** export.

Checks (heuristic):
- Overused words (top 20 by z‑score vs project median)
- Passive markers (“was/were” + past participle patterns)
- Long‑sentence clusters (>35 words, 3+ in a row)
- Repeated openings (same 2–3 words across adjacent sentences)
- POV slips (heuristic) for single‑POV scenes

**Output:** Markdown report grouped by category with counts and top examples. Linked scene IDs and approximate line numbers.

---

### Continuity Review — `/revisions/continuity_review.md`
Cross‑scene warnings based on the Entity Ledger v1 (warning‑only).

Flags:
- Character trait drift vs latest ledger entry
- POV consistency per scene
- Date/sequence anomalies (simple heuristics)

**Output:** Markdown report with sections per entity and per chapter; links to scene IDs.

---

## File naming & locations (LOCKED)
- Manuscript: `/draft_full.md` (overwrites; previous versions are in `history/snapshots/` when snapshot created)
- Outline: `/outline.json` (canonical)
- Selected scenes: `/exports/selection_{YYYYMMDD_HHMMSS}.md`
- Reports: `/revisions/problem_finder.md`, `/revisions/continuity_review.md`

All paths are relative to the **project root**. Timestamps use local time.

---

## Permissions & safety (LOCKED)
- Exports **read** from `drafts/` and `outline.json`; they do **not** modify scene files.
- On any validation error, **do not** write partial output; return detailed errors.
- A snapshot is **not** automatically created for exports; snapshots are created on **Accept/Lock** in the editor.

---

## Scene front‑matter metadata (REFERENCE)
Scene files stored in `drafts/*.md` carry YAML front‑matter that the export pipeline and FastAPI writers rely on. Keys are
serialized in a fixed order during persistence, so only the fields below are guaranteed to round‑trip.

| Key | Requirement | Type | Notes |
| --- | --- | --- | --- |
| `id` | Required | string | Must match the file name (`{id}.md`). Immutable across the project. |
| `title` | Required | string | Display title for UI and exports. |
| `order` | Required | integer | 1-based position within the chapter; validated during manuscript export. |
| `slug` | Optional | string | Human-friendly token for future URLs; not interpreted by services today. |
| `pov` | Optional | string | Point-of-view label rendered in optional manuscript headers. |
| `purpose` | Optional | enum | One of `setup`, `escalation`, `payoff`, `breath`. |
| `goal` | Optional | string | Scene goal summary for internal tools. |
| `conflict` | Optional | string | Key conflict or obstacles. |
| `turn` | Optional | string | Turning point / outcome summary. |
| `emotion_tag` | Optional | enum | One of `dread`, `tension`, `respite`, `revelation`, `aftermath`. |
| `word_target` | Optional | integer ≥ 0 | Target word count used for budgeting heuristics. |
| `chapter_id` | Optional | string | Must reference an existing chapter when provided. |
| `beats` | Optional | list[string] | Advisory beat references; serialized inline (e.g., `[inciting]`). |

**Custom metadata limits.** Additional keys present in front‑matter (for example, `scene_mood` or future extensions) are currently
dropped when services rewrite the file because the persistence layer emits only the ordered list above.

### Persistence round‑trips
Scene files are rewritten by the following FastAPI endpoints:

- `POST /draft/generate` — writes synthesized scenes to disk (see “Draft generation” in `docs/endpoints.md`).
- `POST /draft/rewrite` — overwrites an existing scene after diffs pass validation (see “Draft rewrite” in `docs/endpoints.md`).
- `POST /draft/accept` — persists accepted critique revisions and triggers snapshots (see “Draft accept” in `docs/endpoints.md`).

Each path calls `DraftPersistence.write_scene`, which serializes YAML with `_FIELD_ORDER`. Until the persistence module is made
extensible, only the keys enumerated in the table above will survive a full round-trip between clients and services.

### Upcoming extensibility work
A backlog item tracks `_render` extensibility so custom meta keys can be whitelisted or dynamically persisted without code
changes. Until that work lands, client teams should avoid storing critical data in ad-hoc front‑matter keys.

### Stakeholder confirmation
Share this update with product and design leads for approval before publishing to ensure the documented metadata matrix aligns
with UI expectations and roadmap priorities.

---

## Roadmap (non‑blocking, not in v1)
- **DOCX/PDF** via Pandoc templates (Phase 2)
- **Chapter split exports** to separate files (Phase 2)
- **Custom export templates** (Phase 2+)
