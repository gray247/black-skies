# Author Intent / Story Setup

## 1. Status Header

- Dossier name: `Author Intent / Story Setup`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-15`
- Depends on: `Workflow Spine / Author Journey`, `Writing Surface`, `Command Center Surface`, `Companion`, `protected_content_permission_matrix.md`, `truth_and_state_ownership_matrix.md`
- Feeds into: `Workflow Spine / Author Journey`, `Ideation / Premise Discovery`, `Critique / Evaluation`, `Theme System`, `Continuity`, `Companion`, `LLM Package Construction Architecture`
- Runtime authority: `future`
- Authority level: `authored truth`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define the independent dossier for author-stated project intent, story
setup, creative boundaries, non-assumptions, and project-level guidance.

This dossier exists so Black Skies has a bounded home for explicit
author intent without:

- turning setup into a startup gate,
- collapsing project intent into workflow posture,
- confusing project guidance with manuscript truth or canon,
- letting AI invent missing intent,
- letting routing, permissions, or export policy hide inside story setup.

## 3. User Problem Solved

The writer needs a place to state what they are trying to do, what they
care about, what they do not know yet, and what they do not want
assumed, without being forced to finish planning before writing.

## 4. What The System Does

- holds author-stated creative goals,
- holds author-stated preferences,
- holds intended reader experience,
- holds project-level tonal or reader-emotion targets when the author wants them saved as project intent,
- holds tentative intentions,
- holds deliberate unknowns,
- holds creative boundaries,
- holds non-assumptions,
- holds project-level guidance for downstream systems,
- supports a small optional question set plus freeform clarification,
- allows the author to change direction without being treated as wrong.

## 5. What The System Does Not Do

- it does not own manuscript truth,
- it does not own continuity truth,
- it does not own character canon,
- it does not own lore canon,
- it does not own accepted prose,
- it does not own `Narrative Assertions`,
- it does not own scene authority,
- it does not own outline authority,
- it does not own inferred facts,
- it does not own AI assumptions,
- it does not own critique findings,
- it does not own system permissions,
- it does not own protected-content policy,
- it does not own transfer or export policy,
- it does not own provider policy,
- it does not own routing or spend controls.

Author ownership here does not make this state manuscript truth or
story canon.

## 5A. Historical Recovery Of Wizard / Story Setup Material

Search summary:

- searched repo content for `Wizard`, `Story Setup`, `Story Foundation`,
  `author intent`, `premise questions`, `eleven questions`,
  `11 questions`, `setup questionnaire`, and `onboarding questions`
- searched git history for `Wizard`, `Story Setup`, and `author intent`
- inspected historical `WizardPanel` implementations and current wizard
  step models

Recovery result:

- an exact single canonical repo artifact labeled as the original
  eleven-question `Story Setup` or `Wizard` questionnaire was not found
- the strongest historical evidence is a matching eleven-part planning
  lineage split across:
  - [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md)
  - [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx)
  - [wizard.py](/C:/Dev/black-skies/services/src/blackskies/services/models/wizard.py)
- `decision_checklist.md` preserves the most question-like
  eleven-part source
- the later Wizard UI preserves ten content steps plus a `finalize`
  review step rather than an exact verbatim eleven-question list

Closest recoverable historical eleven-question set:

| # | Closely preserved historical prompt | Source path or historical location | Classification | Why | Better owner if not this dossier |
| --- | --- | --- | --- | --- | --- |
| 1 | `What notes do I actually have, and what is the story's scope?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:15), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:118), [wizard.py](/C:/Dev/black-skies/services/src/blackskies/services/models/wizard.py:55) | `revise` | `scope` is useful here, but inventorying raw notes is more workflow or ideation than durable project intent | `Workflow Spine / Author Journey`, later `Ideation / Premise Discovery` |
| 2 | `What's the premise / aboutness, genre or tone, and intended audience?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:19), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:124) | `keep` | this is core project-intent material when kept lightweight and optional | none |
| 3 | `Do I want a formal structure, and which one?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:24), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:130) | `relocate` | structure choice is planning authority, not project-intent ownership | `Outline` |
| 4 | `What is the scene skeleton, scene order, and scene POV?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:28), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:137) | `relocate` | scene order and POV are structural planning questions, not Story Setup truth | `Outline`, `Prose / Scene Projection` |
| 5 | `Who are the core characters, and who gets arcs?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:33), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:144) | `relocate` | character identity and arc depth belong with character and relationship systems | `Character Cards`, `Relationship Map` |
| 6 | `What is the central conflict, and what happens if they fail?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:38), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:150) | `revise` | high-level pressure and stakes can inform intent, but detailed conflict design can drift into plot planning | partially later `Outline` |
| 7 | `Where are the inciting incident, midpoint, climax, and twists?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:42), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:156) | `relocate` | beat placement is structural planning | `Outline` |
| 8 | `How many acts or sections, what word-count targets, and where should pacing change?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:48), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:162) | `relocate` | pacing and section counts belong to structure and analysis, not project-intent ownership | `Outline`, `Timeline / Pacing / Pressure` |
| 9 | `How many chapters, which scenes group together, and what chapter-break style do I want?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:53), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:168) | `relocate` | chapter grouping is outline-level planning | `Outline` |
| 10 | `Which themes matter most, and where should motifs echo?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:58), [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:175) | `merge` | the high-level theme question belongs here, but motif placement belongs elsewhere | `Theme System` for deeper downstream use |
| 11 | `What level of detail do I want before drafting, and should expansion suggestions be added?` | [decision_checklist.md](/C:/Dev/black-skies/docs/decision_checklist.md:62), later Wizard divergence to `finalize` in [WizardPanel.tsx](/C:/Dev/black-skies/app/renderer/components/WizardPanel.tsx:778) and [wizard.py](/C:/Dev/black-skies/services/src/blackskies/services/models/wizard.py:66) | `merge` | the first half is a useful workflow or planning preference; the second half is AI behavior or project configuration, not Story Setup truth | `Workflow Spine / Author Journey`, project configuration, `Draft Generation / Rewrite Loop` |

Uncertainty note:

- the historical eleven-part intent lineage was found
- the exact verbatim eleven-question Wizard UI wording was not found as a
  single canonical list
- the strongest repository-tracked source of the questions is
  `docs/decision_checklist.md`
- the strongest repository-tracked source of the later Wizard surface is
  `app/renderer/components/WizardPanel.tsx`

## 5B. Proposed Final Question Set

The final Story Setup question set should stay small, optional,
nonjudgmental, and useful across genres.
It should not become a giant worksheet.

Proposed first bounded set:

1. `What kind of project or story is this right now?`
2. `If you can say it simply, what is it about?`
3. `What do you want the reader to feel, notice, or leave with?`
4. `What tone or tonal range feels right?`
5. `If you have a reader in mind, who is it?`
6. `How planned or exploratory do you want this project to be right now?`
7. `What matters most for this project not to lose?`
8. `What creative or story boundaries, red lines, or sensitivities matter here?`
9. `What should Black Skies avoid assuming about this project?`
10. `What are you deliberately leaving unknown or undecided?`
11. `What are you hoping this project will help you discover?`
12. `If this draft were working for you, what would success look like?`
13. `Is there anything you want future tools to treat as guidance, not truth?`

These are project-level questions, not Companion follow-up questions.
They should allow blank answers, partial answers, and changed answers.
Answers to the boundaries question are creative guidance only.
They do not configure protected-content permissions, AI permissions,
outbound-transfer policy, export restrictions, provider policy, routing,
or spend controls.

## 6. User-Facing Behavior

- participation is optional
- the author may skip without penalty
- blank answers are valid
- `unknown` and `undecided` are valid
- editing later is always allowed
- discovery writing remains valid
- changing direction is valid
- manuscript divergence from prior intent is not automatically an error

Likely current posture:

- `Settings -> Story Foundation`

That is a product-placement posture, not a detailed GUI commitment.

## 7. Hidden/Background Behavior

This system may later provide bounded project-intent context to other
systems, but:

- consumption never grants mutation rights
- missing answers must be tolerated
- no consumer may silently replace blanks
- no consumer may silently complete missing intent with AI
- no consumer may silently upgrade tentative guidance into canon or
  manuscript truth

## 8. What Appears First

What should appear first:

- optional short questions
- room for blank or unknown answers
- permission to skip
- clear signal that writing can continue without setup

## 9. What Is Summonable

- current project-intent answers
- tentative guidance
- deliberate unknowns
- protected or excluded answers where allowed
- explanation of which downstream systems may read the profile

## 10. What Is Hidden Until Needed

- consumer-specific use explanations
- any future approval or outbound-use explanations
- any future AI-facing summaries

## 11. Inputs

- direct author answers
- explicit author edits
- explicit author removals
- explicit author choices to leave fields blank, unknown, tentative, or
  intentionally unanswered

Inputs must not include:

- inferred facts silently promoted from prose
- Companion guesses treated as author intent
- critique findings treated as intent
- automatic recovery from structure, character, lore, or continuity
  systems as if they were confirmed setup

## 12. Outputs

- author-stated project guidance
- author-stated preferences
- author-stated intended reader experience
- author-stated boundaries
- author-stated non-assumptions
- deliberate unknowns and undecided points
- tentative or revisable project-intent guidance

Output boundaries:

- outputs are guidance, not manuscript truth
- outputs are project-support truth only when explicitly author-stated
- outputs do not silently rewrite downstream systems

## 13. Which Other Systems Consume Those Outputs

Likely consumers:

- `Workflow Spine / Author Journey`
- later `Ideation / Premise Discovery`
- `Critique / Evaluation`
- `Theme System`
- `Continuity`
- `Companion`
- `LLM Package Construction Architecture`
- future validation programs

Consumption never grants mutation rights.
Consumers may read, summarize in bounded ways, or use the profile as
guidance where approved.
They may not silently edit it, reinterpret blanks as permission, or
invent missing intent.

## 14. What Gets Stored

- optional project-support answers
- freeform project-intent notes if later included
- explicit boundary statements
- explicit non-assumptions
- deliberate unknowns
- author-updated revisions of intent over time

This is private project-support information by default.
It is excluded from clean manuscript export by default.

## 15. What Remains Temporary

- unsaved edits
- clarifying drafts before explicit save
- temporary downstream summaries
- transient prompts asking whether the author wants to update intent

Tentative, blank, abandoned, protected, and excluded answers should be
treated conceptually as different conditions, but this dossier does not
define implementation enums.

## 16. Relationship To Narrative Insertion / Assertion

`Author Intent / Story Setup` may guide narrative decisions, but it does
not replace `Narrative Insertion / Narrative Assertion` as the owner of
accepted manuscript truth or accepted assertion truth.

Project intent may influence writing and evaluation.
It does not silently become accepted prose or accepted assertions.

## 17. Relationship To Story Units

Story Units remain optional.
This dossier does not require Story Units, define Story Units, or use
them as a setup gate.

## 18. Relationship To Prose / Scene Projection

Projection systems may read project intent as context.
They do not receive authority over it, and this dossier does not own
projection state, scene order, or structural planning.

## 19. Relationship To Writing Surface

Direct writing must remain valid with no setup.
The Writing Surface may later surface bounded project-intent reminders
or references, but it must not require completion of Story Setup before
the author can write.

## 20. Relationship To Command Center Surface

The Command Center may later provide a heavier review or edit path for
Story Setup, but it must not make this profile a gate before writing.

## 21. GUI Placement Principles

- keep it optional
- keep it editable
- keep it easy to ignore when the author wants to draft
- do not turn startup into a ceremony
- do not turn Story Foundation into a dashboard junk drawer

Current placement posture may be described as:

- `Settings -> Story Foundation`

That is enough for discovery.

## 22. Local LLM Role

No local model role is required.

Later bounded possibilities:

- summarize the author's own answers for review
- help compare current guidance with prior guidance
- help a downstream system use approved guidance

No local model may silently fill in missing intent.

## 23. Paid API Role

No paid API role is required.

If a later downstream system wants to use Story Setup in outbound work,
that use requires applicable approval and remains governed by routing,
package, and protection doctrine owned elsewhere.

## 24. Model Routing Notes And Cost / Budget Impact

This dossier does not own routing or spend.

Consumer rules:

- absence of answers never blocks writing
- absence of answers never forces an AI call
- downstream outbound use requires applicable approval
- consumers must tolerate missing, blank, tentative, protected, or
  excluded answers

## 25. Explicit-Content / Send-Package Handling, If Applicable

- protected answers inherit protection
- excluded answers remain excluded
- Story Setup is excluded from clean manuscript export by default
- outbound use requires applicable approval
- no package may silently include protected answers because a downstream
  system finds them useful

If a later AI-facing consumer uses this material, it must use only the
approved view allowed by routing, package, and protected-content rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

- Story Setup is private project-support information by default
- protected answers inherit protection rather than losing it here
- blank or missing answers must stay blank or missing unless the author
  changes them
- no silent replacement or completion by AI
- no hidden scoring
- no hidden personality typing or taste grading

## 27. Testing Requirements

- direct writing remains available with no setup
- Story Setup remains optional and skippable
- blank, unknown, and undecided answers remain valid
- consumers tolerate missing answers
- no consumer silently mutates Story Setup
- clean manuscript export excludes Story Setup by default
- protected answers preserve protection state through allowed downstream
  use

## 28. Governance Rules And Risks

Governance rules:

- Story Setup is project-support truth only when explicitly stated by the
  author
- Story Setup does not own manuscript truth or canon
- consumers may read but may not silently mutate
- no silent AI completion
- no silent inference-to-intent promotion
- no startup gate
- no automatic error when the manuscript diverges from prior intent

Risks:

- setup drift becoming a hidden workflow gate
- Companion sounding like it owns intent
- critique findings being mistaken for intent
- protected answers leaking into export or AI packages
- outdated intent being treated as a verdict against discovery writing

## 28A. Approved Boundaries

Approved boundaries for this dossier:

- it is an independent dossier
- it owns author-stated creative goals
- it owns preferences
- it owns intended reader experience
- it owns tentative intentions
- it owns deliberate unknowns
- it owns creative boundaries
- it owns non-assumptions
- it owns project-level guidance
- it does not own manuscript truth
- it does not own continuity truth
- it does not own character or lore canon
- it does not own accepted prose
- it does not own `Narrative Assertions`
- it does not own scene or outline authority
- it does not own inferred facts
- it does not own AI assumptions
- it does not own critique findings
- it does not own system permissions
- it does not own protected-content policy
- it does not own transfer or export policy
- it does not own provider policy
- it does not own routing or spend controls

## 28B. Jason Decision Candidates

Remaining Jason product decisions:

- which of the proposed final questions should be in the first bounded
  set versus deferred
- how much freeform space should live beside the short question set
- how visible Story Foundation should be in normal workflow when the
  author never touches it
- how strongly the system should surface changed or abandoned intent to
  the author later

The existence of this dossier is not a Jason decision candidate.
That decision is already approved.

## 28C. Possible Future Contract Needs

- exact accepted-project-truth save and update contract
- exact downstream read-only consumer contract
- exact divergence handling between current manuscript and prior intent
- exact protected, excluded, and outbound-use handling for intent fields
- exact change-history and abandonment semantics

## 28D. Intentionally Premature Implementation Questions

Do not settle here:

- data model shape
- database schema
- settings UI details
- startup UI details
- storage enums
- API contract shape
- cross-device sync
- runtime migration
- per-field widgets

## 29. Failure Modes

- the profile becomes mandatory
- missing answers are treated as failure
- AI invents missing intent
- consumers crash or degrade when answers are absent
- protected answers leak into clean export or outbound packages
- old intent gets treated as binding canon against later draft changes

Failure containment rules:

- absence or unavailability never blocks writing
- consumers must degrade safely on missing data
- writing stays available first

## 30. v1 Boundary

Bounded discovery-to-planning boundary only:

- an optional Story Foundation profile
- approximately 10 to 15 short questions
- blank, unknown, undecided, and revised answers allowed
- private project-support posture
- read-only downstream consumption posture

No runtime implementation is authorized.

## 31. v2 Boundary

Later bounded extension may include:

- better downstream explanation of how a consumer used Story Setup
- bounded change-awareness or reminder behavior
- stronger freeform plus structured guidance balance

## 32. Future-Only Boundary

- mandatory onboarding
- startup lockouts
- hidden scoring
- silent intent completion by AI
- automatic canonization
- permissions, routing, or export ownership
- detailed structure, scene, chapter, or lore planning as if this were
  an outline system

## 33. Pre-Rough Alignment Questionnaire

Intake note:

- historical Wizard and Story Setup material searched in docs, app, services, and git history
- exact single canonical eleven-question artifact not found
- strongest eleven-part historical sources found in `docs/decision_checklist.md`, `app/renderer/components/WizardPanel.tsx`, and `services/src/blackskies/services/models/wizard.py`

### Fatal Questions

- None yet. The approved boundary is strong enough to prevent the old
  startup-gate failure mode during rough dossier work.

### Critical Questions

- What exact author action turns a Story Setup answer into accepted
  project truth while keeping it separate from manuscript truth and
  canon?
- What exact downstream-consumer contract allows `Workflow Spine`,
  `Companion`, `Critique`, `Continuity`, `Theme System`, and package
  construction to read this state without silently mutating it?
- What exact divergence contract should exist when current writing no
  longer matches prior Story Setup answers?
- What exact protection and approval contract should govern protected or
  excluded Story Setup answers when downstream AI-facing systems want to
  use them?

### Major Questions

- Which 10 to 15 questions belong in the first bounded set?
- How much of the recovered Wizard material should stay here versus move
  into `Outline`, `Theme System`, `Character Cards`, `Relationship Map`,
  `Lore Cards`, workflow, or project configuration?
- How should tentative, abandoned, and revised intent stay useful
  without acting like error states?

### Minor Questions

- Should the writer-facing label be `Author Intent`, `Story Setup`,
  `Story Foundation`, or another nearby name?
- What copy best communicates `blank is allowed` and `writing can start
  now` without sounding defensive?

### Answered / Superseded Questions

- Does this dossier deserve to exist separately from `Workflow Spine`?
  Answered: yes.
- Must direct writing remain available without setup? Answered: yes.
- Are participation, skipping, blank answers, unknown answers, and
  later editing valid? Answered: yes.
- Does manuscript divergence from prior Story Setup automatically mean
  error? Answered: no.
- May AI silently fill missing answers? Answered: no.
- Does Story Setup own permissions, protected-content policy, transfer,
  export, provider policy, routing, or spend? Answered: no.
- Do consumers gain mutation rights by reading Story Setup? Answered:
  no.

### Deferred Questions

- exact freeform-note shape if one remains useful
- cross-project templates or cloning behavior
- advanced change-history review
- future visualization of project-intent drift over time

## 34. Acceptance Criteria

This dossier is acceptable only if it states explicitly that:

- Story Setup is optional
- direct writing remains valid without setup
- blank, unknown, undecided, tentative, and revised answers are allowed
- Story Setup does not own manuscript truth or canon
- consumers do not gain mutation rights by reading it
- no silent AI completion is allowed
- protected answers inherit protection
- clean manuscript export excludes Story Setup by default
- active questions remain centralized in this dossier
- no runtime implementation is implied
