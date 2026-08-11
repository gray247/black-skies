# Program 4 Minimal Companion And Owner Routing Implementation Plan

## 1. Status And Authority

- Status: `APPROVED; P4-A IMPLEMENTATION AND AUTOMATION GREEN; AWAITING JASON'S GIT CHECKPOINT`
- Prepared: `2026-08-11`
- Planning and implementation model: `GPT-5.6 Terra`
- Planning and implementation reasoning effort: `high`
- Exact planning baseline: `294274e8e4a31398d064b23b0adf57cac62f3479`
- Branch: `codex/foundation-audit`
- Git authority: `Jason alone stages, commits, and pushes`
- Intended human boundary: `Human Gate 2 only after the complete Program 3 plus Program 4 candidate is qualified`

This is the bounded implementation handoff from Program 3 to Program 4. It
implements one useful Companion doorway while preserving the Companion dossier's
non-ownership rules. It is constrained by:

- [Current Truth Index](current_truth_index.md);
- [Author Experience Direction Lock](author_experience_direction_lock.md);
- [Control Point 1 Visual Design Foundation](control_point_1_visual_design_foundation.md);
- [Post-V1 Master Product Program](black_skies_post_v1_master_product_program.md);
- [Post-V1 Execution Control And Handoff Plan](post_v1_execution_control_and_handoff_plan.md);
- [Workflow Proof WP-05](workflow_proof_WP-05_companion_reentry_nonownership.md); and
- [Current Open Work Register](current_open_work_register.md).

Jason approved this exact bounded plan and authorized its implementation on
2026-08-11. Approval does not authorize a generic chat system, a second AI
provider, durable AI memory, automatic routing, or any owner mutation.

## 2. Outcome

Program 4 adds a quiet, summonable Companion entry at the bottom of Writing
Studio. In this first slice, an author may ask one of these equivalent natural
questions:

- `Where am I?`
- `Where was I?`
- `What am I working on?`

Black Skies answers from existing local session and Living Outline facts only.
The answer opens in the existing Command Center task canvas, identifies what
was read and who owns it, states its limits, and offers only `Return to Writing`
and `Dismiss`.

This proves the important product path:

```text
author asks in Writing Studio
  -> Companion exposes its exact local scope
  -> existing owners supply only their current facts
  -> Command Center shows a bounded answer
  -> author returns or dismisses
  -> manuscript, outline, notes, truth, and memory remain unchanged
```

The Companion is a front door and router, not a universal owner. Its first
answer is intentionally deterministic and local, so it can be evaluated as a
workflow without pretending that a model has understood a story.

## 3. Frozen Decisions For This Slice

1. The entry is in the existing bottom Writing Studio rail. The rail remains
   closed by default, so direct writing and Focus mode remain quiet.
2. The ordinary entry is a single text line with a clear action. It is not a
   permanent conversation column, floating assistant, or dashboard card.
3. The answer is a temporary Command Center task-canvas state, not a seventh
   permanent Command workspace and not a replacement for the six accepted
   workspace families.
4. The first recognized route is `orientation`: current project, active
   manuscript unit, local save state, unit count, and local Living Outline
   relationship or availability.
5. The route never reads or displays manuscript prose, hidden buffers,
   credentials, provider payloads, notes, or saved AI history.
6. No provider call, credential, spend, outbound transmission, background job,
   persistent conversation, automatic note, signal, outline candidate, or
   manuscript action exists in this program.
7. A request outside the exact first route receives a transparent `not routed
   yet` result. It does not silently fall back to a model or claim that it
   understood the request.
8. The Companion never opens itself, steals editor focus, selects a next task,
   resolves a conflict, or gates writing. The author summons it, dismisses it,
   or returns to the existing writing anchor.

## 4. Existing Owners Consumed, Not Rebuilt

