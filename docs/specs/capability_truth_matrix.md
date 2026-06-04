# Capability Truth Matrix

This matrix is the coverage contract for workflow-truth lanes.

Authoritative contract artifact: [audited_chain_contract.json](/C:/Dev/black-skies/docs/specs/audited_chain_contract.json)

## Legend
- `authoritative`: route + persistence + provenance assertions are enforced in normal validation.
- `mixed`: route behavior is tested, but persistence/provenance truth is only partially enforced.
- `stubbed`: test coverage is harness/smoke only and must not be treated as workflow truth.

## UI Truth Chain (Authoritative)
| Step | UI Entry | Preload Bridge | Backend Route | Persistence/State Truth | Authority |
| --- | --- | --- | --- | --- | --- |
| project_load | `ProjectHome.handleOpenProject` / recent project | `projectLoader.loadProject` (IPC) | none | active project + draft map loaded from disk | mixed |
| scene_select | scene list button (`setActiveSceneId`) | none | none | active scene + draft edit seed | mixed |
| critique | `workspace-action-critique` -> `useCritique.runCritique` | `services.critiqueDraft` | `POST /api/v1/draft/critique` | critique provenance + budget source line | authoritative |
| rewrite | Critique modal `Generate rewrite` -> `useCritique.runRewrite` | `services.rewriteDraft` | `POST /api/v1/draft/rewrite` | rewrite provenance + conflict surface fidelity | authoritative |
| export | `workspace-action-export` -> `App.handleExportProject` | `services.exportProject` | `POST /api/v1/export` | exported artifact content tied to run marker | authoritative |

## Service Extension Chain (Authoritative, Non-UI Default)
| Step | Trigger Surface | Preload Bridge | Backend Route | Persistence/State Truth | Authority |
| --- | --- | --- | --- | --- | --- |
| accept | service-path extension test (no default production UI action) | `services.acceptDraft` | `POST /api/v1/draft/accept` | `drafts/<scene>.md` canonical update | authoritative |
| snapshot | accept side effect | n/a | via accept | `history/snapshots/<snapshot_id>_<label>` metadata + copied drafts | authoritative |
| recovery | `useRecovery` polling / restore action | `services.getRecoveryStatus`, `services.restoreSnapshot` | `GET/POST /api/v1/draft/recovery*` | `history/recovery/state.json` + snapshot linkage | authoritative |

## Snapshot Authority Rule
- Accept/recovery flow authority: `history/snapshots/*`
- Manual snapshot feature authority: `.snapshots/*`
- Truth-lane accept/recovery assertions must not use `.snapshots/*`.

## Test-Lane Policy
- `App Harness Smoke` and harness e2e lanes are witness evidence only and must not be promoted to workflow truth.
- Synthetic lanes can prove wiring, timing, and contract shape, but not backend/runtime truth.
- `App Truth Lane` is the workflow-truth gate and must avoid synthetic bypasses for audited capabilities.
- Any test labeled `integrity`, `truth`, or `real-service` must assert route truth and persistence truth, not only UI visibility.
- Fixture completeness cannot prove live project correctness.
- Harness/fixture evidence should be interpreted through `docs/contracts/harness_fixture_contract.md`.
