# Program 7 Creation, Revision, And Readiness Implementation Plan

## 1. Status And Authority

- Status: `implementation-planned; implementation not started`
- Program: `Program 7 - Creation, Revision, And Readiness`
- Governing charter:
  [`program_7_creation_revision_and_readiness_charter.md`](program_7_creation_revision_and_readiness_charter.md)
- Planning tree:
  `C:\Users\gray2\.codex\worktrees\4f0b\black-skies`
- Planning branch: `codex/foundation-audit`
- Implementation authority: blocked until the planning state is accepted in a
  user-created commit and a separate Program 7 implementation worktree is
  explicitly established.
- Commit and push authority: user only. Agents must not commit or push.
- Package execution preference: bounded Luna-high agents coordinated and
  reviewed by a stronger primary coordinator.
- Central integration rule: one serial owner at a time for shared host files.

This document converts the accepted Program 7 charter, implementation-boundary
review, runtime evidence, and qualification direction into executable package
authority. It does not itself authorize implementation in the dirty planning
tree.

The planning tree is intentionally dirty with uncommitted documentation,
concept images, corpus material, and related planning assets. Those files must
be reviewed and accepted as one planning baseline before an implementation
agent edits application or test code.

## 2. Program Outcome

Program 7 is complete only when the product supports and qualifies all of the
following workflow families, or records a precise deferral with its reason,
owner, resolution stage, and reopening trigger:

1. a Program 6 finding becomes deliberate author-owned revision work;
2. the author can revise, recheck, and resolve that work without AI;
3. Story Foundation remains optional and author-owned;
4. manual and explicitly requested local-AI revision candidates can be
   compared without becoming manuscript truth;
5. the author can accept all or only selected candidate text through the
   manuscript truth owner;
6. ideation, branching, premise testing, combination, and an Idea Library work
   without silently creating project or manuscript truth;
7. accepted material is promoted through the correct destination owner;
8. bounded history preserves provenance, source drift, protection, recurrence,
   and author actions; and
9. the complete behavior is qualified on the Carmilla long-form corpus in
   Writing Studio and Command Center, with no-AI and admitted local-AI paths.

Human Gate 4 validates the first complete finding-to-resolution foundation. It
does not silently close Story Foundation, proposal comparison, selective
acceptance, ideation, promotion, or integrated-history scope.

## 3. Frozen Invariants

Every package and review must preserve these invariants:

- Program 7 begins with Program 6 finding-to-revision action.
- A finding becomes durable Program 7 work only after the author chooses
  `Work on this`.
- Manual review, editing, recheck, and resolution remain complete without AI.
- Jason alone resolves a Program 7 revision item.
- AI may record only `appears resolved` or `still appears present`.
- Later recurrence creates a related new issue; it never silently reopens or
  rewrites resolved history.
- Local AI is an explicit first-class route and never a silent fallback.
- `qwen3:4b` is the only provisional Program 7 local-model pilot.
- `Carmilla` is the long-form Program 7 corpus.
- `Revision Desk`, `Story Foundation`, `Ideas`, and `History` remain
  provisional surface names.
- Program 7 introduces no new font or text-color token.
- Pale or light-gray typography must not return.
- Directional concept images are not pixel, color, font, truth-owner, or
  provider-routing authority.
- Rewrite acceptance and revision-item resolution are separate author actions.
- Command Center may aggregate and request owner actions, but it does not own
  manuscript truth, revision state, Story Foundation, Outline, or Ideation.
- Protected, masked, hidden, deleted, forgotten, discarded, or AI-excluded
  content must not leak through projections, history, model packages, or
  preloads.
- Programs 8 and 9 remain outside Program 7 except for explicit deferred
  handoff packages and the one-model local pilot authorized here.

## 4. Existing Runtime Boundaries

Program 7 extends the Electron and Stage19 product path.

The following existing files provide the reusable foundations:

- `app/shared/ipc/feedbackNotes.ts`
- `app/main/feedbackNotesRepository.ts`
- `app/main/feedbackNotesIpc.ts`
- `app/shared/ipc/storyIntelligence.ts`
- `app/shared/storyIntelligencePolicy.ts`
- `app/shared/program6ProductionProjection.ts`
- `app/shared/ipc/manuscriptStructure.ts`
- `app/shared/manuscriptStructure.ts`
- `app/shared/ipc/projectSpine.ts`
- `app/main/projectSpineIpc.ts`
- `app/main/projectSessionCoordinator.ts`
- `app/shared/ipc/livingOutline.ts`
- `app/main/livingOutlineRepository.ts`
- `app/shared/localInference.ts`
- `app/main/preload.ts`
- `app/main/stage19Preload.ts`
- `app/main/main.ts`
- `app/renderer/Stage19WritingSpineApp.tsx`
- `app/renderer/Stage19WritingSpineView.tsx`
- `app/renderer/components/Program6StoryKnowledgeWorkspace.tsx`
- `app/renderer/components/ContinuityReview.tsx`
- `app/renderer/styles/app.css`

