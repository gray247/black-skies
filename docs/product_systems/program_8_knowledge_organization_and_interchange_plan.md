# Program 8 Knowledge, Organization, And Interchange Plan

## October 12 independent review and publication checkpoint

Jason authorized a documentation commit and GitHub push so a second AI system
can review the current app and this proposed plan. The
[review and external-review handoff](program_8_9_review_and_scope_decisions.md)
records findings, evidence limits and reviewer instructions. Five author
questions remain under review; no answers or draft acceptance are inferred.
This publication does not authorize P8/P9 runtime work, change the approved
three-destination qualification stage or waive Memory/AI admission gates.
Earlier no-commit/no-push statements describe the original planning task.

## 1. Status, Entry Verification, And Authority

Status: **proposed bounded plan; planning only; implementation not authorized**.
Prepared on 2026-10-09 using the client's America/New_York date context.
Jason confirmed this chat was switched to **GPT-5.6 Sol, xhigh** before
ownership and memory planning. This is execution metadata, not permission to
activate a workflow. Task identity: current `Black-skies program 8` chat,
agent `/root`; workspace `C:/Users/gray2/Documents/ChatGPT/Black-skies program 8`.

| Entry fact | Verified state |
| --- | --- |
| Continuing repository | `C:/Users/gray2/.codex/visualizations/2026/09/04/01a06e84-5626-7241-bbe0-639af79386bf/program7-today` |
| Branch | `codex/program7-implementation` |
| Starting HEAD | `f9868e6f432fbb005caf8d4c470fbd95c71756cd` |
| Starting working tree | Clean; no reconciliation needed |
| Qualified runtime | `feee2e2e858c8430b02bc28b46c7efb2bfdf0d33`, tree `3ffdb32098b8066919a1f6b091e5f16dbd4a68ee` |
| Relationship | Runtime commit is an ancestor of HEAD; intervening changes are documentation/evidence only |
| Remotes | `origin` is the older local implementation repository; `github` is `https://github.com/gray247/black-skies.git` |

Do not substitute the older worktree bearing this branch name. No fetch,
branch change, runtime edit, model run, package rebuild, commit, push, merge,
release, instruction-file change, automation change, dependency change, or
destructive cleanup is included in this planning package. The qualified
application and installed package retain their runtime identity above.

The following records were read in the requested order before drafting:

1. [Execution control and handoff plan](post_v1_execution_control_and_handoff_plan.md).
2. [Master product program](black_skies_post_v1_master_product_program.md), Program 8.
3. [Program 7 closure report](program_7_closure_report.md), leading accepted closure.
4. [Current open-work register](current_open_work_register.md) and
   [fix tracker](../BLACK_SKIES_FIX_TRACKER.md), including historical issue stages.
5. [Author-experience direction lock](author_experience_direction_lock.md).
6. [Organization/retrieval/memory/interchange checkpoint](orchestrator_9_organization_retrieval_memory_interchange_closure_checkpoint.md).

The individual dossiers linked below and relevant active source/tests were
then inspected. Historical `Orchestrator 9` denotes a governance campaign;
it is not the future product Program 9. No existing dedicated Program 8 plan
was found. This document fills that planning gap without rewriting accepted
Program 7 evidence or declaring the category-4 dossiers build-ready.

### Mandatory Program 8 checkpoint review

Jason's accepted resolution stage remains exactly:
**Program 8 destination-owner workflow qualification, before Program 8 closure**.
Planning-entry review is completed here by distinguishing the current paths,
missing owners, required contracts, and evidence. Destination qualification
itself has not occurred. Package names below are proposed delivery units;
they do not replace the accepted resolution stage.

| Carried integration | Retained accountable owner | Required completion evidence | Reopening trigger |
| --- | --- | --- | --- |
| Character/Lore accepted truth owners | Program 8 knowledge-owner coordinator with Jason | Authorized fact-class/owner contract, explicit acceptance, durable receipts, idempotency, protection, fresh-process reopen and human workflow proof | Authorized integration or changed owner contract |
| Ideas Writing-section/manuscript destinations | Program 8 destination-integration coordinator with Jason | Explicit destination acceptance, current source/range/sovereignty, truthful success/failure receipts and durable state | Authorized integration or changed destination contract |
| Project Memory | Program 8 knowledge/memory coordinator with Jason | Governed recall/owner contract, protection/currentness/provenance and durable human workflow proof; separate higher-risk admission gate retained | Authorized integration or changed recall/protection contract |

## 2. Existing Behavior And Reusable Seams

The table describes code reachable through the dedicated Stage 19 product
surfaces, together with preserved qualification. Source inspection is not a
new runtime test. Historical service/prototype tests are not product evidence.

