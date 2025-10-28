# docs/exports.md — Writer-Facing Outputs v1.1
**Status:** UNLOCKED · 2025-10-09  
Covers: new export formats, metadata extensions, analytics inclusions.

---

## Files (Expanded)
- **outline.md/json** — outline summary + theme/motif tags.  
- **draft_full.md** — final text (no notes).  
- **chapter_{n}.md** — per-chapter.  
- **critique_bundle.pdf/md** — aggregated Batch Critiques per scene.  
- **analytics_report.json** — emotion arc, pacing, heatmap metrics.  
- **outline_report.pdf** — all Wizard decisions + validation summary.  
- **corkboard_cards.pdf** — visual scene cards.  
- **template_{name}.docx/pdf** — user-selected export layout.

---

## Metadata Policy (Updated)
- JSON exports now include AI metrics (arc, pacing, conflict, revision stats).  
- Markdown/PDF exports may append summary of analytics and critique scores.  
- All exports carry phase version tags (`meta.version: v1.1+`).

## Dynamic Template Architecture
- Introduce exporter plugins per format (`docx`, `epub`, `pdf`) under `services/src/blackskies/services/exporters/`.
- Each exporter implements `render(project_root, template_id, options)` returning artifact path.
- Templates stored in `templates/{format}/{template_id}/` with manifest:
  ```json
  {
    "template_id": "modern.epub",
    "label": "Modern EPUB",
    "format": "epub",
    "supports_badges": true,
    "requires_pandoc": true
  }
  ```
- Conversion pipeline:
  1. Assemble base manuscript (`draft_full.md`).
  2. Inject status badges (scene/chapter) via badge resolver.
  3. Run Pandoc (bundled binary) with template-specific arguments.
  4. Post-process metadata (cover art, TOC) and return artifact list.
- UI exposes template selector (dropdown) and toggles for badges, analytics appendix, critique attachment.

## Status Badges
- Badge sources: scene status (`drafted`, `critique_pending`, `accepted`), chapter readiness.
- Compute badges before export via `/api/v1/analytics/summary` + recovery tracker state.
- Inject badges into:
  - Markdown header annotations (`[status: critiqued]`).
  - DOCX/EPUB front matter (table of scenes with badges).
  - Optional PDF legend.
- Renderer widgets show badges using shared CSS tokens; export toggles allow include/exclude per format.

## Dependencies
- Bundle Pandoc + LibreOffice headless for DOCX → PDF conversion (optional).
- Add capability flags to settings (`ENABLE_DOCX_EXPORT`, `ENABLE_EPUB_EXPORT`).
- Provide fallback to Markdown if Pandoc missing.

## Tasks
1. Implement exporter interface and register Markdown/JSONL, DOCX, EPUB, PDF handlers.
2. Integrate Pandoc invocation with sandboxed temp directories.
3. Extend UI to manage templates, preview badges, and queue exports.
4. Add tests covering template manifest validation and export outputs.
