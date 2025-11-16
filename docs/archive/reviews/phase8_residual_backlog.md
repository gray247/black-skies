Status: Archived
Version: 0.1.0
Last Reviewed: 2025-11-15

# Phase 8 Residual Backlog

This file partitions the original Phase 8 master list into issues addressed by the Phase 8 fixes, items destined for the Phase 9+ backlog, and a tiny set needing manual review.

## Covered by Phase 8 fixes

- #1 Voice-note endpoints included in API despite being deferred. (Handled by P8-001 voice gating docs.)

- #2 BackupVerifier daemon processes voice notes and snapshots outside phase scope. (Handled by P8-002 backup scope gating.)

- #3 BackupVerifier reads/writes global `_runtime/` state instead of per-project storage. (Handled by P8-003 per-project history cache.)

- #4 Global `_runtime/` folder used for caches and run ledgers; violates data_model and risks cross-project leakage. (Handled by P8-004/_runtime hardening + P8-008 atomic writes.)

- #5 Plugin runner imports arbitrary Python modules without sandboxing. (Handled by P8-005 plugin guard.)

- #6 Logs expose file paths, snapshot IDs, and sensitive metadata. (Handled by P8-006 diagnostic redaction.)

- #7 Broad `except Exception` blocks hide failures. (Handled by P8-007 exception chaining.)

- #8 `_runtime/` writes have no locking; risk of concurrent corruption. (Handled by P8-008 atomic write guards.)

- #9 Analytics endpoints (`/analytics/summary`) exist before Phase 9. (Handled by P8-009 analytics gating.)

- #10 Voice-note API routes active without consent controls or policy alignment. (Handled by P8-001 voice gating docs.)

- #11 GUI docs describe analytics drawer and conflict heatmap (Phase 9 features). (Handled by P8-009 docs updates.)

- #12 Phase log claims analytics already shipping; contradicts phase scope. (Handled by P8-009 docs updates.)

- #13 Export pipeline generates `analytics_report.json` before Phase 9. (Handled by P8-009 export gating.)

- #14 Export metadata stores analytics, conflicting with privacy policy. (Handled by P8-009 export gating.)

- #22 Persistent mention of early analytics in overlay treated as shipped instead of experimental. (Handled by P8-009 docs updates.)

- #23 Analytics calculations present in exports even when analytics service is not implemented. (Handled by P8-009 export gating.)

- #25 Analytics included in export bundles without versioning or future-phase gating. (Handled by P8-009 export gating.)

- #26 Analytics visualizations referenced in GUI docs (emotion arc, pacing, heatmap) but hidden conditionally, causing inconsistent documentation. (Handled by P8-009 docs updates.)

- #28 Early analytics drawer described before Phase 9, creating mismatched expectations. (Handled by P8-009 docs updates.)

- #29 draft_export pipeline writes analytics_report.json even when analytics is disabled. (Handled by P8-009 export gating.)

- #30 analytics_service_spec.md defines full endpoint set despite Phase 9 deferral. (Handled by P8-009 docs updates.)

- #32 analytics router exposes `/analytics/summary` and `/analytics/budget` while undocumented in primary endpoints list. (Handled by P8-009 router gating.)

- #45 architecture.md and endpoints.md disagree on whether voice-note endpoints are allowed. (Handled by P8-001 docs alignment.)

- #46 policies.md contradicts endpoints.md by forbidding remote processing while endpoints allow external transcription. (Handled by P8-001 docs alignment.)

- #47 analytics endpoints conflict with Phase 8 charter; scope not updated or aligned. (Handled by P8-009 docs gating.)

- #50 Export metadata contradicts privacy policy regarding analytics/telemetry storage. (Handled by P8-009 export/privacy docs.)

## Phase 9+ backlog

1. #15 DraftUnitSchema missing fields required by data_model (e.g., title). (Future TAG: P9-REVISION-015)

2. #16 Insights surface unclear: overlay vs drawer mismatch between docs. (Future TAG: P9-ANALYTICS-016)

