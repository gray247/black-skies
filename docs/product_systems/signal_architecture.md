# Signal Architecture

## 1. Status Header

- Dossier name: `Signal Architecture`
- Status: `Exploring`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-07`
- Depends on: `Continuity`, `Writing Surface`, `Command Center Surface`, `Narrative Insertion / Assertion`
- Feeds into: `Continuity`, `Critique`, `Companion`, `Memory Lab`, `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define what a signal is, who emits it, who consumes it, and how signal authority stays bounded.

## 3. User Problem Solved

Give the writer structured warnings, questions, and cues without turning signals into authored truth or clutter.

## 4. What The System Does

- defines shared signal vocabulary,
- allows one signal to appear across multiple surfaces,
- preserves provenance, confidence, and severity,
- separates signals from mutation authority.

## 5. What The System Does Not Do

- it does not own narrative truth,
- it does not force action,
- it does not silently resolve story problems,
- it does not exist only in one surface.

## 6. User-Facing Behavior

- subtle indicators,
- inspectable signal detail,
- filters, muting, and later resolution controls.

## 7. Hidden/Background Behavior

- background collection,
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

- continuity findings,
- critique outputs,
- Memory Lab findings later,
- Companion observations later,
- structural or projection context when relevant.

## 12. Outputs

- normalized signals,
- provenance markers,
- severity and confidence labels,
- mute or resolve candidates later.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Outline`
- `Companion`
- tool-specific panels later

## 14. What Gets Stored

- accepted resolutions later,
- signal provenance later,
- mute or suppress preferences later.

## 15. What Remains Temporary

- ephemeral signals,
- stale signals after rewrite,
- low-confidence hints,
- background suggestions not yet surfaced.

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

Signals must not reveal masked raw content through summaries or previews.

## 27. Testing Requirements

- one signal can feed multiple consumers,
- signals remain non-authoritative,
- provenance and confidence survive transport,
- muting or resolution does not rewrite source truth.

## 28. Governance Rules And Risks

Governance rules:

- signals are not authored truth,
- no signal may silently execute mutation,
- no single surface owns signal law,
- one signal may have multiple consumers without duplicating authority.

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

- What single authority model governs signal identity, lifecycle, and cross-surface display so one signal does not become multiple competing authorities?

### Critical Questions

- Who may emit signals?
- Who may treat a signal as actionable?
- How should severity, confidence, and provenance be normalized?
- What storage rules apply to signal provenance, mute state, resolution, and staleness?
- How does signal provenance stay intact across surfaces?

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

### Deferred Questions

- Historical dashboards.
- Advanced multi-project signal aggregation.
- Possible shrink into shared contracts if signal governance becomes small enough.

## 34. Acceptance Criteria

This rough dossier is acceptable only if:

- signals remain advisory,
- multi-surface display does not create multi-authority drift,
- no hidden runtime authority is implied,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no build-ready claim is made.
