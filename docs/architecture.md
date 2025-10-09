# docs/architecture.md — System Architecture v1.1
**Status:** UNLOCKED · 2025-10-09

---

## New Components Added Post-RC1
- **Analytics Service Module:** aggregates emotion/pacing/conflict metrics.  
- **Voice Input Handler:** dictation & voice-note recorder.  
- **Agent Sandbox:** isolated execution for plugins/agents.  
- **Backup Verifier Daemon:** periodic checksum and integrity reporter.

---

## Updated Data Flow
Wizard → Outline → Draft → Rewrites/Critiques → Revisions → History  
→ **Analytics/Agents** → Exports.

---

## Process Boundaries (Expanded)
Renderer ⇄ FastAPI ⇄ Filesystem ⇄ Analytics/Agent Sub-services.
