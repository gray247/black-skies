# BLACK SKIES DESIGN SYSTEM v1

## Phase 11B — Narrative Workspace Architecture Spec

## Purpose

Black Skies is not a generic writing app. It is a **narrative command system**.

The design system must support two simultaneous modes of thinking:

1. **Creation**

   * quiet
   * focused
   * low-friction
   * emotionally immersive

2. **Story Intelligence**

   * analytical
   * structural
   * visual
   * diagnostic
   * command-oriented

The interface must feel like:

> **a dark cinematic writing room connected to a story control tower.**

Not:

* corporate dashboard sludge
* neon cyberpunk casino vomit
* generic AI chat wrapper
* bloated productivity spreadsheet prison

---

# 1. DESIGN PRINCIPLES

## 1.1 Quiet Creation, Loud Intelligence

The writing surface must remain calm.

The intelligence surface may be dense, but it must be organized.

Rule:

```text
The writing monitor protects flow.
The command monitor exposes structure.
```

---

## 1.2 AI Suggests, User Decides

AI output must never feel like final authority.

All AI-generated outputs should be visually marked as:

* suggestion
* candidate
* warning
* detected pattern
* unresolved question
* generated analysis

Never silently mutate user work.

---

## 1.3 One Active Narrative Context

At any moment the UI should clearly show:

* active project
* active outline
* active act/chapter/scene/unit
* active generation target
* active intelligence context

No hidden “what am I editing?” nonsense. That’s how users end up emotionally fist-fighting software.

---

## 1.4 Story Units Before Rigid Structure

The system must support messy input.

A user may begin with:

* a sentence
* a note
* a fragment
* a scene seed
* a line of dialogue
* an image idea
* a plot turn
* a “somebody dies on a boat” goblin thought

The UI should not force the user to know whether something is a chapter, scene, beat, thread, or theme too early.

---

## 1.5 Progressive Disclosure

Default screens should show what matters now.

Advanced tools should be available, not screaming from every wall.

Rule:

```text
Power should be reachable.
It should not be unavoidable.
```

---

# 2. WORKSPACE TOPOLOGY

## 2.1 Primary Workspace Model

Black Skies uses a **Split Command** topology.

```json
{
  "workspace_topology": {
    "name": "split_command",
    "description": "Two-zone narrative workspace separating story intelligence from immersive writing.",
    "primary_zones": [
      "command_center",
      "writing_studio"
    ],
    "default_behavior": "single_window_split",
    "supports_dual_monitor": true,
    "supports_single_monitor": true,
    "supports_ultrawide": true,
    "supports_detached_windows": "future"
  }
}
```

---

# 3. PRIMARY ZONES

## 3.1 Command Center

Purpose:

```text
Story intelligence, navigation, diagnostics, structure, analysis, tools.
```

Tone:

* dense
* technical
* cinematic
* controlled
* dashboard-like, but not cluttered

Default contents:

* Story Navigation
* Narrative Overview
* Narrative Gaps
* Story Constellation placeholder
* AI Companion
* Threads at Risk
* Thread Timeline
* Character Arc Overview
* Global Tools

```json
{
  "zone": "command_center",
  "role": "story_intelligence",
  "default_position": "left",
  "density": "high",
  "interaction_style": "analytical",
  "visual_tone": "cinematic_control",
  "allowed_components": [
    "story_navigation",
    "narrative_overview",
    "narrative_gaps",
    "story_constellation",
    "ai_companion",
    "threads_at_risk",
    "thread_timeline",
    "character_arc_overview",
    "global_tools",
    "filters",
    "reports"
  ],
  "forbidden_components": [
    "primary_longform_editor"
  ]
}
```

---

## 3.2 Writing Studio

Purpose:

```text
Drafting, focused writing, scene-level work, low-noise assistance.
```

Tone:

* calm
* immersive
* spacious
* quiet
* writer-first

Default contents:

* Main Editor
* Lightweight Outline
* Notes
* AI Chat
* Scene Notes
* Contextual Intelligence
* Quick Insert
* Writing Tools
* View Controls

```json
{
  "zone": "writing_studio",
  "role": "immersive_creation",
  "default_position": "right",
  "density": "low_to_medium",
  "interaction_style": "creative_focus",
  "visual_tone": "dark_writing_room",
  "allowed_components": [
    "primary_editor",
    "lightweight_outline",
    "scene_notes",
    "ai_chat",
    "contextual_intelligence",
    "quick_insert",
    "writing_tools",
    "view_controls"
  ],
  "forbidden_components": [
    "full_dashboard_graph_cluster",
    "persistent_global_warning_wall"
  ]
}
```

---

# 4. WORKSPACE MODES

