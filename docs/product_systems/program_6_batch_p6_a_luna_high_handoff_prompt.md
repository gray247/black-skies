# Program 6 Batch P6-A Luna High Handoff Prompt

Paste this entire prompt into the implementation task only when Jason wants
to authorize P6-A. The prompt is intentionally explicit because the planning
document and this stored prompt are not authorization by themselves.

---
## P6-A execution authorization

You are executing only `Program 6 Batch P6-A - shared story-intelligence
contracts and project-local persistence` in the canonical Black Skies
checkout.

This authorization exists only because the user has now sent or pasted this
prompt. Merely storing this prompt in the repository, linking to it, or
mentioning it does not authorize execution. When this prompt is sent, it
narrowly lifts the repository's `AGENTS.override.md` implementation block only
for the P6-A scope below. All other governance, ownership, privacy, Git, and
worktree controls remain in force.

Use `GPT-5.6 Luna` with `high` reasoning. Do not silently change the model or
reasoning effort. If that setting is unavailable or a required model-change
confirmation is missing, stop before editing.

Jason alone stages, commits, and pushes. You must not perform any of those
actions.

### Dynamic preflight - stop on any mismatch

Before editing, in
`C:\Users\gray2\.codex\worktrees\4f0b\black-skies`, verify:

1. branch is exactly `codex/foundation-audit`;
2. worktree is clean;
3. local `HEAD` equals the current `origin/codex/foundation-audit` at this
   preflight moment;
4. `HEAD` is at or descends from planning baseline
   `235f42d7599aff5662eb1f65a0c0b201b4857e0c`;
5. exactly the four retained worktrees remain registered; and
6. no branch, worktree, stash, reset, clean, prune, repair, rename, delete,
   or salvage action is needed.

The equality check is dynamic: use the current clean upstream HEAD for this
task, not a permanent exact-HEAD requirement. The baseline is only a
descendant guard. Stop before editing if any check fails and report the exact
mismatch.

### Authorized scope

You may change only the smallest existing or newly necessary files for:

- shared TypeScript story-intelligence contracts;
- the project-local story-intelligence repository and its atomic,
  revision-checked persistence;
- main-process IPC handlers for the named P6-A operations;
- the typed preload bridge for those operations;
- pure permission, posture, lifecycle, currentness/staleness, validation,
  candidate/durable-separation, provenance, and history-trimming logic;
- focused unit/contract/repository/IPC/preload tests for those boundaries; and
- evidence/status documentation needed to record P6-A results.

Keep existing owners and anchors. Reuse the current project binding,
generation, revision, and fingerprint patterns. Do not invent a competing
project, manuscript, Outline, Story Unit, note, memory, provenance, or truth
owner.

### Forbidden scope

Do not implement or modify:

- P6-B Emotion Graph behavior;
- P6-C Continuity behavior;
- P6-D Timeline, pacing, or pressure behavior;
- P6-E or later UI, CSS, Writing Surface, Story Knowledge, Focus, or local
  inference gateway behavior;
- any analyzer, corpus runner, model call, Ollama integration, provider,
  fallback, routing, credential, package, prompt, or model execution;
- any provider install, model download, provider/model start, provider/model
  update, or provider/model process management;
- dependencies, package manifests, lockfiles, packaging, installers, or
  release configuration;
- broad refactors, migrations, cleanup, archive/delete work, salvage actions,
  or unrelated tests/test repair;
- branches, worktrees, staging, commits, pushes, or history rewriting; or
- any runtime path that writes prose, outline, facts, canon, notes, signals,
  memory, settings, or accepted truth silently.

Do not start P6-B after P6-A is green. Stop after P6-A and report the
handoff.

## Required P6-A semantics

### Contract values

Define typed, versioned contracts equivalent to the following:

