Status: Archived
Version: 0.1.0
Last Reviewed: 2025-11-15

# Phase 8 Audit – Consolidated Issue List

## A. Flat Master List

1. Voice-note endpoints included in API despite being deferred.
2. BackupVerifier daemon processes voice notes and snapshots outside phase scope.
3. BackupVerifier reads/writes global `_runtime/` state instead of per-project storage.
4. Global `_runtime/` folder used for caches and run ledgers; violates data_model and risks cross-project leakage.
5. Plugin runner imports arbitrary Python modules without sandboxing.
6. Logs expose file paths, snapshot IDs, and sensitive metadata.
7. Broad `except Exception` blocks hide failures.
8. `_runtime/` writes have no locking; risk of concurrent corruption.
9. Analytics endpoints (`/analytics/summary`) exist before Phase 9.
10. Voice-note API routes active without consent controls or policy alignment.
11. GUI docs describe analytics drawer and conflict heatmap (Phase 9 features).
12. Phase log claims analytics already shipping; contradicts phase scope.
13. Export pipeline generates `analytics_report.json` before Phase 9.
14. Export metadata stores analytics, conflicting with privacy policy.
15. DraftUnitSchema missing fields required by data_model (e.g., title).
16. Insights surface unclear: overlay vs drawer mismatch between docs.
17. GUI docs list docking presets and advanced hotkeys that aren’t shipping.
18. Exports doc includes Phase 10 functionality (dynamic templates, Pandoc, DOCX/EPUB).
19. Plugin registry described in docs despite being Phase 11.
20. Floating Story Insights pane documented but not implemented.
21. Spark Pad deliverables mention telemetry despite telemetry being disallowed.
22. Persistent mention of early analytics in overlay treated as shipped instead of experimental.
23. Analytics calculations present in exports even when analytics service is not implemented.
24. Local analytics utilities used in CompanionOverlay without documentation that they are temporary.
25. Analytics included in export bundles without versioning or future-phase gating.
26. Analytics visualizations referenced in GUI docs (emotion arc, pacing, heatmap) but hidden conditionally, causing inconsistent documentation.
27. phase8_gui_enhancements.md references dock-manager integration not clearly reflected in shipping GUI.
28. Early analytics drawer described before Phase 9, creating mismatched expectations.
29. draft_export pipeline writes analytics_report.json even when analytics is disabled.
30. analytics_service_spec.md defines full endpoint set despite Phase 9 deferral.
31. analytics service code (service.py) exists but unreferenced or partially integrated.
32. analytics router exposes `/analytics/summary` and `/analytics/budget` while undocumented in primary endpoints list.
33. Plugin infrastructure (host.py, registry.py, agents/base.py) implemented before Phase 11.
34. plugin_sandbox.md describes sandbox guarantees not reflected in actual implementation.
35. voice_notes_transcription.md defines pipeline before Phase 10; misleading future docs included in current doc set.
36. phase9_companion_loop.md included in repo even though feature belongs to Phase 9 and not referenced by Phase 8 deliverables.
37. Companion overlay includes emotion/pacing suggestions without clarity they are heuristics, not analytics engine output.
38. GUI layout shows conflict heatmap planned but lacks implementation details, causing spec drift.
39. Draft export and critique export services depend on analytics fields not guaranteed to exist.
40. Feedback export includes summaries referencing analytics-derived metrics not available in P8.
41. Live analytics placeholders appear in code without feature flags.
42. analytics.ts utilities operate independently of planned analytics architecture, creating future migration burden.
43. analytics payload structure defined in export.py not aligned with Phase 9 spec.
44. analytics caching behavior undefined (no TTL, invalidation, or per-project boundaries).
45. architecture.md and endpoints.md disagree on whether voice-note endpoints are allowed.
46. policies.md contradicts endpoints.md by forbidding remote processing while endpoints allow external transcription.
47. analytics endpoints conflict with Phase 8 charter; scope not updated or aligned.
48. DraftUnitSchema and data_model scene metadata mismatch (title vs meta fields).
49. GUI layouts reference insights drawer conflicting with Phase 8 “overlay” requirement.
50. Export metadata contradicts privacy policy regarding analytics/telemetry storage.
51. phase_log mentions docking verification that does not match GUI’s “no docking in build” statement.
52. Budget/analytics UI features appear in phase_log but are absent from GUI docs or policies.
53. Charter defers cross-platform support, but policies imply Windows-only; unclear future scope.
54. GUI safety rules lack references to budget/validation error behavior described in policies.
55. analytics summary endpoint has no access-control rules defined.
56. No TTL or purge rules specified for analytics caches.
57. analytics payloads expose revision streaks but no redaction rules exist.
58. exports embed model provider details without privacy mode or redaction options.
59. No concurrency model defined for budget deductions across parallel API requests.
60. Offline banner in GUI requires manual retry; no automatic reconnect logic.
61. snapshots lack digital signatures or tamper detection mechanisms.
62. critique rubric accepts unrestricted content with no server-side sanitization.
63. Hidden dock hotkeys are undocumented and not aligned with shipped features.
64. agent hook spec is incomplete; missing error propagation and cancellation semantics.
65. Story insights / Project Health pane described as existing but is only a future concept.
66. Spark Pad charter mentions telemetry despite telemetry being disallowed by policy.
67. Data model lacks explicit rules for snapshot versioning beyond shallow copies.
68. No schema bump migration guidelines for analytics fields added in later phases.
69. Inconsistent naming conventions between draft units, revision units, and export units.
70. Revisions folder lacks documented cleanup/rotation policy; can accumulate indefinitely.
71. Snapshots stored without compression despite large file sizes.
72. No documented limits on number of snapshots or revision history depth.
73. Draft generation responses do not include pacing_target units consistently across scenes.
74. outline.json lacks validation rules for malformed or missing beat_refs.
75. History entries do not store environment metadata, making debugging difficult.
76. Revision diffs do not specify a stable diff schema for future-proofing.
77. No validation prevents circular merges or splits between chapters/scenes.
78. Revisions do not enforce immutable parent-child relationships after merges/splits.
79. Duplicate ID detection rules not present in data_model.
80. No specification for handling orphaned draft or revision files.
81. Auto-migration logic undefined for changes in critique rubric categories.
82. No checksum verification for drafts folder items (only snapshots).
83. No policy for how obsolete outline entries are handled after major structural rewrites.
84. No policy for cross-version compatibility between exports and future app versions.
85. Missing definitions for error codes returned by draft/rewrite/critique endpoints.
86. No fallback behavior documented when outline/draft ID references fail.
87. No deterministic order defined for critique priorities in responses.
88. No defined schema for normalized pacing/emotion data used by overlays.
89. Missing guardrails preventing oversized draft units (e.g., >10k words).
90. No specification for handling incomplete or partially-corrupted JSON files.
91. endpoints.md lacks pagination rules for list-style endpoints.
92. No defined rate limiting behavior for high-volume critique or rewrite calls.
93. Missing endpoint-level versioning strategy for future API changes.
94. No specification for backward-compatible changes to critique output schema.
95. Rewrite endpoint does not define constraints for multi-unit rewrites or batch operations.
96. draft/generate does not define timeout behavior for large unit_ids arrays.
97. rewrite/critique endpoints do not specify how to handle abandoned/in-progress revisions.
98. No policy for retries or idempotency of draft generation requests.
99. endpoints.md lacks structured error responses for malformed rubric lists.
100. rewrite diff representation not guaranteed to be stable or human-readable across versions.
101. No enforcement preventing critique endpoint from returning excessively large line-by-line notes.
102. Missing documentation for HTTP status codes used by offline/failed model calls.
103. endpoints lacking authentication/authorization scaffold for future multi-user workflows.
104. No explicit guidance on maximum request body size for large draft rewrites.
105. Missing spec for concurrency control when multiple rewrites target the same unit.
106. No retry/backoff rules defined for failed AI model interactions.
107. No policy for partial failures in batch critiques or partial successes being returned.
108. Lack of deterministic ordering for units returned by /draft/generate.
109. No validation preventing invalid or nonexistent rubric category names.
110. Missing spec on how critique handles mixed rubric modes (custom + default).
111. API does not specify behavior for empty or whitespace-only instructions in rewrite calls.
112. No conflict-resolution rules for simultaneous changes applied by overlap in revisions folder.
113. endpoints.md never states whether deleted scenes/chapters can still be referenced by ID.
114. No defined behavior for nested or hierarchical critique tasks.
115. No guarantee that API returns consistent encoding (UTF-8) for text fields.
116. No documented rule for how outline rebuild handles previously locked decisions.
117. Wizard decisions do not specify override precedence when conflicting with existing outline metadata.
118. Missing validation preventing scenes with duplicate order indexes after manual reordering.
119. No policy for handling orphaned beat_refs after outline rewrites.
120. Outline rebuild lacks explicit error behavior when acts or chapters are missing.
121. No guaranteed stable ordering for chapters without explicit “order” fields.
122. Missing normalization pass for whitespace, punctuation, and formatting in outline titles.
123. Outline builder does not specify handling for empty or null scene titles.
124. No specification for merging outline-level pacing targets with draft-level pacing targets.
125. Wizard → Outline flow lacks a deterministic rule for conflicting POV assignments.
126. Missing rule for what happens if outline.json is partially corrupted or only half-readable.
127. No schema for fallback outline reconstruction (e.g., rebuilding from drafts folder).
128. History system does not specify rules for outline-level versioning.
129. No clear rollback mechanism described for outline rebuild failures.
130. Outline builder does not validate beat_refs target IDs before generating chapters/scenes.
131. No consistency check ensuring beat_refs do not reference a future or later scene improperly.
132. Outline builder can output scenes missing purpose/goal fields without warnings.
133. No standardization for outline slugs (slug history vs. slug regeneration undefined).
134. Missing lifecycle rules for removing obsolete slugs after splits/merges.
135. Outline → Draft flow lacks detection of missing or duplicate scene IDs.
136. No max-length constraints on scene titles or chapter headers in outline.json.
137. Outline structure does not enforce a minimum viable structure (e.g., at least one act/chapter).
138. Missing distinction between “user-created” vs “auto-generated” scenes in metadata.
139. No detection of outline cycles (scenes referencing each other in loops via beat_refs).
140. Outline storage lacks checksums or integrity markers like drafts/history do.
141. Revisions folder does not enforce chronological sorting for restore operations.
142. No policy defining how conflicting revisions (same unit, same timestamp) are resolved.
143. Revision notes lack a standardized schema for “reason,” “source,” or “category.”
144. No mechanism to prevent circular revision chains during repeated rewrites.
145. Revisions do not track which rubric version was used; breaks reproducibility.
146. No defined behavior when a revision references a draft unit that no longer exists.
147. Revision diffs lack minimum granularity rules (e.g., sentence-level vs line-level).
148. No validation for malformed diff ranges (overlapping, negative, out of bounds).
149. Missing rules for merging multiple diffs into a single coherent revision.
150. No spec for rollback failures when applied diffs conflict with current text.
151. Revision history does not store model metadata (temperature, model name, options).
152. Revisions do not include checksum of pre-revision text, breaking integrity tracking.
153. No retention policy for old revisions; unlimited growth allowed.
154. No documented process for pruning unused or stale revision files.
155. Revision metadata does not specify whether the unit was auto-generated or user-edited.
156. No schema defined for multi-pass critiques stored within a single revision cycle.
157. Critique results lack stable IDs, making cross-referencing or export mapping difficult.
158. critique_rubric lacks versioning; future rubric updates could break old critiques.
159. Suggested edits from critique do not specify the text span context for verification.
160. No rules preventing critique priorities from referencing non-existent categories.
161. critique endpoint does not specify how to handle scenes with zero text.
162. No limit on number of line_comments per critique; risk of runaway output.
163. critique results do not define deterministic ordering for comments.
164. Missing rules for mapping critique comments back to edited text after rewrites.
165. No schema for cross-unit critiques (e.g., continuity notes spanning multiple scenes).
166. History entries do not define rules for merging multiple history records generated within the same second.
167. No deterministic sort order for history entries when timestamps collide.
168. History metadata lacks fields for model version or critique settings used during the action.
169. No schema for differentiating manual vs. automated (AI-triggered) history entries.
170. History restore does not define behavior for partially missing assets (e.g., missing draft files).
171. History system does not specify integrity checks linking drafts, revisions, and outline at a given snapshot.
172. No rule preventing overwrite of history entries by manual edits or corrupted state writes.
173. History folder has no limit or rotation policy, risking unbounded disk growth.
174. History entries lack a required “action type” taxonomy (e.g., rewrite, critique, import, merge).
175. No audit trail linking a critique result to the specific version of text it critiqued.
176. History restore does not define conflict handling between restored drafts and existing revisions.
177. No guidelines for UI to expose partial restores, previews, or diff views before restore.
178. Missing rules for handling history when outline.json schema changes across versions.
179. No fallback behavior when a history entry references a non-existent snapshot version.
180. History rebuild does not validate references to merged/split scene IDs.
181. Missing mechanism for redacting sensitive content in history for privacy mode.
182. No multi-step transaction system to ensure atomic history restore operations.
183. History entries lack “source” metadata (user, auto-save, model, import).
184. Not defined whether history entries should include checksums of all draft units.
185. No policy for associating critique/export actions with specific numbered history states.
186. No detection for corrupted or incomplete history records during load.
187. GUI does not define how to display or warn about missing/corrupted history entries.
188. History format does not future-proof for Phase 9+ fields (analytics metadata, emotional arcs, pacing).
189. No rule for linking history entries to exports, causing potential mismatch.
190. history.json (if present) has no defined schema or validation contract.