| Need | Existing owner | Program 4 role |
| --- | --- | --- |
| Active project, generation, unit, unit order, save state | Project Spine session | Read current local session facts only |
| Current outline relationship and availability | Living Outline sidecar bridge | Read current local outline facts only; degraded data stays visibly degraded |
| One-screen and optional second-screen Command placement | Program 3 logical surface host | Navigate to Command; do not create a new host |
| Writing focus and return | Program 3 Writing Studio controller | Restore writing by explicit author action |
| Command presentation | Program 3 task canvas | Present a temporary Companion result state |

No Companion state becomes project truth. The temporary request and answer are
discarded when the author dismisses them, changes project generation, or closes
the running session.

## 5. Minimal Internal Contract

The exact names may differ, but implementation must provide an explicit,
renderer-local, versioned contract equivalent to this:

```text
CompanionRequestV1
  schemaVersion
  requestId
  projectId
  generation
  text
  route = orientation | not-routed

CompanionOrientationResultV1
  schemaVersion
  requestId
  projectId
  generation
  status = available | unavailable | not-routed
  sourceFacts[]
    owner
    label
    currentness
    value
  limitationText
  allowedActions = return-to-writing | dismiss
```

Validation and reduction must fail closed. A malformed request, missing
project, stale generation, missing active unit, unavailable local surface, or
degraded outline must produce a truthful state; none may create, save, or
change author material.

The request text and result may live only in the active renderer session.
Neither is persisted to `project.json`, manuscript draft files, Living Outline,
Feedback Notes, a sidecar, analytics, logs intended for project history, or
any AI memory store.

## 6. Interaction And Presentation Contract

### Writing Studio

- The bottom edge remains a labeled, keyboard-accessible seam.
- Opening it reveals the current session summary and one clear Companion input.
- The input explains its first supported job in ordinary language, for example:
  `Ask where you are in this project`.
- It names the active scope before submission: the current project and current
  writing unit when present.
- The input is unavailable without a project and explains why. Direct writing
  remains available.
- Focus mode hides the rail and never shows an unsolicited Companion result.

### Command Center

- A submitted result navigates to Command using the existing logical surface
  host. For this renderer-local first slice it opens in the current-window
  Command surface. If an optional secondary Command window is open, the
  existing host safely returns Command to the primary window instead of adding
  cross-window result injection, caching, or persistence. A later authorized
  slice may add temporary secondary presentation only with an explicit owner
  bridge.
- A temporary Companion task-canvas view appears above the ordinary workspace
  content. It does not add a permanent tab or alter the workspace switcher.
- The view shows: request meaning, advisory/non-owning status, exact local
  source facts, owner labels, currentness, a limitation statement, and the two
  safe actions.
- `Return to Writing` restores the current writing surface and editor focus;
  it does not manufacture a prose selection.
- `Dismiss` removes the temporary result without changing project state. It
  leaves Command where the author chose to be; an explicit return remains
  available.
- If Command cannot open, the local request fails honestly in Writing Studio.
  The manuscript editor remains focused and usable.

### Plain-language result rules

The result must say that it is a local orientation summary, not story truth,
not a recommendation, and not proof that the rest of the story has been read.
If the Living Outline is missing or degraded, it says so without treating the
manuscript as unavailable. If no unit is active, it says so without choosing
one.

## 7. Explicit Exclusions

Program 4 does not implement:

- general conversational answers or personality behavior;
- use of the existing legacy `CompanionOverlay` or old general `App` path;
- provider calls, model selection, credentials, cost, privacy approval, or
  outbound transmission;
- full request routing to Critique, Outline, Notes, Signals, continuity,
  memory, search, generation, rewrite, or any other owner;
- automatic chapter suggestion, unit extraction, gap detection, or story
  analysis;
- created notes, outline items, signals, candidates, tasks, cards, or memory;
- durable history, recap cache, analytics capture, logs of request content, or
  project-sidecar persistence;
- surface redesign, new workspace family, multi-monitor redesign, or broad
  legacy cleanup; and
- Human Gate 2 subjective review before the combined candidate is complete.

