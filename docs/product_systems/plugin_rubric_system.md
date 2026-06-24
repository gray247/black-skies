# Plugin / Rubric System

## 1. Status Header

- Dossier name: `Plugin / Rubric System`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Signal Architecture`, `Companion`, `Model Routing And Budget Architecture`
- Feeds into: `Command Center Surface`, `Writing Surface`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define plugin or rubric support as a bounded, project-local extensibility layer for internal review rubrics and rule sets without allowing plugins to become hidden truth owners.

Future craft analyzers must either conform to the shared
`craft_analyzer_family_contract.md` behavior or enter through this
plugin/rubric review lane rather than appearing as ungoverned analyzer
variants.

The first safe slice stays internal-rubric only, uses deterministic
rules plus bounded local AI where allowed, and keeps every result
advisory until an owning system explicitly accepts a downstream
conversion.

This dossier inherits output vocabulary from `shared_output_vocabulary_contract.md`, handoff rules from `surface_to_owner_action_handoff_contract.md`, AI approval and lifecycle rules from `ai_lifecycle_and_approval_matrix.md`, protection rules from `protected_content_permission_matrix.md`, provenance posture from `provenance_state_model.md`, degraded behavior from `degraded_mode_execution_contract.md`, and truth or durable-state ownership limits from `truth_and_state_ownership_matrix.md`.

## 3. User Problem Solved

The writer may want customizable review lenses without hardcoding every rubric into the core product or confusing plugin output with accepted canon.

## 4. What The System Does

- host internal review rubrics first,
- run deterministic rules and bounded local-model-assisted analysis,
- surface advisory outputs and proposal candidates,
- preserve project-local enablement and configuration.

## 5. What The System Does Not Do

- override core authority rules,
- create truth silently,
- bypass routing, privacy, or spend governance,
- act as a free execution layer,
- provide API-assisted rubrics in the first safe slice,
- provide third-party executable plugins in the first safe slice,
- own Notes, Signals, accepted domain facts, or durable plugin-owned state.

## 6. User-Facing Behavior

Visible behavior should emphasize opt-in use, clear labels, and bounded output.

## 7. Hidden/Background Behavior

Background execution may exist later, but remains governed,
project-local, and non-authoritative.
External or third-party plugins remain future or deferred unless
explicitly promoted later.
Local-model execution, when used, stays bounded by current routing,
protection, provenance, and degraded-mode rules.

## 8. What Appears First

- selected rubric or plugin result,
- clear source or rubric label,
- relevant action choices.

## 9. What Is Summonable

- deeper result detail,
- rubric explanation,
- execution context,
- provenance and route trace,
- downstream proposal context.

## 10. What Is Hidden Until Needed

- implementation-heavy detail,
- dense execution history,
- low-value raw output.

## 11. Inputs

- approved project context,
- rubric definitions,
- project-local enablement and configuration,
- selected scopes,
- routing state when AI is involved,
- current revision or source scope.

## 12. Outputs

- rubric findings,
- plugin findings,
- signal candidates or support summaries,
- temporary view or workflow request,
- evidence-linked suggestion.
Plugin/rubric outputs remain advisory unless explicitly accepted through an owning system.

Reviewable proposal classes may include candidate Note, candidate
Signal, saved view, and workspace proposal. They remain proposals
until explicit author approval and the owning system's acceptance path
make them durable.

## 13. Which Other Systems Consume Those Outputs

- `Command Center Surface`
- `Writing Surface`
- `Signal Architecture`

## 14. What Gets Stored

- rubric definitions when approved,
- project-local enablement and configuration,
- retained findings,
- execution provenance where needed,
- bounded execution history.
Stored output remains support state only; it does not become truth or
durable state by itself, and it does not create plugin-owned durable
state.

## 15. What Remains Temporary

- transient runs,
- unsaved findings,
- temporary execution state.

## 15A. Lifecycle

Rubric output should use a bounded lifecycle such as:

- `requested`,
- `running`,
- `completed`,
- `degraded`,
- `failed`,
- `stale`,
- `dismissed`,
- `proposed for conversion`,
- `accepted by destination owner`,
- `superseded`.

Lifecycle state remains advisory context until the owning system
accepts a conversion. Rubric acceptance does not automatically close
related Notes, Signals, or other findings.

## 16. Relationship To Narrative Insertion / Assertion

Plugin or rubric output does not replace author-owned narrative truth.

## 17. Relationship To Story Units

Story Units may scope plugin runs optionally.

## 18. Relationship To Prose / Scene Projection

Projection may be consumed as context only.

## 19. Relationship To Writing Surface

The Writing Surface may show bounded current-text findings only.

## 20. Relationship To Command Center Surface

The Command Center is the likely home for heavier rubric review and
management.

## 21. GUI Placement Principles

Keep extensibility bounded and do not turn the UI into a plugin junk drawer.

## 22. Local LLM Role

Local models may power bounded, source-grounded, project-local rubric
analysis.

## 23. Paid API Role

Paid API rubric execution is deferred and out of scope for this
dossier.

## 24. Model Routing Notes And Cost / Budget Impact

Rubric execution must obey routing, approval, and spend governance.
No plugin or rubric may bypass routing, package, protection,
provenance, degraded-mode, or handoff contracts.
Local-model runs still obey current routing and degraded-mode rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Plugin context packages must respect masking and send boundaries.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Plugins must not bypass local-only or excluded-content protections.

## 27. Testing Requirements

Prove plugin output stays advisory, project-local, and bounded by core
rules.

## 28. Governance Rules And Risks

- no plugin-as-authority,
- no safety bypass,
- no hidden paid or outbound execution,
- no bypass of routing, package, protection, provenance, degraded-mode,
  or handoff contracts,
- no plugin-owned durable state,
- no third-party executable plugin in the first safe slice.

## 29. Failure Modes

If a plugin or rubric fails, core writing and review still work.
Failure results remain labeled as degraded or failed; stale results
must not be presented as current without warning.

## 30. v1 Boundary

Internal rubrics only, deterministic rules plus bounded local AI,
advisory output handling, and proposal-only downstream conversion.

## 31. v2 Boundary

Richer internal rubric definitions and management detail while staying
project-local, advisory, and non-owning.

## 32. Future-Only Boundary

Open-ended plugin ecosystems, installation mechanics, and third-party
execution.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, but critique and marketplace material was heavily filtered; only bounded rubric/extensibility questions safe for this dossier were retained
- stale placeholder questions removed or superseded: yes
- active question count after merge: 1
- remaining blocker summary: `0 Fatal`, `0 Critical`, `0 Major`, `1 Minor`

### Fatal Questions

- None currently.

### Critical Questions

- None currently.

### Major Questions

- None currently.

### Minor Questions

- Minor: what user-facing language best distinguishes plugin, rubric, pass, analysis lens, and extension without implying core authority?

### Answered / Superseded Questions

- AI is advisory unless accepted.
- Plugin or rubric output must remain advisory unless explicitly accepted through an owning system.
- Broad critique questions about harshness, pass catalogs, report style, and critique personality are not safe to merge here and belong to a future one-to-one `Critique` dossier.
- Early scope is internal rubrics only.
- Plugin/rubric output may produce advisory findings or candidates, not truth or durable state.
- Third-party execution, packaging, installation, signing, trust, and update rules are deferred.

### Deferred Questions

- Deferred: exact packaging, installation, signing, trust, and update rules for future third-party ecosystems.

## 34. Acceptance Criteria

This dossier is acceptable only if extensibility remains bounded by core doctrine.
