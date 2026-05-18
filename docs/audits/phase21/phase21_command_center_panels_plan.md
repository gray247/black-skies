# Phase 21 - Split Command Command Center Panels Plan

Status: Canonical scope artifact
Date: 2026-05-18

## Summary

Phase 21 builds the first real Command Center panel layer on top of the Phase 20 shell foundation.

This phase is limited to deterministic, current-project, loaded-data panels inside the existing one-window Split Command shell.

Phase 21 does not add AI intelligence, speculative analysis, two-monitor behavior, notes/chat, quick insert, or production promotion.

Its purpose is to:

- improve Story Navigation discoverability and hierarchy clarity
- organize the Command Center around truthful, deterministic project data
- replace misleading placeholder framing with honest deterministic panels or clearer empty states
- enforce panel-admission rules before Command Center growth continues
- preserve Writing Studio primacy and the existing shell ownership model

## Phase 20 Preconditions

Phase 21 depends on the explicit Phase 20 closure truths:

- stable GUI remains default-off and canonical
- Split Command remains experimental and flag-gated
- shell-owned state, persistence, reset, invalidation, and mode separation exist
- one-window layout priority is explicit: Writing Studio primary, Command Center degrades first
- fallback classes are partly runtime-backed and partly policy-only; Phase 21 must not overclaim them
- long-session durability remains a deferred risk and must not be treated as solved

## Hard Scope Rules

Phase 21 must:

- stay inside the existing one-window Split Command shell
- use loaded project data, outline data, scene data, and command-registry metadata only
- keep Command Center panels deterministic and explainable from current project state
- preserve Story Navigation as a real panel, not a placeholder
- keep placeholder honesty explicit wherever a target concept is still missing

Phase 21 must not:

- build AI Companion
- build contextual intelligence
- build emotional analysis, tension analysis, foreshadow analysis, conflict detection, or trust-calibration systems
- build narrative health bars that depend on unknown or generated authority
- build notes, chat, quick insert, or immersive editor-side adjunct tooling
- build a second Split Command window or any monitor-specific workflow
- migrate Split Command to default
- broadly refactor renderer architecture

## Allowed Panels

Allowed Phase 21 Command Center panels are limited to deterministic/current-project surfaces:

- Story Navigation
  - current real panel, improved for hierarchy clarity and discoverability
- Project Stats
  - deterministic counts from loaded outline/scenes/drafts only
- Narrative Overview
  - deterministic project summary from loaded data only
- Structure Overview
  - act/chapter/scene hierarchy if the loaded outline contains that structure
- Honest Empty States / Deterministic Placeholder Replacements
  - surfaces that clarify what is missing without implying live intelligence
- Global Tools Metadata
  - only if it remains explicitly metadata-only and does not imply command execution

## Forbidden / Deferred Panels

Deferred to Phase 23 AI intelligence or later:

- AI Companion
- narrative gaps if backed by detection or inference rather than deterministic loaded data
- emotional pulse
- narrative health
- story constellation
- consistency warnings
- contextual intelligence
- generated recommendations, warnings, or auto-analysis

Deferred to Phase 22 or later:

- immersive writing-side outline duplication
- notes/chat/quick insert
- focus-mode writing-side adjuncts
- right-side editor-side utilities

Deferred to Phase 24:

- true two-monitor or detached-window Command Center workflow

## Panel Admission Rules

No Phase 21+ panel may be added without an explicit admission record covering:

- `data source`
  - loaded project, outline, scenes, drafts, command registry, or other deterministic source
- `authority level`
  - deterministic loaded data, derived deterministic summary, or placeholder-only
- `persistence behavior`
  - whether the panel has no persistence, shell-local visibility state only, or future deferred persistence
- `spatial priority`
  - whether the panel is primary, secondary, tertiary, or first-to-collapse
- `cognitive cost`
  - what operator attention it consumes and why that cost is justified
- `fallback behavior`
  - what appears when required data is absent or partial
- `why its own panel`
  - why it cannot remain part of Story Navigation or Narrative Overview

Hard rule:

- every feature does not automatically deserve its own panel

Phase 21 admission defaults:

- primary panel: Story Navigation
- secondary panel: deterministic Structure Overview or deterministic Narrative Overview
- tertiary panel: Project Stats or metadata-only Global Tools
- first-to-collapse: tertiary panels

## Deterministic Data Rules

Phase 21 panels may use:

- loaded `LoadedProject` fields
- loaded outline scenes, chapters, and acts if present
- scene count, chapter count, act count, draft presence count, and similar deterministic counts
- active-scene identity and ordering
- existing command-registry metadata if explicitly labeled metadata-only

Phase 21 panels may not use:

- inferred emotional state
- inferred narrative quality
- generated safety/conflict/foreshadow/tension judgments
- hidden heuristics presented as truth
- backend or AI outputs that do not already exist as deterministic project data

## Slice Structure

### 21A - Command Center Inventory and Panel Admission Rules

- Objective:
  - inventory current Command Center surfaces and formalize the admission rule into the Phase 21 execution contract
- Required decisions:
  - which current surfaces stay
  - which placeholders are removed, relabeled, or deferred
  - which deterministic additions are allowed now
- Closure criteria:
  - explicit panel inventory plus explicit admission matrix

