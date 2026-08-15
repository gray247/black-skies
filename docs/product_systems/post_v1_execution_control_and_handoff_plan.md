# Black Skies Post-V1 Execution Control And Handoff Plan

## 1. Status And Authority

- Status: `ACCEPTED CURRENT EXECUTION CONTROL`
- Author approval: `JASON APPROVED ON 2026-08-10`
- Current implementation state: `CONTROL POINT 1 COMPLETE; PROGRAM 3 P3-A THROUGH P3-F DURABLE; P3-G IMPLEMENTATION AND AUTOMATION GREEN`
- Next implementation control point: `COMMIT AND PUSH THE EXACT P3-G BATCH, THEN ISSUE THE PROGRAM 4 MODEL-CHANGE WARNING`
- Git authority: `JASON ALONE STAGES, COMMITS, PUSHES, MERGES, AND APPROVES DESTRUCTIVE DISPOSITION`

This plan translates the product direction in
[black_skies_post_v1_master_product_program.md](black_skies_post_v1_master_product_program.md)
and [author_experience_direction_lock.md](author_experience_direction_lock.md)
into a detailed execution sequence that another task, model, or reasoning
effort can follow without reconstructing the project from conversation.

It is current authority for:

- the pre-Program-3 repository-control work,
- canonical-branch reconciliation,
- legacy-code inventory, archive, and deletion timing,
- architecture, maintainability, refactor, and test-strength reviews,
- professionalization checkpoints,
- the visual-design foundation,
- the reordered nine-program product sequence,
- the six outcome-based human gates,
- the current open-work register,
- model, reasoning-effort, and separate-task change warnings,
- handoff requirements between tasks.

It does not authorize public release, paid provider use, protected-content
transmission, destructive cleanup, a merge, a branch deletion, or an
unreviewed repository rewrite.

## 2. Approved Decisions

Jason approved the following decisions on 2026-08-10:

1. `codex/foundation-audit` is the intended continuing canonical development
   line after the dirty primary checkout has been reconciled. The old
   `salvage/minimal-two-surface-shell` checkout may be retired only after its
   unique work is classified and Jason approves the disposition.
2. The bounded long-manuscript intake and stable structural-anchor program
   moves before Emotion Graph.
3. The visual direction is a restrained professional literary instrument with
   subtle Black Skies atmosphere, not a strong science-fiction command-console
   aesthetic.
4. Repository health, professionalization, testing, cleanup, and product work
   are integrated at named control points rather than postponed to one giant
   end-of-project cleanup.
5. Human verification is outcome-based. No gate is assigned a time limit, and
   detailed test instructions are created only when that gate is ready and the
   implementation is known.
6. The agent must explicitly warn Jason when a model or reasoning-effort change
   is required. The agent must not rely on Jason remembering a general model
   table.

## 3. Current Repository Facts

At the time this plan was accepted:

- the active clean development line was `codex/foundation-audit` at committed
  candidate `2b9f707d`, followed by the current uncommitted documentation-only
  reconciliation,
- the primary checkout at `C:\Dev\black-skies` was on
  `salvage/minimal-two-surface-shell` at `0d4e05da`,
- that commit was an ancestor of `2b9f707d`, with the active development line
  seventy-three commits ahead,
- the primary checkout contained eleven modified tracked files and three
  untracked files,
- none of the fourteen dirty working-copy file blobs was byte-identical to the
  `2b9f707d` version,
- this proves the dirty state requires inspection; it does not prove that the
  state is still valuable or should be merged,
- the active branch must not receive a wholesale merge of the dirty checkout,
- the current source tree contains no ordinary `TODO`, `FIXME`, `HACK`, or
  `XXX` markers in the active application, service, script, or tool sources;
  most unfinished work is recorded in governance documents and inventories.

These facts are a dated control-point snapshot. The executing task must repeat
read-only branch, status, and ancestry checks before acting.

## 4. Mandatory Model And Reasoning Change Protocol