| Area | Implemented behavior at entry | Reuse and remaining gap |
| --- | --- | --- |
| Writing Studio and Story rail | Continuous manuscript, optional Unit/Note structure, canvas scrolling, Focus, direct navigation and durable project save/reopen | `projectSessionCoordinator.ts`, `projectSpineIpc.ts`, Living Outline and shared source anchors. `ManuscriptBinderView` is the Story rail; it does not implement the dossier's general Binder collections |
| Command Center | Six workspace families, same-project projection, attached/detached hosts and source return; Story Knowledge lenses and Create / Develop are built | Existing contextual shell/projection contracts. Structure, Project Interchange and Operations / Approvals remain honest placeholders; their navigation labels do not prove those workflows |
| Ideas | Durable seeds, branches, versions, lineage, library, archive/restore and destination previews | `ideationRepository.ts`, `ideationIpc.ts`, `IdeasWorkspace.tsx`; source evidence and protected-seed refusal already have tests |
| Foundation/Outline promotion | Explicit Ideas actions reach real destination repositories, return owner receipts and report refusal/unknown results honestly | `main.ts` injects only `acceptAuthorIntent` and `acceptOutline` into `program7PromotionIpc.ts`; preserve these routes |
| Character/Lore promotion | Returns a deferred metadata package; explicitly says no character/lore truth was written | Shared promotion types and coordinator are a handoff seam, not accepted-fact owners or a complete card UI |
| Ideas Writing section, Manuscript insertion and Project memory | Previews are saved; the UI says the destination is planned and unavailable | Ideation lists these destinations, but the promotion IPC destination union lacks `story-unit` and `memory`; Ideas' renderer route does not execute these three destinations |
| Revision-alternative manuscript insertion | Built and qualified; calculation, exact-range acceptance through Writing ProjectSpine, reservation/finalization and interrupted-outcome reconciliation | `narrativeInsertionCoordinator.ts`, `shared/narrativeInsertion.ts`, `revisionCandidateRepository.ts`, `projectSpineIpc.ts`. Ideas integration is an additional source path, not a replacement implementation |
| Markdown intake/Structure | Built Writing Studio Markdown intake, LF normalization, preserved external source, paginated ghost structure and explicit author Apply with journal recovery | `manuscriptStructureRepository.ts` and IPC; this does not prove mixed document staging, arbitrary reimport, DOCX/PDF fidelity or Command Center interchange |
| Markdown export | Durable saved manuscript export in authoritative unit order; deterministic UTF-8 artifact, source fingerprint, Windows-safe filename and guarded atomic write | `projectSpineMarkdownExport.ts` and ProjectSpine IPC; this does not establish richer formats, portable archive or backup |
| General search/assets/Series/Memory | No complete owner-backed author workflow found in the dedicated renderer/main/preload paths inspected | Python keyword search, memory_lab/memory_prototype and export services contain historical algorithms/tests. The package verifier excludes `/services/`; these cannot be counted as installed capabilities |

The existing promotion coordinator deduplicates matching operation IDs with
in-memory maps, capped at 256 completed requests. This proves bounded
same-process behavior, not retry safety across restart or a lost reply after
a committed destination write. New destination contracts must address that
gap durably. Do not label `routed`, a successful calculation, or top-level
`complete` as accepted truth: a current complete result may contain deferred
items, and narrative calculation still requires ProjectSpine acceptance.

Reuse the existing per-project serialized repositories, revision checks,
strict schema validation, synced temporary-file replacement, main-process
role/project/generation validation, narrow preload channels, source anchors,
sanitized projections, notices, and native choosers. Reuse patterns locally;
this plan does not request a generic framework or a repository refactor.

For new routes, reload the owning source and its current protection state in
main before accepting. Renderer-supplied hashes or an `accepted: true` field
do not establish current source truth, durable approval, or permission.

## 3. Product Boundaries And Planning Decisions

The manuscript remains the center of Writing Studio. Binder, search and asset
access use quiet, summonable support. Small card lookups may appear near the
writing; fact review, conflicts, memory management and interchange review
belong in Command Center. All important workflows must work on one monitor.
The optional detached Command Center preserves the same project and return
anchor. Use existing typography, palette and contrast tokens.

The direction lock is the durable synthesis of Jason's photographs and
discussion. No new vision interview or dashboard redesign is needed.

- Binder owns organizational placements only. Removing or renaming a
  placement cannot delete or rename the source object.
- File/asset support owns source identity, link/copy posture, availability and
  repair. A missing source is not a deleted object or a guessed replacement.
- Search owns query/index/result/freshness state. Results are references,
  not facts or memory. Repeated retrieval never approves durable retention.
- Character and Lore own explicitly accepted facts individually. Saving a
  card is not blanket fact acceptance. Mixed claims have one primary owner;
  secondary domains retain references, not duplicated authoritative facts.
- Manuscript changes do not silently update cards; card changes do not
  rewrite prose. Source changes may stale evidence and raise advisory review.
- Memory owns governed record/approval/recall/retention state. It does not
  own upstream truth. Temporary Companion context remains temporary.
- Interchange owns staging and transfer history. Imported text cannot
  silently become canon. Export is not save, archive is not application
  backup, and Google Docs is a manual endpoint, not sync authority.