## 8. Automated Batch Sequence

Each batch is automatically qualified and then manually committed and pushed
by Jason. Failed evidence is repaired within its batch. No subjective product
review occurs between these batches.

### P4-A — Local contract and deterministic router

Purpose:

- define the versioned temporary request/result shapes;
- normalize only the three orientation phrases and a transparent unknown
  route; and
- reduce session and outline facts into owner-labelled orientation data.

Automated gate:

- phrase normalization and unsupported-query truthfulness;
- project, generation, active-unit, save-state, and outline availability
  binding;
- no-project, no-unit, missing/degraded outline, malformed input, and stale
  result behavior;
- proof that no prose, credentials, provider data, persistence request, or
  mutation action enters the contract; and
- type, lint, and focused contract tests.

Exit:

- a stable local, non-AI route exists;
- it has no durable or mutation capability; and
- the view batch can consume a small explicit state instead of ad-hoc strings.

P4-A implementation and automation are green. Evidence is recorded in
[Program 4 Batch P4-A Evidence Receipt](program_4_batch_p4_a_evidence_receipt.md).
The batch becomes durable after Jason commits and pushes its exact file set.

### P4-B — Writing entry and Command task-canvas result

Purpose:

- add the bottom-rail Companion entry;
- route a supported request to the existing Command host;
- show the temporary Command result with source labels and limitations; and
- implement explicit return and dismissal with focus discipline.

Automated gate:

- closed-by-default rail, keyboard submission, and visible scope;
- one-screen presentation and safe return from an existing optional-secondary
  Command placement, without cross-window result injection or caching;
- supported, unsupported, unavailable, no-project, no-unit, and degraded
  outline states;
- return focus, dismissal, project-generation reset, and Focus-mode hiding;
- no editor replacement, prose mutation, outline mutation, note creation, or
  durable conversation state; and
- changed component/controller tests plus accessibility checks for labels,
  focus, and non-color state cues.

Exit:

- the author can ask one useful local question and see a truthful answer in
  Command Center without creating a second dashboard or AI system.

P4-B implementation and automation are green. Evidence is recorded in
[Program 4 Batch P4-B Evidence Receipt](program_4_batch_p4_b_evidence_receipt.md).
The batch becomes durable after Jason commits and pushes its exact file set.

### P4-C — End-to-end qualification and combined-candidate preparation

Purpose:

- qualify Program 4 against Program 3's accepted surface topology;
- prove reopening and project isolation remove temporary Companion state; and
- produce a concise Program 4 evidence receipt and combined-candidate handoff
  for Human Gate 2.

Automated gate:

- complete component, type, lint, build, Electron, project reopen, and
  changed-boundary regression suites;
- writing-to-command-to-writing exact lifecycle under success, unavailable,
  unsupported, and degraded paths;
- no provider activity or persisted request/result artifacts;
- package-safe checks and the existing full regression applicable to the
  changed boundary; and
- documentation-link and authority checks.

Exit:

- Programs 3 and 4 form one mechanically qualified candidate;
- all remaining subjective shell-and-Companion evaluation is deliberately
  concentrated at Human Gate 2.

## 9. Evidence, Deferrals, And Human Gate

Each batch receipt records the exact baseline, model and effort, changed
files, automated commands, results, exclusions, and remaining risk. The final
receipt must state that Companion history is temporary and that every
non-orientation request remains not routed.

Human Gate 2 begins only after P4-C is committed and pushed and the combined
package/install candidate is green. Its detailed author test is created then;
this plan intentionally does not prescribe it early.

The next Companion expansion is decided from that human evidence. Likely
future routes include Critique, Structure, and Feedback Notes, but each needs
its own owner contract and must not be inferred from this first route.

## 10. Authorization Record

Required author decision before runtime mutation:

> I approve the Program 4 plan and authorize its bounded implementation.

Once recorded, Program 4 implementation is limited to P4-A through P4-C and
the exclusions above remain in force.
