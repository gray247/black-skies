# Program 3 Batch P3-A Evidence Receipt

## 1. Status And Boundary

- Batch: `P3-A - Contracts, evidence truth, and concurrency prerequisite`
- Status: `IMPLEMENTATION AND AUTOMATION COMPLETE; AUTHOR COMMIT/PUSH REQUIRED`
- Started from exact pushed baseline:
  `6991bfaeef96693a9423d0aee49274ad54660d7b`
- Branch: `codex/foundation-audit`
- Model and effort: `GPT-5.6 Sol`, `xhigh`
- Human product validation: `NOT REQUIRED IN PROGRAM 3`
- Git control: `Jason alone stages, commits, and pushes`
- Protected evidence: `NOT USED`
- Provider calls, credentials, and paid operations: `NOT USED`

This receipt closes only the implementation and automated-evidence portion of
P3-A. It does not claim a clean exact candidate while the batch is uncommitted.
P3-A becomes durable after Jason commits and pushes this bounded file set.
P3-B must not begin before that checkpoint is confirmed.

## 2. Implemented Outcomes

### 2.1 Contextual-shell contracts

`app/shared/ipc/contextualProductShell.ts` now defines versioned internal
contracts for:

- Writing and Command logical surfaces;
- manuscript and six-family Command workspaces;
- physical placement independent of logical surface;
- a source return anchor containing identity, revision, location, and
  fingerprint evidence but no prose;
- sanitized completed and bounded terminal Critique Review projections;
- exact first-slice Review actions; and
- one narrow owner-routed Feedback Note action carrying no generic manuscript,
  outline, project-path, provider-payload, or accepted-truth mutation bridge.

These contracts establish language for later batches. They do not yet render a
new shell, route a Command action, or replace an existing state owner.

### 2.2 Deterministic Review fixtures

Deterministic fixtures cover completed, failed, cancelled, expired, and
invalidated Review states. They prove the allowed-action boundary and the
absence of credentials, selected prose, hidden context, provider request
payloads, manuscript drafts, and outline truth. No fixture calls a provider.

### 2.3 Feedback Note write serialization

Feedback Note creates now serialize by normalized project-local sidecar path
across separate repository instances. The complete read-create-atomic-write
operation runs inside that queue. A failed write is returned honestly and does
not poison the next queued write. Lists wait for an accepted in-process create
queue before reading.

Deterministic evidence starts twenty-four creates through twenty-four repository
instances and proves all twenty-four uniquely identified notes survive in
accepted order. Separate evidence proves that a synthetic failed rename does
not claim success, does not create a note, and does not prevent the next queued
create from succeeding. Existing malformed-data and cross-project isolation
evidence remains green.

### 2.4 Truthful supported-core coverage receipt

The supported-core manifest and receipt are versioned to v2. The percentage is
now explicitly labeled `Python supported core`. Only the five Python owners are
inside that measured denominator. Three TypeScript owners remain explicitly
listed as `verifiedOutsidePercentage` with their behavioral verification files;
they are no longer visually presented beside a percentage that did not measure
them.

The policy verifier fails closed when:

- the schema or percentage label changes unexpectedly;
- a measured entry lacks a Python module;
- a behavior-only entry claims Python measurement;
- a path or its verification file is missing; or
- the required exclusions and reopening triggers are incomplete.

## 3. Automated Evidence

### Focused boundary

- current-authority documentation lint: passed; 35 files and local links
  verified;
- full application TypeScript boundary: passed;
- both first-party and active Stage 19 zero-warning lint lanes: passed;
- contextual-shell contract, Feedback Notes repository, and Feedback Notes IPC
  suites: 3 files passed, 13 tests passed;
- foundation inventory and coverage policy verifier: passed;
- diff hygiene: passed.

### Supported-core coverage

- exact interpreter: Python `3.11.9` from the governed foundation environment;
- tests: 96 passed, zero failures, errors, or skips;
- minimum Python supported-core branch coverage: 60%;
- measured Python supported-core branch coverage: 81.913499344692%;
- generated receipt schema:
  `black-skies.foundation-supported-core-coverage-receipt.v2`;
- generated receipt remained temporary evidence and introduced no repository
  artifact.

The ordinary host `python` command resolved to Python 3.13.7 and was rejected by
the runner before test collection, as required. Re-running with the repository's
governed Python 3.11 environment passed. This was an environment preflight, not
a product defect.

### Full fixed regression

The existing fixed regression ran with its explicit dirty-development override:

- repository hygiene: passed;
- foundation inventory and coverage policy: passed;
- Git diff hygiene: passed;
- packaging-workflow policy: passed;
- both lint lanes: passed;
- full TypeScript: passed;
- production renderer and main-process build: passed;
- critical unit, component, and contract matrix: 37 files passed, 621 tests
  passed, 2 existing policy skips;
- critical built-Electron matrix: 22 journeys passed; and
- final status: `STAGE19_REGRESSION_PASS`,
  `worktree=DEVELOPMENT_OVERRIDE`, `protectedEvidence=NOT_USED`.

This development run is not represented as clean release-candidate or installed
package qualification.

## 4. Findings Disposition

| Finding | P3-A disposition |
| --- | --- |
| `ARC-H1` Feedback Note lost-update risk | Implementation and deterministic evidence complete; durable closure waits for this batch's author commit/push |
| `TST-G1` misleading supported-core denominator | v2 policy and receipt implemented and passing; durable closure waits for this batch's author commit/push |
| `TST-P3-03` multi-surface concurrency evidence | Repository-instance concurrency, isolation, malformed data, and write-failure recovery are green; later Command owner routing remains P3-F scope |
| `ARC-P3-03` Review projection and source return | Contracts and sanitized fixtures established; runtime projection, role routing, and source-return behavior remain P3-F scope |
| `ARC-P3-05` active TypeScript boundary | New shared contracts pass full typecheck; complete shell-source coverage remains a through-Program-3 obligation |

## 5. Explicit Non-Claims And Deferrals

P3-A did not:

- change the visible GUI;
- enable Command Center note creation;
- create a general state framework or mutation bus;
- move, delete, archive, or clean legacy code;
- implement the renderer controller/view seam;
- implement surface switching or monitor recovery;
- build edge rails, the revised Living Outline, Review workspace, Companion, or
  Emotion Graph;
- qualify long-manuscript intake or automatic chapter discovery;
- contact an AI provider; or
- run installer or installed-offline qualification.

Those items retain their exact Program 3 or later-program owners.

## 6. Git Checkpoint And Next Action

Jason should review the bounded status, stage the P3-A file set, run cached diff
hygiene, commit, and push. After the pushed commit is confirmed, P3-A is durable
and P3-B is the next automated batch: behavior-locked controller and view seam.
No hands-on product review is due at this checkpoint.