- Series Binder owns structure/membership/links. Membership shares no facts
  or memory. Shared identities cannot absorb project-specific fact ownership.

These are established boundaries. The exact field schemas, durable receipt
layout, role/action matrix and first-release ceilings remain proposed or
unresolved until the bounded contract package below is accepted.

## 4. Proposed Packages And Sequence

Only P8-0 planning work is recommended as the next scope. Each runtime
package requires separate bounded authorization after its contract is
reviewable. Central integration files (`main.ts`, preloads, ambient bridge
types, `Stage19WritingSpineApp.tsx`, `Stage19WritingSpineView.tsx`, shared shell
contracts and qualification lists) require one serial owner per package.
No Program 7 Luna delegation preference is carried into Program 8.

| Package | Proposed outcome | Accountable planning role | Dependency and acceptance boundary |
| --- | --- | --- | --- |
| P8-0 | Destination contracts and post-HG4 architecture/test reassessment | Program 8 coordinator with Jason and retained destination coordinators | Planning only; settle the owner/action/receipt/protection contracts and decisions below before corresponding runtime work |
| P8-A | Character/Lore candidate review and accepted fact owners | Program 8 knowledge-owner coordinator with Jason | Accepted P8-0 card contract; contributes to the approved destination qualification stage |
| P8-B | Ideas Writing-section and manuscript destinations | Program 8 destination-integration coordinator with Jason | Accepted P8-0 placement contract; reuse sovereign Writing/Insertion owners; contributes to the same approved stage |
| P8-C | Single-project Binder and bounded file references | Program 8 organization/asset coordinator | Stable source identities from existing owners and P8-A/B; organization cannot become truth ownership |
| P8-D | Exact, metadata and structural project search | Program 8 retrieval coordinator | Explicit eligible source projections; P8-C browse/asset identities; honest partial coverage until every chosen class is supported |
| P8-E | Bounded local interchange and portable project escape | Program 8 interchange coordinator with persistence/recovery owner | Accepted format/fidelity/archive contracts; destination owners present; no connector or restore-over-current admission |
| P8-M | Non-AI Project Memory destination and manual governed recall | Program 8 knowledge/memory coordinator with Jason | Separate memory contract, security/privacy/recovery review and explicit higher-risk admission decision; contributes to the same approved destination stage |
| P8-S | Bounded Series membership, Story Chains and non-owning navigation | Program 8 series coordinator | Project-local boundaries proven; memory sharing stays disabled unless separately qualified under P8-M |
| P8-Q | Grouped workflow qualification and Program 8 closure review | Program 8 integration coordinator with Jason | All approved scope qualified; all three mandatory destination integrations have completion evidence; memory admission gate and Jason's author decisions remain distinct |

P8-A/B establish the carried missing destinations first. P8-C/D make their
contents findable without AI. P8-E adds a local escape path. Memory contract
work may be prepared during P8-0, but runtime admission waits for P8-M's
separate gate. P8-S can remain a proposed later package until its scope is
accepted; do not silently drop it or imply all candidate workflows are built.

### P8-0: Contract And Risk Decisions

Owner: Program 8 coordinator, with the three retained destination
coordinators and Jason for author decisions. Produce a bounded contract
packet, not source code, for:

1. Card entity identity, first fact classes, candidate versus accepted state,
   story-period/belief/revelation context, revision/supersession, archive and
   protection. Recommended first classes are author-entered character
   traits/status/relationships and lore rules/place/object/organization
   facts, with free text and optional story-period context rather than a
   mandatory taxonomy form. Exact class ownership requires acceptance.
2. Ideas source/package/version binding, selection/destination contract,
   durable operation identity, owner receipt and recovery. Explicitly settle
   what `Writing section` creates. Recommended proposal: a named empty Unit
   plus an optional subordinate planning Note retaining the idea, with a
   preview that discloses the structural change; prose placement is a
   separate Manuscript insertion action. This meaning is not approved or
   currently implemented.
3. Per-owner action/role permissions for attached and detached Command
   Center. Current promotion accepts from the Writing host. A hosted
   Command Center approval does not gain direct filesystem authority;
   manuscript mutation must continue through Writing ProjectSpine. Any new
   card/memory Command approval route needs its own main-enforced contract.
4. One durable receipt/reconciliation contract for each new destination:
   acceptance identity, source revision/hash, destination identity/revision,
   exact accepted payload, protection decision, result, and operation replay.
   Commit the destination outcome and recoverable receipt together, or define
   an explicit journal/reconciliation path. Unknown reply is not permission
   to repeat a write. Existing process-local deduplication is insufficient.
5. Memory type/scope, citation/source trace, local storage/retention bounds,
   stale/conflict/forget/archive/detach/delete behavior, and protected residue
   handling. Existing open Critical questions in Memory Lab block runtime
   wiring; non-AI operation does not waive the higher-risk memory gate.
6. First local formats and per-format loss contract. Recommended first
   expansion is plain UTF-8 text and pasted text beside the proven Markdown
   path; DOCX is a separate fidelity package if approved. PDF/OCR, ePub and
   Google Docs are not implicitly included. Agree exact source/protection
   handling and export presets before coding.
