# Ideation / Premise Discovery

## 1. Status Header

- Dossier name: `Ideation / Premise Discovery`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-23`
- Depends on: `Workflow Spine / Author Journey`,
  `Author Intent / Story Setup`, `Outline`, `Companion`,
  `Feedback Notes / Revision Resolution`, `Memory Lab`
- Feeds into: `Author Intent / Story Setup`, `Outline`, `Story Unit`,
  `Narrative Insertion / Narrative Assertion`, `Character Cards`,
  `Lore Cards`, `Feedback Notes / Revision Resolution`, `Memory Lab`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Create the canonical dossier home for ideation and premise discovery so
the capability no longer remains parked across recovery notes,
`Companion`, `Workflow Spine`, and informal legacy references.

This pass completes dossier construction for owned ideation objects,
`Idea Library`, premise testing, combination posture, lifecycle,
surface behavior, protection, recovery, and reviewed promotion
handoffs, while keeping implementation mechanics and adjacent intake
workflows deferred.

## 3. User Problem Solved

The writer needs a governed, author-owned way to capture, explore, test,
combine, and promote story possibilities without turning raw ideation
into accepted project truth by accident.

The primary workflow develops an existing fragment.
The system also supports starting from nothing, testing an existing
premise, and combining multiple ideas.

## 4. What The System Does

Ideation / Premise Discovery is a governed, author-owned system for
capturing, exploring, testing, combining, and promoting story
possibilities.

It is expected to own:

- `Idea Seeds`
- `Exploration Branches`
- `Premise Versions`
- premise-testing state
- seed relationships
- `Idea Library` state
- source-to-promotion provenance

## 5. What The System Does Not Do

It is not:

- an AI story generator
- accepted project truth
- an `Outline` owner
- an `Author Intent` owner
- a manuscript critique owner
- a generic Notes container
- an implementation-ready specification

It does not wholly own these later adjacent cross-system workflows:

- `Existing Outline Intake and Reconstruction`
- `Manuscript Intake, Reconstruction, and Developmental Review`
- `Project Reimagining, Splitting, and Lineage`

## 6. User-Facing Behavior

Visible behavior is expected to center on author-controlled idea
capture, exploratory branching, premise testing, deliberate promotion
preparation, project-independent library use, and quiet cross-surface
continuity.

This pass defines product-level behavior without fixing final UI
mechanics.

## 7. Hidden/Background Behavior

Background assistance may later help compare, expand, combine, or test
ideas, but it must remain governed, optional, and non-authoritative.
Quiet capture is allowed.
No automatic AI generation is allowed.

## 8. What Appears First

The first-class discovery posture is fragment-centered ideation:

- develop an existing fragment
- preserve the originating seed
- explore multiple branches without collapsing them

## 9. What Is Summonable

Later summonable behavior may include:

- starting from nothing
- premise testing
- idea combination
- library recall
- promotion packaging
- side-by-side branch comparison
- source-provenance navigation
- project-outcome navigation

Those workflows are constructed only at product-model level in this
pass.

## 10. What Is Hidden Until Needed

Heavy comparison, AI assistance, cross-system promotion detail, and
adjacent reconstruction workflows remain latent until later construction
passes.

## 11. Inputs

Ideation may consume:

- direct author fragments
- author-entered concepts or constraints
- optional supporting notes or memory references
- optional `Companion` or model suggestions
- imported material only after interchange-owned staging yields explicit
  Ideation acceptance
- optional project context where the author explicitly chooses it

Input does not become accepted project truth automatically.

## 12. Outputs

This system outputs exploratory material such as:

- `Idea Seeds`
- `Exploration Branches`
- `Premise Versions`
- `Exploration Findings`
- `Promotion Packages`
- `Idea Library` references and collections
- bounded premise-test history
- combination lineage and source-contribution records

Those outputs remain ideation-owned until an explicit downstream
promotion path is chosen.

## 13. Which Other Systems Consume Those Outputs

Accepted downstream material remains owned by destination systems such
as:

- `Author Intent / Story Setup`
- `Outline`
- `Story Unit`
- `Narrative Insertion / Narrative Assertion`
- `Character Cards`
- `Lore Cards`
- `Feedback Notes / Revision Resolution`
- `Memory Lab`

This pass does not fully construct those handoffs.

## 14. What Gets Stored

At object-model level, the system stores:

- `Idea Seeds`
- `Exploration Branches`
- `Premise Versions`
- `Exploration Findings`
- premise-testing state
- seed relationships
- `Promotion Packages`
- `Idea Library` state
- source-to-promotion provenance

## 14A. Idea Seed Model

`Idea Seed` is the preserved starting fragment.
It may be only:

- a title
- image reference
- character
- creature
- location
- ending
- line
- question
- mood
- partial premise

An `Idea Seed` owns:

- original capture
- editable current version
- version history
- provenance and source uncertainty
- optional metadata
- protection posture
- project references
- resulting branches
- resulting promotions

A seed may exist without any project.
Editing a seed updates the current seed version only.
It must not silently rewrite dependent branches, premise versions,
findings, or promoted downstream material.

## 14B. Exploration Branch Model

`Exploration Branch` is one development path from one or more seeds.
It may hold:

- premise versions
- conflict possibilities
- protagonist possibilities
- opposition
- stakes
- setting
- tone
- genre posture
- endings
- themes
- unknowns
- risks
- rejected directions
- source contributions

Branch posture is explicit:

- `draft`
- `active`
- `preferred`
- `paused`
- `stale`
- `merged`
- `promoted`
- `rejected`
- `archived`

Multiple branches may remain valid at once.
Multiple branches may later become separate projects or alternate
versions.
Branch copy, merge, and promotion must stay explicit.
No branch may be silently overwritten because another branch changed.

## 14C. Premise Version Model

`Premise Version` is a premise statement that belongs to one
`Exploration Branch`.
It supports:

- one current version inside the branch
- preserved prior versions
- intentionally unresolved areas
- bounded test history
- optional comparison to prior versions in the same branch

Changing the current premise version does not delete prior versions.
Unresolved areas remain visible rather than being silently completed by
AI or inference.

## 14D. Exploration Finding Model

`Exploration Finding` is advisory evidence produced by premise testing,
comparison, similarity review, or structural pressure testing.

An `Exploration Finding` may retain:

- finding identity
- source branch or premise reference
- evidence summary
- uncertainty
- provenance
- optional author response

It never becomes:

- a `Note`
- a `Signal`
- accepted truth
- a project task

Those conversions require separate explicit routing later and are not
constructed in this pass.

## 14E. Promotion Package Base Contract

`Promotion Package` exists here only as a base contract.
It must be:

- explicit
- selective
- provenance-bearing
- reviewable
- non-owning until destination acceptance

Promotion package detail, owner-routing detail, and acceptance workflows
belong to Pass 3.

## 14F. Idea Library Model

`Idea Library` is a dedicated global library owned by Ideation.
It supports:

- project-independent seeds
- project references without duplicate ownership
- minimal capture and later classification
- manual collections
- saved-filter collections
- typed advisory seed links
- archive search
- optional author-controlled reminders
- duplicate suggestions without automatic merge
- clear object and state labels
- navigation from promoted projects to source branch and seed
- explicit extraction of unused project material back into Ideation with
  provenance

Promotion does not remove a seed from the library.
A project may reference a seed without moving or duplicating seed
ownership.
Duplicate suggestions remain advisory until the author explicitly merges
or keeps items separate.

## 14G. Premise-Testing Model

Premise testing is optional advisory pressure testing.
It is not a story-quality verdict.

Testing uses a fixed core plus adaptive questions based on:

- seed type
- story form
- genre posture
- branch state
- available `Author Intent / Story Setup`
- author-selected purpose

Premise testing may consider accepted `Author Intent / Story Setup`
when that context exists and the author wants it used.
It must not treat missing intent as failure.

Testing may compare:

- the current premise version against its own unresolved areas
- one premise version against earlier versions in the same branch
- one branch against another branch only when the author requests or
  summons comparison

Earlier tests remain in bounded history.
Findings remain advisory until the author explicitly converts them
through another owning system.

## 14H. Test Dimensions And Ratings

Possible testing dimensions include:

- premise clarity
- focal character or force
- objective or desire
- opposition
- conflict potential
- stakes and failure consequence
- escalation capacity
- emotional leverage
- transformation potential
- ending support
- setting dependence
- thematic tension
- intended-effect fit
- scope
- overload
- contradictions
- uncertainty
- similarity, familiarity, or cliche risk

The testing model does not produce one overall story-quality score.
Optional dimension ratings may exist only when they are evidence-based,
bounded, and clearly advisory.
Unanswered dimensions remain visible rather than being flattened into
false completeness.
Overloaded premises create advisory pressure points, not forced
simplification.
Fixes, rewrites, or alternate approaches appear only after review or
explicit request.

## 14I. Unresolved And Intentional-Ambiguity Posture

Unresolved areas may remain visible within a `Premise Version`,
`Exploration Branch`, or test result.

The author may explicitly mark ambiguity as intentional.
Intentional ambiguity is not treated as an error.
Unresolved areas may carry optional revisit conditions such as:

- after another branch comparison
- after later worldbuilding
- after character clarification
- after author-intent refinement
- after project selection

Testing must distinguish:

- unresolved because not yet decided
- unresolved by deliberate choice
- unresolved because evidence conflicts
- unresolved because the branch is still exploratory

Those conditions remain advisory and review-oriented rather than
blocking.

## 14J. Idea-Combination Model

Combination creates a new `Exploration Branch` linked to two or more
source seeds.

It supports:

- manual combination
- guided relationship questions
- AI suggestions only when explicitly requested
- multiple alternative combined branches
- reuse of one seed across several combinations
- optional seed-importance posture

Seed-importance posture may include:

- `anchor`
- `essential`
- `desirable`
- `optional`
- `experimental`

Combination does not require every selected seed to survive unchanged in
the result.
It must preserve source-contribution provenance.

## 14K. Source-Contribution Model

Each source contribution inside a combined branch may be classified as:

- `central`
- `supporting`
- `transformed`
- `background`
- `thematic`
- `reserved`
- `rejected`
- `unresolved`

This classification explains how the combined branch uses each source.
It does not rewrite the underlying source seed.

Unused seeds may remain linked as `reserved` or `rejected` source
material where the author chooses.
One seed may contribute to several combined branches without losing
ownership or original lineage.

## 14L. Incompatible-Assumption Behavior

Combination must expose incompatible assumptions as visible tensions.
Examples include:

- competing sole protagonists
- incompatible settings or chronology
- conflicting world rules
- incompatible endings
- conflicting tones
- several stories competing for ownership

These tensions are surfaced for review.
They do not automatically reject the combination.

Optional requested relationship suggestions may include:

- cause and consequence
- shared antagonist
- concealed relationship
- parallel storylines
- setup and payoff
- past and present
- false explanation and true explanation
- separate projects within a `Story Chain`

Suggestions remain advisory.
They do not silently establish series structure, project lineage, or
accepted truth.

## 15. What Remains Temporary

Temporary or non-durable state may later include:

- unsaved exploration
- bounded comparison views
- temporary prompt results
- temporary branch experiments
- temporary classification before a seed enters the library
- temporary test prompts before review
- temporary combination suggestions before branch creation
- non-retained AI assistance

## 15A. Source Change And Stale-State Behavior

Editing a seed creates or updates its current seed version.
Original capture remains preserved.

When a source seed changes:

- dependent branches become `stale`
- dependent premise versions may become `stale`
- dependent combined branches may become `stale`
- prior findings remain preserved as historical advisory state

The author chooses whether to:

- review
- update
- fork
- leave unchanged

No dependent branch, combination, finding, or promoted downstream
material updates automatically.

## 15B. Branch Progression And Promotion History

Branch progression supports:

- `draft`
- `active`
- `preferred`
- `paused`
- `stale`
- `merged`
- `promoted`
- `rejected`
- `archived`

More than one branch may be promoted.
Promotion does not erase branch history.

After promotion, the branch remains as promoted history.
Later exploration creates a new version, fork, or descendant branch
rather than rewriting promotion history.

Project changes never flow back automatically.
Returning project material to Ideation requires explicit capture with
provenance.

## 15C. Disposition And Reactivation

Rejected branches and findings may retain:

- disposition
- optional rationale
- source relationship
- later reactivation eligibility

Archived objects remain searchable through archive views and may be
restored.
Dismissal, rejection, and archive posture remain distinct.

## 15D. Archive, Deletion, And Purge

Ideation keeps distinct:

- archive
- recoverable deletion
- permanent purge

Archive preserves the object in searchable history.
Recoverable deletion removes it from ordinary active use while allowing
restoration.
Permanent purge is a stronger removal action and requires impact
awareness where descendants, combinations, promotions, or project links
exist.
That impact review should preview at least:

- affected branches
- affected combinations
- affected promotions
- affected project links
- affected provenance chains

When a purged source has surviving descendants, combinations, or other
dependent objects, Ideation preserves a provenance tombstone rather than
deleting those descendants silently.
No lifecycle action in Ideation silently deletes or mutates
destination-owned project objects.

## 15E. Bounded History

Ideation uses bounded history rather than unlimited retention.
It preserves:

- original capture
- important seed and premise versions
- merges
- promotions
- dispositions
- author-pinned history
- source contribution
- lineage-relevant changes

It may trim low-value temporary exploration and unpinned request
history.
This pass does not define exact retention numbers.

## 15F. Similarity And Originality Posture

Ideation may provide advisory identification of:

- similar seeds
- repeated concepts
- familiar patterns
- cliche risk
- overlap with another branch or project

It does not:

- create a definitive originality score
- claim legal originality or plagiarism determination
- merge duplicates automatically
- require external databases
- treat similarity as failure

Similarity remains advisory support for review, not a verdict.
Detailed similarity algorithms remain deferred.

## 16. Relationship To Narrative Insertion / Assertion

Ideation may eventually feed promoted material into
`Narrative Insertion / Narrative Assertion`, but it does not own
manuscript truth or manuscript foundation authority.

Mandatory check:

- projection containers, ideation summaries, and exploratory branches do
  not replace `Narrative Insertion / Narrative Assertion` as
  foundation authority

## 17. Relationship To Story Units

`Story Unit` is a possible downstream destination only.
Ideation does not make `Story Unit` a mandatory gate.

Mandatory check:

- `Story Unit` remains optional unless a separately approved dossier
  says otherwise

## 18. Relationship To Prose / Scene Projection

Ideation may later interact with projection-oriented story planning, but
this pass does not define that workflow.

Mandatory check:

- ideation does not convert projection layers into truth owners

## 19. Relationship To Writing Surface

Ideation may support writing, but direct writing remains valid without
passing through ideation first.

Mandatory check:

- direct writing remains valid and non-gated

## 20. Relationship To Command Center Surface

Heavier ideation review or comparison may later live in
`Command Center Surface`, but this pass does not define that surface
workflow.

Mandatory check:

- `Command Center Surface` must not gate writing by default

## 20A. Relationship To Memory Lab

`Memory Lab` may own rationale, decisions, or approved memory
references about ideation work, but it does not own seeds, branches,
premise versions, findings, promotion packages, or `Idea Library`
state.

Memory saved from Ideation remains a governed memory record.
The underlying ideation object remains ideation-owned unless explicit
downstream routing and acceptance move material elsewhere.

Memory Lab may retain rationale after explicit transfer.
It does not inherit seed relationships or branch lineage by default.

## 20B. Relationship To Binder / Project Library

`Binder / Project Library` may display references, placements, or
navigation entry points for Ideation objects, but it does not own them.

Binder placement does not move seed ownership into a project.
Removing a Binder reference does not delete an ideation object.

## 20C. Relationship To Project Index / Search / Retrieval

`Project Index / Search / Retrieval` may index permitted Ideation
material according to protection and indexing rules, but it does not own
that material.

Search results are references to ideation-owned objects.
Search does not turn seeds into memory, truth, notes, or tasks.

## 20D. Relationship To Import / Export Document Interchange

`Import Export Document Interchange` owns source staging, source
identity linkage, and transfer provenance while imported material is
still in interchange review.

Accepted Idea Seeds belong to Ideation only after explicit Ideation
acceptance.
Import staging must not silently become seed ownership.

## 20E. Relationship To Downstream Owners

`Author Intent / Story Setup`, `Outline`, `Story Unit`,
`Narrative Insertion / Narrative Assertion`, `Character Cards`,
`Lore Cards`, `Feedback Notes / Revision Resolution`, and `Memory Lab`
own material only after explicit routing and acceptance.

Ideation remains the owner of its objects until that handoff occurs.

`Feedback Notes / Revision Resolution` and `Signal Architecture` own
durable concerns only after explicit conversion.
Premise-testing findings do not become notes or signals automatically.

`Series Binder / Cross-Story Linking` owns project-level relationships,
`Story Chains`, visibility boundaries, and lineage between projects.
It does not own seed relationships or combination lineage inside
Ideation.

## 20F. Surface Model

Ideation uses both primary surfaces without becoming a third mandatory
entry gate.

`Command Center Surface` is the home for the full Ideation workspace,
including:

- tree views
- list views
- branch-comparison views
- source-provenance inspection
- project-outcome navigation
- promoted-history review
- `Needs Review`
- archive and recovery views
- distraction-free single-seed or single-branch review modes

`Writing Surface` may expose lightweight Ideation access for:

- `Quick Capture`
- current-seed access
- contextual return to the active ideation item

Quick Capture is available from both primary surfaces.
Full ideation review does not gate direct writing.

## 20G. Quick Capture And Return Posture

Quick Capture requires only the fragment.
It does not require:

- a questionnaire
- immediate classification
- immediate AI use
- immediate premise testing

Explicit `Explore` begins development from a captured seed.
Capture alone preserves the fragment and leaves it quiet until the
author chooses deeper work.

Return posture should preserve when possible:

- active seed
- active branch
- current question
- scroll position
- current view
- selected context

Restored location is navigation continuity only.
It is not proof of local save integrity, completed persistence, or
recovery verification.

## 20H. Views, Filters, And Daily Review Posture

Ideation should support:

- tree views
- list views
- branch-comparison views
- side-by-side branch comparison
- author, AI, and mixed provenance filters
- accepted, rejected, and unresolved state filters
- a separate `Questions / Unknowns` view
- quiet stale labels
- quiet `Needs Review`
- non-interruptive optional premise testing
- evidence-based readiness summaries without percentage scores
- project-outcome and source-provenance navigation
- promoted history separated from active exploration
- distraction-free single-seed or single-branch mode

Readiness summaries are evidence-based and bounded.
They do not collapse into one overall percentage or verdict.

## 20I. Non-AI And Companion Boundaries

Ideation must remain fully useful without AI through:

- manual capture
- worksheets
- guided question sets
- branching
- comparison
- premise testing
- manual promotion review

When AI is unavailable, the system should explain that limitation
honestly while preserving all non-AI workflows.

`Companion` may quietly suggest optional next actions or stale reviews.
It may not automatically:

- generate accepted material
- rewrite current branches
- remember ideation content durably
- promote branches
- convert findings into notes, signals, or truth

Conversational ideation becomes durable only through:

- explicit save
- approved summary
- governed `Memory Lab` transfer

## 20J. AI Package And Provenance Model

AI receives only author-selected seeds, branches, and approved context.
It does not inspect the whole `Idea Library` by default.

External requests require a visible preview showing:

- selected source material
- branch and premise versions
- relevant `Author Intent / Story Setup` or project context
- exclusions and masks
- approved summaries
- request purpose
- route and estimated spend

AI may:

- create suggestion candidates
- propose alternate premise versions
- suggest relationship patterns
- suggest promotion readiness with evidence

AI may not:

- create accepted seeds directly
- overwrite current premise versions
- promote branches
- convert findings into durable work
- inspect the entire `Idea Library` by default

Archived or rejected material enters a request only through explicit
inclusion.
Cross-project combination requires explicit source and scope selection.

Bounded request history may be preserved.
Pinned or promoted results should remain preserved inside that bounded
history.
Permanent author-versus-AI contribution provenance must remain intact.

## 20K. Promotion Package Workflow

Promotion begins with a reviewed `Promotion Package`, not immediate
project creation.

Promotion should allow:

- partial promotion
- later promotion from the same branch
- separate packages creating multiple projects or alternate versions
- projects with unresolved premise state
- explicit reference posture
- explicit independent-copy posture
- explicit mixed posture

Promotion may transfer only the selected unknowns and selected rejected
alternatives the author includes.
Unselected unknowns and rejected alternatives remain in Ideation unless
explicitly routed elsewhere.

Selected material may be classified for possible destinations such as:

- `Author Intent / Story Setup`
- `Outline`
- `Story Unit`
- `Character Card` candidate
- `Lore Card` candidate
- `Relationship` candidate
- `Timeline` candidate
- `Theme` candidate
- `Note`
- `Memory Lab` rationale
- source-linked reference
- archived alternative

Destination suggestions remain advisory.
Where material touches several systems, promotion should assign one
primary owner plus explicit secondary references.

Before execution, promotion preview should show consequences such as:

- candidates created
- references added
- protected exclusions
- unresolved items included
- rejected alternatives included or excluded
- the fact that no manuscript truth is created automatically

Promotion creates candidates or references unless the destination owner
explicitly accepts truth through its own mutation path.

## 20L. Routing And Owner Handoffs

Promotion and conversion handoffs must preserve:

- requested action
- source seed or branch identity
- selected premise version
- selected findings or unknowns
- source-to-promotion provenance
- protection posture
- route state when relevant
- requested attention consequence when relevant
- return-to-prior-location anchor where available

Possible owner handoffs include:

- accepted creative intent -> `Author Intent / Story Setup`
- accepted planning -> `Outline` or `Story Unit`
- accepted manuscript truth -> `Narrative Insertion / Narrative Assertion`
- accepted character facts -> `Character Cards`
- accepted lore facts -> `Lore Cards`
- durable note concerns -> `Feedback Notes / Revision Resolution`
- durable signal concerns -> `Signal Architecture`
- transferred rationale or approved memory -> `Memory Lab`

Import staging remains owned by `Import Export Document Interchange`
until explicit Ideation acceptance.
Search may index ideation material but does not own it.

## 20O. Final Ownership Boundaries

Final boundary posture for this dossier:

- Ideation owns seeds, branches, premise versions, testing,
  combinations, `Idea Library` state, and source-to-promotion
  provenance.
- `Author Intent / Story Setup` owns accepted creative intent.
- `Outline` and `Story Unit` own accepted planning.
- `Narrative Insertion / Narrative Assertion` owns accepted manuscript
  truth.
- `Character Cards` and `Lore Cards` own accepted structured facts in
  their domains.
- `Feedback Notes / Revision Resolution` and `Signal Architecture` own
  explicitly converted durable concerns.
- `Memory Lab` owns transferred rationale and durable memory.
- `Series Binder / Cross-Story Linking` owns project-level series and
  `Story Chain` relationships.
- `Import Export Document Interchange` owns incoming source staging, not
  accepted Ideation objects.
- `Project Index / Search / Retrieval` indexes ideation material but
  does not own it.

## 20M. Partial Failure, Retry, And Repeat-Safe Behavior

Promotion must be repeat-safe.
A retry must not silently duplicate prior successful results.

If promotion partly fails:

- preserve successful results
- identify failed destinations
- allow retry or reconciliation
- do not pretend full success

If an owner blocks, downgrades, or refuses an action, Ideation must
render that outcome honestly rather than simulating success.

## 20N. Project Divergence And Capture-Back

Detaching Ideation provenance does not delete destination-owned objects.
Project changes do not sync back automatically.

Optional divergence comparison may exist, but it remains non-owning.
Explicit capture back from project material may create:

- a new seed
- a fork
- a sequel direction
- an adaptation direction
- a descendant branch

That capture-back must preserve provenance.
Combined branches may later split into separate project candidates while
preserving lineage, but detailed project splitting remains deferred.

## 21. GUI Placement Principles

Placement doctrine only:

- full Ideation workspace in `Command Center Surface`
- lightweight `Quick Capture` and current-seed access in
  `Writing Surface`
- `Quick Capture` available from both primary surfaces
- heavier review, promotion, archive, recovery, and comparison work in
  `Command Center Surface`
- distraction-free single-seed or single-branch modes where useful

Mandatory check:

- do not turn startup or `Command Center Surface` into a dashboard junk
  drawer

## 22. Local LLM Role

Local model assistance may later help expand, combine, or test ideas.
Local-only or never-send material may be used by a model only when the
route is genuinely local and policy-compliant.
The system must remain useful without any model support.

## 23. Paid API Role

Paid-model assistance may later support heavier exploration or premise
testing, but it remains optional, previewed, and governed.

## 24. Model Routing Notes And Cost / Budget Impact

Any future AI participation must respect routing, privacy, budget,
fallback, approval rules, and permanent provenance of author versus AI
contribution.
This dossier does not define routing implementation mechanics.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Any AI-facing ideation package must respect:

- masking
- approval
- local-only and never-send boundaries
- approved summaries
- AI exclusion zones
- package preview boundaries

Never-send raw material must not appear in external package previews.
Only a permitted approved summary or explicit exclusion notice may
appear there.
A mixed branch may produce a scoped package that omits restricted
material and visibly explains the omission.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Seeds, branches, premise tests, and idea-library material must honor:

- protected and excluded material
- project and workspace visibility
- local-only
- never-send
- masks and approved summaries
- author-only material

Titles and metadata must be masked when they reveal protected content.
Protected content must not leak through:

- search results
- `Companion` summaries
- comparisons
- readiness summaries
- exports
- provenance previews

## 27. Testing Requirements

This dossier admission should be considered valid only if later
construction preserves that:

- ideation output does not auto-become accepted truth
- the system remains useful without AI
- downstream promotion remains explicit
- project references do not duplicate seed ownership
- branch edits do not silently rewrite other branches
- premise testing remains advisory rather than a quality verdict
- combination lineage remains provenance-bearing
- AI use remains selected, previewed, and provenance-bearing
- recovery and degraded behavior do not block manual capture
- adjacent intake or reimagining workflows remain deferred rather than
  silently absorbed here

## 28. Governance Rules And Risks

Governance rules:

- ideation is author-owned, not model-owned
- ideation does not become accepted project truth automatically
- ideation does not become a hidden `Author Intent`, `Outline`, or
  manuscript owner
- ideation is not a generic notes bucket
- idea exploration must remain distinguishable from accepted story
  direction
- `Idea Library` owns global ideation storage rather than `Memory Lab`,
  `Binder`, or search
- premise testing remains advisory and dimension-based rather than a
  single verdict
- idea combination creates explicit descendant branches rather than
  silent merges
- `Companion` suggests and routes, but does not silently create,
  remember, promote, or convert
- reviewed `Promotion Packages` create candidates or references until
  the destination owner accepts truth
- branch copy, merge, and promotion remain explicit
- author versus AI contribution provenance remains durable

Risks:

- `Companion` or model output being mistaken for accepted premise truth
- exploratory branches being treated as settled intent
- idea storage drifting into generic notes, memory, or outline state
- project references being mistaken for transferred ownership
- duplicate suggestions being mistaken for automatic merge
- similarity review being mistaken for originality judgment
- stale combinations being mistaken for current source-aligned branches
- restored location being mistaken for save confirmation
- partial promotion being mistaken for full success
- adjacent reconstruction workflows being silently absorbed here

## 29. Failure Modes

If ideation support is unavailable, authors must still be able to write,
brainstorm manually, or use other non-owning systems without losing
truth boundaries.

If library search, reminders, suggestions, or AI assistance fail,
existing seeds and branches must remain usable as authored ideation
objects.

If premise testing or combination review is unavailable, authors must
still be able to preserve seeds, edit branches, and continue
exploration manually.

Missing source files should preserve last-known seed metadata.
Deleted linked projects should leave project tombstones and lineage.
Stale branches remain usable with clear labels.
Partial history loss should preserve the latest usable state and expose
missing history honestly.

AI, indexing, search, or duplicate-check failure must never block
capture or manual exploration.

Recovery views may later expose:

- deleted records
- broken records
- missing-source records
- stale records
- partially failed records

Prior versions may be restored as current.
Archive, recoverable trash, and permanent purge remain distinct.
Exports include archived or rejected material only when explicitly
selected.

## 30. v1 Boundary

This admission pass does not authorize implementation.
The current constructed boundary is:

- `Idea Seed`
- `Exploration Branch`
- `Premise Version`
- `Exploration Finding`
- `Idea Library`
- advisory premise testing
- advisory combination lineage
- bounded lifecycle posture
- primary-surface ideation access
- reviewed promotion packages
- protection and recovery posture

## 31. v2 Boundary

Later extensions may add dossier-completion detail such as refined
surface wording, richer review presentation, and tighter cross-dossier
validation once the core model is constructed.

## 32. Future-Only Boundary

The following remain future or deferred:

- final UI
- final prompt sequencing
- schemas
- runtime mechanics
- routing implementation
- similarity algorithms
- AI images
- voice capture
- automatic project splitting
- `Existing Outline Intake and Reconstruction`
- `Manuscript Intake, Reconstruction, and Developmental Review`
- `Project Reimagining, Splitting, and Lineage`
- implementation tasks

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None for canonical admission.

### Critical Questions

- None for canonical admission.

### Major Questions

- Major: exact later boundary between ideation core and deferred intake
  or reimagining workflows should remain explicit.
- Major: exact later dossier-completion presentation for surface
  wording, archive views, and readiness summaries should remain
  explicit.

### Minor Questions

- Minor: final writer-facing naming between `Ideation` and
  `Premise Discovery` may still be tuned later.

### Answered / Superseded Questions

- Full author discovery has been completed for fragment-centered
  ideation.
- Full author discovery has been completed for `Idea Seed`
  preservation and versioning.
- Full author discovery has been completed for multiple exploration
  branches.
- Full author discovery has been completed for premise testing.
- Full author discovery has been completed for idea combination.
- Full author discovery has been completed for a global `Idea Library`.
- Full author discovery has been completed for project-independent use.
- Full author discovery has been completed for explicit AI assistance.
- Full author discovery has been completed for local or non-AI use.
- Full author discovery has been completed for promotion packages.
- Full author discovery has been completed for protection and recovery.
- Full author discovery has been completed for lifecycle and deletion.
- Full author discovery has been completed for cross-system boundaries.
- Detailed construction is intentionally split across later Pass 1 and
  Pass 2.

### Deferred Questions

- final workflow sequencing detail
- adjacent intake workflows
- adjacent reimagining workflow construction
- final UI
- schemas
- runtime behavior

## 34. Acceptance Criteria

This dossier is acceptable only if it states explicitly that:

- ideation does not replace narrative foundation authority
- `Story Unit` is not treated as a mandatory gate by default
- inferred, derived, or `Companion` output does not become authored
  truth without author action
- `Idea Seed` ownership remains distinct from project reference,
  Binder placement, search indexing, and Memory Lab retention
- branch edits do not silently overwrite other branches
- premise testing does not collapse into a single story-quality score
- combination does not silently merge or reject seeds
- reviewed promotion does not create manuscript truth automatically
- protected content does not leak through package previews, summaries,
  or comparisons
- restored location does not imply save integrity proof
- the system does not present fake certainty
- the system does not introduce story grading by default
- the system does not create dashboard clutter as default behavior
- the system does not claim hidden runtime authority
- active questions live in the dossier
- active questions live only in the centralized
  `Pre-Rough Alignment Questionnaire`
- Fatal and Critical questions are not buried in a generic list
- the dossier remains a living investigation file rather than a locked
  milestone claim