3. #17 GUI docs list docking presets and advanced hotkeys that aren’t shipping. (Future TAG: P9-UX-017)

4. #18 Exports doc includes Phase 10 functionality (dynamic templates, Pandoc, DOCX/EPUB). (Future TAG: P9-ANALYTICS-018)

5. #19 Plugin registry described in docs despite being Phase 11. (Future TAG: P9-PLUGIN-019)

6. #20 Floating Story Insights pane documented but not implemented. (Future TAG: P9-ANALYTICS-020)

7. #21 Spark Pad deliverables mention telemetry despite telemetry being disallowed. (Future TAG: P9-GENERAL-021)

8. #24 Local analytics utilities used in CompanionOverlay without documentation that they are temporary. (Future TAG: P9-ANALYTICS-024)

9. #27 phase8_gui_enhancements.md references dock-manager integration not clearly reflected in shipping GUI. (Future TAG: P9-UX-027)

10. #31 analytics service code (service.py) exists but unreferenced or partially integrated. (Future TAG: P9-ANALYTICS-031)

11. #33 Plugin infrastructure (host.py, registry.py, agents/base.py) implemented before Phase 11. (Future TAG: P9-PLUGIN-033)

12. #34 plugin_sandbox.md describes sandbox guarantees not reflected in actual implementation. (Future TAG: P9-PLUGIN-034)

13. #35 voice_notes_transcription.md defines pipeline before Phase 10; misleading future docs included in current doc set. (Future TAG: P9-GENERAL-035)

14. #36 phase9_companion_loop.md included in repo even though feature belongs to Phase 9 and not referenced by Phase 8 deliverables. (Future TAG: P9-GENERAL-036)

15. #37 Companion overlay includes emotion/pacing suggestions without clarity they are heuristics, not analytics engine output. (Future TAG: P9-ANALYTICS-037)

16. #38 GUI layout shows conflict heatmap planned but lacks implementation details, causing spec drift. (Future TAG: P9-ANALYTICS-038)

17. #39 Draft export and critique export services depend on analytics fields not guaranteed to exist. (Future TAG: P9-ANALYTICS-039)

18. #40 Feedback export includes summaries referencing analytics-derived metrics not available in P8. (Future TAG: P9-ANALYTICS-040)

19. #41 Live analytics placeholders appear in code without feature flags. (Future TAG: P9-ANALYTICS-041)

20. #42 analytics.ts utilities operate independently of planned analytics architecture, creating future migration burden. (Future TAG: P9-ANALYTICS-042)

21. #43 analytics payload structure defined in export.py not aligned with Phase 9 spec. (Future TAG: P9-ANALYTICS-043)

22. #44 analytics caching behavior undefined (no TTL, invalidation, or per-project boundaries). (Future TAG: P9-ANALYTICS-044)

23. #48 DraftUnitSchema and data_model scene metadata mismatch (title vs meta fields). (Future TAG: P9-REVISION-048)

24. #49 GUI layouts reference insights drawer conflicting with Phase 8 “overlay” requirement. (Future TAG: P9-ANALYTICS-049)

25. #51 phase_log mentions docking verification that does not match GUI’s “no docking in build” statement. (Future TAG: P9-UX-051)

26. #52 Budget/analytics UI features appear in phase_log but are absent from GUI docs or policies. (Future TAG: P9-ANALYTICS-052)

27. #55 analytics summary endpoint has no access-control rules defined. (Future TAG: P9-ANALYTICS-055)

28. #56 No TTL or purge rules specified for analytics caches. (Future TAG: P9-ANALYTICS-056)

29. #57 analytics payloads expose revision streaks but no redaction rules exist. (Future TAG: P9-ANALYTICS-057)

30. #58 exports embed model provider details without privacy mode or redaction options. (Future TAG: P9-ANALYTICS-058)

31. #59 No concurrency model defined for budget deductions across parallel API requests. (Future TAG: P9-GENERAL-059)

32. #60 Offline banner in GUI requires manual retry; no automatic reconnect logic. (Future TAG: P9-UX-060)

33. #61 snapshots lack digital signatures or tamper detection mechanisms. (Future TAG: P9-REVISION-061)

