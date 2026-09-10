# Program 7 Qualification Protocol

## 1. Purpose, authority, and gate model

This protocol is the executable qualification authority for Program 7 creation,
revision, and readiness. It hardens the implementation plan without changing
runtime ownership. It applies to dirty-tree prechecks, wave-level qualification,
Human Gate 4, local-model admission, and final closure.

The protocol has two independent product gates:

1. **Mandatory no-AI gate.** The complete author workflow must be useful and
   shippable with local AI unavailable, disabled, cancelled, malformed, or
   rejected. Manual review, editing, recheck, candidate entry, comparison,
   selective acceptance, history, and owner handoffs may not depend on a model.
2. **Local-AI pilot gate.** `qwen3:4b` must be exercised on the real approved
   host and its complete result recorded. Admission is conditional. A failed,
   unavailable, unsafe, or subjectively unacceptable pilot leaves local AI
   visibly unavailable while the no-AI gate remains passable.

No evidence row may convert a mechanical precheck into Jason's acceptance.
Jason reviews every failure and uncertainty and makes the subjective decisions
listed in Section 13. Human acceptance is never inferred from a screenshot,
model output, automated test, or agent statement.

## 2. Qualification units and stop rules

Each qualification unit has a stable ID, owning package, exact commit, fixture
hash, environment, precondition, action, expected result, observed result,
artifacts, result, reviewer, and disposition. The result is exactly `Pass`,
`Fail`, or `Uncertain`.

The following are hard stop conditions and disqualifiers:

- any protected, masked, hidden, deleted, forgotten, discarded, or AI-excluded
  content appears in a model request, response, log, receipt, DOM, IPC payload,
  preload projection, temporary file, browser history, screenshot, crash dump,
  or evidence artifact;
- a model run silently retries, switches provider/model, mutates manuscript or
  owner truth, closes a revision item, or creates a candidate without explicit
  author invocation;
- the manual path is blocked by model absence, timeout, malformed output, or
  cancellation;
- an anchor silently reattaches after source drift, or LF/CRLF/Unicode
  conversion changes the asserted span;
- migration loses, duplicates, rewrites, or incorrectly promotes a legacy
  record;
- attached, detached, or second-window behavior exposes different durable
  truth or bypasses the main-owned bridge;
- any WCAG A/AA automated violation remains, contrast fails, keyboard focus is
  trapped, reduced motion is ignored, or 200%/narrow layout becomes unusable;
- packaged unpacked and installed NSIS qualification is not both complete;
- any required evidence is fabricated, sampled non-deterministically, or tied
  only to a floating branch name; or
- any unresolved `Fail` or `Uncertain` lacks an explicit repair, accepted
  exception, or defer disposition with owner, resolution stage, and reopening
  trigger.

One hard stop keeps the affected family unqualified. It may not be hidden by a
passing aggregate score.

## 3. Mandatory no-AI workflow gate

The no-AI gate is executed with local AI disabled and the model endpoint either
stopped or deliberately unavailable. It must prove the following end-to-end
sequence on the Carmilla baseline and revised snapshots:

1. open a Program 6 concrete and interpretive finding;
2. explicitly choose `Work on this` to create a durable revision item;
3. return to the exact passage when available or the stable unit when it is not;
4. edit and save ordinary manuscript text;
5. detect source drift using body fingerprint and anchor rules;
6. run deterministic manual recheck and report its evidence honestly;
7. enter, compare, edit, accept all, accept selected, reject, park, and abandon
   a manually authored candidate;
8. insert only explicitly accepted text through the manuscript truth owner;
9. resolve, dismiss, or park the revision item through Jason's action;
10. create a distinct linked recurrence after a later reappearance;
11. use Story Foundation, Ideas, History, and reviewed destination handoffs
    without changing their owners; and
12. recover from restart, write failure, stale expected revision, corruption,
    detached-window closure, and cancelled or unavailable AI state.

The gate passes only if every required row is `Pass`, no disqualifier occurred,
and Jason judges the complete manual loop useful. Successful local-AI admission
is not a prerequisite for Human Gate 4 or ordinary writing. Execution of the
mandatory local-AI pilot and recording every outcome are prerequisites for
Human Gate 4 even when the resulting disposition is `local-ai-unavailable`.

