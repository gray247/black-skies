# Authorship Provenance AI Visibility

## 1. Status Header

- Dossier name: `Authorship Provenance AI Visibility`
- Status: `Exploring`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-07`
- Depends on: `Writing Surface`, `Command Center Surface`, `Narrative Insertion / Assertion`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Critique`, `Companion`, `Import / Export / Google Docs`, `Explicit-Content Marker / Send-Package Censor`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define how Black Skies shows who wrote what, what is still advisory, and what has been removed, masked, or transformed.

## 3. User Problem Solved

Writers need clear authorship and provenance visibility so AI assistance never quietly becomes authored truth.

## 4. What The System Does

- defines authorship and provenance display rules,
- distinguishes authored text from AI output and suggestions,
- records acceptance and rejection boundaries,
- supports later export and review behavior.

## 5. What The System Does Not Do

- it does not decide whether text is good,
- it does not silently convert AI output into author truth,
- it does not hide AI contribution inside apparently human-authored prose,
- it does not automatically mutate manuscript text on behalf of AI,
- it does not require permanent visible noise for every token forever.

## 6. User-Facing Behavior

Current doctrine-under-review for visible UI treatment, not a locked build contract:

- black = author text
- green = AI-generated text
- purple = AI suggestion
- red or strikeout = removed, masked, rejected, or censored text

## 7. Hidden/Background Behavior

- provenance metadata,
- acceptance timestamps later,
- tool-source attribution later.

## 8. What Appears First

The writer should see authorship and suggestion status clearly where it matters most.

## 9. What Is Summonable

Detailed provenance history, acceptance history, and source explanations.

## 10. What Is Hidden Until Needed

Low-level metadata, older suggestion history, and export-specific provenance transforms.

## 11. Inputs

- authored prose,
- AI-generated prose,
- AI suggestions,
- accepted or rejected AI content,
- masked or censored outbound-package data later.

## 12. Outputs

- visible text-state distinctions,
- provenance annotations,
- acceptance-state markers,
- export and review visibility rules later.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Critique`
- `Companion`
- future export and sync systems

## 14. What Gets Stored

- provenance metadata later,
- acceptance state later,
- source-tool references later,
- export or sync persistence behavior only after explicit rules exist.

## 15. What Remains Temporary

- ephemeral suggestions,
- transient color or badge states,
- unaccepted generated text,
- masked outbound previews,
- any exact acceptance-to-authorship transition rule until explicitly approved.

## 16. Relationship To Narrative Insertion / Assertion

Authorship visibility may point to narrative primitives, but it does not replace narrative identity.

## 17. Relationship To Story Units

Story Units may display authorship context, but they are not the source of authorship truth.

## 18. Relationship To Prose / Scene Projection

Most visible authorship rules land on prose and projection surfaces.
Projection remains display, not base truth.

## 19. Relationship To Writing Surface

This dossier is central to Writing Surface trust.
The Writing Surface should make authorship status obvious without becoming visually noisy.

## 20. Relationship To Command Center Surface

The Command Center may inspect provenance and suggestion state, but it should not duplicate every inline authorship marker.

## 21. GUI Placement Principles

- clarity first,
- low clutter,
- no deceptive blending of authored and AI text,
- visibility must support trust, not decoration.

## 22. Local LLM Role

Local models may only label their own outputs or provenance states later.

## 23. Paid API Role

Paid API outputs must remain clearly marked as advisory or generated until the writer accepts them.

## 24. Model Routing Notes And Cost / Budget Impact

Visibility itself should be cheap.
Upstream AI generation may cost money, but provenance display must not require extra spending.
Exact persistence and export treatment remain unresolved.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Red or strikeout states may also represent masked or censored outbound material.
That must not silently alter the local authored manuscript.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Masked-package visibility should explain transformation without leaking raw sensitive content outward.

## 27. Testing Requirements

- authored text remains distinguishable from AI text,
- accepted AI text does not silently become author text without explicit rules,
- rejected or masked material is not confused with deleted canon,
- export behavior preserves intended provenance boundaries later.

## 28. Governance Rules And Risks

Governance rules:

- AI output is advisory unless accepted,
- "No story is complete until every word on every page is mine",
- no invisible AI authorship,
- no automatic AI manuscript mutation,
- provenance markers must not fake certainty,
- authorship visibility must not collapse into invisible blending.

Risks:

- author confusion,
- permanent visual overload,
- ambiguous transition from AI text to author text,
- hidden export laundering of provenance.

## 29. Failure Modes

- marks disappear too early,
- marks persist forever and create noise,
- export strips needed provenance,
- users mistake suggestions for accepted text.

## 30. v1 Boundary

Basic visibility doctrine plus limited provenance states for authored, suggested, generated, and removed or masked text.

## 31. v2 Boundary

Richer provenance history, acceptance lineage, and export-aware rendering.

## 32. Future-Only Boundary

- automatic declassification of AI text into authored truth,
- invisible provenance rewriting,
- provenance-as-judgment systems.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- When, if ever, does accepted AI text become author text rather than accepted AI-origin text?
- Can accepted AI text ever lose visible provenance completely, and under what explicit author action?

### Critical Questions

- What are the acceptance-state rules for authored, suggested, generated, accepted, rejected, removed, masked, and censored text?
- What is the minimum provenance model for storage and rendering?
- How should export and sync preserve, transform, or suppress provenance?
- What persistence behavior is required before provenance appears in runtime surfaces?

### Major Questions

- Do markings persist forever, until author conversion, until export, or by view mode?
- How should heavily rewritten AI text be classified?
- How should imported documents with no provenance history be represented?
- How should masked outbound packages differ visually and semantically from local prose?

### Minor Questions

- What exact palette should implement the current doctrine?
- Should the UI use animation, badges, strikeout, or combined states for dense cases?
- What provenance wording is clear without creating permanent visual noise?

### Answered / Superseded Questions

- Does black currently mean author text? Answered: yes, as doctrine under UI review.
- Does green currently mean AI-generated text? Answered: yes, as doctrine under UI review.
- Does purple currently mean AI suggestion? Answered: yes, as doctrine under UI review.
- Does red or strikeout currently mean removed, masked, rejected, or censored text? Answered: yes, as doctrine under UI review.
- Is AI advisory unless accepted? Answered: yes.
- Is the current color doctrine final implementation detail? Answered: no, exact UI treatment remains under review.

### Deferred Questions

- Advanced provenance browsing.
- Long-term merge boundary with `explicit_content_architecture.md` and `companion.md`.

## 34. Acceptance Criteria

This rough dossier is acceptable only if:

- AI never silently becomes authored truth,
- the authorship doctrine stays explicit,
- the current color doctrine is marked as under review rather than falsely finalized,
- accepted-AI transition remains explicitly unresolved until later doctrine resolves it,
- no invisible AI authorship is implied,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no runtime implementation is implied.
