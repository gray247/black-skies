# Visualizer Program Delivery Plan

## 1. Status, Name, And Authority

- Canonical user-facing name: `Visualizer`
- Legacy planning name: `Emotion Graph`
- Legacy file retained for link compatibility: `emotion_graph.md`
- Classification: Intelligence projection and analysis surface
- Current status: planning amendment; not an implementation or qualification claim
- Current delivery boundary: Program 7 foundation only
- Full semantic analysis boundary: Program 9, after the entry conditions in this document are met
- Primary owner: Visualizer projection and analysis contracts
- Truth ownership: none; Visualizer is never the owner of manuscript, author-intent, character, outline, continuity, or relationship truth

This document is the canonical delivery map for the feature previously called
Emotion Graph. Future planning should use `Visualizer`. Historical evidence and
older dossiers may retain `Emotion Graph`; those references mean the same
feature and do not create a second system.

This document preserves the complete concept backlog while assigning every part
to a program, package, dependency, deliverable, and reopening trigger. An item
is not considered deferred unless it appears in the ledger in Section 12.

## 2. Product Decision

Visualizer is a read-only diagnostic instrument:

```text
manuscript -> analysis -> signals -> Visualizer views -> source inspection
```

The author does not drag points, manually annotate every passage, or correct
each output. The system is tested against representative writing. If an
analysis method is not useful or trustworthy enough, the method is rejected,
replaced, or kept visibly unavailable.

The author may define a custom bipolar question once, such as
`Trust <- -> Distrust`. That defines what the analyzer should track. It does
not require the author to place or edit individual points.

Visualizer must:

- show automatic results as results of an identified analyzer;
- preserve exact source evidence or honestly show that evidence is unavailable;
- distinguish measured, inferred, derived, stale, unavailable, and failed data;
- support book, chapter, scene, and passage inspection;
- provide a table or text equivalent for every visual result;
- remain useful when no AI is installed or admitted; and
- keep direct writing independent of the Visualizer.

Visualizer must not:

- silently create canon or author intent;
- present heuristic guesses as confirmed emotion;
- require point-by-point human annotation;
- silently fall back from PC-only analysis to local AI or from local AI to an
  outbound API;
- turn a graph line into a claim that the story is good or bad; or
- become a second manuscript, character, outline, continuity, or relationship
  store.

## 3. Naming Crosswalk

| Old term | Current term | Rule |
| --- | --- | --- |
| Emotion Graph | Visualizer | Use `Visualizer` in new plans, UI, tests, and status reports. |
| Story Signals | Signal data layer | Keep as an internal architecture term, not the user-facing feature name. |
| Emotion V1 | Visualizer emotion lens | A signal family inside Visualizer, not a separate product. |
| Graph point | Visualizer signal | A rendered signal must have a source and analyzer record. |
| Graph analysis | Visualizer analysis | Use provider and version-specific qualification. |

Historical documents, old evidence, and old commit messages may keep the old
name. The registry, current roadmap, Program 7 plan, visual handoff, and new
delivery documents must use `Visualizer`.

## 4. Signal Contract Required Before Rich UI

Every automatic record must be representable by one provider-neutral signal
shape. The exact serialized schema is to be finalized by `P7-VIZ-1`, but it
must contain these fields:

| Field | Required meaning |
| --- | --- |
| `signalId` | Stable identifier for the temporary analysis result. |
| `family` | `emotion`, `narrative`, `structure`, or `custom-axis`. |
| `label` | For example `fear`, `grief`, `tension`, or `action`. |
| `axisId` | Required for a custom bipolar axis. |
| `scope` | Book, chapter, scene, passage, or other explicit story location. |
| `subject` | Scene, reader, character, relationship, project, or unlabelled. |
| `perspective` | Such as scene tone, reader effect, character internal, or character expressed. |
| `intensity` | Normalized numeric value from 0 through 100. |
| `confidence` | Provider confidence or explicit unknown state; never invented by the UI. |
| `evidence` | Unit identity, exact range when available, exact quote when permitted, body fingerprint, and source revision. |
| `origin` | `measured`, `local-inference`, `api-inference`, `author-defined`, or `derived`. |
| `provider` | `pc-only`, `ollama`, `api`, or another explicitly qualified provider. |
| `model` | Visible model identity when a model was used. |
| `analysisVersion` | Version of the analyzer and prompt/contract where applicable. |
| `status` | Current, stale, partial, unavailable, failed, cancelled, or suppressed. |
| `provenance` | Why the result exists and what it is allowed to mean. |

No renderer should infer missing authority, confidence, source, or provider
metadata from a dot, color, line, or label.