## 4.1 Mode List

```json
{
  "workspace_modes": [
    {
      "id": "split_command",
      "name": "Split Command",
      "description": "Default command-center plus writing-studio layout.",
      "phase": "11B",
      "priority": "primary"
    },
    {
      "id": "focus_writing",
      "name": "Focus Writing",
      "description": "Writing studio dominates; command intelligence collapses.",
      "phase": "11B",
      "priority": "primary"
    },
    {
      "id": "structure",
      "name": "Structure",
      "description": "Outline, Story Units, placement, gaps, and narrative map dominate.",
      "phase": "11B",
      "priority": "primary"
    },
    {
      "id": "revision",
      "name": "Revision",
      "description": "Critique, rewrite, sync, comparison, provenance, and snapshots.",
      "phase": "12",
      "priority": "secondary"
    },
    {
      "id": "continuity",
      "name": "Continuity",
      "description": "Canon, contradictions, memory, unresolved threads, and timeline risks.",
      "phase": "13",
      "priority": "secondary"
    },
    {
      "id": "visualization",
      "name": "Visualization",
      "description": "Story spine, emotional pulse, constellation, thread heatmaps.",
      "phase": "14",
      "priority": "future"
    }
  ]
}
```

---

## 4.2 Mode Rules

```json
{
  "mode_rules": {
    "split_command": {
      "command_center": "expanded",
      "writing_studio": "expanded",
      "default_ratio": "48/52"
    },
    "focus_writing": {
      "command_center": "collapsed",
      "writing_studio": "dominant",
      "default_ratio": "15/85",
      "allowed_interruptions": [
        "critical_save_error",
        "explicit_user_requested_ai_result"
      ]
    },
    "structure": {
      "command_center": "dominant",
      "writing_studio": "secondary",
      "default_ratio": "65/35"
    },
    "revision": {
      "comparison_surfaces": "enabled",
      "provenance_surfaces": "visible",
      "draft_mutation_warnings": "required"
    }
  }
}
```

---

# 5. PANEL HIERARCHY

## 5.1 Hierarchy Levels

```json
{
  "panel_hierarchy": {
    "level_0_shell": {
      "description": "Application frame, monitor zones, global navigation."
    },
    "level_1_workspace": {
      "description": "Command Center and Writing Studio containers."
    },
    "level_2_region": {
      "description": "Major regions such as Story Navigation, Editor, Intelligence Grid."
    },
    "level_3_card": {
      "description": "Individual information cards or tool cards."
    },
    "level_4_element": {
      "description": "Buttons, chips, labels, graph nodes, status indicators."
    }
  }
}
```

---

## 5.2 Panel Importance Classes

```json
{
  "panel_importance": {
    "primary": {
      "description": "Central to current workflow.",
      "examples": [
        "primary_editor",
        "story_navigation",
        "active_outline"
      ],
      "visual_weight": "highest"
    },
    "secondary": {
      "description": "Useful context but not dominant.",
      "examples": [
        "scene_notes",
        "contextual_intelligence",
        "narrative_overview"
      ],
      "visual_weight": "medium"
    },
    "tertiary": {
      "description": "Reference or optional support.",
      "examples": [
        "reports",
        "filters",
        "global_tools"
      ],
      "visual_weight": "low"
    },
    "ambient": {
      "description": "Status, background indicators, subtle system awareness.",
      "examples": [
        "save_status",
        "model_route",
        "word_count"
      ],
      "visual_weight": "minimal"
    }
  }
}
```

---

# 6. COMPONENT CONTRACTS

Each component must define:

```json
{
  "component_contract_required_fields": [
    "id",
    "name",
    "zone",
    "role",
    "scope",
    "default_size",
    "min_size",
    "max_size",
    "density",
    "required_data",
    "optional_data",
    "states",
    "interactions",
    "empty_state",
    "loading_state",
    "error_state",
    "accessibility_requirements"
  ]
}
```

---

# 7. CORE COMPONENT SPECS

## 7.1 Story Navigation

```json
{
  "id": "story_navigation",
  "name": "Story Navigation",
  "zone": "command_center",
  "role": "narrative_navigation",
  "scope": "project",
  "default_size": {
    "width": 260,
    "height": 360
  },
  "min_size": {
    "width": 220,
    "height": 240
  },
  "density": "medium",
  "required_data": [
    "active_project",
    "active_outline",
    "story_units_or_scenes",
    "active_selection"
  ],
  "optional_data": [
    "act_labels",
    "chapter_labels",
    "progress_percent",
    "filters"
  ],
  "states": [
    "default",
    "filtered",
    "empty",
    "loading",
    "error"
  ],
  "interactions": {
    "select_item": "sets_active_story_context",
    "hover_item": "shows_summary_preview",
    "drag_item": "future_reorder_or_place",
    "filter": "changes_visible_units_only"
  },
  "rules": [
    "Selection must update Writing Studio context.",
    "Must never silently change draft text.",
    "Must show active item clearly."
  ]
}
```

