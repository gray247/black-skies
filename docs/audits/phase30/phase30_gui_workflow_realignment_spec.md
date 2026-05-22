# Phase 30 GUI / Workflow Realignment Spec

Status: Draft
Date: 2026-05-21

## Purpose

Phase 30 defines the target GUI/workflow spine for the real product direction:

- writing area as a Writing Surface / immersive writing surface
- highlight text and choose "Capture as Story Unit"
- create blank Story Units between existing units
- keep Story Units in a hierarchy/tree that can be rearranged, expanded, merged, bridged, and eventually become coherent story parts
- make the Command Center the place for outline intelligence, gap detection, plot holes, tropes, foreshadowing, placement suggestions, model/cost status, and tool access
- keep one active outline
- prefer local-first model routing where possible, with API/stronger models only when quality requires it
- keep dev/test controls clearly labeled as dev-only or removal candidates

This is a target spec, not a runtime claim.

## Correction Block Handoff

Phase 28 identifies authority. Phase 29 inventories what survives. Phase 30 defines the future workflow. Phase 31 rewrites the roadmap from that evidence.

Candidate Phase 32, if Phase 28-31 evidence proves it is required, is `Story Unit Data Model + Qualitative Evaluation Foundation`. It should resolve Story Unit persistence and model-quality evaluation before any GUI rebuild. It is not inserted permanently by Phase 30.

## Pass 1 Planning Note

Phase 30 Pass 1 is governance-only.
It establishes operational philosophy, mockup interpretation rules, authority layering, and dual-monitor constraints before workflow architecture begins.
Dual-monitor behavior remains exploratory only, and Command Center remains analysis-first at this stage.

## Pass 2 Progress Note

Phase 30 Pass 2 is workflow-policy only.
It defines Story Unit conceptual governance, workflow ownership boundaries, intelligence interaction constraints, and workflow transition rules without defining persistence architecture, layouts, or implementation mechanics.

## Source References

- `docs/specs/workflow_spine.md`
- `docs/specs/editorial_workflow_contract.md`
- `docs/specs/design_system_v1.md`
- `docs/specs/current_state.md`
- operator-provided GUI revamp report used as product-direction evidence only

## Policy Decision Requirements

Phase 30 cannot close until each of the following has an accepted policy decision:

- Writing Surface policy
- Command Center policy
- Story Unit workflow policy
- dev GUI versus production GUI policy
- model-routing visibility and testing policy
- dual-monitor / single-monitor fallback policy
- command/search access policy

Story Unit workflow must explicitly separate:

- desired workflow
- current model support
- persistence gap
- migration risk
- unresolved governance question

## Writing Surface

### Writing surface behavior

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

## Required Outputs

- Writing Surface behavior contract
- highlight-to-capture Story Unit flow
- blank Story Unit insertion flow
- Story Unit hierarchy/tree behavior draft
- rearrange/move/merge/expand/bridge/gap-removal workflow definitions
- Command Center zone policy
- command palette/search-bar strategy
- dev GUI versus production GUI separation policy
- dual-monitor / detachable command-center policy
- tool visibility matrix
- local/API model-routing visibility policy
- candidate Phase 32 trigger list for unresolved Story Unit persistence or qualitative evaluation questions

## Acceptance Gates

- the target workflow is concrete enough for later implementation planning
- the spec distinguishes current runtime reality from future workflow intent
- Story Unit behavior is defined at the workflow level without pretending persistence exists
- dev/test controls are not treated as final GUI controls
- model-routing visibility is explicit enough to prevent hidden quality escalation
- any unresolved data-model or quality-evaluation issue is routed to candidate Phase 32 instead of being hidden
- each policy area listed above has an accepted or accepted-with-exceptions decision
- Phase 31 cannot begin until these policy decisions are recorded

## Stop Conditions

- the spec requires a canonical Story Unit persistence model before the current phase can responsibly continue
- model-quality requirements cannot be stated without a separate evaluation framework
- GUI workflow decisions contradict Phase 28 authority or Phase 29 inventory classifications
- the phase turns into visual design or runtime implementation

## Handoff Requirements

- Phase 31 receives a workflow architecture spec with explicit dependencies and unresolved questions
- candidate Phase 32 scope is listed only if unresolved Story Unit persistence or qualitative evaluation blocks future implementation
- future GUI rebuild work receives tool visibility and dev/prod separation rules
- old scene-first compatibility questions remain visible for roadmap placement

## Validation Requirements

- docs-only diff check
- repository hygiene check for tracked files
- targeted grep for runtime-claim wording if the spec adds future-only behavior
- no runtime tests unless runtime files are changed, which is out of scope

## Unresolved-Question Register

| Question | Current handling |
| --- | --- |
| Are Story Units canonical persisted data or a compatibility layer over scenes first? | Candidate Phase 32 unless resolved by accepted Phase 30 spec. |
| How do Story Units relate to scenes, drafts, outline nodes, and metadata? | Candidate Phase 32 trigger. |
| What are the undo/delete/merge/split guarantees for Story Units? | Candidate Phase 32 trigger. |
| What quality rubric decides when local routing is insufficient and API/stronger model escalation is justified? | Candidate Phase 32 trigger. |
| Which future command-center zones are allowed to appear before runtime-backed intelligence exists? | Phase 30 policy decision with Phase 29 inventory input. |

## Exit Criteria

- The desired writing-surface / Command Center split is written down as a coherent target spec.
- The spec clearly separates runtime reality from future product direction.
- Dev/test surfaces are distinguished from final GUI expectations.
