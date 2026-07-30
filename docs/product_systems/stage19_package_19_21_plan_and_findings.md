# Stage 19 Package 19.21 Plan and Findings

## 1. Package decision and boundary

Package `19.21`, user/release/operator documentation, is active.

The accepted product baseline is the Package `19.20` release candidate:

```text
source commit:
  b916765196bde37e95968d3985ab5238b47ad797
version:
  1.0.0-rc1
platform:
  Windows 11 x64
installer:
  BlackSkies-Setup-1.0.0-rc1.exe
installer bytes:
  89275742
installer SHA-256:
  93220059613b1fd8fb78cdbbe08539b033c4d93c2e30cb8abe0d67a95623458b
signature:
  NotSigned
protected evidence:
  NOT_USED
```

Package `19.21` may align user, release, support, operator, and documentation
navigation records with that accepted behavior. It does not authorize product
runtime, GUI, dependency, packaging, test, source-code, installer, version, or
release/tag changes. A product/document mismatch that cannot be corrected
truthfully in documentation is a stop condition for separate authority.

The repository governance override remains controlling:

- the user performs commits and pushes;
- the branch is not changed;
- no cleanup, salvage execution, destructive history operation, or protected
  evidence use is permitted; and
- Package `19.22` remains the only final V1.0 closure/release boundary and
  requires Jason's explicit final release authorization.

## 2. Autonomous-first execution model

Codex owns the bounded Package `19.21` preparation and verification work:

1. inventory current documentation and accepted product facts;
2. align current user, release, support, and operator records;
3. check commands, paths, version, filename, hash, signature, links,
   terminology, UI labels, and stale authority;
4. rehearse the finished user/operator instructions against the installed
   application with Computer Use;
5. correct in-scope documentation mismatches and rerun affected checks; and
6. record residuals and closure readiness.

Routine manual test handoffs are excluded. Stop only for an authority-changing
decision, an action-time confirmation, an in-package blocker that cannot be
resolved safely, or Package `19.22` final release authorization.

## 3. Documentation set

### Current records to align

| Record | Package `19.21` role |
| --- | --- |
| `README.md` | concise product landing page and supported installed-product path |
| `docs/quickstart.md` | end-user install, first launch, project, writing, Save, reopen, export, recovery, and optional critique guide |
| `docs/packaging.md` | exact internal-RC artifact and operator build/receipt truth |
| `RELEASE.md` | release-candidate identity, release gate, known-limitations and Package `19.22` authorization boundary |
| `docs/ops/support_playbook.md` | installed-product troubleshooting and escalation posture |
| `docs/rollback_policy.md` | exact RC rollback and external-data preservation posture |
| `docs/ui_copy_spec_v1.md` | current accepted Writing Studio and Command Center terminology and labels |
| `docs/README.md` and `docs/ops/README.md` | current navigation and stale-authority containment |
| `RUNBOOK.md` | developer/service-only status, clearly separated from installed V1 product operation |

### Controlling evidence

- `stage19_package_19_20_closure.md`;
- `stage19_packages_19_21_19_22_handover.md`;
- `stage19_v1_master_implementation_and_acceptance_plan.md`;
- Package `19.15` Markdown export contract and closure;
- Package `19.16` audit/qualification and closure;
- Package `19.18` manual acceptance plan and closure;
- Package `19.19` packaging records; and
- the accepted Stage 19 renderer, main-process dialogs, package manifest, and
  NSIS configuration.

Historical planning, legacy service, companion, plugin, analytics, broad AI,
portable installer, and Python/FastAPI records are not current installed
product authority.

## 4. Required content coverage

The aligned documentation must cover:

- assisted per-user first install, optional custom install directory, first
  launch, desktop/Start Menu shortcuts, and uninstall;
- exact Open/Create folder-picker semantics;
- binder/unit creation, optional naming, rename, ordering, deletion warning,
  editing, `Ctrl+Z`, `Ctrl+Y` or `Ctrl+Shift+Z`, `Ctrl+S`, Save, reopen, and
  clean/dirty/failed state language;
- deterministic Markdown export, `.md` destination behavior, cancellation,
  replacement confirmation, and clean-state requirement;
- recovery review, accept, reject/delete, accepted-pending-Save behavior, and
  degraded recovery containment;
