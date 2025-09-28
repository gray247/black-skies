# docs/gui_layouts.md — GUI Layouts & UX Contracts (Source of truth)
**Status:** LOCKED · 2025-09-23
**Version:** v1 (Phase 1 / 1.0)  
**Platform:** Windows 11 (desktop)

Source-of-truth for the app's visible states, panes, hotkeys, a11y, and motion. All copy below is final unless noted.

---

> **Implementation note (2025-09-23):** The renderer currently ships the Wizard rail, project console, and Preflight modal. Sections describing the Draft Board, Critique pane, History footer, and companion flows remain in the backlog for upcoming milestones.

## Primary screen layout (LOCKED)
The app uses a 4‑pane layout with a top bar and footer history:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: app title • project switcher • actions (Generate, Critique)        │
├───────────────┬───────────────────────────────────────────┬──────────────────┤
│ Wizard (L)    │ Draft Board (Center)                      │ Critique (R)     │
│ rail          │ • Scene meta fields (readonly/editable)   │ • Rubric chips   │
│ • steps       │ • Editor (CodeMirror 6)                   │ • notes list     │
│ • locks       │ • Diff (merge view) toggle                │ • suggested edits│
├───────────────┴───────────────────────────────────────────┴──────────────────┤
│ History footer: snapshots • locks • autosave • export status                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Docking/resizing:** All three panes (Wizard, Draft, Critique) are resizable with draggable dividers. Minimum widths: Wizard **220px**, Critique **280px**. Panes remember size per project.
- **Collapse/expand:** Each side pane can be collapsed to icons; hover shows a tooltip; click expands.
- **Responsive:** Below **1100px** width, the layout stacks: Wizard → Draft → Critique vertically.

---

## Editor & Limits (LOCKED)
- **Editor:** **CodeMirror 6** with syntax extensions only for Markdown (no code language packs).  
- **Diff:** Merge view available; **off by default**; toggle from Draft Board. Word‑level diffs, hunk anchors ±3–5 tokens.  
- **Scene size cap:** **20k words** per scene. Draft Board hard‑stops edits beyond the cap (message + link to split guidance).  
- **Autosave:** Debounced 2s after idle; **Snapshot** created automatically on **Accept**/**Lock** actions.  
- **Emotion tags (lite):** **dread, tension, respite, revelation, aftermath** — selectable pill; stored in front‑matter.

---

## Preflight Panel (LOCKED)
Shown before **Generate** or **Critique** runs.

**Contents**
- **Token/$ estimate** (from preflight)  
- **Model** chosen (from Model Selection Policy)  
- **Scenes impacted** (IDs & titles)  
- **Budget status** (soft/hard threshold state)

**Actions**
- **Proceed** (primary) • **Cancel** (secondary)  
- If estimate exceeds soft budget: panel shows a yellow warning and still allows **Proceed**.  
- If hard budget would be exceeded: **disable Proceed**; the service will return `BUDGET_EXCEEDED` if attempted. **Disabled Proceed shows tooltip:** “**Hard budget would be exceeded.**”

---

## Read‑Through Mode (LOCKED)
A distraction‑free reader that stitches scenes in order.

- Shows **scene title**, **purpose**, **emotion tag** above each scene; no editing controls.  
- Keyboard: **PgUp/PgDn** to move scene‑by‑scene; **Esc** returns to Draft Board.  
- Maintains scroll position and current scene when exiting.

---

## Critique Pane (LOCKED)
- **Rubric chips:** Logic, Continuity, Character, Pacing, Prose, Horror (toggle to filter notes).  
- **Notes list:** grouped by priority; clicking a note jumps the editor to the approximate line.  
- **Suggested edits:** rendered as a list of diffs with **Apply** per hunk and **Apply All** → creates a Snapshot first.

---

## Wizard Rail (LOCKED)
- Steps: Input & Scope → Framing → Structure → Scenes → Characters → Conflict → Beats → Pacing → Chapters → Themes → Finalize.  
- Each step has a **Lock** button; lock creates a Snapshot and freezes the inputs for that step.  
- The Outline build button appears on **Finalize** when all required steps are locked.

---

## History Footer (LOCKED)
- Displays badges: **Snapshot**, **Lock**, **Autosave**, **Exported** with timestamps.  
- Clicking a Snapshot opens a **Restore** modal (diff summary → Confirm).  
- Overflow scrolls horizontally; tooltips show details.

---

## Loading & Motion (LOCKED)
- **Spinner overlay:** pulse + rotating ring (no logo) centered on screen; background radial darken.  
- **Reduced motion:** if `prefers-reduced-motion` is on, disable rotation; keep a subtle opacity pulse.  
- **Panel transitions:** 200–250ms ease for expand/collapse; no slide‑in for critical alerts.

---

## Errors & Alerts (LOCKED)
- **Budget exceeded:** sticky banner at top of Draft Board with **Dismiss** and **Open Preflight**.  
- **Validation errors:** inline under fields; top summary in Preflight when relevant.  
- **Crash recovery:** on next launch, show a **Recovery** banner with “Reopen last project” and “View diagnostics” (local file link).

---

## Accessibility (LOCKED)
- **Keyboard:** full navigation without mouse.  
  - Global: **Ctrl+Enter** = Preflight → Generate; **Ctrl+Shift+E** = Preflight → Critique; **Ctrl+D** = Toggle diff; **Ctrl+/** = hotkeys help.
  - Editor: standard CM6 bindings; **Alt+↑/↓** jumps between diff hunks (when diff on).
  - Pane focus cycle: **F6** (Wizard → Draft → Critique → footer → top bar).
- **Focus:** 2px focus ring with 3:1 contrast minimum; all actionable controls reachable.  
- **ARIA:** labels on toggles; live regions for toasts; role=dialog on Preflight and Restore modals.  
- **Color/contrast:** minimum 4.5:1 for text; 3:1 for icons and focus rings.

---

## Notifications (LOCKED)
- Toasts at bottom‑right for: **Saved**, **Snapshot created**, **Apply success/fail**, **Export complete**. Each auto‑dismisses in 3s and is logged to History footer.

---

## Integrations shown in UI (LOCKED)
- **Companion Mode:** opens ChatGPT in the system browser (user subscription); copies the selected text and a short context snippet. No content is sent automatically.  
- **BYO endpoint (advanced):** hidden in Settings; off by default; when on, shows provider and model strings near the Preflight estimate.

---

## Strings & Copy (LOCKED)
- Primary button verbs: **Generate**, **Critique**, **Apply**, **Proceed**, **Cancel**, **Restore**, **Dismiss**.  
- Tone: direct, neutral; avoid “AI” in user‑facing copy except in Settings.

---

## Telemetry (LOCKED)
- None. All counts/estimates are local. Crash logs written to `history/diagnostics/` only.

---

## Versioning (LOCKED)
- This document: **v1**. Any UX change that affects behavior must update this file and note it in `phase_log.md`.