## 5. Authority And Output Layers

| Layer | Examples | Owner | Visualizer behavior |
| --- | --- | --- | --- |
| Canonical | Manuscript prose, accepted structure, author-created facts | Existing domain owner | Reference only; never duplicate ownership. |
| Author-defined | A planned target or a custom axis definition | Author Intent, Outline, Character Cards, or named owner | Display as a clearly named reference or overlay. |
| Measured | Word count, sentence length, dialogue ratio, rhythm, density | PC-only analyzer | May be shown as measured data after contract qualification. |
| Inferred | Emotion, reader effect, character state, tension, custom-axis interpretation | Qualified local or API analyzer | Advisory only; always labeled and source-linked. |
| Derived | Chapter aggregates, book trends, spikes, comparisons, key moments | Visualizer projection | Derived from visible underlying signals; never treated as evidence by itself. |
| Presentation | Filters, zoom level, selected scope, layout | Visualizer UI | Temporary view state; no truth ownership. |

The graph, table, key-moment list, scene list, and detail panel are all views
over the same signal records. They are not separate copies of the story.

## 6. Automatic Analysis Ladder

The providers are evaluated in this order:

### 6.1 PC-only baseline

The PC-only analyzer may produce:

- positive/negative valence;
- rough emotion-family indicators;
- word and sentence density;
- sentence-length variation;
- dialogue percentage;
- action-verb density;
- punctuation and rhythm changes;
- scene length;
- character mentions; and
- rough tension proxies.

It must not claim reliable sarcasm, suppressed emotion, reader effect,
character attribution, emotional subtext, or complex dread/fear/anticipation
distinctions without separate evidence.

### 6.2 Local LLM

The local route is considered only after the PC-only benchmark shows that the
baseline is insufficient for the required use. The first local pilot remains
`qwen3:4b` through the loopback Ollama route. It must use bounded chunks,
structured output, exact source evidence, cancellation, timeout handling,
protected-content enforcement, and visible receipts.

Local analysis may be foreground, idle, or overnight batch work. Slow analysis
is not automatically a failure if it is resumable and does not destabilize
normal writing.

### 6.3 Paid API

The API route is considered only if PC-only and local analysis fail the agreed
quality, speed, reliability, or context requirements. API use requires an
explicit provider decision and the existing outbound approval, privacy, cost,
budget, and protected-content controls.

This is a qualification order, not permission for hidden runtime fallback.
Each run records which provider was selected, why it was selected, and whether
another provider was intentionally not used.

## 7. Program 7 Scope: Visualizer Foundation

Program 7 receives the foundation because the current manuscript anchors and
long-form corpus are the prerequisites for useful source-linked visualization.
Program 7 does not attempt to finish the full intelligent Visualizer.

### P7-VIZ-0 - Immediate Current-Build Containment

Timing: before Program 7 closure and before any new graph feature work.

Required actions:

- hide or remove deterministic heuristic results that look like semantic
  emotion findings;
- keep the graph empty or visibly unavailable when no qualified analyzer has
  produced results;
- preserve the source-return path and distinguish exact, relocated, ambiguous,
  stale, and unavailable source states;
- ensure a graph click never silently invents a passage;
- keep a table/text alternative available; and
- record current UI defects as bounded tickets instead of treating a visually
  present line as successful analysis.

Exit evidence:

- no misleading inferred-looking dots from unqualified heuristics;
- no protected or stale source text leakage;
- source-return behavior is covered by a focused test; and
- the empty/unavailable state explains what has and has not been analyzed.

### P7-VIZ-1 - Visualizer Signal Contract And Provider Boundary

Timing: Wave 1, after `RT-3A` corpus identity and `RT-1A` source-binding/currentness
contracts are available; before rich Visualizer UI work.

Required outputs:

- versioned provider-neutral signal schema from Section 4;
- source-span and body-fingerprint binding;
- origin, provider, model, analyzer version, confidence, and stale-state
  fields;
- measured versus inferred versus derived classification;
- an adapter boundary for `pc-only`, local LLM, and API providers;
- no hidden provider retry, fallback, or reroute;
- protected-content and AI-exclusion checks before analysis packaging; and
- fixtures for zero, one, many, stale, partial, unavailable, cancelled, and
  failed signals.

Stop conditions:

- a signal can appear without provenance or source location;
- an analyzer result can become manuscript or author truth;
- provider selection is hidden;
- a source change can silently preserve an old signal; or
- a protected passage enters an analysis package.

### P7-VIZ-2 - PC-only Baseline Analyzer And Benchmark

Timing: Wave 1 after `P7-VIZ-1`; before deciding whether local semantic analysis
is necessary.