34. #62 critique rubric accepts unrestricted content with no server-side sanitization. (Future TAG: P9-REVISION-062)

35. #63 Hidden dock hotkeys are undocumented and not aligned with shipped features. (Future TAG: P9-UX-063)

36. #64 agent hook spec is incomplete; missing error propagation and cancellation semantics. (Future TAG: P9-PLUGIN-064)

37. #65 Story insights / Project Health pane described as existing but is only a future concept. (Future TAG: P9-ANALYTICS-065)

38. #66 Spark Pad charter mentions telemetry despite telemetry being disallowed by policy. (Future TAG: P9-GENERAL-066)

39. #67 Data model lacks explicit rules for snapshot versioning beyond shallow copies. (Future TAG: P9-REVISION-067)

40. #68 No schema bump migration guidelines for analytics fields added in later phases. (Future TAG: P9-ANALYTICS-068)

41. #69 Inconsistent naming conventions between draft units, revision units, and export units. (Future TAG: P9-ANALYTICS-069)

42. #70 Revisions folder lacks documented cleanup/rotation policy; can accumulate indefinitely. (Future TAG: P9-REVISION-070)

43. #71 Snapshots stored without compression despite large file sizes. (Future TAG: P9-REVISION-071)

44. #72 No documented limits on number of snapshots or revision history depth. (Future TAG: P9-ANALYTICS-072)

45. #73 Draft generation responses do not include pacing_target units consistently across scenes. (Future TAG: P9-ANALYTICS-073)

46. #74 outline.json lacks validation rules for malformed or missing beat_refs. (Future TAG: P9-REVISION-074)

47. #75 History entries do not store environment metadata, making debugging difficult. (Future TAG: P9-ANALYTICS-075)

48. #76 Revision diffs do not specify a stable diff schema for future-proofing. (Future TAG: P9-REVISION-076)

49. #77 No validation prevents circular merges or splits between chapters/scenes. (Future TAG: P9-REVISION-077)

50. #78 Revisions do not enforce immutable parent-child relationships after merges/splits. (Future TAG: P9-REVISION-078)

51. #79 Duplicate ID detection rules not present in data_model. (Future TAG: P9-GENERAL-079)

52. #80 No specification for handling orphaned draft or revision files. (Future TAG: P9-REVISION-080)

53. #81 Auto-migration logic undefined for changes in critique rubric categories. (Future TAG: P9-REVISION-081)

54. #82 No checksum verification for drafts folder items (only snapshots). (Future TAG: P9-REVISION-082)

55. #83 No policy for how obsolete outline entries are handled after major structural rewrites. (Future TAG: P9-REVISION-083)

56. #84 No policy for cross-version compatibility between exports and future app versions. (Future TAG: P9-ANALYTICS-084)

57. #85 Missing definitions for error codes returned by draft/rewrite/critique endpoints. (Future TAG: P9-REVISION-085)

58. #86 No fallback behavior documented when outline/draft ID references fail. (Future TAG: P9-REVISION-086)

59. #87 No deterministic order defined for critique priorities in responses. (Future TAG: P9-REVISION-087)

60. #88 No defined schema for normalized pacing/emotion data used by overlays. (Future TAG: P9-ANALYTICS-088)

61. #89 Missing guardrails preventing oversized draft units (e.g., >10k words). (Future TAG: P9-REVISION-089)

62. #90 No specification for handling incomplete or partially-corrupted JSON files. (Future TAG: P9-GENERAL-090)

63. #91 endpoints.md lacks pagination rules for list-style endpoints. (Future TAG: P9-GENERAL-091)

64. #92 No defined rate limiting behavior for high-volume critique or rewrite calls. (Future TAG: P9-REVISION-092)

65. #93 Missing endpoint-level versioning strategy for future API changes. (Future TAG: P9-GENERAL-093)

66. #94 No specification for backward-compatible changes to critique output schema. (Future TAG: P9-REVISION-094)

67. #95 Rewrite endpoint does not define constraints for multi-unit rewrites or batch operations. (Future TAG: P9-GENERAL-095)