---

## 7.2 Narrative Overview

```json
{
  "id": "narrative_overview",
  "name": "Narrative Overview",
  "zone": "command_center",
  "role": "story_health_summary",
  "scope": "project",
  "default_size": {
    "width": 420,
    "height": 240
  },
  "min_size": {
    "width": 320,
    "height": 180
  },
  "density": "high",
  "required_data": [
    "outline_summary",
    "story_health_signals"
  ],
  "optional_data": [
    "emotional_pulse",
    "pacing_score",
    "cohesion_score",
    "clarity_score",
    "stakes_score"
  ],
  "states": [
    "default",
    "partial_data",
    "loading",
    "stale",
    "error"
  ],
  "rules": [
    "Scores are advisory, not authoritative.",
    "Must label derived/AI signals.",
    "Must support partial data without pretending certainty."
  ]
}
```

---

## 7.3 Narrative Gaps

```json
{
  "id": "narrative_gaps",
  "name": "Narrative Gaps",
  "zone": "command_center",
  "role": "missing_structure_detection",
  "scope": "project_or_selection",
  "default_size": {
    "width": 320,
    "height": 240
  },
  "min_size": {
    "width": 280,
    "height": 180
  },
  "density": "medium",
  "required_data": [
    "gap_candidates"
  ],
  "optional_data": [
    "gap_type",
    "confidence",
    "related_units",
    "suggested_bridge"
  ],
  "states": [
    "default",
    "none_detected",
    "loading",
    "error"
  ],
  "interactions": {
    "select_gap": "opens_gap_detail",
    "generate_bridge": "creates_candidate_suggestion",
    "dismiss_gap": "marks_gap_ignored"
  },
  "rules": [
    "Gaps must be suggestions, not verdicts.",
    "Generated bridges must go to candidate state.",
    "Must show why a gap was detected when possible."
  ]
}
```

---

## 7.4 Story Constellation

```json
{
  "id": "story_constellation",
  "name": "Story Constellation",
  "zone": "command_center",
  "role": "relationship_visualization",
  "scope": "project_or_selection",
  "phase": "future_14",
  "default_size": {
    "width": 520,
    "height": 360
  },
  "min_size": {
    "width": 360,
    "height": 260
  },
  "density": "visual_high",
  "required_data": [
    "nodes",
    "edges",
    "active_context"
  ],
  "states": [
    "placeholder",
    "default",
    "filtered",
    "too_many_nodes",
    "loading",
    "error"
  ],
  "hard_limits": {
    "default_visible_nodes": 12,
    "max_visible_nodes_without_filter": 30,
    "max_edge_density_warning": 0.35
  },
  "rules": [
    "Graph is a lens, not source of truth.",
    "Must support node filtering.",
    "Must collapse weak relationships by default.",
    "Must never auto-restructure outline."
  ]
}
```

---

## 7.5 AI Companion

```json
{
  "id": "ai_companion",
  "name": "AI Companion",
  "zone": "command_center",
  "role": "contextual_guidance",
  "scope": "selection_or_project",
  "default_size": {
    "width": 320,
    "height": 300
  },
  "min_size": {
    "width": 280,
    "height": 220
  },
  "density": "medium",
  "required_data": [
    "active_context"
  ],
  "optional_data": [
    "suggestions",
    "risks",
    "next_actions",
    "model_route"
  ],
  "states": [
    "idle",
    "suggesting",
    "waiting_for_user",
    "loading",
    "error"
  ],
  "interaction_policy": {
    "default_mode": "user_requested",
    "allowed_auto_alerts": [
      "critical_continuity_break",
      "failed_save",
      "high_risk_destructive_action"
    ],
    "forbidden_behavior": [
      "constant_nagging",
      "silent_rewrites",
      "authoritative_verdicts"
    ]
  }
}
```

---

## 7.6 Primary Editor

```json
{
  "id": "primary_editor",
  "name": "Primary Editor",
  "zone": "writing_studio",
  "role": "longform_writing",
  "scope": "scene_or_document",
  "default_size": {
    "width": 820,
    "height": 720
  },
  "min_size": {
    "width": 520,
    "height": 420
  },
  "density": "low",
  "required_data": [
    "active_document_or_scene",
    "draft_text",
    "save_state"
  ],
  "optional_data": [
    "word_count",
    "character_count",
    "active_route",
    "focus_mode"
  ],
  "states": [
    "editing",
    "readonly",
    "saving",
    "saved",
    "dirty",
    "conflict",
    "error"
  ],
  "rules": [
    "Must remain visually calm.",
    "Must not be crowded by persistent analytics.",
    "Must show save/conflict state clearly.",
    "Must support keyboard-first writing."
  ]
}
```

