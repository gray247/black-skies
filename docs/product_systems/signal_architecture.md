# Signal Architecture

## 1. Status Header

- Dossier name: `Signal Architecture`
- Status: `Exploring`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-08`
- Depends on: `Continuity`, `Writing Surface`, `Command Center Surface`, `Narrative Insertion / Assertion`
- Feeds into: `Continuity`, `Critique`, `Companion`, `Memory Lab`, `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define what a signal is, who emits it, who consumes it, and how signal authority stays bounded.

This dossier inherits durable-state ownership from `truth_and_state_ownership_matrix.md`, handoff and approval rules from `surface_to_owner_action_handoff_contract.md`, advisory vocabulary from `shared_output_vocabulary_contract.md`, protection rules from `protected_content_permission_matrix.md`, provenance posture from `provenance_state_model.md`, degraded behavior from `degraded_mode_execution_contract.md`, and recovery posture from `snapshot_protected_recovery_contract.md`.

## 3. User Problem Solved

Give the writer structured warnings, questions, and cues without turning signals into authored truth or clutter.

## 4. What The System Does

- defines shared signal vocabulary,
- owns durable signal state only,
- allows one signal to appear across multiple surfaces,
- preserves provenance, confidence, and severity,
- preserves the difference between advisory history and author-owned story truth,
- separates signals from mutation authority.

## 5. What The System Does Not Do

- it does not own narrative truth,
- it does not treat signals as truth,
- it does not force action,
- it does not silently resolve story problems,
- it does not exist only in one surface,
- it does not let signal candidates silently become durable signals.

## 6. User-Facing Behavior

- subtle indicators,
- inspectable signal detail,
- filters, muting, and later resolution controls.

## 7. Hidden/Background Behavior

- background collection of signal candidates,
- deduping,
- severity routing,
- expiration or staleness handling later.

## 8. What Appears First

Low-friction signals with clear provenance and non-authoritative framing.

## 9. What Is Summonable

Expanded signal detail, evidence, and grouped views.

## 10. What Is Hidden Until Needed

Heavy batch signal generation, advanced analytics, and historical diff views.

## 11. Inputs

- continuity findings and continuity-derived signal candidates,
- critique outputs and critique-derived signal candidates,
- Memory Lab findings later,
- Companion observations later,
- structural or projection context when relevant.

Upstream systems create signal candidates first.
Trusted direct durable-signal privileges are later-only after narrower contracts exist.

## 12. Outputs

- normalized signal candidates and durable signal records,
- provenance and source references,
- severity and confidence labels,
- display-safe summaries later,
- author-action or accepted-workflow state-change candidates later,
- mute, resolve, or stale-state candidates later.

