# Control Point 1 Visual Design Foundation

## 1. Status And Decision Identity

- Status: `APPROVED CURRENT PROGRAM 3 DESIGN AUTHORITY`
- Author decision: `JASON APPROVED AS WRITTEN ON 2026-08-10`
- Prepared: `2026-08-10`
- Model: `GPT-5.6 Sol`
- Reasoning effort: `high`
- Task identity: `Current Codex task - Control Point 1, Batch D`
- Exact starting commit: `1698a44604e8fab6c47948a5128e911bf8d9916b`
- Branch: `codex/foundation-audit`
- Mutation authority: `documentation and governance only`
- Implementation authority: `DESIGN AUTHORITY GRANTED; RUNTIME MUTATION STILL REQUIRES THE PROGRAM 3 PLAN AND EXPLICIT AUTHORIZATION`
- Prohibited actions observed: no runtime, GUI, test, dependency, refactor,
  migration, cleanup, branch, worktree, staging, commit, push, merge, or
  destructive mutation

This packet executes Section 7.4 of
[post_v1_execution_control_and_handoff_plan.md](post_v1_execution_control_and_handoff_plan.md).
It converts the accepted author-experience direction, the relevant product
dossiers, Human Gate 1 learning, handwritten-note synthesis, and concept-image
review into a visual and interaction foundation that Program 3 can implement
without inventing design direction during coding.

## 2. Human Decision Requested

Jason is asked to approve or revise one coherent direction:

> Black Skies will use a true-black, page-first Writing Studio with a quiet
> literary manuscript canvas, an unboxed Living Outline, discoverable thin
> edge rails, and a minimal bottom Companion entry. Command Center will be a
> separate task-focused review canvas rather than a grid of dashboard cards.
> Single-screen use will switch the central canvas between logical surfaces;
> optional second-monitor placement will enhance the same surfaces without
> creating separate truth or separate controls.

Approval freezes the principles, hierarchy, token direction, interaction
language, and required states in this packet. It does not freeze every pixel,
choose a component library, authorize unrelated story-intelligence tools, or
prevent evidence-led refinement during Program 3.

## 3. Design Thesis

Black Skies should feel like a beautifully made writing desk in a dark room:
quiet when the writer is working, precise when a decision is required, and
capable of revealing deep instruments without leaving them scattered across
the desk.

The design is not:

- a science-fiction heads-up display;
- a wall of glowing cards, gauges, and charts;
- a generic AI chat application;
- a developer console with friendlier colors;
- a form exposing the internal data model; or
- a permanent two-monitor cockpit.

The design is:

- literary rather than theatrical;
- black rather than dark-blue;
- spacious around prose and compact around controls;
- direct rather than menu-nested;
- progressively disclosed rather than hidden without a clue;
- restrained in accent, radius, border, shadow, and motion; and
- explicit whenever advisory material, risk, cost, privacy, or mutation is
  involved.

## 4. Surface Hierarchy

### 4.1 Writing Studio

The Writing Studio is the sovereign creation surface. Its default hierarchy is:

1. manuscript text;
2. current manuscript location and save truth;
3. Living Outline context when the writer opens it;
4. direct contextual actions near the selected prose or outline item;
5. edge-rail access to less common tools; and
6. minimal Companion entry when summoned.

The manuscript must remain visually dominant even when the Living Outline is
open. No review panel, analytics summary, AI result, project setup form, or
tool list may compete with the page by default.

### 4.2 Command Center

The Command Center is the chosen deep-work surface for Review, Structure,
Story Knowledge, Create / Develop, Project Interchange, and Operations /
Approvals.

It opens one primary task canvas at a time. Supporting context may appear in a
narrow navigator, inspector, or comparison region, but the default is not a
tile grid showing every available system. Empty Command Center space is
acceptable. Density is earned by the active task.

### 4.3 Logical surfaces and physical monitors

Writing Studio and Command Center are logical surfaces, not monitor numbers.

- On one screen, switching surfaces replaces the central work canvas and
  preserves an obvious return to the prior manuscript location.
- On two screens, either logical surface may be placed on either monitor.
- Moving a surface never creates a new project, workflow, selection, note, or
  truth owner.
- The product never squeezes a serious writing session into half a screen merely
  to prove that Command Center exists.
- Optional split or comparison arrangements may be introduced later only when
  a complete workflow benefits from simultaneous visibility.

## 5. Writing Studio Spatial Foundation

The ordinary Writing Studio is composed as five quiet regions:

| Region | Resting posture | Revealed purpose |
| --- | --- | --- |
| Center | Dominant manuscript page on black | Writing, selection, direct prose context |
| Left edge | Thin visible seam or collapsed rail | Living Outline, binder, search, files, optional setup |
| Right edge | Thin visible seam or collapsed rail | Notes, quick story context, handoff to Command Center |
| Top edge | Minimal identity and state | Project/document identity, import/export, history, layout |
| Bottom edge | Quiet until invoked | Companion entry and quick capture |

The edge seam is not a miniature icon tower. A deliberate click, keyboard
focus, touch action, or optional hover preview reveals a compact labeled rail.
Hover must never be the only way to discover or operate it.

When a side region opens, it uses only the width needed for the current task.
Opening support may reduce the manuscript measure within safe reading bounds;
if that is no longer possible, the support region overlays or replaces the
canvas rather than crushing the prose.

## 6. Manuscript Canvas

### 6.1 Visual posture

- The application background and focus canvas use true black or a visually
  indistinguishable black.
- The manuscript is not displayed inside a bright white page rectangle.
- Text uses a warm off-white to reduce glare while preserving contrast.
- The writing column stays centered with a readable line length.
- Chrome does not form a decorative frame around the editor.
- Line numbers, internal IDs, field boundaries, and storage terminology stay
  hidden in the ordinary writing state.

### 6.2 Reading rhythm

Recommended starting typography:

| Role | Starting direction |
| --- | --- |
| Manuscript | `Source Serif 4` or a metrically calm bundled literary serif, with `Georgia` and system serif fallbacks |
| Interface | `Inter` or a neutral bundled humanist sans, with system sans fallbacks |
| Technical evidence | A restrained system monospace used only for exact payloads, identifiers, and diagnostics |

Recommended manuscript defaults:

- base size near `19px` at normal scaling;
- line height near `1.65`;
- measure near `68-74` characters;
- paragraph spacing large enough to breathe without resembling a web article;
- no forced first-line-indent convention in Program 3; and
- writer-adjustable manuscript type size without changing interface scale.

Exact font files, licensing, platform rendering, and final measurements must be
verified during implementation. The frozen principle is a distinct literary
reading role for prose and a neutral interface role for controls.

### 6.3 Focus mode

One direct action enters Focus mode. It hides both side supports, edge-rail
labels, Companion, secondary status, and nonessential controls. Manuscript,
cursor, selection, critical save risk, and an accessible way to leave Focus
mode remain.

Focus mode must not create a separate editor instance, change the active unit,
discard open support state, or conceal a failed or at-risk save.

## 7. Living Outline Visual And Interaction Foundation

The Living Outline is an unboxed structural margin, not a form and not a stack
of cards.

### 7.1 Default appearance

- one compact header: `Outline` and `+`;
- a plain indented text list beneath it;
- hierarchy expressed primarily through indentation, typography, and subtle
  guide marks;
- no card border around every item;
- no permanent dropdowns for type, status, or link state;
- no mandatory empty-state questionnaire; and
- no permanent toolbar of advanced structural actions.

The current manuscript context uses a narrow marker, weight change, and
accessible label—not a large glowing pill. Proposed or inferred items use a
hollow or dashed marker plus a text label such as `Suggested`; color alone is
never the distinction.

### 7.2 Direct interactions

- `+` creates one ordinary outline item using current context.
- Click selects and locates the related manuscript position.
- Click the title or use the rename command to edit it inline.
- Drag repositions planning material; keyboard movement offers an equivalent.
- Right-click or the accessible context command opens advanced options.
- Selecting manuscript text reveals the related outline item when one exists.
- Creating at a cursor links to that position by default.
- Creating around a selection proposes a span anchor.
- Creating globally with no manuscript context creates `Not placed yet`.

### 7.3 Plain-language progression

The ordinary path does not ask the writer to choose `fragment`, `gap`, or
`planning area`. It begins with an outline item and reveals specialized meaning
only when that meaning changes behavior.

Starting visible language includes:

- `Not placed yet`;
- `Belongs with: Chapter ...`;
- `Something goes here`;
- `Suggested chapter`;
- `Move in outline`;
- `Show in manuscript`; and
- `More options`.

Internal type, status, provenance, anchor, and link details remain available in
the advanced context view. They are not first-use ceremony.

### 7.4 Reorder safety

Moving author-owned planning material is immediate and reversible. Moving
accepted manuscript order from the Outline remains a proposal: current and
proposed order are previewed, affected writing is identified, and the
manuscript owner performs any accepted mutation. Visual drag feedback must not
pretend a proposal has already changed the manuscript.

## 8. Edge-Rail Interaction Language

