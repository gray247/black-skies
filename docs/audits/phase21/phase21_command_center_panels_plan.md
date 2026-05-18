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

## Carry-Forward Debt Register

Phase 21 must explicitly inherit unresolved or partially resolved work from Phases 14-20 instead of pretending the Command Center starts from a clean slate.

| Source phase | Carry-forward issue | Current status | Phase 21 action | Owner / future phase |
| --- | --- | --- | --- | --- |
| `14` / `15` | alias or folder identity confusion around loaded-project roots | partially bounded in shell persistence and snapshot lanes, not broadly solved | document only in Phase 21; block this phase if a new panel introduces identity drift or duplicate truth labels | `Phase 25` if backend or alias-root truth is implicated |
| `16` | proof-boundary discipline and no-overclaim rule | active governance rule, not a runtime feature | enforce in docs, test strategy, closure review, and wording | `Phase 21` closure rule |
| `17` | GUI authority wording must not imply stronger truth than exists | active governance rule | enforce in labels, placeholders, empty states, and panel copy | `Phase 21` runtime copy review |
| `18` | target-screenshot gap pressure could cause random panel soup | unresolved risk | narrow scope; only deterministic panels admitted; block this phase if it starts mirroring target concepts without authority | `Phase 21` scope guard |
| `18` / `20` | Story Navigation discoverability is still weak | explicitly deferred from Phase 20 | fix in Phase 21 | `21B` |
| `18` / `20` | placeholder trust risk in Command Center | unresolved | fix in Phase 21 | `21D` |
| `18` / `20` | `Global Tools` is metadata-only and may be noisy | unresolved | fix in Phase 21 through demotion, relabeling, or hiding | `21A` / `21D` |
| `18` / `20` | `Narrative Gaps` placeholder can mislead operators into assuming live analysis | unresolved | fix in Phase 21 through hiding, moving to deferred area, or unmistakable relabeling | `21D` |
| `18` / `20` | diagnostics/operator surface is useful conceptually but still debug-only foundation | partially classified only | document-only decision in Phase 21 unless a tertiary debug-only lane is explicitly justified | future diagnostics lane after `Phase 23` |
| `18` / `20` | layout cramming and panel fighting remain a known shell risk | partly bounded in Phase 20 | preserve and tighten collapse rules in Phase 21; block if worsened | `21E`, later refinement in `Phase 22` |
| `18` / `20` | backend drop or reconnect behavior remains observational, not solved shell work | explicitly deferred | document only; block this phase if deterministic panels start depending on unstable backend truth | `Phase 25` |
| `20` | panel-admission governance is documented but not runtime-enforced | unresolved | partially fix in Phase 21 through config, test, and visibility rules; document remainder if still docs-only | `21A` |
| `20` | long-session flicker and durability remain unbounded by operator evidence | unresolved | document only; block this phase if worsened by new panel work | later shell stabilization lane |
| `20` | shell failure and fallback classes are partly policy-only | explicitly classified in closure review | document only; Phase 21 must not claim stronger fallback runtime than exists | future shell safety lane |
| `20` | stable GUI must remain default while Split Command stays experimental | runtime-proven and test-proven | preserve and recheck in every Phase 21 implementation pass | `Phase 21` validation gate |
| `20` | no two-monitor, no AI-intelligence, no production-default claims | active scope rule | preserve | later `Phase 23` / `24` only |

## Allowed Panels

Allowed Phase 21 Command Center panels are limited to deterministic/current-project surfaces:

- Story Navigation
  - current real panel, improved for hierarchy clarity and discoverability
- Project Stats
  - deterministic counts from loaded outline, scenes, drafts, or project metadata only
- Narrative Overview
  - deterministic project summary from loaded data only
- Structure Overview
  - act, chapter, scene hierarchy if the loaded outline contains that structure
- Honest Empty States / Deterministic Placeholder Replacements
  - surfaces that clarify what is missing without implying live intelligence
- Global Tools Metadata
  - only if it remains explicitly metadata-only and does not imply command execution

## Command Center Information Architecture

Phase 21 must organize the Command Center as a deliberate information stack, not a loose collection of adjacent cards.

Recommended one-window order:

1. `Navigation lane`
   - Story Navigation is the primary command-side anchor
   - it owns current scene location, hierarchy scanability, and active-selection comprehension
2. `Deterministic overview lane`
   - Narrative Overview or Structure Overview may appear here
   - this lane summarizes loaded project truth, not inferred quality
3. `Deterministic stats lane`
   - Project Stats or compact deterministic counts
   - this lane is tertiary and first-to-collapse when space is constrained
4. `Debug / deferred lane`
   - only if something is explicitly marked debug-only or deferred
   - this lane must not compete with Story Navigation for authority
5. `Placeholder / future lane`
   - avoid by default
   - if retained temporarily, copy must say the surface is deferred and non-authoritative