## B. Issues by Category

### Privacy & Voice/Audio Scope

- Voice-note endpoints included in API despite being deferred.
- BackupVerifier daemon processes voice notes and snapshots outside phase scope.
- Voice-note API routes active without consent controls or policy alignment.
- voice_notes_transcription.md defines pipeline before Phase 10; misleading future docs included in current doc set.
- architecture.md and endpoints.md disagree on whether voice-note endpoints are allowed.
- policies.md contradicts endpoints.md by forbidding remote processing while endpoints allow external transcription.

### Runtime, Storage & Concurrency

- BackupVerifier reads/writes global `_runtime/` state instead of per-project storage.
- Global `_runtime/` folder used for caches and run ledgers; violates data_model and risks cross-project leakage.
- `_runtime/` writes have no locking; risk of concurrent corruption.
- No TTL or purge rules specified for analytics caches.
- No concurrency model defined for budget deductions across parallel API requests.
- Missing spec for concurrency control when multiple rewrites target the same unit.

### Security & Plugins/Agents

- Plugin runner imports arbitrary Python modules without sandboxing.
- Plugin registry described in docs despite being Phase 11.
- Plugin infrastructure (host.py, registry.py, agents/base.py) implemented before Phase 11.
- plugin_sandbox.md describes sandbox guarantees not reflected in actual implementation.
- agent hook spec is incomplete; missing error propagation and cancellation semantics.

