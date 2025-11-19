# Phase 5 – Export & Integrity Tracker (Working Doc)

> **Status:** Temporary working file for Phase 5.  
> Purpose: Track tasks, decisions, and progress while we implement export/import, integrity, snapshots, and backups.  
> When Phase 5 ends, this file becomes part of `archive/phase5/` and any permanent knowledge moves into `docs/`.

---

## 1. Phase 5 Goals (Quick Reference)

**High-level goal:**  
Lock down all import/export and integrity behavior so projects are safe to move, back up, restore, and ship.

**Scope buckets:**
- Export formats (PDF, DOCX, RTF, TXT, MD, ZIP)
- (Optional) Import formats (DOCX, TXT, RTF, MD, maybe PDF later)
- Metadata & integrity rules
- Snapshots (short-term safety net)
- Backups (long-term ZIP archives)
- Backup verification daemon

---

## 2. Export – OUT formats

- **Target formats:**
- [ ] DOCX
- [ ] PDF
- [ ] RTF
- [x] TXT
- [x] Markdown (MD)
- [x] Full project ZIP export

**Tasks / notes:**
- [ ] Decide where Export Service lives (module/path):
      - Notes:
- [ ] Define common export request/response shapes:
      - Notes:
- [ ] Implement DOCX export:
      - Notes:
- [ ] Implement PDF export:
      - Notes:
- [ ] Implement RTF export:
      - Notes:
- [ ] Implement TXT export:
      - Notes: Phase 5 Markdown + TXT exports are running via `/api/v1/export`.
- [ ] Implement MD export:
      - Notes:
- [x] Implement ZIP project export:
      - Notes: Project ZIP exports now include `project.json`, `outline.json`, `drafts/`, and `manifest.json`.
- [ ] Add minimal tests per format:
      - Notes:

## 5. Snapshots (short-term safety net)

- [x] Snapshots implementation started:
      - Notes: `.snapshots/` now contains manifest + copies of `project.json`, `outline.json`, and `/drafts/`. Retention keeps the last 7 snapshots.
- [x] Snapshot UI actions added:
      - Notes: Workspace header exposes Snapshot/Verify buttons that call the new endpoints and can reveal the `.snapshots/` folder.

## 7. Backup Verification Daemon

- [x] Backup verifier skeleton in place:
      - Notes: `POST /api/v1/backup_verifier/run` reports missing/mismatched snapshot files.
- [x] Scheduled verification runner added:
      - Notes: Controlled by `VERIFIER_SCHEDULE_SECONDS` (default 3600); saves `.snapshots/last_verification.json`.

---

## 3. Import – IN formats (optional, if doing now)

**Target formats (if Phase 5 includes imports):**
- [ ] DOCX → scenes/binder
- [ ] TXT → scenes
- [ ] RTF → scenes
- [ ] Markdown → scenes/chapters

**Tasks / notes:**
- [ ] Decide which imports are **required for Phase 5** vs “later”:
      - Notes:
- [ ] Implement basic DOCX import:
      - Notes:
- [ ] Implement TXT import:
      - Notes:
- [ ] Implement RTF import:
      - Notes:
- [ ] Implement MD import:
      - Notes:
- [ ] Add tests for at least one import path:
      - Notes:

---

## 4. Metadata & Integrity Rules

**What must always be consistent:**
- Scene IDs
- Scene order
- Binder ↔ Draft mapping
- Project manifest (titles, timestamps, etc.)

**Tasks / notes:**
- [ ] Document integrity rules in `docs/io_spec.md` or equivalent:
      - Notes:
- [ ] Implement integrity checks before/after export:
      - Notes:
- [ ] Ensure imports assign valid IDs and binder positions:
      - Notes:
- [ ] Add a small test that loads/saves a project and asserts integrity:
      - Notes:

---

## 5. Snapshots (short-term safety net)

**Concept:**  
Automatic, rolling, project-local restore points.

**Tasks / notes:**
- [ ] Confirm snapshot storage path (e.g., `.snapshots/` under project):
      - Notes:
- [ ] Define retention policy (N snapshots or X days):
      - Notes:
- [ ] Implement snapshot creation triggers (on save / on major ops):
      - Notes:
- [ ] Implement snapshot restore code path:
      - Notes:
- [ ] Add at least one test or manual checklist for “crash → restore”:
      - Notes:

---

## 6. Backups (long-term ZIP archives)

**Concept:**  
Explicit user- or system-triggered ZIPs stored outside the hot editing tree.

**Tasks / notes:**
- [ ] Define backup output location:
      - Notes:
- [ ] Implement “Create Backup” command:
      - Notes:
- [ ] Ensure backup ZIP is self-contained & restorable:
      - Notes:
- [ ] Document backup behavior in `docs/backup_and_migration.md`:
      - Notes:

---

## 7. Backup Verification Daemon

**Purpose:**  
Regularly check that snapshots and ZIP backups are actually valid.

**Tasks / notes:**
- [ ] Confirm what it checks (snapshots, ZIPs, or both):
      - Notes:
- [ ] Implement verification routine:
      - Notes:
- [ ] Wire it into whatever schedule/trigger we’re using:
      - Notes:
- [ ] Add minimal test or log check to confirm it runs:
      - Notes:

---

## 8. Open Questions / Decisions

Use this section as a scratchpad for “we need to decide X”:

- [ ] Do we support imports in Phase 5 or just exports?
      - Notes:
- [ ] Do we attempt PDF import (OCR), or defer?
      - Notes:
- [ ] Where is the line between Phase 5 core vs “nice to have”?
      - Notes:

---

## 9. Done Log (Quick Wins)

When you finish something, jot it here with a date so you can see Phase 5 moving:

- [x] 2025-11-16 – Implemented Markdown/TXT exports and export-format picker with UI feedback.
- [x] 2025-11-17 – Added Canonical Project ZIP export bundle and manifest for Phase 5 backups.
- [x] 2025-11-18 – Snapshots panel: verification details (UI) added.
- [x] 2025-11-19 – Added Restore-from-ZIP flow that duplicates projects into `{slug}_restored_<timestamp>` via the Snapshots panel.
- [ ] YYYY-MM-DD – …
