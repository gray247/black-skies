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
- [x] Connect workspace export controls to the Phase 5 export service:
      - Notes: Workspace header export button now targets `/api/v1/export` for TXT/MD/ZIP, shares success/error toasts, and relies on the same integrity guard that feeds the backend.

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

## 3. Import – IN formats (Deferred)

**Decision (Phase 5):**
- Imports are **out of scope** for Phase 5. This section is kept as planning notes
  for a future phase focused on ingestion/onboarding.

**Target formats (future phase, not Phase 5 scope):**
- [ ] DOCX → scenes/binder
- [ ] TXT → scenes
- [ ] RTF → scenes
- [ ] Markdown → scenes/chapters

**Tasks / notes:**
- [ ] Decide which imports are required for the **future imports phase** vs “later”:
      - Notes: Phase 5 explicitly defers all import work.
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
- [x] Document integrity rules in `docs/io_spec.md` or equivalent:
      - Notes: `validate_project` now lives in `services/src/blackskies/services/integrity.py` and encapsulates the Phase 5 rules (scene IDs, order, binder/draft mapping, manifest consistency).
- [x] Implement integrity checks before/after export:
      - Notes: `ProjectExportService` runs `validate_project`, the restore router vets every restored tree, and `run_verification` surfaces the same check in backup reports.
- [ ] Ensure imports assign valid IDs and binder positions:
      - Notes:
- [x] Add a small test that loads/saves a project and asserts integrity:
      - Notes: `services/tests/test_integrity_validator.py` covers healthy trees plus missing manifest/duplicate scenes/missing drafts/corrupt JSON scenarios.

---

## 5. Snapshots (short-term safety net)

**Concept:**  
Automatic, rolling, project-local restore points.

**Tasks / notes:**
- [x] Confirm snapshot storage path (e.g., `.snapshots/` under project):
      - Notes: `/api/v1/snapshots` writes manifests + copies of `project.json`, `outline.json`, and `/drafts/` into `.snapshots/`; new snapshot endpoint tests assert the folder content.
- [x] Define retention policy (N snapshots or X days):
      - Notes: `SNAPSHOT_RETENTION` stays at 7 snapshots; retention test creates 8 snapshots via the API and confirms the oldest directory is pruned.
- [x] Implement snapshot creation triggers (on save / on major ops):
      - Notes: Manual snapshot endpoint already exists and is now exercised by the happy-path creation test for Phase 5.
- [x] Implement snapshot restore code path:
      - Notes: `POST /api/v1/draft/recovery/restore` now has regression coverage that mutates the project, restores a fabricated snapshot, and verifies files match the saved state.
- [x] Add at least one test or manual checklist for “crash → restore”:
      - Notes: `services/tests/test_snapshot_endpoints.py` now covers creation, retention, and restore flows so the short-term safety net is validated end-to-end.

---

## 6. Backups (long-term ZIP archives)

**Concept:**  
Explicit user- or system-triggered ZIPs stored outside the hot editing tree.

**Tasks / notes:**
- [x] Define backup output location:
      - Notes: Backups now live under `<project_base_dir>/backups/` with `BS_YYYYmmdd_HHMMSS.zip` naming; `docs/backup_and_migration.md` captures the expected ZIP layout.
- [x] Implement “Create Backup” command:
      - Notes: `POST /api/v1/backups` uses `BackupService.create_backup` to zip the entire project, include `checksums.json`, and return bundle metadata; `services/tests/test_backups.py` verifies the generated archive contains `project.json`, `outline.json`, `drafts/`, and the checksums manifest.
- [x] Ensure backup ZIP is self-contained & restorable:
      - Notes: `POST /api/v1/backups/restore` unpacks the chosen bundle into `{project_id}_restored_<timestamp>` and the new directory contains the original manifest/files; the happy-path restore test confirms the restored slug/path and essential files.
- [x] Document backup behavior in `docs/backup_and_migration.md`:
      - Notes: The docs already describe the long-term backup workflow and naming; the new tests prove the implementation follows that guidance.
- [x] Surface backup controls and verification health in the renderer:
      - Notes: The Snapshots panel now highlights the latest verification, lets users manually rerun it, lists existing long-term backup bundles, and exposes create/restore actions wired to the backend with toasts.

