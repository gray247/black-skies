# Phase 30 Authority Layering Foundation

Status: Draft
Date: 2026-05-22
Phase: 30 - GUI / Workflow Realignment Spec
Pass: 1 - Operational Philosophy and Governance Boundaries

## Purpose

This document defines the high-level authority-layer model carried forward from Phase 29.
It does not assign exact layouts, monitors, panes, or placements.

## Layer 1: Writing Surface

The Writing Surface is the primary authoring authority.
It owns focused drafting, direct narrative attention, and the strongest claim on user concentration.

Rules:

- primary prose and immediate authoring context stay here
- non-authoring systems must justify any interruption into this layer
- this layer is protected from shell sprawl and mixed-authority overload

## Layer 2: Contextual Systems

Contextual systems support the current authoring moment without becoming the center of gravity.

Examples of contextual classes:

- bounded status signals
- limited guidance surfaces
- contextual support affordances
- scene-adjacent structural hints

Rules:

- contextual does not mean primary
- contextual systems remain subordinate to Writing Surface authority
- contextual systems may be suppressed, collapsed, or reduced without losing authoring continuity

## Layer 3: Command Center Candidate

Command Center is a candidate layer for analysis, navigation, structure, status, and bounded support context.
In Pass 1 it is analysis-first rather than mutation-first.

Rules:

- structure and navigation are in-bounds
- analysis and status are in-bounds
- direct mutation authority is not approved here by default
- this layer may be denser than the Writing Surface, but not chaotic

## Layer 4: Support and Recovery Systems

Support and recovery systems are legitimate but exceptional authority.

Rules:

- they surface when needed
- they remain clearly distinct from normal authoring flow
- restore, retry, and exception-path actions do not inherit ordinary workflow semantics

## Layer 5: Diagnostics and Dev Systems

Diagnostics and dev/test systems are non-product authority unless explicitly proven otherwise in a later phase.

Rules:

- dev/test seams do not inherit product support legitimacy
- diagnostics remain explicitly distinguished from operator-visible support UX
- environment or test harness machinery stays fenced from workflow canon

## Layer 6: Background Automation Candidates

Some systems may remain real and useful without visible authority.
These are background automation candidates.

Rules:

- internal routing metadata belongs here by default
- invisible or low-visibility operation does not imply low importance
- background systems should not demand user trust they do not need

## Intelligence Authority Boundaries

Intelligence-related systems must be separated by authority class:

- descriptive
- advisory
- prescriptive

Rules:

- descriptive metrics are not prescriptive authority
- advisory guidance is not final narrative judgment
- prescriptive or mutation-adjacent intelligence requires the strongest validation and governance

## Orchestration Boundaries

Orchestration is a real concern, but visible orchestration authority must remain bounded.

Rules:

- command/routing metadata is not self-justifying visible workflow authority
- orchestration signals must not imply maturity beyond runtime or governance proof

## Mutation Authority Boundaries

Mutation authority must be classified separately from information display.

Classes:

- direct mutation
- indirect mutation
- support mutation
- intelligence-assisted mutation

Rules:

- intelligence-assisted mutation is the most governance-sensitive class
- support mutation must not be normalized into everyday authoring
- direct mutation pathways still require justified placement and trust framing
