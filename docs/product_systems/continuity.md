# Continuity

## 1. Status Header

- Dossier name: `Continuity`
- Status: `Exploring`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-08`
- Depends on: `Narrative Insertion / Assertion`, `Prose / Scene Projection`, `Writing Surface`, `Command Center Surface`
- Feeds into: `Signal Architecture`, `Memory Lab`, `Companion`, `Critique`, `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define continuity as an advisory and signal-producing system instead of a truth owner.

This dossier inherits truth ownership limits from `truth_and_state_ownership_matrix.md`, output vocabulary from `shared_output_vocabulary_contract.md`, signal handoff rules from `signal_architecture.md`, memory boundaries from `provenance_state_model.md` and `degraded_mode_execution_contract.md`, and protection rules from `protected_content_permission_matrix.md`.

## 3. User Problem Solved

Help the writer notice contradiction, omission, drift, and causality pressure without turning continuity into automatic story law.

## 4. What The System Does

- observes narrative foundations and projections,
- compares material across time and structure,
- emits continuity findings, warnings, and evidence bundles,
- emits continuity candidates and comparison results,
- routes accepted continuity decisions back into author-owned story foundations instead of a shadow canon,
- supports later acceptance, resolution, and traceability flows.

## 5. What The System Does Not Do

- it does not own narrative truth,
- it does not replace `Narrative Insertion / Narrative Assertion`,
- it does not silently rewrite prose,
- it does not make scene the base authority,
- it does not become a mandatory gate before writing,
- it does not own Memory Lab, Signal Architecture, Feedback Notes, or author-owned truth decisions.

## 6. User-Facing Behavior

- subtle continuity signals,
- inspectable findings with evidence,
- later acceptance or dismissal controls,
- bounded continuity notes rather than absolute verdicts.
Temporary continuity findings may offer writer-facing actions such as
`Save as Note`, `Flag for attention`, `Dismiss`, `Ignore`, and `Review
source`, but those actions do not create durable state until the owning
system accepts them.

## 7. Hidden/Background Behavior

- low-cost observation when affordable,
- comparison passes that stay advisory,
- deferred deep scans when the writer explicitly asks for more.
Protected, hidden, deleted, discarded, forgotten, local-only, or AI-excluded material must not leak through continuity summaries.

## 8. What Appears First

Small, non-gating signals and continuity hints.

## 9. What Is Summonable

Detailed continuity review, evidence trails, and contradiction inspection.

## 10. What Is Hidden Until Needed

Heavy long-context runs, export compatibility checks, and broad project-wide audits.

## 11. Inputs

- `Narrative Insertion / Narrative Assertion`
- prose projections
- scene projections used only as compatibility views
- optional Story Unit and Outline links
- accepted lore or character records later
- import, export, and recovery artifacts later

## 12. Outputs

- continuity findings,
- contradiction candidates,
- unresolved-causality warnings,
- evidence bundles,
- continuity-derived signal candidates for `Signal Architecture`,
- continuity-derived note candidates and memory candidates only through owning-system conversion,
- accepted continuity notes later.
- accepted continuity truth must live in author-owned narrative assertions, notes, lore, character facts, or other explicit author decisions created through explicit author acceptance or explicit save, convert, or update actions.
Continuity outputs are advisory unless accepted through a truth owner or durable-state owner.

## 13. Which Other Systems Consume Those Outputs

- `Signal Architecture`
- `Writing Surface`
- `Command Center Surface`
- `Memory Lab`
- `Companion`
- `Critique`
- future `Relationship Map` and `Emotion Graph`

## 14. What Gets Stored

- accepted continuity decisions later,
- accepted continuity truth in author-owned foundations, notes, lore, character facts, or explicit author decisions later only through explicit author save, convert, or update actions,
- explicitly retained durable advisory history later when it helps explain story maturation or a resolved continuity outcome,
- provenance for accepted findings and retained dismiss or suppress decisions later,
- explicit suppress or ignore decisions later,
- bounded recent completed-run history under the editorial-workflow
  history posture when it remains useful and within trimming limits.
Continuity candidates remain temporary until accepted, dismissed, suppressed, converted, or expired.

## 15. What Remains Temporary

- unaccepted findings,
- continuity-derived signal candidates before normalization or expiry,
- AI inference, summaries, and advisory continuity records before explicit author acceptance,
- confidence estimates,
- ephemeral comparison runs,
- provisional hypotheses,
- expensive deep-review outputs that have not been accepted,
- noisy or irrelevant advisory history that does not become useful information,
- unpinned temporary history that may later trim or expire honestly.
Continuity candidate does not equal accepted continuity truth.

## 16. Relationship To Narrative Insertion / Assertion

Continuity depends on narrative primitives as its base comparison units.
Continuity must not replace them or redefine them.

## 17. Relationship To Story Units

