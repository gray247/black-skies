Status: Draft
Version: 0.9.0
Last Reviewed: 2025-11-15

# Scene Rewrite Assistant Design

## Objective
Deliver the “AI scene rewrite assistant” called out in phase P8 by providing guided rewrite suggestions, full-scene rewrites, and optional diff output integrated with the Draft service.

## Placement
- Implemented as part of the Draft service to leverage existing outline metadata, budget accounting, and snapshot flow.
- New REST endpoint: `POST /api/v1/draft/rewrite`.
- Renderer reuses Draft workspace UI (DraftEditor) with a dedicated “Rewrite” panel.

## Request Contract
```jsonc
{
  "project_id": "proj_demo",
  "unit_id": "sc_0005",
  "rewrite_type": "guided",           // guided | full | paragraph
  "focus": ["pacing", "voice"],       // optional emphasis tags
  "constraints": {
    "max_tokens": 1200,
    "preserve_pov": true,
    "preserve_word_target": true
  },
  "prompt_overrides": {
    "tone": "noir",
    "summary": "Ezra interrogates the caretaker."
  }
}
```

## Response Contract
```jsonc
{
  "project_id": "proj_demo",
  "unit_id": "sc_0005",
  "schema_version": "DraftRewriteResult v1",
  "rewrite": {
    "text": "<rewritten scene>",
    "meta": {
      "word_count": 1280,
      "estimated_cost_usd": 0.38,
      "focus_applied": ["pacing", "voice"]
    }
  },
  "diff": {
    "anchors": { "left": 110, "right": 95 },
    "added": [...],
    "removed": [...],
    "changed": [...]
  },
  "budget": {
    "status": "ok",
    "estimated_usd": 0.38,
    "spent_usd": 3.12,
    "soft_limit_usd": 5.0,
    "hard_limit_usd": 10.0,
    "total_after_usd": 3.5
  },
  "trace_id": "..."
}
```

## Processing Steps
1. Validate request (`rewrite_type`, `unit_id`, budget guard rails).
2. Load current scene draft via `read_scene_document`.
3. Construct prompt template:
   - Include outline summary, scene front matter, beats list.
   - Apply `focus` tags to emphasise critique categories.
   - Insert `prompt_overrides` for tone, summary adjustments.
4. Call rewrite engine (initially placeholder deterministic rewrite; future integration with hosted LLM).
5. Compute diff against original text using `compute_diff`.
6. Estimate token usage and cost (reuse budgeting helpers).
7. Return payload; optionally cache rewrites with fingerprint for undo.

## Budget Integration
- Reuse `classify_budget` for preflight budgets.
- Rewrite requests deduct spend only upon user acceptance (similar to DraftAccept). Estimated cost returned upfront.
- Track rewrite attempts in project budget metadata under `rewrites` section for analytics.

## Moderation & Safety
- Enforce blocked categories (same list as critique policies) before request submission.
- Apply LLM moderation (if using external provider) and redact harmful content.
- Provide fallback message when moderation fails.

## UI Flow
- User opens scene in DraftEditor → selects “Rewrite Scene”.
- Preflight call shows estimated cost and focus options.
- After response user can accept rewrite (moves through DraftAccept pipeline) or discard.
- UI shows diff summary, applied focus, and budget impact.

## Future Enhancements
- Allow partial paragraph selection with `rewrite_span` metadata.
- Support iterative rewrites referencing prior assistant output.
- Add telemetry for rewrite success vs. discard rates.
