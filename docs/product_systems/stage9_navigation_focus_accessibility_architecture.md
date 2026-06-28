# Stage 9 Navigation, Focus, Keyboard, Accessibility, and Multi-Screen Architecture

Status: active, read-only planning pass complete, implementation blocked.

## Purpose

This file defines the Stage 9 experience architecture for navigation, focus, keyboard operation, accessibility, dismissal, readable density, return paths, workspaces, and multi-screen use.

It is bounded by the approved Stage 9 constitution, surface architecture, and the Stage 9 advisory review and persistence architectures. It relies on `Writing Surface`, `Command Center Surface`, `Companion`, `Service Health / Offline / Degraded Mode`, `Save-State And Degraded-Writing Workflow`, and `Authorship Provenance AI Visibility` as the relevant surface and support doctrine.

The architecture keeps movement and orientation legible without turning navigation into ownership, gating, or implementation mechanics.

## Authority

This file has Stage 9 planning authority only.
It does not replace product-system ownership, create new lifecycle states, or authorize implementation.

## Scope

This architecture covers:

- navigation principles
- current-location awareness
- cross-surface movement
- safe return paths
- focus preservation
- keyboard-first operation
- dismissal behavior
- accessible blocking decisions
- readable density
- large-font behavior
- reduced interruption
- projection opening and closing
- workspace concepts
- two-screen and multi-screen use
- re-entry after review, recovery, or degraded operation
- No-AI use
- Companion-free use

It does not choose exact navigation models, menus, tabs, sidebars, panes, drawers, windows, dialogs, component structures, keyboard shortcuts, focus libraries, pixel sizes, breakpoints, or window-management implementation.

## Required Principles

The following principles remain mandatory:

- direct writing remains the primary path
- Writing Surface and Command Center remain separate
- Command Center is not mandatory
- Companion is not mandatory
- navigation does not transfer ownership
- opening a projection does not make it source authority
- closing a projection does not destroy the owner object
- focus must not jump unpredictably
- blocking decisions must offer a safe escape or cancel path
- keyboard users must be able to complete critical review and recovery paths
- dismissal must not erase unresolved risk
- accessibility is architecture, not polish
- multi-screen use must remain optional
- single-screen use must remain complete
- large-font behavior must not hide critical actions or state
- return to Writing Surface must preserve manuscript context

## Navigation Constitution

Navigation is a movement and orientation system, not a workflow owner.

Navigation should help the author:

- enter a project
- find the active manuscript location
- move between writing and review
- inspect support state
- recover safely
- return to the previous writing context

Navigation must not:

- replace the owning surface
- create a universal gateway
- create a hidden owner of current location
- imply that moving to a support surface changes truth

## Current-Location And Orientation Requirements

The interface must keep the author's current place understandable.

Current-location requirements:

- the active manuscript location should remain discoverable
- current workspace or view context should remain visible when relevant
- the author should be able to tell where they are before acting
- location should remain legible across review, recovery, and support handoffs

Orientation is a support obligation. It does not transfer ownership or truth authority.

## Cross-Surface Movement Principles

Movement between Writing Surface, Command Center, and Companion should be explicit and bounded.

Cross-surface movement must:

- preserve the current writing context
- preserve the route back to writing
- make the destination clear before the move
- keep support surfaces from becoming mandatory gates
- keep projections and support views owner-preserving

Movement is a handoff of attention, not a handoff of ownership.

## Safe Return-Path Requirements

The author must be able to return to Writing Surface after support review, recovery review, or degraded operation.

Safe return must preserve:

- the current manuscript context
- the return anchor or equivalent orientation state
- unresolved support material if the author has not dismissed it
- the distinction between support review and sovereign manuscript work

The return path must remain obvious after review, not hidden behind the support surface that was just opened.

## Focus Preservation Rules

Focus must remain predictable and deliberate.

Focus rules:

- focus should not jump unexpectedly
- moving between surfaces should preserve the author's task when possible
- blocking or destructive decisions must not cause focus loss before the author has a safe choice
- dismissal should not erase durable owner state
- re-entry should restore orientation rather than replace it

Focus behavior is part of architecture, not a styling detail.

## Keyboard-First Critical Paths

Keyboard users must be able to complete the critical paths that matter most to review, recovery, and return.

The architecture must support keyboard completion of:

- entering a project
- reaching the active manuscript location
- writing and saving
- opening and dismissing contextual support
- reviewing a finding or candidate
- accepting, rejecting, or parking advisory material
- cancelling a truth-mutating or destructive action
- approving or refusing transmission
- inspecting recovery candidates
- exiting recovery without mutation
- returning to Writing Surface
- reaching unresolved warnings
- identifying the current focused object

This requirement does not choose shortcut bindings or focus libraries.

## Blocking-Decision Escape Requirements