---

## 7.7 Lightweight Outline

```json
{
  "id": "lightweight_outline",
  "name": "Lightweight Outline",
  "zone": "writing_studio",
  "role": "local_scene_navigation",
  "scope": "active_outline",
  "default_size": {
    "width": 280,
    "height": 360
  },
  "min_size": {
    "width": 240,
    "height": 220
  },
  "density": "medium",
  "required_data": [
    "active_outline",
    "active_scene_or_unit"
  ],
  "states": [
    "default",
    "collapsed",
    "filtered",
    "loading",
    "error"
  ],
  "rules": [
    "Must support quick navigation.",
    "Must not replace the Command Center outline.",
    "Must keep user oriented while writing."
  ]
}
```

---

## 7.8 Scene Notes

```json
{
  "id": "scene_notes",
  "name": "Scene Notes",
  "zone": "writing_studio",
  "role": "local_context",
  "scope": "active_scene_or_unit",
  "default_size": {
    "width": 280,
    "height": 180
  },
  "min_size": {
    "width": 240,
    "height": 120
  },
  "density": "low",
  "required_data": [
    "active_scene_or_unit"
  ],
  "optional_data": [
    "notes",
    "scene_metadata"
  ],
  "states": [
    "default",
    "empty",
    "editing",
    "saving",
    "error"
  ]
}
```

---

## 7.9 Contextual Intelligence

```json
{
  "id": "contextual_intelligence",
  "name": "Contextual Intelligence",
  "zone": "writing_studio",
  "role": "low_noise_scene_guidance",
  "scope": "active_scene_or_unit",
  "default_size": {
    "width": 280,
    "height": 180
  },
  "min_size": {
    "width": 240,
    "height": 140
  },
  "density": "low",
  "required_data": [
    "active_context"
  ],
  "optional_data": [
    "signals",
    "warnings",
    "opportunities"
  ],
  "states": [
    "quiet",
    "has_insights",
    "loading",
    "error"
  ],
  "rules": [
    "Maximum three visible insights by default.",
    "No high-noise analytics in writing mode.",
    "Clicking insight opens detail; it does not mutate text."
  ]
}
```

---

# 8. COLOR LANGUAGE

## 8.1 Visual Tone

Black Skies uses a **dark cinematic neutral base** with restrained signal colors.

Color is functional, not decoration.

---

## 8.2 Core Palette

```json
{
  "colors": {
    "background": {
      "app": "#050709",
      "workspace": "#080C10",
      "panel": "#0C1117",
      "panel_elevated": "#111822",
      "panel_soft": "#0F151C"
    },
    "border": {
      "subtle": "#1A232E",
      "standard": "#263241",
      "active": "#8A5CFF",
      "danger": "#B84A4A"
    },
    "text": {
      "primary": "#E7ECF2",
      "secondary": "#A8B0BA",
      "muted": "#6F7A86",
      "disabled": "#46505C",
      "inverse": "#050709"
    },
    "accent": {
      "primary": "#9B5CFF",
      "primary_soft": "#6E3CCB",
      "secondary": "#12C8D9",
      "green": "#35D07F",
      "blue": "#4EA1FF",
      "amber": "#F5A623",
      "red": "#FF5C5C",
      "pink": "#D85CFF"
    },
    "semantic": {
      "success": "#35D07F",
      "warning": "#F5A623",
      "danger": "#FF5C5C",
      "info": "#4EA1FF",
      "ai": "#9B5CFF",
      "local": "#35D07F",
      "api": "#12C8D9"
    }
  }
}
```

---

## 8.3 Color Rules

```json
{
  "color_rules": {
    "purple": "AI, active state, selected narrative context",
    "cyan": "system intelligence, routing, command signals",
    "green": "safe, saved, resolved, local processing",
    "amber": "warning, unresolved, caution, medium risk",
    "red": "danger, destructive action, failed state",
    "pink": "emotion, subjective interpretation, tonal signal",
    "blue": "informational, neutral system feedback"
  }
}
```

---

## 8.4 Forbidden Color Behavior

```json
{
  "forbidden_color_usage": [
    "rainbow dashboards without meaning",
    "emotion colors used as hard truth",
    "red for non-dangerous decoration",
    "constant bright glow around passive elements",
    "color-only status indicators without text/icon backup"
  ]
}
```

---