Hard information-architecture rules:

- Story Navigation must be visually and cognitively first.
- Deterministic summaries must sit below or beside navigation as subordinate support, not as competing primary panels.
- Metadata-only surfaces must read as secondary utilities, not workspace-defining truth.
- Deferred or debug-only surfaces must never appear more authoritative than loaded project structure.
- No random panel soup: each panel must have a named lane, authority class, and collapse rule.

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
- notes, chat, or quick insert
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

## Panel Admission Enforcement Strategy

The Phase 21 plan must go beyond docs-only admission language.

Recommended enforcement posture for Phase 21 implementation:

- `docs`
  - the admission matrix remains canonical in this plan and in the tracker
- `component or config metadata`
  - each visible Command Center surface should declare panel id, authority level, deterministic data source, and collapse priority in a small registry or config object if that can be added without broad refactor
- `visible labels`
  - placeholder, metadata-only, and debug-only surfaces must say so in visible copy
- `renderer tests`
  - tests should assert the presence, ordering, and honest labels of admitted panels where practical
- `runtime enforcement`
  - full runtime admission policing is not required in Phase 21
  - if no registry or config object lands, the closure review must explicitly say admission enforcement is still partly docs-only

Hard rule:

- Phase 21 cannot claim admission governance is solved unless either a panel config or registry seam exists or the closure review explicitly preserves the docs-only exception.

## Deterministic-Only Data Contract

Phase 21 panels may use:

- loaded `LoadedProject` fields
- current project identity and path already loaded by the shell
- loaded outline scenes, chapters, and acts if present
- scene count, chapter count, act count, draft presence count, and similar deterministic counts
- active-scene identity and ordering
- existing command-registry metadata if explicitly labeled metadata-only

Phase 21 panels may not use:

- inferred emotional state
- inferred narrative quality
- generated safety, conflict, foreshadow, or tension judgments
- hidden heuristics presented as truth
- backend or AI outputs that do not already exist as deterministic project data
- speculative analysis dressed up as structure or stats

## Story Navigation Definition

In Phase 21, Story Navigation means a truthful project-navigation surface, not a future intelligence shell.

Required meaning:

- it always supports a scene-list baseline when scenes are loaded
- it may show act and chapter grouping only when that structure already exists in loaded outline data
- it must not synthesize fake structure labels when the source data does not contain them
- it must expose the active scene and make current position understandable at a glance
- selection behavior must stay deterministic and aligned with current shell-owned active-scene rules
- empty state copy must explain whether the project lacks scenes, lacks structure, or lacks loaded outline detail
- restored project behavior must stay consistent with Phase 20 persistence and active-scene restore rules
- large-project behavior must prioritize scanability, ordering clarity, and not flooding the command side with decorative chrome

Story Navigation does not mean:

- AI-generated hierarchy
- fake acts or chapters
- narrative quality warnings
- writing-side duplication of the full editor experience

## Placeholder Policy

Phase 21 must classify every current placeholder or low-authority surface explicitly.

`Narrative Gaps`

- default posture: hide from the active Command Center or move to a sharply labeled deferred lane
- acceptable fallback posture: visible only if copy is unmistakably deferred and non-analytic
- unacceptable posture: a live-looking panel that implies current gap detection

`AI Companion`

- default posture: hide in Phase 21
- acceptable fallback posture: deferred placeholder outside the active panel stack with explicit `Phase 23` wording
- unacceptable posture: visible as an active assistant panel inside the Command Center

`Global Tools`

- default posture: demote to tertiary metadata-only utility or hide until it has deterministic value
- acceptable posture: visible only if it does not imply live command execution or richer authority than exists
- unacceptable posture: a primary or secondary Command Center panel

`Narrative Overview story-health wording`

- default posture: keep only if the panel stays deterministic
- required change: remove or relabel any story-health framing that implies inferred health, intelligence, or hidden evaluation
- unacceptable posture: deterministic counts wrapped in intelligence-sounding health language

## Diagnostics Placement Decision

Phase 21 should not invent a second truth surface for service or runtime status.

Decision:

- diagnostics remains primarily a debug-only foundation from Phase 20
- it is not a standard Phase 21 Command Center panel
- if a diagnostic element appears during implementation, it must be tertiary, explicitly debug-only, and must not compete with Story Navigation or deterministic project truth
- service health must not be duplicated into a separate Command Center authority lane

Default Phase 21 posture:

- document-only for diagnostics placement
- no new diagnostics panel unless a narrow operator need is proven without creating competing authority

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
  - better act, chapter, scene grouping if loaded outline supports it
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
  - overview and stats panels are truthful, deterministic, and clearly labeled

### 21D - Placeholder Cleanup and Honest Empty States

- Objective:
  - remove or relabel placeholders that currently imply future intelligence too strongly
