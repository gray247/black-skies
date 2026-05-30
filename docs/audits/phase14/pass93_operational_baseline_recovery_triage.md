# Pass 93 - Operational Baseline Recovery Triage

## 1. Scope Declaration

Pass 93 is a triage-only follow-on to Pass 92.

This pass does not repair Black Skies.

This pass does not authorize implementation, roadmap reconstruction, GUI redesign, critique rebuild, source-of-truth work, diagnostics tooling expansion, dependency upgrades, or blocked-domain reentry.

Firewall preserved:

- audit discovered
- triage prioritizes
- recovery repairs later

Primary question:

- given the Pass 92 baseline evidence, what is the safest, highest-signal recovery sequence for later planning passes

## 2. Evidence Base

Primary evidence sources:

- `docs/audits/phase14/pass91_operational_baseline_intake_plan.md`
- `docs/audits/phase14/pass92_operational_baseline_audit.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/specs/current_state.md`
- `docs/specs/capability_truth_matrix.md`
- `docs/reviews/validation_failures_and_blockers.md`
- `README.md`
- `package.json`
- `app/package.json`
- `pyproject.toml`
- `pytest.ini`
- `services/pyproject.toml`

Key Pass 92 evidence being triaged:

- renderer build passed
- main-process build passed
- bounded backend startup passed
- truth lane passed
- renderer unit lane failed
- broad backend suite failed
- environment drift observed: Node `22.19.0`, Python `3.13.7`, docs expect Node 20+ and Python 3.11
- GUI usability was not human-observed
- packaging/release path was not checked
- multiple visible surfaces were classified as fake-complete risk, deferred, or deeper-audit candidates

## 3. Baseline Findings Summary

Pass 92 left Black Skies in a mixed but legible state:

- there is a real bounded operational core
  - backend starts
  - ordinary app bundles build
  - real-service truth lane passes
  - project open/load, critique, rewrite, recovery-route, and export-route evidence exists

- there is also clear validation instability
  - renderer critique/rewrite sync lane is not green
  - broad backend suite is not green
  - truth lanes are greener than the surrounding matrix

- there is meaningful uncertainty in user-facing reality
  - GUI usability has not been human-smoked in this pass chain
  - packaging/release build path remains unobserved
  - project switching, offline/diagnostics UX, and binder/story-unit legitimacy remain unproven

- there are several fake-complete pressure zones
  - diagnostics/support maturity
  - workspace topology legitimacy
  - analytics authority
  - Split Command code weight versus baseline status
  - README claim breadth versus direct proof

- there are explicit defer/kill surfaces already supported by current runtime docs
  - Memory Lab baseline promotion
  - Split Command promotion
  - companion expansion
  - backup verifier daemon UX
  - phase4 mock routes as ordinary product surface
  - plugin execution as near-term baseline assumption

## 4. Recovery Lane Candidates

