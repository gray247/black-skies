# Stage 19 Black Skies V1.0 Scope Lock

## 1. Authority and milestone

Stage 19 is the governed implementation and acceptance program that culminates
in Black Skies V1.0. V1.0 is the product milestone, not another stage system.
Packages `19.1` through `19.5` are the `Foundation Spine` package group. They
are useful bounded implementation and automated evidence, but do not close
Stage 19 and do not prove V1.0.

This scope lock authorizes planning and selection only. Each implementation
package still requires a separate bounded authorization.

## 2. Minimum honest V1.0 promise

> A writer can create or open an isolated local project, develop an outline
> and organized manuscript, write and revise prose, save safely, recover from
> ordinary interruption, close and reopen the project, understand project and
> save state, and export usable work. The core writing workflow works without
> AI, cloud services, or optional analysis systems. Any AI capability that
> ships remains advisory and requires explicit author acceptance before
> changing manuscript truth.

## 3. Supported release boundary

- operating system: Windows 11
- host: packaged Electron application launched without development tooling
- packaging target: NSIS installer; portable executable is not required
- project model: isolated local directory with durable identity, versioned
  metadata, ordered manuscript units, and explicit supported-format rules
- compatibility: V1.0-created projects and any current format explicitly
  admitted by the lifecycle package; older, unknown, invalid, or future schema
  versions are rejected honestly and never silently migrated
- core operation: no AI, cloud, internet, Python, or globally installed Node
  requirement after installation

## 4. Required V1.0 capabilities

The following are release blockers:

1. real packaged Windows host launch;
2. local project creation, opening, durable identity, and strict isolation;
3. actual-host Writing Surface and Command Center integration;
4. a reliable outline/binder sufficient to create, order, select, and identify
   manuscript units;
5. reliable prose editing and navigation without cross-contamination;
6. honest clean, dirty, saving, saved, failed, and stale/conflict semantics;
7. durable safe save, unsaved-work warning, normal close, and re-entry;
8. minimum interruption recovery that never silently replaces the last durable
   save and remains isolated to its originating project;
9. understandable failure messages that preserve editor work;
10. Markdown manuscript export in authoritative manuscript order;
11. keyboard/focus usability, readable scaling, non-color-only status, labels,
    and accessible error/status presentation;
12. clean installation, packaged smoke testing, manual Jason acceptance, and
    documented limitations.

The data-safety floor prohibits known silent data loss, cross-project state,
dishonest saved status, silent stale overwrite, or silent manuscript-truth
mutation. Atomic or equivalently safe replacement, failure preservation, and
project-scoped recovery are mandatory. A separate full project-backup feature
is not mandatory, but backup guidance and the limits of recovery must be
documented.

## 5. Optional capabilities

The following may ship only through separate package gates and may be removed
without blocking core V1.0:

- at most bounded advisory drafting and/or feedback;
- budget visibility and local/API routing;
- history beyond the minimum recovery floor;
- portable executable;
- JSON project export, DOCX, or EPUB;
- advanced dock/float/multi-monitor restoration; and
- rich analytics or manuscript signals.

No AI feature is mandatory. If included, it must be user-initiated,
nonessential, project-isolated, visibly proposed, and incapable of changing
manuscript truth without explicit author acceptance.

## 6. Explicitly deferred unless separately approved

- collaboration, cloud sync, cross-device synchronization, and connectors;
- autonomous agents, broad rewrite automation, and model training;
- plugin marketplace;
- historical Gray Skies restore/import and sample normalization;
- advanced provenance graph and broad diagnostic cockpit;
- macOS/mobile packaging and automatic updater infrastructure;
- protected evidence use.

## 7. Evidence partitions

- **A — synthetic unit data:** deterministic data created in tests.
- **B — generated temporary projects:** per-test lifecycle, isolation,
  failure-injection, migration, and E2E projects.
- **C — curated non-protected release fixtures:** explicitly approved,
  copyright-safe, inspectable representative projects.
- **D — disposable manual acceptance projects:** freshly created projects for
  Jason's app, failure, packaging, and writing-session acceptance.
- **E — protected evidence:** remains sealed under existing controls.

No fixture may be regenerated, promoted, or borrowed across these partitions
without its owning authorization.

## 8. Release blocker taxonomy

- **P0:** data loss, project crossover, security breach, unrecoverable
  corruption, or truth-mutation violation; no RC may ship.
- **P1:** primary create/open/write/save/reopen/export, accessibility, packaged
  launch, or common-crash failure; no release.
- **P2:** major bounded degradation with a workaround; fix or obtain explicit
  Jason acceptance.
- **P3:** minor cosmetic or wording defect; may defer with documentation.

## 9. Stage 19/V1.0 closure floor

Closure requires all required packages, critical static/automated/Electron
gates, manual happy/failure/isolation/real-session/two-monitor acceptance,
packaged installation acceptance, no unresolved P0/P1, honest recovery and
known limitations, release documentation, a clean synchronized repository,
correct version/tag, and Jason's explicit release authorization.

PZ_CONTINUE: Black Skies V1.0 scope locked for Stage 19 planning; runtime continuation still requires separate package authorization
