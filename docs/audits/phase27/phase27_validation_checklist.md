# Phase 27 Human Validation Checklist

Status: Draft
Date: 2026-05-20

## Purpose

This checklist is for human smoke validation of the Phase 27 runtime/session truth contract.
It is intentionally narrow and does not validate save/export/autosave, recovery repair, AI usefulness, output quality, or production readiness.

## What to Validate

1. Launch the app and confirm the stable GUI baseline still appears normally.
2. Open a loaded project and verify the session-truth status surface is visible.
3. Confirm the loaded-project baseline reports `runtime truth` versus `project truth` consistently.
4. Edit a draft locally and confirm `dirty` and `unsaved` are visible without implying persistence.
5. Reopen or reload the same project and confirm the dirty/unsaved overlay does not silently promote to persisted truth.
6. If a safe stale path can be reproduced, confirm the renderer shows `stale` without auto-repair.
7. If a safe recovery-required path can be reproduced, confirm the renderer shows `recovery-required` without silent fallback repair.
8. Confirm the status surface remains read-only and does not trigger save/export/autosave behavior.

## What Not to Test

- Output quality.
- AI usefulness or narrative intelligence.
- Save behavior.
- Export behavior.
- Autosave behavior.
- Recovery repair.
- Production readiness.
- Multi-window promotion.
- Split Command promotion.

## Evidence Notes

- Record the exact project path and project state used for each smoke step.
- Distinguish operator-visible behavior from harness-only proof.
- Note any state that appears normalized, repaired, or silently persisted.