Blocking decisions must never trap the author.

An accessible blocking decision must provide:

- a clear cancel path
- a safe escape path
- a way to return without mutation when that is still possible
- visibility into the responsible owner
- visibility into the action being blocked

Blocking decisions are allowed to interrupt, but not to strand.

## Dismissal And Persistence Rules

Dismissal is not resolution.

The architecture must preserve:

- unresolved risk after dismissal when the risk still exists
- owner state after advisory dismissal
- the difference between hidden and resolved
- the difference between temporary support material and durable state

Dismissal should clear clutter, not destroy evidence, owner state, or pending action.

## Readable Density Principles

The interface should remain readable at moderate and large densities without turning into a dense wall of state.

Readable density should:

- keep important actions and warnings visible
- avoid flooding the author with support detail
- reduce interruption where the author is already writing
- keep provenance, recovery, and approval detail available when needed

Readable density is a burden question, not a layout question.

## Large-Font Requirements

Large-font behavior must preserve access to critical information and actions.

The architecture must ensure that:

- critical actions remain reachable at large font sizes
- state does not disappear when text grows
- blocking decisions remain readable
- return paths remain visible

Large-font support must not hide the actions the author needs to stay safe.

## Projection Opening And Closing Behavior

Opening a projection is a view action, not a truth transfer.
Closing a projection is a return action, not destruction of the owner object.

Projection behavior must preserve:

- the owner object
- source authority
- current-location context
- the route back to the previous place

Opening or closing a projection must not imply ownership change.

## Workspace Principles

Workspaces are bounded support arrangements, not truth owners.

Workspace principles:

- a workspace may remember context for the surface that owns it
- a workspace must not claim manuscript authority
- a workspace must preserve the route back to the active writing context
- workspace configuration must remain secondary to the owner system

Workspace support should reduce setup friction without creating hidden gates.

## Single-Screen Completeness

Single-screen use must remain fully complete.

The architecture must ensure that the author can:

- write
- review
- recover
- dismiss
- return
- inspect provenance
- handle blocking decisions

without requiring a second screen.

Single-screen use is the baseline; multi-screen use is only an enhancement.

## Multi-Screen Enhancement Principles

Multi-screen use is optional.

When present, it may improve visibility or comparison, but it must not:

- become mandatory
- create a second truth owner
- replace the Writing Surface
- break the return path
- collapse owner-preserving projections into shared state

Multi-screen use should enhance orientation, not define the product.

## Re-Entry After Review, Recovery, And Degraded Operation

Re-entry must restore orientation after the author leaves review, recovery, or degraded operation.

Re-entry requirements:

- preserve the writing location or return anchor
- keep unresolved warnings visible when relevant
- distinguish review results from manuscript truth
- keep support summaries from masquerading as accepted state
- allow return to ordinary writing without mandatory detours

Re-entry is a navigation problem before it is a content problem.

## No-AI And Companion-Free Operation

The architecture must work when AI is absent and when Companion is absent.

No-AI and Companion-free operation must preserve:

- direct writing
- review entry and return
- critical path completion
- access to warnings and recovery state
- safe cancellation and dismissal

AI and Companion may help, but they are not prerequisites for core navigation or orientation.

## Genuine Author Decisions

The following decisions may still require later approval because they shape burden rather than ownership:

- how dense the default surface should be at large font sizes
- how much context should stay visible while the author is moving between surfaces
- how visible the return path should be after support review
- how aggressively focus should remain anchored during warnings and blocking decisions
- how much multi-screen enhancement should be surfaced by default

## Stage 10 Operational Boundaries

Stage 10 owns operational behavior, not Stage 9 burden framing.

Stage 10 includes:

- reliability and retry behavior
- recovery verification
- stale and partial behavior under stress
- provider and queue robustness
- offline behavior
- security, privacy, performance, and conflict testing

Stage 9 may describe the experience of those matters, but it does not solve the operational work.

## Stage 12 Architecture-Readiness Boundaries

Stage 12 is only for a later approved architecture-readiness question.
It is not a Stage 9 fallback for navigation model selection, focus implementation, or layout.

Stage 12 may later resolve a true architecture or ownership question only if one is explicitly reopened and approved.

## Batch 4 Closure Criteria

Batch 4 is complete when this file:

- keeps navigation distinct from workflow ownership
- keeps focus predictable and deliberate
- keeps keyboard completion possible for critical review and recovery paths
- keeps dismissal separate from resolution
- keeps single-screen use complete
- keeps multi-screen use optional
- keeps large-font behavior from hiding critical state or actions
- keeps return to Writing Surface explicit and safe
- keeps projections from becoming source authority
- remains implementation-neutral
- does not create a universal navigation or focus owner

## Implementation Blocked

This architecture is documentation only.
Implementation remains blocked.
