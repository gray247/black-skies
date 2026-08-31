# Repository Control Point 0 Reconciliation Ledger

## 1. Status And Execution Identity

- Status: `CLOSED BY CLEANUP WAVE A FINAL INTEGRATION AFTER COMMIT AND PUSH`
- Author decision: `JASON APPROVED THE RECOMMENDED DISPOSITION ON 2026-08-10`
- Review date: `2026-08-10`
- Model: `GPT-5.6 Sol`
- Reasoning effort: `xhigh`
- Task identity: `Current Codex task — Repository Control Point 0`
- Exact starting commit: `f73f68806cc992147838f43b96d010984709b642`
- Continuing branch: `codex/foundation-audit`
- Mutation authority: `documentation and recoverable evidence only`
- Prohibited actions observed: no branch change, merge, stash, reset, clean,
  deletion, legacy-file edit, runtime edit, test edit, or history rewrite

This ledger executes Repository Control Point 0 from
[post_v1_execution_control_and_handoff_plan.md](post_v1_execution_control_and_handoff_plan.md).
It determines whether any uncommitted legacy work must be carried forward
before Black Skies continues on one canonical development line.

## 2. Verified Repository Facts

At review time:

- `codex/foundation-audit` was at
  `f73f68806cc992147838f43b96d010984709b642`, matched
  `origin/codex/foundation-audit`, and was clean before this evidence batch,
- `C:\Dev\black-skies` was on `salvage/minimal-two-surface-shell` at
  `0d4e05da1089410711a44e9613eca0658af97f2a`,
- `0d4e05da` is an ancestor of `f73f6880`; the continuing line is seventy-four
  commits ahead and zero commits behind that legacy head,
- the primary legacy checkout contains eleven modified tracked files and three
  untracked files,
- detached worktree `b13f` is also at `0d4e05da` and contains a partial copy of
  the same campaign: eight modified tracked files and the same three untracked
  files,
- ten detached worktrees at `d2b50a8e` are clean and remain reachable through
  `origin/main` and Codex snapshot refs,
- clean detached worktree `fc8b` is at `7017c34a`, which is reachable through
  `origin/main`,
- clean detached worktree `0830` is at `929a0c3f`; that head adds two simple
  session-truth helper files and is not currently named by a branch or remote
  ref,
- registered worktree `46bb` has stale/broken metadata pointing at
  `/mnt/c/Dev/black-skies/.git/worktrees/black-skies1`; branch
  `baseline/hygiene` still names `e90adcaa`,
- none of those auxiliary worktrees is required for the next product program.

The auxiliary-worktree inventory expands cleanup knowledge. It does not widen
this control point into worktree removal or historical repository cleanup.

## 3. Recoverable Dirty-State Evidence

Two exact patch snapshots were created before any legacy disposition:

| Source worktree | Snapshot | SHA-256 | Verification |
| --- | --- | --- | --- |
| `C:\Dev\black-skies` | [repository_control_point_0_legacy_dirty_snapshot.patch](repository_control_point_0_legacy_dirty_snapshot.patch) | `DA8AE00F584042017E10E5EB3D2C399084754750FF7125FC9FA6B401E88E9D31` | `git apply --reverse --check` passed against the unchanged dirty checkout |
| `C:\Users\gray2\.codex\worktrees\b13f\black-skies` | [repository_control_point_0_b13f_dirty_snapshot.patch](repository_control_point_0_b13f_dirty_snapshot.patch) | `A83069C78955F1DB2CE25EDC8CEAEDF352E9B3D380D4D80B531E2BA77619DEC6` | `git apply --reverse --check` passed against the unchanged dirty checkout |

The patch files include the tracked diffs and complete contents of all
untracked files. The old worktrees also remain unchanged. This gives both a
recoverable evidence copy and the original source state until Jason approves a
later cleanup action.

### Supplemental current primary-checkout evidence — 2026-08-31

