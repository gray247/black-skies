# Phase 21 Operator Smoke Checklist

Purpose: quick human smoke pass before Phase 22.

- This does not reopen Phase 21 unless a real blocker shows up.
- This does not start Phase 22.
- It checks whether the current Split Command shell feels stable enough to continue.

## Current Smoke Update

- So far the hidden Split Command shell is good.
- The confusing or weird judgment stays deferred until a true second-screen workflow exists.
- `/healthz`-linked flicker is now a reproducible follow-up item and should be reported as a frontend render issue.
- This smoke does not claim backend durability is solved or broken.

## Launch

Use the existing hidden GUI launch method:

- start the backend normally
- start Vite normally
- launch Electron with `BLACKSKIES_CONFIG_PATH` pointing at a temporary runtime YAML like:

```yaml
ui:
  enable_docking: false
  experimental_split_command_workspace: true
```

## Human Smoke Tasks

### 1. Baseline open

- Open the app without the hidden flag.
- Confirm the normal stable GUI appears.
- Take a screenshot only if the hidden GUI appears by accident.

### 2. Open Split Command

- Open the app with the hidden flag.
- Confirm Command Center and Writing Studio appear.
- Take one screenshot if it opens successfully.

### 3. Condensed mode

- Narrow the window.
- Confirm Writing Studio stays usable.
- Confirm Command Center or secondary panels collapse or degrade first.
- Take a screenshot if cramming, fighting, or flicker is visible.

### 4. Project switch

- Switch from Esther Estate to another project if practical.
- Confirm the project identity updates correctly.
- Confirm old Story Navigation state does not linger.
- Take a screenshot if identity or navigation looks wrong.

### 5. Restore/reopen

- Close and reopen the app with the hidden flag still enabled.
- Confirm the same project and shell return sensibly.
- Confirm shell persistence does not look corrupted.
- Take a screenshot if layout or state looks wrong.

### 6. Shell persistence

- Open or close diagnostics, or any visible shell toggle if available.
- Reload or reopen.
- Confirm shell-local state persists or resets as designed.
- Take a screenshot only if something looks weird.

### 7. Story Navigation usability

- Inspect whether Story Navigation is obvious enough.
- Click or select a scene if available.
- Confirm the active scene changes visibly.
- Report whether the navigation meaning is clear or confusing.

### 8. Placeholder honesty

- Inspect Narrative Gaps, AI Companion, Global Tools, and Narrative Overview if visible.
- Confirm placeholders clearly look inactive, mock, or deferred.
- Take a screenshot if anything looks like fake production intelligence.

### 9. Backend drops and flicker

- Watch for backend service drops or reconnects.
- Watch for screen flicker.
- Note whether it happens only in the hidden GUI or also in the normal GUI if tested.
- Take a screenshot or short video only if the issue is severe or repeatable.

## What To Report

Report only this:

- Stable GUI baseline: pass/fail
- Split Command opens: pass/fail
- Condensed mode: pass/fail/rough
- Project switch: pass/fail/not tested
- Restore/reopen: pass/fail/not tested
- Shell persistence: pass/fail/unclear
- Story Navigation: clear/confusing
- Placeholder honesty: pass/fail
- Backend drops/flicker: none/minor/severe
- Screenshots attached: yes/no
- Overall:
  - okay to proceed to Phase 22 planning
  - fix narrow blocker first
  - defer issues to later phase
  - stop and investigate

## Screenshot Rules

- Screenshot the successful hidden GUI open once.
- Screenshot any failure or weird state.
- Screenshot cramming or fighting if visible.
- Screenshot fake-looking placeholder content if visible.
- Screenshot wrong project identity if visible.
- No screenshot is needed for boring passes.

## Issue Classification

Fix before Phase 22 only if:

- stable GUI breaks
- hidden GUI appears without the flag
- wrong project identity appears
- shell cannot open
- restore/reopen corrupts shell state
- placeholder or mock content appears as real AI output

Defer:

- cramming, flicker, or layout roughness -> Phase 20 / Phase 22 follow-up
- Story Navigation discoverability -> Phase 21 follow-up or Phase 22 if writing-surface related
- backend drops -> Phase 25 unless stable GUI also reproduces
- missing AI or intelligence -> Phase 23
- missing two-monitor behavior -> Phase 24
- long-session fatigue or performance -> Phase 25