- Command Center's navigation/status/read-only role;
- selected-prose-only OpenAI critique, 200-12,000 non-whitespace character
  selection, session-memory credential, exact outbound preview and approval,
  advisory-only result, invalidation/cancellation behavior, cost limitation,
  and honest V1 constraints;
- offline core behavior and no installed Python/global-Node/repository
  dependency;
- Windows 11 x64, assisted per-user NSIS, unsigned internal-RC status,
  external-data retention, Electron user-data retention, and uninstall
  boundaries;
- keyboard traversal, visible focus, Windows scaling, two-window use, and
  monitor disconnect/reconnect guidance;
- invalid-project, Save, export, installer-warning, optional-provider, and
  recovery troubleshooting;
- release notes, known limitations, support posture, and rollback; and
- exact operator commands, paths, version, filename, byte length, hash,
  signature, and UI labels.

No current user guide may copy protected manuscript prose, credentials,
historical candidate identities, or disqualified candidate hashes.

## 5. Review pass 1 — authority and completeness

Result: `PASS_WITH_CORRECTIONS_APPLIED_TO_PLAN`.

Review method:

- compared the proposed package to the handover minimum list;
- checked the Package `19.21` dependency and exit gate in the master plan;
- confirmed Package `19.20` closure and accepted artifact identity;
- preserved the Package `19.22` final human/release boundary; and
- applied the repository governance override to commit, push, branch, runtime,
  cleanup, and destructive-action behavior.

Corrections applied:

1. separated installed-product guidance from developer/service tooling;
2. made exact RC identity and `NotSigned` status mandatory;
3. made stale-authority containment an explicit deliverable;
4. added a package-local findings ledger and rerun rules; and
5. blocked product/runtime correction by inference.

## 6. Review pass 2 — hostile product-truth review

Result: `PASS_WITH_CORRECTIONS_APPLIED_TO_PLAN`.

Review method:

- compared the plan to the accepted renderer labels and keyboard handlers;
- checked project folder-picker and Markdown save/replace dialogs;
- checked the package manifest, exact NSIS configuration, and installer
  lifecycle evidence;
- checked Package `19.16` accessibility evidence and Package `19.18` physical
  monitor evidence; and
- challenged every planned claim for unsupported automation, platform,
  signing, update, data-deletion, provider, or monitor-placement implications.

Corrections applied:

1. exact Open/Create folder semantics replace generic “choose a folder” text;
2. export guidance distinguishes save-dialog cancellation from explicit file
   replacement confirmation;
3. recovery acceptance is documented as unsaved until normal Save;
4. Command Center is described as status/navigation-only and non-mutating;
5. optional critique is described as remote, explicit, session-only,
   advisory, and outside offline-core qualification;
6. monitor reconnect guidance states that windows remain reachable but may
   overlap and do not automatically return to the former monitor; and
7. the installer is described only as an unsigned internal RC, never as a
   SmartScreen-trusted or public release.

The twice-reviewed plan is therefore eligible for execution.

## 7. Findings ledger

