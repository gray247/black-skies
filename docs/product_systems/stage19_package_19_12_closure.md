# Stage 19 Package 19.12 Closure Record

Status: closure record pending effective commit and push

Package: 19.12 — history/recovery/interruption safety

Branch: `salvage/minimal-two-surface-shell`

Closure-audit starting boundary:
`ad3b41724b4514f28744707a1ce59013ee3c9782` —
`docs(product): reconcile Package 19.12 authorization`

## 1. Package identity and repository position

Package 19.12 establishes the bounded V1 recovery floor for interrupted,
unsaved prose in the accepted Project Spine. When this record becomes
effective, Package 19.12 closes recovery truth and the author-facing recovery-
decision behavior only. It does not close Stage 19, complete V1.0, or admit
broader history, backup, restore, repair, packaging, or Command Center recovery
capability.

The closure audit began from a clean synchronized repository:

- local `HEAD` and upstream both resolved to
  `ad3b41724b4514f28744707a1ce59013ee3c9782`;
- ahead/behind was `0/0`;
- the authorization reconciliation was committed at that boundary; and
- the worktree was clean before this record was created.

The accepted implementation boundary is
`67e250bca5efcaf59248e91cf14df9f6a203b7f3`. The later `ad3b417` record
reconciles repository authority with Jason's already-issued mutation-by-
mutation authorization; it is not an additional runtime mutation.

## 2. Controlling authority inspected

This closure was checked against:

- `current_truth_index.md`;
- `current_product_roadmap.md`;
- `stage19_v1_master_implementation_and_acceptance_plan.md`;
- `stage19_v1_scope_lock.md`;
- `stage19_package_19_12_scope_and_inspection.md`;
- `stage19_package_19_12_authorization_reconciliation.md`; and
- `stage19_packages_19_9_through_19_11_closure.md`.

Together those records establish the following controlling position:

- Stage 19 remains open and is governed by the approved Package 19.12 through
  Package 19.22 sequence;
- Package 19.12 is `history/recovery/interruption safety`, depends on Packages
  19.10 and 19.11, and exits on accepted project-scoped recovery accept/reject;
- recovery must never silently replace the last durable save and must remain
  isolated to its originating project;
- the Package 19.12 scope record fixed the boundary but did not authorize
  runtime work;
- Jason later authorized each bounded mutation during active orchestration;
- automated and manual Package 19.12 acceptance is complete; and
- formal closure remains pending this record's effective commit and push.

No controlling-authority contradiction remains after the committed
authorization reconciliation.

## 3. Implemented scope

### 3.1 Main-owned recovery persistence

Package 19.12 provides one main-owned, Project-Spine-native recovery repository
for prose checkpoints. The artifact is project-local and separate from durable
manuscript drafts. Atomic replacement preserves a prior valid artifact when a
replacement fails and confines temporary-file cleanup to the recovery seam.

The repository validates:

- recovery envelope and candidate schema versions;
- durable project identity;
- normalized canonical project path;
- manuscript-unit identity;
- durable-baseline content fingerprint;
- prior-session identity, generation, and revision provenance;
- candidate version and exact decision/deletion correlation; and
- candidate content, including an empty string as valid prose.

Corrupt, incomplete, unsupported, cross-project, wrong-path, unknown-unit,
baseline-mismatched, stale-version, and wrong-session evidence is never applied
to manuscript truth. Destructive cleanup fails closed and preserves evidence
when exact correlation or filesystem mutation fails.

### 3.2 Checkpoint capture and lifecycle

Writing Studio coalesces local prose checkpoints for 750 ms and force-flushes
the submitted buffer before normal Save and guarded-close decisions. Main binds
capture to the active project, canonical path, current generation, known unit,
durable baseline, session, and candidate-version sequence.

Project and generation transitions cancel or reject stale capture. Project A
evidence cannot surface or mutate Project B. A successful Save retires only the
candidate matching the submitted prose. If a newer local edit exists, the
recovery candidate is rebased to that edit instead of being erased. Save,
checkpoint, and cleanup failure preserve the live dirty buffer and the last
durable manuscript.

### 3.3 Detection and author decision behavior

Main detects and validates prior-session evidence only after authoritative
project activation establishes durable identity and path. Writing Studio alone
receives the recovery decision and recovered prose. It presents explicit accept
and reject actions bound to the exact candidate.

Acceptance moves recovered prose into Writing Studio as dirty local content.
It does not mutate durable manuscript files. Normal Save remains the only path
that makes accepted recovery durable. Rejection preserves the durable baseline
and removes only the exactly correlated candidate. Mixed or unresolved
decisions remain fail-closed until the accepted set can be rebound atomically.

