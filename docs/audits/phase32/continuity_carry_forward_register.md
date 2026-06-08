# Phase 32 - Continuity Carry-Forward Register

## Purpose

This register classifies existing continuity-related code, tests, and concepts for salvage use.

It does not implement extraction.
It does not authorize runtime wiring.
It does not promote any continuity subsystem to build-ready status.

## Why This Register Exists

Continuity planning is incomplete unless existing code and tests are explicitly dispositioned.

Without this register, continuity remains philosophy-heavy and salvage-light:

- useful code may be ignored,
- dangerous runtime assumptions may sneak back in,
- scene-first structures may be mistaken for salvage foundations,
- advisory continuity may drift into authored truth.

## Scope

In scope:

- continuity service code,
- continuity prototype normalization logic,
- continuity-specific tests,
- continuity storage and non-mutation proof patterns,
- continuity-adjacent concepts that should inform later salvage work.

Out of scope:

- runtime integration,
- persistence implementation,
- migration,
- UI wiring,
- Companion implementation,
- Memory Lab runtime integration,
- graph runtime surfaces,
- rewrite or apply automation.

## Salvage Classification Rules

Allowed classifications are:

- `carry forward now`
- `carry forward later`
- `reference only`
- `quarantine`
- `discard`
- `unknown / needs inspection`

Classification meanings:

- `carry forward now`
  - safe to port soon with bounded edits
- `carry forward later`
  - likely valuable, but must wait for stronger salvage boundaries
- `reference only`
  - useful for behavior ideas or tests, but not a direct carry target
- `quarantine`
  - too coupled or too dangerous to reuse until later architecture exists
- `discard`
  - not worth carrying forward under current doctrine
- `unknown / needs inspection`
  - not enough evidence yet

## Evaluation Criteria

Each item is evaluated on:

- purity,
- dependency weight,
- runtime coupling,
- mutation risk,
- scene-first drift risk,
- authorial-truth risk,
- test value,
- patch effort,
- salvage value.

## Continuity Foundation Rules

All continuity carry-forward decisions must preserve these rules:

- Narrative Insertion / Narrative Assertion remains the foundation.
- Scene is projection or compatibility only.
- Advisory continuity must not become authored truth.
- Inferred continuity must remain non-authoritative until accepted.
- No silent mutation of manuscript truth is allowed.
- Continuity outputs must remain inspectable and provenance-bearing.

## Inventory Table

| Item | Current role | Purity | Dependency weight | Runtime coupling | Mutation risk | Scene-first drift risk | Authorial-truth risk | Test value | Patch effort | Salvage value | Classification | Target salvage destination | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `services/src/blackskies/services/continuity_context_builder.py` | Builds scene-draft continuity context from outline, drafts, locked facts, and Memory Lab options | low-medium | high | high | medium | high | medium | medium | high | medium | `carry forward later` | future continuity context adapter behind salvage projection and project-IO boundaries | Useful assembly concepts, but heavily tied to scene prompts, filesystem reads, outline structure, and Memory Lab options |
| `services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py` | Normalizes advisory delta candidates into stable continuity signals and contradiction signals | medium-high | medium | low-medium | low | medium | medium | high | medium | high | `carry forward later` | future pure continuity normalization helper after vocabulary is rebased away from scene-first scope | Strong contradiction and advisory-shape logic, but current categories and `scene:{unit_id}` scope need salvage reframing |
| `services/tests/prototype/test_memory_continuity_signals.py` | Proves signal shape, advisory storage, and artifact placement | medium | medium | medium | low | medium | low | high | medium | medium | `reference only` | future continuity test suite as behavior-spec input | Valuable invariants, but current fixture path and storage expectations are prototype-specific |
| `services/tests/prototype/test_memory_continuity_conflicts.py` | Proves dead/alive contradiction detection and non-mutation of canonical files | medium | medium | medium | low | medium | low | high | medium | high | `carry forward later` | future continuity contradiction regression suite | Non-mutation and advisory-only proof are strong salvage behaviors worth porting later |

## Immediate Candidates

No full continuity module qualifies for unmodified `carry forward now` status yet.

The strongest immediate candidates are small behaviors and invariants:

- advisory-only continuity signal normalization from [continuity_signal_normalizer.py](/C:/Dev/black-skies/services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py),
- contradiction detection behavior for incompatible status claims,
- test expectations that continuity artifacts stay advisory and do not mutate canonical manuscript files.

These are immediate because the logic is valuable.
They are not immediate as drop-in files because current names, scope labels, and prototype schema dependencies still assume an older runtime family.

## Carry-Forward-Later Candidates

### [continuity_signal_normalizer.py](/C:/Dev/black-skies/services/src/blackskies/services/memory_prototype/continuity_signal_normalizer.py)

- why later:
  - the logic is compact and mostly pure,
  - it already enforces advisory signal shape and contradiction output,
  - but it still uses prototype-specific delta categories and `scene:` scope labels.
- prerequisite boundary:
  - continuity dossier,
  - salvage continuity vocabulary,
  - explicit projection-versus-foundation boundary,
  - decision on whether continuity scope attaches to insertions, assertions, Story Units, or projections.
