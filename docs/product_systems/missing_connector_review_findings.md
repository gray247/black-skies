# Missing Connector Review Findings

## Status

- Stage 7 - Missing Connector Review is active and unclosed.
- Stage 7 began through explicit author approval.
- The read-only planning pass is complete.
- No connector has been admitted.
- Three review batches are complete.
- Batch 1 review is complete.
- Batch 2 review is complete.
- Batch 3 review is complete.
- Stage 7 remains active and unclosed pending closure assessment.
- Stage 8 is not eligible.
- Stage 7 does not automatically admit connectors or unblock implementation.
- Implementation remains blocked.

## Scope

This review identifies external-system boundaries that Black Skies may eventually need without admitting or designing connectors now.

The current first-release doctrine keeps manual import/export and package handoff as the default boundary.
Connectors are justified only when manual exchange cannot satisfy an approved workflow.

This review distinguishes:

- required connector boundary
- manual handoff already sufficient
- import/export feature, not connector
- optional future connector
- connector-dependent capability
- unsupported scope
- Stage 9 presentation issue
- Stage 10 operational issue
- Stage 12 architecture issue
- requires author decision
- not needed

## Governing doctrine

- Manual import/export and package handoff are the default boundary.
- Connectors are reserved for approved workflows that manual exchange cannot satisfy.
- Live collaboration, connected synchronization, and automated round-trip exchange are future connector-dependent capabilities.
- Model providers and local model runners are external execution boundaries, not product connectors.
- Imported material retains external provenance.
- Import does not automatically mutate truth.
- Export transfers no ownership.
- No silent platform or provider substitution is allowed.
- No universal integration owner is created.

## Classification standard

- Manual interchange or product feature, not connector
- Manual handoff already sufficient
- Future connector-dependent
- External execution boundary, not connector
- Unsupported current scope
- Requires author decision
- Not needed

## Candidate matrix

| Candidate | Classification | Batch | Action |
| --- | --- | --- | --- |
| Google Docs one-way import/export | Manual interchange or product feature, not connector | 1 | Defer |
| Google Docs live synchronization | Future connector-dependent | 3 | Deeper review |
| Microsoft Word / DOCX interchange | Manual interchange or product feature, not connector | 1 | Defer |
| Markdown and plain-text interchange | Manual interchange or product feature, not connector | 1 | Defer |
| EPUB or publishing-tool export | Manual interchange or product feature, not connector | 1 | Defer |
| Direct publishing-platform push | Future connector-dependent | 3 | Deeper review |
| Local backup destinations | Manual handoff already sufficient | 1 | Defer |
| Cloud storage folders | Future connector-dependent | 3 | Deeper review |
| Cloud backup synchronization | Future connector-dependent | 3 | Deeper review |
| External editor or collaborator handoff | Manual handoff already sufficient | 1 | Defer |
| External editor live shared editing | Future connector-dependent | 3 | Deeper review |
| Live multi-author collaboration | Future connector-dependent | 3 | Deeper review |
| Shared document editing | Future connector-dependent | 3 | Deeper review |
| Connected comments or suggestions | Future connector-dependent | 3 | Deeper review |
| Comments and tracked changes import | Manual interchange or product feature, not connector | 1 | Defer |
| Comments and tracked changes live synchronization | Future connector-dependent | 3 | Deeper review |
| Email package handoff | Manual interchange or product feature, not connector | 1 | Defer |
| Model providers and API routes | External execution boundary, not connector | 2 | Defer |
| Local model runners | External execution boundary, not connector | 2 | Defer |
| Provider substitution and fallback | External execution boundary, not connector | 2 | Defer |
| Manual web/file intake | Manual handoff already sufficient | 2 | Defer |
| Manual research or web-source intake | Manual handoff already sufficient | 2 | Defer |
| Automated research or web-source intake | Future connector-dependent | 2 | Deeper review |
| Manual citation or reference-manager exchange | Manual handoff already sufficient | 2 | Defer |
| Citation or reference-manager auto sync | Future connector-dependent | 2 | Deeper review |
| External grammar or style tools | Unsupported current scope | 2 | Reject now |
| External search or index services | Unsupported current scope | 2 | Reject now |
| Audiobook or text-to-speech systems | Unsupported current scope | 2 | Reject now |
| Image or cover-generation systems | Unsupported current scope | 2 | Reject now |
| Other external AI utilities in doctrine | No action required | 2 | Defer |
| Version-control or Git export | Unsupported current scope | 1 | Reject now |
| Third-party plugins | Unsupported current scope | 3 | Reject now |
| Extensions | Unsupported current scope | 3 | Reject now |
| Mobile or companion clients | Unsupported current scope | 3 | Reject now |
| Remote Companion clients | Unsupported current scope | 3 | Reject now |
| External task/project-management tools | Unsupported current scope | 3 | Reject now |
| External calendar or deadline tools | Unsupported current scope | 3 | Reject now |
| Real-time collaboration | Future connector-dependent | 3 | Deeper review |
| Automated round-trip synchronization | Future connector-dependent | 3 | Deeper review |
| External task/calendar synchronization | Future connector-dependent | 3 | Deeper review |
| Scheduled external monitoring | Future connector-dependent | 3 | Deeper review |
| Automation across external systems | Future connector-dependent | 3 | Deeper review |