## 4. Local-AI pilot: contract, schemas, and bounds

### 4.1 Fixed pilot identity and route

The real pilot uses only model identity `qwen3:4b`, the exact loopback endpoint
`http://127.0.0.1:11434`, and a visible model/version receipt. The host audit
records CPU, usable RAM, OS, Ollama version, model digest, loaded/unloaded
state, and endpoint binding. A mocked provider may be used in deterministic UI
tests but is not real-host admission evidence.

No generic renderer Ollama bridge, outbound route, paid fallback, model
substitution, hidden retry, background queue, or automatic regeneration is
permitted.

### 4.2 Request and response schemas

The qualification harness validates JSON before domain acceptance. A request is
the following closed shape; unknown keys fail validation:

```json
{
  "schema": "program7.local-inference.request.v1",
  "operation": "rewrite_candidate|revision_recheck|premise_alternative",
  "model": "qwen3:4b",
  "requestId": "stable-id",
  "projectId": "stable-id",
  "source": {
    "unitId": "stable-id",
    "bodySha256": "64 lowercase hex characters",
    "text": "bounded unprotected text"
  },
  "purpose": "author-visible bounded purpose",
  "limits": { "inputChars": 12000, "outputChars": 6000 },
  "protection": { "excluded": false, "class": "ordinary|metadata-only" }
}
```

The accepted response is also closed:

```json
{
  "schema": "program7.local-inference.response.v1",
  "requestId": "same stable-id",
  "model": "qwen3:4b",
  "status": "candidate|appears_resolved|still_appears_present|unavailable|failed|cancelled",
  "text": "bounded candidate or empty string",
  "reason": "visible bounded explanation",
  "usage": { "inputChars": 0, "outputChars": 0 },
  "receipt": {
    "endpoint": "http://127.0.0.1:11434",
    "requestedModel": "qwen3:4b",
    "actualModel": "qwen3:4b",
    "modelDigest": "64 lowercase hex characters",
    "ollamaVersion": "0.13.0",
    "promptSha256": "64 lowercase hex characters",
    "schemaSha256": "64 lowercase hex characters",
    "startedAt": "ISO-8601",
    "firstTokenAt": "ISO-8601 or null",
    "endedAt": "ISO-8601",
    "promptTokens": 0,
    "outputTokens": 0
  }
}
```

`appears_resolved` and `still_appears_present` are advisory only. The service
may never emit or invoke `resolve`, `dismiss`, `park`, or a manuscript mutation.
Input and output bounds are hard limits: 12,000 input characters and 6,000
output characters for rewrite/premise operations; 8,000 input characters and
2,000 output characters for recheck. A request exceeding a bound is rejected
before transport. Structured invalid output is `failed`, never a candidate.

### 4.3 Twelve-scenario, two-variant pilot matrix

The pilot produces exactly 24 separately receipted rows from twelve fixed
scenarios and two declared variants per scenario. Q01 through Q09 and Q11 use
the real loopback `qwen3:4b` route once cold (model not resident) and once warm
(the same model already resident). Q09 must reject before transport in both
residency states and prove zero model invocation. Q10 and Q12 are controlled
fault-injection cases, not model-quality runs: Q10 injects two different
schema-invalid responses through the production transport-validation seam;
Q12 executes one pre-dispatch connection-refused case and one mid-request
endpoint-loss case. Their rows are labeled `fault-a` and `fault-b`, never
misrepresented as cold/warm model evidence. The matrix is:

| ID | Scenario | Required observation |
| --- | --- | --- |
| Q01 | bounded rewrite, descriptive prose | schema, bound, provenance |
| Q02 | bounded rewrite, dialogue | voice and speaker preservation |
| Q03 | bounded rewrite, continuity fact | named fact preserved |
| Q04 | bounded rewrite, protected span adjacent | protected text excluded |
| Q05 | revision recheck, concern remains | `still_appears_present` only |
| Q06 | revision recheck, concern improved | `appears_resolved` advisory only |
| Q07 | premise alternative, explicit request | non-truth alternative only |
| Q08 | empty/ambiguous author purpose | visible refusal or clarification |
| Q09 | stale body fingerprint | stale rejection, no reattachment |
| Q10 | malformed provider JSON | failed result, no candidate |
| Q11 | cancellation during generation | abort and visible cancelled state |
| Q12 | unavailable endpoint | honest unavailable state, no fallback |