### 4.1 The Agent Must Warn, Then Stop

At every model checkpoint in this plan, the active agent must evaluate the
next task before making task mutations.

When a change is required, the agent must send this warning in plain language:

> **MODEL CHANGE REQUIRED** — The next task is `<task>`. Change this task to
> `<model>` with `<reasoning effort>` reasoning, then reply that the change is
> complete. I will not begin that task until you confirm.

When a separate task is the safer way to preserve the main task's state, the
agent must send:

> **NEW TASK RECOMMENDED** — Keep this integration task where it is. Create a
> separate task using `<model>` with `<reasoning effort>` reasoning for
> `<bounded assignment>`. Use the handoff packet I provide and return its
> evidence here before integration.

When a specialized task is complete and the next phase should use a different
model, the agent must issue another warning. A previous model decision does not
silently carry into a different phase.

If the named model or effort is unavailable, the agent must stop, say that it
is unavailable, and ask Jason to select the closest available option. The agent
must not silently substitute another model.

### 4.2 Required Checkpoints

| Approaching work | Required warning before work begins |
| --- | --- |
| Dirty-worktree forensics, branch reconciliation, unique-hunk disposition, or any decision that could lose work | Change to `GPT-5.6 Sol`, `xhigh` reasoning |
| Product constitution, cross-system architecture, structural-anchor architecture, persistence migration, data-loss analysis, or difficult ownership conflict | Change to `GPT-5.6 Sol`, `xhigh` reasoning |
| Visual Design Foundation, interaction-language synthesis, or final selection among high-fidelity GUI directions | Change to `GPT-5.6 Sol`, `high` reasoning |
| Bounded implementation after its architecture and design are accepted | Change to `GPT-5.6 Terra`, `high` reasoning |
| Routine implementation, focused repairs, ordinary tests, documentation reconciliation, or mechanical refactor with stable behavior locks | Change to `GPT-5.6 Terra`, `medium` reasoning; raise to `high` if the first evidence shows cross-boundary complexity |
| Large read-only inventories, repetitive classification, simple test-case expansion, or mechanical evidence reduction | Create a separate `GPT-5.6 Luna`, `medium` task when Luna is available; keep final judgment in the integration task |
| Human-gate synthesis, ambiguous product evidence, or deciding what the next program learned | Change to `GPT-5.6 Sol`, `high` reasoning |
| Security, privacy, protected content, destructive cleanup disposition, restore-over-current, durable memory, paid/outbound behavior, or final release-risk review | Change to `GPT-5.6 Sol`, `xhigh` reasoning |
| Final adversarial review still containing unresolved high-impact ambiguity after an xhigh pass | Warn Jason that `GPT-5.6 Sol`, `max` reasoning is recommended for one bounded final review; do not use `max` routinely |

The approved Program 3 implementation plan is a specific exception to the
generic bounded-implementation row: because P3-A through P3-G cross the
surface-host, state-owner, Review-projection, concurrency, accessibility, and
qualification boundaries as one continuous program, Jason confirmed
`GPT-5.6 Sol` with `xhigh` reasoning through Program 3 unless a later explicit
model decision changes it.

The model roles above follow current official OpenAI guidance: Sol is the
frontier-capability model, Terra balances intelligence and cost, Luna targets
efficient high-volume work, medium is the balanced reasoning starting point,
high or xhigh is appropriate when measured quality benefits, and max is
reserved for the hardest quality-first work. See
[OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model).

### 4.3 Model State Must Be Logged

Every implementation or audit ledger must record:

- model,
- reasoning effort,
- exact starting commit,
- task or thread identity,
- whether work is read-only or mutation-authorized,
- scope,
- prohibited actions,
- completion evidence,
- unresolved findings and their destination.

Model choice is execution metadata, not product authority. A stronger model
cannot broaden the authorized scope.

## 5. Separate-Task And Handoff Protocol