---

## 7. Backup Verification Daemon

**Purpose:**  
Regularly check that snapshots and ZIP backups are actually valid.

**Tasks / notes:**
- [x] Confirm what it checks (snapshots, ZIPs, or both):
      - Notes: `run_verification` now scans `.snapshots/` manifest files plus `<project_base_dir>/backups/BS_*.zip` so both snapshot and backup archives are observed per project.
- [x] Implement verification routine:
      - Notes: `run_verification` validates manifest entries, cross-checks snapshot checksums, and ensures backup bundles expose `project.json`, `outline.json`, `drafts/` plus `checksums.json`.
- [x] Wire it into whatever schedule/trigger we’re using:
      - Notes: `VerificationScheduler` now passes `ServiceSettings` into `run_verification`, persists the expanded status blob under `.snapshots/last_verification.json`, and still respects `VERIFIER_SCHEDULE_SECONDS`.
- [x] Add minimal test or log check to confirm it runs:
      - Notes: `services/tests/unit/test_backup_verifier.py` covers happy-path verification, snapshot corruption, and corrupt backup scenarios while `services/tests/test_backups.py` ensures backup bundles look right.

---

## 8. Open Questions / Decisions

Use this section as a scratchpad for “we need to decide X”:

- [x] Do we support imports in Phase 5 or just exports?
      - Decision: Phase 5 is **exports + integrity only**. All import work is deferred
        to a later phase.
- [x] Do we attempt PDF import (OCR), or defer?
      - Decision: PDF import (OCR) is **explicitly deferred**. It will not ship in
        Phase 5 due to complexity and dependency surface.
- [x] Where is the line between Phase 5 core vs “nice to have”?
      - Decision: Phase 5 must-haves:
        - Stable TXT/MD/ZIP exports (+ minimal tests).
        - Snapshots + restore behavior locked and documented.
        - Backups + verification daemon working end-to-end.
        - Basic integrity rules enforced and smoke-tested.
      - Decision: Nice-to-haves (deferred):
        - DOCX/RTF/PDF exports with rich formatting.
        - All import paths (DOCX/TXT/RTF/MD, including PDF/OCR).
        - Fancy backup/snapshot dashboards beyond simple verification status.

---

## 9. Done Log (Quick Wins)

When you finish something, jot it here with a date so you can see Phase 5 moving:

- [x] 2025-11-16 – Implemented Markdown/TXT exports and export-format picker with UI feedback.
- [x] 2025-11-17 – Added Canonical Project ZIP export bundle and manifest for Phase 5 backups.
- [x] 2025-11-18 – Snapshots panel: verification details (UI) added.
- [x] 2025-11-19 – Added Restore-from-ZIP flow that duplicates projects into `{slug}_restored_<timestamp>` via the Snapshots panel.
- [x] 2025-11-19 – Added reusable `validate_project` integrity validator, wired it into exports/restores/backups, and covered it with targeted tests.
- [x] 2025-11-19 – Wired the renderer export picker plus new Snapshots panel health/backups UI to the Phase 5 services with full toasts.
- [x] 2025-11-20 – Backup verifier now inspects backup bundles, snapshots, and writes `.snapshots/last_verification.json` with per-project statuses.

---

## 10. Phase 5 Scope Summary – must-haves vs nice-to-haves

**Must-haves for Phase 5 completion (Export & Integrity):**
- TXT, Markdown, and full project ZIP exports are stable and covered by at least
  minimal tests.
- Snapshot creation plus restore behavior functions are locked down and
  documented.
- Backups and the verification daemon complete the export/integrity story
  end-to-end.
- Export-oriented integrity rules (scene IDs/order, binder/draft mapping, manifest
  sanity) stay enforced and smoke-tested.
- Phase 5 scope centers on exports & integrity; imports are explicitly deferred.

**Nice-to-haves (deferred beyond Phase 5):**
- DOCX/RTF/PDF exports with rich formatting polish.
- All import paths (DOCX/TXT/RTF/MD and PDF/OCR) handled in a later phase.
- Advanced backup/snapshot dashboards and visualization beyond the minimal
  verification surface.
