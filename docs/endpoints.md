# docs/endpoints.md — API Contracts (Source of truth)
**Status:** LOCKED · 2025-09-15  
Covers: HTTP routes, requests/responses, status codes.  
References: `docs/data_model.md` for object shapes; `docs/critique_rubric.md` for critique output schema.

## POST /outline/build
Req: { project_id:string }  
Res: { outline_id:string, acts:[…], chapters:[…], scenes:[{id, order, title, beat_refs:[]}]} (see data_model for fields)

## POST /draft/generate
Req: { project_id, outline_id, unit_scope:"scene"|"chapter", unit_ids:[…] }  
Res: { draft_id, units:[{id, text, meta:{pov,purpose,pacing_target}}] }

## POST /draft/rewrite
Req: { draft_id, unit_id, instructions?:string, new_text?:string }  
Res: { unit_id, revised_text, diff:{added:[…], removed:[…], changed:[…]} }

## POST /draft/critique
Req: { draft_id, unit_id, rubric?:string[] }  
Res: { unit_id, summary, line_comments:[{line:int,note:string}], priorities:string[], suggested_edits:[{range:[start,end],replacement:string}] }