### 3.4 Surface and interruption boundary

Command Center remains non-mutating. It receives no recovery mutation methods
and no recovered prose. Package 19.12 does not claim a Command Center recovery
projection; that integrity/projection proof remains Package 19.13 work if
separately authorized.

Permanent Electron coverage proves abnormal process interruption and
fresh-process recovery. Same-main-process renderer restoration remains an
explicit exclusion and is not substituted for fresh-process proof.

## 4. Authority and ownership model

| Concern | Owner | Accepted boundary |
| --- | --- | --- |
| Recovery artifact | Main recovery repository | Owns project-local atomic read/write/validation and never writes manuscript drafts. |
| Checkpoint and candidate lifecycle | Main recovery checkpoint service | Owns capture, prior-session detection, accept/reject persistence, Save retirement/rebase, and exact cleanup. |
| Active recovery state | Main project-session coordinator | Owns project/generation binding, decision state, and role-projected recovery truth. |
| IPC authority | Main Project Spine IPC | Validates caller role, active identity, generation, unit, and exact candidate correlation. |
| Bridge capability | Preload/shared Project Spine contract | Exposes checkpoint and decision methods only to Writing Studio and omits them from Command Center. |
| Live prose and author choice | Writing Studio renderer | Owns local buffers, 750 ms scheduling, explicit decisions, and application of accepted prose as dirty local content. |
| Durable manuscript | Existing Project Spine repository and normal Save | Remains the last confirmed save until the author separately invokes Save. |
| Command Center | Read-only supporting surface | Receives neither recovered prose nor checkpoint, accept, reject, restore, Save, or cleanup authority. |

## 5. Accepted implementation and acceptance commits

| Commit | Title | Accepted boundary |
| --- | --- | --- |
| `3253a00243609fa3a5e033468ff6e93de7d23086` | `feat(stage19): add recovery candidate repository` | Main-owned project-local atomic repository, validation, exact deletion, failure preservation, and focused repository tests. |
| `0f5280bfd46e26de445192cf876ca13f1460050c` | `feat(stage19): add prose recovery checkpoint capture` | Project/generation-bound capture, 750 ms renderer coalescing, forced flushes, Save retirement/rebase, bridge integration, and focused tests. |
| `60a8ec7f65dfbf6bcd0ecd31981f067e7b581fe5` | `feat(stage19): add explicit prose recovery decisions` | Prior-session detection, Writing Studio-only explicit accept/reject, dirty-local acceptance, exact cleanup, and focused tests. |
| `67e250bca5efcaf59248e91cf14df9f6a203b7f3` | `test(stage19): add recovery interruption acceptance` | Permanent abnormal-interruption, fresh-process recovery, isolation, degraded-evidence, renderer-loss-boundary, and cleanup acceptance tests. |

The authorization provenance for those independently reviewed mutations is
recorded by `stage19_package_19_12_authorization_reconciliation.md` at
`ad3b41724b4514f28744707a1ce59013ee3c9782`.

## 6. Automated evidence

### 6.1 Focused Package 19.12 suites

The accepted focused command covered exactly:

- `main/__tests__/projectSpineRecoveryRepository.test.ts`;
- `main/__tests__/projectSpineRecoveryCheckpoints.test.ts`;
- `main/__tests__/projectSessionCoordinator.test.ts`;
- `main/__tests__/projectSpineIpc.test.ts`;
- `main/__tests__/splitCommandPreload.test.ts`;
- `main/__tests__/splitCommandSecondaryLaunchHook.test.ts`; and
- `renderer/__tests__/Stage19WritingSpineApp.test.tsx`.

Current closure-audit result:

```text
Test Files  7 passed (7)
Tests       115 passed (115)
```

This aggregate directly covers repository validation and atomicity, capture and
decision lifecycle, project/generation isolation, role-bound bridge exposure,
750 ms checkpointing and forced flushes, Save retirement/rebase, failure
preservation, dirty-local acceptance, and Command Center exclusion.

### 6.2 Build evidence

The closure audit independently verified:

- `pnpm --filter app run build:main` — passed;
- `pnpm --filter app run build:renderer` — passed; and
- `pnpm --filter app run build:production` — passed.

These are development/production build checks. They are not installer,
packaged-application, or release-candidate acceptance.

### 6.3 Recovery Electron evidence

`stage19-recovery.spec.ts` contains five permanent Electron tests:

1. accept two interrupted candidates, protect their durable baselines, Save,
   and reopen cleanly;
2. reject an interrupted candidate without changing or reoffering its durable
   baseline;
3. isolate projects and preserve unresolved decisions across clean close;
4. preserve corrupt evidence as a Writing-Studio-only degraded state; and
5. preserve checkpoint evidence through renderer loss and a fresh-process
   restart.

