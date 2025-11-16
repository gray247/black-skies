Status: Draft
Version: 0.9.0
Last Reviewed: 2025-11-15

# Offline Status & Cache Manager – Planning Notes (Phase 11)
**Status:** In progress (T-9145) · 2025-10-07  
**Owner:** Desktop Runtime Team  
**Charter Reference:** docs/phases/phase_charter.md §73

## Goal
Surface reliable offline/online status in the desktop shell and manage cached API responses so the app degrades gracefully without connectivity.

## Deliverables
1. **Connectivity indicator** in the workspace header reflecting FastAPI availability + network reachability.
2. **Cache manager** handling analytics, project metadata, and voice note transcripts for offline viewing.
3. **Settings controls** to clear caches and opt-in/out of background refreshes.

## Requirements
- Detect connectivity via heartbeat (`/api/v1/healthz`) + renderer network events.
- Cache analytics (`analytics_summary.json`), project health payloads, and voice note transcripts in `.blackskies/cache/`.
- Queue outbound mutations when offline; prompt user once connectivity returns (Phase 11 stretch).
- Provide user feedback: banner + icon states (`online`, `degraded`, `offline`).
- Telemetry: log offline sessions and cache hits for dashboards.

## Task Breakdown
1. **Connectivity service:** renderer hook + preload bridge raising status events (Phase 11.0).
2. **Cache layer:** common utilities (`app/shared/cache.ts`) for read/write/expiry + validation (Phase 11.1).
3. **UI integration:** header indicator, optional toast on status change, Settings page controls (Phase 11.2).
4. **Background refresh:** schedule cache refresh when idle/online (Phase 11.3).
5. **Testing:** mock offline mode in Playwright; unit tests for cache eviction (Phase 11.4).
6. **Docs:** update support playbook + release checklist (Phase 11.5).

## Risks & Mitigations
- **Stale data:** add TTL metadata, surface “last updated” timestamp.
- **Large cache footprint:** enforce size limits, rolling cleanup.
- **User confusion:** ensure status messaging consistent across header/banner/tooltips.

## Dependencies
- Backup verification daemon (for cache invalidation signals).
- Dashboard initiatives (to consume cached data).
