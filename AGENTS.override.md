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
