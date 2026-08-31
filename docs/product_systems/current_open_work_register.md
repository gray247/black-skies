# Black Skies Current Open Work Register

## 1. Status And Purpose

- Status: `CURRENT`
- Established: `2026-08-10`
- Owner: `Post-V1 integration program`
- Update rule: `Review before each program, after each human gate, before each cleanup wave, and before final qualification`

This register is the single current index for actionable unfinished work. It
does not copy historical ledgers or every dossier question. It points each live
decision to its source, owner, trigger, and next review.

An item not listed here may still exist as historical evidence or a deferred
dossier question. It does not become current execution scope until this
register or a currently authorized program promotes it.

## 2. Status Vocabulary

- `active`: current authorized control-point or program work,
- `repair-active`: current corrective work after a complete human gate found a
  workflow unacceptable,
- `closed-mechanical`: automated behavior and qualification are complete, but
  no broader author-experience or capability claim is implied,
- `next`: begins after the current item closes,
- `owned-later`: has a named future home and trigger,
- `blocked-decision`: cannot proceed without Jason's decision,
- `historical-only`: retained as evidence and not active scope,
- `closed`: completed with durable evidence.

## 3. Current Register

| ID | Current item | Source | Status | Owner / resolution point | Trigger or exit condition |
| --- | --- | --- | --- | --- | --- |
| DOC-01 | Author-experience, execution-control, roadmap, truth-index, and Gate 1 reconciliation | Current documentation batch | closed | Documentation reconciliation | Committed and pushed at `f73f6880`; current-authority lint passed |
| RCP-00 | Dirty primary checkout at `salvage/minimal-two-surface-shell` / `0d4e05da` plus duplicate `b13f` state | [Repository Control Point 0 ledger](repository_control_point_0_reconciliation_ledger.md) | closed | Pre-Program-3 repository control | All hunks classified, original and supplemental exact snapshots verified, Jason approved the non-destructive disposition, and the receipt was pushed at `c668586f`; Pass 1A closes the previously uncaptured three-path evidence gap |
| RCP-01 | Canonical continuing development line | Approved author decision and RCP0 ledger | closed | Repository Control Point 0 | Jason approved `codex/foundation-audit` as the sole continuing line; legacy worktrees remain quarantined until Cleanup Wave A |
| OWR-01 | Reconcile live items from fix tracker, dossiers, deferral table, skip inventory, reachability inventory, and workflow ledgers | [Control Point 1 open-work reconciliation](control_point_1_open_work_reconciliation.md) | closed | Control Point 1 Batch A | Evidence batch is committed and pushed; architecture and test audits use this ownership map |
| ARC-01 | Architecture and maintainability baseline | [Control Point 1 architecture and maintainability audit](control_point_1_architecture_maintainability_audit.md) | closed | Control Point 1 Batch B | Evidence batch is committed and pushed; Program 3 uses the bounded refactor budget |
| TST-01 | Test-strength and intentional-skip review | [Control Point 1 test-strength audit](control_point_1_test_strength_audit.md) | closed | Control Point 1 Batch C | Evidence batch is complete; Program 3 and later programs use its risk-led ownership map |
| DES-01 | Restrained professional literary visual foundation | [Control Point 1 Visual Design Foundation](control_point_1_visual_design_foundation.md) | closed | Control Point 1 Batch D | Jason approved the complete packet as written on 2026-08-10; it is Program 3 design authority |
| ARC-02 | Startup assumptions, workflow duplication, CI narrowing, snapshot authority, and runtime-truth monitors | Fix-tracker normalized issues 6, 9, 10, 14, and 18 | owned-later | Each changed-boundary program and final audit | Admit a refactor only when current evidence identifies a bounded defect or replacement need |
| ARC-P3-01 | Logical surface host independent of mandatory physical-window placement | Architecture audit `ARC-P3-01` and [P3-C evidence receipt](program_3_batch_p3_c_evidence_receipt.md) | closed | Program 3 Batch P3-C | Single-screen and optional-secondary logical hosts preserve one Writing owner; durable at `3de76ee1` |
| ARC-P3-02 | Behavior-locked Stage 19 controller/view decomposition | Architecture audit `ARC-P3-02` and [P3-B evidence receipt](program_3_batch_p3_b_evidence_receipt.md) | closed | Program 3 Batch P3-B | Explicit stateless views consume controller-owned state/actions while existing workflow state machines remain singular; durable at `2ff0361c` |
| ARC-P3-03 | Sanitized Command Center Review projection and source return path | Architecture audit `ARC-P3-03` and [P3-F evidence receipt](program_3_batch_p3_f_evidence_receipt.md) | closed | Program 3 Batch P3-F | Main-owned role, project, generation, request, unit, selection, stale, action, and exact source-return boundaries are durable at `5d481146` |
| ARC-P3-04 | Dedicated Stage 19 preload parity across development, test, and package hosts | Architecture audit `ARC-P3-04`, [Program 3 closure receipt](program_3_closure_receipt.md), and [Program 5 bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | closed | Program 3 through final Human Gate 2 candidate | Production and Stage 19 preloads expose the same narrow host contract; exact combined installed parity passed on Program 5 product commit `6efec7b9` |
| ARC-P3-05 | Truthful active-surface TypeScript boundary | Architecture audit `ARC-P3-05` and [Program 3 closure receipt](program_3_closure_receipt.md) | closed | Program 3 P3-D through P3-G | Full typecheck covers the complete Program 3 Writing, Living Outline, Command, shared-contract, and Electron boundary |
| ARC-P3-06 | Scoped Program 3 style and token boundary | Architecture audit `ARC-P3-06` and [Program 3 closure receipt](program_3_closure_receipt.md) | closed | Program 3 P3-D through P3-G | Writing, Living Outline, and Command use the approved scoped token/state layer with targeted visual and responsive evidence; global legacy cleanup remains excluded |
| ARC-P3-07 | Consistent presentation-state vocabulary over domain-specific errors | Architecture audit `ARC-P3-07` and [Program 3 closure receipt](program_3_closure_receipt.md) | closed | Program 3 P3-F and P3-G | Advisory, stale, failed, cancelled, expired, dismissed, unavailable, degraded, disabled, Focus, and non-color state evidence are mechanically complete |
| ARC-H1 | Feedback Note concurrent-create lost-update risk | Architecture audit `ARC-H1` and [P3-A evidence receipt](program_3_batch_p3_a_evidence_receipt.md) | closed | Program 3 Batch P3-A | Per-project serialization and deterministic no-lost-update/failure-recovery evidence are durable at `4007e12a` |
| ARC-CLN-01 | Legacy App, preload, project loader, layout, optional services, and broad main-process professionalization | Architecture audit `ARC-D1` through `ARC-D5` | owned-later | Cleanup Wave A, Cleanup Wave B, or final professionalization according to reachability | Proven replacement map, recovery path, and exact approved disposition make change safer than retention |
| TST-02 | Risk-led capability coverage gaps | Fix-tracker normalized issue 12 and Control Point 1 test audit | closed | Control Point 1 Batch C | Prioritized behavioral gaps have exact program owners; no blind coverage-percentage campaign |
| TST-G1 | Supported-core receipt lists TypeScript paths beside a Python-only branch percentage | Test audit `TST-G1` and [P3-A evidence receipt](program_3_batch_p3_a_evidence_receipt.md) | closed | Program 3 Batch P3-A | The durable v2 receipt at `4007e12a` labels the percentage as Python supported core and lists TypeScript behavior outside that percentage |
| TST-P3-01 | Logical surface-host authority evidence | Test audit `TST-P3-01` and [P3-C evidence receipt](program_3_batch_p3_c_evidence_receipt.md) | closed | Program 3 Batch P3-C | Deterministic unit and built-Electron evidence proves one project and one Writing mutation owner; durable at `3de76ee1` |
| TST-P3-02 | Sanitized Review projection evidence | Test audit `TST-P3-02` and [P3-F evidence receipt](program_3_batch_p3_f_evidence_receipt.md) | closed | Program 3 Batch P3-F | Command receives only approved advisory projection data; malformed, cross-owner, prose, credential, stale, and action-escalation paths are rejected; durable at `5d481146` |
| TST-P3-03 | Feedback Note multi-surface concurrency evidence | Test audit `TST-P3-03`, architecture `ARC-H1`, and [P3-A evidence receipt](program_3_batch_p3_a_evidence_receipt.md) | closed | Program 3 Batch P3-A | Durable evidence at `4007e12a` proves twenty-four concurrent creates, isolation, malformed data, and failed-write queue recovery; later Command routing remains P3-F scope |
| TST-P3-04 | Presentation-state and changed-shell accessibility matrix | Test audit `TST-P3-04` and [Program 3 closure receipt](program_3_closure_receipt.md) | closed | Program 3 P3-D through P3-G | Semantics, keyboard/focus, Focus mode, 200 percent text, reduced motion, non-color cues, responsive states, terminal/stale/degraded behavior, and rich Review axe evidence are green |
| TST-P3-05 | Layered visual and responsive evidence | Test audit `TST-P3-05`, [Program 3 closure receipt](program_3_closure_receipt.md), and [Program 5 bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | closed | Human Gate 2 | Targeted Windows references, responsive/large-text evidence, shared-chrome parity, and final installed author acceptance passed through exact Program 5 product commit `6efec7b9` |
| TST-P3-06 | Development, test, build, and package authority parity | Test audit `TST-P3-06`, [Program 3 closure receipt](program_3_closure_receipt.md), and [Program 5 bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | closed | Combined Program 3 through Program 5 candidate | Exact product commit `6efec7b9` passed typecheck, lint, build, clean regression, package verification, elevated offline installed lifecycle, strict receipt-bound witness, and final author acceptance |
| TST-P3-07 | Versioned performance protocol for accepted surface topology | Test audit `TST-P3-07` and [Program 3 closure receipt](program_3_closure_receipt.md) | closed | Program 3 P3-G | `program3-logical-surfaces-v1` is versioned and green while the immutable V1 two-window baseline remains unchanged |
| ENV-01 | Local harness preflight, port, temp-directory, and ACL constraints | Fix-tracker normalized issues 21 and 30 | owned-later | Each exact-candidate qualification and final audit | Reproducible host constraints are recorded; host cleanup remains separately authorized |
| UX-01 | Project creation and startup experience | Fix-tracker normalized issue 26, Human Gate 1 synthesis, Program 3 shell, and [Program 5 bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | closed | Human Gate 2 | Startup composition, project entry, shared chrome, and responsive long-title behavior passed exact-candidate automation and final installed author acceptance at `6efec7b9` |
| SKP-01 | Budget-indicator UI opt-in skip | Intentional-skip inventory | owned-later | Program 9 / final qualification | Scoped budget-indicator qualification is authorized |
| SKP-02 | Snapshots-panel UI opt-in skip | Intentional-skip inventory | owned-later | Program 9 / final qualification | Scoped snapshots-panel qualification is authorized |
| SKP-03 | Real-service truth lane opt-in skip | Intentional-skip inventory | owned-later | Program 9 or an earlier real-service boundary change | Controlled real-service environment is provided |
| SKP-04 | Historical portable whole-page visual snapshot remains opt-in | Intentional-skip inventory, test audit `TST-P3-05`, [Program 3 closure receipt](program_3_closure_receipt.md), and [Program 5 bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | historical-only | Later visual-strategy replacement only | Targeted Windows references, semantic/responsive evidence, shared-chrome parity, and installed author acceptance passed; portable whole-page pixel equality was not required for Human Gate 2 closure |
| SKP-05 | Live-provider qualification skip | Intentional-skip inventory | owned-later | Program 9 or a named provider package | Credentialed provider qualification is explicitly authorized |
| P3-01 | Contextual product shell | [Program 3 implementation plan](program_3_contextual_product_shell_implementation_plan.md) and [Program 3 closure receipt](program_3_closure_receipt.md) | closed | Program 3 | P3-A through P3-G are durable; the exact P3-G closure batch was committed and pushed at `9ff07369670d8380e03df3fa6d3aca2e83b338f4` |
| P4-01 | Minimal Companion and owner routing | [Program 4 implementation plan](program_4_minimal_companion_owner_routing_implementation_plan.md) and [P4-A through P4-C evidence receipts](program_4_batch_p4_c_evidence_receipt.md) | closed-mechanical | Program 4 | Exact candidate `319b9c6` passed hosted Windows package/install qualification run `31542494314`; the local-facts route is mechanically safe but does not claim local-LLM conversation capability |
| HG-02 | Shell and Companion human gate | [Human Gate 2 Experience Repair Plan](program_4_human_gate_2_experience_repair_plan.md) and [Program 5 bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | closed | Human Gate 2 | Jason explicitly recorded Human Gate 2 passed; its final repaired surfaces were requalified and accepted on exact Program 5 product commit `6efec7b9` |
| HG2-RPR-01 | Continuous Manuscript + Unified Story Rail + Real Focus Mode + Companion Bar | [Human Gate 2 Experience Repair Plan](program_4_human_gate_2_experience_repair_plan.md), [HG2-RPR-A receipt](program_4_hg2_rpr_a_evidence_receipt.md), [HG2-RPR-B receipt](program_4_hg2_rpr_b_evidence_receipt.md), [Program 5 bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md), [HG2-RPR-C receipt](program_4_hg2_rpr_c_evidence_receipt.md), and [HG2-RPR-D receipt](program_4_hg2_rpr_d_evidence_receipt.md) | closed | Human Gate 2 | Bounded repairs culminated in exact product commit `6efec7b9`; clean/package/installed/strict-witness evidence and final author acceptance are complete |
| CLN-A | First legacy disposition, archive/delete, and professionalization wave | Reachability inventory and current code audit | closed | Cleanup Wave A final integration | Passes 1A, 1B/1B-R, 2A, 2B, 2C, 3, and 3R are complete; the exact 13-path integration was committed and pushed on `codex/foundation-audit`, local/upstream HEADs match, and the four-worktree inventory is retained with C:\Dev, 46bb, and b13f protected/quarantined |
| P5-01 | Long-manuscript intake and stable structural anchors | Direction Lock, Program 5, [Human Gate 2 repair plan](program_4_human_gate_2_experience_repair_plan.md), and [bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | closed | Program 5 / Human Gate 3 | Exact product commit `6efec7b9` passed clean regression, substantial-manuscript qualification, exact package verification, elevated offline installed lifecycle, strict witness, and final author acceptance |
| P5-UX-01 | Program 5 pre-closure Writing Studio navigation and Unit/Note rail semantics | [Corrected Programs 1–5 repair plan](program_1_to_5_priority_repair_plan.md), [Human Gate 2 repair plan](program_4_human_gate_2_experience_repair_plan.md), [Fix Tracker](../BLACK_SKIES_FIX_TRACKER.md), and [bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | closed | Program 5 | Navigation, rails, Note semantics, startup composition, Structure workflow, readability, stale history, and shared chrome passed exact-candidate automation and installed author review at `6efec7b9` |
| HG-03 | Long-manuscript integrity and usability | Execution-control plan and [Program 5 bridge/closure receipt](program_5_hg2_bridge_evidence_receipt.md) | closed | Human Gate 3 | Jason completed the structural sequence and recorded `Program 5 final check passed` on the exact installed candidate on 2026-08-31 |
| P6-01 | Signal posture and Emotion Graph V1 | Program 6 | owned-later | After Cleanup Wave A and explicit Program 6 authorization | Human Gate 3 has established stable positions and anchors; bounded planning may begin, but runtime implementation remains unauthorized until the cleanup checkpoint is resolved |
| P7-01 | First creation or revision workflow | Program 7 | owned-later | Program 7 | Initial story-intelligence workflow is coherent enough to support it |
| HG-04 | Intelligence and creation review | Execution-control plan | owned-later | Human Gate 4 | Programs 6 and 7 provide complete reviewable workflows |
| P8-01 | Knowledge, organization, and broader interchange | Program 8 | owned-later | Program 8 | Human Gate 4 synthesis identifies the highest-value workflow order |
| CLN-B | Second legacy cleanup and professionalization wave | Reachability, dependency, and architecture evidence | owned-later | After Program 8 | Major product families have current owners and replacements |
| P9-01 | Heavy intelligence, durability, and operationalization | Program 9 | owned-later | Program 9 | Proven workflows justify each high-risk capability |
| HG-05 | High-risk behavior review | Execution-control plan | owned-later | Human Gate 5 | High-risk candidate is complete and qualified |
| FIN-01 | Final professionalization and release audit | Execution-control plan | owned-later | Final audit | Product programs and cleanup waves are complete |
| HG-06 | Final installed-product review | Execution-control plan | owned-later | Human Gate 6 | Final installed candidate and complete author journey are ready |
| DEF-01 | Accepted-manuscript reorder | Master-program deferral table | owned-later | Later Living Outline slice | Preview-only workflow creates demonstrated author demand |
| DEF-02 | Durable AI memory | Master-program deferral table | owned-later | Memory-specific decision | Proven workflow cannot deliver repeated value without retained derived state |
| DEF-03 | Second provider or automatic routing | Master-program deferral table | owned-later | Program 9 | Task-specific evidence justifies alternate routing and Jason approves |
| DEF-04 | Background or overnight jobs | Master-program deferral table | owned-later | Program 9 | Proven task cannot remain foreground and has safe lifecycle rules |
| DEF-05 | Third-party connectors | Master-program deferral table | owned-later | Existing Workflow Proof plus Missing Connector Review | Proven workflow demonstrates necessity rather than convenience |
| DEF-06 | Branching / what-if architecture | Master-program deferral table | owned-later | Later structural review | Prototype arrangements cannot satisfy a real workflow |
| DEF-07 | Repository-wide historical archive completion | Roadmap and cleanup policy | owned-later | Cleanup Wave B / final audit | Current authority and replacement map make archival safe |
| DEF-08 | Stale, detached, duplicate, and broken worktree registrations | [Repository Control Point 0 ledger](repository_control_point_0_reconciliation_ledger.md) | owned-later | Cleanup Wave A | Original and supplemental recovery evidence is complete; Pass 1B removed the eleven approved duplicate registrations, including the bounded 1612 repair, and Pass 3R removed the proven orphaned 0830 directory and clean fc8b worktree. Separate dispositions and recovery checks remain for the four protected worktrees before closure |
| DEF-09 | Dossier-completion wording and field detail | Master-program deferral table | owned-later | First workflow planning batch that needs it | Category-4 doctrine cannot support a stable contract or understandable UI |
| DEF-10 | Paid or outbound expansion | Master-program deferral table | owned-later | Separately named task package | Proven local/manual workflow justifies privacy, cost, and approval work |
| DEF-11 | Third-party plugin ecosystem | Master-program deferral table | owned-later | Post-first-party analyzer review | Repeated demand cannot be met through internal rubrics or first-party analyzers |
| DEF-12 | Broader document interchange and Google Docs adapters | Master-program deferral table | owned-later | Program 8 after Program 5 | Proven workflow requires an external format or service |
| DEF-13 | Research / Deep Research | Roadmap scope correction | owned-later | Explicit scope reopening | Jason establishes a current owner and workflow |
| DEF-14 | Voice, dictation, and transcription | Roadmap scope correction | owned-later | Explicit scope reopening | Jason defines accessibility and provenance boundaries |

### Pass 1A recovery-evidence reconciliation — 2026-08-31

The preserved `C:\Dev\black-skies` checkout contained three current deltas
outside the original RCP0 snapshot: the uncommitted deletion of
`AGENTS.override.md`, a legacy launcher/port-5173 update in
`docs/BLACK_SKIES_FIX_TRACKER.md`, and the incorporated launcher guidance in
`docs/ops/start_codex_gui_notes.md`. They are preserved as evidence only in
[`repository_control_point_0_legacy_dirty_supplement_2026-08-31.patch`](repository_control_point_0_legacy_dirty_supplement_2026-08-31.patch),
SHA-256
`2143CCE00B31A7DD8FF7F44C71C8902D80234ABBFF60504BE02F431B10225937`.
Reverse-apply validation passed against the unchanged legacy checkout. No
canonical behavior is imported; Cleanup Wave A remains open and Program 6 is
not current implementation scope.

### Pass 1B duplicate worktree removal — 2026-08-31

The eleven approved duplicate registrations were removed in bounded Git-only
steps: the orphaned `1612` administrative registration was repaired by the
separately authorized Pass 1B-R prune, followed by the ten exact clean,
detached `d2b50a8ee9fbf33784e860040c8836b5c52ea106` registrations at `3515`,
`3811`, `5e84`, `63cc`, `67d7`, `7e81`, `806a`, `98ff`, `eeea`, and `f05d`.
The commit remains recoverable through `origin/main`. Elevated Git was
required because ordinary sandbox execution could not remove the shared Git
administrative directory. No force, broad prune, manual deletion, ACL change,
branch/ref deletion, commit, or push occurred. The six protected worktrees
remain registered with their prior dispositions; Cleanup Wave A remains open
and Program 6 remains excluded.

### Pass 2A unused layout dependency removal — 2026-08-31

The canonical `4f0b` reachability audit found no active tracked source, test,
script, build, or CSS reference to `react-resizable` or `react-rnd`. Their only
active references were the four direct `app/package.json` declarations, the
corresponding lockfile records, and the obsolete Vite `layout-tools` manual
chunk condition. `react-mosaic-component` remains declared and actively used
by the docking workspace, pane tile, shared layout types, and docking tests;
its stylesheet import and `mosaic` chunk rule were retained.

Pass 2A removed exactly `react-resizable`, `react-rnd`,
`@types/react-resizable`, and `@types/react-rnd` from the app manifest and
removed only that Vite condition. The lockfile was regenerated with pinned
pnpm `8.15.9` using the offline lockfile-only workflow and passed frozen
offline installation. Focused docking/layout tests passed 5 files / 29 tests;
typecheck, repository lint, production build, package preflight, docs lint,
and diff hygiene passed.

The required Stage 19 regression was run twice. Its non-Electron gates, 49-file
unit matrix (774 passed, 2 skipped), startup preflight, and 34 of 35 Electron
tests passed. The same unrelated `P5-HG3` subpixel chrome mismatch reproduced
in unchanged Writing Studio / Command Center test surfaces; no dependency,
runtime, UI, or test workaround was authorized or made. Cleanup Wave A remains
open and Program 6 remains excluded.

### Pass 2C orphan Electron retirement and P5-HG3 geometry characterization — 2026-08-31

The first attempt correctly blocked and restored after the stale
`electron/**/*.ts` lint target was exposed. The retry removed exactly
`app/electron/preload.ts` and `app/electron/projectLoader.ts`, removed the
retired `electron` TypeScript include, and removed the matching lint glob.
No active caller was found; current `app/main` preloads, loader/Project Spine,
shared IPC, `App.tsx`, docking, and `react-mosaic-component` paths remain
unchanged and retained.

The status-only hardening exposed the same fractional BrowserWindow mapping on
action geometry. Stable authored properties remain exact. Only five geometry
fields receive bounded tolerance: status border width `0.5` CSS px, status
height `1` CSS px, action border width `0.5` CSS px, action height `1` CSS px,
and header height `1` CSS px; border-width parsing must be finite. The focused
P5-HG3 gate passed 3/3. The complete Stage 19 matrix remains the resolution
gate for the Pass 2A 34/35 blocker. Final validation passed the 49-file unit
matrix with 774 passed and 2 authorized skips, startup preflight, and the
complete 35/35 Electron matrix, resolving that blocker. Cleanup Wave A remains
open and Program 6 remains excluded.

### Pass 3R orphaned 0830 directory and final worktree reconciliation — 2026-08-31

The first Pass 3 git worktree remove removed the 0830 registration but left
its directory because Git reported "Directory not empty". The exact residual
was independently proved disposable: the resolved target and parent were
exact, the root was not a reparse point, .git was absent, no registration or
running process referenced it, and commit 929a0c3f remained readable. The
recovery artifact remained unchanged at SHA-256
A38DADD41E07D00247B2B2A94FC9CA50F3B9EB7D17247D87268E10ED23478044 and stable
patch ID ecb56ad4cad2b8956560fc6df3faa530e9bb884c; it contains only the
additions app/main/__tests__/sessionTruth.test.ts and
app/shared/sessionTruth.ts. The supplemental artifact remained
2143CCE00B31A7DD8FF7F44C71C8902D80234ABBFF60504BE02F431B10225937; the
ledger hash before this authorized documentation update was
9DF4B998DF63F3412DAADC7C4CC404B433E191C23BE8171F535FEA29A522F5F3.

The complete residual proof found ignored, install-generated node_modules
content, 2,243 internal reparse points, zero external or unresolved targets,
504 non-dependency files, 497 exact commit-blob matches, six approved
CRLF-normalized PowerShell matches, and exactly one untracked accidental
path-list file: ted memory docs, services, and tests. Its SHA-256 was
DA7DF35A687BB642633BFCE51ADC6685CFF93D6C3602CC62795F6C874BF924BD; its 95
nonempty lines were only a path inventory, so it was not separately archived.

After proof, elevated native PowerShell removed only
C:\Users\gray2\.codex\worktrees\0830\black-skies. The clean detached fc8b
checkout at 7017c34a equal to origin/main was then removed only by the exact
non-force git worktree remove command. The final registered set is exactly
C:\Dev\black-skies, 46bb, canonical 4f0b, and b13f; C:\Dev, 46bb, and b13f
remain quarantined/protected, while canonical 4f0b remains the active cleanup
worktree. Sample-project aliases, fixtures, and linked historical documents
remain retained. No source, tests, configuration, lockfiles, fixtures, or
historical source documents changed; Cleanup Wave A remains open for final
 integration and Program 6 was not started.

### Cleanup Wave A final integration — 2026-08-31

Passes 1A, 1B/1B-R, 2A, 2B, 2C, 3, and 3R are complete. The final integration
boundary is exactly 13 paths: the two unreachable `app/electron` deletions;
the app manifest, P5-HG3 Electron test, TypeScript and Vite configuration,
tracker, current register, RCP0 ledger, lockfile, and app ESLint launcher
modifications; and the two historical recovery patch additions. No runtime
behavior, persistence contract, IPC schema, fixture, CSS, snapshot, or Program
6 capability changed.

The dependency closure and orphan-code dispositions are limited to the four
unused layout declarations and their unreachable lockfile closure, the
obsolete `layout-tools` Vite condition, the two unreachable Electron files,
and their empty TypeScript/ESLint targets. Mosaic/docking behavior, tests,
stylesheet, and `mosaic` chunk remain. P5-HG3 retains exact stable/authored
properties and tolerates only the five bounded geometry fields already
recorded in the tracker, with finite-number parsing for border widths.

Recovery artifacts remain retained as historical evidence: the 0830 artifact
is SHA-256
`A38DADD41E07D00247B2B2A94FC9CA50F3B9EB7D17247D87268E10ED23478044` with
stable patch ID `ecb56ad4cad2b8956560fc6df3faa530e9bb884c`, and the legacy
dirty supplement is SHA-256
`2143CCE00B31A7DD8FF7F44C71C8902D80234ABBFF60504BE02F431B10225937`.
Both are UTF-8 without BOM and contain no credentials or secrets.

The final registered inventory is exactly `C:\Dev\black-skies`, `46bb`,
canonical `4f0b`, and `b13f`; `C:\Dev`, `46bb`, and `b13f` are deliberately
retained protected quarantines. Sample-project aliases, active fixtures, and
linked historical documents remain retained.

Complete dirty-regression evidence: pnpm `8.15.9` offline frozen install,
focused P5-HG3 `3/3`, typecheck, repository lint, production build, package
preflight, docs lint, and diff hygiene passed; the full dirty Stage 19 gate
returned `STAGE19_REGRESSION_PASS` with `49` critical unit files, `774`
passed, `2` authorized skips, startup preflight `1/1`, and Electron `35/35`.
Cleanup Wave A closes when the containing commit is pushed and local/upstream
HEADs match. Program 5 remains complete; Program 6 was not started; and no
installer or release-candidate qualification is claimed by this cleanup
commit.

## 4. Existing Source Treatment

### BLACK_SKIES_FIX_TRACKER.md

Retains defect history, evidence, and reopening triggers. It is not the daily
post-V1 execution queue. A currently actionable tracker item must have a row
here or be explicitly admitted by the active program.

### Dossier Deferred Questions

Remain with their owning dossier. They are promoted here only when a current
workflow touches them or their reopening trigger fires.

### Intentional Skip Inventory

Every skip remains visible. A skip is reviewed when its named program begins,
when the affected surface becomes packaged or user-facing, and during final
qualification.

### Reachability Inventory

Supplies legacy and cleanup candidates. A reachability label does not itself
authorize deletion.

### Historical Audits And Ledgers

Remain evidence. They do not become active scope merely because they contain
an old `next action` statement.

## 5. Update Rule

For every change to a row, record:

- date,
- actor or task,
- exact commit or candidate when applicable,
- new status,
- evidence link,
- next owner or closure rationale.

Closed rows may remain for current milestone traceability. Older closed rows
may later move to a milestone receipt or archive only through an approved
documentation cleanup.