# 9. TYPOGRAPHY

## 9.1 Font Philosophy

Typography should feel:

* technical enough for command surfaces
* readable enough for long writing
* cinematic without being gimmicky

Use separate typography roles:

```json
{
  "typography_roles": {
    "interface": "compact_sans",
    "editor": "readable_serif_or_monospace_option",
    "data": "tabular_monospace",
    "labels": "uppercase_small_caps"
  }
}
```

---

## 9.2 Type Scale

```json
{
  "typography": {
    "display": {
      "font_size": 28,
      "line_height": 36,
      "weight": 600,
      "letter_spacing": "0.02em"
    },
    "workspace_title": {
      "font_size": 16,
      "line_height": 22,
      "weight": 600,
      "letter_spacing": "0.12em",
      "text_transform": "uppercase"
    },
    "panel_title": {
      "font_size": 11,
      "line_height": 16,
      "weight": 600,
      "letter_spacing": "0.12em",
      "text_transform": "uppercase"
    },
    "body": {
      "font_size": 14,
      "line_height": 22,
      "weight": 400
    },
    "editor_body": {
      "font_size": 17,
      "line_height": 32,
      "weight": 400
    },
    "caption": {
      "font_size": 12,
      "line_height": 16,
      "weight": 400
    },
    "micro": {
      "font_size": 10,
      "line_height": 14,
      "weight": 500,
      "letter_spacing": "0.08em"
    }
  }
}
```

---

# 10. SPACING SYSTEM

## 10.1 Grid

Use an 8px base grid.

```json
{
  "spacing": {
    "base_unit": 8,
    "xxs": 2,
    "xs": 4,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 24,
    "xxl": 32,
    "xxxl": 48
  }
}
```

---

## 10.2 Layout Spacing

```json
{
  "layout_spacing": {
    "app_margin": 24,
    "zone_gap": 16,
    "panel_gap": 12,
    "card_gap": 10,
    "panel_padding": 16,
    "card_padding": 12,
    "toolbar_gap": 8,
    "button_gap": 6
  }
}
```

---

## 10.3 Density Rules

```json
{
  "density_modes": {
    "calm": {
      "panel_gap": 16,
      "card_padding": 16,
      "line_height_multiplier": 1.65
    },
    "standard": {
      "panel_gap": 12,
      "card_padding": 12,
      "line_height_multiplier": 1.45
    },
    "dense": {
      "panel_gap": 8,
      "card_padding": 10,
      "line_height_multiplier": 1.25
    }
  }
}
```

---

# 11. SHAPE, BORDERS, DEPTH

```json
{
  "shape": {
    "radius": {
      "sm": 4,
      "md": 8,
      "lg": 12,
      "xl": 16
    },
    "border_width": {
      "standard": 1,
      "active": 1,
      "focus": 2
    }
  },
  "depth": {
    "flat": "none",
    "panel": "0 0 0 1px rgba(255,255,255,0.06)",
    "elevated": "0 12px 32px rgba(0,0,0,0.35)",
    "floating": "0 18px 48px rgba(0,0,0,0.50)"
  },
  "glow": {
    "active_subtle": "0 0 18px rgba(155,92,255,0.18)",
    "danger_subtle": "0 0 18px rgba(255,92,92,0.15)",
    "forbidden": "constant_strong_neon_glow"
  }
}
```

---

# 12. INTERACTION DOCTRINE

## 12.1 Global Interaction Rules

```json
{
  "interaction_doctrine": {
    "selection": "single_active_context_visible_everywhere",
    "ai_output": "candidate_until_user_accepts_or_syncs",
    "destructive_actions": "confirm_or_snapshot_required",
    "panels": "expand_on_intent_not_noise",
    "hover": "preview_not_commit",
    "click": "select_or_open",
    "double_click": "deep_open_or_focus",
    "drag": "reorder_or_reposition_only_when_handle_visible",
    "keyboard": "all_primary_workflows_keyboard_reachable"
  }
}
```

---

## 12.2 AI Interaction Rules

```json
{
  "ai_interaction_rules": {
    "default_mode": "user_initiated",
    "allowed_passive_ai": [
      "small_status_indicators",
      "available_insights_badge",
      "non_intrusive_context_cards"
    ],
    "requires_user_action": [
      "rewrite",
      "generate",
      "restructure_outline",
      "accept_gap_bridge",
      "delete_unit",
      "apply_ai_suggestion"
    ],
    "forbidden": [
      "silent_rewrite",
      "silent_restructure",
      "automatic_canon_change",
      "constant_popup_interruption"
    ]
  }
}
```

---

# 13. STATE RULES

## 13.1 Universal Component States

