# docs/data_model.md — Data Model (Source of truth)
**Status:** LOCKED · 2025-09-17  
**Version:** v1 (Phase 1 / 1.0)

Canonical shapes for files written to a Black Skies **project folder**. This is the source of truth for storage; endpoints must align with these shapes.

---

## Folder layout (project root)
```
/project-root/
  outline.json                   # project index (canonical structure)
  drafts/                        # one Markdown file per scene
    sc_0001.md
    sc_0002.md
  revisions/                     # reports, problem finder, continuity, agents
    problem_finder.md
    continuity_review.md
    agents/
  history/                       # snapshots & diagnostics (local only)
    snapshots/
    diagnostics/
  lore/                          # story bible entries (YAML)
    char_viki.yaml
    loc_estate.yaml
```

---

## ID & naming conventions (LOCKED)
- **Scene ID:** `sc_\d{4}` (e.g., `sc_0001`) — **immutable** once created.  
- **Chapter ID:** `ch_\d{4}` (e.g., `ch_0001`).  
- **Outline artifact ID:** `out_\d{3}`; **Draft artifact ID:** `dr_\d{3}`.  
- **File name for scenes:** `{scene_id}.md` inside `/drafts/`.  
- **Order** is a 1-based integer that governs reading order in UI; reordering **does not** change IDs.
- Cross-references (beats, critiques, ledger entities) use **IDs**, not slugs.  
- Slug history is kept in the **project index** when `slug` changes.

---

## outline.json — OutlineSchema v1 (LOCKED)
The canonical project index built by the Outline flow and used by services.

**Required fields**
- `schema_version` — literal string: `"OutlineSchema v1"`  
- `outline_id` — e.g., `out_001`  
- `acts` — array of strings (labels)  
- `chapters[]` — array of Chapter objects  
- `scenes[]` — array of SceneSummary objects

**Chapter**
```json
{
  "id": "ch_0001",
  "order": 1,
  "title": "Arrival"
}
```

**SceneSummary**
```json
{
  "id": "sc_0001",
  "order": 1,
  "title": "Storm Cellar",
  "chapter_id": "ch_0001",
  "beat_refs": ["inciting"]        // optional list, strings
}
```

**Notes**
- Titles are human-facing; IDs drive linking.  
- `beat_refs` are advisory; services interpret them but do not enforce chronology.

---

## drafts/*.md — Scene file format (Markdown + YAML) (LOCKED)
Each scene is a Markdown file with YAML front-matter followed by prose.

**Front-matter (required + optional)**
```yaml
---
id: sc_0001                      # REQUIRED — must match file name
slug: storm-cellar               # optional, human readable
title: Storm Cellar              # REQUIRED
pov: Viki                        # optional
purpose: escalation              # optional: setup | escalation | payoff | breath
goal: get the radio working      # optional
conflict: flooded basement; time pressure   # optional
turn: radio picks up coded transmission     # optional
emotion_tag: tension             # optional: dread | tension | respite | revelation | aftermath
word_target: 1200                # optional integer
order: 1                         # REQUIRED — 1-based display order
chapter_id: ch_0001              # optional; must exist in outline if provided
beats: [inciting]                # optional: list of short strings
---
```

**Body**
Plain Markdown prose after the YAML block.

**Rules**
- File name = `id.md`; `id` is **immutable**.  
- `order` controls display and compile order; changing it NEVER changes the `id`.  
- Cross-refs use **IDs**.  
- The **project index** may keep `slug_history` for user-facing URLs or future exports.

**Validation**
- `id`, `title`, `order` are required.  
- `purpose` ∈ {`setup`,`escalation`,`payoff`,`breath`} when present.  
- `emotion_tag` ∈ {`dread`,`tension`,`respite`,`revelation`,`aftermath`} when present.  
- `word_target` is an integer ≥ 0.  
- `chapter_id` must reference an existing chapter if provided.

---

## Draft artifacts — DraftUnitSchema v1 (LOCKED)
Units produced by `/api/v1/draft/generate` or `/api/v1/draft/rewrite`. Stored by services and used by the UI. Legacy
aliases return deprecation headers and should be phased out.

**Unit**
```json
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
```

**Draft artifact envelope**
```json
{
  "draft_id": "dr_004",
  "schema_version": "DraftUnitSchema v1",
  "units": [ /* Unit... */ ],
  "budget": { "estimated_usd": 0.42 }
}
```

**Diff shape (for rewrites)**
```json
{
  "added":   [ { "range": [120, 135], "text": "shorter beat." } ],
  "removed": [ { "range": [86, 119] } ],
  "changed": [ { "range": [200, 230], "replacement": "She steadied herself." } ],
  "anchors": { "left": 4, "right": 4 }   // tokens of context used for alignment
}
```

---

## Critique artifacts — CritiqueOutputSchema v1 (LOCKED)
Formal shape for critique output (see rubric doc for category semantics).

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