Program 7 must reuse:

- Feedback Notes / Revision Resolution as the sole durable revision-item
  owner;
- `ManuscriptStructureAnchorV1` and the existing exact, relocated, ambiguous,
  and stale resolution behavior;
- Program 6 finding, signal, position, currentness, and provenance contracts;
- ProjectSpine project, path, generation, recovery, optimistic-save, and
  Writing-only mutation protection;
- Living Outline as the destination owner for accepted structural promotion;
  and
- the existing `create-develop` Command Center workspace and Writing Studio
  right rail.

## 5. Service-Era Draft Boundary

Program 7 must not call, import, or adapt the service-era draft generation,
rewrite, or acceptance routes as its runtime path.

The excluded files include:

- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/routers/draft/revision.py`
- `services/src/blackskies/services/operations/draft_accept.py`
- `services/src/blackskies/services/draft_synthesizer.py`
- `services/src/blackskies/services/models/draft.py`
- `app/shared/ipc/services.ts` draft-generation and rewrite methods

Those paths are incompatible because they may persist generated or rewritten
scene text before Program 7 acceptance, include legacy provider routing and
budget behavior, can silently fall back after provider failure, use legacy
scene and chapter identities, and can create unrelated budget, Canon Court,
continuity, or Memory Lab side effects.

Program 7 may use lessons from their tests, but it must not reuse their routes,
adapters, persistence operations, or fallback behavior.

## 6. Execution Rules

Each package receives exclusive ownership of every file named for that package.
No other active agent may edit those files.

Package agents must:

1. read repository instructions before work;
2. inspect current file state immediately before editing;
3. keep changes inside assigned ownership;
4. add focused tests in the same package;
5. run the smallest relevant checks first;
6. report exact commands and results;
7. record `Pass`, `Fail`, or `Uncertain` evidence;
8. stop on an assigned stop condition rather than widening scope; and
9. leave commits and pushes to the user.

Subagents may not overlap on `app/main/main.ts`, either preload,
`Stage19WritingSpineApp.tsx`, `Stage19WritingSpineView.tsx`,
`app/renderer/styles/app.css`, ProjectSpine host files, or qualification
ledgers.

## 7. Wave 0 - Planning Acceptance

### P7-0B - Planning Authority Reconciliation

Purpose: make all current authority reflect the accepted Program 7 state
before implementation begins.

Exclusive ownership:

- `docs/product_systems/program_7_creation_revision_and_readiness_charter.md`
- `docs/product_systems/black_skies_post_v1_master_product_program.md`
- `docs/product_systems/post_v1_execution_control_and_handoff_plan.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/current_truth_index.md`
- `docs/product_systems/current_open_work_register.md`
- `docs/current_authority_inventory.json`
- `docs/current_authority_inventory.md`
- directly conflicting Program 7 paragraphs in the AI lifecycle, truth/state
  ownership, feedback-note, and visual-foundation authorities
- `docs/BLACK_SKIES_FIX_TRACKER.md`

Required result:

- replace obsolete Ollama failure and ACL claims with the verified runtime
  evidence;
- distinguish proven host feasibility from unqualified product behavior;
- record Program 7 as next after completed Program 6;
- establish Program 7 recurrence semantics as superseding older reopen
  language;
- record Luna-high as the preferred bounded execution lane;
- record the AI-led evidence and Jason-review protocol;
- preserve the visual foundation over concept imagery; and
- retain the implementation-worktree and user-owned commit gates.

Stop conditions:

- any current authority still claims Ollama is blocked or not runnable;
- any current authority identifies Program 6 implementation as next;
- any current authority permits automatic recurrence reopening;
- any concept is treated as color or typography authority; or
- implementation edits have entered the planning tree.

Exit evidence: one reviewed planning diff, markdown and JSON validation, an
accepted user-created planning commit, and a separately created Program 7
implementation worktree.

## 8. Wave 1 - Independent Foundations

Wave 1 packages may run in parallel only in the accepted Program 7
implementation worktree.

### RT-3A - Carmilla Derived Corpus

Exclusive ownership:

- new `sample_project/program_7_corpus/carmilla/derived/**`
- new `scripts/verify-program7-corpus.mjs`
- new `app/shared/__tests__/program7Corpus.test.ts`

Required outputs:

- an openable Black Skies baseline project;
- a revised overlay or second known snapshot;
- prologue and sixteen stable chapter or manuscript-unit identities;
- a corpus manifest with exact source and derived hashes;
- an answer key containing known concrete and interpretive concerns;
- one protected-span case;
- one concern that remains after revision;
- one exact-source drift case;
- one related recurrence; and
- facts and voice constraints a rewrite must preserve.

Tests and evidence:

- original source byte count and SHA-256 remain exact;
- baseline and revised artifacts load through the current project loader;
- all declared ranges resolve to their expected units;
- overlay application is deterministic and repeatable; and
- the source license remains separate and unchanged.

Stop conditions:

- the original Project Gutenberg source changes;
- derived material replaces or obscures source licensing;
- a seeded concern lacks an objective expected state; or
- the project cannot load through the current ProjectSpine path.

### RT-1A - Program 6 Source Binding And Currentness

Exclusive ownership:

- `app/shared/ipc/storyIntelligence.ts`
- `app/shared/storyIntelligencePolicy.ts`
- `app/shared/program6ProductionProjection.ts`
- `app/shared/__tests__/storyIntelligencePolicy.test.ts`
- `app/shared/__tests__/program6Qualification.test.ts`
- new `app/shared/program7SourceBinding.ts`
- new `app/shared/__tests__/program7SourceBinding.test.ts`
- `app/renderer/components/Program6StoryKnowledgeWorkspace.tsx`
- `app/renderer/components/ContinuityReview.tsx`
- `app/renderer/__tests__/Program6StoryKnowledgeWorkspace.test.tsx`

Required behavior:

- add optional exact span coordinates to Program 6 position references while
  preserving stable unit fallback;
- create a full `ManuscriptStructureAnchorV1` when exact range evidence exists;
- derive current, potentially outdated, unavailable, protected, exact,
  relocated, ambiguous, and stale states honestly;
- add writer-facing `Work on this` actions for eligible findings and signals;
- emit a source envelope only; and
- leave the source finding or signal lifecycle unchanged.

Tests and evidence:

- prior v1 story-intelligence documents still validate;
- exact and uniquely relocated passages return correctly;
- duplicate matches become ambiguous;
- changed or missing passages never silently reattach;
- protected material yields metadata only; and
- `Work on this` does not create durable work until the revision owner accepts
  the explicit request.

Stop conditions:

- old Program 6 data becomes unreadable;
- currentness relies on session generation without body fingerprint evidence;
- source drift is represented as current;
- raw protected content enters the emitted source envelope; or
- Program 6 gains a second revision-state owner.

### P7-A1 - Revision-Item Contract And Persistence

Exclusive ownership:

- `app/shared/ipc/feedbackNotes.ts`
- `app/main/feedbackNotesRepository.ts`
- `app/main/__tests__/feedbackNotesRepository.test.ts`

Required behavior:

- migrate `feedback-notes.json` losslessly from v1;
- distinguish advisory notes from revision items;
- preserve source finding, lens, evidence, provenance, protection, exact anchor
  when available, stable unit, source body fingerprint, and session binding;
- add document revision and serialized mutation;
- represent active workflow posture, recheck evidence, author disposition
  history, and related recurrence;
- keep resolved items outside ordinary active projections without deleting
  them; and
- bound ordinary unpinned history without trimming manually retained evidence.

Tests and evidence:

- read and in-memory normalization of legacy v1 files;
- atomic migration on the first mutation;
- stale expected-revision refusal;
- concurrent mutation serialization;
- park, dismiss, and resolve history;
- recurrence creates a distinct related ID; and
- read/write failure leaves the prior file intact.

Stop conditions:

- any legacy note is lost or rewritten inaccurately;
- a recurrence reuses or reopens the resolved ID;
- a repository operation claims AI resolution; or
- note state becomes manuscript or signal truth.

### P7-B1 - Story Foundation Owner

Exclusive ownership:

- new `app/shared/ipc/storyFoundation.ts`
- new `app/main/storyFoundationRepository.ts`
- new `app/main/storyFoundationIpc.ts`
- new `app/main/__tests__/storyFoundationRepository.test.ts`
- new `app/main/__tests__/storyFoundationIpc.test.ts`

Durable file: `story-foundation.json`.

Required behavior:

- use the bounded question set currently proposed in
  `author_intent_story_setup.md` unless Jason changes it before execution;
- support explicit blank, unknown, undecided, answered, revised, superseded,
  archived, and restored posture;
- preserve author provenance and answer history;
- expose read-only downstream consumption with visible provenance; and
- never gate startup, project opening, manuscript editing, or saving.

Stop conditions:

- a blank answer is converted into permission or inferred intent;
- a consumer can mutate Story Foundation;
- setup completion gates writing; or
- Story Foundation is treated as manuscript or canon truth.

### P7-C1 - Revision Candidate Owner

Exclusive ownership:

- new `app/shared/ipc/revisionCandidates.ts`
- new `app/main/revisionCandidateRepository.ts`
- new `app/main/revisionCandidateIpc.ts`
- new `app/main/__tests__/revisionCandidateRepository.test.ts`
- new `app/main/__tests__/revisionCandidateIpc.test.ts`

Durable file: `revision-candidates.json`.

Required behavior:

- create manual typed or pasted alternatives without AI;
- receive explicit local-AI candidates through an injected service;
- preserve source snapshot, source anchor, body fingerprint, request purpose,
  manual or model origin, visible model identity, protection, provenance,
  warnings, currentness, edited candidate, and bounded history;
- support generated, reviewing, accepted, partially accepted, rejected,
  parked, abandoned, and stale lifecycle states; and
- keep every candidate non-truth until explicit Narrative Insertion acceptance.

Stop conditions:

- candidate creation edits manuscript text;
- accepting or rejecting a candidate closes a revision item or signal;
- a changed source remains current;
- protected content reaches a model package; or
- rejected material enters ordinary future-model context.

### P7-E1 - Ideation Owner

Exclusive ownership:

- new `app/shared/ipc/ideation.ts`
- new `app/main/ideationRepository.ts`
- new `app/main/ideationIpc.ts`
- new `app/main/__tests__/ideationRepository.test.ts`
- new `app/main/__tests__/ideationIpc.test.ts`

Durable file: `ideation.json`.

Required behavior:

- manual Idea Seed capture;
- Exploration Branch creation, copy, merge, split, archive, and restore;
- Premise Version history;
- fixed-core plus adaptive advisory premise tests;
- explicit unknown and intentional-ambiguity posture;
- idea combination with source-contribution lineage;
- Idea Library filtering and bounded history;
- explicit promotion-package preparation; and
- bounded local-AI alternatives only after author request.

Stop conditions:

- an idea becomes Story Foundation, Outline, manuscript, character, or lore
  truth without destination-owner acceptance;
- AI creates an accepted seed directly;
- project references duplicate idea ownership;
- branch merge erases source contribution; or
- archive or restore destroys lineage.

### RT-2A - Local Inference Contract And Service

Exclusive ownership:

- `app/shared/localInference.ts`
- `app/shared/__tests__/localInference.test.ts`
- new `app/main/ollamaLocalInferenceTransport.ts`
- new `app/main/program7LocalInferenceService.ts`
- new `app/main/__tests__/ollamaLocalInferenceTransport.test.ts`
- new `app/main/__tests__/program7LocalInferenceService.test.ts`

Required behavior:

- support bounded rewrite candidate, revision recheck, and premise-alternative
  operations;
- use the exact pilot endpoint `http://127.0.0.1:11434`;
- use only visible model identity `qwen3:4b`;
- require explicit author invocation;
- validate source class before constructing any package;
- enforce operation-specific character and output bounds;
- pass an `AbortSignal` through the transport;
- abort on cancellation or timeout rather than merely abandoning a promise;
- validate structured responses;
- return a visible run receipt; and
- return an honest unavailable or failed result without retry or fallback.

The service is injected into domain IPC owners. No generic raw Ollama bridge is
exposed to the renderer.

Stop conditions:

- any non-loopback route is reachable;
- any model other than `qwen3:4b` is selected;
- protected or excluded text is transmitted;
- a request continues after cancellation;
- an invalid response becomes a candidate;
- a hidden retry occurs; or
- any local-to-paid or paid-to-local fallback exists.

## 9. Wave 2 - Owner Actions And Truth Mutation

### P7-A2 - Revision Actions And Recheck

Dependencies: RT-1A, P7-A1, and RT-2A's injectable interface.

Exclusive ownership:

- `app/main/feedbackNotesIpc.ts`
- `app/main/critiqueReviewIpc.ts`
- `app/main/__tests__/feedbackNotesIpc.test.ts`
- `app/main/__tests__/critiqueReviewIpc.test.ts`

Required behavior:

- create a revision item from an explicit finding action;
- list active and history projections;
- move through review, intended, underway, ready-for-recheck, and parked
  posture;
- run a deterministic no-AI recheck;
- optionally request a local recheck through the injected service;
- record only `appears resolved` or `still appears present` from AI;
- allow only explicit author gestures to park, dismiss, or resolve; and
- create a distinct linked item for recurrence.

Every action must revalidate project ID, canonical path, generation, expected
document revision, and current source evidence.

Stop conditions:

- AI can call or imply the resolve mutation;
- Command Center bypasses the note owner;
- a stale session mutates state;
- recurrence reopens history; or
- recheck edits prose.

### P7-D1 - Narrative Insertion Calculation

Dependencies: P7-C1 and RT-1A.

Exclusive ownership:

- new `app/shared/narrativeInsertion.ts`
- new `app/shared/__tests__/narrativeInsertion.test.ts`
- new `app/main/narrativeInsertionCoordinator.ts`
- new `app/main/__tests__/narrativeInsertionCoordinator.test.ts`

Required behavior:

- deterministically calculate accept-all replacement;
- calculate candidate-selected-text replacement;
- calculate edited-before-acceptance replacement;
- validate source anchor and body fingerprint;
- validate candidate selection bounds;
- require acknowledgement for triggered canon, continuity, protected-content,
  or source-staleness risk;
- produce an exact accepted-result fingerprint; and
- leave actual persistence to the ProjectSpine truth-owner integration.

Stop conditions:

- text outside the explicit source span changes;
- ambiguous or stale source applies silently;
- an unacknowledged blocking warning is bypassed;
- unaccepted candidate text becomes truth; or
- insertion changes note or signal lifecycle.

### P7-F1 - Reviewed Promotion Handoff

Dependencies: P7-B1, P7-E1, P7-C1, and P7-D1.

Exclusive ownership:

- new `app/shared/ipc/program7Promotion.ts`
- new `app/main/program7PromotionIpc.ts`
- new `app/main/__tests__/program7PromotionIpc.test.ts`

Required behavior:

- route accepted creative intent to Story Foundation;
- route accepted structural candidates to Living Outline through its existing
  owner;
- route accepted prose through the Narrative Insertion path;
- create deferred, non-truth handoff packages for character or lore material;
- preserve source-to-promotion provenance;
- make repeated requests idempotent; and
- report partial failure without claiming full success.

Stop conditions:

- Program 7 creates Program 8 cards, Binder, search, or knowledge-owner state;
- a destination write occurs without explicit destination-owner acceptance;
- retry duplicates a destination artifact;
- partial success is reported as full success; or
- promotion erases source history.

## 10. Wave 3 - Independent UI Components

UI component packages consume sanitized view models and callbacks. They do not
read files, invoke Ollama, decide resolution, or mutate manuscript truth.

### P7-A3 - Revision Desk Component

Exclusive ownership:

- new `app/renderer/components/program7/RevisionDesk.tsx`
- new `app/renderer/__tests__/RevisionDesk.test.tsx`

Required proof: active/history separation, protected metadata-only display,
currentness labels, return-to-source, recheck display, Jason-only resolution
copy, recurrence links, keyboard operation, and empty/degraded states.

### P7-B2 - Story Foundation Component

Exclusive ownership:

- new `app/renderer/components/program7/StoryFoundation.tsx`
- new `app/renderer/__tests__/StoryFoundation.test.tsx`

Required proof: optional entry, blank/unknown/undecided behavior, explicit save
and revision, provenance, keyboard access, and no writing gate.

### P7-C2 - Comparison And Writing Drawer Components

Exclusive ownership:

- new `app/renderer/components/program7/RevisionComparison.tsx`
- new `app/renderer/components/program7/WritingRevisionDrawer.tsx`
- new `app/renderer/__tests__/RevisionComparison.test.tsx`
- new `app/renderer/__tests__/WritingRevisionDrawer.test.tsx`

Required proof: current and candidate text remain visibly distinct; manual and
local origin are visible; warnings and stale posture remain visible; accept
all, partial accept, edit, reject, park, and abandon remain explicit; and no
gesture silently resolves a revision item.

### P7-E2 - Ideas Component

Exclusive ownership:

- new `app/renderer/components/program7/IdeasWorkspace.tsx`
- new `app/renderer/__tests__/IdeasWorkspace.test.tsx`

Required proof: manual-first capture, branch and premise lineage, advisory test
labels, intentional ambiguity, combination, archive/restore, Idea Library, and
promotion preview.

### P7-G1 - Integrated History Projection

Exclusive ownership:

- new `app/shared/program7History.ts`
- new `app/shared/__tests__/program7History.test.ts`
- new `app/renderer/components/program7/Program7History.tsx`
- new `app/renderer/__tests__/Program7History.test.tsx`

History must aggregate source-owner records by reference. It must not create a
shadow `program7-history.json` store.

Required proof: bounded ordering, active/resolved separation, recurrence,
staleness, protection, provenance, partial acceptance, promotion, archive, and
trim behavior.

### P7-UI - Create / Develop Composer

Dependencies: all Wave 3 components.

Exclusive ownership:

- new `app/renderer/components/program7/Program7CreateDevelopWorkspace.tsx`
- new `app/renderer/__tests__/Program7CreateDevelopWorkspace.test.tsx`

Required proof: the four provisional sections compose correctly without
becoming new top-level truth owners or blocking Command Center navigation.

## 11. Wave 4 - Serial Integration

### INT-1 - Narrative Acceptance Into ProjectSpine

Dependencies: P7-C1 and P7-D1.

Exclusive ownership:

- `app/shared/ipc/projectSpine.ts`
- `app/main/projectSpineIpc.ts`
- `app/main/projectSessionCoordinator.ts`
- `app/main/__tests__/projectSpineIpc.test.ts`
- `app/main/__tests__/projectSessionCoordinator.test.ts`

Required behavior:

- add a Writing-only `acceptRevisionCandidate` operation;
- validate the exact current source and candidate acceptance calculation;
- reuse the existing optimistic `expectedMarkdown` contract;
- reuse the current save token, recovery checkpoint, and durable
  `saveProjectDraft` primitive;
- record pending candidate acceptance before manuscript persistence;
- finalize candidate provenance only after durable save succeeds; and
- reconcile interrupted pending acceptance by exact fingerprints at startup.

Stop conditions:

- Command Center receives direct manuscript mutation authority;
- a stale session or expected markdown succeeds;
- accepted text escapes its span;
- save and provenance disagree without a recoverable pending state; or
- a partial write is reported as success.

### INT-2 - Main Host And Preload Integration

Dependencies: all Wave 1 and Wave 2 owner packages.

Exclusive ownership:

- `app/main/main.ts`
- `app/main/preload.ts`
- `app/main/stage19Preload.ts`
- `app/renderer/types/global.d.ts`
- `app/main/__tests__/stage19PreloadChannels.test.ts`
- `app/main/__tests__/splitCommandPreload.test.ts`
- `app/main/__tests__/program3CombinedInstalledQualification.test.ts`
- `app/scripts/stage19-installed-smoke.mjs`

Both preloads must be updated because development and packaged execution use
different preload files.

Required proof:

- every owner is registered once;
- writing and command global allowlists are exact;
- development and packaged bridges have contract parity;
- role-inappropriate mutation methods are absent;
- Command projections contain no raw protected prose; and
- local inference remains internal to domain actions.

Stop conditions:

- preload allowlists diverge;
- a generic Ollama or filesystem bridge is exposed;
- Command receives a manuscript mutation method;
- project, path, or generation validation is bypassed; or
- protected content crosses the preload boundary.

### INT-3 - Stage19 Renderer Integration

Dependencies: INT-1, INT-2, and all Wave 3 components.

Exclusive ownership:

- `app/renderer/Stage19WritingSpineApp.tsx`
- `app/renderer/Stage19WritingSpineView.tsx`
- `app/renderer/__tests__/Stage19WritingSpineApp.test.tsx`
- `app/renderer/__tests__/Stage19WritingSpineLayout.test.ts`
- `app/renderer/styles/app.css`

Required behavior:

- activate the existing `create-develop` workspace;
- render the four provisional Program 7 sections;
- route Program 6 `Work on this` to Revision Desk;
- add a quiet contextual revision drawer to the Writing Studio right rail
  without removing existing critique support;
- restore exact source selection when possible and describe drift honestly;
- support the complete no-AI revision path;
- support manual and explicit local-AI comparison;
- invoke selective acceptance only through ProjectSpine;
- integrate Story Foundation, Ideas, promotion, and History; and
- preserve focus return between current-window and detached Command Center.

Stop conditions:

- a new font or text-color token is added;
- pale or light-gray typography returns;
- a concept image overrides the visual foundation;
- ordinary writing is gated or materially obstructed;
- Command Center becomes a truth owner;
- AI is required for a complete workflow; or
- hidden state differs between attached and detached Command Center.

## 12. Wave 5 - Local Pilot Qualification

### RT-2B - Real `qwen3:4b` Qualification

Dependency: RT-2A and the integrated domain actions.

Exclusive ownership:

- new `scripts/qualify-program7-local-ai.mjs`
- new local-pilot receipt schema and generated evidence under the Program 7
  evidence directory selected by the qualification coordinator

Verified prerequisite evidence:

- Ollama executable:
  `C:\Users\gray2\AppData\Local\Programs\Ollama\ollama.exe`
- version: `0.13.0`
- loopback health: `http://127.0.0.1:11434`
- `/api/tags` returned six installed models including `qwen3:4b` and
  `qwen3:8b`
- `ollama show` succeeded for both models
- `ollama run qwen3:4b "Reply with exactly OK."` returned `OK`
- `ollama ps` showed `qwen3:4b` loaded on CPU
- server logging showed loopback-only binding

This proves host feasibility only. It does not prove quality, latency,
memory/resource posture, cancellation, timeouts, structured harness behavior,
protection enforcement, or Black Skies integration.

Qualification must record:

- exact commit and model digest;
- visible `qwen3:4b` identity;
- CPU and memory posture;
- first-response and total latency;
- bounded request and response sizes;
- structured response validity;
- cancellation and timeout completion;
- unavailable-server and invalid-response behavior;
- protected-package refusal;
- no fallback and no hidden retry;
- representative rewrite, recheck, and premise-alternative samples; and
- proof that no manuscript, revision resolution, Story Foundation, Outline,
  or Ideation truth changed during a model run.

Deterministic UI tests use mocked outcomes. This package is the separately
labeled real-host qualification.

Stop conditions:

- the model identity differs;
- endpoint binding is not exact loopback;
- cancellation leaves generation active;
- quality evidence is too weak or inconsistent for admission;
- measured foreground wait is unusable;
- resource behavior threatens normal writing stability;
- structured responses fail the accepted rate; or
- any protected text, mutation, retry, or fallback violation occurs.

Failure or uncertainty keeps local AI unavailable in product UI while the
complete no-AI path remains enabled.

## 13. Wave 6 - Program Qualification And Closure

### P7-G2 - Objective And UI Qualification

Dependencies: all implementation and integration packages.

Exclusive ownership:

- new `app/tests/e2e/program7-revision.spec.ts`
- new `app/tests/e2e/program7-create-develop.spec.ts`
- new `app/tests/e2e/program7-local-ai.spec.ts`
- new `app/tests/e2e/program7-long-form.spec.ts`
- Program 7 visual snapshots and diagnostic artifacts
- new `docs/product_systems/program_7_evidence_ledger.md`
- new `docs/product_systems/program_7_closure_report.md`
- final Program 7 status changes in current authority documents and
  `docs/BLACK_SKIES_FIX_TRACKER.md`

Required workflow evidence:

- Program 6 finding to `Work on this` to durable revision item;
- concrete, interpretive, protected or metadata-only, and source-drift cases;
- normal edit, durable save, deterministic recheck, and Jason resolution;
- recurrence creating a related new item;
- manual candidate entry and comparison;
- admitted local rewrite and recheck, if RT-2B passes;
- accept all, partial accept, edit-before-accept, reject, park, and abandon;
- Story Foundation blank, unknown, undecided, save, revise, and read-only use;
- ideation seed, branch, premise version, test, combination, library,
  archive, restore, and promotion preparation;
- Story Foundation, Living Outline, Narrative Insertion, and deferred Program
  8 handoffs;
- resolved work absent from ordinary active view but present in history;
- current-window and detached Command Center behavior;
- dark and light theme behavior;
- computed contrast and no pale-gray recurrence;
- keyboard-only operation, focus return, 200 percent zoom, and axe checks;
- cancellation, timeout, unavailable, corruption, write-failure, and recovery
  behavior; and
- Carmilla long-form correctness and performance.

### Human Gate 4

Human Gate 4 begins only after the first finding-to-resolution workflow is
mechanically qualified on Carmilla with the full no-AI path and, if admitted,
the local-AI path.

Agents perform exhaustive objective and UI prechecks. Jason reviews:

- every `Fail` row;
- every `Uncertain` row;
- every authority-sensitive row;
- every genuinely subjective row; and
- a deterministic sample of objective `Pass` rows.

The default pass sample is 10 percent, with at least three pass rows per
package. The exact commit hash determines the sample so agents cannot
cherry-pick it.

Jason alone judges usefulness, voice preservation, interruption, naming,
aesthetics, acceptable foreground wait, and actual revision resolution.
Agent execution, screenshots, model output, or automated checks never count as
human acceptance.

## 14. Evidence Schema

Every evidence row must contain:

| Field | Required content |
| --- | --- |
| Evidence ID | Stable Program 7 package and row identifier |
| Exact commit | Full Git commit hash under qualification |
| Package | Owning package identifier |
| Environment | OS, app mode, window placement, theme, zoom, and runtime |
| Corpus snapshot | Exact fixture name and hash, or `not applicable` |
| Preconditions | Required project, source, model, and protection state |
| Action | Exact automated or human-observed action |
| Expected | Objective expected result or named subjective question |
| Observed | Actual result without interpretation inflation |
| Artifacts | Logs, screenshots, traces, receipts, diffs, or hashes |
| Result | `Pass`, `Fail`, or `Uncertain` |
| Reviewer | Agent identity for precheck; Jason for human review |
| Disposition | Repair package, accepted exception, deferral, or closure link |

Result rules:

- `Pass` requires complete objective evidence.
- `Fail` records an observed mismatch.
- `Uncertain` records ambiguity, flakiness, blocked capture, insufficient
  evidence, or a decision requiring author judgment.
- `Uncertain` never counts as a pass.
- A repaired row keeps its prior evidence and links a new rerun row.
- No unresolved `Fail` or `Uncertain` may be silently omitted from closure.

## 15. Test Order

Each implementation package runs checks in this order where applicable:

1. focused shared, repository, IPC, or component Vitest files;
2. related existing Program 6, Feedback Notes, ProjectSpine, preload, and
   Stage19 regression files;
3. `pnpm --filter app typecheck:all`;
4. `pnpm --filter app lint`;
5. `pnpm --filter app build:production`;
6. focused Electron Program 7 evidence;
7. complete relevant Electron regression; and
8. real local-model qualification only in RT-2B.

Provider or inference execution is never part of an unrelated package test.

## 16. Central Risk Register

### Source Revision Is Not Enough

Program 6 commonly uses project-session generation as `sourceRevision`, but a
normal manuscript save does not advance that generation. Program 7 currentness
must use the body SHA-256 and full passage anchor; it must not rely on session
generation alone.

### Exact Passage Evidence Is Not Universal

Existing Program 6 production findings are commonly unit-level. RT-1A adds an
optional exact range while preserving stable unit fallback. No package may
invent an exact passage when only a unit is known.

### Protected Findings May Be Metadata Only

Protected continuity material can be omitted from ordinary finding output. A
revision item may preserve concern identity, source class, and stable unit
without exposing the underlying summary or prose.

### Attached And Detached Command Must Match

Same-window Command Center can share renderer state; detached Command Center
cannot. All durable actions must cross a sanitized main-owned bridge and
revalidate project, path, generation, and expected revision.

### Two Preloads Must Remain In Sync

Development and packaged execution use different preload files. INT-2 must
prove exact bridge parity and role allowlists in both.

### Feedback Notes Need Migration Before UI

The current repository supports create and list only and has no document
revision. P7-A1 and P7-A2 must precede Revision Desk integration.

### Narrative Insertion Has Doctrine But No Runtime Owner

The smallest safe implementation is a deterministic insertion calculator plus
a Writing-only ProjectSpine acceptance operation. Program 7 must not create a
second manuscript store.

### History Must Not Become A Shadow Owner

History aggregates source-owner events by reference. It does not persist a
new canonical history document.

### Signal And Revision Resolution Differ

Program 6 signal disposition remains Signal Architecture behavior. It must not
resolve a Program 7 revision item, and resolving a revision item must not
resolve a signal.

## 17. Closure Conditions

Program 7 may close only when:

- all package stop conditions are clear;
- all required workflow families are qualified or explicitly deferred with an
  owner, exact resolution stage, and reopening trigger;
- the no-AI workflow is complete and useful;
- local AI is either admitted through RT-2B or honestly unavailable without
  degrading manual work;
- the Carmilla baseline and revised evidence are reproducible;
- no unresolved `Fail` or `Uncertain` lacks a disposition;
- Jason completes Human Gate 4 and all later subjective review required for
  the remaining Program 7 families;
- final authority documents describe exact current truth;
- the working tree contains only intended Program 7 changes; and
- the user performs any desired commit and push.

Program 7 closure does not authorize Program 8 implementation, Program 9
provider routing, packaging, release, or fabricated human acceptance.