68. #96 draft/generate does not define timeout behavior for large unit_ids arrays. (Future TAG: P9-REVISION-096)

69. #97 rewrite/critique endpoints do not specify how to handle abandoned/in-progress revisions. (Future TAG: P9-REVISION-097)

70. #98 No policy for retries or idempotency of draft generation requests. (Future TAG: P9-REVISION-098)

71. #99 endpoints.md lacks structured error responses for malformed rubric lists. (Future TAG: P9-REVISION-099)

72. #100 rewrite diff representation not guaranteed to be stable or human-readable across versions. (Future TAG: P9-GENERAL-100)

73. #101 No enforcement preventing critique endpoint from returning excessively large line-by-line notes. (Future TAG: P9-REVISION-101)

74. #102 Missing documentation for HTTP status codes used by offline/failed model calls. (Future TAG: P9-GENERAL-102)

75. #103 endpoints lacking authentication/authorization scaffold for future multi-user workflows. (Future TAG: P9-GENERAL-103)

76. #104 No explicit guidance on maximum request body size for large draft rewrites. (Future TAG: P9-UX-104)

77. #105 Missing spec for concurrency control when multiple rewrites target the same unit. (Future TAG: P9-GENERAL-105)

78. #106 No retry/backoff rules defined for failed AI model interactions. (Future TAG: P9-GENERAL-106)

79. #107 No policy for partial failures in batch critiques or partial successes being returned. (Future TAG: P9-REVISION-107)

80. #108 Lack of deterministic ordering for units returned by /draft/generate. (Future TAG: P9-REVISION-108)

81. #109 No validation preventing invalid or nonexistent rubric category names. (Future TAG: P9-REVISION-109)

82. #110 Missing spec on how critique handles mixed rubric modes (custom + default). (Future TAG: P9-REVISION-110)

83. #111 API does not specify behavior for empty or whitespace-only instructions in rewrite calls. (Future TAG: P9-GENERAL-111)

84. #112 No conflict-resolution rules for simultaneous changes applied by overlap in revisions folder. (Future TAG: P9-ANALYTICS-112)

85. #113 endpoints.md never states whether deleted scenes/chapters can still be referenced by ID. (Future TAG: P9-REVISION-113)

86. #114 No defined behavior for nested or hierarchical critique tasks. (Future TAG: P9-REVISION-114)

87. #115 No guarantee that API returns consistent encoding (UTF-8) for text fields. (Future TAG: P9-GENERAL-115)

88. #116 No documented rule for how outline rebuild handles previously locked decisions. (Future TAG: P9-REVISION-116)

89. #117 Wizard decisions do not specify override precedence when conflicting with existing outline metadata. (Future TAG: P9-ANALYTICS-117)

90. #118 Missing validation preventing scenes with duplicate order indexes after manual reordering. (Future TAG: P9-REVISION-118)

91. #119 No policy for handling orphaned beat_refs after outline rewrites. (Future TAG: P9-REVISION-119)

92. #120 Outline rebuild lacks explicit error behavior when acts or chapters are missing. (Future TAG: P9-REVISION-120)

93. #121 No guaranteed stable ordering for chapters without explicit “order” fields. (Future TAG: P9-GENERAL-121)

94. #122 Missing normalization pass for whitespace, punctuation, and formatting in outline titles. (Future TAG: P9-REVISION-122)

95. #123 Outline builder does not specify handling for empty or null scene titles. (Future TAG: P9-REVISION-123)

96. #124 No specification for merging outline-level pacing targets with draft-level pacing targets. (Future TAG: P9-ANALYTICS-124)

97. #125 Wizard → Outline flow lacks a deterministic rule for conflicting POV assignments. (Future TAG: P9-ANALYTICS-125)

98. #126 Missing rule for what happens if outline.json is partially corrupted or only half-readable. (Future TAG: P9-REVISION-126)

99. #127 No schema for fallback outline reconstruction (e.g., rebuilding from drafts folder). (Future TAG: P9-REVISION-127)

