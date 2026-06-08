# Product System Dossier Template

## 1. Status Header

- Dossier name:
- Status:
- Class: `Product` / `Intelligence` / `System`
- Owner / review lane:
- Last reviewed:
- Depends on:
- Feeds into:
- Runtime authority: `yes` / `no` / `future`
- Authority level: `authored truth` / `advisory` / `derived` / `operational` / `future`
- User-facing: `yes` / `no` / `partial`
- Hidden/background: `yes` / `no` / `partial`

Template rules:

- Dossiers are living investigation files. They may end as `build`, `merge`, `shrink`, `split`, `defer`, `reject`, or `unknown`.
- Raw open-question banks are archive or intake sources only. Questions should migrate into the relevant dossier before they guide design or implementation.
- Each dossier must contain one centralized `Pre-Rough Alignment Questionnaire`. Do not scatter questions throughout the dossier.
- Questions migrated from raw banks should be placed into one of the six questionnaire categories, not left as a generic open-question list.
- Answered questions should be marked `answered` or `superseded`, not recopied forever as live uncertainty.

## 2. Purpose

Describe why this dossier exists and what planning problem it resolves.

## 3. User Problem Solved

Describe the writer or operator problem this system solves.

## 4. What The System Does

Describe the positive scope of the system.

## 5. What The System Does Not Do

Describe explicit non-goals and boundary exclusions.

## 6. User-Facing Behavior

Describe visible or intentionally summoned behavior.

## 7. Hidden/Background Behavior

Describe background behavior that supports the system without becoming hidden authority by accident.

## 8. What Appears First

Describe what the user sees or receives first.

## 9. What Is Summonable

Describe behavior that appears on demand.

## 10. What Is Hidden Until Needed

Describe what should stay latent until a specific trigger or context exists.

## 11. Inputs

List the system inputs and their authority boundaries.

## 12. Outputs

List the system outputs and their confidence or authority boundaries.

## 13. Which Other Systems Consume Those Outputs

Describe downstream consumers and how output flows across boundaries.

## 14. What Gets Stored

Describe persistent data, if any.

## 15. What Remains Temporary

Describe temporary state, transient artifacts, derived views, and non-durable intermediates.

## 16. Relationship To Narrative Insertion / Assertion

State how this system depends on or affects the smallest narrative foundation.

Mandatory check:
- do not allow projection containers, summaries, or compatibility structures to replace `Narrative Insertion / Narrative Assertion` as foundation authority

## 17. Relationship To Story Units

State whether Story Units are used, derived, optional, or absent.

Mandatory check:
- do not make Story Units a mandatory entry gate unless a future approved dossier explicitly authorizes that change

## 18. Relationship To Prose / Scene Projection

State whether this system consumes or emits projection layers.

Mandatory check:
- keep prose and scene in projection or compatibility roles unless a separately approved architecture change says otherwise

## 19. Relationship To Writing Surface

State how the system supports, appears within, or stays out of the sovereign Writing Surface.

Mandatory check:
- direct writing must remain valid unless a separate accepted dossier explicitly narrows that rule

## 20. Relationship To Command Center Surface

State how the system appears within, feeds, or stays outside the Command Center Surface.

Mandatory check:
- the Command Center may support writing, but it must not gate writing by default

## 21. GUI Placement Principles

Describe placement, visibility, and clutter boundaries.

Mandatory check:
- do not turn the Command Center or startup flow into a dashboard junk drawer

## 22. Local LLM Role

Describe any local-model responsibility.

## 23. Paid API Role

Describe any paid-model responsibility.

## 24. Model Routing Notes And Cost / Budget Impact

Describe routing, privacy, cost, fallback, control notes, and budget impact when models are involved.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Describe masking, redaction, approval, and safe package handling if relevant.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Describe privacy, safety, filtering, and censor boundaries.

## 27. Testing Requirements

List the minimum proof set for the system.

## 28. Governance Rules And Risks

List hard governance rules first, then describe governance and authority risks, including any danger of:

- inferred or Companion output being treated as authored truth,
- false confidence being displayed as certainty,
- unauthorized grading or story verdict behavior,
- hidden runtime authority claims,
- UI sprawl outrunning product definition.

## 29. Failure Modes

Describe expected failures, degraded states, and containment rules.

## 30. v1 Boundary

Describe the minimal approved first version.

## 31. v2 Boundary

Describe the next bounded extension after v1.

## 32. Future-Only Boundary

Describe items that are explicitly out of scope for near-term implementation.

## 33. Pre-Rough Alignment Questionnaire

Use the following structure:

### Fatal Questions

Questions that can block architecture or code because the wrong answer can create deep entanglement, authority drift, data model rot, or irreversible product-direction damage.
These may require a separate thread or dedicated decision pass.

Do not mark the dossier build-ready while any Fatal Question remains open.

### Critical Questions

Questions that must be answered before this system is implemented, wired into runtime, connected to AI, or treated as build-ready.

### Major Questions

Important product or architecture questions that affect design, but can remain open during rough dossier exploration.

### Minor Questions

UI wording, presentation, tuning, naming, or polish questions that should not block rough dossier work.

### Answered / Superseded Questions

Questions already answered by current doctrine and should not keep resurfacing as live uncertainty.

### Deferred Questions

Real questions that are intentionally not needed for this stage.

## 34. Acceptance Criteria

This dossier is acceptable only if it states explicitly that:

- projection containers do not replace narrative foundation authority,
- Story Units are not treated as a mandatory gate by default,
- inferred, derived, or Companion output does not become authored truth without author action,
- the system does not present fake certainty,
- the system does not introduce story grading unless a future explicitly approved tool authorizes it,
- the system does not create dashboard clutter as default behavior,
- the system does not claim hidden runtime authority that the implementation does not actually own,
- active questions live in the dossier instead of only in a giant standalone register,
- active questions live only in the centralized `Pre-Rough Alignment Questionnaire`,
- Fatal and Critical questions are not buried inside a generic open-question list,
- the dossier remains a living investigation file rather than a locked milestone claim.
