# Pass 222 - Product System Dossier Plan

> Status notice
>
> - Current classification: `superseded`
> - Still provides: historical dossier-recovery input and early product
>   system inventory thinking.
> - No longer authorizes: the current dossier registry, current product
>   roadmap, current discovery priorities, or implementation planning.
> - Current product discovery is governed by the active product-system
>   spine in `docs/product_systems/`, especially
>   `current_truth_index.md`, `current_product_roadmap.md`,
>   `README.md`, `pre_code_discovery_plan.md`, and
>   `capability_ownership_map.md`.

## Purpose

This plan defines the document set needed to capture the target Black Skies product vision before major salvage implementation continues.

It does not claim the vision is already complete.
It does not implement any product system.
It creates the review structure needed to keep salvage work bounded and coherent.

## Not Good-Idea-Fairy Clarification

The following are not good-idea-fairy items by default:

- themes
- splash pages
- emotion graph
- relationship maps
- lore cards
- character cards
- continuity
- critique
- senses usage
- overused words
- cliche detection
- foreshadow/payoff
- explicit-content markers
- Companion
- Memory Lab

These are candidate core, support, or product systems.
Each one needs its own dossier before it is built into the salvage product.

Examples of actual good-idea-fairy add-ons are tangential extras such as:

- book cover generator
- soundtrack generator
- trailer maker
- merch or social promo tools

## Required Product System Dossiers

Future dossier set:

1. `Writing Surface`
   - defines the sovereign drafting area, direct writing flow, editing role, and low-friction entry path
2. `Command Center Surface`
   - defines the separate planning, inspection, and support workspace that never gates writing
3. `Narrative Insertion / Narrative Assertion`
   - defines the core narrative primitives and their lifecycle, provenance, and authorial truth rules
4. `Story Unit`
   - defines what Story Units are for, how they relate to insertions and assertions, and when they appear
5. `Prose / Scene Projection`
   - defines projection containers and compatibility views without making them the base architecture
6. `Outline`
   - defines planned structure, ordering, hierarchy, and relation to narrative primitives
7. `Relationship Map`
   - defines relationship modeling, display, editing, and continuity interactions
8. `Emotion Graph`
   - defines emotional structure visualization and any editing or review role
9. `Continuity`
   - defines continuity checks, state, stored results, and how other systems consume them
10. `Critique`
    - defines critique inputs, outputs, boundaries, and where critique lives in the workflow
11. `Lore Cards`
    - defines lore capture, retrieval, display, and linkage to other systems
12. `Character Cards`
    - defines character state, traits, history, and relation to continuity and critique
13. `Senses Usage`
    - defines sensory-balance review, suggestion scope, and storage rules
14. `Overused Words`
    - defines repetition review behavior and non-authoritative guidance boundaries
15. `Cliche Detection`
    - defines trope and phrase detection scope, false-positive handling, and UI role
16. `Foreshadow / Payoff`
    - defines signal and review behavior for setup, payoff, and unresolved setup tracking
17. `Explicit-Content Marker / Send-Package Censor`
    - defines explicit-content handling, masking, summarization, approval, and safe package generation
18. `Companion`
    - defines what Companion is, what it is allowed to do, and where it is not allowed to act
19. `Memory Lab`
    - defines memory workflows, storage, retrieval, privacy, and authorial-boundary controls
20. `Theme System`
    - defines theme handling as an actual product system rather than cosmetic garnish only
21. `Splash / Startup Experience`
    - defines startup intent, project-entry affordances, and what belongs before writing begins
22. `Import / Export / Google Docs`
    - defines external document movement, compatibility, loss boundaries, and trust contracts
23. `Local LLM vs Paid API Routing`
    - defines model routing, privacy, cost, capability, and failure boundaries across AI features

## Required Dossier Template

Each future dossier must answer:

- what the tool or system does
- why it exists
- whether it is user-facing, hidden, summonable, or background
- inputs
- outputs
- which other tools consume its outputs
- what is stored
- what remains temporary
- local LLM role
- paid API role
- privacy, safety, or censor behavior where applicable
- GUI placement
- testing requirements
- governance risks
- v1, v2, and future-only boundary

## Explicit-Content System Requirement

The explicit-content marker and send-package censor needs its own dossier.

That dossier must explore:

- local-only explicit text handling
- red-X, strikeout, or masked package concepts
- summarized send-package replacement options
- user approval requirements
- continuity preservation when explicit material is masked or summarized
- model and API safety boundaries
- how other writing systems approach masking or redaction if later research is performed
- how to prevent long AI runs from being killed by unsafe payloads mid-stream

## Local LLM vs Paid API Routing Requirement

The routing dossier must explore:

- which jobs are local
- which jobs need paid API
- Ollama-hosted versus alternative local model control
- model settings and control surfaces
- cost control
- quality limits
- privacy implications
- safety implications

## Future Research-Thread Plan

Recommended parallel research and documentation threads:

1. `Writing Surface + Command Center Surface`
   - workflow, authority, and surface-boundary definition
2. `Narrative Object / Projection Architecture`
   - foundation primitives, projection rules, persistence boundary, and compatibility logic
3. `Continuity / Critique / Relationship / Emotion`
   - support systems, review systems, and their non-authoritative boundaries
4. `Explicit-Content Censor / Send-Package System`
   - masking, approval, continuity, and safe delivery constraints
5. `Local LLM vs Paid API Routing`
   - cost, privacy, quality, and safety policy design
6. `GUI / Theme / Splash / Presentation Layer`
   - visual identity, startup posture, and shell presentation rules after core workflow definition

## Acceptance Criteria

This plan is acceptable only if:

- it does not implement code,
- it does not pretend the vision is already fully defined,
- it creates a clear document set for future review,
- it preserves the two work surfaces,
- it keeps `Narrative Insertion / Narrative Assertion` as foundation,
- it treats prose and scene as projection or compatibility layers,
- it prevents feature drift by documenting systems before building them.
