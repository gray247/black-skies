# Canonical Command Recipe and Preflight Planning

Status: Produced
Canonical role: Planning artifact for deterministic command, shell, root, and environment assumptions before broader implementation campaigns or broad `/goals` use.
Scope: Define canonical execution assumptions, candidate command recipes, and candidate preflight checks for local development and bounded validation lanes.
Owns: Operational discipline for command-root, shell, environment, and lane-selection expectations.
Does not own: Wrapper implementation, shell normalization code, preflight automation scripts, production behavior, test implementation, or phase sequencing.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

## Purpose

Broad implementation work needs deterministic execution assumptions. Hidden shell, root, and environment differences can distort what local runs, CI runs, Playwright runs, truth-lane runs, and Codex execution actually prove.

This artifact defines operational discipline before implementation scaling. It does not implement wrappers, preflight scripts, or command normalization.

## Evidence Inspected

- Governance and audit artifacts:
  - `docs/audits/phase14/wrapper_launcher_cwd_audit.md`
  - `docs/audits/phase14/recovery_load_project_switch_continuity_audit.md`
  - `docs/audits/phase14/cross_system_operational_risk_sweep.md`
  - `docs/roadmap/authority_reconciliation_strategy.md`
  - `docs/roadmap/master_phase_allocation_plan.md`
  - `docs/roadmap/deferred_work_matrix.md`
  - `docs/BLACK_SKIES_FIX_TRACKER.md`
- Review documents:
  - `docs/reviews/stable_environment_confirmation.md`
  - `docs/reviews/canonical_authority_and_validation_lanes.md`
  - `docs/reviews/false_confidence_reduction_plan.md`
- Command and script surfaces:
  - `package.json`
  - `app/package.json`
  - `scripts/truth-with-backend.mjs`
  - `scripts/smoke.ps1`
  - `scripts/smoke.sh`
  - `scripts/smoke_runner.py`
  - `app/main/preload.ts`
  - `.github/workflows/security.yml`
- Search surfaces:
  - `cwd`, `process.cwd`, `PYTHONPATH`, `PowerShell`, `bash`, `pnpm`, `python`, `uvicorn`, `playwright`, `pytest`, `spawn`, `subprocess`, `shell`, `repo root`, `project root`, `relative path`, `absolute path`, `serviceStubs`, `overrideServices`, `truth lane`, `bootstrap`, `preflight`, `environment`, `fixture`, `materialize`

## Current Operational Risks

- Wrapper/CWD risk:
  - already classified as `Observed risk`
  - launch surfaces do not yet prove one canonical local execution path
- Continuity risk:
  - already classified as `Observed risk` overall
  - continuity-sensitive validation can be distorted by stale renderer, storage, or project-root assumptions
- Shell inconsistency risk:
  - Windows PowerShell, POSIX shell, Node launcher scripts, and CI bash flows are all active
  - parity between them is not yet Trusted
- Root/path ambiguity:
  - repo root, app workspace root, project base dir, temporary truth-lane fixture roots, and alias-compatible sample roots are distinct surfaces
- Harness overconfidence:
  - `overrideServices`, `PLAYWRIGHT`, synthetic/test flags, and fixture materialization can narrow what a green run proves
- Local-vs-CI divergence:
  - CI scripts are often more explicit than local convenience paths
  - local commands can still inherit unstated shell or cwd assumptions
- Synthetic/truth-lane overread risk:
  - truth lane is useful and intentionally narrower than broad runtime proof
  - synthetic or harness-only success cannot upgrade runtime confidence beyond the scoped claim

## Canonical Execution Assumptions

### Repo root expectations

- Default repository root for top-level commands is `C:\Dev\black-skies`.
- Commands must state whether they are intended for:
  - repo root
  - `app/` workspace root
  - a materialized fixture/project root
- No continuity-sensitive or implementation-heavy command should rely on inherited cwd implicitly.

