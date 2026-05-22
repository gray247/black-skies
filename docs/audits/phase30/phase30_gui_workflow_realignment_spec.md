# Phase 30 GUI / Workflow Realignment Spec

Status: Draft
Date: 2026-05-21

## Purpose

Phase 30 defines the target GUI/workflow spine for the real product direction:

- writing area as a scratchboard / immersive writing surface
- highlight text and choose "Capture as Story Unit"
- create blank Story Units between existing units
- keep Story Units in a hierarchy/tree that can be rearranged, expanded, merged, bridged, and eventually become coherent story parts
- make the Command Center the place for outline intelligence, gap detection, plot holes, tropes, foreshadowing, placement suggestions, model/cost status, and tool access
- keep one active outline
- prefer local-first model routing where possible, with API/stronger models only when quality requires it
- keep dev/test controls clearly labeled as dev-only or removal candidates

This is a target spec, not a runtime claim.

## Source References

- `docs/specs/workflow_spine.md`
- `docs/specs/editorial_workflow_contract.md`
- `docs/specs/design_system_v1.md`
- `docs/specs/current_state.md`
- operator-provided GUI revamp report used as product-direction evidence only

## Writing Surface

### Scratchboard behavior

- The writing surface should feel calm, immersive, and writer-first.
- It should remain the primary place for drafting.
- It should not be cluttered with intelligence controls that belong in the Command Center.

### Highlight-to-capture flow

- Users highlight text in the writing surface.
- The UI offers "Capture as Story Unit" as the canonical extraction action.
- Captured text becomes a Story Unit, not a generic note blob.
- Capture must preserve the user's selection context and make the resulting unit visible in the tree.

### Blank Story Unit creation

- Users may create blank Story Units between existing units.
- Blank units are first-class, not a fallback hack.
- Blank creation must not require prefilled prose.

### Story Unit hierarchy

- Story Units live in a tree.
- The tree must support rearrange, move, merge, expand, and bridge behaviors.
- Gap removal should be a first-class workflow, not a hidden cleanup step.
- One active outline remains the organizing authority.

## Command Center

### Required zones

| Zone | Purpose |
| --- | --- |
| Story navigation | Navigate Story Units and active outline context. |
| Outline intelligence | Show structural facts about the current outline. |
| Gap detection | Identify missing connections or missing sequence segments. |
| Plot holes | Flag contradictions or structural breaks. |
| Tropes | Surface pattern awareness and overuse signals. |
| Foreshadowing | Track setup/payoff opportunities. |
| Placement suggestions | Suggest where units or scene beats belong. |
| Model/cost status | Show routing state, budget, and model tier information. |
| Tool access | Surface allowed tools and current availability. |

### Command palette / search strategy

- Prefer one search/command entry point instead of many duplicated ones.
- The palette should help find actions and surfaces; it should not become a second hidden application.
- Search may surface tools, Story Units, commands, and status labels, but not replace the visible zones.

### One active outline

- The UI should keep one active outline visible and explicit.
- Multiple outline branching is not part of this realignment spec.

## Dev GUI vs Real GUI

- Dev/test controls may exist temporarily.
- Any dev/test control that remains visible in the product GUI must be clearly labeled as dev-only or marked as a removal candidate.
- Final GUI should not expose unnecessary testing buttons or toggles unless a real operator use case justifies them.
- Placeholder intelligence surfaces should not be styled as if they are final capability.

## Dual-Monitor / Detachable Policy

- The long-term design direction may support a dual-monitor narrative command system.
- The product should still remain legible on a single monitor while the target model is developed.
- Detachable or floating command-center behavior should be treated as a policy question, not as an excuse to blur the writing surface.
- The writing surface must stay the center of flow; the Command Center may detach, but it must not steal the user's narrative context.

## Tool Visibility Policy

| Tool or surface | Policy |
| --- | --- |
| Story Unit capture | Keep visible and central. |
| Blank Story Unit insertion | Keep visible and central. |
| Outline navigation | Keep visible. |
| Gap/plot-hole/trope/foreshadowing tools | Keep visible in the Command Center. |
| Model/cost status | Keep visible in a compact status area. |
| Dev/test toggles | Hide, gate, or label dev-only. |
| Placeholder intelligence panels | Keep clearly marked as placeholder until real. |
| Experimental routing controls | Show only where they help validate quality decisions. |

## Model Routing Visibility

- Local-first routing should be the default posture when it is good enough.
- API or stronger-model routing should be visibly intentional when quality requires escalation.
- The GUI should distinguish "local", "API", and "quality escalation" states instead of hiding them inside generic AI output.
- Testing surfaces may show more routing detail than the final GUI, but the final GUI should still make the quality boundary legible.

## Exit Criteria

- The desired writing-surface / Command Center split is written down as a coherent target spec.
- The spec clearly separates runtime reality from future product direction.
- Dev/test surfaces are distinguished from final GUI expectations.