Accepted closure-audit result:

```text
5 passed
```

### 6.4 Combined Stage 19 Electron evidence

The four permanent Project Spine Electron tests and five recovery tests were
run together with one worker.

Accepted closure-audit result:

```text
9 passed
```

The accepted run includes the existing clean-exit and process-ID cleanup
assertions. A post-run process inspection found `electron_process_count=0`.
No orphan Electron process remained in the accepted automated proof.

### 6.5 Repository verification

The closure pass verified:

- `git diff --check` — passed; and
- an explicit whitespace check of this new untracked record — passed.

The closure record is the only worktree change.

### 6.6 Audit-run classification

Two non-accepted diagnostic runs are recorded rather than hidden:

- a sandboxed recovery run could not create its first window because sandbox
  policy blocked AppData log writes and Chromium GPU startup; the same five-test
  suite passed outside that sandbox and the blocked run is not product evidence;
- the first combined rerun reported one PID still alive at its bounded cleanup
  poll; immediate inspection found that PID had exited, and a complete rerun
  passed 9/9 with zero Electron processes afterward. The failed timing run is
  not the accepted proof and is retained as a non-blocking harness observation.

## 7. Manual acceptance receipt

Receipt owner: Jason

Receipt recorded for this closure audit: 2026-07-14

### 7.1 Accept workflow manually proved

Jason manually proved:

- two durable baselines;
- two distinct unsaved checkpoints;
- abnormal process-tree interruption;
- recovery choices appearing only in Writing Studio;
- Command Center remaining passive;
- explicit recovery acceptance;
- recovered prose becoming dirty local content;
- durable baselines remaining protected before Save;
- Keep editing preserving both windows and recovered prose;
- normal Save making recovered prose durable; and
- clean reopen showing saved prose with no recovery prompt.

### 7.2 Reject workflow manually proved

Jason manually proved:

- empty durable prose as a valid baseline;
- a distinct unsaved checkpoint;
- abnormal interruption;
- explicit rejection;
- preservation of the empty durable baseline;
- the recovery prompt not returning; and
- clean reopen.

### 7.3 Manual evidence limit

The manual receipt does not claim that Jason repeated Project A/B isolation,
unresolved-decision persistence, corrupt-artifact degradation, renderer-loss
recovery, every race, or every process-cleanup assertion. Those are permanent
automated evidence only.

## 8. Evidence classification

| Evidence | Classification | What it proves | Limit |
| --- | --- | --- | --- |
| Seven focused files / 115 tests | Current automated evidence | Main repository, lifecycle, IPC/preload, renderer, isolation, failure, and ordering contracts. | Does not prove an installed or packaged application. |
| Five recovery Electron tests | Current permanent automated evidence | Real built-app interruption, accept/reject, isolation, corrupt evidence, and fresh-process recovery behavior. | Automated evidence only for isolation, corrupt evidence, renderer loss, and unresolved decisions. |
| Combined nine Stage 19 Electron tests | Current integration evidence | Recovery remains compatible with the accepted Project Spine and clean-exit matrix. | Does not expand Package 19.12 into later packages. |
| Main, renderer, and production builds | Current build evidence | Source compiles and the built renderer/main production entries are generated. | No installer, packaging, clean-install, or release-candidate claim. |
| Jason accept receipt | Manual author-facing evidence | Explicit acceptance, dirty-local recovery, baseline protection, Keep editing, Save, and clean reopen. | Does not manually prove automated-only scenarios. |
| Jason reject receipt | Manual author-facing evidence | Empty-baseline validity, explicit rejection, baseline preservation, no repeated prompt, and clean reopen. | Does not manually prove automated-only scenarios. |
| Git history and authorization reconciliation | Repository authority evidence | Exact incremental commits and their separate human authorization. | Does not itself close the package. |

## 9. Defects found and corrected during implementation and review

The repository does not maintain a separate Package 19.12 defect ledger. The
accepted incremental commits and final regression names establish these
in-scope corrections without inventing additional defect history:

1. **Unsafe recovery replacement or cleanup:** atomic replacement now preserves
   the prior valid envelope, exact candidate-set deletion prevents partial
   cleanup, and filesystem cleanup failure preserves evidence and blocks the
   action.
2. **Save erasing newer recovery truth:** Save retirement now correlates to the
   submitted prose; a newer edit is rebased to a newer candidate instead of
   being retired by an older Save completion.
3. **Stale or partial recovery decisions:** accept/reject now correlates project,
   path, unit, baseline, prior session, and candidate version; partial or stale
   decision cleanup fails closed, and accepted sets are rebound atomically.