### History & Snapshots

- Logs expose file paths, snapshot IDs, and sensitive metadata.
- snapshots lack digital signatures or tamper detection mechanisms.
- Data model lacks explicit rules for snapshot versioning beyond shallow copies.
- Snapshots stored without compression despite large file sizes.
- No documented limits on number of snapshots or revision history depth.
- History entries do not store environment metadata, making debugging difficult.
- No checksum verification for drafts folder items (only snapshots).
- Revision history does not store model metadata (temperature, model name, options).
- History entries do not define rules for merging multiple history records generated within the same second.
- No deterministic sort order for history entries when timestamps collide.
- History metadata lacks fields for model version or critique settings used during the action.
- No schema for differentiating manual vs. automated (AI-triggered) history entries.
- History restore does not define behavior for partially missing assets (e.g., missing draft files).
- No rule preventing overwrite of history entries by manual edits or corrupted state writes.
- History entries lack a required “action type” taxonomy (e.g., rewrite, critique, import, merge).
- History restore does not define conflict handling between restored drafts and existing revisions.
- No fallback behavior when a history entry references a non-existent snapshot version.
- History rebuild does not validate references to merged/split scene IDs.
- No multi-step transaction system to ensure atomic history restore operations.
- History entries lack “source” metadata (user, auto-save, model, import).
- Not defined whether history entries should include checksums of all draft units.
- No detection for corrupted or incomplete history records during load.
- GUI does not define how to display or warn about missing/corrupted history entries.
- No rule for linking history entries to exports, causing potential mismatch.
- history.json (if present) has no defined schema or validation contract.