Required outputs:

- deterministic PC-only analyzer prototype;
- same-input repeatability tests;
- Carmilla benchmark passages covering neutral prose, action, dialogue,
  grief, fear, joy, anger, ambiguity, subtext, multi-character scenes, and
  passages with no defensible semantic finding;
- expected-measurement fixtures for mechanical metrics;
- quality-review rows for semantic claims that are intentionally marked
  provisional; and
- timing and resource observations for a full-corpus run.

The benchmark must separately report false positives, missed changes,
category usefulness, intensity usefulness, character attribution, source
accuracy, repeatability, runtime, memory pressure, and structured-output
failures. One aggregate score cannot hide a failed safety or source-binding
row.

Admission rule:

- mechanical measurements may be admitted when their deterministic contract
  passes;
- semantic emotion output remains unavailable unless the benchmark proves a
  useful and honest threshold approved by the qualification owner; and
- failure of PC-only does not block the no-AI writing workflow.

### P7-VIZ-3 - Read-only Visualizer Foundation View

Timing: Wave 3/4 after `P7-VIZ-1` and the source-return portions of `RT-1A` are
green; before final Program 7 qualification.

Required views:

- book overview with chapter fingerprints or aggregates;
- selected chapter expansion;
- selected scene expansion;
- passage or signal detail;
- scope and view controls;
- scene list;
- table/text equivalent;
- source evidence and `Open in Manuscript`; and
- honest empty, loading, partial, stale, unavailable, cancelled, and failed
  states.

The foundation may render qualified measured PC-only results. It must not
render attractive semantic dots merely because a UI fixture contains values.

The following are not required for the Program 7 foundation:

- automatic key-moment interpretation;
- character emotional overlays;
- reader-effect interpretation;
- multi-emotion semantic extraction; or
- custom-axis inference.

### P7-VIZ-4 - Foundation Qualification And Later Handoff

Timing: Wave 6, alongside Program 7 evidence and closure.

Required evidence:

- exact source return for a qualified signal;
- stale and changed-source behavior;
- table parity with graph data;
- no color-only meaning;
- keyboard and 200-percent zoom behavior;
- dark/light readability using existing tokens;
- protected-content sentinel scan;
- no-AI operation with no graph provider installed;
- provider receipt and provenance visibility; and
- clean exact-commit rerun.

The foundation package may pass while advanced semantic analysis is deferred.
The deferral must use the exact records in Section 12 and must be included in
the Program 7 closure report.

## 8. Program 7 Does Not Absorb The Whole Visualizer

Do not add the following to Program 7 merely because they are desirable:

- local semantic emotion inference for the whole book;
- API routing;
- background or overnight job ownership;
- persistent analysis cache or model lifecycle;
- every specialized signal family;
- full character/relationship integration;
- reader-effect forecasting;
- automated custom-axis scoring; or
- insight generation that claims a story problem.

Program 7 owns the source-linked foundation and the provider-neutral seam. It
does not own the full operational platform needed to run expensive analysis.

## 9. Program 8 Handoff: Knowledge Context, Not Semantic Analyzer Ownership

Program 8 remains the home for knowledge and organization systems. It does
not own the Visualizer analyzer. It supplies optional context only after its
owners are independently accepted.

### P8-VIZ-1 - Context Handoff Contract

Timing: after the relevant Program 8 owner is accepted and before Visualizer
uses that context.

Possible context sources:

- Character Cards for accepted character identity and aliases;
- Lore Cards for accepted entities and protected boundaries;
- Project Search for locating source units;
- Memory Lab only as bounded recall, never as emotional truth; and
- Series Binder only for explicitly allowed cross-story scope.

Required rule: context may improve analysis or filtering, but Visualizer must
retain the source, authority, and provenance of every input. Program 8 context
must not silently change the meaning of an existing signal.

### P8-VIZ-2 - Optional Context Views

Timing: after `P8-VIZ-1` and only if a real author workflow requires it.

Possible outputs:

- character filtering;
- relationship filtering;
- cross-reference inspection; and
- project search from a selected signal.

This package does not add local-model analysis, API routing, automatic custom
axes, or background execution.

## 10. Program 9 Scope: Semantic Analysis And Operationalization

Program 9 is the exact home for the deferred analyzer and operations work.
It is appropriate because Program 9 already owns provider routing, cost,
background work, model lifecycle, queue behavior, and operational durability.

The work must occur in this order:

### P9-VIZ-1 - Local Semantic Analyzer Qualification

Dependencies: `P7-VIZ-1`, `P7-VIZ-2`, `P7-VIZ-4`, stable local-inference
contract, and the Program 9 provider/approval boundaries.