### 8.1 Resting and revealed states

- Resting: a subtle seam or small surface mark indicates availability.
- Preview: deliberate hover may reveal the family name without opening it.
- Open: click, touch, or keyboard activation reveals a labeled compact rail.
- Active tool: the chosen tool expands directly into the adjacent work region.
- Close: the same edge control or clear close action restores the prior canvas.

The user should move from edge to tool in one reveal and one selection. A tool
must not be hidden behind repeated categories, menus, and submenus merely to
keep the screen clean.

### 8.2 Accessibility geometry

The resting visual seam may be narrow, but its interactive target must meet the
approved accessible target size when reachable. Keyboard focus makes the
control visible, names the edge family, and reveals the same actions available
to pointer users. Large-font mode turns rails into reflowing labeled controls
rather than clipping icon towers.

## 9. Companion Entry

Companion begins as one minimal text entry at the bottom edge of the active
surface.

- It is closed or reduced to a quiet summon control by default.
- Opening it reveals one line of input with a plain invitation such as `Ask
  Black Skies...`.
- Submitting a simple navigation question may return a bounded answer in place.
- A substantive review, analysis, comparison, or generated result opens the
  appropriate Command Center workspace.
- The destination shows source scope, owning system, limitations, safe actions,
  and a direct return to writing.
- Companion does not become a permanent chat transcript beside the manuscript.
- Temporary conversation is not durable project memory by default.

The bar may use a light field against black, but it must feel like a temporary
doorway rather than a dominant white footer.

## 10. Command Center Visual Foundation

### 10.1 Default composition

Command Center uses:

- a quiet surface identity and project context;
- a compact workspace switcher for the six accepted families;
- one dominant work canvas;
- optional source navigator or inspector only when the current task needs it;
- an explicit return-to-writing path; and
- contextual approvals, cost, privacy, recovery, or failure information.

It does not start with twelve equally weighted cards, circular scores, gauges,
decorative graphs, or a permanent map merely because those systems may exist
later.

### 10.2 Workspace families

| Workspace | Primary visual behavior |
| --- | --- |
| Review | Source-linked critique, findings, comparisons, and Feedback Notes |
| Structure | Living Outline expansion, import proposals, order comparison, later graphs |
| Story Knowledge | Character, lore, relationships, themes, and governed source context |
| Create / Develop | Proposed generation or rewrite work kept separate from accepted prose |
| Project Interchange | Import, export, format review, and transfer decisions |
| Operations / Approvals | Only active privacy, cost, routing, recovery, failure, or approval work |

The workspace switcher is a stable orientation aid, not forty-five dossier
icons. A workspace with no active task may remain nearly empty and offer a few
plain next actions.

### 10.3 Review result posture

Rich Critique and Companion results belong in the main Command canvas. The
source location, advisory status, provider/route disclosure when relevant,
uncertainty, and owner-routed actions remain visible. Copy, save as an advisory
note, dismiss, and return to source must not look like manuscript-acceptance
controls.

## 11. Color And Surface Tokens

The following values are a starting implementation authority, subject to
contrast and platform-rendering validation. Semantic roles are more important
than preserving an exact hex value that fails on a supported display.

| Token role | Starting value | Use |
| --- | --- | --- |
| `canvas.black` | `#000000` | Writing and Focus canvas |
| `surface.base` | `#050607` | Primary shell and Command background |
| `surface.raised` | `#0B0D10` | Open rail, inspector, modal, selected workspace region |
| `surface.hover` | `#11141A` | Quiet hover/focus support |
| `line.quiet` | `#20242B` | Dividers and region boundaries |
| `text.primary` | `#E9E6DF` | Manuscript and essential text |
| `text.secondary` | `#A8ABB2` | Supporting UI text |
| `text.muted` | `#737780` | Low-priority metadata that still meets its contrast duty |
| `accent.primary` | `#8E7CC3` | Active navigation, focus reinforcement, selected advisory context |
| `state.info` | `#7E9DBA` | Informational state, paired with text/icon |
| `state.success` | `#6F9B7C` | Confirmed safe completion, paired with text/icon |
| `state.warning` | `#C7A15A` | Caution or approval attention, paired with text/icon |
| `state.danger` | `#C77A7A` | Destructive or failed state, paired with text/icon |

Rules:

- one muted violet is the primary product accent;
- Writing and Command are distinguished by hierarchy and labels, not competing
  neon color brands;
- semantic colors are reserved for meaning, never decoration;
- no gradient border, ambient glow, starfield, glass effect, or animated aura is
  part of the default shell;
