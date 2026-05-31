# Pass 120 - Workflow Smoke Human Verification Plan

## 1. Scope

Pass 120 is human smoke planning only.

This pass does:

- define a bounded manual workflow checklist for recovery confidence
- define evidence capture requirements and blocker criteria
- define Codex escalation triggers when failures are observed

This pass does not:

- implement repairs
- redesign GUI
- modify runtime/test behavior

## 2. Carry-Forward Context

- Backend recovery is closed with caveats (`Pass 118`).
- Renderer automated validation is green (`Pass 119`).
- Remaining uncertainty is human workflow and continuity confidence.

## 3. Human Workflow Smoke Checklist

| Area | Human action | Expected result | Failure evidence to capture | Blocks product recovery? | Should become Codex recovery lane? |
| --- | --- | --- | --- | --- | --- |
| 1. App launch | Launch from dev flow (`pnpm dev`) and wait for UI settle. | Main window appears, app is interactive, no immediate crash loop. | Screenshot of window/error, terminal logs, timestamp, launch command used. | Yes if app cannot launch or is non-interactive. | Yes, immediate lane if reproducible. |
| 2. Backend connection/health banner | Observe service health indicator at startup and after idle. | Shows healthy/connected state without contradictory copy. | Screenshot of banner/state pill, renderer console message (if visible), backend health endpoint response if checked. | Yes if app incorrectly reports unavailable backend while backend is healthy. | Yes if deterministic mismatch. |
| 3. Project open/load | Open a known valid project from normal UI path. | Project loads, core panes render, active scene/draft context appears. | Screenshot of loaded project, any error toast/modal, logs from backend and app terminals. | Yes if valid project cannot load. | Yes, high-priority recovery lane. |
| 4. Project switching (if available) | Switch from one valid project to another and back. | Context rebinds cleanly; no stale drafts/scene bleed across projects. | Before/after screenshots, selected project paths/names, stale-content proof if seen. | Yes for deterministic cross-project contamination. | Yes, continuity lane candidate. |
| 5. Draft view visible text continuity | Read visible draft text, navigate away and back (pane toggle/scene reselection). | Same draft text remains consistent with selected scene/project context. | Screenshots before/after, scene ID/project path, mismatch notes. | Yes if text changes unexpectedly or stale text appears. | Yes, renderer continuity lane. |
| 6. Draft generation | Trigger generation from normal UI action on loaded project. | Request completes with visible draft output or controlled, truthful error. | Screenshot of prompt/context and output/error, request timestamp, any trace ID shown. | Yes if generation path fails silently or hard-errors reproducibly. | Yes if reproducible outside transient provider issues. |
| 7. Critique/feedback flow | Run critique on generated/loaded draft. | Critique result appears, tied to current draft context. | Screenshot of critique result, stale/empty/misaligned output evidence. | No if minor wording issue only; Yes if fails or binds wrong draft. | Yes when deterministic context mismatch/failure. |
| 8. Rewrite/sync draft view | Apply rewrite/sync action and verify updated visible draft text. | Rewritten content is visible in draft view and remains after refresh/reselect. | Before/after screenshots, visible text diff note, any failure toast/logs. | Yes if rewrite applies but visible draft does not sync. | Yes, direct renderer recovery lane. |
| 9. Snapshot/recovery (if available) | Create/inspect snapshot/recovery state and execute bounded recovery action if exposed. | Snapshot appears with truthful status; recovery action yields controlled result messaging. | Screenshot of snapshot list/status and recovery result copy, any mismatch between claim and outcome. | Yes if recovery path is broken or misleading for normal flow. | Yes if deterministic regression. |
| 10. Export (if available) | Trigger export from normal UI path and verify artifact creation. | Export completes with clear success/failure message and output artifact appears at expected location. | Screenshot of export result, file path and file presence check evidence. | Yes if export is unavailable/broken in normal supported flow. | Yes, backend/renderer contract lane as needed. |
| 11. Diagnostics/error visibility | Force a safe user-facing error path (for example invalid action order) and inspect guidance. | Error is visible, understandable, and actionable without leaking internal-only noise. | Screenshot of error surface, exact user action that triggered it, any confusing/internal-only copy. | No for wording-only clarity issues; Yes if failures are hidden/misleading. | Yes for deterministic misleading/error-obscuring behavior. |
| 12. Offline/online behavior (if easily testable) | Temporarily stop backend or disconnect local service route and observe UI transitions, then restore. | UI transitions to degraded/offline state honestly, then recovers to healthy state when backend returns. | Timestamped screenshots for offline and recovered states, backend stop/start commands used. | Yes if state is misleading or cannot recover. | Yes, service-health continuity lane. |

## 4. Blocker Criteria

Block product-recovery closure if any of these occur reproducibly:

1. app cannot launch or remain interactive
2. valid project cannot load
3. deterministic project-switch contamination or stale-context bleed
4. generation/critique/rewrite core path fails or rewrites do not visibly sync
5. recovery/export supported flows fail without controlled truthful handling
6. offline/online transitions are misleading or do not recover

Non-blocking but trackable findings:

- minor copy clarity issues
- cosmetic layout issues without workflow breakage
- one-off flake without reproduction steps

## 5. Recommended Human Test Order

1. App launch
2. Backend connection/health banner
3. Project open/load
4. Draft view visible text continuity
5. Draft generation
6. Critique/feedback flow
7. Rewrite/sync draft view
8. Project switching (if available)
9. Snapshot/recovery (if available)
10. Export (if available)
11. Diagnostics/error visibility
12. Offline/online behavior (if easily testable)

## 6. Evidence Capture Template

For each executed checklist step, record:

- step ID and area name
- exact action performed
- observed result (pass/fail)
- screenshot path(s) or equivalent evidence location
- reproducibility note (always/sometimes/once)
- blocker classification (`blocker`, `non-blocking`, `unclear`)
- Codex lane recommendation (`yes`/`no` + short rationale)

## 7. Final Verdict

`HUMAN SMOKE PLAN READY`
