# Pass 76 - Artifact Locator Implementation Plan

## 1. Scope Declaration

Pass 76 is planning/docs-only.

This pass does not authorize coding.

This pass does not build tooling.

This pass defines a narrow implementation plan for the governance artifact locator only.

Blocked domains remain blocked unless separately reauthorized.

## 2. Planned Capability

The planned capability is a support-only repository utility that can:

- locate governance artifact files
- report artifact paths
- report file existence
- report basic filesystem metadata if available

The planned capability must remain:

- governance-artifact-only
- descriptive only
- non-authorizing
- non-editing
- outside GUI, product, and runtime surfaces

## 2A. Governed Artifact Allowlist

The future implementation must use an explicit allowlist.

Allowed root families:

- `docs/audits/phase13/`
- `docs/audits/`
- `docs/`

Allowed file classes:

- governance pass artifacts under `docs/audits/phase13/`
- governance/control artifacts explicitly named by later review
- `docs/BLACK_SKIES_FIX_TRACKER.md`

Disallowed roots unless separately approved:

- `app/`
- `services/src/`
- `services/tests/` as locator targets
- `tools/`
- `sample_project/`
- `archive/`
- any generated-output directory

Allowlist rule:

- later coding may narrow this allowlist
- later coding may not widen this allowlist without separate human/orchestrator review

## 3. Proposed File/Module Location

Planned future implementation files:

- `scripts/governance_artifact_locator.py`
- `services/tests/test_governance_artifact_locator.py`

Planned future module shape:

- `scripts.governance_artifact_locator.ArtifactLocator`
- `scripts.governance_artifact_locator.ArtifactRecord`
- `scripts.governance_artifact_locator.main`

Expected reuse:

- reuse `pathlib.Path` for repository traversal
- reuse `scripts/__init__.py` package path rather than introducing a new package root
- reuse existing repo path-normalization conventions; if needed, prefer `services/src/blackskies/services/utils/paths.py:to_posix` semantics rather than inventing a second path-format rule

Rationale for location:

- `scripts/` already holds support-only repository and governance-adjacent utilities
- a script entrypoint stays outside product and runtime surfaces
- a focused pytest file under `services/tests/` gives existing Python test infrastructure a stable place to verify scope boundaries

## 3A. Seam Clarification

The future seam is intentionally split:

- implementation stays in `scripts/` because the capability is repository-support tooling rather than product/runtime behavior
- tests stay in `services/tests/` only as a harness location inside the existing Python test lane

Seam rules:

- the test file may import the script module for verification only
- the script may not register itself as a service tool, router, runtime command, or product capability
- no wrapper, plugin, preload, IPC, CLI registration, or packaging seam may be added outside the two named files without separate approval

## 4. Exact Exclusions

The implementation plan explicitly excludes:

- authority ranking
- source-of-truth selection
- approval/readiness summaries
- repo editing
- GUI, product, or runtime surfaces
- diagnostics behavior
- recovery behavior
- retrieval behavior
- export/output behavior
- roadmap advancement
- maintenance execution support
- lifecycle enforcement
- permission mapping

## 4A. Banned Output Vocabulary List

The future implementation must not emit the following vocabulary as output fields, summary labels, derived status names, or convenience classifications:

- `approved`
- `recommended`
- `ready`
- `canonical`
- `current source of truth`
- `source of truth`
- `authoritative`
- `official`
- `blessed`

Additional banned drift:

- output field names or CLI headings may not imply approval continuity, truth superiority, or readiness completion by synonyms of the above terms

The planned utility may not:

- write repository files
- classify artifacts as approved, canonical, current source of truth, or equivalent
- widen into search, recovery, export, diagnostics, or runtime behavior

## 5. Implementation Steps

Planned future implementation steps:

1. Create `scripts/governance_artifact_locator.py` with a narrow CLI entrypoint.
2. Define `ArtifactRecord` as a minimal record containing:
   - `path`
   - `exists`
   - allowed metadata fields only
3. Define `ArtifactLocator` with:
   - bounded root configuration for governance artifacts
   - explicit inclusion filters using the governed-artifact allowlist only
   - explicit exclusion filters for source, GUI, runtime, and blocked-domain surfaces
4. Implement path discovery and existence checks only.
5. Implement basic metadata reporting only if available from filesystem state.
6. Keep output descriptive:
   - no ranking
   - no recommendation
   - no readiness or approval language
7. Add `services/tests/test_governance_artifact_locator.py` covering:
   - path reporting
   - existence reporting
   - basic metadata reporting
   - exclusion of non-governance surfaces
   - rejection of authority-bearing fields or summaries
   - rejection of banned vocabulary
   - rejection of out-of-allowlist roots
   - stable no-match behavior