## Batch 1 Review

Batch 1 review is complete.

### Manual doctrine sufficient

- DOCX interchange - planned product feature, not connector
- Markdown and plain-text interchange - planned product feature, not connector
- bounded EPUB export - planned product feature, not connector
- one-way Google Docs export - planned product feature, not connector
- one-way Google Docs import - planned product feature, not connector
- manual Google Docs round trip - manual handoff sufficient
- comments and suggestions import - planned product feature, not connector
- manual external-editor handoff - manual handoff sufficient
- comments and tracked-changes import - planned product feature, not connector
- email/package handoff - manual handoff sufficient
- manual citation/reference exchange - manual handoff sufficient
- publication-platform handoff - manual handoff sufficient
- local backup destinations - manual handoff sufficient
- manual cloud-folder placement - manual handoff sufficient

### Future connector-dependent

- Google Docs live synchronization
- Google Docs shared editing
- Google Docs automated round-trip synchronization
- cloud-folder synchronization
- cloud backup synchronization
- direct publishing-platform push
- citation/reference-manager auto sync

### Unsupported current scope

- Git/version-control export

### Review result

- Manual doctrine is sufficient for the manual items above.
- External-editor return material, whether DOCX, comments, or tracked changes, stays external until explicitly routed by the author.
- Local backup destinations are governed without a connector.
- User-managed cloud-folder placement is not Black Skies synchronization.
- Automatic cloud-folder sync and automatic cloud backup sync remain future connector-dependent capabilities.
- Git is not a Black Skies product export feature.
- No true ownership or truth-boundary gap was found.
- No product-dossier correction is required.
- Conditional author decisions remain only if a future scope is reopened for connector-dependent items.

## Batch 2 Review

Batch 2 review is complete.

### External execution boundaries

- Hosted model providers and API routes are external execution boundaries, not product connectors.
- Local model runners are external execution boundaries, not product connectors.
- Provider substitution and fallback stay inside routing doctrine and are not connector boundaries.

### Manual intake sufficient

- Manual web/file intake is sufficient today.
- Manual research or web-source intake is sufficient today.
- Manual citation or reference-manager exchange is sufficient today.

### Future connector-dependent

- Automated research or web-source intake remains future connector-dependent.
- Citation or reference-manager auto sync remains future connector-dependent.

### Unsupported current scope

- External grammar or style tools remain unsupported current scope.
- External search or index services remain unsupported current scope.
- Audiobook or text-to-speech systems remain unsupported current scope.
- Image or cover-generation systems remain unsupported current scope.
- Other external AI utilities already covered by package or routing doctrine do not require connector admission.

### Review result

- Provider routes, local runners, and provider substitution or fallback are external execution boundaries, not connectors.
- Provider outage is not project-load failure.
- Local failure must not silently trigger cloud transmission.
- Manual web/file intake, manual research intake, and manual citation exchange are sufficient today.
- Automated web/research intake and citation auto sync remain future connector-dependent.
- External grammar/style, search/index, TTS, image/cover, and similar external AI utilities remain outside current scope.
- No provider-specific connector dossier is justified.
- No true ownership or truth-boundary gap was found.
- No product-dossier correction is required.
- Conditional author decisions remain only if future connector-dependent scope is later reopened.

## Batch 3 Review

Batch 3 review is complete.

### Collaboration and synchronization

- Manual package and DOCX handoff remains sufficient for current doctrine.
- Live multi-author collaboration, shared document editing, Google Docs live synchronization, connected comments or suggestions, automated round-trip synchronization, cloud-folder synchronization, cloud backup synchronization, and direct publishing-platform push remain future connector-dependent.
- Shared editing does not create a second manuscript-truth owner.
- Connected synchronization remains distinct from manual import/export.
- Live collaboration is not silently treated as approved.
- Imported comments, suggestions, or edits retain external provenance.
- No remote edit is automatically accepted.
- Cloud-folder use by the author is not Black Skies synchronization.

### Plugins and extensions

- Third-party plugins and extensions remain unsupported current scope.
- Internal rubrics stay project-local and may use deterministic rules plus bounded local AI.
- No universal plugin or integration owner is created.
- No missing plugin dossier is required.

### Mobile and remote clients

- Mobile clients and remote Companion clients remain unsupported current scope.
- No approved mobile product surface exists.
- Companion does not become a remote sovereign client.
- Later reconsideration requires explicit author approval.

### External automation