- risk if carried too early:
  - scene-oriented scope language could become native salvage authority by inertia.

### [continuity_context_builder.py](/C:/Dev/black-skies/services/src/blackskies/services/continuity_context_builder.py)

- why later:
  - it contains useful locked-fact, prior-context, and chapter-context assembly ideas,
  - but it is bound to scene-draft prompts, outline lookup, draft file reads, and Memory Lab options.
- prerequisite boundary:
  - salvage narrative model,
  - projection compatibility policy,
  - explicit project-IO boundary,
  - continuity dossier.
- risk if carried too early:
  - scene-first prompt assembly could masquerade as continuity foundation logic.

### [test_memory_continuity_conflicts.py](/C:/Dev/black-skies/services/tests/prototype/test_memory_continuity_conflicts.py)

- why later:
  - it captures valuable contradiction and non-mutation proof,
  - but the fixture scaffold and lineage storage assumptions remain prototype-specific.
- prerequisite boundary:
  - future continuity storage policy,
  - continuity output contract,
  - salvage-side continuity test lane.
- risk if carried too early:
  - the prototype storage layout could be treated as approved salvage persistence.

## Reference-Only Candidates

### [test_memory_continuity_signals.py](/C:/Dev/black-skies/services/tests/prototype/test_memory_continuity_signals.py)

- why reference only:
  - it proves useful advisory-shape behavior,
  - but it binds those proofs to prototype snapshots, storage paths, and current lineage conventions.
- useful lessons:
  - continuity signals should be structurally consistent,
  - confidence must stay bounded,
  - advisory artifacts should be explicitly marked advisory,
  - storage should live outside canonical manuscript truth.

## Quarantine Candidates

No continuity item is a full `discard` candidate yet, but some behavior must remain quarantined until later architecture exists.

Quarantine concerns currently concentrate around [continuity_context_builder.py](/C:/Dev/black-skies/services/src/blackskies/services/continuity_context_builder.py):

- direct project-root file reads,
- outline.json dependence,
- draft-file excerpt dependence,
- scene-order assumptions,
- Memory Lab option handling inside context assembly.

The file itself is classified `carry forward later`, but these embedded assumptions are effectively quarantined until salvage boundaries are stronger.

## Discard Candidates

None yet.

Current evidence supports selective salvage and reframing rather than deletion of continuity concepts.

## Test Asset Review

### [test_memory_continuity_signals.py](/C:/Dev/black-skies/services/tests/prototype/test_memory_continuity_signals.py)

- preserved behavior:
  - continuity artifacts have stable required fields,
  - confidence remains bounded,
  - advisory artifacts are written outside canonical draft files.
- portability:
  - medium
- likely future disposition:
  - rewrite around salvage continuity contract rather than port verbatim

### [test_memory_continuity_conflicts.py](/C:/Dev/black-skies/services/tests/prototype/test_memory_continuity_conflicts.py)

- preserved behavior:
  - contradiction signals can be emitted for dead/alive conflicts,
  - continuity artifacts remain advisory,
  - continuity processing must not mutate canonical source files.
- portability:
  - medium-high
- likely future disposition:
  - port the non-mutation and contradiction invariants once the continuity contract exists

## Recommended Target Locations

These are planning-only destinations, not approved implementation tasks:

- pure continuity normalization logic:
  - future continuity-focused service helper lane once vocabulary is rebased
- continuity contract and authority rules:
  - [continuity.md](/C:/Dev/black-skies/docs/product_systems/continuity.md)
- continuity contradiction and advisory storage proof:
  - future continuity test lane in repo-tracked service tests
- context assembly concepts:
  - future continuity context adapter behind narrative foundation and projection boundaries

## Risks Of Carrying Too Early

The main early-carry risks are:

- scene-first drift through scene-scoped labels or ordering assumptions,
- legacy project-loader and file-family coupling,
- hidden mutation behavior sneaking into continuity flows,
- advisory systems being mistaken for authored truth,
- Memory Lab gravity arriving before continuity authority is defined,
- prototype storage paths hardening into unreviewed salvage persistence.

## Recommended Extraction Order

1. create the continuity authority docs first,
2. port or restate test invariants before porting any runtime helper,
3. extract small pure normalization behavior next,
4. revisit context assembly only after continuity vocabulary, project-IO boundaries, and projection rules are explicit,
5. leave orchestration and Memory Lab-linked continuity flows for later.

## Open Questions

- Should continuity scope eventually attach to insertions, assertions, Story Units, projections, or multiple layers?
- Which continuity artifacts are durable versus temporary?
- How much of current prototype lineage and storage structure should survive?
- Should contradiction outputs be consumed directly by Writing Surface, Command Center, or both?
- Which continuity checks belong in local-only flows versus later routed intelligence flows?

## Acceptance Criteria

This register is acceptable only if:

- it classifies real code and tests,
- it distinguishes carry-forward from reference-only and quarantine,
- it preserves Narrative Insertion / Narrative Assertion as foundation,
- it keeps scene in projection or compatibility roles only,
- it avoids implementation,
- it does not promote Companion, Memory Lab, graph runtime surfaces, rewrite or apply automation, persistence writes, topology search, local AI runtime, paid API runtime, or Google Docs sync to build-ready status.
