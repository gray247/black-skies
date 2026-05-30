# Pass 91 - Operational Baseline Intake Plan

## 1. Scope Declaration

Pass 91 is a docs-only planning artifact.

This pass does not perform the baseline audit.

This pass does not authorize implementation, repair, redesign, recovery work, export work, Story Unit architecture, workflow-state canon, source-of-truth implementation, diagnostics tooling, retrieval/persistence implementation, or dependency upgrades.

This pass defines how a later baseline audit will discover the current Black Skies product baseline without mixing discovery and repair.

Firewall:

- Audit discovers.
- Recovery repairs.
- Do not mix them.

## 2. Product Baseline Questions

The later baseline audit must answer:

1. what launches
2. what builds
3. what tests pass
4. what workflows exist
5. what workflows are broken
6. what features are real
7. what features are only planned
8. what features are fake-complete
9. what old roadmap items are obsolete
10. what should be kept, rebuilt, deferred, or killed

Question discipline:

- answers must be evidence-backed
- roadmap presence does not count as implementation proof
- green tests do not count as product-readiness proof
- specs do not count as shipping features by themselves

## 3. Repo / Build / Test Inventory Plan

The Pass 92 baseline audit should inventory these classes first:

- repo entry points:
  - `README.md`
  - root `package.json`
  - `app/package.json`
  - root `pyproject.toml`
  - `pytest.ini`
  - `services/pyproject.toml`
- current-state and truth docs:
  - `docs/specs/current_state.md`
  - `docs/specs/capability_truth_matrix.md`
  - `docs/specs/README.md`
- high-signal specs:
  - `docs/specs/architecture.md`
  - `docs/specs/endpoints.md`
  - `docs/specs/editorial_workflow_contract.md`
  - `docs/specs/memory_runtime.md`
  - `docs/specs/model_runtime.md`

Inventory objectives:

- list claimed launch paths
- list claimed build commands
- list claimed test lanes
- list claimed runtime authorities
- list claimed workflow surfaces
- list claimed deferred or off-by-default systems

Validation-scope language for future inventory commands:

### File listing / grep commands

- can prove:
  - that files, commands, strings, and references exist in repo text
- cannot prove:
  - that the feature works
  - that the doc is current
  - that the command succeeds
- forbidden claim:
  - “documented means implemented”

### Package/config inspection

- can prove:
  - that scripts, dependencies, config entries, and markers are declared
- cannot prove:
  - that they are healthy
  - that they reflect current product reality
- forbidden claim:
  - “declared script/config means valid workflow”

## 4. Runtime / Launch Verification Plan

The Pass 92 baseline audit should test launch/build/runtime in bounded stages:

1. declare candidate launch commands from repo text only
2. classify each as:
   - documented
   - not yet executed
   - executed
   - failed
3. record exact observed result for each command
4. stop at discovery when a launch path breaks; do not repair

Candidate command classes likely in scope:

- root dev entry:
  - `pnpm dev`
  - `powershell.exe -ExecutionPolicy Bypass -File .\\start-codex.ps1 -SmokeTest`
- app build entry:
  - `pnpm --filter app build`
  - `pnpm --filter app build:main`
  - `pnpm --filter app build:production`
- backend/runtime entry:
  - `uvicorn blackskies.services.app:create_app --factory --reload`

Validation-scope language for future runtime/launch commands:

### Build commands

- can prove:
  - whether the build command currently succeeds or fails in the observed environment
  - what artifacts are emitted in that run
- cannot prove:
  - full product readiness
  - workflow correctness
  - long-session stability
- forbidden claim:
  - “build passes means product is healthy”

### Launch/runtime commands

- can prove:
  - whether the process starts
  - whether obvious immediate failures occur
  - whether basic health endpoints respond
- cannot prove:
  - workflow completeness
  - GUI usability
  - trustworthiness of every visible feature
- forbidden claim:
  - “launches means feature-complete”

## 5. Feature Surface Inventory Plan

The Pass 92 audit should inventory feature surfaces by evidence class:

- documented only
- implemented but off by default
- experimental
- deferred
- baseline runtime
- test-lane proven only
- fake-complete suspect

Recommended source order:

1. code/config entry points
2. runtime truth / current-state docs
3. capability truth matrix
4. specs
5. README / roadmap only as lower-authority context

Feature-surface questions to answer:

- is there a user-facing surface
- is there a runtime seam only
- is it default-on, default-off, gated, or deferred
- what evidence class supports it
- what claims are unsafe to make

## 6. Broken Workflow Inventory Plan

The Pass 92 audit should inventory broken workflows without fixing them.

Workflow inventory buckets:

- launches and immediately fails
- builds but does not launch
- launches but critical workflow is missing
- workflow documented but no live route/path exists
- workflow exists only in test/support paths
- workflow appears real but persistence/provenance truth is partial

Evidence sources:

- app/package scripts
- root/package scripts
- service entry points
- capability truth matrix
- endpoints spec
- direct observed execution results

Validation-scope language for future workflow checks:

### Test commands

- can prove:
  - which test lanes currently pass or fail
  - what those lanes explicitly assert
- cannot prove:
  - product readiness beyond lane scope
  - workflow truth outside asserted lanes
- forbidden claim:
  - “green tests mean the workflow is real”

### Manual smoke / observed workflow checks

- can prove:
  - what was observed in a bounded run
  - whether a workflow is obviously broken
- cannot prove:
  - that untested paths work
  - that long-running or edge-case behavior is safe
- forbidden claim:
  - “one successful smoke means durable readiness”

## 7. Fake-Complete Detection Plan

The Pass 92 audit should explicitly search for fake-complete signals:

- feature documented as active but default-off in config
- feature present in specs but absent from live runtime baseline
- test coverage limited to harness/smoke while feature is described as authoritative
- runtime seam exists but product workflow is not surfaced
- roadmap item appears “complete” but current-state docs classify it as deferred, experimental, or off-by-default
- README or roadmap claim outranks current-state or code reality

Detection method:

- compare runtime truth docs, package scripts, config flags, and capability truth matrix against roadmap/spec language
- classify mismatches as:
  - stale documentation
  - deferred seam
  - experimental path
  - implementation gap
  - fake-complete suspect

## 8. Deferred / Abandoned Work Detection Plan

The Pass 92 audit should distinguish:

- still-relevant deferred work
- abandoned or obsolete roadmap items
- superseded architecture ideas
- planned-but-never-shipped seams

Detection signals:

- deferred doc exists with no active runtime seam
- spec references old phase/build plan context no longer aligned with current runtime authority
- command/script references point to lanes no longer part of the baseline
- runtime truth/current_state marks a feature deferred or off-by-default while older docs describe it as active

Important rule:

- obsolete does not mean delete
- the audit should classify, not clean up

## 9. Risk Controls

The Pass 92 audit must preserve these controls:

- do not repair while discovering
- do not widen into architecture redesign
- do not reopen blocked domains
- do not treat specs, roadmap, or tests as stronger authority than code/runtime evidence
- do not treat runtime truth docs as perfect without checking the actual code/config surfaces they cite
- do not treat access-denied or temp-dir noise as product failure without classification

Known repo-state risk to account for:

- repo scans can hit permission-denied temp directories under `services/testtmp-*`; the audit should classify these as environment/noise unless they block a baseline command directly

## 10. Stop Conditions

The Pass 92 baseline audit must stop or split scope if:

- discovery begins requiring repairs to continue
- blocked-domain evaluation starts slipping into redesign proposals
- the audit starts recommending implementation changes instead of classifying reality
- command failures require environment surgery rather than bounded observation
- feature-surface classification starts depending on roadmap promises instead of observed evidence
- one pass can no longer keep launch/build/test/workflow evidence legible

## 11. Proposed Output Artifact for Pass 92

Proposed Pass 92 artifact:

- `docs/audits/phase14/pass92_operational_baseline_audit.md`

Recommended structure for Pass 92:

1. Scope Declaration
2. Commands Run
3. Repo / Build / Test Inventory
4. Launch / Runtime Results
5. Feature Surface Reality Matrix
6. Broken Workflow Inventory
7. Fake-Complete Findings
8. Deferred / Abandoned / Obsolete Findings
9. Keep / Rebuild / Defer / Kill Intake Table
10. Stop Conditions Encountered
11. Recommended Next Recovery Intake Slice
12. Final Verdict

## 12. Final Verdict

Verdict: `READY FOR BASELINE AUDIT`

This means only that the audit method is bounded enough to begin Pass 92 safely.

It does not imply product readiness, implementation approval, or recovery authorization.

## 13. Register / Tracker Impact

Pass 91 references existing control structures without creating new stable IDs.

Referenced existing registers:

- Contradiction Register: `C-002`, `C-017`
- Blocked-Promotion Register: `BP-014`, `BP-016`, `BP-017`
- Dependency-Gate Register: `DG-008`, `DG-009`, `DG-010`
- Governance-Domain Register: `GD-006`, `GD-011`
- Pressure-Field Register: `PF-001`, `PF-003`, `PF-010`
- Implementation-Eligibility Register: `IE-002`, `IE-003`, `IE-004`
- Authority-Family Register: `AF-011`, `AF-017`
- Safe-Maintenance Lane Register: `SM-001`

Register impact:

- No new contradiction, blocked-promotion, dependency-gate, governance-domain, pressure-field, reconstruction-state, implementation-eligibility, vocabulary-containment, authority-family, or safe-maintenance IDs are required in Pass 91.
- `VC-###` entries remain unitemized.
- `RS-###` entries remain unitemized.
- Pass 43 reserved-ID clarification is preserved.
