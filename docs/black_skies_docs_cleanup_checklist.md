# Black Skies Planning Docs Cleanup Checklist

> Goal: tame the “rat’s nest” of planning/docs **before** we touch new planning or run Agent Mode again.

Use this as a working checklist in the repo (e.g. `docs/docs_cleanup_checklist.md`).  
You can annotate with dates, initials, or links to PRs as you go.

---

## Legend

- **Priority**
  - 🔴 **Critical** – Fix before serious new planning or feature work.
  - 🟠 **Medium** – Important for sanity and future contributors.
  - 🟢 **Low** – Nice to have / polish.
- **Status**
  - [ ] Not started
  - [~] In progress
  - [x] Done

You can also add `(#issue-number)` or PR links after each item.

---

## Phase 1 – Quick Wins & Stray Cleanup (Easy Targets First)

### 1.1 Identify and Mark Clearly Deferred / Future-Only Features

- [x] 🔴 **Sweep for “Deferred / Not in v1.1” docs and mark them consistently**
  - [x] Add a bold status line at the top of each future-only doc (e.g. `Voice Notes & Transcription Plan`, `plugin_sandbox`, etc.) clarifying it is **deferred**, **not shipping in current release**, and which future phase it belongs to.
  - [x] Ensure each deferred doc is referenced from a single section in `BUILD_PLAN.md` or `roadmap.md` instead of being “floating”.  
- [x] 🟠 Create a short index section in `BUILD_PLAN.md` or `roadmap.md` called **“Deferred Features (Not in v1.1)”** and list each future-only doc with one-line descriptions.
- [ ] 🟢 Optionally move or tag these docs into a `docs/deferred/` folder (or add a naming convention like `*_deferred.md`) so they’re visually grouped.

### 1.2 Retire Superseded / Obsolete GUI Planning Docs

- [x] 🔴 Confirm that **`gui_fix_plan.md` is the canonical source** replacing older GUI fix / insights docs.
- [x] 🔴 For any older GUI/Insights planning docs that `gui_fix_plan.md` claims to replace:
  - [x] Either **delete** them, or
  - [x] Add a big header: “SUPERSEDED BY `docs/gui/gui_fix_plan.md` – DO NOT EDIT” and a link.
- [x] 🟠 Ensure `gui_offline_insights_and_floats_plan.md` and `gui_insights_rescue_kit.md` are clearly labeled as **supporting docs** (playbook / rescue / deep-dive) and not primary planning surfaces.

### 1.3 Clean Obvious “One-Off Helpers” and Troubleshooting Notes

- [x] 🟠 Identify small operational / troubleshooting docs (e.g. `start_codex_gui_notes`, rescue kits, one-off how-tos) that are **not** core planning:
  - [x] Add a `## Category: Troubleshooting / Ops` tag near the top.
  - [x] Make sure they are linked from a single index: **“Dev / Ops Notes”** section in `README.md` or a dedicated `docs/ops/dev_ops_notes.md`.
- [ ] 🟢 For any doc that is literally just a one-time note or no longer relevant, either:
  - [ ] Delete it, **or**
  - [ ] Move it to an `/attic` or `/archive` folder with a short explanation (“kept for historical reference”).

### 1.4 Remove Orphaned / Duplicate Checklists

- [x] 🔴 Review all “build steps / checklists / playbooks” docs (e.g. `BUILD_STEPS_*`, `P2_ACCEPT_PLAN`, milestone verification docs) and:
  - [x] Identify any that are clearly **outdated** vs current practice.
  - [x] Merge the living content into a single canonical **“Build & Verification”** doc (or two: one high-level, one detailed).
  - [x] Mark the older versions as **archived** or delete them after merge.
- [x] 🟠 Make sure `phase_log.md` and `phase_charter.md` don’t conflict with acceptance plans or milestone verification checklists. If they do, note those conflicts for Phase 2 alignment work.

---

## Phase 2 – Align & De-duplicate Planning Surfaces

> Focus: make it crystal-clear **which docs are “Book of Record”** for phases, architecture, data model, endpoints, and GUI/UX.