Story Units are optional grouping containers that continuity may inspect, but they are not required inputs.

## 18. Relationship To Prose / Scene Projection

Continuity may inspect prose and scene projections as views of the story.
Those projections do not become continuity truth owners.

## 19. Relationship To Writing Surface

The Writing Surface may show continuity effects, but continuity must not gate direct writing.

## 20. Relationship To Command Center Surface

The Command Center is the more natural inspection surface for continuity review, but it remains support-only.

## 21. GUI Placement Principles

- subtle first,
- inspect on demand,
- no dashboard spam,
- no always-on accusation wall.

## 22. Local LLM Role

Later local models may help with bounded low-cost comparison, extraction, or signal suggestion when feasible.

## 23. Paid API Role

Paid API use is for deep, broad, or long-context review only when necessary and approved by routing rules.

## 24. Model Routing Notes And Cost / Budget Impact

- prefer subtle and cheap observation first,
- use manual runs as backup,
- reserve paid API for heavy or long-context review,
- do not let continuity create surprise spend.

## 25. Explicit-Content / Send-Package Handling, If Applicable

If continuity uses outbound packages later:

- raw story should stay local,
- author-controlled masks, substitutions, summaries, and AI exclusion zones must be honored before any outbound continuity package is assembled,
- outbound continuity packaging must use the author-approved redacted or package view rather than excluded raw manuscript ranges,
- masked or summarized packages may be used outward,
- continuity and causality should be preserved where possible,
- masked summaries or substitutions used for outbound work remain package artifacts rather than author-owned continuity truth unless explicitly saved or converted by the author.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Continuity must not leak raw manuscript content by default and must not silently widen visibility of sensitive material.
Protected, hidden, deleted, discarded, forgotten, local-only, or AI-excluded material must not leak through continuity summaries or evidence bundles.

## 27. Testing Requirements

- continuity can emit advisory signals without mutating prose,
- scene compatibility inputs remain projection-only,
- accepted continuity is distinguishable from inferred continuity,
- no silent manuscript mutation occurs,
- writers can ignore or dismiss findings without breaking authoring flow.

## 28. Governance Rules And Risks

Governance rules:

- continuity is advisory and signal-producing, not truth-owning,
- accepted continuity truth lives in author-owned story foundations rather than a separate accepted-continuity kingdom,
- no silent mutation of manuscript truth,
- no scene-first authority drift,
- no Story Unit gate,
- no inferred finding becomes authored truth without user action,
- durable advisory history must be purposeful and relevant rather than stored just because data exists,
- continuity outputs are findings, warnings, evidence bundles, signal candidates, note candidates, memory candidates, and truth candidates only through owning-system conversion,
- continuity does not own Memory Lab, Signal Architecture, Feedback Notes, or Narrative Insertion / Assertion,
- continuity findings are advisory until accepted through an owner path.

Minimum rough lifecycle vocabulary for continuity and signal handoff:

- `candidate`: an unaccepted continuity finding, evidence bundle, or potential signal handoff that remains advisory.
- `accepted`: the author has explicitly accepted the continuity outcome as meaningful; accepted manuscript prose becomes authored text, but structured continuity truth appears only through explicit save, convert, or update actions.
- `dismissed`: a reviewed continuity item judged not actionable and not worth active surfacing, though minimal provenance may remain.
- `suppressed`: a continuity item intentionally hidden from default surfacing without claiming the underlying concern was false.
- `ignored`: a continuity item left unacted on, with no promise of durable retention beyond temporary advisory history.
- `stale`: a continuity item likely outdated after rewrite or new evidence and needing revalidation before reuse.
- `expired`: a stale or low-value advisory item that should stop surfacing and usually stop persisting.
- `converted`: an advisory continuity outcome explicitly turned into another durable form, such as a signal handoff or an author-owned note or fact.
- `resolved`: a continuity concern whose review loop is closed by dismissal, suppression, or explicit author action.
- later re-evaluation may report `appears resolved`, `persists`, `changed form`, `insufficient evidence`, `blocked by protection`, or `possible recurrence`, but those outcomes do not close durable notes or durable signals automatically.

These are rough product-definition terms, not a final runtime schema.
Continuity may produce continuity-local advisory records, evidence bundles, and continuity candidates without making them durable signal history.
Some continuity outputs may be offered to `Signal Architecture` as signal candidates.
`Signal Architecture` owns durable signal state.
Provenance records source, action, and history, but it does not own truth.
`Memory Lab` may retain governed recall only under its retention rules.
`Companion` may explain and guide using cited source labels, but it does not own continuity, signal state, provenance, or truth.
Archive references are historical context, not active doctrine.

Risks:

- false certainty,
- noisy signal spam,
- scene compatibility quietly becoming base authority,
- Memory Lab or Companion over-claiming continuity truth.

## 29. Failure Modes

