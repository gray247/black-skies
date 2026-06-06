# Pass 217 - Salvage Static Project Context Planning

## Purpose

This pass plans static project context and scene list skeletons inside the isolated salvage shell only.
It does not introduce runtime replacement, real project loading, or filesystem behavior.

## Boundary

This slice stays within the following limits:

- no real project loading,
- no filesystem IO,
- no runtime wiring,
- no old loader transplant,
- no recovery behavior,
- no export behavior,
- no project-switch behavior.

The salvage shell remains an isolated renderer-side scaffold only.

## Static Model Recommendation

Use a small salvage-only static model that contains:

- project title or name,
- current scene label,
- scene list items,
- selected scene id,
- prose placeholder or content string,
- optional project status text.

This model should live beside the salvage scaffold and remain free of project-loader, runtime bridge, and filesystem dependencies.

## Surface Responsibility

### Writing Surface

The Writing Surface should own:

- the current scene or prose editor region,
- minimal current project context,
- the selected scene label,
- direct writing availability.

### Command Center Surface

The Command Center Surface should own:

- the scene list or project outline placeholder,
- project status or project context,
- future tool slots as placeholders only,
- no gating behavior.

Static project context may appear on either surface if it supports clarity, but the Writing Surface must remain usable without any Command Center action.

## Acceptance Criteria for Pass 218

Pass 218 is acceptable only if:

- static project context renders,
- static scene list renders,
- the Writing Surface remains available without Command Center action,
- the Command Center remains separate and supporting,
- no real project IO exists,
- no runtime imports are introduced,
- forbidden files remain untouched.
