# Black Skies – I/O Specification

> **Purpose**  
> This document defines the canonical input/output behavior for Black Skies:  
> - Which formats are supported for export and (optionally) import  
> - How project data (scenes, binder, metadata) maps to file formats  
> - What invariants must hold across I/O operations  
> - How Phase 5 “Export & Integrity” work is framed  
>  
> This is a **permanent spec**, not a scratch file. Phase 5 work must keep this document accurate.

---

## 1. Scope

This spec covers:

- **Exports (OUT):**  
  How a Black Skies project is written out to external formats.

- **Imports (IN, optional):**  
  How external files can be ingested into a Black Skies project.

- **Integrity:**  
  The data contracts that must remain true before and after I/O, including scene IDs, ordering, and binder mappings.

The actual implementation details live in code; this file defines the contracts and expectations.

---

## 2. Project Model (High-Level)

At a minimum, the following concepts must remain coherent across I/O operations:

- **Project**
  - Title, description, created/updated timestamps
  - Global settings (language, genre, etc.)

- **Scenes / Draft Units**
  - Stable `sceneId` (or equivalent)  
  - Content (text)  
  - Optional title, summary, tags  
  - Position in the project (e.g., chapter/sequence indices)

- **Binder / Structure**
  - An ordered structure that references scenes
  - Hierarchy (parts → chapters → scenes) where applicable

- **Manifest / Metadata**
  - Top-level description of which scenes/units exist
  - Versioning information, if applicable

I/O operations must not silently destroy or duplicate scenes. Any lossy behavior must be explicitly documented in this file.

---

## 3. Export Formats (OUT)

### 3.1 Supported Formats (Phase 5 Target)

The goal for Phase 5 is to support the following export formats:

- **DOCX** – Word-compatible document
- **PDF** – Print/reader-friendly document
- **RTF** – Rich text, compatible with many editors
- **TXT** – Plain text
- **Markdown (MD)** – Lightweight markup
- **Project ZIP** – Full project archive (for backup/migration)

> **Note:**  
> If any of these formats are not implemented yet, they must be clearly documented below as “Planned” with a rough intended shape.

---

### 3.2 General Export Rules

All exports must:

- Preserve **scene order** as defined by the Binder or primary project structure.
- Include **project title** and optional metadata (author, etc.) in a consistent way.
- Avoid silently dropping scenes:
  - If a scene is excluded intentionally (e.g., filtered export), this should be explicit in the UI and, when appropriate, noted in the document (e.g., “Some scenes omitted by filter”).
- Avoid creating duplicate scenes.
- Use a consistent strategy for:
  - Scene headings (e.g., formatted titles or numbered headings)
  - Chapter/part breaks where applicable

If an exported format is **inherently lossy** (e.g., TXT cannot preserve styling or rich annotations), the limitations should be documented here.

---

### 3.3 Format-Specific Notes

#### DOCX

- Intended as the primary “word processor” export.
- Must preserve:
  - Project title
  - Scene order
  - Scene headings and basic section breaks
- Optional:
  - Table of contents
  - Basic style usage (e.g., Heading 1/2)

#### PDF

- Intended as a read-only/print-ready export.
- Mirrors the DOCX structure:
  - Same ordering
  - Same headings and chapter breaks
- Styling differences are acceptable as long as content and order are preserved.

#### RTF

- Simpler rich text export.
- Must preserve:
  - Scene ordering
  - Basic headings and breaks
- Advanced styling is not required.

#### TXT

- Plain text export.
- Must preserve:
  - Scene ordering
  - A minimal delimiter between scenes (e.g., `---` or blank lines).
- All formatting is expected to be lost; this is acceptable.
- **Status:** Supported via `POST /api/v1/export` with `format=txt`; the payload mirrors the Markdown manuscript but is emitted as `.txt`.

#### Markdown (MD)