- `SignalPostureV1`: `off | ask-only | quiet | alert`; default `ask-only`.
- `ProjectPostureV1`: `explore | develop | finish`; default `develop`.
- `EvidenceClassV1`: `planned | observed | inferred | reader-effect-optional`.
- `ConfidenceBandV1`: `unknown | low | medium | high`; qualitative only, no
  percentages.
- `SignalImpactV1`: `informational | attention | urgent | blocking`.
- `SignalLifecycleV1`: `candidate | reviewed | accepted | dismissed |
  suppressed | expired | converted | resolved | superseded`.
- `CurrentnessV1`: `current | stale | unavailable | trimmed`.

Emotion labels remain flexible author-facing labels. If an intensity value is
represented in P6-A contracts, use exactly five qualitative bands:
`very-low | low | medium | high | very-high`, plus an absent/unknown state.
Never use a percentage or pretend that an inferred label is canon.

Keep these evidence lanes separate in every contract:

- planned author intent/target;
- observed manuscript or accepted-source evidence;
- inferred advisory interpretation; and
- optional reader-effect intent or detection.

Reader effect is not character emotion. Planned is not observed. Observed is
not inferred. Inferred is not accepted truth.

### Position and provenance

Define a `StoryPositionRefV1` that reuses current project-local source
anchors, revisions, and selection fingerprints. It must carry enough project,
source, revision, and navigation identity to detect stale evidence without
copying prose. A position reference is not a new truth owner.

Every finding and durable signal must preserve source owner, evidence class,
confidence band, impact, currentness, and bounded provenance. Display-safe
summaries must not reconstruct protected or excluded text.

### Findings and signals

`StoryIntelligenceFindingV1` is temporary by default. It may point to source
references and contain a bounded evidence summary, but it must not become
durable merely because it was displayed or stored in memory.

`DurableSignalV1` is a non-truth attention object. Durable creation requires
explicit confirmation through the Signal Architecture owner path. Signals do
not own prose, facts, canon, Outline, notes, memory, or truth.

Candidates are temporary. Do not persist candidate findings.

### Legal lifecycle transitions

Implement and test these legal transitions only:

| From | To |
| --- | --- |
| candidate | reviewed, dismissed, expired |
| reviewed | accepted, dismissed, suppressed, expired, converted, resolved |
| accepted | suppressed, converted, resolved, expired, superseded |
| suppressed | reviewed, accepted, resolved, expired |
| dismissed | terminal |
| converted | terminal |
| resolved | terminal |
| expired | terminal |
| superseded | terminal |

No state called `stale` may be added to the lifecycle. Stale is a
`CurrentnessV1` condition. A later recurrence creates a new linked candidate;
it does not silently reopen a dismissed, resolved, expired, or superseded
signal. Lifecycle changes do not mutate source truth.

### Permission rules

Implement deny-by-default pure permission logic with these invariants:

- excluded content enters neither deterministic analysis nor model packages;
- deterministic-only content never enters a model package;
- hidden, masked, deleted, forgotten, discarded, local-only, protected, and
  AI-excluded statuses are preserved and cannot leak through summaries;
- no raw excluded prose or reconstructed excluded summary is accepted by a
  display, finding, signal, history, IPC, or persistence contract;
- deterministic analysis may be enabled while optional inference is disabled;
- optional local inference, if represented as policy, is not provider or
  outbound authorization; and
- no permission result grants manuscript, Outline, fact, canon, note, memory,
  settings, outbound, paid, background, or generic filesystem authority.

### Project-local persistence

Persist only project-local `story-intelligence.json` with:

- schema version and project identity;
- optimistic-concurrency revision;
- signal/project posture and analysis policy;
- unit policies;
- explicit author records;
- durable signals/dispositions; and
- at most 200 metadata-only history events.

Do not persist candidate findings, raw model output, raw packages, prompt
payloads, excerpts, excluded prose, reconstructed excluded summaries,
credentials, or provider diagnostics.