4. **Surface-authority leakage:** checkpoint and decision methods are exposed
   only to Writing Studio, recovery prose is withheld from Command Center, and
   main validates role rather than trusting renderer presentation.
5. **Weak interruption proof:** permanent Electron tests now use abnormal
   process interruption, fresh-process restart, exact role/window identity,
   durable reopen, and explicit PID cleanup checks rather than same-main
   renderer restoration as a substitute.

No unresolved defect in the accepted Package 19.12 boundary is classified as a
closure blocker by this audit.

## 10. Known non-blocking observations

| Observation | Classification | Resolution home and reopening trigger |
| --- | --- | --- |
| Existing Vitest `MaxListenersExceededWarning` | Non-blocking known test-runner observation; reproduced while all 7 files and 115 tests passed. | Package 19.17 automated regression program. Reopen earlier if it causes a test failure, leak, flake, hang, or masks a real rejection/exception. |
| DevTools Autofill protocol noise | Non-blocking known Chromium/DevTools observation; outside Package 19.12 recovery truth. | Package 19.16 failure/dependency audit. Reopen if it becomes writer-visible, changes behavior, or masks an acceptance assertion. |
| Optional bundled Python path warning when the optional service is absent | Non-blocking known optional-service observation; the core recovery path does not depend on Python. | Package 19.16 dependency/failure audit. Reopen if optional-service absence blocks core writing/recovery or the warning becomes a user-facing failure. |
| Same-main renderer restoration | Explicit Package 19.12 exclusion, not missing accepted evidence; fresh-process recovery is the accepted boundary. | Package 19.16 failure/window audit. Reopen only if that audit classifies same-main restoration as required for the V1 failure-safety floor. |
| First combined audit rerun observed a bounded PID-exit timing miss | Non-blocking harness timing observation; the PID had exited on immediate inspection, the complete rerun passed 9/9, and final process count was zero. | Package 19.17 automated regression program. Reopen earlier if the timing miss repeats, leaves a real orphan, or becomes run-order dependent. |

None of these observations authorizes a Package 19.12 runtime or test repair in
this closure pass.

## 11. Explicit exclusions

Package 19.12 does not claim or deliver:

- structural recovery;
- full project history, history browsing, or multi-version retention;
- backup management;
- import or migration;
- restore-in-place, restore-as-current, or full-project rollback;
- automatic repair or automatic rollback;
- snapshot diff/merge UI or generalized version control;
- cloud sync or connector behavior;
- AI-assisted recovery;
- Command Center recovery projection, recovery prose, or mutation controls;
- Package 19.13 behavior;
- same-main-process renderer restoration;
- installer, clean-install, packaged-release, or release-candidate acceptance;
- protected-evidence use; or
- Stage 19 or V1.0 closure.

Historical service-owned recovery, snapshot, restore, and synthetic harness
paths remain reference-only or historical relative to the accepted Project
Spine. This record does not promote them into current recovery authority.

## 12. Package 19.13 handoff

The master plan names Package 19.13 **Command Center integrity**. Once this
record becomes effective, Package 19.12 closes recovery truth and author
decision behavior only. Package 19.13 remains separate and is expected to prove
truthful, non-mutating, project-scoped Command Center integrity and projection
without receiving recovered prose or mutation authority.

Package 19.13 is next only after this Package 19.12 closure record becomes
effective. Package 19.13 does not become authorized merely because Package
19.12 closes. Packages 19.14 through 19.22 remain pending, and Package 19.22
remains the final V1.0 closure/release boundary requiring Jason release
authorization.

## 13. Closure conditions, authorization boundary, and effective commit

Package 19.12 is formally closed only when this closure record is committed and pushed.

At the current uncommitted working-tree boundary, formal Package 19.12 closure
has not yet become effective. The effective closure commit will be the future
user-created commit that adds this exact record, once that commit is pushed to
the synchronized upstream branch. `67e250b` remains the accepted implementation
boundary and `ad3b417` remains the authorization-reconciliation boundary; neither
is represented as the effective closure commit.

This record authorizes no additional runtime, test, dependency, packaging, or
later-package mutation. It does not authorize a branch change, commit, push, or
Package 19.13 work by Codex.

Stage 19 remains open.

Package 19.13 is next in the approved sequence.

Package 19.13 requires separate Jason authorization.

This closure does not authorize Package 19.13 implementation.

The Package 19.12 implementation, permanent automated evidence, accepted
Electron matrix, bounded manual accept/reject receipt, and reconciled human
authorization satisfy the documented Package 19.12 exit gate. Subject to the
effective commit-and-push condition above, no remaining in-scope blocker is
known.
