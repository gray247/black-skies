# Phase R2 Roadmap Survivability Ledger

## Purpose

This ledger is provisional Phase R2 planning support.

It does not replace the roadmap, does not activate Phase 32, and does not define final GUI or workflow architecture.

It exists to classify which current or planned work likely survives the emerging workflow/governance direction, which work is transitional, and which work should remain blocked, paused, or research-only until Phase R2 closes.

It should be read alongside `docs/audits/phase_r2_governance_snapshot.md`, which preserves the synthesized governance findings that justify these provisional planning labels.

## Classification Vocabulary

These labels are standardized provisionally for Phase R2 planning artifacts only. They are not final app workflow states, product UX states, or implementation architecture.

- `Survives`: likely remains valid across the emerging workflow/governance direction.
- `Transitional`: useful for current continuity, but likely to be reworked later.
- `Safe Maintenance Only`: safe to repair or stabilize without expanding product direction.
- `Blocked by Governance`: should not advance until governance boundaries are clearer.
- `Blocked by Workflow`: depends on workflow-state or workflow-shape decisions that are not stable yet.
- `Research Only`: may be explored or documented, but should not become implementation authority.
- `Pause`: do not extend this area beyond minimal safety or continuity needs right now.
- `Likely Obsolete`: at meaningful risk of later replacement or retirement, but not proven obsolete yet.
- `Requires Redesign Later`: may continue narrowly now, but should not be mistaken for final direction.
- `Superseded Candidate`: a candidate direction that may be displaced by the current governance model if later evidence confirms it.

## Survivability Ledger Table

| Work Category | Classification | Safe Now? | Primary Blocker | Redesign Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| Verification/testing systems | Survives | Yes | None beyond normal scope discipline | Low | Test, proof, and validation work remain safe if they do not overclaim product authority. |
| Documentation/audit/tracker work | Survives | Yes | None beyond documentation truth discipline | Low | Phase R2 needs more continuity artifacts, not fewer. |
| Implementation stabilization work | Safe Maintenance Only | Yes, narrowly | Avoid silent workflow-direction expansion | Medium | Stabilization may continue if it preserves current behavior without implying future workflow approval. |
| Patch/fix work | Safe Maintenance Only | Yes, narrowly | Must stay repair-scoped | Low | Crash fixes, defect repairs, and small regressions are safe if they do not redesign authority surfaces. |
| Current GUI stabilization work | Transitional | Yes, carefully | Workflow-state instability | High | Stabilization is allowed, but current GUI shape should not be mistaken for final workflow direction. |
| Pane/layout work | Transitional; Requires Redesign Later | Yes, carefully | Workflow authority unresolved | High | Pane work remains useful for continuity but is exposed to later workflow reshaping. |
| Docking/layout persistence | Transitional | Yes, carefully | Topology and shell-authority ambiguity | High | Layout persistence is real, but shell persistence must not silently become workflow canon. |
| Toolbar work | Blocked by Workflow | No, except narrow cleanup | Workflow-state ambiguity | High | Toolbar prominence depends on unresolved decisions about visible authority and focused drafting protection. |
| Command/search systems | Blocked by Governance | Read-only only | Command/search authority ambiguity | High | Search and command access are governance-sensitive; discovery/read-only support is safer than mutation authority. |
| Story Unit systems | Blocked by Governance; Research Only | Research only | Story Unit pressure and persistence ambiguity | High | Story Units are conceptually active, but canonical implementation authority is not approved. |
| Intelligence/analytics systems | Blocked by Governance | Advisory only | Intelligence authority ambiguity | High | Interpretation may survive; grading, prescriptive authority, or mutation-adjacent intelligence should not expand. |
| Topology/graph systems | Research Only | Research only | Topology authority ambiguity | High | Topology pressure is real, but productization or persistent structural entitlement is not approved. |
| Support/recovery systems | Transitional; Blocked by Governance | Yes, carefully | Recovery write-power ambiguity | Medium | Support and recovery survive as exception-path needs, but their visible authority and write powers remain sensitive. |
| Dev/test tooling | Survives | Yes | Must remain non-authoritative and non-user-facing | Low | Safe if fenced away from product authority and not relabeled as advanced-user product surfaces. |
| Export systems | Survives | Yes, carefully | UI and authority presentation still pending | Medium | Export capability survives, but surrounding UI placement and authority framing may change later. |
| Workflow/navigation systems | Blocked by Workflow | No, except narrow maintenance | Workflow-state set unresolved | High | Navigation direction depends on unresolved workflow-state governance and writing-surface protection. |
| Orchestration systems | Pause | No, except continuity-safe containment | Orchestration authority unresolved | High | Do not extend orchestration-space behavior into product authority during Phase R2. |
| Memory/context systems | Blocked by Governance | No, except bounded maintenance | Contextual vs persistent ambiguity | High | Memory/context work remains sensitive because broader context can silently become authority inflation. |
| Qualitative review tooling | Blocked by Workflow; Blocked by Governance | No, except narrow truth/label repairs | Mutation and judgment authority ambiguity | High | Review tooling remains especially sensitive where critique, judgment language, and apply flows meet. |
| Temporary bridge systems | Transitional | Yes, carefully | Removal trigger often underdefined | Medium | Bridges are allowed only if they preserve continuity and retain an explicit removal or replacement trigger. |

## Safe-To-Continue Lane

The following work may continue during Phase R2 without materially contaminating the future workflow model:

- tests
- audits
- trackers
- crash fixes
- dependency fixes
- diagnostics
- basic exports
- logs
- support reports
- safe layout reset/fallbacks
- documentation

## Continue-Carefully Lane

The following work may continue only if it stays narrow and does not promote current transitional behavior into future authority:

- current GUI stabilization
- pane/layout persistence
- toolbar cleanup
- support/recovery
- temporary bridges
- dev tool separation

## Pause / Research-Only Lane

The following work should not become implementation authority yet:

- final GUI workflow
- command mutation
- intelligence authority
- Story Unit canonical systems
- topology/graph productization
- orchestration
- memory mutation
- phase activation systems

## Dangerous Assumptions To Avoid

- current mockups are final
- current roadmap categories equal future product categories
- command/search is harmless
- intelligence can be governed later
- dev tools can be cosmetically hidden and considered solved
- topology is only visualization
- Story Units are already implementation anchors

## Open Questions For Orchestrator

- What final workflow-state set should replace temporary planning labels?
- Which GUI work is stabilization-only versus future workflow implementation?
- What exact signal closes Phase R2 and reopens implementation lanes?
- What labels should be used for obsolete or superseded roadmap entries?
- What support/recovery write powers are allowed, if any?

## Recommended Next Planning Pressure

Build from this ledger toward a Phase R2 closure snapshot.

Do not rewrite the roadmap yet.

Use this ledger to decide what work can continue without contaminating the future workflow model.

No blocked implementation lane should reopen until that later closure snapshot records agreement on safe lanes, blocked lanes, source-of-truth artifacts, explicit non-promotions, and implementation reopening conditions.