---

## Lore entries — YAML (LOCKED, advisory in 1.x)
YAML files under `/lore/` that power the World-card dock and continuity warnings.

```yaml
id: char_viki
type: character                 # character | place | item
name: Viki Patel
aliases: [Viki, VP]
traits:
  eyes: brown
  temperament: cautious
first_seen: sc_0001
last_seen: sc_0007
notes: >
  Mechanic; trusts machines more than people. Keeps a shortwave under the sink.
```

**Notes**
- `type` is advisory; UI can filter by it.  
- Ledger is **warning-only** in Phase 1.5 (no blocks).

---

## Revisions & history (LOCKED)
- **revisions/problem_finder.md** — non-AI lint report (pre-export).  
- **revisions/continuity_review.md** — cross-scene continuity warnings.  
- **revisions/agents/** — outputs from contained agents (Phase 2).  
- **history/snapshots/** — timestamped snapshots created on **Accept/Lock**; used for restore.  
- **history/diagnostics/** — local crash logs.
- **history/cache/** — per-project AI/cache artifacts such as prompt/response digests maintained by the services cache helpers.
- **history/runs/** — structured run ledgers created by `services.runs` (one folder per run); run metadata, events, and SLO scrub logs live here.
- **history/backup_verifier/** — per-project backup verification checkpoint files (`backup_verifier.json`) and diagnostics summaries emitted by the verifier.

---

## Versioning (LOCKED)
- This document: **v1**.  
- Artifacts include `schema_version` strings (`OutlineSchema v1`, `DraftUnitSchema v1`, `CritiqueOutputSchema v1`).  
- Future schema changes bump the version and are recorded in `phase_log.md`.

---

## Project metadata — project.json (LOCKED)
Stores the canonical `project_id` and budget ledger on disk so UI/API ↔ files stay aligned.

**File:** `/project-root/project.json`
```json
{
  "project_id": "proj_123",
  "name": "Esther Estate",
  "created": "2025-09-23T17:10:00Z",
  "budget": { "soft": 5.00, "hard": 10.00, "spent_usd": 0.00 }
}
```

**Rules**
- `project_id` is required and immutable once created. It serves as the stable identifier for outlines, drafts, history, analytics, and exports.
- Budget fields reflect current settings and running total; services update `spent_usd` after successful runs.
- Endpoints that accept `project_id` must match this file; the UI reads it from the active project context so users do not manually re-enter it for each action.

---

## History Objects
Snapshots follow the schema in `docs/phase10_recovery_pipeline.md` and appear under `/history/SS_YYYYmmdd_HHMMSS.json`.
```
{
  "id": "ss_2025-11-12_213045",
  "version": 1,
  "created_at": "2025-11-12T21:30:45Z",
  "reason": "accept_edits|chapter_save|export|shutdown",
  "outline_ref": "outline.json#sha256:…",
  "draft_refs": [{"unit_id":"sc_0007","sha256":"…"}],
  "diff_summary": {"added":12,"removed":8,"changed":4},
  "note": "auto"
}
```
Each `draft_refs` entry includes a SHA-256 checksum that the restore path verifies.

## Journal file
`/history/_journal.json`
```
{ "open_units":["sc_0003"], "caret":{"sc_0003":128}, "layout":"dock:W|D|C|H" }
```
The journal records which units are open, caret offsets, and pane layout to streamline crash restoration.

---

## Heuristics Overrides (`.blackskies/heuristics.yaml`)
Per-project heuristics (POVs, goals, conflicts, pacing) live in `.blackskies/heuristics.yaml`. The defaults are defined by `services/src/blackskies/services/heuristics.py`, but each project can override the lists and thresholds without touching service code.

**Keys**
- `povs`: list of allowed point-of-view strings.
- `goals`: scene goals (e.g., `introduce character`, `raise stakes`, `payoff`, `breather`).
- `conflicts`: list of strings or objects (`description`, `type`). Types can be `internal`, `interpersonal`, `environmental`, `cosmic`, etc.
- `word_target`: `{ "base": 950, "per_order": 40 }` to influence pacing.
- `pacing_thresholds`: `[slow_threshold, fast_threshold]` ratios for pacing classification.
- `turns`, `purposes`, `emotions`: optional lists that override playlists used by the synthesizer.

**Example**
```yaml
povs:
  - "Mara Ibarra"
  - "Ezra Cole"
goals:
  - "stabilize the perimeter sensors"
  - "keep the generator coil alive"
conflicts:
  - description: "humidity chews through every circuit"
    type: "environmental"
word_target:
  base: 900
  per_order: 20
pacing_thresholds: [1.1, 0.9]
```

The synthesizer loads this file via `load_project_heuristics()` before generating drafts so the returned units include `pov`, `goal`, `conflict`, `conflict_type`, and `pacing_target` metadata. Critique scoring then uses those metadata fields for the heuristic metrics returned to the renderer.
