# Phase 30 Workflow Transition Rules

Status: Draft
Date: 2026-05-22
Phase: 30 - GUI / Workflow Realignment Spec
Pass: 2 - Workflow Policy and Story Unit Governance

## Purpose

This document defines how workflow authority may transition between major authority layers.
It governs allowed movement of attention and authority, not exact interface mechanics.

## Allowed Transition Patterns

- Writing Surface -> contextual system when local relevance justifies temporary support
- Writing Surface -> Command Center candidate when the task shifts from drafting to structure, navigation, or analysis
- Writing Surface -> support/recovery when an exception or failure state requires intervention
- Command Center candidate -> Writing Surface when analysis resolves into authoring intent
- support/recovery -> Writing Surface when recovery is complete and authoring can safely resume
- advanced-only system -> contextual or Writing Surface only through explicit user intent and bounded relevance

## Forbidden Transition Patterns

- diagnostics/dev -> normal authoring flow as if it were product guidance
- experimental system -> accepted workflow authority through repetition alone
- intelligence surface -> direct high-authority mutation without explicit review
- support/recovery -> ambient ordinary authoring context
- multiple simultaneous surfaces collapsing into a mixed-authority cockpit state

## Interruption Governance

- interruptions into Writing Surface authority must be justified by high relevance or exception status
- intelligence interruptions should be rarer than support/recovery warnings
- exploratory or validate-first systems do not earn interruption rights by default

## Escalation Governance

- escalation from descriptive to advisory authority must be explicit
- escalation from advisory to mutation authority requires the highest scrutiny
- escalation from contextual to primary visibility requires later policy approval, not silent drift

## Contextual Activation Rules

- contextual systems activate in support of the current task
- contextual activation should be reversible, suppressible, and non-dominant
- contextual systems must not silently reframe the current task as their own authority domain

## Support / Recovery Exception Handling

- support and recovery transitions are allowed when system state requires them
- support transitions must stay honest about consequence and scope
- once the exception ends, support authority should recede rather than remain ambient

## Anti-Chaos Rules

- the number of visible systems should contract when attention narrows
- transitions must reduce ambiguity, not multiply competing focal points
- moving a system to another layer or monitor does not erase authority conflicts

## Anti-Authority-Collapse Rules

- primary authoring authority must remain distinguishable at all times
- contextual, support, advanced-only, diagnostics, and experimental systems must retain their layer identity through transitions
- no transition may silently turn a bounded candidate into approved workflow law
