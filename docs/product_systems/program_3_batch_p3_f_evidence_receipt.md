# Program 3 Batch P3-F Evidence Receipt

## 1. Status And Boundary

- Batch: `P3-F - Command Center task canvas and Review workspace`
- Status: `IMPLEMENTATION AND AUTOMATION COMPLETE; AUTHOR COMMIT/PUSH REQUIRED`
- Started from exact pushed baseline:
  `fec271479f3c3d601cca7b8432ee77e67031cd53`
- Branch: `codex/foundation-audit`
- Model and effort: `GPT-5.6 Sol`, `xhigh`
- Human product validation: `NOT REQUIRED IN PROGRAM 3`
- Git control: `Jason alone stages, commits, and pushes`
- Protected evidence: `NOT USED`
- Provider calls, credentials, and paid operations: `NOT USED`

P3-A through P3-E are durable at `4007e12a`, `2ff0361c`, `3de76ee1`,
`fb232066`, and `fec27147`. This receipt closes only the implementation and
automated-evidence portion of P3-F. It does not claim a clean exact candidate
while this batch is uncommitted. P3-F becomes durable after Jason commits and
pushes this bounded file set. P3-G must begin from that exact pushed
checkpoint.

## 2. Implemented Outcomes

### 2.1 One task-focused Command Center

Command Center now presents one dominant task canvas and a restrained
six-family switcher:

- Review;
- Structure;
- Story Knowledge;
- Create / Develop;
- Project Interchange; and
- Operations / Approvals.

Only Review is implemented by this batch. The other five locations state
their intended purpose and remain truthful placeholders for their authorized
later programs. They do not imply that dossier tools, dashboards, analytics,
or approvals already exist. The canvas remains optional, non-gating, usable
on the same screen, and movable to the established second-window host.

### 2.2 Rich critique result placement

The completed selected-prose critique result is now presented in Command
Review rather than as permanent writing-side result furniture. Writing Studio
still owns selection, exact outbound preview, approval, execution, and the
manuscript. Review receives only an advisory projection after the request
owner publishes a bounded lifecycle state.

The Review task shows:

- selected scope without selected prose;
- advisory and lifecycle status;
- provider/model, cost, and privacy disclosures;
- result text only when completion is valid;
- uncertainty and limitations;
- truthful failed, cancelled, expired, stale, dismissed, and unavailable
  states; and
- only the actions valid for the current state.

### 2.3 Main-owned sanitized projection

The new versioned Review IPC boundary is owned by the main process. Its
projection is bound to the active project, generation, critique request,
manuscript unit, selection fingerprint, lifecycle, and visible result. Runtime
normalizers reject malformed fields, invalid lifecycle/action combinations,
prose-shaped or credential-shaped keys, and source anchors that are not valid
for an available result.

Command does not receive:

- selected or unrelated manuscript prose;
- credentials or provider payloads;
- hidden context;
- manuscript, outline, signal, routing, or generic mutation authority; or
- a durable AI-memory channel.

Editing the bound manuscript unit after completion marks the projection stale
through the owner boundary even when the result was opened in another window
or after the local Writing presentation state changed.

### 2.4 Narrow owner-routed actions

The available completed-result actions are intentionally small:

- copy the visible advisory text;
- create an author-selected concise Feedback Note through the existing
  project-local note owner;
- dismiss the projection without destroying the critique owner's record; and
- return to the exact current source selection when its project, unit, and
  selection fingerprint still match.

Copy failure and note-save failure remain visible and honest. Feedback Notes
remain advisory, isolated by project, and durable in their existing sidecar.
Returning to source focuses the manuscript selection without changing prose.
A stale or mismatched source refuses false restoration.

### 2.5 Existing ownership remains unchanged

P3-F does not move critique request preparation or execution into Command,
persist critique result payloads as product memory, or create a second
Feedback Note writer. It consumes the existing critique and note owners. It
does not change manuscript drafts, `outline.json`, `project.json`, Living
Outline state, accepted truth, routing policy, or provider configuration.

## 3. Automated Evidence

### Focused changed boundary

- Review main-process ownership and rejection tests passed: 9 tests;
- shared projection, action, preload, and sanitizer contract tests passed;
- Writing and Review component tests passed for completed, failed, cancelled,
  expired, stale, dismissed, unavailable, copy-failure, note-save
  success/failure, source return, keyboard focus, and Focus behavior;
- exact source-selection restoration and stale refusal passed;
- full application TypeScript passed;
- first-party application lint passed with the zero-warning ceiling;
- production renderer and main-process builds passed;
- the full application test sweep passed: 110 files, 1,062 tests passed, and 2
  existing policy skips;