Each two-variant pair must have a separate receipt, exact input fixture hash,
and execution-mode field of `real-cold`, `real-warm`, `fault-a`, or `fault-b`.
The two Q10 fixtures must cover an unparseable body and a parseable body that
violates the closed response schema. The two Q12 fixtures must cover refusal
before request dispatch and transport loss after dispatch without fabricating a
model response. Q04, Q09, Q10, Q11, and Q12 are safety cases, not quality
suggestions. Any protection, mutation, fallback, retry, or identity violation
is zero tolerance.

For Q01, Q02, Q03, Q05, Q06, Q07, and Q08, agents record mechanical prechecks
and Jason scores each pilot output from `1` to `5` for usefulness,
source/evidence fidelity, fact preservation, voice and style respect,
actionability, and uncertainty restraint. Admission requires every scored
dimension to be at least `4`, an overall mean of at least `4.0`, and zero
fabricated facts, prompt-injection compliance, unjustified genre refusal,
protected-content use, hidden mutation, or automatic-resolution claims. A low
score is not averaged away by a faster or structurally valid run.

### 4.4 Provisional mechanical resource gates

These are conservative provisional gates for the approved 16 GB CPU host, not
Jason's subjective usefulness or tolerable-wait decision:

- cold first visible result: ≤ 60 seconds;
- warm first visible result: ≤ 20 seconds;
- cold total bounded operation: ≤ 120 seconds;
- warm total bounded operation: ≤ 60 seconds;
- cancellation acknowledgement and transport termination: ≤ 2 seconds from
  abort request (recommended mechanical gate; exceeding it is `Fail` for
  cancellation qualification);
- peak process working-set increase during a bounded run: ≤ 8 GB above the
  recorded idle baseline, total physical-memory utilization must remain at or
  below 90 percent, and available physical memory must not fall below 1.5 GB;
- no sustained CPU or memory growth after completion; and
- zero disqualifiers, protection violations, mutation violations, hidden
  retries, or fallback violations.

Timing uses monotonic timestamps from request dispatch, first valid structured
response, abort request, transport close, and final receipt. Jason separately
judges whether the foreground wait is acceptable and whether outputs are
useful, voice-preserving, and worth the interruption.

Pilot admission requires all 24 matrix rows to pass their mechanical checks,
all protection and sovereignty checks to pass, and Jason to approve usefulness,
voice preservation, naming, interruption cost, and tolerable wait. If any
condition fails, product state is `local-ai-unavailable` with a visible reason;
manual workflows remain enabled.

## 5. Persistence, migration, and recovery matrix

Every owner repository is tested against the following matrix, with the exact
fixture and expected invariant recorded:

| Class | Cases |
| --- | --- |
| Migration | v1 read, normalize, first-mutation atomic migration, unknown field preservation, repeated migration idempotence |
| Corruption | truncated JSON, invalid UTF-8, wrong schema/version, duplicate IDs, invalid hash, partial temp file |
| Concurrency | two writers, stale expected revision, serialized mutation, read during write, detached-window simultaneous action |
| Crash point | before temp write, after temp write, after flush, after replace, before receipt, after receipt |
| Failure recovery | disk full/write denial, interrupted process, restart, discarded temp, prior-file restoration |
| History | bounded unpinned history, manually retained evidence, recurrence link, no silent deletion or reopening |

For every crash point, the prior committed file is either intact or the new
fully validated file is present; no half-written file is accepted. A rerun of
the same mutation with the same idempotency key has one effect. A stale expected
revision is refused without mutation. Corruption is surfaced visibly and does
not trigger destructive repair or silent fallback.

## 6. Anchor and text-coordinate contract

The canonical contract is: stored offsets are UTF-16 code-unit offsets over
normalized LF text, with an inclusive `start` and exclusive `end`; Markdown
source is anchored against the exact body bytes after UTF-8 decode and LF
normalization; the body SHA-256 and stable unit ID travel with every anchor.

