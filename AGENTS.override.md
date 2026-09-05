# Black Skies Governance Override

This file has precedence over `AGENTS.md` for the repository root `C:\Dev\black-skies`.

## Operating Lane

- Limit work to documentation, governance, discovery, audit, and salvage-planning.
- Keep implementation blocked unless a later task explicitly lifts that restriction.
- Do not do runtime, GUI, dependency, packaging, refactor, migration, cleanup, or test-repair work.
- Follow the controlling 19-stage sequence and the current authority precedence exactly.
- Maintain findings-ledger updates during constellation work.

## Change Control

- Manual commits and pushes are performed by the user only.
- Do not change branches.
- Do not stash, reset, clean, rename, delete, or rewrite history.
- Do not execute salvage actions.
- Do not widen scope silently.

## Connector and Workflow Gates

- Do not admit connectors before workflow proofs and the Missing Connector Review.
- Preserve one exact resolution stage and reopening trigger for every deferral.
- Subagents are read-only unless a later task explicitly grants edit scope.

## Automation control

- `update-agents-md` is intentionally disabled for the current governance campaign and must not be re-enabled, duplicated, replaced, or retargeted without explicit author approval.
- No automation may rewrite `AGENTS.md`, `AGENTS.override.md`, or other Black Skies instruction files during this campaign.
- Reconsider `update-agents-md` only during the planned GO10 loose-thread review, GO10-to-GO11 handoff preparation, or a later explicit governance decision.
- Disabling the automation does not authorize deleting its schedule, prompt, memory, or historical records.

## Safety and Scope

- Keep the worktree unchanged except for files explicitly authorized by a later task.
- Do not edit `AGENTS.md`, `update-agents-md`, global Codex configuration, rules, skills, automations, product documentation, source code, or tests under this instruction.
- Prefer stopping and asking for direction over guessing when a request conflicts with this override.

## Program 6 bounded execution exception

For C:\Users\gray2\.codex\worktrees\4f0b\black-skies only, agents are explicitly authorized to:

- update the current branch and its shared Git worktree metadata under C:\Dev\black-skies\.git\worktrees\black-skies3;
- reconcile codex/foundation-audit with origin/codex/foundation-audit without discarding work;
- stage the intended Program 6 files and create the exact qualification commit;
- run dirty and clean Stage 19 qualification;
- launch the Program 6 development GUI;
- run BLACKSKIES_DISABLE_GPU=1 only as a clearly labeled host diagnostic, never as qualification or a production default;
- diagnose, repair, test, and continue through ordinary repository-owned Program 6 failures.

This exception does not authorize git reset --hard, git clean, discarding unrelated work, pushing, provider execution, packaging, installation, Program 7 work, or fabricated human acceptance.