# docs/exports.md — Writer-Facing Outputs v1.1
**Status:** LOCKED · 2025-10-10
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

### Export Matrix — Phase 8 Additions
| Artifact | Trigger | Contents | Notes |
| --- | --- | --- | --- |
| `critique_bundle.md` | Critique pane → **Export Critiques** (markdown) | Scene-by-scene critiques with rubric scores, inline diffs, Companion callouts | Uses project timezone; sections ordered by scene order; includes analytics summary footer |
| `critique_bundle.pdf` | Critique pane → **Export Critiques** (pdf) | Paginated version of markdown bundle; embeds rubric tables and budget summary | Rendered via wkhtmltopdf; retains bookmarks per scene |
| `analytics_summary.md` | Analytics pane → **Export Analytics** | Emotion arc snapshot, pacing highlights, conflict heatmap summary, trend commentary | Phase 9 template reused; Phase 8 ensures stub generation with Companion notes |
| `analytics_summary.pdf` | Analytics pane → **Export Analytics (PDF)** | Printable analytics summary with charts exported as inline SVG rasterized to PNG | Appendices list dataset freshness timestamps |
| `budget_ledger.json` | Budget meter → **Download ledger** | Itemized spend history, per-action cost, projected totals | Phase 8 to surface for override review |

### Critique Bundle Structure
- **Cover page:** project name, export timestamp, rubric set applied, budget snapshot.
- **Scene section order:** chronological; each includes header `Scene {n} — {title}` with word count.
- **Rubric table:** columns `Criterion`, `Score`, `Summary`, `Priority`.
- **Companion highlights:** callout boxes labelled `Companion Suggestion` with actionable copy + diff snippet.
- **Batch metadata:** `batch_id`, `initiated_by`, `units`, `model.name`, `model.provider` stored in front matter.
- **History link:** references snapshot IDs for accepted changes with `history://{snapshot_id}` URI scheme (Phase 8 placeholder).

### Analytics Summary in Markdown/PDF Bundles
- Markdown exports append section `## Analytics Snapshot` with subsections:
  - `Emotion arc` — bulleted highs/lows, numeric deltas.
  - `Pacing` — fastest/slowest scenes, average cadence.
  - `Conflict heatmap` — top hotspots, gaps.
  - `Revision streak` — current streak days + longest streak.
- PDF exports mirror markdown order; charts exported as 1200px wide PNGs; ensure alt text tags for accessibility.
- Both variants must state data freshness: `Data current as of {iso_timestamp}`.
- When analytics unavailable, insert placeholder "Analytics pending — run Analyzer" in both formats.

---

## Metadata Policy (Updated)
- JSON exports now include AI metrics (arc, pacing, conflict, revision stats).
- Markdown/PDF exports append analytics snapshot + critique score summary when available.
- Critique bundles must include `meta.batch_id`, `meta.rubric_version`, `meta.model`, `meta.currency` (`USD`) and `meta.costs` (spent/pending/estimated_next).
- Budget ledger export requires cumulative totals by day plus `soft_cap`/`hard_cap` fields for UI parity.
- All exports carry phase version tags (`meta.version: v1.1+`).