7. Portable archive schema/version, supported owner-state inventory, asset
   inclusion rules, checksums, identity rebinding, verification and safe
   import into a new location. Define independence from application backup.

Post-HG4 architecture/test review is a required execution-control checkpoint.
Entry inspection identifies concentrated shell/main integration, duplicate
source validation risk, finite process-local receipts, new persistence owners
and gaps in the fixed regression's Program 7/8 coverage. Review those changed
boundaries in P8-0; do not expand into general refactoring. The fixed Stage 19
regression does not list the dedicated Program 7 journey files, so those
remain a separate required layer when their paths change.

Exit: Jason accepts the product/authority decisions needed for a named next
package, and its file ownership, schema/protection/role locks, acceptance
matrix and tests are fixed. Unresolved memory or format contracts may block
their own packages without blocking separately authorized ordinary work.

### P8-A: Character/Lore Owners

Use [Character Cards](character_cards.md), [Lore Cards](lore_cards.md) and
the [truth/cards checkpoint](orchestrator_9_truth_cards_and_support_maps_closure_checkpoint.md).
The deferred promotion package becomes a candidate intake to the correct
owner. It cannot become accepted truth merely because Ideas' `Send` ran.
The author reviews selected facts and explicitly accepts or rejects them.

First outcome: create identity, inspect candidates, accept selected facts,
revise/supersede with lineage, archive/restore, return to evidence and reopen
durably. Keep accepted facts visually primary; history and conflict detail
remain summonable. Mixed-domain claims retain one primary owner. Bulk merge,
split, automated extraction and exhaustive world/character modeling stay
outside the first package unless explicitly added.

Acceptance: fact-level author action, exact durable receipt, restart-safe
replay, stale-source refusal/review, protected projection, preserved time and
belief distinctions, no prose write, no duplicated accepted fact across
owners, and human proof that candidate and accepted truth are understandable.

### P8-B: Ideas Placement

Use [Ideation](ideation_premise_discovery.md), existing Story Unit/Living
Outline behavior and the qualified Narrative Insertion/ProjectSpine route.
Writing-section meaning must be settled in P8-0. No premise text is silently
treated as manuscript prose or as an accepted character/lore claim.

For Manuscript insertion, preview the exact current target Unit and
position/range, proposed text and resulting change. Establish a legitimate
Ideas source adapter to the existing acceptance owner; do not fabricate a
revision-candidate record or reuse renderer-only hashes as authority.
Cancellation writes nothing. Project/source/target changes require fresh
review. The existing revision-alternative workflow remains independently
qualified and regressed.

Acceptance: exact selected text and unchanged surroundings, explicit author
acceptance, dirty-buffer policy, repeated-text disambiguation, Unicode and
Markdown integrity, current project/range/protection checks at commit,
durable source-to-destination lineage, receipt recovery after lost reply or
interruption, and no duplicate section or insertion after reopen/retry.

### P8-C: Binder And Assets

Use [Binder](binder_project_library.md) and
[File Manager / Asset Pane](file_manager_asset_pane.md). Extend project
navigation with author collections and placements by stable source reference.
Keep the existing Unit/Note Story rail intact. First asset scope is bounded
browse/reference metadata and availability; attach/link or managed copying
requires an accepted explicit scope rather than the dossier's whole menu.

Acceptance: two placements resolve one source; rename/move/remove placement
leaves source bytes and ownership unchanged; unavailable/restricted sources
are honestly labeled; label/preview metadata is safe; no automatic similar
file relink; no loss of project isolation or return position. Missing assets
and failed previews never block writing. File deletion, replacement,
restore-over-current and broad asset cleanup remain separately gated.

### P8-D: Search

Use [Project Index / Search / Retrieval](project_index_search_retrieval.md).
First search is exact-text, metadata and structural retrieval across current
permitted sources. Declare coverage by source class. Start with manuscript,
Outline/Notes, Foundation/Ideas and accepted cards; add safe Binder/asset
metadata, classified imports and approved memory references only when their
owners provide permitted projections. Call incomplete coverage partial.

Exclude archives, deleted sources, unclassified staging, historical recovery
and restricted content from default scope. Provide explicit allowed scopes
and safe tombstones for missing sources. Query/history/pins remain search
convenience state. No vectors, semantic model, universal relevance score,
cross-project scan or silent memory capture enters this package.

Acceptance: labeled source/type/owner, bounded snippet, current/stale/partial
truth, exact source return, duplicate/alias clarity, protection on labels and
metadata as well as text, source-change invalidation, and writing available
during rebuild/query failure. Memory creation is possible only through the
separately admitted P8-M owner.

### P8-E: Local Interchange And Portable Escape

