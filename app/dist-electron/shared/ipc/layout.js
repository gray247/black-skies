"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LAYOUT = exports.LEGACY_PANE_ALIASES = exports.LAYOUT_SCHEMA_VERSION = exports.PANE_METADATA = exports.CANONICAL_PANES = exports.LAYOUT_CHANNELS = void 0;
exports.normalisePaneId = normalisePaneId;
exports.LAYOUT_CHANNELS = {
    load: "layout:load",
    save: "layout:save",
    reset: "layout:reset",
    listFloating: "layout:floating:list",
    openFloating: "layout:floating:open",
    closeFloating: "layout:floating:close",
};
exports.CANONICAL_PANES = [
    "outline",
    "draftPreview",
    "timeline",
    "storyInsights",
    "corkboard",
    "relationshipGraph",
    "critique",
];
exports.PANE_METADATA = {
    outline: {
        title: "Outline",
        description: "Plan chapters, scenes, and beats.",
    },
    draftPreview: {
        title: "Draft preview",
        description: "Write and edit your scene text.",
    },
    timeline: {
        title: "Timeline",
        description: "Review your history and progress.",
    },
    storyInsights: {
        title: "Story insights",
        description: "See pacing and emotion data.",
    },
    corkboard: {
        title: "Corkboard",
        description: "Browse scene cards with metadata.",
    },
    relationshipGraph: {
        title: "Relationship graph",
        description: "Explore character-scene relationships.",
        hidden: true,
    },
    critique: {
        title: "Critique",
        description: "Review feedback and suggested revisions.",
    },
};
exports.LAYOUT_SCHEMA_VERSION = 3;
exports.LEGACY_PANE_ALIASES = {
    wizard: "outline",
    "draft-board": "draftPreview",
    history: "timeline",
    analytics: "storyInsights",
    relationships: "relationshipGraph",
};
function normalisePaneId(value) {
    if (!value) {
        return null;
    }
    if (exports.CANONICAL_PANES.includes(value)) {
        return value;
    }
    const alias = exports.LEGACY_PANE_ALIASES[value];
    return alias ?? null;
}
exports.DEFAULT_LAYOUT = {
    direction: "row",
    first: "outline",
    second: {
        direction: "column",
        first: "draftPreview",
        second: {
            direction: "column",
            first: "storyInsights",
            second: "corkboard",
        },
    },
};
//# sourceMappingURL=layout.js.map