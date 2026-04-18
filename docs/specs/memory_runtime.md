Status: Canonical current memory runtime reference
Version: 1.0.0
Last Reviewed: 2026-04-18
Owner: Services Team

# Memory Runtime

Purpose: document the current memory runtime as observed in code. This is not a future-memory vision document.

## Current ownership

### `scene_memory.py` — live continuity/carryover layer

File: `services/src/blackskies/services/scene_memory.py`

Current responsibilities:
- continuity persistence
- carryover extraction from accepted scene text
- continuity packet construction for prompt assembly
- continuity validation heuristics
- compatibility bridge into Memory Lab ingestion

Not responsible for:
- advisory selection
- reinforcement or decay policy
- interpretation competition
- contested winner logic

## `memory_lab/` — live advisory layer

Primary entrypoint: `services/src/blackskies/services/memory_lab/orchestrator.py`

Current responsibilities:
- advisory memory resolution
- contested-selection diagnostics
- reinforcement / decay / anchor handling when enabled
- interpretation and experimental selection behavior when enabled
- advisory packet assembly for prompt usage

Not responsible for:
- scene continuity persistence
- legacy carryover storage ownership
- canonical story-state promotion

## `memory_prototype/` — prototype-only

Path: `services/src/blackskies/services/memory_prototype/`

Current status:
- preserved as prototype/historical code
- not on the observed production runtime import path
- useful for design history and evaluation context
- not the current runtime memory owner

## Runtime interaction points

- `services/src/blackskies/services/prompt_pipeline.py` assembles continuity and advisory context through dedicated helper boundaries.
- `services/src/blackskies/services/operations/draft_generation.py` bridges continuity persistence and Memory Lab ingestion.
- `services/src/blackskies/services/memory_lab/ingest.py` is the explicit continuity-to-advisory ingestion boundary.

## Current truth

The project does not yet have one unified production “story mind.”

Current reality is:
- `scene_memory.py` remains the live continuity/carryover system
- `memory_lab/` is a live advisory subsystem layered beside it
- `memory_prototype/` is prototype-only and not on the observed production path

Unification is not complete. Contributors should not treat any single memory doc outside this file plus runtime code as the sole authority for current memory behavior.

## Documents by authority

Current runtime authority:
- this file
- `docs/specs/current_state.md`
- runtime code listed above

Prototype / historical references:
- `docs/specs/memory_prototype_v1.md`
- `docs/reviews/memory_prototype_v1_findings.md`
- `docs/phases/phase10_5_memory_readiness.md`