### General / Unclassified

- Broad `except Exception` blocks hide failures.
- Floating Story Insights pane documented but not implemented.
- phase9_companion_loop.md included in repo even though feature belongs to Phase 9 and not referenced by Phase 8 deliverables.
- Charter defers cross-platform support, but policies imply Windows-only; unclear future scope.
- Story insights / Project Health pane described as existing but is only a future concept.
- Missing guardrails preventing oversized draft units (e.g., >10k words).
- No specification for handling incomplete or partially-corrupted JSON files.
- Missing documentation for HTTP status codes used by offline/failed model calls.
- Missing validation preventing scenes with duplicate order indexes after manual reordering.
- Missing distinction between “user-created” vs “auto-generated” scenes in metadata.

### Analytics & Phase Scope

- Analytics endpoints (`/analytics/summary`) exist before Phase 9.
- GUI docs describe analytics drawer and conflict heatmap (Phase 9 features).
- Phase log claims analytics already shipping; contradicts phase scope.
- Export pipeline generates `analytics_report.json` before Phase 9.
- Export metadata stores analytics, conflicting with privacy policy.
- Persistent mention of early analytics in overlay treated as shipped instead of experimental.
- Analytics calculations present in exports even when analytics service is not implemented.
- Local analytics utilities used in CompanionOverlay without documentation that they are temporary.
- Analytics included in export bundles without versioning or future-phase gating.
- Analytics visualizations referenced in GUI docs (emotion arc, pacing, heatmap) but hidden conditionally, causing inconsistent documentation.
- Early analytics drawer described before Phase 9, creating mismatched expectations.
- draft_export pipeline writes analytics_report.json even when analytics is disabled.
- analytics_service_spec.md defines full endpoint set despite Phase 9 deferral.
- analytics service code (service.py) exists but unreferenced or partially integrated.
- analytics router exposes `/analytics/summary` and `/analytics/budget` while undocumented in primary endpoints list.
- Companion overlay includes emotion/pacing suggestions without clarity they are heuristics, not analytics engine output.
- GUI layout shows conflict heatmap planned but lacks implementation details, causing spec drift.
- Draft export and critique export services depend on analytics fields not guaranteed to exist.
- Feedback export includes summaries referencing analytics-derived metrics not available in P8.
- Live analytics placeholders appear in code without feature flags.
- analytics.ts utilities operate independently of planned analytics architecture, creating future migration burden.
- analytics payload structure defined in export.py not aligned with Phase 9 spec.
- analytics caching behavior undefined (no TTL, invalidation, or per-project boundaries).
- analytics endpoints conflict with Phase 8 charter; scope not updated or aligned.
- Export metadata contradicts privacy policy regarding analytics/telemetry storage.
- Budget/analytics UI features appear in phase_log but are absent from GUI docs or policies.
- analytics summary endpoint has no access-control rules defined.
- analytics payloads expose revision streaks but no redaction rules exist.
- No schema bump migration guidelines for analytics fields added in later phases.
- Draft generation responses do not include pacing_target units consistently across scenes.
- No defined schema for normalized pacing/emotion data used by overlays.
- No specification for merging outline-level pacing targets with draft-level pacing targets.
- History format does not future-proof for Phase 9+ fields (analytics metadata, emotional arcs, pacing).

