# Insight Gating & Float Notifications Plan
> **Status:** Supporting doc – extends `docs/gui/gui_fix_plan.md`.
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Category:** Supporting plan / Rescue kit / Deep-dive
> **Reference:** See `docs/gui/gui_fix_plan.md` for the canonical fixes and gating plan.

## Objective
1. Keep the Insights panel useful when the FastAPI bridge is offline by distinguishing between local-only insights and model-backed operations.  
2. Provide transparent feedback when floating panes are clamped (off-screen positions) during layout restoration.

## Scope
- **Insights split**
  - Local insights (counts, readability, local diff/continuity, timeline density, slide counts, basic continuity checks) stay enabled while offline.
  - Model insights (tone/pacing analysis, symbolism detection, rewrite prompts, style scoring, theme extraction) remain visible but disabled when the bridge is down, with the tooltip "Needs the model. Reconnect to run."
  - "Run all" executes only the available local insights while offline, queues the model-backed tasks in-session, and displays "3 local ran - 5 will resume when online."
  - Banner copy "Local only - model insights paused." and offline badges must reflect the bridge health so no model action appears enabled during outages.
  - State source: the renderer must rely on the `bridge.status` observable from `renderer/hooks/useBridgeStatus.ts` as the single source of truth for bridge health.
  - Queue persistence: the offline queue lives in volatile memory (per session) so reconnections start with fresh in-flight work.
  - Telemetry counters: emit `insights.local_ran`, `insights.model_queued_offline`, and `insights.model_ran_after_reconnect`.
  - Guard rails: ensure "Run all" never issues a network call while offline and that queued model runs auto-resume when the bridge recovers.

- **Floating pane relocation toast**
  - Clamp any restored float whose saved bounds fall outside the current visible work areas using `clampBoundsToDisplay`.
  - Trigger one toast per session when clamping occurs: "We moved '<Pane Title>' onto this display." Include "OK," "Don't show again," and (if the previous rect is still valid) "Try previous position."
    - Render the toast using `useToastStack()` so the shared notification bus handles presentation and preference persistence.
  - Add a brief dashed highlight on the relocated pane (2-second fade-out at 60% opacity, non-blocking to input) and log a Diagnostics entry structured as `{ "pane": "<title>", "from": [x,y], "to": [x2,y2], "reason": "off-screen clamp" }`.
  - Introduce preferences: "Notify when floating windows are relocated" (default on) and optional "Auto-snap floats back to preferred monitor when it reconnects" (default off), then honor these toggles when deciding whether to show the toast or auto-snap.
    - Surface the toggles under Project Home → Floating window behavior so writers can change them without editing local storage.
  - Guarantees: all floats land on-screen after monitor changes, Diagnostics records every clamped restore, and toasts respect the per-session "Don't show again" choice while still making the highlight visible.

## Rollback & Safety
- Gate both behaviors behind `featureFlags.insightsOfflineGating` and `featureFlags.floatClampNotice` so toggling either flag reverts to the previous experience.
- Diagnostics entries follow the structured JSON schema above to keep Recovery tooling stable.
- "Run all" must never fail just because model work is gated, and UI copy must accurately describe the state (for example, the banner says "offline" only when model chips are disabled).

## Execution Steps
1. Audit the current Insights UI to separate the local vs model chips/actions and determine how "Run all" dispatches each insight.
2. Integrate `bridge.status` from `renderer/hooks/useBridgeStatus.ts` for gating, banner copy, tooltip copy, and queue management; queue model insights in-session while offline.
3. Wire telemetry counters and ensure "Run all" bypasses network calls when offline while keeping the queued model work ready for auto-resume.
4. Improve layout persistence to detect clamped restores, clamp via `clampBoundsToDisplay`, log the diagnostics entry, highlight the pane, and surface the relocation toast via `useToastStack()`.
5. Persist the relocation notification preferences and respond to them when deciding whether to show toasts or auto-snap restored panes.
6. Update or add tests (Playwright `app/tests/e2e/gui.insights.spec.ts`, Vitest `app/renderer/utils/__tests__/layout.test.ts`) plus documentation so the behaviors are covered end to end.

## Verification
- Manual and automated tests confirm local insights run while offline, model insights stay visibly gated, and the offline state clears once the bridge recovers without reloading.
- Playwright `app/tests/e2e/gui.insights.spec.ts` validates offline gating, queue persistence, and auto-resume of model insights.
- Vitest `app/renderer/utils/__tests__/layout.test.ts` covers clamp detection, toast presentation, highlight animation, and preference enforcement.
- Floating panes always restore within visible bounds, the relocation toast appears once per session (respecting "Don't show again"), and Diagnostics logs every clamp.
- Telemetry counters fire as described and "Run all" stays network-silent while offline, while model chips stay disabled with the offline tooltip.
