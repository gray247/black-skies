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

Accessibility here is a baseline contract, not a separate owner.
It must keep the Writing Surface prose-first and the Command Center review-oriented while preserving direct writing and safe recovery.

## 3. User Problem Solved

The writer needs readable, navigable, controllable surfaces regardless of hardware, vision, or preferred interaction style.

## 4. What The System Does

- provide a mandatory accessible baseline across the Writing Surface and Command Center,
- support hotkeys with explicit scope and safety rules,
- support large-font and other readable layouts,
- preserve keyboard reachability, focus clarity, and cue readability.

## 5. What The System Does Not Do

- change narrative truth,
- gate direct writing,
- hide required approvals,
- let shortcuts bypass confirmation, approval, protection, or truth boundaries,
- force one interaction mode.

## 6. User-Facing Behavior

Visible behavior should emphasize clarity, control, consistency, and quiet support.
Accessibility cues must remain readable without turning the UI into a warning carpet.

## 7. Hidden/Background Behavior

Background persistence of settings may exist without becoming hidden authority.
Saved shortcuts or layouts that become invalid must fall back honestly rather than disabling keyboard access.

## 8. Mandatory Baseline

The following are required across both primary surfaces:

- visible keyboard focus,
- predictable keyboard navigation,
- editor entry and exit,
- access to primary navigation and surface switching,
- keyboard traversal of panels, dialogs, and approvals,
- save, cancel, recovery, and safe escape,
- accessible status and error messages,
- readable large-font behavior,
- non-color-only state communication,
- no accidental command activation while typing,
- focus restoration after overlays and workspace changes.

## 9. Required Cues

These cues must never rely only on color, icon, position, animation, or hover:

- focused element,
- disabled action,
- unsaved work,
- degraded or offline state,
- protected or excluded content,
- destructive action,
- paid-use approval,
- truth-affecting acceptance,
- stale analysis.

Each critical cue needs text or an accessible state label.
Color, shape, and icon may reinforce meaning, but they cannot carry it alone.

## 10. Hotkey Classes

### Global shortcuts

Suitable for:

- surface switching,
- primary navigation,
- command search,
- save,
- safe cancel,
- recovery,
- opening shortcut settings.

### Surface-local shortcuts

Suitable for:

- editor actions,
- review navigation,
- filters,
- workspace operations,
- context-specific commands.

### Guarded shortcuts

Destructive, truth-affecting, approval-gated, paid, provider-routed, or protected-content actions may be invoked by shortcut only if the normal confirmation or approval path still appears.

A shortcut must never silently:

- accept AI output,
- mutate manuscript truth,
- approve paid use,
- bypass protected-content review,
- close Notes or Signals,
- discard work where confirmation is required.

## 11. Conflict Policy

- reserved operating-system shortcuts cannot be overridden,
- duplicate simultaneously active bindings are blocked,
- the conflict display identifies both commands and scopes,
- non-overlapping surface-local reuse is allowed,
- users may clear or reassign eligible bindings,
- reset-to-default remains available,
- save, emergency cancel, recovery, and access to shortcut settings cannot be unbound without a safe alternative,
- invalid saved mappings fall back honestly rather than disabling keyboard access.

## 12. Focus Behavior

- stable and predictable traversal,
- visible focus,
- modal focus containment,
- return focus after closing overlays,
- no off-screen focused controls,
- access to collapsed or hidden panes,
- protection against hotkey activation while typing,
- explicit transition between editor focus and panel focus,
- focus preservation or sensible fallback after layout restoration.

Writing Surface and Command Center do not need identical tab sequences, but each surface must remain predictable and self-consistent.

## 13. Large-Font And Constrained-Space Fallback

Use this priority order:

1. reflow and wrap,
2. enlarge scrollable regions,
3. collapse secondary panels,
4. move secondary actions into accessible menus,
5. use a simplified writing-first layout.

Always preserve:

- editor,
- primary navigation,
- save,
- cancel,
- recovery,
- required warnings,
- approval prompts,
- truth-affecting decisions.

Accessibility constraints override saved layout geometry temporarily.
The saved layout remains recoverable when the constraint disappears.
Do not require every panel to remain visible simultaneously.

## 14. Monitor And Restoration Failure

When a monitor disappears or layout restoration fails:

- return required windows, dialogs, and prompts to an active display,
- preserve Writing Surface access first,
- make Command Center material reachable through navigation or restoration controls,
- prevent approval dialogs from remaining off-screen,
- retain the prior layout as recoverable state when safe,
- do not treat temporary adaptation as project-truth mutation.

## 15. What Appears First

- accessible defaults,
- readable surface behavior,
- discoverable controls.

## 16. What Is Summonable

- shortcuts,
- accessibility preferences,
- alternate display modes.

## 17. What Is Hidden Until Needed

- advanced accessibility tuning,
- dense control listings.

## 18. Inputs

- author preferences,
- platform capabilities,
- surface context.

## 19. Outputs

- accessible display behavior,
- hotkey behavior,
- layout adjustments.

## 20. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 21. What Gets Stored

- accessibility preferences,
- hotkey preferences,
- display settings.

## 22. What Remains Temporary

- transient accessibility prompts,
- current-session UI adjustments.

## 23. Relationship To Narrative Insertion / Assertion

Accessibility changes how narrative work is accessed, not what truth is.

## 24. Relationship To Story Units

No special Story Unit authority exists here.

## 25. Relationship To Prose / Scene Projection

Projection views must also respect accessibility rules.

## 26. Relationship To Writing Surface

Keep the Writing Surface writing-first, low-noise, and safe to use from the keyboard without extra ceremony.
Essential status cues and accessible editor controls belong here; dense control chrome does not.

## 27. Relationship To Command Center Surface

Keep the Command Center denser than the Writing Surface but still keyboard-complete and readable.
It may host grouped review, filters, comparisons, evidence detail, and remapping, but it must not collapse the two surfaces into one generic dashboard.

## 28. GUI Placement Principles

Accessibility should reduce friction rather than add more control clutter.
The two surfaces matter more than two monitors.

## 29. Local LLM Role

Not required for core behavior.

## 30. Paid API Role

Not required for core behavior.

## 31. Model Routing Notes And Cost / Budget Impact

None by default.

## 32. Explicit-Content / Send-Package Handling, If Applicable

Not a primary concern here.

## 33. Privacy / Safety / Censor Behavior, If Applicable

Accessibility modes must not hide required safety cues.

## 34. Testing Requirements

Prove readable, controllable behavior across core surfaces.

## 35. Governance Rules And Risks

- no accessibility regression in sovereign writing,
- no hidden control traps,
- no approval cues lost through layout changes.

## 36. Failure Modes

If advanced accessibility fails, the app should degrade to basic readable controls.
If a shortcut map is invalid, the app should fall back to a safe keyboard path instead of becoming mouse-only.

## 37. v1 Boundary

Basic accessibility options, hotkeys, and readable display support.

## 38. v2 Boundary

Richer customization and platform-specific improvements.

## 39. Future-Only Boundary

Deep adaptive or AI-personalized accessibility behavior.

## 40. Settled Decisions

The following decisions are now normalized into the dossier:

- required cues are text-labeled as needed and never color-only,
- global shortcuts are limited to navigation, save, safe cancel, recovery, command search, and settings entry,
- surface-local reuse is allowed only when scopes cannot overlap,
- guarded shortcuts still must present the normal confirmation or approval path,
- large-font mode preserves editor, navigation, save, cancel, recovery, warnings, approvals, and truth-affecting decisions,
- invalid saved mappings fall back honestly,
- temporary monitor or layout adaptation is not a truth mutation.

## 41. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from accessibility, keyboard, focus, visual-system, and safe-control questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `0 Critical`, `1 Major`

### Fatal Questions

- None yet.

### Critical Questions

- None remaining. The mandatory cue set and guarded-hotkey rules are now settled at the product-definition level.

### Major Questions

- Major: exact platform parity targets and assistive-technology support depth remain deferred until implementation selection.

### Minor Questions

- Minor: what user-facing naming best covers accessibility, readability, large-font, keyboard mode, and simplified-layout behavior without confusion?

### Answered / Superseded Questions

- Direct writing must remain available.
- Accessibility must not bypass approval, privacy, routing, or protected-content rules.
- Questions about purely cosmetic UI theming belong elsewhere.

### Deferred Questions

- Deferred: exact platform parity targets, assistive-technology support depth, and per-surface shortcut discovery rules.

## 42. Acceptance Criteria

This dossier is acceptable only if accessibility support stays practical and non-disruptive.
