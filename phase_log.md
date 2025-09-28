# phase_log.md — Phase Log (Source of truth)
**Status:** ACTIVE · 2025-09-23

Chronological record of locked decisions and spec/version bumps. One-line summary first, details after.

---

## 2025-09-23 — Docs synced to Phase 1 (v1)
- Locked and published: docs/endpoints.md (v1), docs/data_model.md (v1), docs/gui_layouts.md (v1), docs/exports.md (v1), docs/policies.md (v1), docs/phase_charter.md (v1),
  docs/architecture.md (v1), docs/agents_and_services.md (v1).
- Scope: Windows 11 only; local-first; CM6 editor; scene cap 20k; emotion tags (5); preflight & budgets.

## 2025-09-24 — Preflight docs & renderer coverage (ACTIVE)
- Expanded README and docs/endpoints.md with `/draft/preflight` walkthroughs for ok, soft-limit, and blocked responses.
- Added Vitest regression coverage for soft-limit warnings and blocked hard-limit states in the renderer harness.

## 2025-09-25 — Milestone 0 automation verified (LOCKED)
- Verified scripts/setup, scripts/maint, scripts/freeze_wheels.sh against Milestone 0 requirements.
- Confirmed requirements.lock, requirements.dev.lock, tooling configs, and wheel cache guard rails are committed.

## 2025-09-17 — Phase-1 Definition of Done (LOCKED)
- Wizard: all steps functional; decisions **lock & snapshot**; restore from History works.
- Outline: builds **deterministically** from locked decisions (`OutlineSchema v1`).
- Draft: generate **3 scenes**; store **prompts & seeds** with outputs (`DraftUnitSchema v1`).
- Critique: rubric run; **diff** shown; **Accept/Rollback** applies hunks and snapshots (`CritiqueOutputSchema v1`).
- Export: `outline.json` and `draft_full.md` write without errors.
- Recovery: crash → next launch shows Recovery banner; reopen last project; view diagnostics.
- Performance: **15k–20k** scene edit < **150 ms** avg keystroke; initial diff < **500 ms**.
- Budgets: soft **$5** warn; hard **$10** block with `BUDGET_EXCEEDED`.
- A11y: keyboard path complete; reduced-motion supported; contrast & focus rings per policy.
- Packaging: NSIS installer + portable ZIP produced; app ID set; icons/splash present.

## 2025-09-17 — Platform lock (LOCKED)
- 1.0 targets **Windows 11 only**. macOS/Linux deferred post‑1.0.
- Packaging: **NSIS installer** + optional **portable ZIP**.
- Auto-updates disabled for 1.0. No telemetry; diagnostics local-only.

---

## Change control
- Any spec change to **limits, budgets, schemas, error model, a11y, or platform** requires:
  1) Update the relevant doc(s) and bump **Version** if shape/behavior changes.
  2) Add a dated entry here with the new version(s) and a single-sentence rationale.

Template:
```
## YYYY-MM-DD — <change summary> (LOCKED|AMENDED)
- Affected docs: <files & versions>
- Rationale: <why>
- Notes: <migration/back-compat if any>
```