100. #128 History system does not specify rules for outline-level versioning. (Future TAG: P9-ANALYTICS-128)

101. #129 No clear rollback mechanism described for outline rebuild failures. (Future TAG: P9-REVISION-129)

102. #130 Outline builder does not validate beat_refs target IDs before generating chapters/scenes. (Future TAG: P9-REVISION-130)

103. #131 No consistency check ensuring beat_refs do not reference a future or later scene improperly. (Future TAG: P9-REVISION-131)

104. #132 Outline builder can output scenes missing purpose/goal fields without warnings. (Future TAG: P9-REVISION-132)

105. #133 No standardization for outline slugs (slug history vs. slug regeneration undefined). (Future TAG: P9-ANALYTICS-133)

106. #134 Missing lifecycle rules for removing obsolete slugs after splits/merges. (Future TAG: P9-GENERAL-134)

107. #135 Outline → Draft flow lacks detection of missing or duplicate scene IDs. (Future TAG: P9-REVISION-135)

108. #136 No max-length constraints on scene titles or chapter headers in outline.json. (Future TAG: P9-REVISION-136)

109. #137 Outline structure does not enforce a minimum viable structure (e.g., at least one act/chapter). (Future TAG: P9-REVISION-137)

110. #138 Missing distinction between “user-created” vs “auto-generated” scenes in metadata. (Future TAG: P9-REVISION-138)

111. #139 No detection of outline cycles (scenes referencing each other in loops via beat_refs). (Future TAG: P9-REVISION-139)

112. #140 Outline storage lacks checksums or integrity markers like drafts/history do. (Future TAG: P9-ANALYTICS-140)

113. #141 Revisions folder does not enforce chronological sorting for restore operations. (Future TAG: P9-REVISION-141)

114. #142 No policy defining how conflicting revisions (same unit, same timestamp) are resolved. (Future TAG: P9-ANALYTICS-142)

115. #143 Revision notes lack a standardized schema for “reason,” “source,” or “category.” (Future TAG: P9-REVISION-143)

116. #144 No mechanism to prevent circular revision chains during repeated rewrites. (Future TAG: P9-REVISION-144)

117. #145 Revisions do not track which rubric version was used; breaks reproducibility. (Future TAG: P9-REVISION-145)

118. #146 No defined behavior when a revision references a draft unit that no longer exists. (Future TAG: P9-REVISION-146)

119. #147 Revision diffs lack minimum granularity rules (e.g., sentence-level vs line-level). (Future TAG: P9-REVISION-147)

120. #148 No validation for malformed diff ranges (overlapping, negative, out of bounds). (Future TAG: P9-GENERAL-148)

121. #149 Missing rules for merging multiple diffs into a single coherent revision. (Future TAG: P9-REVISION-149)

122. #150 No spec for rollback failures when applied diffs conflict with current text. (Future TAG: P9-ANALYTICS-150)

123. #151 Revision history does not store model metadata (temperature, model name, options). (Future TAG: P9-ANALYTICS-151)

124. #152 Revisions do not include checksum of pre-revision text, breaking integrity tracking. (Future TAG: P9-REVISION-152)

125. #153 No retention policy for old revisions; unlimited growth allowed. (Future TAG: P9-REVISION-153)

126. #154 No documented process for pruning unused or stale revision files. (Future TAG: P9-REVISION-154)

127. #155 Revision metadata does not specify whether the unit was auto-generated or user-edited. (Future TAG: P9-REVISION-155)

128. #156 No schema defined for multi-pass critiques stored within a single revision cycle. (Future TAG: P9-REVISION-156)

129. #157 Critique results lack stable IDs, making cross-referencing or export mapping difficult. (Future TAG: P9-ANALYTICS-157)

130. #158 critique_rubric lacks versioning; future rubric updates could break old critiques. (Future TAG: P9-REVISION-158)

131. #159 Suggested edits from critique do not specify the text span context for verification. (Future TAG: P9-REVISION-159)

132. #160 No rules preventing critique priorities from referencing non-existent categories. (Future TAG: P9-REVISION-160)

