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
- `next`: begins after the current item closes,
- `owned-later`: has a named future home and trigger,
- `blocked-decision`: cannot proceed without Jason's decision,
- `historical-only`: retained as evidence and not active scope,
- `closed`: completed with durable evidence.

## 3. Current Register

| ID | Current item | Source | Status | Owner / resolution point | Trigger or exit condition |
| --- | --- | --- | --- | --- | --- |
| DOC-01 | Author-experience, execution-control, roadmap, truth-index, and Gate 1 reconciliation | Current documentation batch | active | Documentation reconciliation | Current-authority lint passes; Jason commits and pushes |
| RCP-00 | Dirty primary checkout at `salvage/minimal-two-surface-shell` / `0d4e05da` | Repository Control Point 0 | next | Pre-Program-3 repository control | Documentation batch is clean and pushed |
| RCP-01 | Canonical continuing development line | Approved author decision | next | Repository Control Point 0 | Dirty hunks reconciled; Jason approves old-checkout disposition |
| OWR-01 | Reconcile live items from fix tracker, dossiers, deferral table, skip inventory, reachability inventory, and workflow ledgers | Execution-control plan | next | Control Point 1 | Canonical development line is established |
| ARC-01 | Architecture and maintainability baseline | Large responsibility concentrations and cross-process boundaries | next | Control Point 1 | Repository Control Point 0 closes |
| TST-01 | Test-strength and intentional-skip review | Supported-core coverage, skip inventory, current harnesses | next | Control Point 1 | Repository Control Point 0 closes |
| DES-01 | Restrained professional literary visual foundation | Author Experience Direction Lock | next | Control Point 1 | Architecture and workflow constraints are available |
| P3-01 | Contextual product shell | Post-V1 Master Program, Program 3 | owned-later | Program 3 | Control Point 1 closes and design direction is approved |
| P4-01 | Minimal Companion and owner routing | Post-V1 Master Program, Program 4 | owned-later | Program 4 | Program 3 automated evidence is green |
| HG-02 | Shell and Companion human gate | Execution-control plan | owned-later | Human Gate 2 | Programs 3 and 4 form one complete candidate |
| CLN-A | First legacy disposition, archive/delete, and professionalization wave | Reachability inventory and current code audit | owned-later | After Human Gate 2 | New shell is accepted and replacement relationships are provable |
| P5-01 | Long-manuscript intake and stable structural anchors | Direction Lock and Program 5 | owned-later | Program 5 | Human Gate 2 and Cleanup Wave A close |
| HG-03 | Long-manuscript integrity and usability | Execution-control plan | owned-later | Human Gate 3 | Program 5 produces a complete qualified candidate |
| P6-01 | Signal posture and Emotion Graph V1 | Program 6 | owned-later | Program 6 | Human Gate 3 establishes stable positions and anchors |
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
