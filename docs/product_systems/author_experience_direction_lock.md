# Black Skies Author Experience Direction Lock

## 1. Status And Authority

Status: `ACCEPTED CURRENT PRODUCT-DIRECTION CONSTRAINT`

Author decision: `DOCUMENTED AT JASON'S REQUEST ON 2026-08-10`

This record preserves the author-experience decisions established through
the eleven handwritten-note photographs, the concept-image review, the
completed V1 foundation, the first post-V1 workflow work, and Jason's latest
hands-on review.

It exists so that a later milestone, plan, or implementation thread does not
require Jason to explain the same product again.

This record:

- supplements the forty-five dossier boundaries rather than replacing them,
- controls how those systems are composed into an understandable product,
- constrains future Writing Studio, Living Outline, Command Center,
  Companion, import, and story-intelligence planning,
- must be reconciled into the post-V1 implementation plan before additional
  GUI expansion,
- does not authorize source-code work by itself.

When a future plan or prototype conflicts with this direction, the conflict
must be shown to Jason instead of silently following the prototype, old
runtime, or a generic dashboard convention.

## 2. Decision In Plain Language

Black Skies is not a collection of forty-five tools placed on a screen.

It is a calm writing environment with two cooperating work surfaces:

1. the **Writing Studio**, where the manuscript and Living Outline operate as
   one writer-owned ecosystem, and
2. the **Command Center**, where dense review, analytics, comparisons, maps,
   proposals, and AI results can become as complex as the work requires
   without crowding the act of writing.

The manuscript remains sovereign. Support stays quiet until it is useful.
Complexity may exist, but it must appear at the place and moment where the
writer needs it.

The target is not merely functional software. The target is software a writer
can understand without first learning Black Skies' internal data model.

## 3. Current Evidence And Finding

The current post-V1 mechanical workflow passed its automated and hands-on
checks. The foundation, persistence, project isolation, failure behavior, and
bounded workflow mechanics are working.

The author-experience finding is different:

- the manuscript-unit list and Living Outline feel like separate systems,
- form fields expose internal ontology before the writer understands why it
  matters,
- `fragment`, `gap`, `planning area`, status choices, and link choices do not
  explain when or why a writer should use them,
- the Critique Workbench works mechanically but feels placed in the Writing
  Studio when its richer result experience belongs in the Command Center,
- the current implementation proves capability but does not yet prove the
  intended unified, intuitive workflow.

This is not a reason to discard the foundation. It is the learning result the
V2 workflow program was intended to produce.

## 4. Non-Negotiable Experience Principles

### 4.1 The Page Comes First

- The default background is true black or visually equivalent near-black.
- The manuscript occupies the visual center and remains the dominant object.
- The writer can open a project and write without completing setup forms.
- The Writing Studio must not read like a dashboard, database editor, or
  control panel.
- Focus mode removes support chrome in one obvious action.

### 4.2 Simple Does Not Mean Buried

- Tools stay visually quiet until needed.
- Common actions remain direct and close to the thing being acted upon.
- Advanced actions may live behind right-click or a contextual expansion.
- The product must not replace visible clutter with a maze of nested menus.
- Hover and keyboard-focus help may explain unfamiliar controls without
  permanently consuming space.

### 4.3 The Writer Sees Writing Language, Not Storage Language

- Internal types, provenance, link records, and lifecycle states must not be
  mandatory default form fields.
- The normal path uses sensible defaults and plain language.
- Advanced detail remains available for a writer who wants control.
- The interface explains the consequence of an action, not merely the enum
  name used to store it.

### 4.4 Intelligence Advises; It Does Not Take The Page

- Suggestions, detected structure, critique, signals, and inferred emotion
  remain visibly proposed or advisory until accepted.
- No automated process silently rewrites prose, changes accepted order,
  creates canon, or turns an inference into author-owned truth.
- The writer may turn signal families `Off`, use them only on request, permit
  quiet observation, or enable alerts.
