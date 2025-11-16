Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# docs/decision_checklist.md — Writer Decision Checklist (Source of truth)
**Status:** LOCKED · 2025-09-23
**Version:** v1 (Phase 1 / 1.0)

A compact worksheet writers (and Black Skies) use from **napkin → outline**. Items marked **[AI]** are “AI Recommendable” (the app can assist/critique); items **[H]** are **Human Only** (taste/vision).

> UI references: see the [Analytics Pane](./gui_layouts.md#analytics-pane), [Preflight Panel](./gui_layouts.md#preflight-panel), and [Read‑Through Mode](./gui_layouts.md#read-through-mode).

---

## 1) Input & Scope
- [H] What notes do I actually have? (bullets, premise, snippets)
- [AI] What’s the story’s scope? (short/novel/serial) → app suggests ranges; writer decides

## 2) Initial Framing
- [AI] What’s the premise / “aboutness”? (theme, logline)
- [AI] What’s the genre or tone? (horror, romance, satire)
- [H] Who’s the intended audience? (YA, adult, literary)

## 3) Structure Choice
- [AI] Do I want a formal structure? (3‑Act, Tragedy, Save the Cat, none)
- [H] Which structure specifically? (3‑Act vs. Hero’s Journey)

## 4) Scene Skeleton
- [AI] Convert raw bullets into scene cards (sc‑001, sc‑002…)
- [AI] Suggest scene order (chronological vs. shuffled/flashbacks) → writer approves
- [AI] Suggest scene POV candidates; [H] final authority on POV

## 5) Character Decisions
- [AI] Extract core characters from notes
- [H] Decide who gets arcs (and how deep)
- [AI] Recommend who narrates/drives which scenes; [H] confirms

## 6) Conflict & Stakes
- [AI] Central conflict proposal (personal vs. external vs. cosmic)
- [AI] Stakes if they fail

## 7) Beats & Turning Points
- [AI] Inciting incident location
- [AI] Midpoint turn(s)
- [AI] Climax event
- [H] Where to place surprises/twists

## 8) Pacing & Flow
- [AI] How many acts/sections? (proposal only)
- [AI] Target word count per scene/chapter (genre averages)
- [AI] Pacing critique (where to slow/speed) → [H] can override

## 9) Chapterization
- [H] How many chapters?
- [AI] Which scenes group together? (bucket suggestions)
- [H] Chapter break style (cliffhanger vs. resolution)

## 10) Thematic Layering
- [H] Which themes matter most?
- [AI] Where themes should echo (motifs/callbacks)

## 11) Final Outline Style
- [H] Level of detail before drafting (scene summaries vs. full beat sheet)
- [AI] Auto‑add expansion suggestions to scene cards (toggle)

---

## Outputs this checklist drives
- **Outline** (`outline.json`) with deterministic order
- **Scene files** (`drafts/*.md`) with front‑matter (POV, purpose, emotion tag, word target)
- **Outline locks** + snapshots you can restore later

**Tip:** Use [Read‑Through Mode](./gui_layouts.md#read-through-mode) to sanity‑check flow before generating prose. Pre‑runs show costs in the [Preflight Panel](./gui_layouts.md#preflight-panel).

---

## Legend
- **[AI] AI Recommendable** — app can propose or critique; you approve
- **[H] Human Only** — taste/vision call; app won’t decide for you
