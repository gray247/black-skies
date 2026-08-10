# Program 3 Batch P3-C Evidence Receipt

## 1. Status And Boundary

- Batch: `P3-C - Logical surface host and placement`
- Status: `IMPLEMENTATION AND AUTOMATION COMPLETE; AUTHOR COMMIT/PUSH REQUIRED`
- Started from exact pushed baseline:
  `2ff0361c6c0e4cf85115b44e3c9cf345e290c9e7`
- Branch: `codex/foundation-audit`
- Model and effort: `GPT-5.6 Sol`, `xhigh`
- Human product validation: `NOT REQUIRED IN PROGRAM 3`
- Git control: `Jason alone stages, commits, and pushes`
- Protected evidence: `NOT USED`
- Provider calls, credentials, and paid operations: `NOT USED`

P3-A and P3-B are durable at `4007e12a` and `2ff0361c`. This receipt closes
only the implementation and automated-evidence portion of P3-C. It does not
claim a clean exact candidate while this batch is uncommitted. P3-C becomes
durable after Jason commits and pushes this bounded file set. P3-D must begin
from that exact pushed checkpoint.

## 2. Implemented Outcomes

### 2.1 One logical surface host

The main process now owns an explicit logical surface-host state for Writing
and Command. On one display, the current application window can switch between
the complete Writing Studio and the complete Command Center. Writing remains
mounted while Command is visible, so manuscript buffers, selection context,
dirty state, and workflow state do not acquire a second owner or disappear
during the transition.

Returning to Writing restores the manuscript surface and editor focus. The
renderer requests a transition through the narrow surface-host bridge; it does
not decide window placement or manufacture a second project session.

### 2.2 Optional secondary placement

The same logical Command surface can be opened in the optional secondary
window. The main process remains the placement authority and preserves one
Writing mutation owner, one current project binding, and one Command
projection generation.

The implementation supports:

- single-screen Writing-to-Command-to-Writing switching;
- optional secondary Command placement;
- close and reopen of the secondary surface;
- return from the secondary surface to Writing;
- recovery when the secondary host closes, crashes, or loses its display; and
- rebuilding a valid secondary host without reviving an invalidated authority
  token.

A second monitor is therefore an enhancement, not a prerequisite for using
either logical surface.

### 2.3 Main-authoritative rejection and recovery

The shared contract and main-process registry reject requests from stale,
wrong-role, wrong-project, wrong-window, or wrong-generation senders. Physical
secondary loss is published only after its authority has been cleared, so the
remaining host receives truthful current-window/lost placement state.

No manuscript, outline, Feedback Note, recovery, critique, or project
persistence owner moved into the new host contract. No generic mutation bridge
was added.

### 2.4 Preload and host parity

The production preload and the dedicated Stage 19 preload expose the same
narrow surface-host methods and normalize the same request and response
contracts. Unit evidence covers both hosts, and the production main and
renderer build exercises the active TypeScript boundary. Package preflight
confirms that the existing Windows package configuration remains admissible;
the exact installer and installed-offline lifecycle remain intentionally owned
by the combined Program 3 and Program 4 Human Gate 2 candidate.

## 3. Automated Evidence

### Focused changed boundary

- six surface-host, renderer, authority, placement, and preload suites passed;
- 146 focused tests passed;
- full application TypeScript boundary passed;
- both first-party and active Stage 19 zero-warning lint lanes passed;
- production renderer and main-process build passed; and
- Git diff hygiene passed before the documentation receipt was written.

Focused evidence covers one-screen transition and return focus, preservation of
unsaved Writing state, secondary open/close/reopen, display-loss fallback,
role/project/window/generation rejection, invalidated-host rebuild, identical
preload capability, and absence of duplicate mutation authority.

### Full fixed regression

The existing fixed regression ran with its explicit dirty-development override:

- repository tracked-path hygiene: passed;
- foundation reachability, inventory, and coverage policy: passed;
- Git diff hygiene: passed;
- packaging-workflow policy: passed;
- both lint lanes: passed;
- full TypeScript: passed;
- production renderer and main-process build: passed;
- critical unit, component, and contract matrix: 38 files passed, 634 tests
  passed, 2 existing policy skips;
- critical built-Electron matrix: 23 journeys passed in 1.7 minutes, including
  the new P3-C surface-host journey;
- Playwright retries: `0`; and
- final status: `STAGE19_REGRESSION_PASS`,
  `worktree=DEVELOPMENT_OVERRIDE`, `protectedEvidence=NOT_USED`.

The package-safe configuration preflight also passed for version
`1.0.0-rc1`, Windows x64 NSIS, with the existing unsigned-internal-RC policy.

This development run is not represented as clean release-candidate, installer,
installed-offline, public-release, or Human Gate 2 qualification.

## 4. Findings Disposition

| Finding | P3-C disposition |
| --- | --- |
| `ARC-P3-01` logical surface host | Implementation and deterministic evidence complete; durable closure waits for this batch's author commit/push |
| `ARC-P3-04` dedicated preload parity | Production and Stage 19 preloads expose the same narrow host contract; exact packaged-host qualification remains part of P3-G and the combined candidate |
| `ARC-P3-05` active TypeScript boundary | Shared contracts, main host, both preloads, renderer controller/view, and tests pass the full current TypeScript boundary; through-Program-3 closure remains open |
| `TST-P3-01` logical surface-host authority | Single-screen and optional-secondary arrangements preserve one project binding and one Writing mutation owner; durable closure waits for the author checkpoint |
| `TST-P3-06` development, test, build, and package authority parity | Changed-host parity and package-safe configuration are green; exact installer and installed-offline parity remain intentionally deferred to the combined candidate |

## 5. Explicit Non-Claims And Deferrals

P3-C did not:

- visually redesign the Writing Studio, Living Outline, Command Center, or
  startup experience;
- implement edge rails, scoped visual tokens, the unboxed Living Outline, or
  the Command Review workspace;
- add Companion, Emotion Graph, long-manuscript discovery, background jobs,
  provider routing, or durable AI memory;
- change manuscript, outline, Feedback Note, recovery, critique, or project
  persistence contracts;
- remove, archive, delete, or broadly clean legacy code;
- contact an AI provider; or
- run installer or installed-offline qualification.

Those items retain their exact P3-D through P3-G, Program 4, later-program, or
cleanup-wave owners.

## 6. Git Checkpoint And Next Action

Jason should review the bounded status, stage the P3-C file set, run cached diff
hygiene, commit, and push. After that exact pushed commit is confirmed, P3-C is
durable and P3-D is the next automated batch: Writing Studio visual shell and
edge rails. No hands-on product review is due at this checkpoint.