### Data Model & Schema

- DraftUnitSchema missing fields required by data_model (e.g., title).
- DraftUnitSchema and data_model scene metadata mismatch (title vs meta fields).
- Duplicate ID detection rules not present in data_model.
- draft/generate does not define timeout behavior for large unit_ids arrays.

### GUI & UX

- Insights surface unclear: overlay vs drawer mismatch between docs.
- GUI docs list docking presets and advanced hotkeys that aren’t shipping.
- phase8_gui_enhancements.md references dock-manager integration not clearly reflected in shipping GUI.
- GUI layouts reference insights drawer conflicting with Phase 8 “overlay” requirement.
- phase_log mentions docking verification that does not match GUI’s “no docking in build” statement.
- GUI safety rules lack references to budget/validation error behavior described in policies.
- Offline banner in GUI requires manual retry; no automatic reconnect logic.
- Hidden dock hotkeys are undocumented and not aligned with shipped features.
- No explicit guidance on maximum request body size for large draft rewrites.

### Exports & External Outputs

- Exports doc includes Phase 10 functionality (dynamic templates, Pandoc, DOCX/EPUB).

### Policies & Privacy

- Spark Pad deliverables mention telemetry despite telemetry being disallowed.
- exports embed model provider details without privacy mode or redaction options.
- Spark Pad charter mentions telemetry despite telemetry being disallowed by policy.
- Revisions folder lacks documented cleanup/rotation policy; can accumulate indefinitely.
- No policy for how obsolete outline entries are handled after major structural rewrites.
- No policy for cross-version compatibility between exports and future app versions.
- No policy for retries or idempotency of draft generation requests.
- No policy for partial failures in batch critiques or partial successes being returned.
- No policy for handling orphaned beat_refs after outline rewrites.
- No policy defining how conflicting revisions (same unit, same timestamp) are resolved.
- No retention policy for old revisions; unlimited growth allowed.
- History folder has no limit or rotation policy, risking unbounded disk growth.
- Missing mechanism for redacting sensitive content in history for privacy mode.
- No policy for associating critique/export actions with specific numbered history states.

