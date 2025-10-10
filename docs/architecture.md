# docs/architecture.md — System Architecture v1.1
**Status:** UNLOCKED · 2025-10-09

Phase 11 analytics pipelines and Companion agents are defined in detail in [Agents & Services](./agents_and_services.md); the sections below highlight where those modules slot into the runtime topology.

---

## New Components Added Post-RC1
- **Analytics Service Module:** aggregates emotion/pacing/conflict metrics (see [Agents & Services](./agents_and_services.md#agent-roles) for producer responsibilities).
- **Voice Input Handler:** dictation & voice-note recorder.  
- **Agent Sandbox:** isolated execution for plugins/agents.  
- **Backup Verifier Daemon:** periodic checksum and integrity reporter.

---

## Updated Data Flow
Wizard → Outline → Draft → Rewrites/Critiques → Revisions → History  
→ **Analytics/Agents** → Exports.

---

## Process Boundaries (Expanded)
Renderer ⇄ FastAPI ⇄ Filesystem ⇄ Analytics/Agent Sub-services (orchestrated per [Agents & Services](./agents_and_services.md#plugin-registry-spec)).
