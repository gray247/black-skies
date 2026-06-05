import { describe, expect, it } from "vitest";

import { NARRATIVE_QUALITATIVE_FIXTURES } from "../../../shared/narrativeQualitativeFixtures";
import { collectNarrativeObjectIds, validateNarrativeObjectBundle } from "../../../shared/narrativeObjectValidation";

describe("Narrative qualitative fixture foundation", () => {
  it("covers all required qualitative fixture categories", () => {
    expect(NARRATIVE_QUALITATIVE_FIXTURES.map((fixture) => fixture.category).sort()).toEqual([
      "authored_vs_inferred_boundary",
      "contradiction",
      "foreshadow_payoff",
      "orphaned_assertion",
      "relationship_provenance",
      "scene_projection",
      "sequence_reorder",
      "unresolved_narrative_gap",
    ]);
  });

  it("validates every qualitative fixture bundle against Narrative Object Contract v0", () => {
    for (const fixture of NARRATIVE_QUALITATIVE_FIXTURES) {
      const result = validateNarrativeObjectBundle(fixture.bundle);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(fixture.bundle);
      }
    }
  });

  it("keeps all fixture provenance explicit without Companion authorship claims", () => {
    for (const fixture of NARRATIVE_QUALITATIVE_FIXTURES) {
      for (const object of [
        ...fixture.bundle.assertions,
        ...fixture.bundle.storyUnits,
        ...fixture.bundle.gaps,
        ...fixture.bundle.relationships,
        ...fixture.bundle.scenes,
        ...fixture.bundle.chapters,
      ]) {
        expect(object.provenance.origin).not.toBe("companion");
      }
    }
  });

  it("preserves contradiction fixtures as competing assertions without overwriting either claim", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "contradiction");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const before = structuredClone(fixture.bundle);
    const result = validateNarrativeObjectBundle(fixture.bundle);

    expect(fixture.bundle).toEqual(before);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assertions.map((assertion) => assertion.id)).toEqual([
        "qual_contradiction_lantern_lit",
        "qual_contradiction_lantern_dark",
      ]);
      expect(result.value.relationships[0].relationshipType).toBe("contradicts");
    }
  });

  it("contains a first-class Narrative Gap for the unresolved gap fixture", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "unresolved_narrative_gap");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = validateNarrativeObjectBundle(fixture.bundle);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.gaps).toHaveLength(1);
      expect(result.value.gaps[0].kind).toBe("narrative_gap");
      expect(result.value.gaps[0].startAnchorIds).toEqual(["qual_gap_departure"]);
      expect(result.value.gaps[0].endAnchorIds).toEqual(["qual_gap_arrival"]);
      expect(result.value.gaps[0].relatedRelationshipIds).toEqual(["qual_rel_gap_route"]);
    }
  });

  it("uses explicit relationships, not prose parsing, for the foreshadow/payoff fixture", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "foreshadow_payoff");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const relationshipTypes = fixture.bundle.relationships.map((relationship) => relationship.relationshipType);

    expect(relationshipTypes).toEqual(["foreshadows", "pays_off"]);
    expect(fixture.provenanceBoundaries.join(" ")).toContain("no prose parsing");
    expect(fixture.bundle.assertions).toHaveLength(3);
  });

  it("allows an orphaned assertion without Story Unit or Scene ownership", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "orphaned_assertion");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = validateNarrativeObjectBundle(fixture.bundle);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assertions).toHaveLength(1);
      expect(result.value.storyUnits).toHaveLength(0);
      expect(result.value.scenes).toHaveLength(0);
      expect(result.value.assertions[0].sceneId).toBeNull();
    }
  });

  it("preserves durable ids while order and relationship context change in the sequence fixture", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "sequence_reorder");

    expect(fixture).toBeDefined();
    if (!fixture || !fixture.comparisonBundle) {
      return;
    }

    const baselineIds = collectNarrativeObjectIds(fixture.bundle);
    const reorderedIds = collectNarrativeObjectIds(fixture.comparisonBundle);

    expect(baselineIds).toEqual(reorderedIds);
    expect(fixture.bundle.scenes.map((scene) => scene.order)).toEqual([1, 2]);
    expect(fixture.comparisonBundle.scenes.map((scene) => scene.order)).toEqual([2, 1]);
    expect(fixture.bundle.relationships[0].description).not.toBe(fixture.comparisonBundle.relationships[0].description);
  });

  it("keeps the scene projection fixture derived and read-only", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "scene_projection");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = validateNarrativeObjectBundle(fixture.bundle);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assertions).toHaveLength(0);
      expect(result.value.gaps).toHaveLength(0);
      expect(result.value.relationships).toHaveLength(0);
      expect(result.value.storyUnits[0].provenance.status).toBe("derived");
      expect(result.value.storyUnits[0].provenance.authorConfirmed).toBe(false);
      expect(result.value.scenes[0].provenance.status).toBe("derived");
      expect(result.value.scenes[0].provenance.authorConfirmed).toBe(false);
      expect(result.value.chapters[0].provenance.status).toBe("derived");
    }
  });

  it("keeps authored and inferred provenance explicit in the boundary fixture", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "authored_vs_inferred_boundary");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = validateNarrativeObjectBundle(fixture.bundle);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assertions.every((assertion) => assertion.provenance.status === "authored")).toBe(true);
      expect(result.value.storyUnits[0].provenance.status).toBe("inferred");
      expect(result.value.storyUnits[0].provenance.authorConfirmed).toBe(false);
      expect(result.value.relationships[0].provenance.status).toBe("inferred");
      expect(result.value.relationships[0].provenance.authorConfirmed).toBe(false);
    }
  });

  it("does not introduce grading or score-as-truth metadata", () => {
    for (const fixture of NARRATIVE_QUALITATIVE_FIXTURES) {
      expect(Object.keys(fixture).some((key) => /score|grade|rating/i.test(key))).toBe(false);

      const metadataText = [
        fixture.expectedFutureSignals.join(" "),
        fixture.provenanceBoundaries.join(" "),
        fixture.mustNotOverclaim.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      expect(metadataText).not.toMatch(/\bscore\b/);
      expect(metadataText).not.toMatch(/\bgrade\b/);
      expect(metadataText).not.toMatch(/\brating\b/);
      expect(metadataText).not.toMatch(/\bquality\b/);
      expect(metadataText).not.toMatch(/\bverdict\b/);
      expect(metadataText).not.toMatch(/\bpass\b/);
      expect(metadataText).not.toMatch(/\bfail\b/);
      expect(metadataText).not.toMatch(/\bcertainty\b/);
    }
  });
});