- Project maturity matters: early exploration should not be punished for
  ordinary gaps, while a writer may still explicitly request an early
  stress-test of a premise.

## 5. Writing Studio Direction

The Writing Studio is the minimal creation environment. Its ordinary state
contains:

- a dominant manuscript canvas,
- a plain, lightweight Living Outline when summoned or left open,
- narrow edge controls rather than permanent tool towers,
- a minimal Companion entry bar,
- only small contextual indicators tied to the current writing.

The default outline is not a stack of boxed configuration cards.

Starting interaction:

- `+` at the outline header opens a small chooser for a Unit or a Note, with
  explicit Cancel and dismissal without creating an item,
- Units form the visible stacked story spine; Notes are quiet subordinate
  markers beneath a Unit or in an explicitly unlinked area,
- clicking a Unit locates it in the manuscript canvas without moving the rest
  of the shell,
- clicking an item title or double-clicking a Unit/Note edits its title inline,
- dragging an item changes its proposed placement,
- clicking a Note opens its lightweight title/body context rather than making
  it a peer chapter card,
- selecting writing locates and highlights its outline context,
- right-click opens advanced options for that item,
- Focus mode hides the outline and support controls immediately.

The exact visual design remains open, but this interaction direction is
fixed unless Jason changes it.

## 6. Edge-Rail And Progressive-Disclosure Model

The Writing Studio begins with thin or hidden activation areas at the edges.
Clicking or deliberately hovering an edge reveals the controls related to
that side. Opening a tool expands the relevant area without displacing the
writer into an unrelated screen.

Starting access families are:

| Edge | Ordinary purpose |
| --- | --- |
| Left | Living Outline, binder, search, project files, optional story setup |
| Right | notes, quick character or lore context, Command Center handoff |
| Top | project or document identity, import/export, history, layout |
| Bottom | minimal Companion bar and quick capture |
| Text selection | a small contextual request for review or rewrite support |

These are access families, not permanent icon requirements. Exact placement
may change through prototyping, accessibility review, and human use.

## 7. Living Outline And Manuscript: One Ecosystem

The Living Outline is not a second manuscript and not a separate setup form.
It is a structural lens over the writer's work.

The relationship is bidirectional:

- manuscript text can reveal or create outline context,
- outline items can locate manuscript spans,
- outline changes may preview a possible structural change,
- applying a change to accepted prose or order requires an explicit author
  action,
- an author may write with no outline at all,
- structure may emerge before, during, or after prose.

The ordinary writer mental model is one continuous manuscript with a Unit
spine. Notes record subordinate thoughts: they default to the selected Unit,
may be explicitly unlinked, and never gain authority to rewrite prose or
reorder accepted Units. The manuscript canvas owns long-document scrolling;
rails may be opened beside it but must remain independently usable. Repeated
instructional paragraphs are replaced by one summonable `?` help affordance.
`Compare the story plan with the manuscript` is a readable, preview-only
alignment view; it never mutates manuscript text or order.

### 7.1 Natural Creation Defaults

- Creating an item at the active manuscript cursor or active unit links it to
  that location automatically.
- Creating from selected prose proposes an anchor to that selected span.
- Creating from the global outline with no manuscript context creates an
  unplaced idea.
- The normal interface says `Belongs with: Chapter ...` or `Not placed yet`
  instead of asking the writer to understand link mechanics.

### 7.2 Advanced Options

Right-click or a comparable direct contextual action may expose:

- change or remove the relationship,
- mark a special structural kind,
- inspect provenance,
- split or merge,
- convert between planned and accepted states,
- inspect warnings or signals related to the item.

These controls are available, not mandatory ceremony.

### 7.3 Structural Vocabulary

`Fragment`, `gap`, and `planning area` remain useful internal or advanced
concepts, but the first-use experience should usually infer or default them:

- an ordinary new item begins as a simple outline item,
- an explicitly empty future position may be described as `Something goes
  here` rather than forcing the writer to choose `gap`,