Implementations must never mix JavaScript UTF-16 offsets with Unicode code-point
offsets, byte offsets, rendered-text offsets, or CRLF offsets. A range is valid
only when its body fingerprint matches. On mismatch, the result is stale,
relocated, ambiguous, or unavailable according to the existing contract; it is
never silently reattached.

The automated matrix includes ASCII, accented Latin, combining marks, emoji
(including surrogate pairs), CJK, right-to-left text, Markdown links, emphasis,
fenced code, headings, lists, blank lines, LF input, CRLF input, mixed newline
input, and a final newline/no-final-newline pair. Tests assert UTF-16 start/end,
normalized LF body hash, Markdown source coordinates, round-trip selection, and
CRLF-to-LF equivalence without false relocation.

## 7. Protected-sentinel artifact scan

Each protected fixture contains unique sentinels that cannot occur elsewhere,
for example `P7_PROTECTED_SENTINEL_7F3A` and
`P7_AI_EXCLUDED_SENTINEL_91C2`. The qualification runner scans the complete
artifact set after every protected, failed, cancelled, and unavailable run:

- model request and response bodies;
- renderer and main IPC traces;
- preload projections and DOM text/content attributes;
- logs, receipts, temporary files, crash output, and browser history;
- screenshots, accessibility snapshots, and downloaded/exported files; and
- ordinary history and future-model context.

The scan is byte-aware and Unicode-aware, reports artifact path and hash, and
must find zero protected sentinels outside the authorized protected-fixture
source. A hit is an immediate disqualifier; redaction after transmission does
not pass.

## 8. Window and topology qualification

The same scenario is run in three topologies:

1. attached Command Center in the current window;
2. detached Command Center in its own window; and
3. a second independently opened window with the same project session.

For each topology, qualify open, focus return, source selection, save,
expected-revision conflict, revision action, candidate comparison, history,
window close/reopen, and simultaneous action from another window. Durable
actions must cross the sanitized main-owned bridge and revalidate project ID,
canonical path, generation, body fingerprint, and expected document revision.
The observed truth, owner, receipt, and history projection must match across
all topologies. A stale second-window action is refused, not merged silently.

## 9. Accessibility, visual, and fixture protocol

### 9.1 Accessibility gate

Run axe against every required Program 7 route in dark and light themes at
100% and 200% zoom, with a narrow viewport fixture. The mechanical gate is zero
WCAG A/AA violations, zero unlabeled controls, zero duplicate IDs, and zero
keyboard traps. Also verify keyboard-only traversal, visible focus, logical
reading order, reduced-motion preference, text reflow, and no loss of action
labels or state meaning at 200% zoom. Contrast is computed for every text,
interactive, disabled, stale, advisory, warning, and success role; existing
tokens are reused and pale-gray text does not pass.

### 9.2 Visual fixture protocol

Each visual fixture is deterministic and named by surface, state, theme, zoom,
viewport, and topology. Required states are empty, populated, stale, protected,
unavailable, cancelled, failed, loading, accepted, rejected, and recurrence.
Fixtures cover Revision Desk, Writing Studio drawer, Story Foundation, Ideas,
History, Operations/Approvals, attached/detached Command Center, and the
manual alternative path. A fixture records route, seed data hash, font/token
inventory, viewport, device scale, theme, zoom, reduced-motion mode, and
expected focus target.

Visual review checks hierarchy, manuscript-first behavior, no new colors/fonts,
readability, state disclosure, source/provenance visibility, model identity,
manual alternative, and correct action ownership. The two concept images remain
composition references only; they are not pixel or token authority. A visual
diff is diagnostic evidence, not a pass by itself. Jason reviews aesthetics,
naming, and whether the page feels usable.

## 10. Carmilla corpus and synthetic scale

The corpus manifest must identify the untouched Project Gutenberg source,
license, byte count, SHA-256, UTF-8/LF normalization, prologue, sixteen
chapters, stable unit IDs, and derived snapshot hashes. The answer key must
declare at least: one concrete concern, one interpretive concern, one protected
span, one source-drift case, one unresolved concern, one related recurrence,
continuity facts, voice constraints, and expected owner handoffs.