Build and qualify:

- multiple emotions from one passage;
- intensity and confidence;
- scene tone;
- character internal versus expressed emotion;
- exact evidence quotes and source coordinates;
- structured output validation;
- chunking and context limits; and
- comparison against the same Carmilla benchmark used by PC-only analysis.

No local result is admitted solely because Ollama runs. Quality, source
accuracy, latency, cancellation, resource posture, and protected-content
evidence are required.

### P9-VIZ-2 - Incremental, Resumable, And Overnight Analysis

Dependencies: `P9-VIZ-1`, Async Job Queue / Task Runner, Service Health,
Persistence, Diagnostics, and Budget / Cost Guardrails.

Build and qualify:

- scene fingerprints;
- analyze-changed-scenes-only behavior;
- chapter and book aggregate rebuilds;
- interruption and resume;
- cancellation and timeout;
- idle/overnight scheduling;
- progress and receipt visibility;
- resource limits; and
- safe handling of a changed source while analysis is running.

The app should own the queue. Windows Task Scheduler may be used as a
development workaround, but it is not the product contract.

### P9-VIZ-3 - Expanded Signal Families

Dependencies: `P9-VIZ-1` and the relevant accepted source/knowledge owners.

Add one family at a time with its own contract and benchmark:

1. action;
2. tension;
3. pacing;
4. horror pressure;
5. mystery/information pressure;
6. structural beats and setup/payoff;
7. comedy/relief placement; and
8. romance or relationship progression.

No family receives a permanent default dashboard position until its workflow
proves that the output helps the author inspect the manuscript.

### P9-VIZ-4 - Custom Bipolar Axes

Dependencies: `P7-VIZ-1`, `P9-VIZ-1`, and the custom-axis configuration
contract.

The author defines two poles and optional subject scope:

- `Hope <- -> Despair`;
- `Trust <- -> Distrust`;
- `Humanity <- -> Monstrosity`;
- `Order <- -> Chaos`; or
- `Mara trusts Elias <- -> Mara distrusts Elias`.

The analyzer then produces automatic source-linked values along the axis. The
author does not place individual values. Custom-axis results remain inferred
and advisory unless a separate truth owner accepts a resulting assertion.

### P9-VIZ-5 - Key Moments, Insights, And Comparisons

Dependencies: `P9-VIZ-2`, at least two qualified signal families, and the
Diagnostics / Evidence contract.

Build in this order:

1. deterministic spikes and transitions;
2. key-moment candidates with source evidence;
3. planned-versus-observed comparison;
4. character A versus character B comparison;
5. chapter/scene comparisons;
6. revision comparison across fingerprints; and
7. higher-level insights that cite the underlying signals.

An insight must show its supporting signals and source locations. It may say
that observed tension peaks before the planned climax; it may not declare that
the manuscript failed or that a revision is required.

### P9-VIZ-6 - Explicit API Qualification

Dependencies: failure or insufficiency evidence from PC-only and local paths,
accepted outbound approval, privacy review, budget controls, and the same
benchmark contract.

The API path is optional. It must use the same signal schema, evidence rules,
stale rules, protected-content rules, and visible provider receipts. It is not
an automatic fallback and does not replace the local or no-AI paths.

## 11. User-Requested Concept Coverage

The following concepts are preserved and assigned rather than discarded:

| Concept | First usable home | Full implementation home |
| --- | --- | --- |
| Book overview | P7-VIZ-3 | P7-VIZ-3 |
| Chapter/scene/passage semantic zoom | P7-VIZ-3 foundation | P9-VIZ-5 refinement |
| Scene list | P7-VIZ-3 | P7-VIZ-3 |
| View and scope controls | P7-VIZ-3 | P9-VIZ-5 filters/refinement |
| Source-linked evidence | P7-VIZ-1/P7-VIZ-3 | P9-VIZ-1 and every later family |
| Key moments | P7-VIZ-3 placeholder/empty state only | P9-VIZ-5 |
| Multiple simultaneous emotions | Contract reserved in P7 | P9-VIZ-1 |
| Scene tone | Contract reserved in P7 | P9-VIZ-1 |
| Reader effect | Not a P7 claim | P9-VIZ-3 or P9-VIZ-5 after qualification |
| Character internal/expressed emotion | Not a P7 claim | P9-VIZ-1 |
| Action/tension/pacing | Not a P7 claim | P9-VIZ-3 |
| Structural overlays | Not a P7 claim | P9-VIZ-3 |
| Custom bipolar axes | Schema reservation in P7 | P9-VIZ-4 |
| PC-only analysis | P7-VIZ-2 | Retain only qualified metrics |
| Local LLM analysis | Provider seam in P7 | P9-VIZ-1/P9-VIZ-2 |
| API analysis | Provider seam only | P9-VIZ-6 |
| Overnight processing | Not a P7 runtime requirement | P9-VIZ-2 |
| Revision comparison | Fingerprint fields in P7 | P9-VIZ-5 |
| Higher-level insights | Not a P7 claim | P9-VIZ-5 |

