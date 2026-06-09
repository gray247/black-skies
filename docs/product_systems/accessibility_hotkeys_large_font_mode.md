# Accessibility / Hotkeys / Large-Font Mode

## 1. Status Header

- Dossier name: `Accessibility / Hotkeys / Large-Font Mode`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Writing Surface`, `Command Center Surface`, `Settings / Preferences / Workspace Layout`
- Feeds into: `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define accessibility and control options that make Black Skies usable across different physical, visual, and workflow needs without changing truth ownership.

## 3. User Problem Solved

The writer needs readable, navigable, controllable surfaces regardless of hardware, vision, or preferred interaction style.

## 4. What The System Does

- provide accessibility options,
- support hotkeys,
- support large-font and other readable layouts.

## 5. What The System Does Not Do

- change narrative truth,
- hide required approvals,
- force one interaction mode.

## 6. User-Facing Behavior

Visible behavior should emphasize clarity, control, and consistency.

## 7. Hidden/Background Behavior

Background persistence of settings may exist without becoming hidden authority.

## 8. What Appears First

- accessible defaults,
- readable surface behavior,
- discoverable controls.

## 9. What Is Summonable

- shortcuts,
- accessibility preferences,
- alternate display modes.

## 10. What Is Hidden Until Needed

- advanced accessibility tuning,
- dense control listings.

## 11. Inputs

- author preferences,
- platform capabilities,
- surface context.

## 12. Outputs

- accessible display behavior,
- hotkey behavior,
- layout adjustments.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- accessibility preferences,
- hotkey preferences,
- display settings.

## 15. What Remains Temporary

- transient accessibility prompts,
- current-session UI adjustments.

## 16. Relationship To Narrative Insertion / Assertion

Accessibility changes how narrative work is accessed, not what truth is.

## 17. Relationship To Story Units

No special Story Unit authority exists here.

## 18. Relationship To Prose / Scene Projection

Projection views must also respect accessibility rules.

## 19. Relationship To Writing Surface

Accessibility support is especially important for the sovereign Writing Surface.

## 20. Relationship To Command Center Surface

The Command Center should be accessible without becoming cluttered.

## 21. GUI Placement Principles

Accessibility should reduce friction rather than add more control clutter.

## 22. Local LLM Role

Not required for core behavior.

## 23. Paid API Role

Not required for core behavior.

## 24. Model Routing Notes And Cost / Budget Impact

None by default.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Not a primary concern here.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Accessibility modes must not hide required safety cues.

## 27. Testing Requirements

Prove readable, controllable behavior across core surfaces.

## 28. Governance Rules And Risks

- no accessibility regression in sovereign writing,
- no hidden control traps,
- no approval cues lost through layout changes.

## 29. Failure Modes

If advanced accessibility fails, the app should degrade to basic readable controls.

## 30. v1 Boundary

Basic accessibility options, hotkeys, and readable display support.

## 31. v2 Boundary

Richer customization and platform-specific improvements.

## 32. Future-Only Boundary

Deep adaptive or AI-personalized accessibility behavior.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from accessibility, keyboard, focus, visual-system, and safe-control questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `3 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: which accessibility cues are mandatory across all primary surfaces so approval, privacy, protected-content, and destructive-action warnings do not disappear under alternate layouts or modes?
- Critical: which hotkeys are allowed to trigger only navigation or summon actions, and which must never bypass confirmation gates for destructive, truth-mutating, paid, outbound, or protected-content actions?
- Critical: what readable and keyboard-safe fallback must exist when advanced accessibility, custom shortcuts, or large-font layouts collide with reduced surface space or complex support panels?

### Major Questions

- Major: which hotkeys are universal versus context-specific, and how should conflicts be resolved without breaking direct writing or focus safety?
- Major: how should large-font, zoom, contrast, and simplified-layout behavior interact with `Writing Surface`, `Command Center Surface`, and summonable support overlays?
- Jason decision candidate: what is the smallest mandatory accessibility baseline for first implementation slices before deeper customization exists?

### Minor Questions

- Minor: what user-facing naming best covers accessibility, readability, large-font, keyboard mode, and simplified-layout behavior without confusion?

### Answered / Superseded Questions

- Direct writing must remain available.
- Accessibility must not bypass approval, privacy, routing, or protected-content rules.
- Questions about purely cosmetic UI theming belong elsewhere.

### Deferred Questions

- Deferred: exact platform parity targets, assistive-technology support depth, and per-surface shortcut discovery rules.

## 34. Acceptance Criteria

This dossier is acceptable only if accessibility support stays practical and non-disruptive.
