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
- Author authority controls the final text decision.

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
   - Critique / Evaluation
   - Companion
4. Transfer and interchange systems
   - Document Interchange
5. Routing, safety, and visibility systems
   - Authorship / Provenance / AI Visibility
   - Model Routing And Budget Architecture
   - LLM Package Construction Architecture
   - Explicit Content Architecture

## Main Relationships

- `Narrative Insertion / Narrative Assertion` feeds projections, advisory systems, and later tool context.
- `Continuity` inspects narrative foundations and projections, then emits advisory continuity findings.
- Accepted continuity truth returns to author-owned foundations, notes, lore, character facts, or other explicit author decisions rather than a shadow canon.
- `Signal Architecture` normalizes and routes signal-shaped outputs across surfaces.
- `Memory Lab` may consume narrative material and signal-bearing findings for deeper forensic or investigative work, but it should retain only meaningful information that serves continuity, memory, structure, investigation, or author decision support.
- `Companion` may present, explain, question, or summarize outputs from `Memory Lab`, `Continuity`, and other systems, and may later run safe local or support actions if settings allow.
- `Critique / Evaluation` is a capability layer that evaluates evidence from other systems and produces advisory findings, but it is not the same thing as `Companion` or any single UI surface.
- `Author Intent / Story Setup` supplies goals, boundaries, and story parameters to `Outline`, `Draft Generation`, `Companion`, routing, and other systems, but it does not gate direct writing.
- `Authorship / Provenance / AI Visibility` governs how AI contribution and transformation remain visible.
- `Model Routing And Budget Architecture` governs whether local, manual, or paid-model paths are allowed.
- `LLM Package Construction Architecture` governs how model-facing packages are assembled.
- `Explicit Content Architecture` governs how raw local prose and outbound transformed packages remain distinct.
- `Document Interchange` owns author-facing human document import and export workflows, import destination classification, export preview and approval, format-loss warnings, round-trip and conflict posture, and Google Docs as one external source or destination.
- `Writing Surface`, `Snapshots / Backup / Restore / History`, `Service Health / Offline / Degraded Mode`, and `Workflow Spine / Author Journey` collectively own local save-state, autosave feel, recovery, and degraded persistence posture rather than any future Google Docs transfer semantics.
- `Binder / Project Library` supplies destination context for imported material and project organization, but it does not own transfer rules.
- `File Manager / Asset Pane` supports file browsing and asset handling, but it does not own interchange authority.
- `Document Interchange` must respect `Authorship / Provenance / AI Visibility`, `Explicit Content Architecture`, `Model Routing And Budget Architecture`, and `LLM Package Construction Architecture` without replacing them.
- `LLM Package Construction Architecture`, `Model Routing And Budget Architecture`, and `Memory Lab` remain the provisional homes for AI-facing format, package-shape, cost, fidelity, OCR-derived transfer experiments, and durable-memory-boundary questions until a later contract narrows them.

## Signal Flow

Rough doctrine flow:

`Narrative foundations / projections`
-> `Continuity or other advisory producers`
-> `Signal Architecture`
-> `Writing Surface`, `Command Center`, `Outline`, `Companion`, or later tool-specific panels

Important boundary:

- signals remain advisory unless the user accepts or acts on them,
- signal visibility does not grant signal authority,
- durable advisory history should be kept only when it is purposeful and relevant,
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
- routing precedence starts with user approval or refusal, then privacy or local-only, explicit-content restrictions, no-money or budget limits, project settings, model quality preference, and convenience or automation,
- arrows do not imply silent paid spend is allowed.

## Explicit-Content Package Flow

Rough doctrine flow:

`raw local prose`
-> `Explicit Content Architecture`
-> if outbound work is allowed, masked, summarized, or transformed package
-> later package construction and routing

Important boundary:

- explicit-content transforms outbound packages, not raw prose,
- starting never-send or raw outbound categories include explicit sexual content, extreme violence or gore, minor-related sensitive content, private author notes marked local-only, deleted drafts marked archived or private, raw manuscript text from local-only projects, and anything the user marks never-send,
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

- explicit author action may make AI-origin text author-owned text,
- visible difference after acceptance is user-controlled rather than permanently forced,
- export behavior is user-controlled,
- exact persistence and private metadata behavior remain unresolved,
- visibility does not equal final implementation contract.

## Memory Lab / Companion Relationship

- `Memory Lab` is the likely narrative forensic intelligence or story-brain layer.
- `Companion` is the likely interface or personality layer over `Memory Lab` and other systems.
- `Memory Lab` may feed `Companion`.
- `Companion` is not `Memory Lab`.
- `Companion` is not truth owner.
- `Memory Lab` is not automatic truth owner.
- `Critique / Evaluation` may feed `Companion`, `Command Center`, `Writing Surface`, `Draft Generation`, or manual author review, but Critique remains an evaluation capability rather than a universal surface.
- `Companion` may route requests to other systems when the author is actually asking for Critique, Author Intent / Story Setup, Draft Generation / Rewrite Loop, Signal Architecture, Continuity, or Feedback Notes / Revision Resolution work.
- `Companion` must not silently spend money, mutate story truth, rewrite prose, send raw content, or canonize facts without approval.

## Continuity / Signal Relationship

- `Continuity` is a major producer of advisory continuity findings.
- `Signal Architecture` defines how those findings can become normalized signals for multiple consumers.
- Accepted continuity truth belongs in author-owned story foundations or other explicit author decisions, not in Continuity or Signal as shadow canon.
- `Continuity` does not own truth.
- `Signal Architecture` does not turn findings into authored truth.

## Writing Surface / Command Center Display Relationship

- `Writing Surface` may display authorship, continuity, and other bounded signals while staying sovereign and non-gated.
- `Command Center` may host inspection, summaries, and tool entry points while remaining support-only.
- Neither surface turns advisory outputs into story truth automatically.

## Known Unknowns

- exact signal severity, confidence, and resolution taxonomy,
- exact provenance storage, sync, and private-metadata rules,
- exact local save-state, autosave-feel, recovery, and degraded-persistence split across `Writing Surface`, snapshots, workflow, and service-health systems,
- exact per-format import fidelity, export fidelity, and `v1` scope inside the rough document-interchange contract,
- exact AI or memory transfer-format effects on tokens, cost, fidelity, evidence quality, routing, and durable-memory boundaries,
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
- Old Wizard is best understood as a historical seed for Author Intent / Story Setup plus Workflow Spine / Author Journey, not as a required startup gate.
- Old Critique is best understood as a historical seed for a Critique / Evaluation capability layer plus Feedback Notes, Signal Architecture, Draft Generation, Plugin / Rubric System, Continuity, and Companion explanation, not as a single all-purpose surface.
- Provider-specific packaging may evolve, but it must not silently change mission, meaning, author intent, evidence scope, canon facts, or task purpose.
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
