# docs/agents_and_services.md — Agent Hooks v1.1
**Status:** UNLOCKED · 2025-10-09  
Defines Phase 11 agent and plugin interfaces.

---

## Agent Roles
- **Planner:** outline validation, beat analysis.  
- **Drafter:** AI rewrite & tone variants (read-only).  
- **Critic:** batch rubric evaluation.  
- **Librarian:** backup verification + archive exports.

---

## Plugin Registry Spec
`/plugins/{plugin_name}/manifest.json`  
```json
{
  "id": "example.plugin",
  "description": "Adds new analytics graph",
  "permissions": ["read:project","emit:report"]
}
```

---

## Guardrails (unchanged core)

* Read-only until explicit approval; diffs must be human-applied.
* Must respect token budgets and privacy policy.
* Agents execute inside sandbox with limited I/O.