- External task/calendar synchronization, scheduled external monitoring, and automation across external systems remain future connector-dependent.
- Local queueing is not external automation.
- Direct publishing-platform push remains distinct from publication export.
- Cloud backup synchronization remains distinct from local backup.
- External systems own no Black Skies truth or workflow.
- Partial, failed, stale, conflicting, cancelled, and duplicated actions remain visible.
- No silent retry or mutation is allowed.

### Review result

- Manual package and DOCX handoff remains sufficient.
- No connector is admitted.
- No true ownership or truth-boundary gap was found.
- No product-dossier correction is required.
- No author decision is required now.
- Conditional author decisions remain only if future connector-dependent scope is later reopened.

## Manual-interchange boundaries

DOCX, Markdown, plain text, publication export, bounded EPUB export if later retained, email/package handoff, manual external-editor handoff, manually imported comments or tracked changes, one-way Google Docs import/export, and local backup destinations stay inside bounded manual exchange until a later approval says otherwise.

These are planned or governed boundaries, not current connector support.

## External-service boundaries

Model providers and API routes, plus local model runners, are external execution boundaries.

They require route approval, privacy disclosure, provenance visibility, and no silent substitution.
They are not product connectors.

Research or web-source intake and citation or reference-manager intake may be handled manually today.
Automation, monitoring, or synchronization across those boundaries would need later connector review.

## Future connector candidates

The connector-dependent candidates are:

- Google Docs live synchronization
- cloud storage folder synchronization
- cloud backup synchronization
- direct publishing-platform push
- external editor live shared editing
- comments and tracked changes live synchronization
- automated research or web-source intake
- citation or reference-manager auto sync
- real-time collaboration
- automated round-trip synchronization

These remain unadmitted.

## Unsupported scope

The following are not current Stage 7 connector candidates:

- third-party plugins
- mobile or companion clients
- external task or project-management tools
- external calendar or deadline tools
- external grammar or style tools
- external search or index services
- audiobook or text-to-speech systems
- image or cover-generation systems
- version-control or Git export

Image and cover generation remain outside current Black Skies scope, not merely deferred to Stage 12.

## Risks

- Imported material must retain external provenance.
- Import must not automatically mutate truth.
- Export must transfer no ownership.
- Partial, stale, failed, or excluded transfer results must remain visible.
- Privacy and transmission consequences must remain visible.
- Providers own no workflow or destination object.
- Provider outage is not project-load failure.
- Local failure must not silently trigger cloud transmission.
- Route approval, package approval, and destination acceptance remain distinct.
- No silent platform or provider substitution is allowed.
- Connector-adjacent work must not collapse manual interchange into live synchronization.

## Review batches

1. Document interchange and manual handoff
2. AI/runtime and external-service boundaries
3. Collaboration, synchronization, plugins, mobile, and automation

No individual connector dossier is justified yet.

## Stage 9 routing

- Presentation labels for collaboration, synchronization, plugin, mobile, automation, manual interchange, product features, connector-dependent capabilities, and unsupported scope
- Inclusion/exclusion wording for exported, imported, or handoff material
- Partial, failed, and stale transfer visibility
- Privacy and transmission disclosure presentation
- Warning copy for automatic sync, live collaboration, connected comments, platform push, and remote-client access

## Stage 10 routing

- Reliability of provider routes and local runners
- Failure, retry, and partial-result handling for external services and automations
- Integrity and corruption handling for transfer packages
- Retention and policy monitoring where providers are involved
- Offline behavior, conflict handling, and stale-state recovery
- Security and privacy of packaged material
- Performance and cost accounting for external execution paths

## Stage 12 routing

Approved connector architecture belongs to Stage 12 if a specific connector boundary is later reopened and explicitly approved.

Stage 12 must resolve connector shape, ownership, persistence, and lifecycle boundary before implementation planning relies on it.

## Conditional author decisions

Decisions are only required if a scope is later reopened for:

- live multi-author collaboration
- live collaboration
- shared document editing
- automated round-trip synchronization
- connected comments or suggestions
- Google Docs beyond one-way interchange
- cloud backup or cloud-folder synchronization
- direct publishing-platform push
- third-party plugins
- extensions
- mobile or companion clients
- remote Companion clients
- external task/calendar synchronization
- scheduled external monitoring
- automation across external systems
- automated web intake
- citation or reference-manager auto sync

These are not current Stage 7 blockers.

## Connector admission status

- No connector is admitted.
- No universal integration owner is created.
- One central findings file is sufficient for Stage 7.
- Individual connector dossiers are not justified yet.
- Candidate filenames for individual connector dossiers are deferred until a specific connector boundary is reopened.
- All three review batches are complete.

## Remaining Stage 7 work

- Preserve manual import/export and package handoff as the default boundary.
- Keep connector admission gated until a specific approved workflow requires it.
- Route presentation issues to Stage 9, operational issues to Stage 10, and approved connector architecture to Stage 12.
- Stop before connector design or architecture selection.
- Keep implementation blocked.
- Stage 7 remains active and unclosed pending closure assessment.
