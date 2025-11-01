# Smart Merge Tool – Design Outline (Phase 11)
**Status:** In progress (T-9144) · 2025-10-07  
**Owner:** Desktop Editor Team  
**Charter Reference:** docs/phase_charter.md §72

## Objective
Provide an assisted merge workflow to safely combine scene/chapter branches, preserving conflicts and annotations without manual copy/paste.

## User Stories
1. As an editor, I can select two scene variants and preview a merged output with highlight of conflicts.
2. As a reviewer, I can accept/reject merge hunks, similar to a 3-way diff tool.
3. As a project maintainer, I can track merge history for auditing.

## Functional Requirements
- **Inputs:** base scene, left variant, right variant (pulled from snapshots or draft history).
- **Merge algorithm:** 3-way diff (e.g., `merge3`), preserving Markdown structure and front matter.
- **Conflict UI:** Show conflict blocks with inline accept-left/accept-right/keep-both options.
- **Annotations preservation:** retain comments/rubric notes attached to text ranges.
- **History entry:** record merged snapshot + conflict resolution summary.
- **Integration:** accessible from Draft Editor “Smart Merge” action and Batch Critique summary.

## Architecture Plan
- **Service layer:** `services/src/blackskies/services/merge.py` exposing `merge_scene_variants`.
  - Accepts three payloads, returns merged text + conflict markers.
  - Emits diagnostics if structural conflicts remain unresolved.
- **Renderer:** React component using CodeMirror merge view (Phase 11 gating).
  - Hotkeys for next/previous conflict, accept left/right.
  - Budget note: merges are offline and incur no service spend.

## Task Breakdown
1. **Algorithm spike:** evaluate python `merge3` or `diff-match-patch` for Markdown (Phase 11.0).
2. **Service endpoint:** `/api/v1/draft/merge` (POST) returning `merged_text` + `conflicts` array (Phase 11.1).
3. **Renderer UI:** integrate merge view + controls (Phase 11.2).
4. **Annotations:** ensure inline notes survive merge (Phase 11.3).
5. **History:** persist merge metadata (`history/merges/`) (Phase 11.4).
6. **Tests:** unit tests for merge edge cases; integration tests with sample scenes (Phase 11.5).
7. **Docs:** update support playbook, editor guide, release checklist (Phase 11.6).

## Open Questions
- Do we support multi-file merges (chapters with multiple scenes) in Phase 11 or defer?
- How are conflicts represented in Markdown (custom markers vs. HTML comments)?
- Should merges auto-trigger critiques or analytics refresh?

## Dependencies
- Draft history snapshots (must ensure base/variant retrieval).
- Docking editor improvements for the merge UI.