The main integration task owns current authority, sequencing, conflict
resolution, and final synthesis. A separate task may own only one bounded
assignment.

Good separate-task candidates include:

- read-only dirty-hunk classification support,
- legacy reachability inventory,
- test-gap analysis,
- dependency review,
- security review,
- visual exploration,
- performance analysis,
- a bounded implementation batch that does not overlap another task's files.

A separate task must receive this handoff packet:

1. exact repository and worktree path,
2. exact starting commit and expected branch,
3. mandatory authority documents,
4. bounded objective,
5. files or systems in scope,
6. prohibited actions,
7. required evidence,
8. expected output or ledger update,
9. instruction not to stage, commit, push, merge, delete, or change branches,
10. return path to the integration task.

Mandatory authority documents for post-V1 execution are:

1. [current_truth_index.md](current_truth_index.md)
2. [author_experience_direction_lock.md](author_experience_direction_lock.md)
3. [black_skies_post_v1_master_product_program.md](black_skies_post_v1_master_product_program.md)
4. this execution-control plan
5. [current_open_work_register.md](current_open_work_register.md)
6. the active system dossiers and workflow ledger named by the assignment

Separate tasks must not edit the same files concurrently. Their findings are
inputs until the integration task accepts and reconciles them.

## 6. Repository Control Point 0 — Canonical Development Line

This is the first implementation activity after the current documentation
batch is reviewed, committed, and pushed by Jason.

### 6.1 Objective

Preserve any unique valuable work in the dirty primary checkout, prevent stale
or superseded work from entering the active line, and establish one clearly
identified canonical development branch and worktree before Program 3 code.

### 6.2 Required Sequence

1. Confirm the current documentation batch is committed and the active
   `codex/foundation-audit` worktree is clean.
2. Repeat the read-only status, ancestry, branch, and worktree inventory.
3. Capture the dirty primary checkout in a recoverable patch or equivalent
   non-destructive evidence artifact before changing it.
4. Compare each of the fourteen dirty paths hunk by hunk against the active
   branch and relevant later commits.
5. Classify each hunk as:
   - already incorporated,
   - superseded by later implementation,
   - uniquely valuable and still valid,
   - historical evidence only,
   - unsafe, incorrect, or obsolete.
6. Record evidence and proposed disposition in the current open-work register
   or a bounded reconciliation ledger.
7. Reapply uniquely valuable work to the active branch as new, understandable,
   narrowly scoped changes. Do not merge the dirty branch wholesale.
8. Run risk-proportional automated qualification on any recovered work.
9. Present Jason with the exact final disposition before clearing, retiring,
   or repurposing the old checkout.
10. After Jason's approval, establish `codex/foundation-audit` or its explicit
    successor as the canonical continuing development line.

### 6.3 Prohibited Shortcuts

- no `reset --hard`, clean, stash-and-forget, bulk overwrite, or branch deletion,
- no assumption that descendant history automatically contains dirty work,
- no assumption that a byte difference is valuable,
- no wholesale merge of `salvage/minimal-two-surface-shell`,
- no mixing Program 3 product work into the reconciliation batch.

### 6.4 Exit Condition

This control point closes when:

- all dirty hunks have a recorded disposition,
- recoverable evidence exists,
- any retained work is integrated and qualified,
- the old checkout's disposition is approved by Jason,
- one canonical development line is named,
- all active worktrees used for the next program are clean and understood.

No GUI human-verification workflow is required unless recovered code changes
runtime behavior. Jason's disposition approval is mandatory before destructive
cleanup.

## 7. Control Point 1 — Open Work, Architecture, Testing, And Design Baseline

This control point follows Repository Control Point 0 and precedes Program 3
implementation.

### 7.1 Current Open Work Register

Reconcile existing actionable work from:

- `BLACK_SKIES_FIX_TRACKER.md`,
- dossier `Deferred Questions`,
- the master-program deferral table,
- the intentional-skip inventory,
- the reachability inventory,
- roadmap intentionally-unfinished sections,
- current audit findings,
- current workflow ledgers.