- free planning material may remain unplaced without demanding a category,
- specialized labels become visible when they change behavior or help the
  writer make a decision.

Status and provenance should follow the same rule: show the distinction when
it matters, not as a tax on every new item.

## 8. Full-Manuscript Import And Structure Discovery

A writer may arrive with a complete two-hundred-page manuscript written
elsewhere. Black Skies must not require that writer to pin dozens of units by
hand before the manuscript is usable.

The intended workflow is:

1. preserve the entire source verbatim,
2. make the manuscript readable and editable immediately,
3. run deterministic, local structure detection first,
4. detect explicit headings, `Chapter N`, parts, scene separators, page or
   spacing boundaries, and other strong structural evidence,
5. optionally use bounded intelligence to propose less obvious divisions
   such as sustained point-of-view, time, or location changes,
6. display proposed chapter or unit anchors as ghost structure,
7. let the writer accept clear proposals in a batch and adjust, merge, split,
   rename, move, or reject ambiguous ones,
8. preserve `one continuous manuscript` as a valid choice.

Outline anchors should reference spans in the continuous manuscript. They
must not require duplicate prose or physical file splitting.

Manual `+` behavior remains useful after import:

- at a cursor: create a position anchor,
- around selected prose: create a span anchor,
- with no selection: create an unplaced planning idea.

The full import-review experience belongs in the Command Center. The Writing
Studio may show quiet ghost anchors and direct corrections, but it must not
become an import-configuration dashboard.

The present V1 editor has not been qualified for a single two-hundred-page
paste. This section defines intended V2/V3 behavior, not a claim that the
current build already supports it.

## 9. Command Center Direction

The Command Center is the main support, review, and viewing surface. It is
where dense information is allowed to become dense because the writer chose
to inspect it.

The Critique Workbench, full AI result presentation, import review, graphs,
comparisons, deeper history, queues, and analytics belong here. A request may
begin from selected prose in the Writing Studio, but the detailed result
opens in the Command Center while preserving a clear return to the source.

The Command Center should not become a wall of permanent dashboard cards.
Its systems should collapse into a small number of recognizable workspaces:

1. `Review`
2. `Structure`
3. `Story Knowledge`
4. `Create / Develop`
5. `Project Interchange`
6. `Operations / Approvals`

Only relevant context, active failures, approvals, cost, privacy, or
recovery needs should demand attention. Healthy background operation stays
quiet.

## 10. Companion Direction

The default Companion may be as small as a white text bar at the top or
bottom of the active surface. Bottom placement remains the starting
recommendation.

The writer types a natural request. The richer answer appears in the Command
Center's main viewing layer with:

- the source scope,
- the owning system,
- limitations or uncertainty,
- safe next actions,
- a direct return path to the writing.

The Companion is a door into Black Skies, not a new truth owner and not a
permanent chat column. Conversation memory remains temporary by default.

## 11. Dossier Placement Map

The original notes referred to forty-four dossiers. The current canonical
registry contains forty-five because `Ideation / Premise Discovery` was later
added. The dossiers are product boundaries, not forty-five icons and not
forty-five serial construction phases.

### 11.1 Writing Studio Primary Access

| ID | Dossier |
| --- | --- |
| 1 | Writing Surface |
| 3 | Workflow Spine / Author Journey |
| 4 | Binder / Project Library |
| 6 | Story Unit |
| 8 | Prose / Scene Projection |
| 10 | Outline / Living Outline |
| 19 | Project Index / Search / Retrieval |
| 29 | Accessibility / Hotkeys / Large-Font Mode |
| 34 | File Manager / Asset Pane |

These nine systems do not require nine visible buttons. Most appear through
the left and top edge families or through direct interaction with prose and
outline items.

### 11.2 Command Center Primary Access

