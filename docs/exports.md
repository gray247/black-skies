# docs/exports.md — Writer-Facing Outputs (Source of truth)
**Status:** LOCKED · 2025-09-15  
Covers: what files are produced for writers and what metadata is included.  
References: `docs/data_model.md` for internal storage.

## Files
- **outline.md / outline.json** — outline summary; JSON includes IDs & order.  
- **draft_full.md** — concatenated chapters; clean prose (no critique notes).  
- **chapter_{n}.md** — per-chapter exports.  
- **Optional**: corkboard cards PDF (later).

## Metadata Policy
- JSON exports **include** locked decisions & critique notes (for machine use).  
- Markdown exports are **clean** (no notes), with optional end-notes in appendix (toggle).