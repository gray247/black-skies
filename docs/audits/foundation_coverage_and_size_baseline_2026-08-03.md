# Foundation coverage and size baseline

Status: baseline definition and open measurement record; not a pass receipt.

The configured Python supported-core threshold remains **60% branch coverage**.
It must not be reduced. The last audited all-services measurement was 32.15%
(13,699 statements; 8,464 missed), so the threshold is presently unmet.

The supported-core denominator is limited to project identity, project loading,
save/reopen, recovery, deterministic Markdown export, Stage 19 window
ownership, IPC authorization, service startup, and teardown. Exclusions must
remain documented: live-provider qualification, provider-backed long-form,
memory prototypes, Smart Merge, strict visual snapshots, and inactive
historical qualification tooling. An exclusion is valid only with an owner and
reopening trigger in `docs/testing/intentional_skip_inventory.json` or the
deferred-feature authority.

Before removals or shrinking work, capture these exact-candidate measurements:

1. subsystem coverage report under Python 3.11;
2. renderer chunk sizes, unpacked app size, installer size, cold startup time,
   and memory after two-window launch;
3. package-input and forbidden-content report;
4. current skip inventory and process-leak receipt.

Risk-weighted tests come first: project identity, save/reopen, recovery,
export, window ownership, IPC authorization, service startup, and teardown.
There is no authorized dead-code deletion batch until these measurements exist.