| ID | Dossier |
| --- | --- |
| 2 | Command Center Surface |
| 5 | Visual Arrangement View |
| 9 | Draft Generation / Rewrite Loop |
| 11 | Timeline / Pacing / Pressure |
| 12 | Relationship Map |
| 13 | Emotion Graph |
| 14 | Continuity |
| 15 | Critique / Evaluation |
| 16 | Feedback Notes / Revision Resolution |
| 17 | Lore Cards |
| 18 | Character Cards |
| 20 | Series Binder / Cross-Story Linking |
| 21 | Senses Usage |
| 22 | Overused Words |
| 23 | Cliche Detection |
| 24 | Foreshadow / Payoff |
| 26 | Companion richer interaction |
| 27 | Memory Lab |
| 28 | Theme System |
| 32 | Import / Export / Google Docs |
| 41 | Plugin / Rubric System |
| 43 | Author Intent / Story Setup |
| 45 | Ideation / Premise Discovery |

These twenty-three systems collapse into the six Command Center workspace
families. They do not each earn a permanent tile.

### 11.3 Background Or Normally Unseen

| ID | Dossier |
| --- | --- |
| 7 | Narrative Insertion / Assertion |
| 25 | Explicit-Content Marker / Send-Package Censor |
| 33 | Snapshots / Backup / Restore / History capture |
| 35 | Local LLM vs Paid API Routing |
| 36 | Model Router / Provider Execution Policy |
| 37 | Budget / Token / Cost Guardrails |
| 38 | Async Job Queue / Task Runner |
| 39 | Service Health / Offline / Degraded Mode |
| 40 | Diagnostics / Error Visibility / Debug Console |
| 42 | Testing / Harness / Evidence Contract |
| 44 | Project Persistence / Local Save |

These systems should ordinarily be felt as reliability rather than seen as
tools. They become visible for consent, cost, failure, recovery, safety, or
an explicit advanced request.

### 11.4 Shared Shell And Entry

| ID | Dossier |
| --- | --- |
| 30 | Settings / Preferences / Workspace Layout |
| 31 | Splash / Startup Experience |

These two systems belong to the product shell rather than either work
surface alone.

Placement indicates the primary user home, not exclusive ownership. A small
cue, source-linked handoff, or return path may appear on the other surface.

## 12. Short-Term Direction

The near-term objective is to use the working foundation while correcting
the workflow composition revealed by hands-on use.

Before broad story-intelligence work, the revised plan should:

1. preserve the mechanically proven V1 and post-V1 boundaries,
2. treat the recent review as a V2 learning result rather than a demand for a
   repository rewrite,
3. unify the manuscript and Living Outline interaction language,
4. remove mandatory ontology choices from the ordinary outline path,
5. establish the thin-edge Writing Studio shell and direct interactions,
6. move rich Critique Workbench presentation into the Command Center while
   retaining a minimal Writing Studio request and return path,
7. define and qualify the long-manuscript import and structure-proposal
   workflow before claiming two-hundred-page usability,
8. run grouped automation and use human validation only at complete workflow
   gates.

## 13. Long-Term Direction

The long-term product is intentionally less fixed than the near-term
interaction principles.

Current direction includes:

- a coherent single-screen experience first,
- an excellent optional dual-monitor arrangement,
- the Command Center as the home for deep story intelligence,
- a maturity-aware and author-controlled signal system,
- long-manuscript intake and stable anchors before graph-driven intelligence,
- Emotion Graph as the first visual story-intelligence lens after those
  positions pass Human Gate 3,
- proposal-based creation and revision,
- richer knowledge, organization, and interchange,
- replaceable local and paid intelligence engines,
- background systems that remain quiet when healthy.

Still open for later evidence:

- the exact final visual grammar and edge behavior,
- the exact single-screen versus dual-screen defaults,
- which Command Center workspace opens first for each request,
- thresholds and confidence rules for automatic structure proposals,
- the final plain-language status vocabulary,
- which advanced systems prove valuable enough for persistent navigation,
- how much durable memory, background work, provider choice, and connector
  access the finished product truly needs.

These unknowns should be resolved by completed author workflows, not by
building every concept image or dossier at once.

## 14. Anti-Drift Rules

A future plan or implementation is drifting if it:

