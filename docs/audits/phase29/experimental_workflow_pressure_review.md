# Phase 29 Pass 4 Experimental Workflow Pressure Review

Status: Draft experimental workflow review
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 4 - Boundary and Authority Separation Audit

## Purpose

This review prevents experimental systems from silently becoming workflow or roadmap authority.
It does not decide final GUI layout or Phase 30 workflow policy.

## Experimental Pressure Rows

### Split Command shell

- related_ids: `P29-SURF-015`; `P29-INTEL-007`; `P29-WFLOW-012`; `P29-BOUND-010`
- pressure_type: experimental terminology pressure
- current_pressure: high
- authority_risk: high
- evidence: `app/renderer/components/workspace/SplitCommandWorkspace.tsx:515`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:674`; `docs/specs/design_system_v1.md:53`
- notes: The runtime shell explicitly disclaims AI certainty and marks itself experimental, but terms like `Command Center`, `Writing Studio`, and `Intelligence Readiness` still exert product-direction pressure beyond current stable runtime.

### Docking and pane flexibility

- related_ids: `P29-WFLOW-006`; `P29-BOUND-012`
- pressure_type: shell machinery pressure
- current_pressure: medium
- authority_risk: medium
- evidence: `app/shared/ipc/layout.ts:16`; `docs/specs/pane_lifecycle.md:22`; `docs/specs/layout_persistence.md:1`
- notes: Flexible docking is real runtime behavior, but too much visible emphasis can make shell control read as product identity rather than support infrastructure.

### Command registry zone metadata

- related_ids: `P29-CTRL-017`; `P29-INTEL-009`; `P29-BOUND-011`
- pressure_type: orchestration maturity pressure
- current_pressure: medium
- authority_risk: high
- evidence: `app/renderer/commands/commandRegistry.ts:11`; `app/renderer/commands/commandRegistry.ts:27`; `app/renderer/commands/commandRegistry.ts:79`
- notes: Internal metadata like `preferredZone`, `allowedZones`, and `modelRoute` are useful, but visible exposure would imply a more mature orchestration system than current runtime evidence supports.

### Design-system and GUI future-state language

- related_ids: `P29-SURF-015`; `P29-INTEL-001`; `P29-INTEL-007`
- pressure_type: documentation overhang
- current_pressure: high
- authority_risk: high
- evidence: `docs/specs/design_system_v1.md:53`; `docs/gui/gui_layouts.md:33`; `docs/audits/phase28/runtime_truth_alignment_notes.md`
- notes: Several docs still carry future-state shell and analytics language that can over-inflate current experimental or partial surfaces if read without runtime-truth discipline.

## Carry-Forward Findings

- Split Command remains an architectural probe, not stable workflow authority.
- Docking flexibility is a legitimate shell capability, but it should not become default evidence that complex pane choreography is the product spine.
- Command registry metadata is internal orchestration evidence, not user-facing product maturity evidence.
- Experimental terminology remains one of the easiest ways for roadmap authority to drift away from runtime truth.
