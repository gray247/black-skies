# Roadmap

This roadmap mirrors the scope defined in [docs/phases/phase_charter.md](./phases/phase_charter.md) and stays in lock-step with the change history recorded in [docs/phases/phase_log.md](./phases/phase_log.md). Treat the charter as the source of truth for **what** we ship, the phase log for **when** events were locked, and this roadmap for a quick status snapshot.

## Status legend
| Label | Meaning |
| :---- | :------ |
| Planned | Not yet in execution; tracked via charter + GitHub milestone. |
| In progress | Active development; entries in phase log marked `IN PROGRESS`. |
| Complete | Work landed and verified; matching `LOCKED` entry in phase log. |
| Locked | Scope frozen; no further changes without charter update. |

## Phase summary
| Phase | Name | Status | Target window | Scope reference |
| :---- | :---- | :----- | :------------- | :--------------- |
| P0 | Foundation | Complete | 2025-09 | Charter v1.0 |
| P1 | Core backend API | Complete | 2025-09 | Charter v1.0 |
| P2 | GUI skeleton & panes | Complete | 2025-09 | Charter v1.0 |
| P3 | Writing & feedback loop | Complete | 2025-09 | Charter v1.0 |
| P4.0 | Observability baseline | Complete | 2025-09 | Charter v1.0 |
| P4.1 | Documentation & tagging sweep | Complete | 2025-09 | Charter v1.0 |
| P5 | Tools, data, evaluation harness | Complete | 2025-09 | Charter v1.0 |
| P6 | End-to-end integration & contracts | Complete | 2025-09 | Charter v1.0 |
| P7 | Release candidate | Complete | 2025-09 | Charter v1.1 |
| P8 | Insights & feedback expansion | In progress | 2025-10 | Charter v1.1 |
| P9 | Analytics & visualization | Planned | 2025-11 | Charter v1.1 |
| P10 | Accessibility & professional exports | Planned | 2025-12 | Charter v1.1 |
| P11 | Agents & plugins | Planned | 2026-01 | Charter v1.1 |

## Deferred Features (Not in v1.1)

The following planning docs describe capabilities that remain on the roadmap beyond the Phase 8 shipping surface. Update them when the corresponding phase gates open.

- [`docs/deferred/voice_notes_transcription.md`](./deferred/voice_notes_transcription.md) – Voice note recording, transcription, and playback flows that ship in later accessibility/insights phases.
- [`docs/specs/plugin_sandbox.md`](./specs/plugin_sandbox.md) – Plugin/agent sandboxing, permission gating, and auditing planned for Phase 11.
- [`docs/specs/backup_verification_daemon.md`](./specs/backup_verification_daemon.md) – Backup verifier daemon, diagnostics, and health payload extensions that stay disabled in v1.1.
- [`docs/deferred/smart_merge_tool.md`](./deferred/smart_merge_tool.md) – Smart merge workflow for combining scene variants and annotations (Phase 11 editorial tooling).
- [`docs/gui/accessibility_toggles.md`](./gui/accessibility_toggles.md) – Large-font + high-contrast theming toggles (Phase 10 accessibility focus).
- [`docs/phases/phase10_recovery_pipeline.md`](./phases/phase10_recovery_pipeline.md) – Snapshot/hot restore UX improvements scoped for Phase 10.
- [`docs/phases/phase11_export_pipeline.md`](./phases/phase11_export_pipeline.md) – Export builder advances (Markdown/JSON/PDF/EPUB/ZIP) slated for Phase 11.

## Phase detail

### P8 – Insights & feedback expansion (In progress)
- Docking-aware Insights overlay, batch feedback mode, rubric editor, budget meter, quick restore toast.
- Milestone tracking: GitHub milestone “Phase 8 – Docking Verification”.
- Latest details: see phase log entry `2025-10-28 Phase 8 docking verification (IN PROGRESS)`.

### P9 – Analytics & visualization (Planned)
- Emotion arc timeline, adaptive pacing graph, conflict heatmap, scene length analyzer, revision streak tracker, project health dashboard, outline validation engine.
- Milestone tracking: GitHub milestone “Phase 9 – Analytics & Visualization”.

### P10 – Accessibility & professional exports (Planned)
- Voice notes, large-font/high-contrast modes, dynamic export templates, corkboard cards PDF, batch outline report, status badges.
- Milestone tracking: GitHub milestone “Phase 10 – Accessibility & Exports”.

### P11 – Agents & plugins (Planned)
- Read-only agent hooks, plugin registry sandbox, safety layer, auto-backup verification, multi-project dashboard, smart merge tool, offline indicator & cache manager.
- Milestone tracking: GitHub milestone “Phase 11 – Agents & Plugins”.

---

## Consistency checks
- Run `python scripts/check_roadmap_vs_phase_log.py` (see script below) to verify that roadmap statuses and dates match the latest entries in `phase_log.md`. CI will fail if discrepancies are detected.

```bash
python scripts/check_roadmap_vs_phase_log.py
```
