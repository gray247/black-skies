# Phase 23 Execution Plan - Intelligence / Narrative Consequence Foundation

## Phase Objective
Phase 23 is the first intelligence-governance phase. Its purpose is to define the authority, provenance, trust, and fallback rules for any future Narrative Consequence Engine / Intelligence Layer surfaces before those surfaces are treated as product truth.

Phase 23 is not a feature launch phase. It is a contract phase that makes future intelligence work honest, bounded, and evidence-based.

## Explicit Non-Goals
Phase 23 does not:

- build fake AI certainty
- build hidden scoring or hidden inference
- imply output-quality validation is proven
- imply real-author-material workflow maturity is proven
- imply brand-new story-from-scratch workflow maturity is proven
- add detached-window or true two-monitor behavior
- promote Split Command to stable/default
- build production-default intelligence behavior
- add unverifiable authority language
- claim that AI "knows your story"
- add silent narrative judgment systems
- replace the existing roadmap or deferred-work structure

## Intelligence Authority Boundaries
Future intelligence surfaces must have explicit authority boundaries before they can present anything as meaningful.

Rules:

- intelligence may not present itself as truth unless the source and classification are explicit
- intelligence may not silently promote heuristics to authority
- intelligence may not infer story-state beyond the data contract assigned to it
- intelligence may not mutate shell-owned state outside named authority paths
- intelligence may not claim to know user intent, story quality, or narrative correctness without evidence and a declared proof class

## Provenance / Source-Label Rules
Every intelligence claim must state where it came from.

Required provenance labels:

- deterministic project data
- loaded outline data
- loaded scene data
- current project metadata
- generated inference
- verified observation
- user-provided input
- deferred / unavailable

Rules:

- source labels must be visible wherever intelligence is shown
- a generated conclusion must not be labeled as verified unless it is actually verified
- missing data must be shown as unavailable, not guessed
- future intelligence surfaces must never hide provenance behind copy polish

## Generated vs Verified vs Speculative Classification Rules
Future intelligence outputs must be classified at presentation time.

Allowed states:

- generated
- verified
- speculative
- unavailable
- deferred

Rules:

- generated means machine-produced, not necessarily true
- verified means externally checked against a trusted source or explicit proof lane
- speculative means an inference that should not be treated as fact
- unavailable means the system does not have enough evidence to produce a claim
- deferred means the surface exists only as a placeholder or future feature

## Trust / Confidence Language Rules
Trust language must remain strict and explicit.

Rules:

- confidence language must be written in plain English, not hidden in styling
- high-confidence language does not make a claim verified
- low-confidence language must not be styled as authoritative
- no UI copy may imply final writing quality or editorial adequacy
- no UI copy may imply the system can judge story quality end-to-end
- no UI copy may imply the system has complete authorship understanding

## Placeholder / Fallback Behavior Requirements
If an intelligence surface cannot prove what it is showing, it must fail honestly.

Requirements:

- show deferred or unavailable copy rather than invented intelligence
- keep placeholders visibly marked as placeholder or deferred
- do not use blank state as fake authority
- fallback behavior must never widen authority beyond the underlying proof class
- if data is missing, the surface must say so directly

## Stable GUI Protection Rules
Stable GUI remains sacred/default.

Rules:

- Phase 23 must not change the stable GUI default path
- intelligence work must not make stable GUI depend on Split Command state
- no intelligence surface may leak state into stable GUI persistence or startup behavior
- any default-path risk requires immediate validation before commit

## Split Command Protection Rules
Split Command remains experimental and flag-gated.

Rules:

- Phase 23 must not promote Split Command to default
- intelligence work must not assume detached windows or two-monitor support exists
- Split Command state and stable GUI state must remain isolated unless a documented bridge already exists
- intelligence surfaces must not broaden shell authority boundaries

## Admission Rules for Future Intelligence Panels
Before any new intelligence panel is added, it must justify:

- owner
- authority level
- provenance source
- trust language
- fallback behavior
- persistence behavior
- spatial priority
- why it should exist as its own panel instead of being embedded elsewhere
- why it cannot remain deferred

If a panel cannot satisfy these rules, it stays deferred.

## What Intelligence Surfaces May Read
Allowed reads are narrow and deterministic.

Intelligence surfaces may read:

- loaded project identity
- loaded outline data
- loaded scene data
- deterministic counts and metadata
- user-entered content already present in the current project
- explicit project-scoped configuration required for the surface contract

## What Intelligence Surfaces May Not Infer
Intelligence surfaces may not infer:

- final writing quality
- literary merit
- editorial success
- author readiness
- brand-new story completion
- hidden emotional truth as fact
- unverified narrative consequences
- silent story health or scoring without an explicit proof lane
- operator intent beyond the declared input contract

## Validation Cadence
Batch validation is allowed only when the scope is narrow and risk is controlled.

Batch-validate:

- doc/spec-only contract work
- copy and label honesty work
- placeholder demotion or hiding
- deterministic metadata surfaces

Immediate validation required:

- anything touching stable GUI behavior
- persistence or invalidation logic
- preload or IPC contracts
- launcher/bootstrap paths
- project loading or save/export behavior
- any change that could present intelligence as verified when it is not
- any change that could change default launch behavior

## High-Risk Touch Zones
Treat these as high risk for Phase 23:

- `App.tsx`
- `SplitCommandWorkspace.tsx`
- any new intelligence panel components
- hooks that compute story judgments, trust language, or consequence summaries
- data pipelines that might infer narrative meaning from loaded content
- any IPC or preload seam used to present intelligence claims
- any persistence path tied to intelligence state

## Human Smoke Limitations
Human smoke in Phase 23 means build/runtime/workflow verification only.

Human smoke may confirm:

- the surface exists
- it launches
- it behaves without obvious runtime errors
- it does not break stable GUI or the current workflow
- visible regressions are not obvious

Human smoke does not confirm:

- output-quality validity
- creative usefulness
- final writing quality
- real-author-material maturity
- brand-new story readiness

## Harness / Runtime Proof Requirements
Before any intelligence claim is treated as credible, it must be backed by the proper proof lane.

Required proof types:

- runtime proof for actual user-visible behavior
- harness proof for deterministic launch / smoke / contract behavior
- human smoke for visible safety and obvious regression detection

No green lane may be used to claim output quality or story quality unless the lane was explicitly designed for that purpose.

## Stop / Escalation Triggers
Stop immediately if:

- stable GUI risk appears
- proof claims exceed evidence
- fake intelligence would be introduced
- same failure repeats during validation
- runtime and harness evidence conflict
- phase ownership becomes unclear
- the work starts to look like output-quality validation
- the work starts to assume brand-new story or real-author maturity
- the scope starts to drift into detached-window or two-monitor work
- the scope starts to drift into production-default promotion of Split Command

## Deferred Carry-Forward Items
Explicitly deferred items remain:

- output-quality validation
- creative-quality validation
- real author-material workflow maturity
- brand-new story-from-scratch workflow
- two-monitor workflow
- long-session and large-project hardening
- future orchestration automation beyond the current semi-manual model
- any intelligence surface lacking a written authority/provenance contract

## Definition of Done
Phase 23 is done when:

- the intelligence authority model is defined and recorded
- provenance and classification rules exist for any future intelligence surface
- trust language is honest and non-ambiguous
- stable GUI default behavior remains unchanged
- Split Command remains experimental and flag-gated
- no fake AI certainty or hidden inference landed
- no output-quality overclaims landed
- no detached-window or two-monitor claims landed
- the phase is ready for later implementation without reworking the authority model

## Explicit Non-Claims
Phase 23 does not claim:

- output-quality validation is proven
- real-author-material workflow maturity is proven
- brand-new story-from-scratch workflow is proven
- AI intelligence is runtime-proven
- production readiness exists
- a new roadmap system exists
- Split Command is the default experience

## Current Scope Note
Phase 23 is intelligence governance first. If later implementation work is approved, it must use this plan as the contract boundary rather than inventing new authority rules midstream.

## Closure Status
Phase 23 is closed with exceptions.

Completed work:

- 23A intelligence provenance/authority foundation
- 23B deterministic Intelligence Readiness surface
- 23C trust/confidence/fallback refinement
- 23D intelligence panel admission rules and gating

Deferred carry-forward items remain:

- output-quality validation
- real-author-material workflow maturity
- brand-new story-from-scratch workflow
- detached-window / two-monitor behavior
- future intelligence surfaces that cannot satisfy the admission contract
