Status: Active
Version: 1.0
Last Reviewed: 2026-03-10

# Docs Overview

This folder holds canonical specs, GUI layout references, phase logs, and operational runbooks. Start with:
- `specs/architecture.md`
- `gui/gui_layouts.md`
- `phase_log.md`

---

## Companion Mode (Locked)
Companion is **not** an SDK. It is an integrated, dockable in-app browser pane/window that opens ChatGPT.  
Companion Mode remains separate from API Mode: no service-based model routing and no content exfiltration through the backend.

## Router-First Priority (Locked)
The ModelRouter seam and routing/policy/budget plumbing now ship **before** splash/onboarding expansion.  
Any new UI flow work must not block the router-first rollout.