### Critique & Rubric

- critique rubric accepts unrestricted content with no server-side sanitization.
- Auto-migration logic undefined for changes in critique rubric categories.
- Missing definitions for error codes returned by draft/rewrite/critique endpoints.
- No deterministic order defined for critique priorities in responses.
- No defined rate limiting behavior for high-volume critique or rewrite calls.
- No specification for backward-compatible changes to critique output schema.
- endpoints.md lacks structured error responses for malformed rubric lists.
- No enforcement preventing critique endpoint from returning excessively large line-by-line notes.
- No validation preventing invalid or nonexistent rubric category names.
- Missing spec on how critique handles mixed rubric modes (custom + default).
- No defined behavior for nested or hierarchical critique tasks.
- critique_rubric lacks versioning; future rubric updates could break old critiques.
- Suggested edits from critique do not specify the text span context for verification.
- No rules preventing critique priorities from referencing non-existent categories.
- critique endpoint does not specify how to handle scenes with zero text.
- No limit on number of line_comments per critique; risk of runaway output.
- critique results do not define deterministic ordering for comments.
- Missing rules for mapping critique comments back to edited text after rewrites.
- No schema for cross-unit critiques (e.g., continuity notes spanning multiple scenes).
- No audit trail linking a critique result to the specific version of text it critiqued.

### Revisions System