| Lane Candidate | Classification | Why |
| --- | --- | --- |
| Renderer critique/rewrite sync ownership map | `READY FOR REPAIR PLANNING` | failure is concrete, bounded, user-facing, and already narrowed to the renderer/editorial workflow seam |
| Broad backend validation failure classification | `READY FOR REPAIR PLANNING` | broad suite is not green, but failures are already enumerated and can be separated into baseline, prototype, docs-parity, and provider-fallback classes |
| Environment normalization plan | `NEEDS ENVIRONMENT NORMALIZATION FIRST` | observed Python 3.13 drift weakens claims about backend/test reproducibility, even though key lanes ran |
| Human GUI smoke checklist refresh | `NEEDS HUMAN SMOKE FIRST` | app starts, but usability, normal workflow behavior, and topology legitimacy remain unproven without human observation |
| Packaging/release audit plan | `INVESTIGATE FIRST` | package commands exist but were not run; no evidence yet that release artifacts are a current top-risk lane |
| Truth-lane versus broad-matrix trust split classification | `READY FOR REPAIR PLANNING` | strong validation-risk issue with direct evidence and clear planning value |
| Fake-complete risk containment around diagnostics/workspace/analytics/README | `NEEDS OWNERSHIP MAP FIRST` | real risk exists, but the corrective lane needs clear authority/owner mapping before any recovery action |
| Split Command baseline status containment | `DEFER` | current docs/runtime already classify it as non-baseline and promotion is not authorized |
| Memory Lab baseline promotion containment | `DEFER` | current runtime canon already marks it optional/experimental |
| Companion expansion | `DEFER` | value and legitimacy remain unproven; not a first recovery lane |
| Backup verifier daemon UX promotion | `DEFER` | subsystem is implemented-but-off and not baseline-critical for first recovery sequencing |
| Phase4 mock routes as ordinary product surface | `KILL CANDIDATE` | runtime config and current-state docs already fence this as legacy harness/dev seam |
| Plugin execution as near-term baseline assumption | `KILL CANDIDATE` | gated off, unobserved as product workflow, and non-baseline by current canon |
| Project switching audit | `INVESTIGATE FIRST` | high workflow importance, but not yet directly observed |
| Offline/diagnostics UX audit | `INVESTIGATE FIRST` | fake-complete and support-trust risk remain high, but direct operator UX evidence is missing |
| Binder/story-unit baseline legitimacy audit | `INVESTIGATE FIRST` | structural pressure exists, but baseline legitimacy is unclear and blocked-domain drift risk is high |
| Dual sample-project alias scaffolding audit | `INVESTIGATE FIRST` | real validation/trust confusion risk, but not yet shown as top product breakage |

## 5. Lane Priority Ranking

### Highest product risk

1. Renderer critique/rewrite sync ownership map
2. Project switching audit
3. Human GUI smoke checklist refresh

Reason:

- critique/rewrite is a core user-visible workflow and already shows a direct failure
- project switching and GUI usability are central workflow trust surfaces that remain unproven

### Highest validation risk

1. Truth-lane versus broad-matrix trust split classification
2. Broad backend validation failure classification
3. Environment normalization plan

Reason:

- current evidence can be overread because narrow truth lanes pass while broad suites fail
- environment drift may distort reproducibility and ownership claims

### Highest fake-complete risk

1. Fake-complete containment around diagnostics/workspace/analytics/README
2. Human GUI smoke checklist refresh
3. Split Command baseline status containment

Reason:

- multiple surfaces already project more readiness than Pass 92 actually proved

### Highest user-facing risk

1. Renderer critique/rewrite sync ownership map
2. Human GUI smoke checklist refresh
3. Offline/diagnostics UX audit

Reason:

- these affect whether the visible product can be trusted during ordinary authoring and support conditions

### Cheapest safe next move

1. Renderer critique/rewrite sync ownership map
2. Broad backend validation failure classification
3. Environment normalization plan

Reason:

- all three are planning/audit constrained
- all three reduce uncertainty without reopening blocked domains or requiring product redesign

## 6. Repair-Readiness Classification

### `READY FOR REPAIR PLANNING`

- renderer critique/rewrite sync ownership map
- broad backend validation failure classification
- truth-lane versus broad-matrix trust split classification

Why:

- evidence is already concrete
- scope can stay narrow
- these lanes do not require immediate redesign or new architecture invention

### `NEEDS OWNERSHIP MAP FIRST`

- fake-complete risk containment across diagnostics, workspace topology, analytics, README claims

Why:

- real risk exists, but the affected surfaces cut across support, validation, renderer, and docs authority

### `NEEDS HUMAN SMOKE FIRST`

- GUI usability
- ordinary app-launch trust beyond bounded process start

Why:

- Pass 92 only proved bounded startup, not usable workflow quality

### `NEEDS ENVIRONMENT NORMALIZATION FIRST`

- environment drift between documented and observed Node/Python

Why:

- broad repair planning against a mismatched Python baseline risks false ownership and noisy verification

### `DEFER`

- Memory Lab baseline promotion
- Split Command promotion
- companion expansion
- backup verifier daemon UX promotion

