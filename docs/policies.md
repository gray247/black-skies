Status: Active
Version: 1.0
Last Reviewed: 2025-11-15

# docs/policies.md — Operating Policies (Source of truth)

Authoritative policies for platform support, privacy, budgets, models, limits, and error handling. UX specifics live in `docs/gui/gui_layouts.md`. API contracts live in `docs/specs/endpoints.md`.

---

## Platform Support (LOCKED)
- **Supported OS (1.0):** Windows 11 only.  
- **Not supported (1.0):** macOS, Linux.  
- **Packaging:** Electron → **NSIS installer** + optional **portable EXE** (see [docs/packaging.md](./packaging.md) for commands).  
- **Updates:** auto-update **disabled** in 1.0 (manual installs only).  
- **Telemetry:** **none**. Crash logs saved locally to `history/diagnostics/`.

---

## Privacy & Data Handling (LOCKED)
- **Local‑first:** All content (outline, scenes, lore, reports) is stored in the **project folder** on disk.  
- **Project metadata:** Cache files, run ledgers, and backup verifier checkpoints live under each project’s `history/` tree; `_runtime/` only holds global service resilience state and never contains project identifiers or user text.
- **API Mode (optional):** External calls only occur when the user supplies their own API key. No keys are stored in cloud services.  
- **Insights Overlay:** Opens the user’s ChatGPT subscription in their **system browser**. The app copies selected text and context to the clipboard **only on explicit user action**; it never auto‑sends manuscript text.  
- **No analytics/telemetry.** Only local diagnostics files are written on errors.  
- **Analytics services deferred:** The analytics router and its derived dashboards remain disabled in Phase 8; enabling them requires explicit Phase 9 feature flags and never ships data outside the local machine.
- **Redaction (optional):** Companion redaction toggle (off by default) can scrub names/emails from copied text before the browser opens.
- **Voice notes & transcription:** The dictation and voice-note workflow remains deferred; Phase 8 services never accept or process audio/transcripts unless `BLACKSKIES_ENABLE_VOICE_NOTES=1` is explicitly supplied in non-production builds.
- **Model Router:** See `docs/specs/model_backend.md` for how budgets, routing rules, and privacy checks are centralized before any service touches an external provider.

---

## Model Selection Policy (LOCKED)
- **Scaffold tasks** (beats, pacing, buckets): use a **lower‑cost** model — config key `model.scaffold`.  
- **Prose & Critique** tasks: use a **higher‑quality** model — config key `model.prose`.  
- **Determinism:** When a `seed` is provided, pass it through; otherwise allow provider defaults.  
- **Temperature:** Default `0.7` for draft, `0.4` for critique (overridable per call).  
- **Provenance:** Every artifact records `{ model: { name, provider }, prompt_fingerprint }`.  
- **Caching:** If identical inputs (including seed) are seen again, reuse cached outputs for cost control.

---

## Budget Policy (LOCKED)
- **Budgets are per-project.**  
- **Soft cap:** **$5.00** — show Preflight with a warning; allow proceed.  
- **Hard cap:** **$10.00** — return `BUDGET_EXCEEDED`; user may raise the cap explicitly.  
- **Preflight estimate:** Every Writing/Feedback run must compute a token/$ estimate **before** execution and surface it in the Preflight panel.  
- **Accounting:** Responses include `{ budget: { estimated_usd } }`. Totals are tracked in **`project.json`** under `budget.spent_usd`.

---

## Request Limits (LOCKED)
(Enforced by services; mirrored in UI. See `docs/specs/endpoints.md` for details.)

- **/api/v1/draft/generate** → max **5 scenes** or **1 chapter** per request (legacy `/draft/generate` alias removed in `1.0.0-rc1`)
- **/api/v1/draft/rewrite** → **1 unit** per request
- **/api/v1/draft/critique** → up to **3 units** per request
- **/api/v1/outline/build** → one active build at a time per project

---

## Error Handling Policy (LOCKED)
- Services return the **common error shape** `{ code, message, details? }`.  
- **Error codes:** `VALIDATION`, `RATE_LIMIT`, `BUDGET_EXCEEDED`, `CONFLICT`, `INTERNAL`.  
- **Fail‑closed on validation:** Invalid structured outputs are **not** written to disk; return `VALIDATION` with details and log to diagnostics.  
- **User messaging:** Budget exceeded → sticky banner; validation errors → inline plus Preflight summary.

---

## File Integrity & Snapshots (LOCKED)
- **Autosave:** debounced ~2s after idle; writes to the current scene file.  
- **Snapshots:** created automatically on **Accept**/**Lock** actions; stored under `history/snapshots/` with timestamps.  
- **Restore:** History footer → Restore modal shows diff summary before confirming.

---

## Accessibility & Motion (LOCKED)
- Respect `prefers-reduced-motion`: spinner rotation disabled; keep gentle opacity pulse.  
- Keyboard navigation fully supported (see hotkeys in `docs/gui/gui_layouts.md`).  
- Minimum contrast: **4.5:1** for text; **3:1** for focus rings/icons.

---

## Performance Targets (LOCKED)
- Edit a **15k–20k** word scene with average keystroke latency **< 150 ms**.  
- Initial diff render **< 500 ms** on the same dataset.  
- Decorations and diff hunks must be virtualized to sustain targets.

## Packaging & Distribution (LOCKED)
- Installer guidance lives in `docs/packaging.md`; it captures platform targets, install locations, and first-run behaviors that complement this policy baseline.

---

## Plugins / BYO Endpoint (LOCKED)
- **BYO endpoint switch:** Present in Settings; **off by default**. Shows provider/model next to Preflight when enabled.  
- **Plugins v1 (read‑only):** Plugins may read a **snapshot** of project data and emit a **report** to `revisions/agents/`. They cannot modify files directly; all apply happens via the core UI.
- **Plugin execution (disabled):** Plugin/agent execution is gated by `BLACKSKIES_ENABLE_PLUGINS` and is disabled in Phase 8 builds. The sandbox runner will reject requests unless that guard is explicitly enabled for future phases 11+.

---

## Security & Licensing (LOCKED)
- **Dependency licenses:** prefer MIT/BSD/Apache-2.0. No copyleft dependencies in the shipping app. Capture sweep artefacts via [docs/ops/security_sweep.md](./security_sweep.md).  
- **Signing:** Dev-signed builds during beta; production Authenticode optional post-1.0.  
- **Network policy:** No background network calls; all external requests originate from explicit user actions (API Mode, Story insights overlay, or Companion).

---

## Versioning (LOCKED)
- This document: **v1**. Any change to budgets, limits, error model, or data handling must update this file and be recorded in `phase_log.md`.
