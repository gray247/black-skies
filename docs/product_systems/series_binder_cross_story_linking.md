# Series Binder / Cross-Story Linking

## 1. Status Header

- Dossier name: `Series Binder / Cross-Story Linking`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-22`
- Depends on: `Author Intent / Story Setup`, `Character Cards`,
  `Lore Cards`, `Narrative Insertion / Narrative Assertion`,
  `Outline`, `Binder / Project Library`, `Memory Lab`
- Feeds into: `Command Center Surface`, `Writing Surface`,
  `Companion`, `Outline`, `Memory Lab`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define a cross-project relationship, lineage, and navigation system that
organizes series context without creating a shadow canon above the
existing truth owners.

## 3. User Problem Solved

The writer needs a way to organize related projects, inspect how stories
connect, and manage shared identity, reveal, and lineage boundaries
without scattering continuity across ad hoc notes or treating series
support as a new source of truth.

## 4. What The System Does

- defines series identity and project membership,
- defines Story Chains and cross-project links,
- organizes non-owning ordering and navigation views,
- tracks shared identity shells across projects,
- supports reveal-gated cross-project context,
- supports lineage and branch comparison without owning source truth.

## 5. What The System Does Not Do

- own manuscript, character, lore, project-intent, memory, file, or
  persistence truth,
- silently canonize cross-project links,
- silently share memory, visibility, or project facts across projects,
- replace `Narrative Insertion / Narrative Assertion`,
  `Author Intent / Story Setup`, `Character Cards`, or `Lore Cards`,
- force standalone work into a series model.

## 6. User-Facing Behavior

Visible behavior should emphasize active current-series context,
explicitly typed links, and clear ownership labels for any fact or
reference shown through the series lens.

## 7. Hidden/Background Behavior

Background link suggestions may exist later, but they remain advisory,
reviewable, and non-owning.

## 8. What Appears First

- current project series membership,
- project list for the active series,
- Story Chains relevant to the current project,
- explicit reading, chronology, and publication views,
- high-value shared links already accepted by the author.

## 9. What Is Summonable

- broader series inspection,
- lineage trees and branch comparisons,
- shared entity shells,
- reveal-gated links,
- missing-project and stale-link review,
- shared-fact conflict review.

## 10. What Is Hidden Until Needed

- probable, possible, disputed, or rejected identity candidates,
- archive-heavy historical structure,
- incomplete lineage work,
- hidden continuity and reveal-gated links,
- deep comparison detail and evidence trails.

## 11. Inputs

- project identity and project metadata,
- accepted project-level intent from `Author Intent / Story Setup`,
- accepted character facts from `Character Cards`,
- accepted lore facts from `Lore Cards`,
- accepted manuscript facts and occurrences from
  `Narrative Insertion / Narrative Assertion`,
- planning structure from `Outline`,
- explicit author memory and rationale references from `Memory Lab`,
- visibility, protection, and reveal posture from the relevant owners.

## 12. Outputs

- series dashboards and ordered project views,
- Story Chain views,
- shared identity shells and project links,
- lineage and branch comparisons,
- review queues for stale, conflicting, hidden, or incomplete
  cross-project structure,
- routed references into the proper truth or support owners.

## 13. Which Other Systems Consume Those Outputs

- `Command Center Surface`
- `Writing Surface`
- `Companion`
- `Outline`
- `Memory Lab`

## 14. What Gets Stored

- series identity,
- project membership state,
- optional collection or universe membership,
- Story Chain identity and membership,
- project-to-project link identity and link type,
- ordering-view metadata,
- shared identity shell records,
- non-owning comparison state,
- visibility and reveal posture,
- lineage structure,
- last-known tombstone identity for missing projects or links,
- review state for uncertain, stale, or conflicted series structure.

## 15. What Remains Temporary

- unsaved link suggestions,
- temporary comparison views,
- draft lineage changes not yet confirmed,
- unresolved candidate shared identities,
- summonable inspection views,
- transient Companion explanation state.

## 16. Relationship To Narrative Insertion / Assertion

Series Binder may reference manuscript occurrences, project chronology
evidence, reused material lineage, and cross-project anchors from
`Narrative Insertion / Narrative Assertion`, but it does not own
manuscript truth or authoritative manuscript order.

## 17. Relationship To Story Units And Outline

Series Binder may reference project structure, planning order,
continuation plans, and branch relationships from `Outline` or
`Story Unit`, but planning truth remains with those owners and does not
become series canon by display.

## 18. Relationship To Timeline / Pacing / Pressure

Series Binder may provide reading, chronology, publication, or custom
ordering views across projects, but it does not collapse those views
into a single universal event owner or replace project-level chronology
support.

## 19. Relationship To Writing Surface And Command Center

`Writing Surface` receives lightweight current-series context and
explicit on-demand cross-story inspection. `Command Center Surface`
hosts the heavier cross-project review, comparison, lineage, and reveal
management workflows.

## 20. Internal Product Model

### 20A. Product Identity And Ownership Boundary

Series Binder / Cross-Story Linking is a cross-project relationship,
lineage, and navigation system.

It owns:

- series identity,
- project membership,
- Story Chains,
- reading, chronology, publication, and custom ordering views,
- project-to-project links,
- shared identity shells,
- visibility and reveal boundaries for series structure,
- project-lineage relationships,
- non-owning comparison and navigation state.

It does not own:

- manuscript truth,
- character truth,
- lore truth,
- project-intent truth,
- memory truth,
- file or asset identity,
- project persistence.

## 20B. Series, Membership, And Collections

Series is the primary project grouping for cross-project organization.

A project may have:

- one primary series,
- optional additional collection or universe memberships,
- zero or more cross-project references outside its primary series.

Series membership should be explicit, durable, and provenance-bearing.
Adding a project to a series does not create truth transfer, memory
sharing, or reveal widening by itself.

## 20C. Story Chains

Story Chains are optional substructures inside or across series.

A project may belong to:

- multiple Story Chains,
- one primary Story Chain where useful,
- no Story Chain even when it belongs to a series.

Story Chains may represent:

- formal sequence,
- shared setting,
- recurring adversary,
- returning characters,
- hidden continuity,
- inherited consequence,
- chronology overlap,
- alternate branch,
- thematic sequence,
- loose author-declared relationship.

Links may be directed or undirected and should carry:

- structured link type,
- optional explanation,
- visibility posture,
- provenance.

Joining a Story Chain shares no memory or truth automatically.

## 20D. Ordering And Views

Series Binder supports multiple non-owning views:

- reading order,
- chronology,
- publication order,
- lineage,
- Story Chain,
- shared entity,
- custom collection.

No view creates duplicate projects or duplicate truth.

The default experience should be a combined dashboard with the project
list and Story Chains most prominent.

## 20E. Shared Identity Shells

Series Binder may define shared identity shells for recurring:

- characters,
- adversaries,
- locations,
- organizations,
- artifacts,
- events,
- bloodlines,
- technologies,
- supernatural forces,
- other explicitly linked entity types.

A shell may exist before all project-specific records exist.

Each shell may link project records as:

- `confirmed`,
- `probable`,
- `possible`,
- `disputed`,
- `rejected`.

Multiple project records may merge under one shared identity only after
author confirmation.

A project record may link to competing candidate identities.

Removing a shared identity shell unlinks project records, but it does
not delete the underlying project records or their truth.

Series Binder does not own the accepted facts for the linked entity.

## 20F. Shared Facts, Owner Routing, And Project State

Accepted shared facts route to the proper owners:

- series creative intent -> series-level `Author Intent / Story Setup`
  where needed,
- shared character facts -> series-level `Character Cards` where needed,
- shared lore facts -> series-level `Lore Cards` where needed,
- manuscript occurrences -> project
  `Narrative Insertion / Narrative Assertion`,
- planning chronology or placement -> `Outline`,
- decision rationale -> `Memory Lab`.

Shared character and lore records remain optional rather than mandatory.

Projects may:

- reference shared facts,
- define project-specific state,
- override shared state with explicit reason and scope,
- hide shared facts from `Companion` or analyzers,
- apply valid-from and valid-until project or story points.

Project beliefs remain distinct from author-known truth.

Reimagined branches inherit only facts explicitly marked inherited or
shared.

Series Binder should provide a quiet shared-fact conflict review view.

## 20G. Visibility, Reveal, And Inspection Boundaries

Series Binder supports:

- author-only membership,
- selected-project visibility,
- chain visibility,
- reveal-gated links,
- exclusion from ordinary `Companion` use,
- manual author override.

Reveal-gate crossing requires author confirmation before visibility
changes.

Hidden links appear only in author mode with clear labels.

`Companion` may summarize hidden relationships only in author mode or
during explicit series inspection.

## 20H. Project Lineage

Series Binder owns the structural lineage view for projects.

Lineage types include:

- `original`,
- `revision`,
- `derivative`,
- `reimagining`,
- `split descendant`,
- `merged descendant`,
- `alternate version`,
- `adaptation`,
- `abandoned branch`,
- `replacement project`.

One source may have multiple descendants.

A descendant may have multiple sources with one primary source.

The original remains an independent editable project.

Descendant changes never flow upstream automatically.

Explicit shared references may stay linked. Forked content remains
independent.

Series Binder may track material relationships such as:

- `referenced`,
- `forked`,
- `replaced`,
- `omitted`,
- `new`,
- `merged`,
- `split`.

`Narrative Insertion / Narrative Assertion` lineage anchors may be
retained for reused or forked material.

Omitted material remains visible in lineage comparison.

Detailed reimagining or split workflows remain later work.

## 20I. Creation Paths

Series Binder should support creation of:

- blank series project,
- continuation,
- alternate version,
- split descendant,
- adaptation,
- merge from sources,
- unrelated project in the same universe.

The system must not copy content until the author chooses whether a
relationship is:

- shared,
- forked,
- omitted,
- replaced,
- new.

## 20J. Comparison Model

Series Binder may support non-owning comparison across:

- metadata,
- shared entities,
- chronology,
- shared facts,
- lineage,
- source versus descendant,
- descendant versus descendant,
- unused source material,
- branch conflicts.

Full manuscript diff remains later work.

## 20K. Removal, Archive, And Tombstone Behavior

When a project leaves a series, Series Binder should:

- deactivate membership,
- stop active sharing through that membership,
- preserve historical links.

When a project is missing, Series Binder should:

- retain a tombstoned last-known identity,
- show unavailable posture,
- provide repair or relink paths.

Archiving or deleting Series Binder structure affects only the series
structure, not project files or project truth.

Project deletion with descendants or dependencies requires:

- impact preview,
- explicit confirmation,
- preserved lineage tombstones.

Unlinked shared identities become archived planned or historical
identities rather than vanishing silently.

Series Binder should remain usable with unavailable projects through
clearly labeled last-known metadata.

## 20L. Memory Lab Boundary

Series Binder and `Memory Lab` remain separate systems.

Series Binder owns:

- Story Chain identity,
- series structure,
- project membership,
- shared identity shells,
- reveal and visibility boundaries for series structure.

`Memory Lab` owns:

- memory records,
- recall state,
- retention and forgetting state,
- decision and rationale memory,
- advisory memory explicitly shared into projects or Story Chains.

Series Binder may declare series, project, or Story Chain context, but
it does not silently create or share memory.

Only memories explicitly shared into a project should appear in ordinary
project recall under the separate `Series Context` posture owned by
`Memory Lab`.

## 20M. Surfaces And Review

Series Binder should provide:

- full series management in `Command Center Surface`,
- lightweight current-series context in `Writing Surface`,
- structured `What connects these stories?` inspection,
- `Companion`-assisted explanation,
- a quiet `Needs Review` view covering:
- uncertain identities,
- undecided order,
- shared-fact conflicts,
- reveal gates,
- incomplete lineage,
- stale or missing links.

It may also support custom noncanonical collections.

## 20N. Protection And Restricted Material

Series Binder must respect:

- protected and excluded material,
- author-only facts,
- project visibility overrides,
- local-only and never-send material,
- reveal gates,
- masked and approved-summary posture.

Hidden links or facts may export only through an explicitly protected
author package.

Series Binder must not leak restricted relationships through summaries,
`Companion`, search previews, lineage comparison, or AI packages.

## 20O. Failure, Degraded Mode, And Recovery

Series Binder remains useful without AI.

If AI, indexing, or cross-project inspection support is unavailable:

- current project writing remains available,
- series dashboards may show last-known structure with clear labels,
- missing projects remain tombstoned rather than silently removed,
- reveal-gated or protected material remains protected,
- destructive or merge-shaped actions remain blocked when identity is
  uncertain,
- repair suggestions remain advisory.

## 20P. Handoffs

Series Binder should support routed handoffs to:

- `Author Intent / Story Setup` for accepted series intent,
- `Character Cards` for accepted shared character facts,
- `Lore Cards` for accepted shared lore facts,
- `Narrative Insertion / Narrative Assertion` for manuscript occurrences
  and assertion evidence,
- `Outline` for structural planning or branch-planning changes,
- `Memory Lab` for decision rationale or governed memory capture,
- `Writing Surface` for current-project writing context,
- `Command Center Surface` for heavier review or comparison.

Handoffs must preserve:

- source labels,
- affected projects,
- Story Chain or series context,
- reveal and protection posture,
- return anchors where relevant.

## 21. GUI Placement Principles

Keep the current project legible first. Cross-project structure should
be powerful when summoned, but it must not turn every writing surface
into a franchise-control dashboard.

## 22. Local LLM Role

Local AI may later help suggest candidate Story Chains, shared identity
matches, or comparison summaries. Those outputs remain advisory until
reviewed and confirmed by the author.

## 23. Paid API Role

Paid or outbound AI help remains optional, routed, approval-governed,
and protection-aware.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted cross-story analysis must respect routing, privacy,
local-only, never-send, and spend rules. Series Binder must remain fully
useful for manual organization and inspection without AI.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Cross-project structure, hidden links, reveal-gated relationships,
series summaries, and identity shells must obey masking, approved
summary, and package-scope rules before any outbound use.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected material must not leak across project or series boundaries
without permission. Author-known truth, character-known beliefs,
reader-visible boundaries, and hidden continuity must remain distinct.

## 27. Testing Requirements

Prove that:

- joining a series or Story Chain does not silently transfer truth,
- joining a series or Story Chain does not silently transfer memory,
- series ordering views do not duplicate or mutate projects,
- shared identity shells do not overwrite project records,
- reveal gates and visibility boundaries are honored,
- deleted or missing projects become tombstones rather than silent
  replacement,
- descendant edits do not mutate source projects automatically.

## 28. Governance Rules And Risks

- no series-level shadow canon,
- no silent truth promotion,
- no automatic memory sharing,
- no reveal-gate bypass,
- no protected-material leakage,
- no silent upstream or downstream branch mutation.

## 29. Failure Modes

- hidden links exposed too broadly,
- shared identity shells mistaken for accepted entity truth,
- lineage views treated as truth mutation,
- missing projects silently removed instead of tombstoned,
- one project's overrides presented as another project's canon,
- series dashboards widening context beyond approved visibility.

## 30. v1 Boundary

Construction-grade series identity, membership, Story Chains,
non-owning order views, shared identity shells, lineage, reveal
boundaries, and routed comparison posture.

## 31. v2 Boundary

Richer conflict review, deeper branch comparison, more refined shared
entity support, and improved writer-facing inspection workflows.

## 32. Future-Only Boundary

Automated link suggestion, advanced manuscript-level comparison,
cross-project sync, and implementation-specific graph behavior remain
future work.

## 33. Pre-Rough Alignment Questionnaire

Intake note:

- earlier skeleton reviewed and retained only where it stayed consistent
  with current ownership doctrine,
- current authority from `Memory Lab`, `Binder / Project Library`,
  `Truth And State Ownership Matrix`, and `System Interaction Map`
  incorporated,
- stale placeholder wording about accepted cross-story facts being
  stored directly in this dossier was removed,
- active blocker count after construction: `0 Fatal`, `0 Critical`,
  `3 Major`.

### Fatal Questions

- None.

### Critical Questions

- None.

### Major Questions

- Major: exact later writer-facing language for `Series Binder` versus
  `Cross-Story Linking` may still evolve.
- Major: exact later series-level truth-owner surfaces for shared
  `Author Intent`, `Character Cards`, and `Lore Cards` still need their
  own construction when that campaign begins.
- Major: detailed later manuscript-comparison and reimagining workflows
  remain deferred.

### Minor Questions

- Minor: exact visual prominence of lineage versus Story Chain views may
  be tuned later.
- Minor: exact custom collection vocabulary may be refined later.

### Answered / Superseded Questions

- Series Binder remains non-owning for manuscript, card, memory, file,
  and project truth.
- Story Chains belong here rather than in `Memory Lab`.
- Joining a series or Story Chain shares no memory or truth
  automatically.
- Shared facts route to the proper owners rather than staying in Series
  Binder as canon.
- Cross-project visibility and reveal changes require explicit author
  control.

### Deferred Questions

- exact later UI layout,
- implementation schema,
- graph algorithms,
- manuscript diff details,
- automatic link-creation behavior.

## 34. Acceptance Criteria

This dossier is acceptable only if:

- Series Binder stays a cross-project relationship and navigation owner,
  not a truth database,
- Story Chains, ordering views, and shared identities remain non-owning,
- accepted facts route to the proper owners,
- memory sharing remains explicit and non-automatic,
- reveal and protection boundaries remain enforced,
- lineage comparison remains structural and non-mutating,
- missing projects and links become honest tombstones rather than silent
  reconstruction.