```json
{
  "universal_states": {
    "idle": {
      "description": "Ready, no active operation."
    },
    "active": {
      "description": "Currently selected or controlling context."
    },
    "hover": {
      "description": "Preview affordance only."
    },
    "focus": {
      "description": "Keyboard focus visible."
    },
    "loading": {
      "description": "Data is being fetched or computed."
    },
    "stale": {
      "description": "Data may not reflect current project state."
    },
    "dirty": {
      "description": "Unsaved user edits exist."
    },
    "saving": {
      "description": "Save operation in progress."
    },
    "saved": {
      "description": "Latest state persisted."
    },
    "error": {
      "description": "Operation failed; recovery copy required."
    },
    "empty": {
      "description": "No data yet; provide next action."
    },
    "readonly": {
      "description": "Visible but not editable."
    },
    "candidate": {
      "description": "AI or derived output awaiting user decision."
    },
    "synced": {
      "description": "Renderer view reconciled with persisted backend state."
    },
    "conflict": {
      "description": "Current view conflicts with disk/backend state."
    }
  }
}
```

---

## 13.2 Error State Contract

Every error UI must answer:

```json
{
  "error_contract": {
    "required_questions": [
      "what_failed",
      "what_object_was_affected",
      "did_data_change",
      "is_retry_safe",
      "what_can_user_do_next",
      "is_trace_id_available"
    ],
    "forbidden_messages": [
      "Something went wrong.",
      "Failed.",
      "Error occurred."
    ]
  }
}
```

---

# 14. ADAPTIVE RULES

## 14.1 Breakpoints

```json
{
  "breakpoints": {
    "compact": {
      "max_width": 900,
      "behavior": "single_column_focus"
    },
    "standard": {
      "min_width": 901,
      "max_width": 1399,
      "behavior": "stacked_tabs_or_collapsible_command"
    },
    "wide": {
      "min_width": 1400,
      "max_width": 2199,
      "behavior": "split_command_single_window"
    },
    "ultrawide": {
      "min_width": 2200,
      "behavior": "expanded_split_command"
    },
    "dual_monitor": {
      "behavior": "detachable_or_span_split_command"
    }
  }
}
```

---

## 14.2 Adaptive Layout Behavior

```json
{
  "adaptive_rules": {
    "compact": {
      "command_center": "collapsed_to_drawer",
      "writing_studio": "primary",
      "graphs": "hidden_by_default",
      "contextual_intelligence": "collapsed_badge"
    },
    "standard": {
      "command_center": "tabbed_sidebar",
      "writing_studio": "primary",
      "secondary_panels": "collapsible"
    },
    "wide": {
      "command_center": "left_zone",
      "writing_studio": "right_zone",
      "panel_density": "standard"
    },
    "ultrawide": {
      "command_center": "expanded_left_zone",
      "writing_studio": "expanded_right_zone",
      "panel_density": "standard_or_dense"
    },
    "dual_monitor": {
      "command_center": "monitor_1",
      "writing_studio": "monitor_2",
      "cross_monitor_selection_sync": true
    }
  }
}
```

---

# 15. STORY UNIT UI CONTRACT

## 15.1 Story Unit Base

```json
{
  "story_unit_ui": {
    "base_fields": [
      "unit_id",
      "title",
      "content_preview",
      "state",
      "source_type",
      "placement",
      "confidence",
      "created_at",
      "updated_at"
    ],
    "visible_states": [
      "loose",
      "placed",
      "developing",
      "drafted",
      "resolved"
    ],
    "allowed_actions": [
      "select",
      "place",
      "move",
      "expand",
      "convert",
      "link",
      "archive",
      "delete_with_undo"
    ],
    "forbidden_actions_without_confirmation": [
      "delete",
      "overwrite_draft",
      "apply_ai_restructure"
    ]
  }
}
```

---

## 15.2 Story Unit Card

```json
{
  "component": "story_unit_card",
  "default_size": {
    "width": 280,
    "height": 96
  },
  "min_size": {
    "width": 220,
    "height": 72
  },
  "states": [
    "loose",
    "placed",
    "developing",
    "drafted",
    "resolved",
    "candidate",
    "conflict"
  ],
  "visual_elements": [
    "state_chip",
    "source_icon",
    "title",
    "preview",
    "confidence_indicator",
    "placement_badge",
    "risk_marker"
  ],
  "rules": [
    "Must show if AI-generated.",
    "Must show if unplaced.",
    "Must show if candidate placement.",
    "Must not imply AI confidence equals truth."
  ]
}
```

---

# 16. COMMAND PALETTE / TOOL REGISTRY

## 16.1 Tool Registry Contract