- Intended for workflows that prefer plain text + structure.
- Should use:
  - `#`, `##`, etc. for project/chapters/scenes where reasonable.
- Where possible, mirror the Binder hierarchy in headings.
- **Status:** Supported via `POST /api/v1/export` with `format=md` in the Phase 5 export service. The exported Markdown mirrors the Binder order and can optionally include metadata headers (see the `meta_header` flag in the request payload).

#### Project ZIP

- Contains:
  - The serialized project data (e.g., JSON or similar internal format).
  - Any supporting files needed to reconstruct the project.
- Intended for:
  - Backups
  - Migration between machines
  - Debugging
- **Status:** Supported via `POST /api/v1/export` with `format=zip`. Archives sit under `exports/`, bundle `project.json`, `outline.json`, `drafts/`, and a `manifest.json` for metadata, and are intended for backups/migration.

The ZIP format must be **self-contained**: it should carry everything needed to recreate the project.

---

## 4. Import Formats (IN)

> **Note:**  
> Import support may be partial or deferred. This section documents intentions and the behavior of any imports that are implemented.

### 4.1 Planned/Supported Imports

Potential or implemented import paths:

- **DOCX → Scenes/Binder**
- **TXT → Scenes**
- **RTF → Scenes**
- **Markdown → Scenes/Chapters**
- **Project ZIP → Full project restore**

Each import path should define:

- How it splits the source into scenes/units.
- How it generates or assigns `sceneId`s.
- How it maps sections/headings into Binder structure (if applicable).
- Any assumptions or limitations (e.g., “imports only work with documents formatted in style X”).

### 4.2 Import Invariants

When importing into a project:

- New scenes must receive valid IDs.
- New or updated scenes must appear in a consistent order in the Binder.
- Existing project content should not be silently overwritten unless the user explicitly confirms a destructive operation (e.g., full restore).

If an import path is not yet implemented, note it clearly here as:

- “Not yet implemented – planned for Phase X”  
or  
- “Out of scope for current roadmap.”

---

## 5. Integrity & Invariants

These rules apply across all I/O operations:

1. **Scene Identity**
   - Each scene has a stable identifier.
   - Exports that are round-tripped (e.g., ZIP → restore) must preserve scene IDs.

2. **Scene Ordering**
   - The canonical order is defined by the Binder (or equivalent structure).
   - Exports must respect that order.
   - Imports that reconstruct a project must either:
     - Rebuild Binder order, or
     - Clearly document any deviations.

3. **Binder ↔ Draft Consistency**
   - The Binder must not reference non-existent scenes.
   - Orphaned scenes (not referenced by Binder) must be handled consistently (e.g., stored in a holding area or explicitly marked).

4. **Manifest**
   - The exported project format (especially in ZIP) should include a manifest describing:
     - Scenes
     - Binder structure
     - Version/schema information

5. **Error Handling**
   - I/O operations that fail should:
     - Avoid partial, misleading outputs
     - Surface clear errors to the user
     - Avoid corrupting the existing project

---

## 6. Relationship to Other Docs

This I/O spec works together with:

- `docs/BUILD_PLAN.md`  
  - Phase 5 “Export & Integrity” is the primary implementation phase for this spec.
- `docs/backup_and_migration.md`  
  - Describes how backups, restores, and migrations behave.
- `docs/specs/data_model.md`  
  - Defines the underlying schema (e.g., DraftUnitSchema).
- `docs/phases/phase10_recovery_pipeline.md`  
  - Covers snapshots and short-term recovery specifics.

Those documents handle lifecycle and behavior; this file defines the I/O contracts they must respect.

---

## 7. Status & Maintenance

- **Owner:** Project maintainer(s) of Black Skies.
- **Phase alignment:**  
  - Phase 5: Establish and implement the core of this spec.  
  - Later phases may extend it (e.g., new formats, richer metadata), but must keep it accurate.
- Any time a new I/O format or behavior is added, this document must be updated.