- project reopen and project-isolation evidence proved that saved Feedback
  Notes survive in their sidecar while critique output cannot alter prose;
- the 100-unit performance proof passed with the unchanged ceilings; the final
  fixed-gate run created 100 units in about 1.63 seconds and selected unit 100
  in 47 milliseconds; and
- package-safe preflight passed for the existing Windows x64 NSIS
  `1.0.0-rc1` configuration.

No automated test contacted a provider. Deterministic critique fixtures and
main-owner state transitions supplied Review evidence.

### Full fixed regression

The fixed Stage 19 regression ran against the final dirty development
candidate with its explicit override:

- repository tracked-path hygiene: passed;
- foundation reachability, inventory, and coverage policy: passed;
- Git diff hygiene: passed;
- packaging-workflow policy: passed;
- both lint lanes: passed;
- full TypeScript: passed;
- production renderer and main-process build: passed;
- critical unit, component, and contract matrix: 40 files passed, 659 tests
  passed, and 2 existing policy skips;
- critical built-Electron matrix: all 24 journeys passed, including WCAG A/AA
  axe evidence, selected-prose critique, Command integrity, Gate 1 persistence
  and isolation, 100-unit performance, recovery, logical-host continuity, and
  the Writing shell;
- Playwright retries: `0`; and
- final status: `STAGE19_REGRESSION_PASS`,
  `worktree=DEVELOPMENT_OVERRIDE`, `protectedEvidence=NOT_USED`.

This development run is not represented as a clean release candidate,
installer, installed-offline, public-release, aesthetic-acceptance, or Human
Gate 2 qualification. Exact package and installed qualification remain in
P3-G and the later complete Program 3 plus Program 4 candidate.

## 4. Findings Disposition

| Finding | P3-F disposition |
| --- | --- |
| Human Gate 1 Critique placement | Rich result review now lives in the Command task canvas; Writing retains selection, preview, approval, execution, and prose ownership |
| `ARC-P3-03` sanitized projection and source return | Main-owned, versioned, project/request/unit/fingerprint-bound projection and exact source-return refusal rules are implemented and green |
| `TST-P3-02` Review projection evidence | Closed for the P3-F boundary: malformed, cross-project, wrong-generation, stale, hidden-prose, credential, action-escalation, and failure paths are rejected |
| Feedback Note multi-surface action | Command invokes the existing narrow project-local owner; durability, isolation, concurrency owner, and failure honesty remain intact |
| Command Center composition | One dominant task canvas replaces the old dashboard-stat assumption; five later families are stable locations, not fake implementations |
| `ARC-P3-07` presentation-state vocabulary | Review now uses explicit advisory, completed, failed, cancelled, expired, stale, dismissed, and unavailable states; complete shell-wide closure remains P3-G |
| `TST-P3-04` and `TST-P3-05` shell evidence | Review semantics, focus, non-color state text, Electron axe, and responsive styling are green; complete layered visual/responsive closure and human acceptance remain P3-G/Human Gate 2 |
| `TST-P3-06` authority parity | Shared contracts, both preloads, main owner, renderer, TypeScript, Electron, build, regression, and package preflight agree; exact packaged-host closure remains P3-G |

## 5. Explicit Non-Claims And Deferrals

P3-F did not:

- implement the five later Command workspace families;
- add Companion, Emotion Graph, relationship maps, background jobs, provider
  routing, a second provider, or durable AI memory;
- add automatic critique, prose rewrite, manuscript mutation, accepted-truth
  mutation, or routing-policy mutation;
- persist raw provider payloads, hidden context, or critique results as memory;
- complete targeted visual-reference, large-text/zoom, reduced-motion,
  narrow/degraded, versioned-performance, exact-package, installed, or final
  Program 3 closure evidence assigned to P3-G;
- remove the now-suppressed legacy writing-side critique presentation path;
  duplicate-path removal remains explicitly assigned to P3-G after the new
  owner-routed path is durable;
- remove, archive, delete, or broadly clean legacy code;
- contact an AI provider; or
- request subjective human product validation.

Those items retain their exact P3-G, Program 4, Program 5, later-program,
Human Gate 2, or cleanup-wave owners.

## 6. Git Checkpoint And Next Action

Jason should review the bounded status, stage the P3-F file set, run cached
diff hygiene, commit, and push. After that exact pushed commit is confirmed,
P3-F is durable and P3-G is the next automated batch: accessibility,
responsive, degraded-state, visual-reference, performance-protocol, duplicate
path, and Program 3 mechanical closure. No hands-on product review is due at
this checkpoint.
