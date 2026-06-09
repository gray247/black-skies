# Authorship Provenance AI Visibility

## 1. Status Header

- Dossier name: `Authorship Provenance AI Visibility`
- Status: `Exploring`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-08`
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
- allows author-controlled transition from AI-origin text into author-owned text,
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

Writing view should stay clean by default.
Detailed provenance overlays, badges, or history views are user-toggleable author-support views rather than permanently forced noise.
After explicit author action, accepted AI-assisted text becomes authored manuscript text and visible difference is user-controlled rather than permanently forced.

## 7. Hidden/Background Behavior

- provenance metadata kept local and private by default,
- acceptance timestamps later,
- tool-source attribution later,
- masked or excluded range provenance may record that masking, exclusion, substitution, or an author-approved package summary existed without retaining raw excluded text by default,
- Detached or reduced provenance may be allowed later when the author rewrites text into their own words.

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
- user-controlled export and review visibility rules later,
- clean-by-default export unless the author explicitly chooses a provenance, notes, or audit-history export mode later.

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
- export or sync persistence behavior only after explicit rules exist,
- private provenance metadata later when user settings keep history without forcing visible marks,
- author-approved masked or excluded package-summary references later without retaining raw excluded text by default.

## 15. What Remains Temporary

- ephemeral suggestions,
- transient color or badge states,
- unaccepted generated text,
- masked outbound previews,
- discarded provenance metadata that the author does not keep for an explicitly chosen workflow,
- exact storage, export, and private-metadata treatment until explicitly approved.

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
Author authority remains primary over any AI-origin trace.

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
Exact persistence, private metadata, and export treatment remain unresolved.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Red or strikeout states may also represent masked or censored outbound material.
That must not silently alter the local authored manuscript.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Masked-package visibility should explain transformation without leaking raw sensitive content outward.
Hidden or discarded provenance must not leak into export, `Companion` context, `Memory Lab`, or outbound packages.

## 27. Testing Requirements

- authored text remains distinguishable from AI text,
- accepted AI text does not silently become author text without explicit rules,
- rejected or masked material is not confused with deleted canon,
- export behavior preserves intended provenance boundaries later.

## 28. Governance Rules And Risks

Governance rules:

- AI output is advisory unless accepted,
- "No story is complete until every word on every page is mine",
- author authority controls the final text decision,
- AI tracking serves the author and must not become an undeletable scar,
- no invisible AI authorship,
- no automatic AI manuscript mutation,
- provenance is private author-support metadata by default,
- visible difference after acceptance may be toggleable by user setting,
- export behavior is user-controlled,
- provenance markers must not fake certainty,
- authorship visibility must not collapse into invisible blending,
- clean-by-default writing views and clean-by-default exports are valid doctrine so long as the author can summon provenance when needed,
- hidden or discarded provenance must not silently survive into export, `Companion`, `Memory Lab`, or outbound package context.

Minimum rough provenance and source fields:

- `source type`
- `owning system`
- `author-owned truth` versus `advisory` versus `temporary` versus `archive`
- explicit author action that `accepted`, `saved`, or `converted` the item later
- `visibility` and export status
- `mask`, `AI exclusion`, or `package-view` relationship
- `deleted`, `forgotten`, or `discarded` status
- `citation` or source-trace requirement

These fields serve the author's understanding, review, and control.
They do not become author-owned story truth on their own.

Risks:

- author confusion,
- permanent visual overload,
- ambiguous transition from AI text to author text,
- provenance rules that feel punitive instead of useful,
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

- forced permanent provenance scars that override author authority,
- invisible provenance rewriting,
- provenance-as-judgment systems.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently. Jason's doctrine resolves author authority over accepted or rewritten AI text; remaining questions are implementation-level provenance, storage, and export controls.

### Critical Questions

- Future contract need: beyond the rough provenance and source fields above, what minimum provenance model is required for rendering, storage, and acceptance-state tracking across authored, suggested, generated, accepted, rejected, removed, masked, and censored text?
- Future contract need: beyond the rough fields above, what exact deletion, hiding, discard, export, and sync workflow must govern visible provenance records and private provenance metadata once runtime surfaces exist?
- Future contract need: beyond the rough fields above, how must manual masking, AI exclusion zones, and author-approved package views affect provenance records without leaking sensitive content, retaining raw excluded text by default, or turning provenance into author-owned truth or an undeletable scar?

### Major Questions

- How should user-controlled visibility modes behave across writing, review, and export views?
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
- May explicit author action make AI-origin text author-owned text? Answered: yes.
- Is visible difference after acceptance permanently required? Answered: no, it is user-controlled.
- Is export behavior forced to preserve one visible provenance mode? Answered: no, export behavior is user-controlled.
- Is provenance metadata the same thing as author-owned story truth? Answered: no. Provenance serves visibility, review, and author control; it does not become story truth on its own.
- What provenance records must be visible by default, and which visibility states may be user-toggleable across writing, review, and export views? Answered: provenance is private author-support metadata by default; writing view stays clean by default and provenance overlays or details are user-toggleable.
- After explicit acceptance or heavy rewrite, when must AI-origin output remain visibly marked, and when may the author hide that distinction without erasing provenance history? Answered: accepted AI-assisted text becomes authored manuscript text and need not remain visibly marked unless the author chooses that view.
- How should export preserve, transform, or suppress provenance? Answered: exports should be clean by default, and provenance remains local or private unless the author explicitly chooses an export mode that includes provenance, notes, or audit history.
- How should manual masking, AI exclusion zones, and author-approved package views affect provenance? Answered: provenance may record that masking, exclusion, substitution, or an author-approved package summary existed, but it must not retain or expose raw excluded text by default.
- What rough provenance and source fields should exist before `Companion` or `Memory Lab` can present something as reliable guidance? Answered: source type, owning system, authority tier, author action, visibility or export status, mask or exclusion or package-view relationship, deleted or forgotten or discarded status, and citation or source-trace requirement.

### Deferred Questions

- Advanced provenance browsing.
- Long-term merge boundary with `explicit_content_architecture.md` and `companion.md`.

## 34. Acceptance Criteria

Current-cluster rough stability note: implementation remains blocked by open Critical questions, but this adjacent provenance and signal alignment pass is stable enough to pause after rough field boundaries are recorded.

This rough dossier is acceptable only if:

- AI never silently becomes authored truth,
- the authorship doctrine stays explicit,
- the current color doctrine is marked as under review rather than falsely finalized,
- author authority over accepted or rewritten AI-origin text is primary,
- visible difference after acceptance is user-controlled rather than permanently forced,
- no invisible AI authorship is implied,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no runtime implementation is implied.
