# System Interaction Map

## Status

`Rough` / `Exploring` / `Not Build Ready`

## Purpose

Explain how the first-wave systems relate to one another without implying that runtime wiring, persistence, provider routing, or tool execution already exists.

This map is explanatory, not an implementation plan.

## Current Doctrine

- Writing Surface is sovereign.
- Command Center supports writing and does not gate it.
- `Narrative Insertion / Narrative Assertion` is the foundation.
- Scene is projection, container, view, or legacy compatibility only.
- Story Unit is optional.
- Outline is optional.
- AI is advisory unless accepted by the user.
- Inferred output is not authored truth.

## Core System Layers

1. `Narrative Insertion / Narrative Assertion`
   - smallest narrative foundation
2. Projections and display surfaces
   - prose projection
   - scene projection as compatibility only
   - Writing Surface
   - Command Center Surface
3. Advisory intelligence systems
   - Continuity
   - Signal Architecture
   - Memory Lab
   - Companion
4. Routing, safety, and visibility systems
   - Authorship / Provenance / AI Visibility
   - Model Routing And Budget Architecture
   - LLM Package Construction Architecture
   - Explicit Content Architecture

## Main Relationships

- `Narrative Insertion / Narrative Assertion` feeds projections, advisory systems, and later tool context.
- `Continuity` inspects narrative foundations and projections, then emits advisory continuity findings.
- `Signal Architecture` normalizes and routes signal-shaped outputs across surfaces.
- `Memory Lab` may consume narrative material and signal-bearing findings for deeper forensic or investigative work.
- `Companion` may present, explain, question, or summarize outputs from `Memory Lab`, `Continuity`, and other systems.
- `Authorship / Provenance / AI Visibility` governs how AI contribution and transformation remain visible.
- `Model Routing And Budget Architecture` governs whether local, manual, or paid-model paths are allowed.
- `LLM Package Construction Architecture` governs how model-facing packages are assembled.
- `Explicit Content Architecture` governs how raw local prose and outbound transformed packages remain distinct.

## Signal Flow

Rough doctrine flow:

`Narrative foundations / projections`
-> `Continuity or other advisory producers`
-> `Signal Architecture`
-> `Writing Surface`, `Command Center`, `Outline`, `Companion`, or later tool-specific panels

Important boundary:

- signals remain advisory unless the user accepts or acts on them,
- signal visibility does not grant signal authority,
- one signal may have multiple consumers without creating multiple truth owners.

## AI/Model Flow

Rough doctrine flow:

`task request`
-> `Model Routing And Budget Architecture`
-> if allowed, `LLM Package Construction Architecture`
-> local model, manual path, or paid API path later
-> outputs return as advisory material
-> `Authorship / Provenance / AI Visibility` governs how outputs are shown

Important boundary:

- arrows do not imply runtime wiring exists,
- arrows do not imply paid API is enabled,
- arrows do not imply silent paid spend is allowed.

## Explicit-Content Package Flow

Rough doctrine flow:

`raw local prose`
-> `Explicit Content Architecture`
-> if outbound work is allowed, masked, summarized, or transformed package
-> later package construction and routing

Important boundary:

- explicit-content transforms outbound packages, not raw prose,
- local-only raw analysis remains possible,
- marker, censor, and package behavior are related but not identical.

## Authorship/Provenance Flow

Rough doctrine flow:

`authored prose / AI output / suggestion / transformed package state`
-> `Authorship / Provenance / AI Visibility`
-> visible distinction in `Writing Surface`, `Command Center`, or later export-aware systems

Current doctrine-under-review:

- black = author text
- green = AI-generated text
- purple = AI suggestion
- red or strikeout = removed, masked, rejected, or censored text

Important boundary:

- accepted-AI transition remains unresolved,
- export and persistence behavior remain unresolved,
- visibility does not equal final implementation contract.

## Memory Lab / Companion Relationship

- `Memory Lab` is the likely narrative forensic intelligence or story-brain layer.
- `Companion` is the likely interface or personality layer over `Memory Lab` and other systems.
- `Memory Lab` may feed `Companion`.
- `Companion` is not `Memory Lab`.
- `Companion` is not truth owner.
- `Memory Lab` is not automatic truth owner.

## Continuity / Signal Relationship

- `Continuity` is a major producer of advisory continuity findings.
- `Signal Architecture` defines how those findings can become normalized signals for multiple consumers.
- `Continuity` does not own truth.
- `Signal Architecture` does not turn findings into authored truth.

## Writing Surface / Command Center Display Relationship

- `Writing Surface` may display authorship, continuity, and other bounded signals while staying sovereign and non-gated.
- `Command Center` may host inspection, summaries, and tool entry points while remaining support-only.
- Neither surface turns advisory outputs into story truth automatically.

## Known Unknowns

- exact signal severity, confidence, and resolution taxonomy,
- exact accepted-AI transition rules,
- exact routing thresholds and approval rules,
- exact package schemas, chunking, and truncation rules,
- exact explicit-content approval and refusal behavior,
- exact Memory Lab storage and forgetting rules,
- exact Companion interruption and escalation rules.

## Forbidden Interpretations

- The map is not an implementation plan.
- The arrows do not imply runtime wiring exists.
- The arrows do not imply authority.
- The arrows do not imply storage contracts already exist.
- The arrows do not imply any system is build-ready.
- Signals remain advisory unless accepted or actioned.
- `Memory Lab` may feed `Companion`, but `Companion` is not `Memory Lab`.
- Model routing governs whether local, manual, or paid-model paths are allowed.
- Explicit-content transforms outbound packages, not raw prose.
- Authorship and provenance govern visibility of AI contributions, not automatic acceptance.

## Acceptance Criteria

This map is acceptable only if:

- it remains rough and explanatory,
- it does not imply runtime wiring,
- it does not imply authority by arrows alone,
- it preserves Writing Surface sovereignty,
- it preserves Command Center non-gating status,
- it keeps narrative primitives as foundation,
- it keeps signals advisory,
- it keeps `Memory Lab` and `Companion` distinct,
- it keeps explicit-content transforms bounded to outbound packages,
- it keeps authorship and provenance as visibility governance rather than mutation authority.
