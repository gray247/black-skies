# Phase 9 Candidate Themes

This document translates the 162 residual Phase 8 audit bullets (see `phase8_residual_backlog.md`) into a handful of strategic Phase 9 themes. Each theme lists a short description, a sample of the backlog issues it covers (with original issue numbers and suggested P9 tags), and a priority recommendation.

## 1. Analytics system & dashboards (High)
Continue to gate and complete the analytics service, story insights drawer, and related exports. The backlog includes numerous docs and code notes (analysis drawer copy, floating Story Insights, companion heuristics, analytics metadata in exports) that remain speculative until the analytics stack ships.
- **Relevant backlog issues:** #11, #12, #16, #20, #22, #23, #24, #25, #26, #28, #29, #30, #31, #32, #37–#44, #55–#58, #65, #66, #72, #73, #84, #88–#90 (see future tags such as `P9-ANALYTICS-016`, `P9-ANALYTICS-037`, `P9-ANALYTICS-018`, `P9-ANALYTICS-058`).
- **Priority:** High

## 2. API & schema validation tightening (High)
Lock down DraftUnit/outline/critique schemas, endpoint validation, error codes, rate-limiting, concurrency, and contract behaviors before widening the API surface.
- **Relevant backlog issues:** #15, #48, #55, #58, #64, #67, plus the contiguous security/validation bullets #85–#115 and #118–#139 covering missing constraints, payload rules, ordering guarantees, and retry/backoff behavior (see tags such as `P9-REVISION-015`, `P9-GENERAL-111`).
- **Priority:** High

## 3. Outline & revision integrity rules (High)
Strengthen the revision folder by enforcing naming conventions, duplication detection, rotation policies, checksum verification, and immutable parent-child relationships, especially around merges/splits.
- **Relevant backlog issues:** #69–#84, #90, #96–#110, #118–#125, #129–#138, #140–#144, #148–#154, #162–#174 (tags such as `P9-REVISION-070`, `P9-REVISION-078`, `P9-REVISION-080`, `P9-REVISION-061`, `P9-REVISION-071`).
- **Priority:** High

## 4. Snapshot/recovery & history safety (Medium)
Define tamper detection, retention, compression, and restore guidance for history snapshots so recovery flows remain trustworthy.
- **Relevant backlog issues:** #51, #61, #71, #177 (tags such as `P9-REVISION-061`, `P9-REVISION-071`, `P9-UX-177`).
- **Priority:** Medium

## 5. GUI polish & UX consistency (Medium)
Align GUI docs and state with what ships: hide deferred docking/hotkeys, clarify offline banners, and document the actual drawer/overlay behavior.
- **Relevant backlog issues:** #17, #21, #27, #36, #60, #63, #65, #177 (see `P9-UX-051`, `P9-UX-177`, `P9-UX-060`).
- **Priority:** Medium

## 6. Plugin sandbox maturity (Medium)
Once the plugin infrastructure is ready, revisit the sandbox guarantees, manifest hygiene, and agent hook/error-handling documentation.
- **Relevant backlog issues:** #19, #33, #34, #152–#156 (tags such as `P9-PLUGIN-019`, `P9-PLUGIN-033`, `P9-PLUGIN-034`).
- **Priority:** Medium

## 7. Export pipeline improvements (Medium)
Decide which export capabilities ship (templates, Pandoc, DOCX/EPUB) and how sensitive metadata is handled so the docs/UX stop promoting Phase 10 behavior in Phase 9.
- **Relevant backlog issues:** #18, #40, #58, #125, #128 (see `P9-ANALYTICS-018`, `P9-ANALYTICS-058`).
- **Priority:** Medium

## 8. General infrastructure & policy maintenance (Low)
Handle the remaining documents and policy statements that touch voice docs, budget concurrency, and governance but didn’t fit the other buckets.
- **Relevant backlog issues:** #35, #59, #79, #111, #190 (tags such as `P9-GENERAL-035`, `P9-GENERAL-059`, `P9-GENERAL-079`, `P9-GENERAL-111`).
- **Priority:** Low

## Theme counts
- Analytics: 64 items  
- API/contracts: 47 items  
- Outline/revision: 32 items  
- Snapshot/history: 4 items  
- GUI/UX: 6 items  
- Plugin: 3 items  
- Export: 2 items  
- General: 4 items
