# docs/data_model.md — Black Skies (Source of truth)
**Status:** LOCKED · 2025-09-15  
Covers: project folder layout, JSON objects (high level), IDs & renames, snapshots.
Does NOT cover: API payloads (see `docs/endpoints.md`), writer exports (see `docs/exports.md`).

## Project Folder Layout (LOCKED)
/project-root/
  outline.json
  drafts/
  revisions/
  history/

## JSON Objects (high level)
- Outline (acts/chapters/scenes, stable IDs, order, beat links)
- Draft units (scene/chapter text + metadata: pov, purpose, pacing target)
- Revisions (suggested edits + accepted diffs by unit ID)
- History entries (timestamp, note, version, shallow copies)

## ID Scheme & Renames (LOCKED)
- Scenes: sc_0001… ; Chapters: ch_0001… (immutable)
- Optional human-readable slugs (safe to change)
- Reorders don’t change IDs; cross-refs by ID; slug_history kept
- Merges: new target with merged_from[] ; Splits: parent lists split_into[]
- Auto-migrate on schema bump; write backup alongside