```json
{
  "tool_registry_contract": {
    "required_fields": [
      "tool_id",
      "name",
      "category",
      "description",
      "required_context",
      "allowed_zones",
      "default_zone",
      "requires_ai",
      "model_route",
      "risk_level",
      "mutates_data",
      "requires_confirmation",
      "result_type"
    ]
  }
}
```

---

## 16.2 Tool Example

```json
{
  "tool_id": "detect_narrative_gaps",
  "name": "Detect Narrative Gaps",
  "category": "story_intelligence",
  "required_context": [
    "active_outline"
  ],
  "allowed_zones": [
    "command_center"
  ],
  "default_zone": "narrative_gaps",
  "requires_ai": true,
  "model_route": "api_deep_reasoning",
  "risk_level": "low",
  "mutates_data": false,
  "requires_confirmation": false,
  "result_type": "gap_card_collection"
}
```

---

# 17. MOTION LANGUAGE

## 17.1 Motion Rules

Motion exists to orient, not entertain.

```json
{
  "motion": {
    "duration": {
      "instant": 0,
      "fast": 120,
      "standard": 220,
      "slow": 360
    },
    "easing": {
      "standard": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      "entrance": "cubic-bezier(0.16, 1, 0.3, 1)",
      "exit": "cubic-bezier(0.7, 0, 0.84, 0)"
    },
    "allowed_motion": [
      "panel_expand",
      "panel_collapse",
      "mode_transition",
      "selection_highlight",
      "toast_enter_exit",
      "graph_focus_zoom"
    ],
    "forbidden_motion": [
      "constant_pulsing",
      "decorative_particle_effects",
      "aggressive_auto_movement_during_writing",
      "animated_distractions_in_focus_mode"
    ]
  }
}
```

---

# 18. ACCESSIBILITY RULES

```json
{
  "accessibility": {
    "required": [
      "keyboard_navigation",
      "visible_focus_states",
      "non_color_status_indicators",
      "screen_reader_labels",
      "minimum_contrast_ratio",
      "large_font_mode",
      "reduced_motion_mode"
    ],
    "minimum_touch_target": {
      "width": 36,
      "height": 36
    },
    "focus_mode_requirements": [
      "no auto-opening panels",
      "no animated alerts except critical errors",
      "writing area remains keyboard reachable"
    ],
    "color_rule": "No state may be represented by color alone."
  }
}
```

---

# 19. PHASE 11B IMPLEMENTATION BOUNDARY

## 19.1 Build in Phase 11B

```json
{
  "phase_11b_build": [
    "design_system_tokens",
    "split_command_workspace_shell",
    "adaptive_single_window_layout",
    "writing_studio_shell",
    "command_center_shell",
    "story_unit_contract",
    "one_active_outline_contract",
    "basic_story_navigation",
    "lightweight_outline",
    "contextual_intelligence_placeholder",
    "command_palette_contract",
    "tool_registry_contract",
    "basic_state_styles",
    "basic_accessibility_modes"
  ]
}
```

---

## 19.2 Do Not Build Yet

```json
{
  "phase_11b_do_not_build": [
    "full_constellation_graph",
    "advanced_emotional_pulse",
    "orbital_panels",
    "plugin_marketplace",
    "autonomous_ai_restructure",
    "multi_outline_branching",
    "graph_database_dependency",
    "always_on_ai_intervention",
    "real_time_analysis_on_every_keystroke"
  ]
}
```

---

# 20. CANONICAL JSON SPEC v1

This is the machine-readable seed.

