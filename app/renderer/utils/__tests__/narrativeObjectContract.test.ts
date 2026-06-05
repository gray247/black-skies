import { describe, expect, it } from "vitest";

import {
  NARRATIVE_ASSERTION_FIXTURES,
  NARRATIVE_CHAPTER_FIXTURES,
  NARRATIVE_GAP_FIXTURES,
  NARRATIVE_OBJECT_FIXTURES,
  NARRATIVE_RELATIONSHIP_FIXTURES,
  NARRATIVE_SCENE_FIXTURES,
  NARRATIVE_STORY_UNIT_FIXTURES,
} from "../../../shared/narrativeObjectFixtures";
import {
  collectNarrativeObjectIds,
  validateNarrativeAssertion,
  validateNarrativeChapter,
  validateNarrativeGap,
  validateNarrativeObjectBundle,
  validateNarrativeProvenance,
  validateNarrativeRelationship,
  validateStoryUnit,
} from "../../../shared/narrativeObjectValidation";

describe("Narrative Object Contract v0", () => {
  it("accepts a valid Narrative Assertion", () => {
    const result = validateNarrativeAssertion(NARRATIVE_ASSERTION_FIXTURES[0]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("nar_larry_boat");
    }
  });

  it("accepts a valid Story Unit", () => {
    const result = validateStoryUnit(NARRATIVE_STORY_UNIT_FIXTURES[0]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.lineage.mergedFromIds).toEqual([
        "nar_larry_boat",
        "nar_larry_fish",
        "nar_larry_dinner",
      ]);
    }
  });

  it("accepts a valid Narrative Gap", () => {
    const result = validateNarrativeGap(NARRATIVE_GAP_FIXTURES[0]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.startAnchorIds).toEqual(["nar_larry_boat"]);
      expect(result.value.endAnchorIds).toEqual(["nar_larry_dinner"]);
    }
  });

  it("accepts a valid Relationship", () => {
    const knownIds = collectNarrativeObjectIds(NARRATIVE_OBJECT_FIXTURES);
    const result = validateNarrativeRelationship(NARRATIVE_RELATIONSHIP_FIXTURES[0], { knownIds });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.relationshipType).toBe("continues");
    }
  });

  it("keeps authored and inferred provenance distinct", () => {
    const authored = validateNarrativeProvenance(NARRATIVE_ASSERTION_FIXTURES[0].provenance);
    const inferred = validateNarrativeProvenance(NARRATIVE_STORY_UNIT_FIXTURES[1].provenance);

    expect(authored.ok).toBe(true);
    expect(inferred.ok).toBe(true);
    if (authored.ok && inferred.ok) {
      expect(authored.value.status).toBe("authored");
      expect(inferred.value.status).toBe("inferred");
      expect(inferred.value.authorConfirmed).toBe(false);
    }
  });

  it("represents contradiction relationships without overwriting the connected objects", () => {
    const originalAssertions = structuredClone([
      NARRATIVE_ASSERTION_FIXTURES[4],
      NARRATIVE_ASSERTION_FIXTURES[5],
    ]);
    const knownIds = new Set(originalAssertions.map((entry) => entry.id));
    const result = validateNarrativeRelationship(NARRATIVE_RELATIONSHIP_FIXTURES[2], { knownIds });

    expect(result.ok).toBe(true);
    expect(originalAssertions).toEqual([
      NARRATIVE_ASSERTION_FIXTURES[4],
      NARRATIVE_ASSERTION_FIXTURES[5],
    ]);
  });

  it("preserves merge and split lineage information", () => {
    const mergedUnit = validateStoryUnit(NARRATIVE_STORY_UNIT_FIXTURES[0]);
    const splitUnit = validateStoryUnit(NARRATIVE_STORY_UNIT_FIXTURES[1]);

    expect(mergedUnit.ok).toBe(true);
    expect(splitUnit.ok).toBe(true);
    if (mergedUnit.ok && splitUnit.ok) {
      expect(mergedUnit.value.lineage.mergedFromIds).toHaveLength(3);
      expect(splitUnit.value.lineage.splitFromId).toBe("su_larry_day");
      expect(splitUnit.value.lineage.branchId).toBe("branch_larry_evening");
    }
  });

  it("rejects missing IDs", () => {
    const result = validateNarrativeAssertion({
      ...NARRATIVE_ASSERTION_FIXTURES[0],
      id: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === "$.id")).toBe(true);
    }
  });

  it("rejects a relationship with an unknown target", () => {
    const knownIds = new Set<string>(["nar_larry_died"]);
    const result = validateNarrativeRelationship(
      {
        ...NARRATIVE_RELATIONSHIP_FIXTURES[2],
        targetId: "missing_target",
      },
      { knownIds },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === "$.targetId")).toBe(true);
    }
  });

  it("rejects an inferred object being treated as authored truth", () => {
    const result = validateStoryUnit({
      ...NARRATIVE_STORY_UNIT_FIXTURES[1],
      provenance: {
        ...NARRATIVE_STORY_UNIT_FIXTURES[1].provenance,
        authorConfirmed: true,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.issues.some((issue) => issue.message.includes("authored truth")),
      ).toBe(true);
    }
  });

  it("validates the full contract bundle without mutation", () => {
    const before = structuredClone(NARRATIVE_OBJECT_FIXTURES);
    const result = validateNarrativeObjectBundle(NARRATIVE_OBJECT_FIXTURES);

    expect(result.ok).toBe(true);
    expect(NARRATIVE_OBJECT_FIXTURES).toEqual(before);
    expect(validateNarrativeChapter(NARRATIVE_CHAPTER_FIXTURES[0]).ok).toBe(true);
    expect(NARRATIVE_SCENE_FIXTURES[0].chapterId).toBe("chapter_larry_story");
  });
});