### Shell expectations

- Current local default shell is PowerShell.
- CI examples frequently assume bash semantics.
- Command guidance must declare when a recipe is:
  - PowerShell-first
  - bash/POSIX-first
  - shell-agnostic through `node` or `pnpm`
- Broad implementation campaigns must not assume PowerShell and bash are interchangeable proof surfaces.

### Launch expectations

- Repo-root script entrypoints such as `pnpm dev`, `pnpm test:e2e`, and `pnpm test:truth` are the canonical starting points unless a narrower workspace command is explicitly required.
- App-only commands must say when they require `pnpm --dir app ...` or `pnpm --filter app ...`.
- Truth-lane and smoke commands must be treated as distinct lanes, not generic runtime proof.

### Environment assumptions

- Python execution should explicitly say whether it expects:
  - `.venv`
  - `PYTHON`
  - `PYTHONPATH`
  - repo-root imports
- Environment-dependent commands should declare whether they rely on:
  - `BLACKSKIES_PROJECT_BASE_DIR`
  - `PROJECT_BASE_DIR`
  - `PLAYWRIGHT`
  - `BLACKSKIES_E2E_MODE`
  - `BLACKSKIES_E2E_SYNTHETIC_MODE`
- If a command requires service overrides, that must be treated as lane-scoped evidence, not runtime truth.

### Project-root assumptions

- Project identity must be explicit for continuity-sensitive flows.
- Sample fixture roots, alias-compatible roots, and temporary materialized truth-lane roots are not interchangeable unless the lane defines them explicitly.
- Commands must not imply that `proj_esther_estate` and `Esther_Estate` are safe to treat as one root without the relevant authority and continuity caveats.

### Relative-path expectations

- Relative-path commands are acceptable only when the required root is explicitly named.
- Cwd-sensitive scripts such as smoke and truth helpers should be documented with their required root and expected env state.
- Critical verification lanes should prefer explicit root-setting behavior over inherited caller state.

### localStorage and session assumptions

- Continuity-sensitive verification must not assume renderer `localStorage`, session state, cached pane state, or draft-preview continuity is already clean.
- If a lane can be distorted by stale local state, the command recipe must say so and the preflight should call it out.

### Truth-lane limitations

- Truth lane is a scoped runtime lane, not a general runtime-confidence certificate.
- Truth-lane success does not prove wrapper determinism, continuity correctness, GUI authority semantics, or cross-project state hygiene outside the lane's scope.

## Canonical Command Recipe Candidates

These are candidate recipes only. They are not implemented normalization rules yet.

| Recipe | Required root | Required shell | Required environment assumptions | Known risks | Currently trusted? |
| --- | --- | --- | --- | --- | --- |
| Local docs-only work | Repo root | PowerShell or bash | None beyond git and docs tooling already installed | Low runtime distortion; still subject to stale repo state if branch/worktree assumptions are unclear | Yes for docs-only scope |
| Local backend launch | Repo root | PowerShell preferred on current local Windows setup | Python available; `.venv` preferred; explicit `PYTHONPATH` or import path expectations when needed | Local Python/env drift, cwd-sensitive imports, project-base-dir ambiguity | Partially trusted |
| Local frontend/Electron launch | Repo root via `pnpm dev` | PowerShell preferred locally | Node/pnpm versions available; repo-root script entrypoint used | Wrapper/CWD and preload-state assumptions still observed risk | Partially trusted |
| Local Playwright execution | Repo root for wrapper scripts, `app/` workspace when explicitly required | PowerShell locally | Playwright deps installed; explicit lane choice; service overrides and fixture assumptions declared | Harness overread, wrapper determinism risk, override-service ambiguity | Partially trusted |
| Local truth-lane execution | Repo root | PowerShell locally, node-managed | `.venv` or explicit Python; explicit fixture materialization; env vars set by launcher; no assumption that this proves all runtime lanes | Narrow lane can be overread as broad runtime proof; wrapper/CWD still observed risk | Partially trusted for scoped claim only |
| Local smoke execution | Repo root | PowerShell on Windows, bash on POSIX | `.venv`; `BLACKSKIES_PROJECT_BASE_DIR`; `PYTHONPATH`; explicit project id | Shell divergence, cwd fallback pressure, sample-project assumptions | Observed risk |
| Local contract execution | Repo root or `app/` as explicitly documented | Shell declared per command | Must declare whether command proves renderer-only, truth-lane, backend-only, or CI/hygiene scope | Risk of mixing proof lanes and overclaiming | Partially trusted if lane-scoped |
| Bounded `/goals` usage | Repo root with explicit cwd for every command | PowerShell locally unless prompt states otherwise | Explicit root, shell, lane, env, and fixture assumptions per campaign | Unsafe if broad implementation work inherits hidden shell/root/env state | Safe only for docs/spec planning and narrow read-only verification |