Why:

- current runtime canon already says these are not first-baseline work

### `KILL CANDIDATE`

- phase4 mock routes as ordinary product surface
- plugin execution as near-term baseline assumption

Why:

- both already fail baseline legitimacy by current-state evidence

## 7. Needs Deeper Audit Classification

The following remain real but insufficiently bounded for repair planning:

1. Project switching
   - not directly observed in Pass 92
   - important to authoring continuity

2. Offline/diagnostics UX
   - support and diagnostics authority remains leakage-sensitive
   - operator-safe semantics were not directly proven

3. Packaging/release path
   - package scripts exist
   - release artifacts were not observed

4. Binder/story-unit baseline legitimacy
   - structural pressure is visible in code/history
   - baseline product legitimacy is still unclear

5. Dual sample-project alias scaffolding
   - validation/truth tooling still depends on dual-root handling
   - could distort reviewer understanding of the real product baseline

## 8. Blocked / Not Authorized Domains

Still blocked or not authorized in Pass 93:

- source-code repair
- test repair
- package/dependency/config changes
- roadmap reconstruction
- GUI redesign
- critique rebuild
- source-of-truth implementation
- diagnostics tooling implementation
- blocked-domain reentry through structural canon or workflow-state redesign

Triage interpretation:

- these domains may influence future planning, but Pass 93 does not authorize opening them

## 9. Keep / Rebuild / Defer / Kill / Investigate Refinement

### KEEP

- backend startup/health baseline
- real-service critique/rewrite/export truth chain
- project open/load baseline
- analytics backend route surface as current runtime baseline

### REBUILD

- renderer critique/rewrite sync reliability
- broad validation matrix trust
- config documentation parity
- provider-timeout fallback semantics, if later ownership mapping confirms it is baseline and not only experimental-test drift

### DEFER

- Memory Lab promotion
- Split Command promotion
- companion expansion
- backup verifier daemon UX

### KILL

- phase4 mock routes as ordinary product surface
- plugin execution as near-term baseline assumption

### INVESTIGATE

- project switching
- offline/diagnostics UX
- packaging/release build path
- binder/story-unit baseline legitimacy
- dual sample-project alias scaffolding

## 10. Recommended Next 3 Passes

### Pass 94

- Title: renderer critique/rewrite sync ownership map
- Type: planning/audit
- Why first:
  - highest user-facing repair-planning candidate
  - concrete failing lane
  - bounded seam

### Pass 95

- Title: backend validation failure classification
- Type: planning/audit
- Why second:
  - separates baseline failures from prototype/history/docs-parity failures
  - reduces the current “broad suite red” ambiguity without repairing yet

### Pass 96

- Title: environment normalization plan
- Type: planning/audit
- Why third:
  - aligns documented expectations with observed Node/Python reality
  - improves confidence in any later repair verification

Not selected for the first three:

- human GUI smoke checklist
  - valuable, but better after the immediate critique/rewrite ownership lane and failure classification are written down
- packaging/release audit plan
  - useful later, but not the cheapest uncertainty reducer right now

## 11. Stop Conditions

Pass 93 stop conditions honored:

- no implementation work performed
- no repair recommendations were promoted into execution
- no blocked-domain redesign was opened
- no source/test/package/build-config files were modified
- triage remained evidence-backed and lane-oriented

If later passes drift into:

- GUI redesign pressure
- roadmap reconstruction
- source-of-truth architecture invention
- diagnostics tooling expansion
- dependency or environment surgery without explicit authorization

they should stop and re-scope.

## 12. Final Verdict

Verdict: `READY FOR FIRST RECOVERY PLANNING LANE`

Reason:

- Pass 92 already gathered enough evidence to start a narrow recovery-planning sequence
- the safest first lane is not broad repair
- the safest first lane is a bounded ownership map around the renderer critique/rewrite sync failure, followed by backend-failure classification and environment normalization planning

This is not implementation approval.

It is only readiness for the first controlled recovery-planning lane.
