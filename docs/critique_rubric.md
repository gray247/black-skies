# docs/critique_rubric.md — Critique Spec (Source of truth)
**Status:** LOCKED · 2025-09-15  
Covers: categories and output schema for critiques.  
References: `/draft/critique` in `docs/endpoints.md` for transport details.

## Categories (baseline)
- Story Logic — causality, goals, stakes, payoff.
- Continuity — POV consistency, timeline, names/traits.
- Character — motivation, agency, voice.
- Pacing — compress/expand, scene purpose clarity.
- Prose — clarity, specificity, cliché reduction.
- **Horror Lever** — dread layering, sensory specificity, escalation beats.

## Output Schema
{
  unit_id: string,
  summary: string,
  line_comments: [{ line:int, note:string }],
  priorities: string[],
  suggested_edits: [{ range:[start,end], replacement:string }]
}