Use [Interchange](import_export_document_interchange.md) and
[source/destination contract](document_interchange_source_destination_contract.md).
Preserve the proven Markdown intake and export. New imports enter staged,
reference-only or candidate review; each resulting object is accepted through
its owner. Reimport is comparison-first, never an overwrite/delete command.
Local export declares scope, revision, format and clean/annotated posture,
shows loss/protection warnings, and reports actual artifact success/failure.

Portable archive is a separate subpackage: a versioned, checksummed inventory
of explicitly included owner state and managed assets, with linked assets
labeled or deliberately copied. Preserve author data, accepted/candidate
states, lineage and protection. Exclude credentials, provider payloads,
unapproved protected raw data and unrelated runtime/cache/log material.
Archive inclusion of memory requires its own admitted export/retention policy.

Proposed restore floor: verify before extraction, then open an independent
copy in a new empty location with governed project-identity/reference
rebinding and original-identity provenance. Current ProjectSpine rejects
copied duplicate identities; a raw folder copy is not a qualified restore.
Settle identity handling in P8-0. Reject traversal/absolute paths, symlink or
external-boundary surprises, unsupported versions, corrupted manifests and
partial extraction. The source project remains unchanged. Do not add
restore-over-current or backup scheduling.

Acceptance: staged cancellation, partial/unsupported format honesty,
comparison-first update, exact export payload versus approved preview,
atomic destination failure preservation, archive round-trip of every
declared owner class, reopened independent project, safe asset/link posture
and no protected metadata leakage. Google Docs requires demonstrated workflow
need, Workflow Proof and Missing Connector Review before any adapter
admission; no service connection or account access is requested now.

### P8-M: Project Memory Under A Separate Gate

Use [Memory Lab](memory_lab.md). Recommended initial proposal is manual,
current-project memory: personal/advisory reminders, decision rationale,
owner references and bounded approved summaries. Author explicitly chooses
type and scope, reviews retained content/provenance, then saves through the
Memory owner. Ideas' Project memory preview alone retains no approved memory.

Provide manual inspection/recall, source return, Needs Review for stale or
conflicted records, archive, forget and detach as distinct actions. Approval
does not make a remembered claim canon. Canon-like material routes explicitly
to its proper owner. No AI request, inference, repeated search or Companion
conversation becomes durable memory automatically.

Acceptance: agreed storage/retention/citation contracts; source/protection
changes invalidate recall appropriately; reference-only missing sources become
tombstones; allowed detached summaries retain honest archived/advisory labels;
forgotten/deleted material leaves active recall; lifecycle actions cannot
delete upstream truth; corrupt storage fails without blocking writing.
The coordinator and Jason must complete the separate higher-risk memory
admission review before ordinary admitted use; any remaining Human Gate 5
obligations retain their scheduled control point. Mechanical qualification
and Program 8 review cannot substitute for admission. P8-0 must settle the
bounded qualification-versus-admission posture: qualification in disposable
evidence projects requires explicit scope, and does not enable ordinary recall
or move the whole of Human Gate 5 into Program 8.

Cross-project sharing, global preferences, automated expiry/purge, derived AI
memory, provider packaging, influence tracing and background preparation are
outside this first package unless separately authorized. DEF-02's durable AI
memory decision and Program 9 RT-2B remain independent of manual memory.

### P8-S: Series Without Shared Truth

Use [Series Binder](series_binder_cross_story_linking.md). Proposed first
slice is explicit series membership, optional typed Story Chains, non-owning
order views, return to projects and unavailable-project tombstones. Project
identity and standalone writing remain intact. Shared identity shells may
be added only after their non-owning/project-record contract is accepted.

Acceptance: joining/removing membership neither transfers facts nor memory,
order views do not reorder manuscripts, missing projects are not guessed or
deleted, project-specific facts remain separate, and reveal/visibility changes
require explicit author control. No cross-project search or automatic recall
expansion. Full manuscript comparison, reimagining/splitting, branch sync and
series-level accepted-fact surfaces remain later bounded work.

## 5. Carried Issues And Exact Reopening Treatment

All five historical causes remain **author-accepted Uncertain**. The original
failed execution results remain unchanged. No current repair or repeat of
the Program 7 human gate is invented. Later success is not causal proof.

| Issue | Retained owner and exact historical resolution stage | Reopening evidence/trigger relevant to Program 8 |
| --- | --- | --- |
| P7-A11Y-ROUTE-01 | Coordinator; Batch 4 route triage before Human Gate 4 disposition | Click/panel mismatch, wrong target, route flip, input/bounds mismatch or navigation stall; preserve topology, theme/profile, project, route state and action/event timing |
| P7-NATIVE-RESP-01 | Coordinator; Batch 4 responsiveness triage before formal Human Gate 4 disposition | Another OS warning, visible stall or impaired input/close; record action/time/project/window/duration and correlated logs |
| P7-STORY-SUPPRESS-01 | Coordinator; Batch 4 Story Knowledge suppression triage before formal Human Gate 4 disposition | Request without durable suppression, rejected write, false feedback or changed suppression/owner contract; preserve owner outcome, durable revision and action/time |
| P7-PACKAGED-NATIVE-ACCESS-01 | Coordinator with Jason for visible launch; P7-G2 current package native access confirmation before HG4 | Ordinary installed launch has missing/crashed/untargetable first window; preserve launch path/process/profile/log and fresh observations |
| P7-MANUAL-SAVE-UNKNOWN-01 | Program 7 coordinator; Program 7 Save-write triage/author disposition, before Human Gate 4 | Supported Save error, missing/duplicate durable alternative, misleading state or manuscript mutation; capture failing operation/code/syscall and before/after bytes |