### 2.1 Establish a Single “Book of Record” for Phases

- [x] 🔴 Pick one master doc for phase-level intent (**candidate: `phase_charter.md` or `BUILD_PLAN.md` as the source of truth**).
- [x] 🔴 For every phase-related doc (`phase9_charter`, `phase10_recovery_pipeline`, `phase11_export_pipeline`, `phase9_11_testplan`, etc.):
  - [x] Ensure each has a **“Source of Truth”** line at the top that points back to the master phase map.
  - [x] Confirm that **status / scope / out-of-scope** match the master view.
- [x] 🟠 Where a phase has multiple partial docs (charter + testplan + scripts + UX notes), add a short **“Phase N Index”** section in the main phase doc linking to the children.

### 2.2 Architecture vs Data Model vs Endpoints – Split But Linked

- [x] 🔴 Confirm the separation of concerns:
  - [x] `architecture.md` → high-level system layout / flows.
  - [x] `data_model.md` → JSON shape + persistence rules.
  - [x] `endpoints.md` → API surface and contracts.
- [x] 🔴 For any place where a doc redefines or partially re-describes another layer (e.g., phase docs introducing endpoint details, or feature docs redefining data structures):
  - [x] Replace inline spec duplicates with **links** to `data_model.md` / `endpoints.md` instead of re-copying fields.
- [x] 🟠 Add a small **“Spec Index”** section at the top of each of these three core docs pointing to the others (“For schemas, see… For API surface, see…”).

### 2.3 Consolidate GUI / UX Planning Docs

- [x] 🔴 Decide which doc is the **primary GUI/UX spec** (likely `gui_layouts.md`).
- [x] 🔴 Ensure other GUI docs (`gui_theming`, `phase8_gui_enhancements`, GUI fix plans, etc.) clearly say:
  - [x] “Extends: `gui_layouts.md`” or
  - [x] “Implements decisions from: `BUILD_PLAN.md` / Phase X”.
- [x] 🟠 Convert any repeated “what the GUI should look like” blocks into **references** or short deltas rather than full restatements.
- [x] 🟢 Create a **GUI/UX Index** section (in either `gui_layouts.md` or a small `docs/gui_index.md`) that lists:
  - Layouts
  - Theming
  - Accessibility toggles
  - Offline/insights behavior
  - Export panel design
  - Any future-vision docs (3D outline, etc.), marked as future or experimental.

### 2.4 Align Analytics, Dashboards, and Telemetry Docs

- [x] 🔴 Make `phase9_charter.md` + `analytics_service_spec.md` + `dashboard_initiatives.md` + `performance_telemetry_policy.md` agree on:
  - [x] Which metrics exist.
  - [x] Where they are stored.
  - [x] How they are surfaced (dashboards vs logs vs `.perf/` files).
- [x] 🟠 Where duplicates exist (e.g. same metric described multiple ways), keep the most precise version and replace others with references.
- [x] 🟢 Add a short **“Analytics & Telemetry Index”** section in either `analytics_service_spec.md` or `phase9_charter.md` listing all related docs.

---

## Phase 3 – Refactor & Restructure Docs (Bigger Changes)

> Now that strays and duplicates are tamed, restructure the ecosystem so it’s obvious where to look for what.

### 3.1 Folder / Naming Structure

- [x] 🔴 Introduce a **clear folder or naming scheme**, for example:
  - `docs/phases/` – phase charters, phase-specific pipelines.
  - `docs/specs/` – architecture, data model, endpoints, analytics, plugin sandbox, etc.
  - `docs/gui/` – GUI layouts, theming, accessibility, offline/insights, export panel.
  - `docs/ops/` – start scripts, rescue kits, troubleshooting, security sweeps.
  - `docs/deferred/` – futures not in current release.
- [x] 🟠 Move existing docs into these buckets with minimal rewriting; update any absolute references if needed.
- [x] 🟢 Add small `README.md` files inside each subfolder that list the contents and intended audience (dev, QA, writer, ops).