| ID | Severity | Finding | Owner / disposition | Status |
| --- | --- | --- | --- | --- |
| BS-19.21-P1-01 | P1 | `docs/quickstart.md` describes the retired clone/Python/FastAPI/Vite workflow as the release quickstart. | Package `19.21`: replaced with installed-product guidance; developer setup retained only through explicit developer records. | CLOSED |
| BS-19.21-P1-02 | P1 | `docs/ops/support_playbook.md` routes support through legacy services, plugins, analytics, budgets, and nonexistent release operations. | Package `19.21`: replaced with accepted installed-product support posture. | CLOSED |
| BS-19.21-P1-03 | P1 | `README.md` presents legacy outline/draft/rewrite/critique/service behavior as the current product and points to stale authority. | Package `19.21`: aligned landing page and current Stage 19 truth links. | CLOSED |
| BS-19.21-P1-04 | P1 | `RELEASE.md` uses obsolete runtime-truth/service/eval lanes and would not reproduce the fixed Stage 19 release gate. | Package `19.21`: replaced with exact Stage 19 RC/release process and Package `19.22` stop gate. | CLOSED |
| BS-19.21-P2-01 | P2 | `docs/ui_copy_spec_v1.md` declares legacy panes, autosave, snapshots, layouts, Companion, and service status as approved V1 UI copy. | Package `19.21`: aligned to accepted Writing Studio and Command Center UI. | CLOSED |
| BS-19.21-P2-02 | P2 | `docs/rollback_policy.md` is a generic phase draft with no accepted candidate, data-retention, or rebuild invalidation rules. | Package `19.21`: aligned exact rollback posture without authorizing a release action. | CLOSED |
| BS-19.21-P2-03 | P2 | `docs/README.md` and `docs/ops/README.md` route readers to stale architecture and phase systems as current operating truth. | Package `19.21`: added current navigation and historical-document warning. | CLOSED |
| BS-19.21-P2-04 | P2 | `RUNBOOK.md` can be mistaken for installed-product operation and implies Python is required for Black Skies V1. | Package `19.21`: bounded as developer/legacy-service-only and linked installed-product support guidance. | CLOSED |
| BS-19.21-P2-05 | P2 | `docs/packaging.md` still says Package `19.20` separately owns a future packaged-RC pass and does not identify the accepted replacement candidate. | Package `19.21`: preserved build contract while adding final accepted RC identity and supersession rule. | CLOSED |
| BS-19.21-P3-01 | P3 | A truthful export-cancellation notice for the prior project remained visible after creating a different project. It continued to name the prior export source, did not claim completion, and did not affect project state or files. | Package `19.22` residual disposition. Reopen earlier only if a notice misidentifies its source, obscures current Save/export truth, or affects a release-critical action. | DEFERRED_TO_19_22 |

## 8. Verification and rerun rules

Before Package `19.21` closure readiness:

1. Markdown links in the current documentation set must resolve.
2. Current docs must contain one consistent version, installer filename,
   accepted byte length, SHA-256, signature truth, platform, and package
   status.
3. Current docs must not claim Python, global Node, repository, provider,
   protected-evidence, portable-installer, signing, auto-update, autosave,
   automatic monitor restoration, or Command Center mutation dependencies.
4. Exact current UI labels and folder-picker semantics must match source and
   the installed application.
5. Legacy authority words in current docs must be either removed or explicitly
   bounded as developer/historical material.
6. The finished end-user and support paths must be rehearsed against the
   accepted installed application with Computer Use.
7. Any mismatch must reopen the associated finding, be corrected within
   authority, and rerun the affected check.

Package `19.21` is ready to close only when every finding is `CLOSED` or has
one exact later owner and reopening trigger, no P0/P1/P2 documentation defect
remains, and the installed-app rehearsal passes.

## 9. Verification result

Static documentation verification:

```text
markdownlint:
  PASS
current-document link resolution:
  PASS
git diff --check:
  PASS
accepted filename/version/bytes/hash/signature consistency:
  PASS
forbidden current-release legacy claim scan:
  PASS
```

Computer Use installed-app rehearsal:

```text
installed executable:
  C:\Users\gray2\AppData\Local\BlackSkiesManualTests\Stage19-20-b916765\Black Skies\Black Skies.exe
initial window count:
  2
window roles:
  Writing Studio + Command Center
fresh synthetic project:
  Package 19.21 Documentation Rehearsal
fresh project path:
  C:\BlackSkiesManualTests\Stage19-20-b916765\ExternalData\proj_package-19-21-documentation-rehearsal_55cf00ba09
project creation through documented native parent-folder picker:
  PASS
unit creation and naming:
  PASS
edit / 1 unsaved unit:
  PASS
Ctrl+Z / Ctrl+Y:
  PASS
Ctrl+S / Saved durably:
  PASS
Command Center synchronized read-only projection:
  PASS
clean-state Export Markdown dialog:
  PASS
export cancellation / no file created:
  PASS
normal clean close:
  PASS
relaunch / recent-project reopen / exact durable prose:
  PASS
protected evidence:
  NOT_USED
credential:
  NOT_USED
provider call:
  NOT_USED
destructive recovery decision:
  NOT_USED
file replacement:
  NOT_USED
uninstall:
  NOT_USED
```

The fresh synthetic project is retained as Package `19.21` rehearsal evidence.
It was not deleted because deletion is not required for documentation
qualification and would require separate action-time confirmation.

All Package `19.21` P0/P1/P2 findings are closed. The sole P3 observation is
truthful, non-blocking, owned by Package `19.22`, and has an exact reopening
trigger.