These completed historical disposition stages are retained verbatim in
substance; they are not rescheduled as Program 8 blockers. A recurrence opens
the existing issue with current evidence and a bounded changed-boundary
repair decision. Any manuscript, protection or author-sovereignty regression
is a hard stop, irrespective of historical accepted uncertainty.

Other retained obligations: P8-01 remains the current Program 8 work item;
ARC-02/TST changed-boundary work informs P8-0; DEF-09 field/detail work is
resolved only where this program needs a stable contract; DEF-12 broader
interchange remains bounded by selected formats; DEF-05 connectors and
DEF-10 paid/outbound expansion retain their gates. CLN-B stays after Program 8
with separately approved disposition. No retained worktree is retired.

Local AI remains unavailable. Owner: Program 9 qualification coordinator with
Jason. Mandatory review is at Program 9 planning entry; RT-2B/model
qualification is required before future AI admission/Human Gate 5. Preserve
the saved Q02/Q04/Q06/Q07 advisory/fidelity findings, complete 24-case/fault
matrix, protected-plane/resource/timing evidence and six-dimension human
quality review. Reopen on author request or approved model/prompt/host/
transport/policy change. This plan executes no model and benchmarks no tokens.

## 6. Regression And Evidence Plan

For this documentation-only task, validate Markdown, local links, inventory
consistency and the Git diff. Do not repeat application/package qualification
for unchanged runtime. Preserved Program 7 results stay bound to feee2e2e;
new Program 8 results must name their own exact candidate.

| Changed boundary | Extend/reuse existing evidence | Required new behavioral proof when authorized |
| --- | --- | --- |
| Destination adapters and receipts | `app/main/__tests__/program7PromotionIpc.test.ts`; `ideationRepository.test.ts`, `ideationIpc.test.ts`; Foundation/Outline repository and IPC tests | Durable restart/lost-reply replay; conflicting reuse of acceptance IDs; duplicate clicks; partial outcomes; source/protection refresh; no optimistic accepted state on deferred/calculated/failed/unknown result |
| Cards | Existing strict serialized sidecar and protection test patterns; promotion tests | Fact-level lifecycle/primary owner/time/belief distinctions, corrupt/unsupported/duplicate records, concurrent same-revision writes, atomic write faults, exact reopen and unchanged manuscript bytes |
| Ideas manuscript/section placement | `narrativeInsertionCoordinator.test.ts`, `shared/__tests__/narrativeInsertion.test.ts`, `projectSpineIpc.test.ts`, revision repository and Unicode/persistence qualification | Both source and target currentness; exact selected range and surroundings; dirty-buffer/project-switch/role refusal; repeated text; cancellation; partial apply; interrupted commit/receipt reconciliation and no duplicate section |
| Binder/assets/search | Existing project isolation, main-role, source-return and sanitized projection tests | One source/multiple placements; removal versus deletion; link versus copy; missing/changed identity; protection on all representations; declared search completeness; rebuild failure and safe return |
| Interchange/archive | `manuscriptStructureRepository.test.ts`, `manuscriptStructureIpc.test.ts`, `projectSpineMarkdownExport.test.ts`, `projectSpineIpc.test.ts`, recovery tests | Mixed/reference staging, loss notices, duplicate/reimport conflicts, preview/payload equality, refusal and partial state, archive manifest/integrity/schema/path containment, all supported owner states and identity rebinding into a new location |
| Memory | Legacy service memory tests are reference material only; reuse current product repository/projection patterns | Explicit type/scope/save, no retention from mere use, recall permissions/currentness, stale/conflict/source loss, forget/archive/detach distinctions, bounded residue, storage fault safety and no upstream mutation |
| Series | Existing project identity/isolation and source-projection patterns | No fact/memory sharing from membership; separate order views; reveal control; tombstones and no cross-project contamination |
| Shell and installed product | Existing Stage 19 shell, surface-host, accessibility, performance, Program 6 Story Knowledge and dedicated Program 7 journeys | New owner paths in real built Electron, attached/detached, both themes, narrow/large text/keyboard, notices/dismissal, source return and fresh-process persistence |

Use existing test files where their owners match; add a focused test only
for genuinely new behavior or a missing failure invariant. Repository/IPC
tests must assert bytes, revisions, identities and owner outcomes, not merely
source shape or mock callback invocation. Prototype passes cannot qualify a
new packaged owner. No new library is requested for tests or implementation.

Illustrative existing commands, run from the verified repository only after
the corresponding implementation is authorized:

```powershell
pnpm --dir app test main/__tests__/program7PromotionIpc.test.ts main/__tests__/ideationRepository.test.ts main/__tests__/narrativeInsertionCoordinator.test.ts main/__tests__/projectSpineIpc.test.ts main/__tests__/projectSpineMarkdownExport.test.ts
pnpm --dir app run build:production
$env:PLAYWRIGHT_RETRIES = '0'
pnpm --dir app exec playwright test tests/e2e/stage19-surface-host-preflight.spec.ts --project=electron --workers=1
pnpm --dir app exec playwright test tests/e2e/program7-create-develop.spec.ts tests/e2e/program7-revision.spec.ts tests/e2e/program7-long-form.spec.ts tests/e2e/program7-local-ai.spec.ts tests/e2e/program7-accessibility.spec.ts --project=electron --workers=1
```

The local-AI file includes the unavailable-family path; its real-provider
opt-in must remain off. Set the existing no-AI fixture/profile policy for
every Program 8 journey. Add the authorized Program 8 journeys to this
focused lane; do not imply the commands above already test nonexistent owners.
Retain failed traces, projects and actual outcomes without automatic retries.

After affected tests pass, run required static/build checks and the existing
Stage 19 regression plus dedicated Program 7/8 layers at the grouped
candidate. A dirty development run is not clean qualification. Freeze a
separately authorized exact candidate before the clean gate; no commit or
freeze authority is granted here. Reuse existing startup preflight once
before the Electron matrix to avoid repeating an upstream failure.

Use the existing Carmilla/representative scale fixtures and accepted
performance limits for changed paths, plus bounded counts for new collections,
cards, assets and memory agreed in P8-0. Do not equate token-usage benchmarking
with performance qualification. Check new large views use bounded excerpts/
pagination rather than rendering every manuscript line or historical record.

For changed runtime, exact unpacked/installed qualification and relevant
offline lifecycle/preservation witness are required before installed claims.
Packaging/install execution and any necessary elevation need their own scope.
Prefer Playwright; desktop inspection is useful for native choosers, ordinary
visible launch and author visual/interaction judgments that automation cannot
establish. Do not perform another broad desktop tour for this plan.

## 7. Human Instructions And Review Readiness

No human replay is requested at planning entry. Program 7 acceptance stands.
This optional checklist documents current built behavior only; it may be used
to resolve an actual ambiguity. Do not use Jason's manuscript or retained
failed fixture for exploratory writes.

Coordinator preparation, if the checklist is needed: from the verified repo,
create a fresh disposable review project with the existing refusal-to-overwrite
helper. This copies the corpus without changing its source:

```powershell
$p8ReviewRoot = Join-Path ([IO.Path]::GetTempPath()) ('bs-p8-review-' + [guid]::NewGuid().ToString('N'))
node scripts/materialize-program7-carmilla-review.mjs --root $p8ReviewRoot
```

Record the printed `fixtureRoot`. Open the retained qualified installed
`C:/Users/gray2/AppData/Local/Temp/bs-p7-feee2e2e-life-90f6a37c/installed/Black Skies.exe`
normally, with its accepted no-AI profile. If absent, stop and reconcile the
installed receipt; do not use a different build as equivalent. In Writing
Studio click **Project Tools**, click **Open project…**, and select
`fixtureRoot`. Click **Open Command Center here**, then **Create / Develop**
and **Ideas**. Keep Command Center attached to the Writing window.

| Current screen | Exact actions | Expected outcome | Failure condition |
| --- | --- | --- | --- |
| Command Center -> Create / Develop -> Ideas | Under Capture an idea enter Title `P8 destination check` and Your idea `A sealed letter remains an unchosen possibility.`; click Save idea. In Saved ideas check Select for a new direction. Under Explore a direction enter Direction name `Letter path` and Core idea for this direction `The author may choose to follow the letter.`; click Create direction | Saved idea and direction appear; manuscript remains unchanged | Missing/duplicate direction, hidden failure, unexpected manuscript change or model execution |
| Same Ideas direction -> Use this direction elsewhere | Select Writing section under Send to, click Preview destination; repeat for Manuscript insertion and Project memory | Each exact preview remains saved, with `This destination is planned but not available yet. Your preview remains saved here.` No destination acceptance is available | Claimed completed write, missing planned guidance, lost preview or any destination/manuscript change |
| Same direction -> Character notes, then World notes | Select destination, click Preview destination, then Send to Character notes or Send to World notes | Deferred owner-required outcome says no character/lore truth was written | Accepted-fact success claim, false card creation, unclear deferred outcome or manuscript write |
| Same direction -> Story Foundation, then Outline | Preview and use Send to Story Foundation; open Story Foundation and inspect Your note under `If you can say it simply, what is it about?`. Return to Ideas, preview Outline and use Send to Outline; click Return to Writing Studio, then Story, and inspect the `Letter path` Note in the Story rail | Intended text exists in its actual destination; manuscript unchanged; explicit nearby result | Wrong owner/project/text, misleading successful notice, hidden failure or changed prose |
| Close normally and reopen the same disposable project | Inspect Ideas previews and the Foundation/Outline results | Persisted source previews and actual accepted owner state remain distinguishable | Lost durable state, duplicate state or preview represented as a completed destination write |