### 3.2 Merge Highly Overlapping Docs

- [x] 🔴 Identify 2–3 biggest “overlap clusters” (e.g. build plans, phase 9–11 planning, GUI fix vs GUI enhancements).
- [x] 🔴 For each cluster:
  - [x] Decide on a **primary doc**.
  - [x] Inline or summarize content from secondary docs into clearly marked sections.
  - [x] Mark the secondary docs as **archived** or **thin pointers** (“See `X` for canonical spec”).

- [x] 🟠 Add a consistent header block to all planning/spec docs, e.g.:
  - `Status: Draft / Active / Deprecated / Deferred`
  - `Version: vX.Y`
  - `Last Reviewed: YYYY-MM-DD`
  - `Owner: (optional)`
- [x] 🟢 For obviously old docs that you keep for history, set `Status: Archived` and add a short note why it’s kept.

- [x] 🔴 Ensure every major spec (phase docs, services, GUI, analytics, plugin sandbox, voice notes, backup/migration, etc.) is linked from **either**:
  - `BUILD_PLAN.md` (implementation path) **or**
  - `roadmap.md` (future / sequencing).
- [ ] 🟠 If any doc cannot be placed on the build/roadmap at all, decide whether to:
  - [x] Archive it, **or**
  - [x] Promote it to an explicit roadmap item.

---

## Phase 4 – Final Hygiene Sweep & Agent Pass

> Once the structure is sane, we do a last manual sweep, then let the Agent take a fresh pass over the repo.

- [x] 🔴 Scan for obviously conflicting statements (e.g. two different export formats described as “final”, or two different meanings of “Companion Mode”). Add TODO comments or notes where conflicts still exist.
- [x] 🟠 Search for key terms that changed over time (e.g. old feature names, file paths, environment variables) and update or tag them as legacy.
- [x] 🟢 Run a quick search for “TODO”, “TBD”, “???”, and make sure each is either:
  - [x] Turned into a tracked task, **or**
  - [x] Resolved / removed.

### 4.2 Prepare for Agent Mode Review (Planning Layer Only)

- [x] 🔴 Decide what the Agent should treat as **canonical** (Book of Record docs).
- [x] 🔴 Add a short **“Agent Reading Guide”** doc (or section in `BUILD_PLAN.md`) telling the Agent:
  - [x] Which docs define phases.
  - [x] Which docs define architecture / data model / endpoints.
  - [x] Which docs define GUI/UX.
  - [x] Which docs are deferred / archived and should be treated as background only.
- [x] 🟠 Commit these updates and ensure filenames/paths are stable.

### 4.3 Run Agent, Capture Findings, and Patch

- [ ] 🔴 Run your GitHub Agent against the cleaned repo with prompts focused on: *(skip per instruction to avoid Agent run)*
  - Finding remaining contradictions between specs.
  - Docs that appear unreferenced or dangling.
  - Inconsistent status headers (Draft vs Active vs Archived).
- [ ] 🔴 Turn each Agent finding into a concrete task (update doc X, merge doc Y into Z, etc.). *(pending due to Agent run being skipped)*
- [ ] 🟠 Apply fixes and re-run the Agent once more if needed for a final sanity check. *(pending due to Agent run being skipped)*

---

## Phase 5 – (Later) Planning Changes, Brainstorming, and New Ideas

> This is **explicitly after** the cleanup. Included here just so the checklist reminds you not to jump ahead too early.

- [x] 🟠 Capture “good idea fairy” items in a **single** doc (e.g. `docs/idea_backlog.md`) instead of scattering them across specs.
- [ ] 🟢 When you’re ready, start a **new** planning session to reshuffle phases, add new capabilities, and revisit long-term wild ideas – with a clean documentation layer under it. *(doc ready; planning session pending)*

---

You can adjust priorities (🔴/🟠/🟢) to match reality as you go. The important part is to **start with the easy wins** (deferred labels, superseded docs, obvious duplicates), then gradually move toward structural refactors and the Agent re-scan once the nest is untangled.
