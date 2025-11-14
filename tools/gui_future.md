# docs/gui_future.md - Black Skies GUI Expansion Roadmap

**Status:** Draft A - 2025-11-08  
**Scope:** Upcoming interface modules and UX refinements beyond Phase Charter v1.0.

---

## Overview
Black Skies already delivers the full Wizard + Outline + Draft + Rewrite + Critique loop.  
This roadmap captures the next horizon: the **Spark Pad** (idea capture), a **Critique-to-Visuals layer** (analytics and emotional mapping), and day-to-day UX refinements that raise the desktop client to production quality.

---

## Bookend 1 - Spark Pad (Before the Wizard)

### Purpose
A lightweight capture layer for chaotic ideas-snippets, vibes, dialogue lines, images-that can be promoted into the Decision Checklist.

### UI Preset
`Spark Pad (left) | Wizard (center) | Draft Board (right) | History (bottom)`

### Core Features
- **Capture strip:** fields for Title, One-liner, Loose note, Image drop, Tags.
- **Clusters:** auto-group notes by similar text/tags; editable names.
- **Promote flow:** select -> "Promote to Wizard" -> choose Premise / Theme / etc.
- **Focus toggle:** full-screen "Spark Only" board for fast idea dumping.

### Hotkeys
Global quick actions: `Ctrl/Cmd+`` (quick capture), `Ctrl/Cmd+P` (promote), `Ctrl/Cmd+G` (group/ungroup), `Ctrl/Cmd+T` (add tag).

### Data Additions
```
spark/ideas.json       -> id, text?, image_ref?, tags[], cluster_id?, source
spark/clusters.json    -> id, name, member_ids[]
wizard/promotions.json -> idea_ids[] -> checklist_item_id
```

### API Hooks
`POST /spark/idea`, `POST /spark/cluster`, `POST /spark/promote`, `GET /spark/suggest-themes`.

### Value
Lets writers start messy and graduate ideas into structure without friction.

---

## Bookend 2 - Critique + Visuals Layer (After Rewrite / Critique)

### Purpose
Transform critique data plus metadata into visual story analytics.

### UI Preset
`Visuals (left) | Draft Board (center) | Critique (right) | History (bottom)`

### Views
1. **Emotion & Pacing Timeline** - scene-by-scene emotion curve vs pacing target.
2. **Critique Trendline** - rubric category scores across revisions.
3. **Relationship Graph** - character co-presence and dialogue edges.
4. **Coverage Heatmap** - scene vs rubric category coverage.

Clicking any data point jumps directly to the scene and filters notes.

### Hotkeys
`V` cycles views, `J/K` jump between anomalies, `Enter` opens the scene.

### Data Additions
```
analytics/scene_metrics.json   -> pacing_target, emotion_tags[], character_ids[]
analytics/critique_scores.json -> rubric_scores { Logic, Tension, HorrorLever }
analytics/graph.json           -> characters[], edges[{ a, b, weights }]
```

### API Hooks
`POST /analytics/build`, `POST /analytics/refresh`, `GET /analytics/*`.

### Exports
- **Pitch Deck:** outline + relationship snapshot + emotion timeline.
- **Submission PDF:** draft_full + rubric summary appendix.

### Value
Turns feedback into decisions; exposes pacing slumps and character imbalances.

---

## Implementation Recommendations

### View + Hotkey Map
A modal listing all global and pane hotkeys; searchable; respects accessibility scaling. Opens via the View menu or `Ctrl/Cmd+K`; `Esc` closes the modal.

### Saved Layout Persistence
Persist dock configuration to `/project-root/windowLayout.json`. Save pane sizes, visibility, and last active tab; provide a safe fallback and toast on restore.

### Accessibility Toggle
Large-font / high-contrast toggle in the View menu and the future Settings panel; persists per project.

### Focus-Cycle Validation
`Ctrl+Alt+[` and `Ctrl+Alt+]` rotate focus Wizard -> Draft Board -> Critique -> History (wrapping). Update the header highlight and ARIA announcement; ignore text editing contexts.

### Toast System
Unified toast provider for **Accept - Lock - Undo - Layout Reset** actions. 5-second TTL; Undo reverses the action; bottom-right placement; non-blocking.

### Baseline Layout Validation
Re-test the default Dock preset at 1920x1080. Confirm all panes are visible, headers readable, and no overflow occurs.

---

## Optional UI Enhancements

### Quick Scene Switcher
Dropdown atop Draft Board listing `sc_####` and titles; type-ahead jump; retains scroll state.

### Critique Density Slider
Filters inline comments by severity (Minor + Major); updates live; badge shows count.

### Persistent Command Bar (Ctrl+K)
Global palette: Jump to scene - Run critique - Toggle Focus Mode - Open Hotkey Map - Snapshot now. Includes fuzzy search and hotkey hints.

### Snapshot Timeline (Micro-Chart)
Sparkline above the History pane showing daily snapshot volume. Clicking a bar filters the list; updates whenever a new snapshot lands.

---

## Integration Map

| Feature | Primary Doc | Secondary Doc |
|:--|:--|:--|
| Spark Pad | gui_future (source) | gui_layouts, decision_checklist |
| Visuals Layer | gui_future (source) | data_model, exports |
| Hotkey Map | gui_layouts | - |
| Layout Persistence | data_model | gui_layouts |
| Accessibility Toggle | policies | gui_layouts |
| Focus Cycle | gui_layouts | - |
| Toast System | gui_layouts | - |
| Baseline Test | gui_layouts | - |
| Quick Scene Switcher | gui_layouts | - |
| Critique Density Slider | critique_rubric | - |
| Command Bar | gui_layouts | - |
| Snapshot Timeline | gui_layouts | data_model |

---

## QA Acceptance Checklist

- Hotkey Map opens via menu or Ctrl+K; searchable; scales with accessibility.
- Layout restores after restart; fallback triggers a toast.
- Accessibility toggle persists and affects all panes and modals.
- Focus cycle rotates correctly; highlight stays in sync.
- Toasts fire for every Accept/Lock/Undo/Layout event.
- Default layout validated at 1920x1080.
- Scene switcher jumps instantly and preserves focus.
- Density slider filters and updates count live.
- Command bar lists valid commands with hotkeys.
- Snapshot timeline updates in real time after new entries.

---

## Rollout Sequence

1. **Hotkey Map + Command Bar** - discoverability first.  
2. **Layout Persistence + Baseline Test** - stability.  
3. **Toasts + Focus Cycle** - interaction feedback.  
4. **Accessibility Toggle** - inclusive design.  
5. **Spark Pad module** - front-loaded idea capture.  
6. **Visuals Layer (trendline + heatmap)** - early analytics.  
7. **Scene Switcher + Density Slider + Snapshot Timeline** - daily UX wins.  
8. **Visuals expansion (emotion/pacing timeline + graph)** - final polish.

---

## Pending GUI Follow-ups

- **Z-index stacking validation** – double-check `.service-pill`, `.toast-stack`, and `.companion-overlay` layer order once floating panes are stable so toasts stay clickable.
- **Button hierarchy documentation** – capture the solid-violet / outlined / text button palette so new controls follow the shared rhythm before future toolbars change.
- **Dock persistence debounce** – confirm `DockWorkspace.tsx` still debounces layout saves (~600 ms) when toolbar tweaks create extra reflows; tune if it drifts.
- **Keyboard regression rerun** – after contrast/badge updates, re-run Tab/Shift+Tab/Esc navigation tests to ensure focus order stays intact.

**Author:** Black Skies Systems Team  
**License:** MIT  
**Last Updated:** 2025-11-08