- no state is communicated by color alone; and
- pure white is reserved for very small high-emphasis needs, not large text
  fields or page backgrounds.

## 12. Spacing, Shape, And Depth

Use a `4px` base rhythm with the practical set `4, 8, 12, 16, 24, 32, 48`.

- prose receives generous surrounding space;
- controls are compact but not cramped;
- ordinary region gaps use `12-16px`;
- major canvas separation uses `24-32px` where space permits;
- outline rows use vertical rhythm without card padding;
- expanded rail controls meet accessible target size;
- ordinary corner radius stays near `4-6px`;
- large floating-card rounding is not part of the core language;
- shadows are rare and functional; boundaries rely on tone and one-pixel lines;
- elevation never implies truth authority; and
- dense Command work may tighten spacing only after the active task is clear.

## 13. Icon And Control Language

- Use one coherent, simple line-icon family.
- Icons describe recognizable actions or objects; they do not decorate empty
  space.
- Unfamiliar icons gain a label when the rail opens and a tooltip or accessible
  description when collapsed.
- Critical, destructive, approval, cost, privacy, save-risk, and advisory state
  never rely on an icon alone.
- Primary direct actions use words when ambiguity would cost more space than the
  label.
- Right-click actions have keyboard and touch-accessible equivalents.
- Ellipsis means additional actions for the current object, not an unrelated
  navigation maze.

## 14. Interaction States

| State | Required presentation |
| --- | --- |
| Rest | Quiet text and line hierarchy; no decorative glow |
| Hover | Small tone change or underline; preview only, never commitment |
| Keyboard focus | Clearly visible outline plus stable label; never color-only |
| Selected | Local marker and weight/tone change; preserve surrounding context |
| Dragging planning material | Clear origin, destination, and cancel path |
| Proposed/advisory | Explicit word label plus hollow/dashed treatment where useful |
| Saving | Quiet local status without blocking prose |
| Saved | Brief confirmation, then quiet durable-state indication |
| Unsaved | Visible but calm local state |
| Stale | Source-linked label and safe refresh/review action |
| Disabled | Visible reason and available remedy when one exists |
| Failed | Owner, affected scope, preserved work, and next safe action |
| Destructive | Plain consequence, explicit confirmation, and cancel |

## 15. Motion

Motion explains spatial change and nothing more.

- common transitions target roughly `120-180ms`;
- use opacity and short `2-6px` movement for rail and inspector transitions;
- no bounce, parallax, ambient movement, glowing pulse, or decorative graph
  animation;
- no animation may steal editor focus or delay typing;
- reduced-motion mode removes nonessential movement while preserving state
  change; and
- Focus mode contains no animated advisory interruptions except a genuine
  writing-safety risk.

## 16. Empty, Loading, Degraded, Offline, And Failure States

### Empty

Empty Writing Studio shows the page and a direct invitation to write or open a
project. It does not demand Story Unit or outline setup. Empty Command Center
states what that workspace is for and offers only relevant actions.

### Loading

Preserve the shell and location. Use calm text or restrained placeholders for
the region actually loading. Do not cover the manuscript with a global spinner
when only support is loading.

### Degraded or offline

Name the unavailable support capability and what remains safe. Direct local
writing, save, navigation, and local project access remain visually primary
when their owners are healthy. Healthy background state stays quiet.

### Failure

Show failure next to the action or owner that failed. A surface-wide banner is
reserved for a surface-wide consequence. Every failure presentation answers:

- what failed;
- what work is preserved;
- what is blocked;
- what remains available; and
- what the writer can safely do next.

## 17. Accessibility And Large-Font Foundation

- Support complete keyboard access to the page, rails, Living Outline,
  Companion, surface switch, return path, dialogs, and critical actions.
- Restore focus to the invoking object or a documented safe fallback.
- Provide a keyboard alternative to drag and drop.
- Maintain non-color labels for advisory, stale, unsaved, degraded, failed,
  destructive, and approval states.
- At large text or `200%` zoom, reflow before hiding; overlay or replace
  secondary support before shrinking prose below a useful measure.
- Preserve writing, save, cancel, recovery, warnings, approvals, and return
  paths under constrained space.
- Do not place required explanation only in hover text.
- Honor reduced motion and platform contrast needs.
- Touch and pointer targets may be visually quiet but must remain operable.

## 18. Responsive And Multi-Monitor Rules

| Available space | Required posture |
| --- | --- |
| Wide single screen | Centered manuscript plus at most one comfortably sized support region |
| Ordinary laptop | Manuscript first; opened support overlays or temporarily replaces secondary space |
| Narrow or large-font | One primary region at a time with explicit back/return path |
| Optional second monitor | One logical surface per monitor when desired; same navigation and authority model |
| Lost monitor | Writing returns to an active display first; approvals and Command material remain reachable |

