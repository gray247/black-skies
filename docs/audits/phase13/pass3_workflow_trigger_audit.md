# Phase 13 Pass 3 - Workflow Trigger Audit

Status: Completed
Reviewed: 2026-05-09

## Summary

The current workflow configuration is intentionally limited to `main` and `phase-b2-memory-lab` on push. A push on `phase13-planning-audit` should not trigger either workflow, and that is expected given the branch filters that are currently configured.

## Workflow Inventory

- `.github/workflows/eval.yml`
- `.github/workflows/security.yml`

## Trigger Matrix

| Workflow | Push branches | Pull request | Manual dispatch | Schedule | Path filters |
| --- | --- | --- | --- | --- | --- |
| `eval.yml` | `main`, `phase-b2-memory-lab` | Yes | Yes | No | None seen in the inspected YAML |
| `security.yml` | `main`, `phase-b2-memory-lab` | Yes | Yes | Yes, `0 6 * * *` | None seen in the inspected YAML |

## Branch / Event Behavior

- Pushes to `main` trigger both workflows.
- Pushes to `phase-b2-memory-lab` trigger both workflows.
- Pull requests trigger both workflows.
- Manual workflow dispatch is enabled for both workflows.
- `security.yml` also runs on a schedule.

## Why `phase13-planning-audit` Did Not Trigger

The current push filters do not list `phase13-planning-audit`.
Because the branch is absent from the `branches` list, a push to that branch should not start either workflow.

That behavior is expected, not surprising.

## Risks

- Audit-only branches do not receive automatic push validation unless they are added to the branch filters or opened as a pull request.
- The current branch filters are good for the active integration branch, but they can create false assumptions if someone expects every planning branch to be validated on push.
- Because no path filters are present, the branch filters are the main gate; that is simple, but it should remain intentional.

## Recommended Follow-Up Pass Candidates

- A later workflow review if audit branches need push validation.
- A later CI-truth pass if the team wants to broaden branch coverage or path-based gating.

## Stop / Proceed Recommendation For Pass 4

Proceed. The current behavior is consistent with the inspected workflow files.
