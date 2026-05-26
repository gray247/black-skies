# Runtime Truth vs Transparency Truth - Pass 13

## Purpose

This document reconstructs the semantic differences between runtime truth, transparency truth, operational readiness, capability signaling, endorsement inference, and workflow legitimacy.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not GUI redesign approval, and not approval to let truthful signaling silently become workflow endorsement.

This pass distinguishes runtime truth from operational endorsement, transparency truth from workflow legitimacy, contextual truth from ambient truth, and truthful visibility from implied approval.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/semantic_escalation_authority_transition_pass10.md`
- `docs/audits/support_recovery_normalization_pressure_pass11.md`
- `docs/audits/runtime_truth_diagnostics_support_leakage_pass12.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/workspace_header_density_review.md`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/BudgetIndicator.tsx`
- `app/renderer/components/BudgetMeter.tsx`
- `app/renderer/App.tsx`

## Truth / Legitimacy Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Runtime Truth`: accurate signaling about current operational state, availability, or limitation.
- `Transparency Truth`: accurate signaling about budget, cost, model, provenance, or capability context that informs but does not authorize.
- `Operational Readiness`: the inferred belief that the system is ready for a workflow action now.
- `Capability Signaling`: the inferred belief that a feature or workflow is mature, safe, or broadly supported.
- `Endorsement Inference`: the mistaken reading that a truthful signal implies recommendation, permission, or approval.
- `Workflow Legitimacy`: the sense that a control, action, or flow is part of ordinary accepted workflow authority.
- `Contextual Truth`: truthful visibility that appears because current circumstances require it.
- `Ambient Truth`: truthful visibility that remains repeatedly present and therefore starts shaping baseline workflow expectations.
- `Degraded-State Truth`: truthful signaling that the system is limited, unavailable, or in a reduced/troubled state.
- `Retry Truth`: truthful signaling that retry is a meaningful current response to degraded state.

## Executive Findings

- Runtime truth and transparency truth are semantically different, but both can still distort workflow legitimacy when repeatedly visible near action controls.
- `Runtime truth` most directly shapes operational readiness inference: if services look online and stable, nearby actions start to feel approved.
- `Transparency truth` most directly shapes capability signaling and endorsement inference: if budget/model context looks healthy, actions can feel safer or more mature than they actually are.
- The key distortion is not falsity. It is semantic overread:
  - truth about state becomes belief about permission
  - truth about context becomes belief about endorsement
- Contextual truth is generally healthier than ambient truth because it preserves why the signal is visible.

## Runtime Truth Findings

- `ServiceStatusPill` communicates live operational state:
  - checking
  - online
  - offline
  - port unavailable
- `ServiceHealthBanner` communicates degraded-state truth and retry truth.
- These surfaces are strongest when read as:
  - “what is the system state right now?”
  - “what limitation or degradation exists?”
  - “is retry meaningful under current conditions?”

Pass 13 finding:
- runtime truth has high legitimacy-shaping power even when perfectly honest
- nearby placement can convert “available” into “ready to proceed”

## Transparency Truth Findings

- `BudgetIndicator` and `BudgetMeter` communicate:
  - budget status
  - spent/remaining totals
  - soft-limit and hard-limit relationship
  - message context around cost state
- In adjacent flows elsewhere, provenance/model/provider lines communicate route/context truth.

Transparency truth differs from runtime truth:

- runtime truth reports current operational state
- transparency truth reports surrounding context and constraints

Transparency truth should answer:
- what is this likely to cost?
- what model/capability context applies?
- what budget state surrounds this action?

Transparency truth should not silently answer:
- is this a good idea?
- is this workflow mature?
- should I proceed?

## Operational Readiness Findings

- Operational readiness is often inferred, not explicitly stated.
- Runtime truth contributes strongly to readiness inference:
  - `online` reads as “can run”
  - absence of degraded-state signals reads as “clear to proceed”
  - retry success would read as “workflow restored”

The problem:
- readiness inference can outrun the actual governance state
- a service being online does not prove the workflow is semantically settled, safe, or endorsed

Pass 13 conclusion:
- runtime truth is upstream of operational readiness inference
- the inference is real even when no explicit approval language exists

## Capability Signaling Findings

- Transparency truth contributes strongly to capability signaling.
- Budget/model/provenance visibility can imply:
  - the feature is mature enough to meter
  - the route/provider is trustworthy enough to disclose
  - the surrounding workflow is stable enough to quantify

This is especially risky in a transitional GUI because:
- measurement can feel like maturity
- disclosure can feel like certification
- visible accounting can feel like production-readiness