## 12. Deferred Work Ledger

Every deferred item has a named resolution point and reopening trigger.

| ID | Deferred item | Owner | Exact resolution stage | Required evidence | Reopening trigger |
| --- | --- | --- | --- | --- | --- |
| VIZ-D01 | Whole-book semantic emotion analysis | Visualizer | `P9-VIZ-1` | Same-corpus PC/local benchmark, source accuracy, structured output, latency, safety | P7 foundation passes and PC-only is insufficient for useful semantic output |
| VIZ-D02 | Local LLM graph analysis | Visualizer + Program 9 provider owner | `P9-VIZ-1` | Qualified local route, visible `qwen3:4b`, exact evidence, cancellation, no fallback | P9 provider boundaries are accepted and local value justifies execution |
| VIZ-D03 | Background/overnight analysis | Async Job Queue / Task Runner + Visualizer | `P9-VIZ-2` | Resume, cancellation, changed-source invalidation, resource and budget proof | Foreground local analysis is too slow for a real author workflow |
| VIZ-D04 | API graph analysis | Model Router / Provider Execution Policy + Visualizer | `P9-VIZ-6` | Local insufficiency, outbound approval, cost/privacy proof, same benchmark | PC-only and local routes fail the agreed utility threshold |
| VIZ-D05 | Character internal/expressed overlays | Character Cards + Visualizer | `P9-VIZ-1` | Character attribution and perspective accuracy | Character context is accepted and local semantic analysis is admitted |
| VIZ-D06 | Reader-effect lane | Author Intent + Visualizer | `P9-VIZ-3` or `P9-VIZ-5` | Separate reader-effect contract and evidence; no character/reader collapse | A real workflow requires comparing intended and observed reader effect |
| VIZ-D07 | Action, tension, pacing, horror, mystery pressure | Visualizer | `P9-VIZ-3` | One benchmark and source-linked contract per family | Emotion foundation is stable and a concrete inspection workflow is proven |
| VIZ-D08 | Structural beats and setup/payoff overlays | Outline / Foreshadow-Payoff + Visualizer | `P9-VIZ-3` | Existing structural owner and source-linked overlay proof | Structural owners can provide stable positions without graph-owned truth |
| VIZ-D09 | Custom bipolar axis analysis | Visualizer | `P9-VIZ-4` | Axis definition, scale, subject scope, source evidence, uncertainty | Author defines a real story question that fixed emotion labels cannot express |
| VIZ-D10 | Key moments and higher-level insights | Diagnostics / Evidence + Visualizer | `P9-VIZ-5` | Underlying signal citations, false-positive review, source navigation | At least two qualified signal families produce useful transitions |
| VIZ-D11 | Revision comparison | Persistence / History + Visualizer | `P9-VIZ-5` | Fingerprint-bound before/after comparison and stale handling | Revision evidence exists and a real before/after workflow is requested |
| VIZ-D12 | Program 8 character/lore/search context | Program 8 domain owners | `P8-VIZ-1` and `P8-VIZ-2` | Owner receipts, provenance, protection, no truth drift | A Program 8 owner is accepted and a Visualizer workflow needs it |

## 13. Program 7 Deferral Record

Program 7 closure must record:

- `P7-VIZ-0` through `P7-VIZ-4` as passed, failed, or uncertain;
- every unqualified semantic capability as deferred using its `VIZ-D` ID;
- the exact Program 8 or Program 9 resolution stage;
- the owner and required evidence;
- the reopening trigger; and
- the fact that an incomplete semantic analyzer does not invalidate direct
  writing or the no-AI revision workflow.

The closure report must not say only “Visualizer later.” It must link each
deferred item to this ledger.

## 14. Plan Change Rules

When a future Visualizer idea appears:

1. assign it a `VIZ-D` ID or a new package ID;
2. name its truth owner and non-owner;
3. state whether it is measured, inferred, derived, or author-defined;
4. assign the exact program and stage;
5. list dependencies and required evidence;
6. define one observable reopening trigger; and
7. update this document before implementation begins.

No new Visualizer surface, provider, signal family, or background job is
considered planned until it is recorded here and linked from the controlling
Program plan.