Do not copy entire historical logs into a new backlog. The register stores one
current row per live decision and links to detailed evidence.

Every live item needs:

- stable identity,
- source,
- current disposition,
- owning program or control point,
- reopening trigger,
- blocking or non-blocking status,
- next required review,
- final evidence when closed.

The register is reviewed before every program, after every human gate, before
each cleanup wave, and before final qualification.

### 7.2 Architecture And Maintainability Audit

Execution status: `COMPLETE; EVIDENCE RECORDED IN`
[control_point_1_architecture_maintainability_audit.md](control_point_1_architecture_maintainability_audit.md).

The result preserves the V1 foundation, bounds Program 3 to a logical surface
host, behavior-locked renderer decomposition, a sanitized Review projection,
dedicated-host preload/typecheck parity, scoped presentation styling, and
Feedback Note write serialization before multi-surface creation. Legacy
consolidation remains assigned to the approved cleanup waves.

Perform a read-only risk-led review of:

- large responsibility concentrations,
- renderer, main-process, preload, service, and persistence boundaries,
- duplicated state or validation logic,
- IPC schema ownership,
- error and degraded-state vocabulary,
- project identity and generation binding,
- concurrency, cancellation, and stale-result handling,
- dependency direction and circular coupling,
- migration/versioning readiness,
- testability seams.

The audit produces bounded refactor candidates. It does not authorize a broad
rewrite.

### 7.3 Test-Strength Audit

Execution status: `COMPLETE; EVIDENCE RECORDED IN`
[control_point_1_test_strength_audit.md](control_point_1_test_strength_audit.md).

The result preserves the strong V1 behavioral and exact-candidate evidence,
records a truthful-denominator repair for the supported-core receipt, assigns
seven bounded Program 3 changed-boundary evidence requirements, replaces
source-shaped visual confidence with an approved layered strategy, and keeps
long-manuscript, Emotion Graph, provider, service, and legacy evidence at their
named later programs. Programs 3 and 4 may proceed through automated batches
before one complete packaged candidate and Human Gate 2 review.

Review whether existing evidence proves behavior rather than only source shape
or implementation details. Assess:

- risk coverage beyond the supported-core minimum,
- intentional skips and their reopening triggers,
- UI behavior versus implementation-coupled component assertions,
- visual consistency and rendering-host strategy,
- accessibility,
- malformed data and migration behavior,
- concurrency and cancellation,
- long-manuscript size and performance,
- project isolation and cross-window ownership,
- failure injection and degraded operation,
- package and installed-runtime parity.

The result is a prioritized test-strength plan. It must not become a blind
coverage-percentage campaign.

### 7.4 Visual Design Foundation

Execution status: `COMPLETE; JASON APPROVED AS WRITTEN ON 2026-08-10`. The
approved decision packet is recorded in
[control_point_1_visual_design_foundation.md](control_point_1_visual_design_foundation.md).
It is Program 3 design authority but grants no runtime mutation outside the
separately approved Program 3 implementation plan.

Before Program 3 GUI implementation, define and obtain Jason's approval for:

- typography and manuscript reading rhythm,
- spacing and density,
- true-black and near-black surface hierarchy,
- restrained accent use,
- icon language,
- edge-rail activation behavior,
- focus, hover, selection, drag, advisory, failure, and disabled states,
- motion and transition restraint,
- accessibility and large-font behavior,
- Writing Studio versus Command Center identity,
- empty, loading, degraded, and offline states.

The design target is a professional literary instrument with subtle Black
Skies atmosphere. Avoid generic AI-dashboard cards, gratuitous glow, sci-fi HUD
decoration, ornamental charts, and visually impressive layouts that do not
explain author workflow.

Concept images remain exploratory evidence. High-fidelity direction requires
human approval before it becomes implementation authority.

### 7.5 Exit Condition

Control Point 1 closes when:

- the current open-work register is live,
- architecture and test-strength findings have owners and milestones,
- Program 3 refactor needs are bounded,
- the visual design foundation is approved,
- the Program 3 implementation plan can be written without inventing product
  direction during coding.

## 8. Reordered Product And Quality Sequence

### Program 1 — Critique Workbench

Status: mechanically qualified. Rich-result placement finding is routed to
Program 3.

### Program 2 — Living Outline Learning Loop

Status: mechanically qualified. Interaction-language and ecosystem findings
are routed to Program 3.

### Human Gate 1 — V2 Learning

Status: completed. Mechanics and safety passed; composition findings are
binding inputs.

### Program 3 — Contextual Product Shell

Build the true-black, manuscript-first Writing Studio, plain Living Outline,
thin edge controls, direct manipulation, Focus behavior, restrained design
system, and Command Center result handoff. Apply only the refactors required to
make the changed boundary professional and testable.

The complete seven-batch implementation proposal is recorded in
[program_3_contextual_product_shell_implementation_plan.md](program_3_contextual_product_shell_implementation_plan.md).
Jason approved that plan, explicitly authorized its bounded GUI, source, test,
and qualification mutations, and confirmed `GPT-5.6 Sol` with `xhigh`
reasoning on 2026-08-10. P3-A through P3-F are durable; P3-G implementation
and automation are green and recorded in
[program_3_closure_receipt.md](program_3_closure_receipt.md). Jason's exact
P3-G commit and push makes Program 3 durably complete. All plan exclusions and
current Git controls remain in force.

### Program 4 — Companion And Owner Routing

Add the minimal Companion text entry, explicit source scope, owner routing,
Command Center result surface, safe actions, and return-to-writing path.

### Human Gate 2 — Shell And Companion

Confirm the Writing Studio, Living Outline, Command Center, Focus behavior,
and Companion operate as one understandable and non-intrusive product. Create
detailed validation instructions only when the complete candidate is ready.

**Current result:** the exact candidate passed package/install automation, but
the author did not accept the current separate-unit, form-heavy Writing Studio
or its incomplete Companion experience. Do not proceed to Cleanup Wave A.
Follow [Human Gate 2 Experience Repair Plan](program_4_human_gate_2_experience_repair_plan.md):
repair the direct story-rail and Focus composition, and pull Program 5's
continuous-manuscript/stable-anchor bridge forward before repeating this gate.
The Story Rail is durable at `707dfae6`; the pulled-forward continuous
projection and anchor bridge is durable at `d292e236`; and the real Focus and
Companion doorway repair is durable at `1da56446`. The first complete hosted
qualification found a repeated-identical Electron launch-argument seam that
hid the optional Command bridge. The following hosted run isolated a separate
first-host-state startup race despite a confirmed lifecycle seam. Full local
qualification then isolated a persisted-theme test-isolation race. The bounded
preload, renderer-handshake, and fixture-isolation repairs are green locally,
including CI-mode built-Electron evidence; a clean hosted Windows
package/install run of the next exact candidate remains required before Human
Gate 2 repeats.

The regression now has a fail-fast built-Electron startup preflight before the
full Electron matrix. It witnesses the runtime startup and surface authority
chain once, classifies bridge/IPC/state/renderer failures directly, and prevents
every dependent journey from repeating the same startup timeout. The operational
chain is recorded in
[runtime_startup_surface_authority_matrix.md](runtime_startup_surface_authority_matrix.md).

### Cleanup Wave A And Professionalization Checkpoint

After the **repaired** Human Gate 2 passes, use the proven shell to identify pre-salvage GUI and
runtime surfaces that are replaced or unreachable. Perform bounded module,
contract, test-fixture, and dependency professionalization. Archive or delete
only after the disposition and recovery path are approved.

### Program 5 — Long-Manuscript Intake And Structural Anchors