- stale findings after major rewrites,
- deleted-material confusion,
- over-reporting harmless ambiguity,
- under-reporting real contradiction,
- users mistaking findings for canon.

## 30. v1 Boundary

Advisory continuity signals plus bounded evidence only.
No mutation authority.

## 31. v2 Boundary

Accepted continuity notes, richer suppression rules, and stronger cross-system consumption.

## 32. Future-Only Boundary

- autonomous repair,
- continuity-owned graph authority,
- silent rewrite or restructure,
- runtime wiring that bypasses writer acceptance.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently. The governance suite answers the prior shadow-canon and authority concerns.

Exact-contract classification note:

- Jason decision candidates: what narrative sources `Continuity` may observe directly, and which continuity outputs may hand off as signal candidates versus remain continuity-local.
- Future contract needs: shared continuity state model beyond rough lifecycle vocabulary, and exact durable advisory history versus governed recall versus expiry boundaries.
- Already answered by accepted doctrine: `Continuity` remains advisory; only explicit author acceptance creates author-owned continuity truth; some continuity outputs may become signal candidates; provenance records source/history without owning truth; archive references are not active doctrine.
- Still blocked for implementation: yes, until continuity-source, handoff, state, and retention contracts are shaped.

### Critical Questions

- What exact evidence grading, contradiction handling, severity, and confidence model should continuity use?
- What exact scan scope belongs to continuity before it becomes too expensive or too noisy?
- What exact v1 continuity catalog should ship first?
- What exact storage and expiry rules should apply to continuity candidates, history, and accepted outcomes?

### Major Questions

- Who are the exact continuity producers and consumers?
- How should intentional contradiction and unresolved mystery be distinguished from actual continuity holes?
- How should imported scene-first projects, deleted draft material, and recovery artifacts be handled?

### Minor Questions

- What visual severity vocabulary is useful without becoming an accusation wall?
- What batch-reporting presentation is worth preserving later?

### Answered / Superseded Questions

- Is Continuity advisory and signal-producing? Answered: yes.
- Does `Narrative Insertion / Narrative Assertion` remain the foundation? Answered: yes.
- Is scene a foundation layer? Answered: no, scene remains projection or compatibility only.
- May Continuity feed `Memory Lab`, `Companion`, `Critique`, `Writing Surface`, and `Command Center`? Answered: yes, within advisory limits.
- Where does accepted continuity truth live? Answered: in author-owned story foundations, notes, lore, character facts, narrative assertions, or other explicit author decisions.
- Which acceptance outcomes create author-owned truth updates, and which remain advisory-only continuity records? Answered: only explicit author acceptance creates author-owned continuity truth; accepted manuscript prose becomes authored text, but structured continuity facts are created only by explicit save, convert, or update actions.
- Do AI inference, summaries, signals, and advisory continuity records become author-owned continuity truth on their own? Answered: no, they remain advisory evidence until explicitly accepted by the author.
- Is there a separate accepted-continuity kingdom or shadow canon? Answered: no.
- What shared lifecycle or state vocabulary should `Continuity` and `Signal Architecture` use for candidate, accepted, dismissed, suppressed, ignored, stale, expired, converted, and resolved states? Answered: rough doctrine uses those terms with continuity-specific meanings in this dossier; exact runtime schema and storage contracts remain unresolved.
- How do `Continuity`, `Signal Architecture`, provenance, `Memory Lab`, and `Companion` relate at rough doctrine level? Answered: `Continuity` may produce continuity-local advisory records and signal candidates, `Signal Architecture` owns durable signal state, provenance records source or action or history without owning truth, `Memory Lab` retains governed recall only under its retention rules, and `Companion` may explain and guide using cited source labels without owning the underlying systems.
- Answered / Superseded: continuity outputs remain advisory unless accepted through a truth owner or durable-state owner.
- Answered / Superseded: continuity candidate does not equal accepted continuity truth.

### Deferred Questions

- Graph views.
- Advanced batch reporting.
- Polished visual severity systems.
- Possible merge or shrink with `signal_architecture.md` after both contracts are sharper.
- Does a reusable continuity and signal lifecycle contract artifact eventually need to exist, or can the stabilized lifecycle rules remain inside these dossiers and `system_interaction_map.md`?

## 34. Acceptance Criteria

Current-cluster rough stability note: implementation remains blocked by open Critical questions, but the continuity and signal side of this cluster is stable enough to pause tightening and shift the next dossier attention toward `Authorship Provenance AI Visibility`, `Memory Lab`, and `Companion`.

This rough dossier is acceptable only if:

- continuity stays advisory,
- narrative primitives remain the foundation,
- projections do not become truth owners,
- accepted continuity truth returns to author-owned foundations rather than a shadow canon,
- no silent rewrite authority is implied,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- Critical and Future contract questions remain open, so this dossier cannot be treated as build-ready,
- no runtime build-readiness claim is made.