## Preflight Candidate Checklist

These are candidate checks only. They are not automated yet.

1. Verify repository root.
2. Verify current branch and intended scope.
3. Verify git worktree state is either clean or intentionally acknowledged.
4. Verify shell in use.
5. Verify Node and pnpm availability.
6. Verify Python executable and `.venv` expectations.
7. Verify `PYTHONPATH` expectations for Python-backed commands.
8. Verify project identity and project-base-dir assumptions.
9. Verify whether the lane uses sample fixtures, materialized fixtures, or real local project data.
10. Verify whether `serviceStubs`, `overrideServices`, `PLAYWRIGHT`, or synthetic-mode flags are active.
11. Verify whether stale `localStorage`, session, cache, or renderer persistence could distort the run.
12. Verify whether the command is docs-only, backend, renderer, Playwright, truth-lane, smoke, or contract-lane work.
13. Verify whether the command claims runtime truth, harness truth, or planning-only evidence.

## `/goals` Readiness Guidance

### Currently safe `/goals` categories

- docs-only passes
- roadmap and tracker maintenance
- spec-planning passes
- read-only audits
- narrow command-verification work with explicit root, shell, and environment assumptions

### Currently unsafe `/goals` categories

- broad implementation campaigns spanning backend, preload, renderer, and test lanes
- continuity-sensitive campaigns that assume project-switch, recovery, or cached state correctness
- campaigns that treat truth-lane, Playwright, smoke, or synthetic success as broad runtime proof
- campaigns that depend on unstated shell, cwd, Python, or fixture assumptions

### Guardrails required before broad implementation `/goals`

- explicit root for every command
- explicit shell for every lane where Windows-vs-bash differences matter
- explicit lane labeling for every validation step
- explicit environment and fixture assumptions
- explicit note when local state, cache, or session clearing is required
- explicit acknowledgment that wrapper/CWD and continuity remain non-Trusted

### What must become more Trusted before broad implementation campaigns

- wrapper / launcher / cwd determinism
- continuity and project-switch correctness
- clearer local-vs-CI parity for core launch lanes
- more explicit preflight discipline around environment and state
- stronger separation between real runtime proof and harness-only proof

## Future Implementation Recommendations

- create a formal preflight script once the candidate checklist is accepted
- define a canonical shell wrapper or explicit shell matrix for local execution
- enforce repo-root expectations for critical command lanes
- add environment validation for Python, pnpm, project root, and fixture assumptions
- create deterministic launch wrappers for the highest-risk local lanes
- add CI/local parity validation for the lanes that will support implementation campaigns

## Open Questions For Operator

1. Should a future preflight script become mandatory before implementation `/goals`?
2. Should `localStorage` and session clearing become standard before continuity-sensitive verification?
3. Should shell normalization become explicit `Phase 16` work, or should it be handled as pre-`14B` support?
4. Should bounded `/goals` require explicit authority-layer labeling in the prompt and validation notes?