Signals remain attention objects.
They are not truth, not manuscript mutation, and not source authority.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Outline`
- `Companion`
- tool-specific panels later

## 14. What Gets Stored

- durable signal state later in `Signal Architecture`,
- accepted resolutions later,
- signal provenance later,
- mute, suppress, resolve, and staleness state later,
- explicitly retained durable advisory history later when it remains relevant,
- never accepted story truth.

Durable signal mutation belongs to `Signal Architecture` rather than to producer systems or consumer surfaces.

## 15. What Remains Temporary

- candidate signals before normalization,
- ephemeral signals,
- stale signals after rewrite,
- low-confidence hints,
- duplicate or superseded signal instances,
- background suggestions not yet surfaced,
- missing or irrelevant data that does not become useful information.

Signal candidate does not equal durable signal state.

## 16. Relationship To Narrative Insertion / Assertion

Signals should point back to narrative primitives where possible.
Signals must not replace or hide the underlying objects.

## 17. Relationship To Story Units

Signals may mention Story Units as grouping context, but Story Units are not required for signal existence.

## 18. Relationship To Prose / Scene Projection

Signals may surface on prose or scene projections without making those projections the root truth layer.

## 19. Relationship To Writing Surface

Signals may appear in the Writing Surface, but writing stays primary and non-gated.

## 20. Relationship To Command Center Surface

The Command Center is a natural signal inspection surface, but it must not become a signal junk drawer.

## 21. GUI Placement Principles

- subtle first,
- inspect on demand,
- consistent color and visibility rules,
- no full-screen alert culture by default.

## 22. Local LLM Role

Local models may later help generate or cluster signals when cheap and bounded.

## 23. Paid API Role

Paid API use is reserved for deep or long-context signal generation, not default background noise.

## 24. Model Routing Notes And Cost / Budget Impact

- default to cheap local or deterministic sources when possible,
- do not create silent paid spend,
- route heavy signal generation intentionally.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Signal packaging must preserve provenance while respecting masked or summarized outbound content rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Signals must not reveal masked or AI-excluded raw content through summaries or previews.
Protected, hidden, deleted, discarded, forgotten, local-only, or AI-excluded source material must not leak through signal summaries, grouped views, or recovery surfaces.

## 27. Testing Requirements

- one signal can feed multiple consumers,
- signals remain non-authoritative,
- provenance and confidence survive transport,
- muting or resolution does not rewrite source truth.

## 28. Governance Rules And Risks

Governance rules:

- signals are not authored truth,
- signals are attention objects rather than truth objects,
- no signal may silently execute mutation,
- no single surface owns signal law,
- one signal may have multiple consumers without duplicating authority,
- accepted story truth must live in author-owned foundations rather than in the signal layer,
- durable advisory history must be purposeful and relevant rather than retained as noise,
- upstream systems create signal candidates first,
- signal candidate does not equal durable signal,
- candidate-only first is the active roadmap; trusted direct durable-signal privileges are later-only after narrower contracts exist,
- resolve, dismiss, suppress, convert, or expire actions mutate signal state only and do not mutate source truth.

Minimum rough lifecycle vocabulary for signal handoff and durable signal state, inheriting the shared output vocabulary wherever possible:

- `candidate`: an upstream advisory finding offered to `Signal Architecture` for normalization, not yet durable signal state.
- `reviewed`: the signal has been inspected without becoming truth or another durable owner state automatically.
- `accepted`: a signal outcome or state change that the author, or an explicit accepted workflow, has approved as durable signal state.
- `dismissed`: a reviewed signal judged not actionable and no longer worth active surfacing.
- `suppressed`: a signal intentionally hidden from default views while preserving bounded provenance and policy state.
- `expired`: a stale or low-value signal removed from active surfacing because it no longer justifies durable attention.
- `converted`: a signal explicitly turned into another downstream artifact or action request, without becoming story truth on its own.
- `resolved`: a signal concern whose handling loop is closed for triage purposes, even though accepted story truth still lives elsewhere.
- `superseded`: a prior signal instance displaced by fresher evidence, later analysis, or a newer signal record.

`stale` remains a condition flag rather than a separate canonical shared lifecycle state.
These are rough product-definition terms, not a final runtime schema or storage contract.

Minimum rough signal provenance and handoff fields:

- `source type`
- `owning system`
- `author-owned truth` versus `advisory` versus `temporary` versus `archive`
- source action that `accepted`, `saved`, `converted`, or surfaced the item
- `visibility` and export status where relevant
- `mask`, `AI exclusion`, or `package-view` relationship
- `deleted`, `forgotten`, or `discarded` status where relevant
- `citation` or source-trace requirement

Temporary `Companion` highlights or annotations are advisory overlays.
They are not manuscript edits, not author-owned truth, and not durable signal state.
They may become signal candidates only through explicit author action or an accepted workflow.
Durable signal state remains owned by `Signal Architecture`.
Raw excluded text must not leak through highlight summaries, signal summaries, or previews.

Risks:

- alert fatigue,
- false precision,
- muted signals hiding real problems,
- visibility inconsistency across surfaces.

## 29. Failure Modes

- duplicated signals,
- stale severity,
- missing provenance,
- users treating unresolved signals as canon.

## 30. v1 Boundary

Shared signal vocabulary plus bounded display and inspection rules.

## 31. v2 Boundary

Resolution flows, mute policies, and smarter grouping.

## 32. Future-Only Boundary

- automatic mutation based on signals,
- signal-only gating before writing,
- invisible AI-only signal decisions.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently. Jason's doctrine narrows signal authority: signals remain advisory, accepted truth lives elsewhere, and remaining questions are identity, lifecycle, and storage design.

Exact-contract classification note:

- Jason decision candidates: none currently for the midpoint contract. Candidate-first signal intake and later trusted direct privileges already define the present product posture.
- Future contract needs: normalized signal-state contract, provenance/history storage contract, cross-surface transport rules, durable-versus-expiring signal history rules, and later criteria for trusted direct durable-signal privileges.
- Already answered by accepted doctrine: durable signal state belongs to `Signal Architecture`; accepted story truth does not live in the signal layer; temporary `Companion` highlights cannot become durable signal state directly; signal candidates must preserve rough provenance/source fields and respect mask/exclusion boundaries; resolve, dismiss, suppress, and convert mutate signal state rather than source truth.
- Still blocked for implementation: yes, until signal-state, storage, and transport contracts are shaped.

### Critical Questions

- Future contract need: what minimum normalized signal state contract, beyond the rough lifecycle vocabulary and provenance fields above, must every signal carry for severity, confidence, provenance, source reference, and lifecycle state before multi-surface wiring exists?
- Future contract need: what storage contract applies to signal provenance, mute state, resolution state, staleness markers, retained advisory history, and expiring temporary signal-candidate history before runtime wiring is attempted?
- Future contract need: what transport rules keep signal provenance and source references intact across Writing Surface, Command Center, Outline, Companion, and later panels without letting display state become story truth?
- Future contract need: which signal history events justify durable storage, and which should expire as temporary noise once no longer relevant?

### Major Questions

- How should muting and resolution work without hiding source truth?
- How should stale signals after heavy rewrite be expired or revalidated?
- How should conflicting signals from multiple producers be grouped or challenged?
- How should masked-content signals preserve enough context without leaking raw content?

### Minor Questions

- What visual styling polish is appropriate after the authority model is stable?
- What label vocabulary should avoid fake precision?

### Answered / Superseded Questions

- May signals surface in `Outline`, `Writing Surface`, `Command Center`, `Companion`, and tool-specific panels? Answered: yes.
- May one signal have multiple consumers? Answered: yes.
- Are signals authored truth by default? Answered: no, they are advisory unless the writer accepts or acts on them.
- Who owns durable signal state? Answered: `Signal Architecture`.
- May consumer surfaces create durable signal-state changes on their own? Answered: no. Consumer surfaces may display signals and request actions, but only the author or explicit accepted workflows may create durable resolve, dismiss, snooze, convert, or similar signal-state changes.
- Does accepted story truth live in the signal layer? Answered: no, accepted truth belongs in author-owned story foundations or other explicit author decisions.
- What shared lifecycle or state vocabulary should `Signal Architecture` and upstream advisory producers use for candidate, accepted, dismissed, suppressed, ignored, stale, expired, converted, and resolved states? Answered: rough doctrine uses those terms with signal-specific meanings in this dossier; exact normalization, storage, and transport contracts remain unresolved.
- Answered / Superseded: upstream systems create signal candidates first rather than directly mutating durable signal state.
- Answered / Superseded: trusted direct durable-signal privileges are later-only after narrower contracts exist.
- May temporary `Companion` highlights or annotations become durable signal state directly? Answered: no. They are advisory overlays and may only become signal candidates through explicit author action or an accepted workflow.
- What rough provenance and source fields should signal candidates preserve? Answered: source type, owning system, authority tier, source action, visibility or export status where relevant, mask or exclusion or package-view relationship, deleted or forgotten or discarded status where relevant, and citation or source-trace requirement.

### Deferred Questions

- Historical dashboards.
- Advanced multi-project signal aggregation.
- Possible shrink into shared contracts if signal governance becomes small enough.
- Does a reusable continuity and signal lifecycle contract artifact eventually need to exist, or can the stabilized lifecycle rules remain inside `signal_architecture.md`, `continuity.md`, and `system_interaction_map.md`?

## 34. Acceptance Criteria

Current-cluster rough stability note: implementation remains blocked by open Critical questions, but the continuity and signal side of this cluster is stable enough to pause tightening and shift the next dossier attention toward `Authorship Provenance AI Visibility`, `Memory Lab`, and `Companion`.

This rough dossier is acceptable only if:

- signals remain advisory,
- multi-surface display does not create multi-authority drift,
- accepted truth does not migrate into the signal layer,
- no hidden runtime authority is implied,
- Critical and Future contract questions remain open, so this dossier cannot be treated as build-ready,
- no build-ready claim is made.