Pass 13 conclusion:
- capability signaling often emerges from well-intentioned transparency
- transparency is therefore not neutral in workflow-legitimacy terms

## Endorsement Inference Findings

- Endorsement inference is the core legitimacy drift:
  - truthful signal appears
  - user reads it as a recommendation or permission

Observed chains:

1. `service online -> action seems approved`
2. `budget healthy -> action seems safe/recommended`
3. `provider/provenance visible -> output seems more trustworthy or workflow feels more mature`
4. `retry available -> degraded state feels manageable enough to keep operating normally`

Pass 13 conclusion:
- truthful signaling can create endorsement inference without any dishonest wording

## Workflow Legitimacy Findings

- Workflow legitimacy is what users infer belongs to ordinary accepted product flow.
- Both runtime truth and transparency truth can reshape legitimacy:
  - runtime truth by implying operational readiness
  - transparency truth by implying capability maturity or acceptable cost

Legitimacy drift happens when:
- signals are repeatedly near primary actions
- degraded-state truth appears often enough to feel baseline
- support/status context becomes part of normal authoring rhythm
- transparency starts reading like action policy

## Contextual Truth vs Ambient Truth Findings

- `Contextual truth` is visible because something specific requires it:
  - services down
  - degraded state present
  - retry relevant now
  - budget warning for a specific action context
- `Ambient truth` is visible as a recurring background condition:
  - always-nearby status
  - always-nearby budget state
  - repeated persistent degraded-state reminders

Key finding:
- contextual truth preserves meaning better
- ambient truth increases legitimacy drift because repeated presence starts to feel like baseline workflow framing

## Highest Legitimacy-Drift Areas

- service status adjacent to primary action controls
- budget/model transparency adjacent to mutation-bearing actions
- repeated degraded-state or retry visibility
- truthful support surfaces that begin to feel like workflow endorsement
- provenance/model disclosure that gets misread as capability certification

## Maintenance-Only Safe Areas

- accurate service-state labeling
- accurate degraded-state messaging
- retry truth tied to real current state
- accurate budget/cost/model transparency
- explicit separation language between truth and action authority
- contextual visibility that appears only when needed

## Areas That Should Pause

- using runtime truth as implicit readiness endorsement
- using transparency truth as implicit workflow permission
- increasing ambient visibility of truth surfaces without stronger context boundaries
- placing truthful status/context signals ever closer to primary action authority
- allowing provenance/model disclosure to stand in for trust approval

## Underlying Contracts That Survive Better Than Truth Placement

- runtime truth reports condition, not approval
- transparency truth reports context, not permission
- degraded-state truth reports limitation, not workflow recommendation
- retry truth reports an available operational response, not ordinary progression
- budget/model context informs risk and cost, not legitimacy

Current Pass 13 conclusion:
The truth contracts survive. What drifts is the legitimacy users infer from them.

## Contradictions Found

- The system can be honest about readiness-related facts while still encouraging overread about workflow readiness.
- Transparency improves honesty, yet the same transparency can imply capability maturity or safety that has not been separately earned.
- Degraded-state truth is necessary, but repeated degraded-state truth can become part of ordinary workflow expectation.
- Retry truth is operationally useful, yet its repeated visibility can make degraded operation feel normal rather than exceptional.

## Areas Too Ambiguous To Stabilize Yet

- how much steady-state runtime truth can remain visible without becoming ambient legitimacy framing
- whether budget/model transparency belongs in ordinary workflow surfaces or more contextual disclosure points
- how much provenance/model disclosure is helpful before it starts to read like quality certification
- whether some ambient truth is unavoidable in a transitional GUI without also causing legitimacy drift

## Questions For Orchestrator

- Should Reconstruction Pass 14 focus next on `support truth -> diagnostics leakage` boundaries, or stay on `truth -> legitimacy drift` with a more surface-specific pass?
- Should future reconstruction treat `operational readiness inference` as its own semantic family distinct from runtime truth?
- Should `capability signaling` and `endorsement inference` remain paired in future passes, or be split because one concerns maturity and the other permission?

## Recommended Reconstruction Pass 14

Run a fourteenth reconstruction pass focused on support truth versus diagnostics leakage boundaries as a more concrete follow-on to the truth/legitimacy distinction.

Pass 14 should:

- preserve the runtime-truth versus transparency-truth distinction
- classify where support semantics end and diagnostics semantics begin
- keep contextual truth separate from ambient truth
- avoid redesigning surfaces while clarifying which truthful signals must not become legitimacy transfer channels

Pass 14 should not rewrite the roadmap, redesign the GUI, authorize topology architecture, or authorize Story Unit persistence.
