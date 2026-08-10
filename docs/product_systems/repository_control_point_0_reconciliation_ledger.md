# Repository Control Point 0 Reconciliation Ledger

## 1. Status And Execution Identity

- Status: `APPROVED; CLOSES WHEN THIS EVIDENCE BATCH IS COMMITTED AND PUSHED`
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