The Source-to-Revision alternative route already has accepted Program 7
human and automated proof; the unavailable Ideas Manuscript insertion result
above does not invalidate it or request another revision gate.

For future packages, the coordinator first completes objective prechecks and
prepares a concrete exact-candidate packet. New screens and action labels do
not exist yet, so an executable click-by-click Program 8 test script must be
written only after their implementation is known, as execution-control
section 12 requires. Each script must supply executable/profile, disposable
project path, exact screen/actions, expected outcome, failure conditions and
source return; no instruction to reconstruct a fixture or interpret storage
enums. The planned grouped human outcomes are:

| Proposed review home, not a current screen claim | Author action and acceptance outcome |
| --- | --- |
| Story Knowledge card review | Review candidate facts, accept only chosen facts, distinguish candidate/accepted/history, return to evidence and confirm durable reopen |
| Ideas plus Writing Studio destination preview | Cancel once, then explicitly accept the chosen section/range; verify exact intended change and no other prose mutation |
| Summoned Binder/search/file view | Organize a reference, find/open its source and return to the manuscript; source remains independent of its placements |
| Project Interchange | Classify local material, review warnings and destination, cancel or approve deliberately; export/archive outcome matches its preview and opens independently |
| Governed Memory review | After the separate memory gate, approve type/scope/retention, inspect provenance/currentness and forget a record without changing its source |
| Series inspection | Establish membership/link/order and verify no implied shared truth, memory or revealed hidden material |

Jason owns usefulness, wording, clarity, interruption and author-sensitive
acceptance. Agent Pass/Fail/Uncertain execution is not his decision. Review
every failure/uncertainty/authority-sensitive row and a bounded deterministic
sample of objective passes. Current failures are repaired or explicitly
dispositioned at their owner; accepted historical causes stay Uncertain.
Stop and preserve state for wrong-project writes, unexpected AI/network work,
protection leakage, manuscript corruption, blocking crash or trapped focus.

## 8. Acceptance, Deferrals, And Next Decision

This planning package is complete when the baseline is reconciled, current
behavior is separated from proposals, all candidate families have bounded
owners/seams/gaps, carried issues retain their exact stages/triggers, and
the regression and human evidence requirements are reviewable. Completion
of planning is not acceptance of this draft or implementation authorization.

Program 8 may close only after its separately accepted scope is qualified and
the exact approved **Program 8 destination-owner workflow qualification,
before Program 8 closure** is completed for all three carried integrations,
including durable human proof while respecting the retained separate memory
gate. A qualified memory owner is not automatically admitted memory. Keep
any unpassed admission gate explicit and disabled; do not represent it as a
completed gate or an available ordinary workflow. If destination qualification
cannot be completed within that boundary, the checkpoint remains open; any
scope change or further destination deferral needs an explicit author decision.

Before the first runtime package, Jason must decide the P8-0 owner/action
contracts and authorize that package's exact files and acceptance matrix.
Recommended first runtime scope is P8-A, followed by P8-B. Memory's storage/
retention contract, the meaning of Writing section, selected interchange
formats/archive identity and the bounded Series ceiling are the remaining
product decisions; no existing vision decision is reopened.

Semantic/AI retrieval, card extraction, paid routes, Google Docs adapters,
sync, background jobs, destructive asset operations, restore-over-current,
application backup expansion, full series reimagining and broader durable AI
memory remain outside the proposed first slices under their existing owner
gates. First-slice omissions are not automatic permanent deferrals or claims
that the entire master candidate list was completed. Review and explicitly
approve the final Program 8 ceiling before closure. Cleanup Wave B and
Program 9 retain their later sequence and separate authority.

## 9. Planning Validation Receipt

This documentation package was validated against the unchanged starting HEAD.

- `node scripts/check-current-authority-docs.mjs`: Pass, 73 current-authority
  documents, local links resolved, no stale public-release claim.
- Draft checks: Markdown validation, 92 local links, preservation of historical
  tracker/register text outside the declared P8-01 update, and unchanged prior
  authority metadata. The historical tracker is outside the current-authority
  lint inventory; its 101 pre-existing formatting diagnostics are unchanged,
  and the additions introduce none.
- `git diff --check`: Pass; saved hashes match the reviewed draft. The only
  repository changes are this new plan, current open-work register, fix tracker,
  and authority inventory Markdown/JSON. HEAD and branch remain unchanged;
  changes are uncommitted.
- `pnpm lint:docs` could not obtain its pinned package-manager version offline;
  the same repository checker was executed directly with installed Node.
  No dependency change was made.
- No application tests, desktop replay, installer qualification, model
  execution, token benchmark, human acceptance, commit, push or release is
  claimed by these documentation results.