- Inconsistent naming conventions between draft units, revision units, and export units.
- Revision diffs do not specify a stable diff schema for future-proofing.
- Revisions do not enforce immutable parent-child relationships after merges/splits.
- No specification for handling orphaned draft or revision files.
- rewrite/critique endpoints do not specify how to handle abandoned/in-progress revisions.
- rewrite diff representation not guaranteed to be stable or human-readable across versions.
- No conflict-resolution rules for simultaneous changes applied by overlap in revisions folder.
- Revisions folder does not enforce chronological sorting for restore operations.
- Revision notes lack a standardized schema for “reason,” “source,” or “category.”
- No mechanism to prevent circular revision chains during repeated rewrites.
- Revisions do not track which rubric version was used; breaks reproducibility.
- No defined behavior when a revision references a draft unit that no longer exists.
- Revision diffs lack minimum granularity rules (e.g., sentence-level vs line-level).
- No validation for malformed diff ranges (overlapping, negative, out of bounds).
- Missing rules for merging multiple diffs into a single coherent revision.
- No spec for rollback failures when applied diffs conflict with current text.
- Revisions do not include checksum of pre-revision text, breaking integrity tracking.
- No documented process for pruning unused or stale revision files.
- Revision metadata does not specify whether the unit was auto-generated or user-edited.
- No schema defined for multi-pass critiques stored within a single revision cycle.
- Critique results lack stable IDs, making cross-referencing or export mapping difficult.
- No guidelines for UI to expose partial restores, previews, or diff views before restore.

### Outline & Structure

- outline.json lacks validation rules for malformed or missing beat_refs.
- No validation prevents circular merges or splits between chapters/scenes.
- No fallback behavior documented when outline/draft ID references fail.
- endpoints.md never states whether deleted scenes/chapters can still be referenced by ID.
- No documented rule for how outline rebuild handles previously locked decisions.
- Wizard decisions do not specify override precedence when conflicting with existing outline metadata.
- Outline rebuild lacks explicit error behavior when acts or chapters are missing.
- No guaranteed stable ordering for chapters without explicit “order” fields.
- Missing normalization pass for whitespace, punctuation, and formatting in outline titles.
- Outline builder does not specify handling for empty or null scene titles.
- Wizard → Outline flow lacks a deterministic rule for conflicting POV assignments.
- Missing rule for what happens if outline.json is partially corrupted or only half-readable.
- No schema for fallback outline reconstruction (e.g., rebuilding from drafts folder).
- History system does not specify rules for outline-level versioning.
- No clear rollback mechanism described for outline rebuild failures.
- Outline builder does not validate beat_refs target IDs before generating chapters/scenes.
- No consistency check ensuring beat_refs do not reference a future or later scene improperly.
- Outline builder can output scenes missing purpose/goal fields without warnings.
- No standardization for outline slugs (slug history vs. slug regeneration undefined).
- Missing lifecycle rules for removing obsolete slugs after splits/merges.
- Outline → Draft flow lacks detection of missing or duplicate scene IDs.
- No max-length constraints on scene titles or chapter headers in outline.json.
- Outline structure does not enforce a minimum viable structure (e.g., at least one act/chapter).
- No detection of outline cycles (scenes referencing each other in loops via beat_refs).
- Outline storage lacks checksums or integrity markers like drafts/history do.
- History system does not specify integrity checks linking drafts, revisions, and outline at a given snapshot.
- Missing rules for handling history when outline.json schema changes across versions.

### API & Endpoints

- endpoints.md lacks pagination rules for list-style endpoints.
- Missing endpoint-level versioning strategy for future API changes.
- Rewrite endpoint does not define constraints for multi-unit rewrites or batch operations.
- endpoints lacking authentication/authorization scaffold for future multi-user workflows.
- Lack of deterministic ordering for units returned by /draft/generate.
- API does not specify behavior for empty or whitespace-only instructions in rewrite calls.
- No guarantee that API returns consistent encoding (UTF-8) for text fields.

### Budgeting, Limits & Reliability

- No retry/backoff rules defined for failed AI model interactions.
