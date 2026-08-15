# Runtime Startup And Surface Authority Matrix

## Purpose

This matrix is the operational companion to
`truth_and_state_ownership_matrix.md`. The truth matrix explains who owns
product truth. This matrix explains who must prove each startup and
cross-process handoff before the next layer is allowed to run.

It exists to prevent a late, repetitive Electron failure from being reported
as many unrelated missing-button failures.

## Authority chain

| Order | Boundary | Authority | Required handoff | Direct witness | Stop condition |
| --- | --- | --- | --- | --- | --- |
| 1 | Runtime configuration | Main process configuration loader | The dedicated surface host is enabled for the test topology | Main-process policy tests and the emitted runtime configuration | Configuration is missing, malformed, or disables the requested topology |
| 2 | Lifecycle registry | Main process split-command lifecycle seam | A primary Writing window is registered and the registry is active | Main-process lifecycle contract and startup diagnostics | Registry is absent, inactive, or primary registration is missing |
| 3 | Window identity | Main process window registry | The renderer's `webContents.id` resolves to `primary` or `secondary` | Sender-role contract and one built-Electron request | Sender role is unknown or maps to the wrong window |
| 4 | Bridge exposure | Preload | `window.splitCommand` exists with the expected role and methods | Built-Electron page evaluation | Bridge is missing or exposes the wrong role |
| 5 | State request | Main IPC handler | A request from the registered renderer returns a non-null host state | Built-Electron `requestSurfaceHostState()` probe | IPC returns `null`, throws, or cannot resolve the sender |
| 6 | State contract | Preload normalizer | The returned state survives schema validation and is cached | Built-Electron response summary plus normalization tests | Response is rejected, stale, internally inconsistent, or uncached |
| 7 | Renderer projection | Writing Studio renderer | A valid state makes the surface controls visible | Built-Electron control assertions | Controls remain absent after a valid state is received |
| 8 | Surface action | Main IPC activation path | Current-window Command Center opens without a second window | Preflight action witness | Activation fails, mutates the wrong owner, or loses the state |
| 9 | Optional second window | Main lifecycle and secondary renderer | Secondary Command Center opens with a distinct role | Preflight distinct-window witness | Secondary launch, registration, or role identity fails |
| 10 | Return and recovery | Main lifecycle plus Writing renderer | Closing or returning from Command restores Writing without losing state | Preflight return witness and changed-boundary tests | Return loses the project, prose, focus, or authoritative state |
| 11 | Full workflow matrix | Stage 19 regression harness | All dependent journeys run only after the chain is green | Full Electron matrix | Any earlier boundary is unproven |
| 12 | Package/install parity | Packaged application and installed lifecycle | The proven topology survives packaging and offline reopen | Receipt-bound Windows qualification | Electron preflight or regression has not passed, or installed evidence is absent |

## Evidence rules

- A later row cannot compensate for a failed earlier row.
- A DOM timeout is not sufficient evidence for an IPC failure. The harness
  must report the last observed boundary and its diagnostic summary.
- A bridge-present result does not prove that the bridge returned a valid
  state.
- A renderer control does not prove that the main-process authority is
  correct; the state request and role must also be witnessed.
- Full Electron journeys are downstream evidence. They are not the first
  diagnostic for a shared startup contract.
- Packaging and installed qualification remain blocked until the built
  Electron chain is green.

## Fail-fast protocol

The Stage 19 regression runs a single built-Electron startup preflight before
the full Electron matrix. The preflight witnesses rows 2 through 9 and
produces an explicit boundary classification when one fails. The shared
`getStage19Windows` helper repeats the same classification when a dependent
journey is run directly, so focused local runs remain informative.

The preflight is intentionally narrow. It does not replace the full matrix,
the package/install lane, or Human Gate 2. It prevents those later checks from
spending time repeating a known startup failure.

## Regression hardening invariants

The following invariants are part of the startup contract, not optional test
convenience:

1. **Late-state recovery:** a valid state that arrives after the first
   renderer request must still update the Writing Studio projection. The
   renderer retry window must cover the hosted Windows startup envelope, and a
   delayed state must be witnessed by a renderer test that begins with several
   rejected or empty requests.
2. **Visible-control counting:** control witnesses count only controls that a
   writer can see and use. A unified logical host may keep the inactive surface
   mounted but hidden; hidden duplicate controls must never be counted as
   missing or as a second usable control.
3. **Two-sided evidence:** the preflight must report both visible control
   counts and raw DOM counts. A mismatch is diagnostic evidence about hidden
   projections, not a reason to fail the product on its own.
4. **Matrix ordering:** the standalone preflight must pass before the dependent
   Electron matrix. The dependent helper may repeat the probe, but it must
   preserve the same visible-only semantics and classify a failure by the last
   observed bridge, state, or control boundary.
5. **No green-by-accident:** a local pass is insufficient when the hosted
   runner has exposed a timing race. The late-state unit test, visible-control
   preflight, and full Electron matrix are all required before packaging is
   reopened.

These rules specifically guard against the two repeated failure modes in which
the bridge and main state were healthy but React had not received the late
handoff, or the test harness treated hidden duplicate controls as visible
product controls.

## Known limitation

The current repair batch addresses the known state-handoff race and the
visible-control counting error together. A hosted run remains required before
Human Gate 2; a local pass cannot close the hosted Windows qualification
obligation.
