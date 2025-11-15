# docs/phases/phase11_export_pipeline.md — DRAFT
> **Status:** Planned
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Phase:** Phase 11 (Export & packaging)
> **Source of Truth:** Align with `docs/phases/phase_charter.md` Phase 11 scope; do not diverge from that source.

## Scope
Deliver clean, writer-facing exports with packaging options for Markdown, JSON, PDF, EPUB, and ZIP bundles while protecting critique metadata and keeping the UI responsive.

## Formats
- **Markdown:** `draft_full.md` plus per-chapter `chapter_{n}.md`, all free of critique notes unless the appendix option is selected.
- **JSON:** `outline.json` and `draft_manifest.json`, designed for machine consumption and including critique metadata in structured form.
- **PDF / EPUB:** Rendered with the template engine (fonts, margins, front matter) and decorated with optional analytics/critique appendix.
- **ZIP:** Bundles everything per the Packaging spec so projects can share or archive all artifacts.

## Export Builder Service
- `POST /export/build` accepts `{ project_id, targets, options }`, registers a job, and returns `{ job_id }`.
- `GET /export/status/{job_id}` reports `{ job_id, status, artifacts }` where each artifact includes `type`, `path`, `bytes`, and `sha256`.
- The service runs asynchronously, cleans Markdown of critique markers unless `appendix` is true, and normalizes whitespace, scene separators, and title styles before handing artifacts back to the UI.

## Cleanup Rules
- Strip inline critique comments from prose; keep end-notes only if `appendix` is enabled.
- Normalize whitespace, apply consistent scene separators, and standardize title styles across formats.

## GUI Export Panel
- Checklist of targets (MD / JSON / PDF / EPUB / ZIP) plus a template selector (`default`, `print-compact`, `ebook-serif`).
- Toggles for “Append critique end-notes” and “Split by chapter”.
- Progress bars for each artifact with buttons for Open Folder and Reveal in Explorer.

## Acceptance
1. Clean Markdown output contains no critique markers while JSON still captures critique metadata.
2. Exporting a 100k-word book completes within target time without freezing the renderer.
