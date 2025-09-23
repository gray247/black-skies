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
The canonical index is produced by the Wizard/Outline builder and lives at project root. The **export action** simply validates schema and writes the current in‑memory outline back to disk.

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

## Roadmap (non‑blocking, not in v1)
- **DOCX/PDF** via Pandoc templates (Phase 2)
- **Chapter split exports** to separate files (Phase 2)
- **Custom export templates** (Phase 2+)