### 21B - Story Navigation Discoverability

- Objective:
  - improve hierarchy clarity, scene location readability, and active-position comprehension without adding intelligence
- Allowed:
  - better act/chapter/scene grouping if loaded outline supports it
  - clearer labels, counts, empty states, and current-position cues
- Forbidden:
  - speculative workflow modes, writing-side duplication, AI hints
- Closure criteria:
  - Story Navigation is easier to scan and the loaded hierarchy is clearer

### 21C - Deterministic Narrative Overview and Project Stats

- Objective:
  - replace vague framing panels with deterministic summary surfaces from loaded project data
- Allowed:
  - scene counts, chapter counts, act counts, draft presence counts, active-scene placement, outline availability
- Forbidden:
  - health scores, emotional summaries, inferred gaps, speculative warnings
- Closure criteria:
  - overview/stats panels are truthful, deterministic, and clearly labeled

### 21D - Placeholder Cleanup and Honest Empty States

- Objective:
  - remove or relabel placeholders that currently imply future intelligence too strongly
- Allowed:
  - clearer “not available in this phase” wording
  - empty states that explain missing outline/chapter/act structure
- Forbidden:
  - decorative shells that still imply active intelligence
- Closure criteria:
  - placeholders do not masquerade as live product capability

### 21E - Command Center Spatial Priority and Collapse Behavior

- Objective:
  - preserve Writing Studio primacy while choosing which deterministic panels survive constrained width
- Required defaults:
  - Story Navigation survives longest on the command side
  - deterministic overview/stats degrade before Story Navigation
  - metadata-only surfaces collapse first
- Closure criteria:
  - Command Center growth remains compatible with the Phase 20 one-window layout rules

### 21F - Phase 22 / 23 Readiness Gate

- Objective:
  - prevent deterministic Command Center work from quietly becoming immersive-writing or AI-intelligence work
- Required gate:
  - no Phase 22 or 23 surface starts inside Phase 21 without explicit reclassification
- Closure criteria:
  - deterministic-vs-AI and command-center-vs-writing boundaries remain explicit

### 21G - Closure Review

- Objective:
  - classify what Phase 21 actually proved versus what still belongs to later phases
- Closure criteria:
  - explicit runtime-proven, test-proven, deferred, and policy-only closeout

## Recommended Panel Inventory Direction

Recommended current-to-Phase-21 mapping:

- keep and strengthen:
  - Story Navigation
  - Narrative Overview, but only as deterministic loaded-data summary
- convert or add if justified:
  - Project Stats
  - Structure Overview
- keep only if explicitly demoted:
  - Global Tools as metadata-only
- defer or remove from the active cluster:
  - Narrative Gaps
  - AI Companion

## Test Strategy

Phase 21 should keep proof narrow:

- renderer tests for Story Navigation hierarchy and active-position clarity
- renderer tests for deterministic panel counts and labels
- renderer tests for honest empty states and placeholder demotion
- renderer tests for constrained-width collapse priority
- App-level tests only where Split Command wiring or layout ownership changes
- Playwright smoke only if the visible shell organization changes in ways that justify an E2E witness

Recommended validation lane for implementation passes:

- `pnpm --filter app test -- SplitCommandWorkspace.test.tsx AppPreflight.test.tsx`
- `pnpm --filter app lint`
- targeted Playwright smoke if shell organization or visible behavior changes
- `git diff --check`
- `git diff --cached --check`
- `git status --short`

## Human Verification Model

Keep human verification lightweight and visual:

- launch stable GUI without the flag and confirm default behavior is unchanged
- launch Split Command with temporary `BLACKSKIES_CONFIG_PATH`
- scan Story Navigation for clarity of act/chapter/scene position if available
- verify deterministic overview/stats match the loaded project
- confirm placeholders or empty states remain honest
- narrow the window and verify Story Navigation survives while lower-priority panels collapse
- confirm Writing Studio still feels primary
- note any new cognitive overload rather than hand-waving it away

## Phase 22 / 23 Boundary

Phase 21 stops at deterministic project truth.

Phase 22 begins only when the work is about writing-surface experience, not Command Center organization.

Phase 23 begins only when the work is about AI/intelligence, generated interpretation, or speculative analysis.

If a proposed panel needs hidden heuristics, generated judgments, or uncertain provenance, it is not Phase 21 work.

## Recommended First Execution Goal

`21A + 21B + 21D first cut`

- formalize the panel admission matrix
- improve Story Navigation discoverability using loaded hierarchy only
- remove or relabel misleading placeholders before adding new deterministic panels

This is the safest first cut because it improves the strongest current Command Center panel and reduces trust risk before expanding the panel set.

## Open Questions for Operator

- Should `Global Tools` remain visible in Phase 21 as metadata-only, or should it be hidden until it has real deterministic value?
- If the loaded outline lacks acts/chapters, should Story Navigation show scene-only hierarchy without synthetic structure labels?
- Should deterministic `Project Stats` be its own tertiary panel, or should those counts stay inside `Narrative Overview` unless density proves they need separation?
- Is `Narrative Gaps` preferred as a removed surface in Phase 21, or as an explicitly deferred placeholder with sharper wording until Phase 23?