Prove continuous-manuscript identity, durable position and span anchors,
lossless substantial-manuscript intake, deterministic structural discovery,
optional bounded proposal support, ghost structure, author-controlled
acceptance, and adjustment without mandatory physical file splitting.

Broader Google Docs, publication interchange, and portable project exchange
remain in Program 8.

Program 5's anchor foundation is pulled forward into the Human Gate 2 repair
sequence because the author requires the Writing Studio to read as one story,
not separate files. Its full long-manuscript qualification and Human Gate 3
remain distinct.

### Human Gate 3 — Long-Manuscript Integrity And Usability

Confirm substantial author material remains intact, navigable, understandable,
and author-controlled, and that structural proposals assist rather than impose.
Create detailed validation instructions only when the candidate is ready.

### Program 6 — Signals And Story Intelligence

Implement author-controlled signal posture, project maturity, Emotion Graph V1,
continuity, and later high-value lenses. Emotion Graph begins only after Human
Gate 3 establishes stable story positions and anchors.

### Program 7 — Creation, Revision, And Story Development

Add bounded author-intent, ideation, proposal-based generation, comparison,
partial acceptance, and revision-resolution workflows without transferring
authorship.

### Human Gate 4 — Intelligence And Creation

Confirm that the first complete story-intelligence and creation or revision
workflows are useful, understandable, source-linked, and visibly advisory.

### Program 8 — Knowledge, Organization, And Interchange

Build the proven Binder, search, cards, files, governed memory, broader import
and export, portable archive, and Series Binder workflows.

### Cleanup Wave B And Second Professionalization Checkpoint

Remove or archive superseded prototypes, unused provider scaffolding, obsolete
tests, duplicate documentation paths, and dependencies whose only owners are
retired. Reassess module boundaries, migrations, performance, accessibility,
and operational diagnostics after the major product families exist.

### Program 9 — Heavy Intelligence, Durability, And Operationalization

Introduce task-specific local or paid alternatives, provider-neutral
contracts, protected-content packages, budget controls, bounded background
work, deeper recovery, diagnostics, packaging, and release hardening only when
proven workflows justify them.

### Human Gate 5 — High-Risk Behavior

Confirm paid or outbound work, protected content, durable memory, background
execution, destructive operations, restore-over-current, and other high-risk
behaviors remain explicit, recoverable, and author-controlled.

### Final Professionalization And Release Audit

Perform final architecture, security, privacy, dependency, license, data
integrity, migration, accessibility, performance, recovery, observability,
packaging, documentation, dead-code, and operational-readiness reviews.

### Human Gate 6 — Final Installed Product

Confirm the installed application supports the complete author journey as one
coherent product. This gate does not itself authorize public release.

## 9. Refactor Policy

Professionalization is continuous but bounded:

- refactor changed boundaries when responsibility, coupling, or testability
  would otherwise worsen,
- preserve behavior with automated evidence,
- do not combine unrelated cleanup with a product batch,
- do not rewrite stable subsystems for aesthetics,
- schedule cross-cutting extraction only at the two professionalization
  checkpoints unless a current workflow is blocked,
- give every deferred refactor an owner, trigger, and review point,
- remove compatibility code when its supported consumer is gone rather than
  carrying it indefinitely.

Large files are review signals, not automatic deletion targets. The audit must
identify actual responsibility and change-risk boundaries before extraction.

## 10. Legacy Archive And Delete Policy

### 10.1 Classify Before Acting

Every legacy surface receives one disposition:

- `keep-current`,
- `keep-deferred`,
- `merge-capability`,
- `replace-then-remove`,
- `archive-evidence`,
- `delete-dead`,
- `unresolved-blocker`.

### 10.2 What Belongs In An Archive

Archive material that retains evidence, rationale, lineage, or a unique product
idea. Historical documents, qualification receipts, and decision records may
belong here.

Do not move executable dead code into an active source archive merely to avoid
deciding. Git history is the recovery source for removed code.

### 10.3 What May Be Deleted

