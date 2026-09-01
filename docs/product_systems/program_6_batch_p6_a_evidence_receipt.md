# Program 6 Batch P6-A Evidence Receipt

## Status

`P6-A MECHANICAL IMPLEMENTATION COMPLETE; P6-B NOT STARTED`

This receipt records the bounded P6-A implementation authorized by the
explicit Luna/high handoff on 2026-08-31. It is versioned with the exact
commit whose subject is `feat(program-6): add story intelligence contracts`;
the final exact SHA and upstream synchronization are reported with the
handoff result.

Model routing for this batch was `GPT-5.6 Luna` with `high` reasoning. The
implementation stayed within the stored P6-A boundary and did not admit any
later batch or connector.

## Implemented boundary

- shared TypeScript contracts for signal posture, project posture, evidence
  class, confidence, impact, lifecycle, currentness, intensity, source class,
  position references, provenance, permission, persistence, and typed IPC;
- qualitative policy defaults: `ask-only` signals, `develop` project posture,
  deterministic analysis enabled, optional inference disabled, and bounded
  metadata-only retention;
- explicit separation of temporary candidate findings from durable signals;
  candidate lifecycle values cannot be persisted as durable signals;
- explicit lifecycle transition rules, terminal-state non-reopening, and
  revision/fingerprint-based currentness derivation;
- protected-source permission checks, deterministic-only model-package denial,
  optional-inference policy gating, and metadata-only protected display;
- project-local `story-intelligence.json` persistence with project identity,
  optimistic revision checks, bounded history, sibling temp-file writes, and
  atomic replacement;
- Writing Studio-only named IPC handlers and typed development/dedicated
  preload bridges; Command Center exposure remains excluded;
- focused contract, repository, IPC, and preload-parity tests.

No manuscript, outline, draft, project metadata, notes, signals, memory,
settings, or truth owner was mutated by this batch. The sidecar contract
rejects raw model output, prompt payloads, excerpts, credentials, provider
diagnostics, and temporary candidate findings.

## Green gates

| Gate | Result |
| --- | --- |
| Focused P6-A Vitest suite | PASS — 6 files, 37 tests |
| Renderer/shared TypeScript typecheck | PASS |
| Main-process TypeScript compile (`build:main`) | PASS |
| App ESLint | PASS |
| Documentation lint | PASS |
| Git diff hygiene | PASS |

Focused suite command:

```text
pnpm --filter app test -- --run shared/__tests__/storyIntelligencePolicy.test.ts main/__tests__/storyIntelligenceRepository.test.ts main/__tests__/storyIntelligenceIpc.test.ts main/__tests__/stage19PreloadChannels.test.ts main/__tests__/splitCommandPreload.test.ts main/__tests__/program3CombinedInstalledQualification.test.ts
```

## Explicit residuals and non-claims

- P6-B and every later Program 6 batch were not started.
- No UI, CSS, Emotion Graph rendering, analyzer, provider, Ollama, model-call,
  dependency, package, installer, or installed qualification work was done.
- No creation/revision workflow, human Gate 4 acceptance, or Program 6 closure
  is claimed.
- The sidecar contract is a bounded foundation; it does not claim useful
  story-intelligence findings, model quality, or author-experience readiness.
