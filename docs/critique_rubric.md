# docs/critique_rubric.md — Critique Rubric & Output (Source of truth)
**Status:** LOCKED · 2025-09-23
**Version:** v1

Categories are used by services and the GUI to filter feedback. Output must validate against **CritiqueOutputSchema v1** (see below).

## Categories (baseline)
- Logic
- Continuity
- Character
- Pacing
- Prose
- Horror

## Output shape — CritiqueOutputSchema v1
```json
{
  "unit_id": "sc_0001",
  "schema_version": "CritiqueOutputSchema v1",
  "summary": "Clear goal/stakes. Mid-scene lulls around lines 48–55.",
  "line_comments": [
    { "line": 52, "note": "Break this sentence; sustain tension." }
  ],
  "priorities": [
    "Tighten run-ons at 48–55",
    "Keep POV strict; remove two omniscient asides"
  ],
  "suggested_edits": [
    { "range": [410, 432], "replacement": "She kills the light and listens." }
  ],
  "model": { "name": "critique_model_vY", "provider": "openai" }
}
```

## Notes
- Categories are filter chips in the UI; they don’t change the schema.  
- Services may include only a subset of categories per run.