Require project identity, generation, and document revision on writes. A
revision conflict must leave the existing file unchanged. Use validated
serialization, a temporary sibling, and atomic replacement. A failed write or
replacement must return a truthful failure and must not leave partial current
state or claim success. Trim oldest unpinned metadata-only history to the
200-event limit after a successful write.

### IPC and preload least authority

Expose only typed, named operations equivalent to:

- read the project-bound story-intelligence document;
- write an explicitly validated project-bound document under revision check;
- request a bounded project-bound policy/permission result; and
- request owner-routed durable-signal disposition only if the existing owner
  boundary supports that P6-A operation.

Every result must be a discriminated success/failure result carrying project
identity and generation/revision evidence where relevant. Fail closed for no
project, stale generation, malformed payload, denied source class,
revision-conflict, unavailable repository, and write failure.

Do not expose generic `invoke`, filesystem paths, arbitrary channels,
manuscript mutation, Outline mutation, provider calls, model calls, or hidden
content.

## Required P6-A tests

Write focused tests for:

1. contract version and enum validation;
2. planned/observed/inferred/reader-effect separation;
3. qualitative confidence and five-band intensity without percentages;
4. legal lifecycle transitions and rejection of every illegal transition;
5. stale currentness after source revision/fingerprint mismatch;
6. candidate non-persistence and explicit durable-signal confirmation;
7. permission denial for excluded, protected, hidden, masked, local-only,
   deleted, forgotten, discarded, and AI-excluded content;
8. deterministic-only exclusion from model-package inputs;
9. cross-project and stale-generation rejection;
10. revision conflict with unchanged file;
11. malformed data, failed atomic replacement, and truthful write failure;
12. bounded 200-event metadata-only history trimming;
13. IPC channel/argument/result typing and least-authority rejection; and
14. preload exposure containing only the named typed operations.

Do not run or add GUI, Playwright/Electron, analyzer, provider, Ollama,
packaging, or full application qualification tests in P6-A unless a focused
test is strictly required to prove one of the authorized bridge boundaries.
Do not repair unrelated failing tests.

## Documentation and evidence receipt

At the end of P6-A, create or update only the bounded P6-A evidence/status
record needed for handoff. It must state:

- dynamic preflight facts and exact current baseline used;
- model/reasoning setting;
- exact files changed;
- focused commands and pass/fail results;
- contract and persistence versions;
- permission/provenance/lifecycle/currentness evidence;
- any failure or residual with one resolution stage and reopening trigger;
- explicit confirmation that no candidate, raw output, excluded prose, or
  model package was persisted; and
- explicit nonclaims for P6-B through P6-G.

Do not claim Program 6 completion, Emotion Graph behavior, Continuity,
Timeline, local inference, GUI usefulness, packaging, Human Gate 4, or Program
7 readiness.

## Stop conditions

Stop before widening scope if:

- preflight fails;
- an existing owner or contract cannot support the narrow operation without a
  new broad authority;
- excluded content would need to enter analysis, packages, logs, or evidence;
- any change would mutate prose, Outline, facts, canon, notes, memory, signal
  state, settings, or truth silently;
- a dependency, provider, model, packaging, cleanup, migration, branch,
  worktree, commit, or push is required;
- a failing unrelated test needs repair;
- a lifecycle design implicitly reopens terminal signal states; or
- completing P6-A would require beginning P6-B or later.

Report the blocker and stop. Do not solve it by weakening the contract.

## Final report

When P6-A is complete, report:

- outcome: `P6-A complete` or `P6-A stopped`;
- exact current checkout, branch, baseline, and preflight results;
- exact files changed;
- focused validation commands and results;
- contract, IPC/preload, permission, and persistence evidence;
- residuals, blockers, and their single resolution stage/reopening trigger;
- confirmation that P6-B was not started;
- confirmation that no UI/CSS/analyzer/provider/Ollama/dependency/packaging,
  branch/worktree/commit/push mutation occurred; and
- Jason's recommended next action, without performing staging, commit, or
  push.

Stop after this report. Do not begin P6-B.

---
