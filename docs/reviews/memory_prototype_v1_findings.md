Status: Historical review record
Version: 1.0.0
Last Reviewed: 2026-04-18

# Memory Prototype v1 — Historical Findings and Decision

Authority: historical findings record for the prototype lane. Not current runtime authority.

## 1. Purpose
This document records what Memory Prototype v1 proved, what it did not prove, residual caveats, and the recommendation for next-phase planning.

## 2. Prototype Scope Completed
- M1: seam/scaffold setup (`NarrativeStateProvider`, prototype module boundaries, eval scaffold)
- M2: canonical reader, lineage handling, advisory storage envelopes, no-mutation enforcement
- M3: scene delta extraction and continuity signal normalization (advisory-only)
- M4: task packet assembly (`draft`, `rewrite`, `critique`) with canonical precedence and advisory attachments
- M5: fixture-backed evaluation lane and decision reporting
- Revision Pass A: dead/alive contradiction detection quality fix
- Revision Pass B: legacy replay containment and evaluation classification tightening

## 3. What the Prototype Proved
- No canonical mutation was observed in prototype lanes/eval cases.
- Advisory-only boundaries held; prototype artifacts remained non-canonical.
- Lineage behavior was deterministic for same-lineage repeats and race-focused checks.
- Strict live accept lineage rules remained intact.
- Replay/eval fallback for legacy snapshots works under constrained, fail-closed conditions.
- Packet assembly is viable from accepted-lineage canonical inputs plus advisory outputs.
- High-value dead/alive mismatch now emits structured advisory conflict signals.

Authority: historical findings record for the prototype lane. Not current runtime authority.

## 4. What the Prototype Did Not Prove
- This is not a public/runtime feature.
- This is not exposed to UI surfaces.
- This is not a production memory system.
- The M5 eval runner does not prove full truth-lane regression internally.
- Snapshot architecture was not redesigned.
- Prototype artifacts are not promoted into canonical narrative state.

## 5. Weaknesses / Residual Caveats
- Legacy replay remains a bounded special path, not first-class lineage.
- Full truth-lane regression still runs outside the M5 eval runner.
- Legacy replay depends on snapshot metadata quality (`label`, `includes`, outline/front-matter evidence) and fails closed when evidence is incomplete.

## 6. Recommendation
**Continue toward next phase.**

Reasoning:
- Canonical safety boundaries held.
- Advisory-only containment held.
- Deterministic lineage behavior held.
- Legacy replay risk was reduced and is now contained as replay/eval-only behavior.

This is a recommendation to plan the next phase, not automatic production rollout.

## 7. Suggested Next Step
Create a separate next-phase (V2) planning effort with explicit scope, success criteria, and validation lanes. Do not silently expand v1 behavior in place.