Cleanup Wave A Pass 1A found three current deltas in the preserved primary
checkout that were not covered by the original legacy snapshot:

| Legacy path | Observed delta | Classification | Disposition |
| --- | --- | --- | --- |
| `AGENTS.override.md` | Uncommitted deletion | `QUARANTINE` — unsafe/obsolete local drift | Preserve the deletion in supplemental recovery evidence only; do not reproduce it in the canonical checkout and do not delete the canonical file |
| `docs/BLACK_SKIES_FIX_TRACKER.md` | Launcher/port-5173 documentation delta | `KEEP_HISTORICAL` | Retain as evidence only; the behavior is already covered by the stronger canonical P5-UX-01 launcher record |
| `docs/ops/start_codex_gui_notes.md` | Launcher ownership and port-5173 guidance delta | `KEEP_HISTORICAL` | Retain as evidence only; the behavior is already incorporated in the canonical document |

The exact supplemental patch is
[`repository_control_point_0_legacy_dirty_supplement_2026-08-31.patch`](repository_control_point_0_legacy_dirty_supplement_2026-08-31.patch)
with SHA-256
`2143CCE00B31A7DD8FF7F44C71C8902D80234ABBFF60504BE02F431B10225937`.
`git apply --reverse --check` passed against the unchanged
`C:\Dev\black-skies` checkout. The original two snapshot hashes were
rechecked and remain unchanged.

No current runtime, test, script, dependency, or product behavior needs to be
imported from these three deltas. `C:\Dev\black-skies` remains preserved and
untouched. The original and supplemental patches together complete recovery
evidence for the known primary-checkout state as of this Pass 1A review.
Cleanup Wave A remains open; Program 6 remains excluded.

### Cleanup Wave A Pass 1B — duplicate worktree removal — 2026-08-31

The earlier bounded removal of `1612` removed its checkout but left one
orphaned administrative registration. Pass 1B-R ran the required dry run,
identified exactly that one candidate, and then used the authorized elevated
`git worktree prune --verbose --expire now` repair. The `1612` registration and
its administrative directory are now absent.

The resumed Pass 1B then validated all ten remaining approved targets before
the first mutation and removed them in listed order using only
`git worktree remove`:

| Worktree ID | Exact path | Shared HEAD | Verified state | Result |
| --- | --- | --- | --- | --- |
| `3515` | `C:\Users\gray2\.codex\worktrees\3515\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `3811` | `C:\Users\gray2\.codex\worktrees\3811\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `5e84` | `C:\Users\gray2\.codex\worktrees\5e84\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `63cc` | `C:\Users\gray2\.codex\worktrees\63cc\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `67d7` | `C:\Users\gray2\.codex\worktrees\67d7\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `7e81` | `C:\Users\gray2\.codex\worktrees\7e81\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `806a` | `C:\Users\gray2\.codex\worktrees\806a\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `98ff` | `C:\Users\gray2\.codex\worktrees\98ff\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `eeea` | `C:\Users\gray2\.codex\worktrees\eeea\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |
| `f05d` | `C:\Users\gray2\.codex\worktrees\f05d\black-skies` | `d2b50a8ee9fbf33784e860040c8836b5c52ea106` | clean, detached, unlocked | removed |

All eleven approved duplicates therefore shared one clean detached HEAD.
The commit remains recoverable and is an ancestor of `origin/main`. Elevated
Git was required because ordinary sandbox execution could not delete shared
Git administrative metadata. No force removal, broad prune, manual
filesystem deletion, ACL or ownership change, branch deletion, ref deletion,
commit, or push occurred. The only prune was the one-candidate Pass 1B-R
repair authorized after its dry run.

The six protected worktrees remain registered and untouched: `C:\Dev\black-skies`,
`0830`, `46bb`, canonical `4f0b`, `b13f`, and `fc8b`. Their prior dispositions
remain in force. Cleanup Wave A remains open; Program 6 remains excluded.

### Cleanup Wave A Pass 3R — orphaned 0830 directory and final worktree reconciliation — 2026-08-31

The first Pass 3 removal of 0830 removed its Git registration but left the
checkout directory because Git reported "Directory not empty". Phase A proved
the exact residual disposable: its resolved path and parent were exact, the
root was not a reparse point, .git was absent, no registration or running
process referenced it, and commit 929a0c3f remained readable. The recovery
artifact remained unchanged at SHA-256
A38DADD41E07D00247B2B2A94FC9CA50F3B9EB7D17247D87268E10ED23478044 and stable
patch ID ecb56ad4cad2b8956560fc6df3faa530e9bb884c, with exactly the two
recovered additions app/main/__tests__/sessionTruth.test.ts and
app/shared/sessionTruth.ts. The supplemental recovery hash remained
2143CCE00B31A7DD8FF7F44C71C8902D80234ABBFF60504BE02F431B10225937; the
ledger hash before this authorized append was
9DF4B998DF63F3412DAADC7C4CC404B433E191C23BE8171F535FEA29A522F5F3.

The residual proof found ignored, install-generated node_modules content,
2,243 reparse points whose targets all resolved inside the exact residual
root, zero external or unresolved targets, and 504 files outside
node_modules. Of those, 497 matched commit blobs exactly and the six named
PowerShell files matched after CRLF-to-LF normalization. The only untracked
file was the accidental path-list ted memory docs, services, and tests,
SHA-256
DA7DF35A687BB642633BFCE51ADC6685CFF93D6C3602CC62795F6C874BF924BD, with
95 nonempty path-inventory lines and no unique implementation content. No
additional recovery artifact was created for it.

After proof, elevated native PowerShell removed only
C:\Users\gray2\.codex\worktrees\0830\black-skies. The clean, detached,
unlocked fc8b checkout at 7017c34a equal to origin/main was then removed
only with the exact non-force git worktree remove command. The final
registered inventory is exactly:

| Worktree | HEAD / branch | Disposition |
| --- | --- | --- |
| C:\Dev\black-skies | 0d4e05da / salvage/minimal-two-surface-shell | protected historical quarantine |
| C:\Users\gray2\.codex\worktrees\46bb\black-skies | e90adcaa / baseline/hygiene | protected stale WSL registration; untouched |
| C:\Users\gray2\.codex\worktrees\4f0b\black-skies | 46178b50 / codex/foundation-audit | active canonical cleanup worktree |
| C:\Users\gray2\.codex\worktrees\b13f\black-skies | 0d4e05da / detached | protected historical quarantine |

The canonical branch, HEAD, and upstream remained unchanged. Sample-project
aliases, fixtures, and linked historical documents remain retained. No
source, tests, configuration, lockfiles, fixtures, or historical source
documents were changed. Cleanup Wave A remains open for final integration, and
Program 6 was not started.

## 4. Primary Legacy Hunk Disposition

Every dirty path and its hunk themes were compared with the continuing branch
and the commits that later closed the same work.

| Legacy path | Hunk themes reviewed | Continuing-line evidence | Classification |
| --- | --- | --- | --- |
| `app/renderer/Stage19WritingSpineApp.tsx` | four hunks: clear export notice on project change and suppress a delayed result from an inactive project | `fa579c43` introduced stronger generation- and operation-bound invalidation; current source also clears operation state on authoritative generation change | `superseded by later implementation` |
| `app/renderer/__tests__/Stage19WritingSpineApp.test.tsx` | nine hunks: project-switch notice expectations, delayed completion, recovery `act`, and critique staleness `act` | current tests preserve the same asynchronous fixes and add stronger success, failure, same-project revision, Feedback Notes, Living Outline, and Focus coverage | `incorporated and expanded` |
| `app/tests/e2e/utils/serviceStubs.ts` | three hunk groups: bounded retry of fixed port `9999` after `EADDRINUSE` | `dc4e8694` replaced the fixed-port design with per-run ephemeral loopback ports, eliminating the collision instead of waiting for it | `superseded by safer architecture` |
| `docs/current_authority_inventory.json` | add Foundation Spine reconciliation | present in current inventory, followed by V1 closure and post-V1 authority additions | `incorporated and superseded by current authority` |
| `docs/current_authority_inventory.md` | identify Foundation Spine reconciliation | current authority describes the final Stage 19 closure and post-V1 program | `incorporated and superseded by current authority` |
| `docs/product_systems/current_product_roadmap.md` | Foundation Spine acceptance wording | current roadmap retains the bounded reconciliation and later exact-candidate closure | `incorporated and superseded by current authority` |
| `docs/product_systems/current_truth_index.md` | Foundation Spine acceptance wording | current truth index retains the bounded reconciliation and later exact-candidate closure | `incorporated and superseded by current authority` |
| `docs/product_systems/stage19_package_19_22_plan_and_findings.md` | runner-failure wording, authority inventory count, retained-tooling disposition, P1-23/P3-24/P1-25 drafts, and an open-package audit section | `fa579c43`, `7340800c`, `675e5125`, `97c6644b`, and the current closure receipt replace these open/pending drafts with exact-candidate evidence and final dispositions | `historical draft superseded by closure` |
| `docs/product_systems/stage19_v1_master_implementation_and_acceptance_plan.md` | add bounded Foundation Spine reconciliation | current plan retains that boundary and records final V1 closure | `incorporated and superseded by closure` |
| `scripts/run-vitest-offline.mjs` | eight mechanical hunks replacing an in-process Vitest context with CLI execution and exit-code propagation | `7340800c` contains the same executable contract and its permanent witness | `incorporated` |
| `scripts/stage19-regression.mjs` | add the Package 19.22 witness test | `7340800c` includes it; later V2 suites and policy checks extend the matrix | `incorporated and expanded` |
| `app/main/__tests__/stage19_22QualificationWitness.test.ts` | complete untracked first draft of receipt, installation, lifecycle, and preservation witnesses | `7340800c` contains the same test contract in the current tree | `incorporated` |
| `docs/product_systems/stage19_foundation_spine_acceptance_reconciliation.md` | complete untracked first draft | `7340800c` adds the accepted bounded record; later closure text correctly names the exact V1 candidate | `incorporated and superseded by current authority` |
| `scripts/stage19-22-qualification-witness.mjs` | complete untracked first draft | `7340800c` contains the witness and `675e5125` adds the required PowerShell portability fallback | `incorporated and improved` |

Result: no hunk in the primary dirty checkout is uniquely valuable current
work. Nothing should be merged or reapplied to the continuing branch.

## 5. Detached `b13f` Disposition

`b13f` duplicates the primary dirty campaign:

- eight files and all three untracked files are content-equivalent to the
  primary snapshot,
- the roadmap and truth-index differences are line-ending-only,
- the Package 19.22 ledger contains two older wording/count variants and omits
  the primary draft's obsolete fixed-port P1-25 row,
- all variants are superseded by the exact-candidate closure records on the
  continuing line.

Result: `b13f` contains no uniquely valuable current work. Its exact state is
preserved by the second patch snapshot and the unchanged worktree.

## 6. Other Worktree Disposition

- `0830` commit `929a0c3f` defines a small generic `sessionTruth` helper and
  tests. The continuing line has the more complete
  `app/shared/runtimeSessionTruth.ts`, `app/main/runtimeSessionTruth.ts`, and
  their active tests. The old semantic idea is therefore superseded, but the
  worktree must remain untouched until Jason approves its later cleanup because
  its head currently has no ordinary branch or remote ref.
- `d2b50a8e`, `7017c34a`, and their clean duplicate worktrees are historical
  main-line/checkpoint views whose commits remain reachable by refs.
- `46bb` is a stale worktree registration, while its branch ref remains
  reachable. Repairing or removing that registration is cleanup work, not a
  prerequisite for Program 3.

Result: auxiliary worktrees do not block naming the canonical continuing line.
They enter Cleanup Wave A as explicit, non-urgent disposition work.

## 7. Approved Disposition

Jason approved this non-destructive disposition on 2026-08-10:

1. name `codex/foundation-audit` at the pushed current head as the sole
   continuing Black Skies development line,
2. do not merge or reapply anything from `C:\Dev\black-skies` or `b13f`,
3. quarantine the two dirty worktrees as read-only historical sources until
   Cleanup Wave A,
4. retain both exact patch snapshots in the continuing repository,
5. leave all other stale, detached, or broken worktree registrations untouched
   until Cleanup Wave A supplies one reviewed disposition list,
6. proceed to Control Point 1 after this evidence batch is committed and
   pushed.

The approval does not delete, clear, reset, move, or retire anything. Any
later destructive cleanup still requires a separate exact-target review and
Jason's approval.

## 8. Exit State

Repository Control Point 0 has completed its investigation, evidence capture,
hunk classification, and author disposition decision. This conditional receipt
closes when Jason commits and pushes the evidence batch and the continuing
worktree is confirmed clean afterward. No further product or cleanup decision
is required before Control Point 1.

No recovered-code qualification is required because no legacy hunk is being
carried forward.

Pass 1A closes the previously identified recovery-evidence gap only. It does
not authorize worktree removal, archival, deletion, consolidation, dependency
mutation, or Program 6 runtime work.

### Cleanup Wave A final integration — 2026-08-31

Passes 1A, 1B/1B-R, 2A, 2B, 2C, 3, and 3R are complete. The final integration
contains exactly 13 paths: the two unreachable `app/electron` deletions; the
app manifest, P5-HG3 Electron test, TypeScript/Vite configuration, three
governance documents, lockfile, and app ESLint launcher modifications; and the
two historical recovery patch additions. No runtime behavior, persistence
contract, IPC schema, fixture, CSS, snapshot, or Program 6 capability changed.

The dependency disposition is limited to the four unused layout declarations,
their unreachable lockfile closure, and the obsolete Vite `layout-tools`
condition. The orphan-code disposition is limited to the two unreachable
Electron files and their empty TypeScript/ESLint targets. The active
`app/main` preload, loader, Project Spine, shared IPC, renderer, docking, CSS,
and snapshots remain unchanged. P5-HG3 retains all stable/authored properties
exact and applies only the five bounded geometry tolerances already recorded,
with finite border-width parsing.

The 0830 recovery artifact remains SHA-256
`A38DADD41E07D00247B2B2A94FC9CA50F3B9EB7D17247D87268E10ED23478044` with
stable patch ID `ecb56ad4cad2b8956560fc6df3faa530e9bb884c`; the legacy dirty
supplement remains SHA-256
`2143CCE00B31A7DD8FF7F44C71C8902D80234ABBFF60504BE02F431B10225937`.
Both remain UTF-8 without BOM and contain no credentials or secrets.

The final registered inventory is exactly `C:\Dev\black-skies`, `46bb`,
canonical `4f0b`, and `b13f`. `C:\Dev`, `46bb`, and `b13f` remain deliberately
retained protected quarantines. Sample-project aliases, active fixtures, and
linked historical documents remain retained.

Phase B evidence is complete: pinned pnpm `8.15.9` offline frozen install,
focused P5-HG3 `3/3`, typecheck, lint, production build, package preflight,
docs lint, diff hygiene, and dirty Stage 19 all passed. Stage 19 returned
`STAGE19_REGRESSION_PASS` with `49` critical unit files, `774` passed, `2`
authorized skips, startup preflight `1/1`, and Electron `35/35`.

Cleanup Wave A closes when the containing commit is successfully pushed and
local/upstream HEADs match. Program 5 remains complete. Program 6 was not
started. This cleanup commit claims no installer or release-candidate
qualification.