The baseline and revised snapshots are run through every no-AI workflow. The
fixed 24-row local pilot uses its named Carmilla fixtures and is not multiplied
by the synthetic scale matrix. Project-scale load, search, projection, history,
save, recheck, and render scenarios are separately repeated against fixtures of
1x (Carmilla), 2x, 4x, and 8x unit count, generated from clearly labeled
non-evidence text while preserving stable IDs and seeded anchors. Synthetic
fixtures measure mechanical scale behavior only; they cannot establish voice
or AI usefulness.

Provisional mechanical performance gates are: project open ≤ 5 seconds at 1x,
≤ 10 seconds at 4x, ≤ 20 seconds at 8x; ordinary save ≤ 1 second at 1x and
≤ 3 seconds at 8x; deterministic recheck ≤ 2 seconds at 1x and ≤ 8 seconds at
8x; no main-thread freeze over 100 ms in ordinary editing; and no unbounded
memory growth across three repeated load/save cycles. Jason reviews perceived
responsiveness and interruption cost separately.

## 11. Packaged qualification gate

Qualification runs in both the unpacked production build and the installed NSIS
application. The two runs use the same exact commit, corpus snapshot, evidence
seed, and test matrix. The installed run verifies install, launch, data-path
permissions, project open, both preloads, IPC allowlists, detached window,
restart/recovery, uninstall residue policy, and ordinary no-AI workflow. The
unpacked run verifies the production bundle before installation. A pass in one
form cannot substitute for the other.

## 12. Evidence schema and deterministic sampling

The machine-validated evidence ledger uses JSON Lines with one object per row.
P7-G2 must create the normative JSON Schema artifact
`scripts/program7-evidence-row.schema.json` using JSON Schema Draft 2020-12 and
the fail-closed validator `scripts/validate-program7-evidence.mjs`. The schema,
validator, and ledger are one qualification unit: evidence cannot qualify until
all three exist at the exact commit under test and the validator passes. The
object below is illustrative of the normative shape, not a substitute for the
schema:

```json
{
  "evidenceId": "P7-G2-Q01",
  "exactCommit": "40 lowercase hex characters",
  "package": "RT-2B",
  "evidenceClass": "contract|fixture|component|runtime|live-local|manual",
  "executionMode": "real-cold|real-warm|fault-a|fault-b|not-applicable",
  "precommitTreeHash": "40 lowercase hex characters or not-applicable",
  "environment": { "os": "", "appMode": "", "window": "", "theme": "dark|light", "zoom": 100, "runtime": "" },
  "corpus": { "name": "carmilla-baseline", "sha256": "64 lowercase hex characters" },
  "preconditions": [""],
  "action": "",
  "expected": "",
  "observed": "",
  "artifacts": [{ "path": "absolute path", "sha256": "64 lowercase hex characters", "containsProtectedContent": false }],
  "result": "Pass|Fail|Uncertain",
  "reviewer": "agent-id|Jason",
  "authoritySensitive": false,
  "genuinelySubjective": false,
  "limitations": [""],
  "freshness": { "capturedAt": "ISO-8601", "invalidatedBy": [""] },
  "humanReview": { "required": false, "basis": "", "status": "pending|pass|fail|not-required", "note": "" },
  "disposition": "repair|exception|defer|closure|pending"
}
```

The normative schema and validator must enforce all of the following:

- `additionalProperties: false` on the root and every nested object;
- every displayed root and nested field is required;
- `exactCommit` and applicable `precommitTreeHash` match
  `^[0-9a-f]{40}$`; `precommitTreeHash` may instead equal
  `not-applicable` only for a recorded clean exact-commit run;
- every SHA-256 field matches `^[0-9a-f]{64}$`; the corpus SHA may equal
  `not-applicable` only when the named row has no corpus dependency;
- `evidenceId` and `package` match `^[A-Z0-9]+(?:-[A-Z0-9]+)+$`, are
  unique within the packet, and the package exists in the implementation plan;
- enums exactly match the values shown above; `zoom` is a positive integer;
  required strings are non-empty; `preconditions` and `artifacts` each contain
  at least one item;
- artifact paths are absolute Windows drive, UNC, or POSIX paths; every artifact
  exists at validation time and its computed hash equals its recorded SHA-256;