```json
{
  "black_skies_design_system": {
    "version": "1.0.0",
    "phase": "11B",
    "name": "Narrative Command System",
    "principles": [
      "quiet_creation_loud_intelligence",
      "ai_suggests_user_decides",
      "one_active_narrative_context",
      "story_units_before_rigid_structure",
      "progressive_disclosure"
    ],
    "topology": {
      "default": "split_command",
      "zones": {
        "command_center": {
          "position": "left",
          "role": "story_intelligence",
          "density": "high",
          "tone": "cinematic_control"
        },
        "writing_studio": {
          "position": "right",
          "role": "immersive_creation",
          "density": "low_to_medium",
          "tone": "dark_writing_room"
        }
      }
    },
    "workspace_modes": [
      "split_command",
      "focus_writing",
      "structure",
      "revision",
      "continuity",
      "visualization"
    ],
    "colors": {
      "background": {
        "app": "#050709",
        "workspace": "#080C10",
        "panel": "#0C1117",
        "panel_elevated": "#111822"
      },
      "text": {
        "primary": "#E7ECF2",
        "secondary": "#A8B0BA",
        "muted": "#6F7A86"
      },
      "accent": {
        "primary": "#9B5CFF",
        "secondary": "#12C8D9",
        "success": "#35D07F",
        "warning": "#F5A623",
        "danger": "#FF5C5C",
        "emotion": "#D85CFF"
      }
    },
    "spacing": {
      "base_unit": 8,
      "panel_padding": 16,
      "card_padding": 12,
      "panel_gap": 12,
      "zone_gap": 16
    },
    "typography": {
      "workspace_title": {
        "size": 16,
        "line_height": 22,
        "weight": 600,
        "transform": "uppercase",
        "letter_spacing": "0.12em"
      },
      "panel_title": {
        "size": 11,
        "line_height": 16,
        "weight": 600,
        "transform": "uppercase",
        "letter_spacing": "0.12em"
      },
      "body": {
        "size": 14,
        "line_height": 22,
        "weight": 400
      },
      "editor_body": {
        "size": 17,
        "line_height": 32,
        "weight": 400
      }
    },
    "components": {
      "story_navigation": {
        "zone": "command_center",
        "scope": "project",
        "importance": "primary"
      },
      "narrative_overview": {
        "zone": "command_center",
        "scope": "project",
        "importance": "secondary"
      },
      "narrative_gaps": {
        "zone": "command_center",
        "scope": "project_or_selection",
        "importance": "secondary"
      },
      "story_constellation": {
        "zone": "command_center",
        "scope": "project_or_selection",
        "importance": "future",
        "phase": "14"
      },
      "ai_companion": {
        "zone": "command_center",
        "scope": "selection_or_project",
        "importance": "secondary"
      },
      "primary_editor": {
        "zone": "writing_studio",
        "scope": "scene_or_document",
        "importance": "primary"
      },
      "lightweight_outline": {
        "zone": "writing_studio",
        "scope": "active_outline",
        "importance": "secondary"
      },
      "scene_notes": {
        "zone": "writing_studio",
        "scope": "active_scene_or_unit",
        "importance": "secondary"
      },
      "contextual_intelligence": {
        "zone": "writing_studio",
        "scope": "active_scene_or_unit",
        "importance": "secondary"
      }
    },
    "states": [
      "idle",
      "active",
      "hover",
      "focus",
      "loading",
      "stale",
      "dirty",
      "saving",
      "saved",
      "error",
      "empty",
      "readonly",
      "candidate",
      "synced",
      "conflict"
    ],
    "interaction_rules": {
      "ai_default": "user_initiated",
      "hover": "preview_not_commit",
      "click": "select_or_open",
      "destructive_actions": "confirm_or_snapshot_required",
      "writing_mode_interruptions": "critical_only"
    },
    "adaptive_rules": {
      "compact": "command_center_collapses_to_drawer",
      "standard": "command_center_as_tabbed_sidebar",
      "wide": "split_command_single_window",
      "ultrawide": "expanded_split_command",
      "dual_monitor": "command_center_monitor_1_writing_studio_monitor_2"
    },
    "phase_boundaries": {
      "build_now": [
        "workspace_shell",
        "design_tokens",
        "story_unit_contract",
        "one_active_outline_contract",
        "basic_navigation",
        "writing_studio",
        "command_center",
        "contextual_intelligence_placeholder",
        "command_palette_contract"
      ],
      "defer": [
        "full_constellation",
        "advanced_emotion_graph",
        "orbital_panels",
        "graph_database_dependency",
        "plugin_marketplace",
        "autonomous_ai_restructure"
      ]
    }
  }
}
```

---

# 21. PHASE 11B DESIGN FREEZE CHECKLIST

Before implementation begins, these must be locked:

```text
[ ] Split Command is the default topology.
[ ] Writing Studio remains low-noise.
[ ] Command Center carries dense intelligence.
[ ] Story Unit is the base narrative object.
[ ] One active outline is the default.
[ ] AI suggestions are candidate/advisory.
[ ] Color tokens are defined.
[ ] Spacing tokens are defined.
[ ] Typography roles are defined.
[ ] Component contracts are defined.
[ ] Adaptive behavior is defined.
[ ] Error states require recovery copy.
[ ] Focus mode limits interruptions.
[ ] Graph/constellation is deferred.
[ ] Advanced emotional systems are deferred.
[ ] Plugin/orbital systems are deferred.
```

---

# 22. FINAL v1 RULE

If a proposed UI feature violates one of these, it does not enter Phase 11B:

```text
1. Does it protect writing flow?
2. Does it clarify story structure?
3. Does it preserve user control?
4. Does it use existing contracts?
5. Does it avoid fake AI authority?
6. Does it avoid cockpit overload?
7. Does it scale beyond the mockup?
```

If the answer is no, it waits outside the door with the other goblins.
