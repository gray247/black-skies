# Memory Lab: Phase 7A Experimental Isolation Contract

## Purpose
Prevent experimental work from mutating stable contested-memory behavior.

## Hard Isolation Rules
1. All experiment behavior must be feature-flagged.
2. Experimental config must use separate namespace:
   - `memory_lab_experimental_*`
3. Experimental flags must default to off.
4. Experiments must not alter frozen core contracts:
   - contested key schema
   - comparator tuple/provenance
   - prompt winner/alternate contract
   - compatibility policy
5. Resolver purity and orchestrator ownership boundaries must remain unchanged.

## Required Controls
- explicit experiment id for each run
- experiment-to-flag mapping table
- rollback path documented before enabling

## Required Validation Categories
- feature-flag isolation tests
- no-default-on tests
- config namespace separation tests
- no-core-contract-mutation tests

## Failure Policy
Violation of any hard isolation rule is blocker severity and requires immediate rollback.