- every timestamp validates as RFC 3339 / ISO-8601 with an explicit offset;
- one packet has one exact commit and one recorded precommit-tree state; a
  floating branch, mixed commit, or duplicate evidence ID fails the packet;
- `containsProtectedContent` is always `false`; a true value is a hard stop,
  not a schema-compatible warning;
- `humanReview.required: true` cannot use `not-required`, and a row marked
  authority-sensitive, genuinely subjective, protection-related, sovereign-
  mutation-related, or local-AI-admission-related must require Jason review;
- unresolved `Fail` or `Uncertain` rows cannot use `closure`; and
- JSON parse, schema validation, cross-row validation, file existence, or hash
  failure exits nonzero and names the evidence row without echoing protected
  content.

The deterministic Jason sample is computed independently for each package, not
chosen by an agent:

```text
for each packageId:
  eligible = sort(pass rows for packageId by evidenceId)
  seed = SHA256(exactCommit + "|" + packageId + "|program7-human-sample-v1")
  rank(row) = SHA256(seed + "|" + row.evidenceId)
  count = min(len(eligible), max(3, ceil(0.10 * len(eligible))))
  packageSample = first count rows after sorting by rank(row)
sample = union(all packageSample)
```

The sample is recalculated whenever the exact commit changes. Every package
must contribute at least three eligible rows; if a package has fewer than
three, all of its passes are sampled. The ledger records seed, eligible IDs,
selected IDs, and algorithm version. Agents cannot cherry-pick a convenient
sample. Any repair creates a new evidence ID linked to the prior row.

## 13. Human review boundary

Jason reviews all `Fail` and `Uncertain` rows, all authority-sensitive rows,
all protection and sovereignty rows, every local-AI admission row, and the
deterministic objective-pass sample. Jason alone decides subjective AI
usefulness, voice preservation, naming, aesthetics, interruption cost,
foreground wait tolerance, and whether a revision is actually resolved.

The agent may report only the mechanical advisory outcomes and may never claim
Human Gate 4, product resolution, or local-AI admission.

## 14. Family closure and defer matrix

| Family | Required closure evidence | Allowed defer state | Exact resolution stage | Reopening trigger |
| --- | --- | --- | --- | --- |
| Finding to revision | no-AI Carmilla end-to-end pass | none for Human Gate 4 | P7-G2 objective qualification | anchor or owner regression |
| Manual revision/recheck | all manual actions and recovery pass | none | P7-G2 | any sovereignty or stale-source failure |
| Local-AI pilot | 24-row matrix, safety scan, Jason review | unavailable/conditional | RT-2B rerun | approved host/model/transport changes |
| Story Foundation | blank/unknown/revised/read-only cases | later surface polish | P7-G2 or named later stage | owner or startup-gate regression |
| Ideation | seed/branch/test/combine/promote cases | bounded feature family | P7-G2 or explicit next program | truth-owner leakage |
| Promotion | destination-owner handoff receipts | later owner integration | P7-G2 handoff package | destination contract change |
| History | provenance, recurrence, bounded history | visual polish only | P7-G2 | lost lineage or active-view leak |
| Accessibility/visual | axe, contrast, keyboard, zoom, fixtures | no defer for A/AA or protection | P7-G2 | token, route, or layout change |
| Packaging | unpacked and installed NSIS passes | none for release claim | P7-G2 packaging gate | build, installer, or preload change |

Every defer record names the owner, exact resolution stage, evidence needed,
and one observable reopening trigger. “Later,” “acceptable,” or “works on my
machine” is not a defer disposition.

## 15. Wave commits and clean reruns

Bounded package agents do not commit or push unless separately authorized. At
each wave boundary, Jason or an explicitly authorized coordinator creates the
reviewed commit and records its full hash. Before qualification, record the
precommit tree hash and dirty/clean status. After that commit, rerun the same
required checks from a clean exact-commit checkout or worktree. Evidence must
name both the precommit tree hash and the exact commit hash; a dirty-tree pass
cannot replace a clean exact-commit rerun.

The implementation plan adopts this protocol by reference. Any conflict is
resolved in favor of this protocol's mandatory no-AI gate, conditional local-AI
admission, zero-disqualifier rules, and explicit human-review boundary.