Delete only when evidence proves the material is:

- unreachable from the packaged product,
- not required by current tests or qualification helpers,
- not current authority,
- not the sole witness for a deferred capability,
- replaced or intentionally rejected,
- recoverable through version history or an approved evidence archive.

Tests whose sole purpose is preserving rejected dead behavior should be
removed with that behavior. Tests that preserve a still-valid safety invariant
must be migrated to the current owner.

### 10.4 Human Authority

Jason approves each cleanup wave's disposition list before destructive action.
The agent then executes and automatically qualifies the complete batch. Human
verification occurs once at the completed cleanup boundary when runtime or
author workflow changed, not after every deleted file.

## 11. Testing And Audit Rhythm

Each product program uses risk-proportional automated batches. Human review
waits for the named complete outcome gate.

Mandatory audit checkpoints are:

1. pre-Program-3 architecture and test-strength baseline,
2. post-Human-Gate-2 professionalization and legacy disposition,
3. pre-Emotion-Graph structural-anchor and data-contract review,
4. post-Human-Gate-4 architecture and test-strength reassessment,
5. pre-high-risk security, privacy, recovery, and cost review,
6. final professionalization and release audit.

An audit finding is not a new parallel roadmap. It enters the current open-work
register with an owner and resolution point.

## 12. Human Verification Rules

- Human gates are defined by completed outcomes, never by elapsed time.
- Detailed test instructions are written only when the exact candidate and
  behavior are known.
- Automation runs between gates without requesting human review after every
  small change.
- A failed human gate creates a bounded repair program; human review repeats
  only when the grouped candidate is whole again.
- A new product decision, destructive action, protected-content decision,
  outbound transmission, paid spend, or other governing approval may require
  Jason's decision even when no usability gate is due.
- Human judgment owns usefulness, understandability, aesthetic quality,
  interruption, and whether an advisory result is safe to act on.
- Automation owns repeatable structural, persistence, isolation, integrity,
  regression, build, and packaging evidence.

## 13. Additional Professional Product Requirements

The following cross-cutting requirements must receive explicit owners before
their first affected workflow:

- project and sidecar schema versioning,
- forward and backward migration behavior,
- substantial-manuscript performance budgets,
- content-integrity invariants,
- autosave and crash-recovery truth,
- accessibility and keyboard-only operation,
- privacy and protected-content boundaries,
- dependency and third-party license governance,
- diagnostics that help without exposing author content,
- release-channel and versioning policy,
- backup, restore, and portable-project escape paths,
- offline and degraded-mode behavior,
- design-token and component governance,
- sample projects and synthetic fixtures at representative scales.

These are integrated into the affected product program or professionalization
checkpoint. They do not become an unrelated permanent audit campaign.

## 14. Immediate Next Sequence

1. reconcile the Human Gate 2 finding into the current authority records and
   approve the bounded experience-repair plan;
2. issue the model/effort warning required by that repair before runtime
   mutation;
3. retain the completed direct Story Rail, theme, and rail-geometry batches;
4. make the green Program 5 continuous-manuscript/stable-anchor bridge durable,
   then complete true Focus and Companion-doorway automation;
5. qualify the complete repaired package/install candidate; and
6. repeat Human Gate 2 only when that candidate is whole.

No broad cleanup, local-LLM/provider work, or generic chat enters this repair.
A new blocker must be recorded and resolved at its owning boundary rather than
silently widening the repair.

## 15. Handoff Completion Checklist

A new task is ready to act only when it can answer:

- What exact commit and worktree am I using?
- Which program or control point owns this work?
- What may I change?
- What must I not change?
- Which model and reasoning effort should be active now?
- Has the required model warning and Jason confirmation occurred?
- What automated evidence is required?
- Is a human gate due, or only a later grouped gate?
- Which open-work rows are affected?
- What durable record will preserve the result for the next task?

If any answer is missing and would change the work, the task must stop and
resolve the handoff rather than guess.
