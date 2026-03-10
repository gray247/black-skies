"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LAYOUT = exports.LEGACY_PANE_ALIASES = exports.LAYOUT_SCHEMA_VERSION = exports.PANE_METADATA = exports.DEFAULT_PANE_IDS = exports.CANONICAL_PANES = exports.LAYOUT_CHANNELS = void 0;
exports.applySplitWeights = applySplitWeights;
exports.normalisePaneId = normalisePaneId;
exports.sanitizeLayoutNode = sanitizeLayoutNode;
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
    "storyInsights",
    "corkboard",
    "timeline",
    "critique",
    "relationshipGraph",
];
exports.DEFAULT_PANE_IDS = exports.CANONICAL_PANES;
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
        title: "Story Insights",
        description: "See pacing and emotion data.",
    },
    corkboard: {
        title: "Corkboard",
        description: "Browse scene cards with metadata.",
    },
    relationshipGraph: {
        title: "Feedback notes",
        description: "Explore character-scene relationships.",
        hidden: true,
    },
    critique: {
        title: "Critique",
        description: "Review feedback and suggested revisions.",
    },
};
const MIN_SPLIT_WEIGHT = 0.05;
const DEFAULT_SPLIT_WEIGHTS = [0.5, 0.5];
function sanitizeWeightPair(input) {
    const sanitized = [
        Number.isFinite(input?.[0]) ? Math.max(input[0], 0) : 0,
        Number.isFinite(input?.[1]) ? Math.max(input[1], 0) : 0,
    ];
    const total = sanitized[0] + sanitized[1];
    if (total <= 0) {
        return DEFAULT_SPLIT_WEIGHTS;
    }
    const normalized = [sanitized[0] / total, sanitized[1] / total];
    const clamped = [
        Math.min(1 - MIN_SPLIT_WEIGHT, Math.max(MIN_SPLIT_WEIGHT, normalized[0])),
        Math.min(1 - MIN_SPLIT_WEIGHT, Math.max(MIN_SPLIT_WEIGHT, normalized[1])),
    ];
    const reTotal = clamped[0] + clamped[1];
    if (reTotal <= 0) {
        return DEFAULT_SPLIT_WEIGHTS;
    }
    return [clamped[0] / reTotal, clamped[1] / reTotal];
}
function weightsFromSplitPercentage(splitPercentage) {
    if (typeof splitPercentage !== 'number' || Number.isNaN(splitPercentage)) {
        return DEFAULT_SPLIT_WEIGHTS;
    }
    const bounded = Math.min(95, Math.max(5, splitPercentage));
    return sanitizeWeightPair([bounded / 100, (100 - bounded) / 100]);
}
function splitPercentageFromWeights(weights) {
    return Math.min(95, Math.max(5, weights[0] * 100));
}
function applySplitWeights(node, weights) {
    const normalized = sanitizeWeightPair(weights);
    return {
        ...node,
        weights: normalized,
        splitPercentage: splitPercentageFromWeights(normalized),
    };
}
function hasWeights(node) {
    return typeof node === "object" && node !== null && "weights" in node;
}
function makeSplitNode(direction, first, second, splitPercentage, weights) {
    const bundle = weights ?? weightsFromSplitPercentage(splitPercentage);
    const normalized = sanitizeWeightPair(bundle);
    return {
        direction,
        first,
        second,
        weights: normalized,
        splitPercentage: splitPercentageFromWeights(normalized),
    };
}
exports.LAYOUT_SCHEMA_VERSION = 3;
exports.LEGACY_PANE_ALIASES = {
    wizard: "outline",
    "draft-board": "draftPreview",
    history: "timeline",
    analytics: "storyInsights",
    relationships: "relationshipGraph",
};
const REQUIRED_LAYOUT_PANES = [
    "outline",
    "draftPreview",
    "storyInsights",
    "corkboard",
];
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
exports.DEFAULT_LAYOUT = makeSplitNode('column', makeSplitNode('row', 'draftPreview', 'storyInsights', 50), makeSplitNode('row', 'outline', 'corkboard', 50), 50);
function normalizeLegacyPane(value) {
    if (!value) {
        return null;
    }
    if (exports.CANONICAL_PANES.includes(value)) {
        return value;
    }
    return exports.LEGACY_PANE_ALIASES[value] ?? null;
}
function collectPaneIds(node, result, seen) {
    if (typeof node === "string") {
        if (seen.has(node)) {
            return false;
        }
        seen.add(node);
        result.push(node);
        return true;
    }
    if (!collectPaneIds(node.first, result, seen)) {
        return false;
    }
    if (!collectPaneIds(node.second, result, seen)) {
        return false;
    }
    return true;
}
function treeMeetsRequirements(tree) {
    const ids = [];
    if (!collectPaneIds(tree, ids, new Set())) {
        return false;
    }
    const present = new Set(ids);
    for (const required of REQUIRED_LAYOUT_PANES) {
        if (!present.has(required)) {
            return false;
        }
    }
    if (ids.length !== REQUIRED_LAYOUT_PANES.length) {
        return false;
    }
    return true;
}
function logInvalidLayout(reason) {
    console.warn('[dock] Invalid saved layout ignored; using default layout', { reason });
}
function sanitizeLayoutNode(node) {
    if (!node) {
        return null;
    }
    if (typeof node === 'string') {
        const normalized = normalizeLegacyPane(node);
        return normalized ?? null;
    }
    const first = sanitizeLayoutNode(node.first);
    const second = sanitizeLayoutNode(node.second);
    if (!first || !second) {
        return null;
    }
    const direction = node.direction ?? 'row';
    const candidate = makeSplitNode(direction, first, second, node.splitPercentage, hasWeights(node) ? node.weights : undefined);
    if (!treeMeetsRequirements(candidate)) {
        logInvalidLayout('layout contains duplicates or missing required panes');
        return null;
    }
    return candidate;
}
//# sourceMappingURL=layout.js.map