- Allowed:
  - clearer `not available in this phase` wording
  - empty states that explain missing outline, chapter, or act structure
- Forbidden:
  - decorative shells that still imply active intelligence
- Closure criteria:
  - placeholders do not masquerade as live product capability

### 21E - Command Center Spatial Priority and Collapse Behavior

- Objective:
  - preserve Writing Studio primacy while choosing which deterministic panels survive constrained width
- Required defaults:
  - Story Navigation survives longest on the command side
  - deterministic overview and stats degrade before Story Navigation
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

## Layout and Collapse Guardrails

Phase 21 inherits the Phase 20 shell layout rules as hard constraints:

- Writing Studio remains the primary working surface.
- Story Navigation must survive longer than any tertiary Command Center panel.
- deterministic support panels may condense or collapse before Story Navigation does
- metadata-only and deferred surfaces collapse first
- no panel may be added without an explicit spatial priority and collapse behavior
- no panel may rely on future two-monitor assumptions
- if a proposed panel worsens cramming or panel fighting in one-window mode, that panel is out of scope for Phase 21

## Recommended Panel Inventory Direction

Recommended current-to-Phase-21 mapping:

- keep and strengthen:
  - Story Navigation
  - Narrative Overview, but only as deterministic loaded-data summary
- convert or add if justified:
  - Project Stats
  - Structure Overview
- keep only if explicitly demoted:
  - Global Tools as metadata-only tertiary utility
- remove from the active cluster by default:
  - Narrative Gaps
  - AI Companion

## Proof and Test Strategy

Phase 21 should keep proof narrow:

- renderer tests for Story Navigation hierarchy and active-position clarity
- renderer tests for deterministic panel counts and labels
- renderer tests for honest empty states and placeholder demotion
- renderer tests for constrained-width collapse priority
- renderer tests for visible metadata-only or deferred labels if such surfaces remain visible
- App-level tests only where Split Command wiring or layout ownership changes
- Playwright smoke only if the visible shell organization changes in ways that justify an E2E witness

Proof-boundary rules:

- green renderer tests do not prove product intelligence, narrative quality, or long-session durability
- no harness result may be described as broader shell safety than it actually covers
- E2E is only required when the visible shell contract changes enough to warrant witness coverage
- human smoke is for discoverability, density, and honesty checks, not for overclaiming runtime authority closure
- if a panel is still docs-only governed or policy-only classified, the closure review must say so plainly

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
- scan Story Navigation for clarity of act, chapter, scene position if available
- verify deterministic overview and stats match the loaded project
- confirm placeholders or empty states remain honest
- narrow the window and verify Story Navigation survives while lower-priority panels collapse
- confirm Writing Studio still feels primary
- note any new cognitive overload rather than hand-waving it away

## Phase 22 / 23 Boundary

Phase 21 stops at deterministic project truth.

Phase 22 begins only when the work is about writing-surface experience, not Command Center organization.

Phase 23 begins only when the work is about AI or intelligence, generated interpretation, or speculative analysis.

If a proposed panel needs hidden heuristics, generated judgments, or uncertain provenance, it is not Phase 21 work.

## Phase 21 Closure Criteria

Phase 21 may close only if all of the following are true:

- no fake AI or intelligence panels remain visible as live authority surfaces
- Story Navigation clarity is improved or explicitly deferred again with reasons
- placeholders are removed, demoted, hidden, or honestly labeled
- deterministic-only data rules are preserved in the implemented Command Center surfaces
- panel admission enforcement is either implemented in a narrow config or test seam or explicitly still docs-only in closure review
- layout and collapse behavior still preserve Writing Studio primacy and Story Navigation survival
- stable GUI remains default
- Split Command remains experimental and flag-gated
- no two-monitor, AI-intelligence, or production-default scope creep landed
- closure review updates Phase 22, 23, 24, and 25 ownership for any unresolved leftovers
- Phase 20 policy-only fallback and durability exceptions are not silently rebranded as solved

## Recommended First Execution Goal

`21A + 21B + 21D first cut`

- formalize the panel admission matrix
- improve Story Navigation discoverability using loaded hierarchy only
- remove or relabel misleading placeholders before adding new deterministic panels

This is the safest first cut because it improves the strongest current Command Center panel and reduces trust risk before expanding the panel set.

## Open Questions for Operator

- Should `Global Tools` remain visible in Phase 21 as metadata-only, or should it be hidden until it has real deterministic value?
- If the loaded outline lacks acts or chapters, should Story Navigation show scene-only hierarchy without synthetic structure labels?
- Should deterministic `Project Stats` be its own tertiary panel, or should those counts stay inside `Narrative Overview` unless density proves they need separation?
- Is `Narrative Gaps` preferred as a removed surface in Phase 21, or as an explicitly deferred placeholder with sharper wording until Phase 23?