## 6. Validation Plan

Planned future validation commands:

- `python -m pytest services/tests/test_governance_artifact_locator.py`
- `python scripts/governance_artifact_locator.py --help`
- `python scripts/governance_artifact_locator.py --root docs/audits/phase13 --format json`
- `python scripts/governance_artifact_locator.py --root app --format json`
- `python scripts/governance_artifact_locator.py --root docs/does-not-exist --format json`

Planned validation expectations:

- only governance artifact paths are returned
- returned records contain only path, existence, and allowed basic metadata
- no authority ranking or source-of-truth output appears
- no approval/readiness summary appears
- no file modification occurs
- blocked domains remain untouched

Negative-path validation requirements:

- excluded-root rejection:
  - a root such as `app/` must be rejected or refused as out of allowlist
- banned-field rejection:
  - tests must fail if output includes banned vocabulary fields or labels
- no-match behavior:
  - empty results must remain descriptive and may not imply approval, readiness, or truth absence as judgment

Validation evidence to require in the later coding pass:

- files inspected
- files changed
- explicit exclusions not touched
- affected authority surfaces reviewed
- blocked areas not touched
- discovered but not fixed items

## 7. Rollback Plan

If the later implementation pass exceeds scope:

- remove `scripts/governance_artifact_locator.py`
- remove `services/tests/test_governance_artifact_locator.py`
- discard any output format or field that implies authority, readiness, or source-of-truth status
- remove any unapproved wrapper, registration, or packaging seam added around the two named files

Rollback trigger conditions:

- output becomes judgment-bearing
- implementation touches non-governance surfaces
- metadata expansion implies lifecycle or truth authority
- file-set expansion cannot be justified within the authorized planning scope
- wrapper seam appears
- registration seam appears
- packaging seam appears

## 8. Stop Conditions

The later coding pass must stop or escalate if:

- exact implementation files differ from this plan without separate approval
- source or GUI files enter scope
- any blocked domain enters scope
- output starts implying approval, readiness, or source-of-truth selection
- metadata handling expands beyond basic filesystem metadata
- contradiction or dependency-gate review reveals scope-breaking conflict
- the script drifts toward repo editing or maintenance execution support
- the governed-artifact allowlist widens
- banned vocabulary appears in output or field names
- the script/test seam expands beyond the two named files

## 9. Risks

Primary risks:

- governance artifact canonization by visibility
- stale-control reuse
- hidden approval signaling
- metadata prominence being mistaken for authority

Secondary risks:

- script scope widening into generic search behavior
- test coverage proving mechanics while missing authority drift
- later summaries overstating the script as governance truth rather than locator utility
- allowlist handling drifting into convenience expansion
- seam expansion turning repository support into runtime-adjacent behavior

## 10. Required Human/Orchestrator Approval Before Coding

Before coding begins, human/orchestrator review must approve:

- the exact future implementation file set named in this plan
- the exact allowed metadata fields
- the validation commands and acceptance expectations
- the rollback triggers
- the preservation of all exclusions listed above

This plan is not coding authorization.

## 11. Register / Tracker Impact

Pass 76 references existing control structures without creating new stable IDs.

Referenced existing registers:

- Contradiction Register: `C-002`, `C-017`
- Blocked-Promotion Register: `BP-014`, `BP-016`, `BP-017`
- Dependency-Gate Register: `DG-008`, `DG-009`, `DG-010`
- Governance-Domain Register: `GD-006`, `GD-011`
- Pressure-Field Register: `PF-001`, `PF-003`, `PF-010`
- Implementation-Eligibility Register: `IE-002`, `IE-003`, `IE-004`, `IE-005`
- Authority-Family Register: `AF-011`, `AF-017`
- Safe-Maintenance Lane Register: `SM-001`

Register impact:

- No new contradiction, blocked-promotion, dependency-gate, governance-domain, pressure-field, reconstruction-state, implementation-eligibility, vocabulary-containment, authority-family, or safe-maintenance IDs are required in Pass 76.
- `VC-###` entries remain unitemized.
- `RS-###` entries remain unitemized.
- Pass 43 reserved-ID clarification is preserved.

## 12. Blocked Areas Not Touched

Pass 76 does not touch or reopen:

- GUI redesign
- command/search implementation
- workflow-state canon
- topology architecture
- Story Unit persistence
- retrieval authority
- recovery authority
- structural mutation authority
- diagnostics-as-workflow tooling
- advisory-to-apply behavior
- implementation work of any kind

## 13. Governance Outcome

Pass 76 defines a narrow implementation plan for the governance artifact locator and identifies an exact future script/test seam, validation commands, rollback plan, and stop conditions for later review.

No coding is authorized by this pass.