Saved layout is preference, not project truth. Temporary reflow never mutates
the project or creates a second workspace owner.

## 19. Copy And Vocabulary Foundation

Writer-facing copy should:

- use verbs and consequences;
- name the owning surface only when responsibility matters;
- avoid internal object, schema, provider, route, provenance, and lifecycle
  vocabulary in the ordinary path;
- distinguish `Suggested`, `Saved note`, `Accepted`, `Unsaved`, `Stale`, and
  `Failed` without pretending they are one global status system;
- describe why a disabled action is unavailable;
- keep destructive and outbound language explicit; and
- preserve author ownership in every AI or inferred result.

Do not use generic scores such as `Story Health 78` without a proven author
decision that the score supports. Prefer specific evidence and an actionable
question.

## 20. Anti-Vibe-Coded Rules

Program 3 is visually drifting if it introduces:

- repeated equal-weight dashboard cards;
- decorative circular percentages or gauges;
- placeholder analytics that do not support an implemented decision;
- neon cyan/purple/orange surface branding;
- gradients, glow, glass, star maps, or sci-fi ornament as shell identity;
- oversized headings and empty marketing space inside the working product;
- excessive rounded containers around simple text lists;
- an icon for every dossier;
- tiny low-contrast labels used to make the interface look sophisticated;
- fake data, charts, relationship maps, emotion traces, or AI scores;
- permanent AI chat beside the manuscript;
- visual density that exists before the writer chooses a task; or
- a polished screenshot that cannot explain the workflow it depicts.

Atmosphere comes from proportion, typography, black space, restrained color,
precise motion, and calm language—not decoration.

## 21. Relationship To Earlier Design Evidence

The concept images and `docs/specs/design_system_v1.md` remain historical or
exploratory evidence. Their useful principles—quiet creation, louder chosen
intelligence, progressive disclosure, visible advisory state, and optional
multi-surface work—are retained.

Their dashboard-card density, broad bright palette, science-fiction treatment,
Story Unit gravity, and prebuilt analytics do not control Program 3. This packet
supersedes those visual tendencies for the contextual shell without deleting
or rewriting the historical source.

## 22. Program 3 Design Deliverables

After approval, Program 3 planning must produce:

1. a token and typography implementation boundary;
2. the logical-surface and edge-rail shell states;
3. the unboxed Living Outline ordinary and advanced interactions;
4. the Command Center task-canvas and workspace switcher;
5. Review projection and return-to-writing states;
6. the minimal Companion entry and routing presentation;
7. responsive, keyboard, large-font, reduced-motion, and degraded states;
8. deterministic component-state fixtures and targeted reference images; and
9. a batch plan that preserves the current V1 behavior owners.

Program 3 must not begin by building Emotion Graph, relationship maps, project
health dashboards, full import intelligence, model routing, background jobs,
or forty-five tool launchers.

## 23. Decisions Frozen By Approval

Approval freezes:

- literary-instrument visual thesis;
- true-black page-first Writing Studio;
- distinct literary manuscript and neutral interface typography roles;
- one restrained violet product accent plus reserved semantic colors;
- unboxed Living Outline ordinary state;
- direct outline interactions and advanced context disclosure;
- discoverable edge seams with labeled open rails;
- minimal bottom Companion entry;
- one-task Command Center canvas rather than default card dashboard;
- surface switching as the complete single-screen baseline;
- optional monitor placement without new authority;
- restrained geometry and motion;
- explicit advisory, safety, failure, and accessibility language; and
- the anti-vibe-coded rules.

## 24. Decisions Deliberately Not Frozen

Approval does not yet freeze:

- final bundled typeface files after rendering and license verification;
- exact pixel dimensions after implementation and large-font evidence;
- final icon library after accessibility and bundle review;
- advanced workspace customization;
- persistent optional split-screen arrangements;
- final Command workspace opened by every future dossier;
- later graph, map, timeline, analytics, import, or creation-tool design;
- animation for future story-intelligence visualizations;
- theme customization beyond the accepted black foundation; or
- public-release branding and marketing presentation.

## 25. Approval Record

Current decision: `JASON APPROVED AS WRITTEN ON 2026-08-10`

This packet is now the visual and interaction authority for Program 3. It does
not independently authorize runtime mutation, expand Program 3 beyond its
bounded implementation plan, or authorize later graph, import, provider,
background-job, memory, or high-risk capabilities.
