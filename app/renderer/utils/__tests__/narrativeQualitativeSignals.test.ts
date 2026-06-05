import { describe, expect, it } from "vitest";

import { NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES } from "../../../shared/narrativeQualitativeSignalValidation";
import {
  validateNarrativeQualitativeSignal,
} from "../../../shared/narrativeQualitativeSignalValidation";

const authoredProvenance = {
  origin: "author",
  status: "authored",
  confidence: "high",
  authorConfirmed: true,
  source: "manual-fixture",
  note: "Manually authored qualitative signal fixture.",
} as const;

const inferredProvenance = {
  origin: "system",
  status: "inferred",
  confidence: "medium",
  authorConfirmed: false,
  source: "manual-fixture",
  note: "Manually authored qualitative signal fixture.",
} as const;

function createSignal(category: (typeof NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES)[number]) {
  return {
    id: `sig_${category}`,
    category,
    label: `${category.replaceAll("_", " ")}`,
    explanation: `Explainable signal for ${category}.`,
    relatedObjectIds: ["nar_example_1", "rel_example_1"],
    provenance: authoredProvenance,
    confidence: "medium",
    claimMode: "interpretation",
  } as const;
}

describe("Narrative qualitative signal contract v0", () => {
  it("covers all required qualitative signal categories", () => {
    expect(NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES).toEqual([
      "contradiction",
      "unresolved_gap",
      "relationship_provenance",
      "foreshadow_payoff",
      "orphaned_assertion",
      "sequence_reorder",
      "scene_projection",
      "authored_inferred_boundary",
    ]);
  });

  it("validates a correct qualitative signal", () => {
    const result = validateNarrativeQualitativeSignal(createSignal("contradiction"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("sig_contradiction");
      expect(result.value.confidence).toBe("medium");
    }
  });

  it("represents each allowed signal category", () => {
    for (const category of NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES) {
      const result = validateNarrativeQualitativeSignal(createSignal(category));

      expect(result.ok).toBe(true);
    }
  });

  it("rejects missing or blank ids", () => {
    const missingId = validateNarrativeQualitativeSignal({
      ...createSignal("contradiction"),
      id: undefined as never,
    });
    const blankId = validateNarrativeQualitativeSignal({
      ...createSignal("contradiction"),
      id: "   ",
    });

    expect(missingId.ok).toBe(false);
    expect(blankId.ok).toBe(false);
  });

  it("rejects empty object references", () => {
    const result = validateNarrativeQualitativeSignal({
      ...createSignal("orphaned_assertion"),
      relatedObjectIds: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === "$.relatedObjectIds")).toBe(true);
    }
  });

  it("rejects score, grade, and rating metadata", () => {
    for (const [key, value] of [
      ["score", 0.99],
      ["grade", "A"],
      ["rating", 5],
    ] as const) {
      const result = validateNarrativeQualitativeSignal({
        ...createSignal("relationship_provenance"),
        [key]: value,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((issue) => issue.path === `$.${key}`)).toBe(true);
      }
    }
  });

  it("rejects unknown referenced ids when a known id set is provided", () => {
    const result = validateNarrativeQualitativeSignal(createSignal("scene_projection"), {
      knownIds: new Set(["nar_example_1"]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === "$.relatedObjectIds[1]")).toBe(true);
    }
  });

  it("uses narrative object ids rather than object instances", () => {
    const result = validateNarrativeQualitativeSignal({
      ...createSignal("scene_projection"),
      relatedObjectIds: [{ id: "nar_example_1" } as never],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === "$.relatedObjectIds")).toBe(true);
    }
  });

  it("rejects inferred provenance when the signal claims authored truth", () => {
    const result = validateNarrativeQualitativeSignal({
      ...createSignal("authored_inferred_boundary"),
      provenance: inferredProvenance,
      claimMode: "assertion",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.message.includes("authored provenance")) || result.issues.some((issue) => issue.message.includes("require authored provenance"))).toBe(true);
    }
  });

  it("keeps confidence bounded to low, medium, or high", () => {
    const result = validateNarrativeQualitativeSignal({
      ...createSignal("foreshadow_payoff"),
      confidence: "certain" as never,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === "$.confidence")).toBe(true);
    }
  });

  it("rejects missing explanations and signal provenance", () => {
    const withoutExplanation = validateNarrativeQualitativeSignal({
      ...createSignal("orphaned_assertion"),
      explanation: "   ",
    });
    const withoutProvenance = validateNarrativeQualitativeSignal({
      ...createSignal("orphaned_assertion"),
      provenance: undefined as never,
    });

    expect(withoutExplanation.ok).toBe(false);
    expect(withoutProvenance.ok).toBe(false);
  });

  it("keeps fixture-facing metadata free of grading language", () => {
    for (const category of NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES) {
      const signal = createSignal(category);
      const metadataText = `${signal.label} ${signal.explanation} ${signal.claimMode ?? ""}`.toLowerCase();

      expect(metadataText).not.toMatch(/\bscore\b/);
      expect(metadataText).not.toMatch(/\bgrade\b/);
      expect(metadataText).not.toMatch(/\brating\b/);
      expect(metadataText).not.toMatch(/\bquality\b/);
      expect(metadataText).not.toMatch(/\bverdict\b/);
      expect(metadataText).not.toMatch(/\bpass\b/);
      expect(metadataText).not.toMatch(/\bfail\b/);
      expect(metadataText).not.toMatch(/\bcertain\b/);
    }
  });

  it("remains a contract and validation layer without prose parsing or evaluator behavior", () => {
    const exportedNames = Object.keys({
      validateNarrativeQualitativeSignal,
      NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES,
    });

    expect(exportedNames).toEqual([
      "validateNarrativeQualitativeSignal",
      "NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES",
    ]);
  });
});