- turns the Writing Studio into a dashboard,
- treats the Living Outline as an unrelated database form,
- requires Story Units or outline setup before writing,
- asks every writer to classify every item as a fragment, gap, or planning
  area,
- makes link, provenance, or lifecycle enums part of the ordinary creation
  ritual,
- places rich Critique Workbench results permanently beside the manuscript,
- requires manual pinning of an imported full manuscript,
- silently accepts detected chapters, units, gaps, emotion, or truth,
- splits a continuous manuscript into physical files merely to support
  outline anchors,
- presents forty-five dossiers as forty-five icons or dashboard tiles,
- requires two monitors for an important workflow,
- reports a two-hundred-page workflow as complete before it is qualified,
- exposes healthy background machinery without a writer decision to make,
- makes AI output indistinguishable from accepted author work.

## 15. Required Plan Reconciliation

The next planning revision must compare the existing post-V1 program against
this direction and explicitly record:

- what remains correct,
- what must move between Writing Studio and Command Center,
- what wording or workflow must change,
- what new bounded work is required,
- what remains deferred,
- where the six human gates now occur,
- when Emotion Graph begins,
- which decisions remain genuinely open.

The accepted reconciliation now lives in
[post_v1_execution_control_and_handoff_plan.md](post_v1_execution_control_and_handoff_plan.md).
It schedules bounded repository control, cleanup, audit, and
professionalization checkpoints without reopening the salvage campaign.

## 16. Source Anchors

This direction is grounded in:

- the eleven handwritten-note photographs reviewed with Jason,
- the Writing Studio concept image and subsequent author corrections,
- [Black Skies Post-V1 Master Product Program](black_skies_post_v1_master_product_program.md),
- [Post-V1 Execution Control And Handoff Plan](post_v1_execution_control_and_handoff_plan.md),
- [Current Open Work Register](current_open_work_register.md),
- [Writing Surface](writing_surface.md),
- [Command Center Surface](command_center_surface.md),
- [Story Unit](story_unit.md),
- [Outline](outline.md),
- [Import / Export / Google Docs](import_export_document_interchange.md),
- [Companion](companion.md),
- [Dossier Maturity Inventory](dossier_maturity_inventory.md),
- [Current Truth Index](current_truth_index.md).

The photographs and concept images remain design evidence. This repo-tracked
record is the durable current synthesis.

## 17. Human Gate 2 Experience Finding

Human Gate 2 began only after the exact combined Program 3 and Program 4
Windows package/install qualification passed on 2026-08-11. The author found
the candidate mechanically safe but did **not** accept its ordinary Writing
Studio experience.

The accepted finding is that the candidate makes manuscript units appear to be
separate files beside a separate outline form. It also exposes redundant unit
administration, ambiguous `+` actions, persistent advanced controls,
overlapping rail geometry, an incomplete Focus state, generic blue/purple
dashboard styling, and a Companion handoff that is technically routed but not
yet understandable as a useful interaction.

The repair is governed by
[Human Gate 2 Experience Repair Plan](program_4_human_gate_2_experience_repair_plan.md).
It preserves the safety evidence, requires a continuous-manuscript and stable
anchor bridge before claiming a unified story stream, adds intentional Dark
and Light themes, and keeps full local-LLM Companion capability as a separately
authorized later boundary.

The pulled-forward Program 5 bridge has now passed its automated development
gate. It projects the current safe sections as one readable manuscript and
adds compact, no-duplicate-prose position/span anchors with exact, relocated,
ambiguous, and unresolved outcomes. This establishes the structural basis for
the repaired experience without claiming full long-manuscript intake,
automatic structure acceptance, Human Gate 3, or Human Gate 2 acceptance.
The author review also opened `P5-UX-01` for canvas-owned scrolling, stable
rails, Unit/Note hierarchy and Note bodies, transactional chooser cancellation,
reliable navigation/rename, non-overlapping shell geometry, summonable help,
and readable preview-only comparison. These remain unqualified until the
required evidence exists.