133. #161 critique endpoint does not specify how to handle scenes with zero text. (Future TAG: P9-REVISION-161)

134. #162 No limit on number of line_comments per critique; risk of runaway output. (Future TAG: P9-REVISION-162)

135. #163 critique results do not define deterministic ordering for comments. (Future TAG: P9-REVISION-163)

136. #164 Missing rules for mapping critique comments back to edited text after rewrites. (Future TAG: P9-REVISION-164)

137. #165 No schema for cross-unit critiques (e.g., continuity notes spanning multiple scenes). (Future TAG: P9-REVISION-165)

138. #166 History entries do not define rules for merging multiple history records generated within the same second. (Future TAG: P9-ANALYTICS-166)

139. #167 No deterministic sort order for history entries when timestamps collide. (Future TAG: P9-ANALYTICS-167)

140. #168 History metadata lacks fields for model version or critique settings used during the action. (Future TAG: P9-ANALYTICS-168)

141. #169 No schema for differentiating manual vs. automated (AI-triggered) history entries. (Future TAG: P9-ANALYTICS-169)

142. #170 History restore does not define behavior for partially missing assets (e.g., missing draft files). (Future TAG: P9-ANALYTICS-170)

143. #171 History system does not specify integrity checks linking drafts, revisions, and outline at a given snapshot. (Future TAG: P9-ANALYTICS-171)

144. #172 No rule preventing overwrite of history entries by manual edits or corrupted state writes. (Future TAG: P9-ANALYTICS-172)

145. #173 History folder has no limit or rotation policy, risking unbounded disk growth. (Future TAG: P9-ANALYTICS-173)

146. #174 History entries lack a required “action type” taxonomy (e.g., rewrite, critique, import, merge). (Future TAG: P9-ANALYTICS-174)

147. #175 No audit trail linking a critique result to the specific version of text it critiqued. (Future TAG: P9-REVISION-175)

148. #176 History restore does not define conflict handling between restored drafts and existing revisions. (Future TAG: P9-ANALYTICS-176)

149. #177 No guidelines for UI to expose partial restores, previews, or diff views before restore. (Future TAG: P9-UX-177)

150. #178 Missing rules for handling history when outline.json schema changes across versions. (Future TAG: P9-ANALYTICS-178)

151. #179 No fallback behavior when a history entry references a non-existent snapshot version. (Future TAG: P9-ANALYTICS-179)

152. #180 History rebuild does not validate references to merged/split scene IDs. (Future TAG: P9-ANALYTICS-180)

153. #181 Missing mechanism for redacting sensitive content in history for privacy mode. (Future TAG: P9-ANALYTICS-181)

154. #182 No multi-step transaction system to ensure atomic history restore operations. (Future TAG: P9-ANALYTICS-182)

155. #183 History entries lack “source” metadata (user, auto-save, model, import). (Future TAG: P9-ANALYTICS-183)

156. #184 Not defined whether history entries should include checksums of all draft units. (Future TAG: P9-ANALYTICS-184)

157. #185 No policy for associating critique/export actions with specific numbered history states. (Future TAG: P9-ANALYTICS-185)

158. #186 No detection for corrupted or incomplete history records during load. (Future TAG: P9-ANALYTICS-186)

159. #187 GUI does not define how to display or warn about missing/corrupted history entries. (Future TAG: P9-ANALYTICS-187)

160. #188 History format does not future-proof for Phase 9+ fields (analytics metadata, emotional arcs, pacing). (Future TAG: P9-ANALYTICS-188)

161. #189 No rule for linking history entries to exports, causing potential mismatch. (Future TAG: P9-ANALYTICS-189)

162. #190 history.json (if present) has no defined schema or validation contract. (Future TAG: P9-ANALYTICS-190)

## Unclear / needs manual review

- #53 Charter defers cross-platform support, but policies imply Windows-only; unclear future scope. (Needs manual review for relevance to Phase 9 scope.)

- #54 GUI safety rules lack references to budget/validation error behavior described in policies. (Needs manual review for relevance to Phase 9 scope.)
