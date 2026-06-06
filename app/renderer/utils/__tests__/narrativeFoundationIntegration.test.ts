import { describe, expect, it } from "vitest";

import type { ReadOnlySceneCompatibilityInput } from "../../../shared/narrativeSceneCompatibility";
import { deriveReadOnlyNarrativeObjectsFromScenes } from "../../../shared/narrativeSceneCompatibility";
import { NARRATIVE_QUALITATIVE_FIXTURES } from "../../../shared/narrativeQualitativeFixtures";
import { evaluateStaticQualitativeFixtures } from "../../../shared/narrativeStaticQualitativeEvaluator";
import {
  collectNarrativeObjectIds,
  validateNarrativeObjectBundle,
} from "../../../shared/narrativeObjectValidation";
import {
  validateNarrativeQualitativeSignal,
} from "../../../shared/narrativeQualitativeSignalValidation";

const SCENE_COMPATIBILITY_FIXTURE: ReadOnlySceneCompatibilityInput = {
  path: "C:/Dev/black-skies/sample_project/Esther_Estate",
  outline: {
    schema_version: "OutlineSchema v1",
    outline_id: "outline_proj_esther_estate",
    project_id: "proj_esther_estate",
    acts: ["Act I"],
    chapters: [
      {
        id: "ch_0001",
        order: 1,
        title: "Chapter 1",
      },
    ],
    scenes: [
      {
        id: "sc_0001",
        order: 1,
        title: "Opening",
        chapter_id: "ch_0001",
      },
      {
        id: "sc_0002",
        order: 2,
        title: "Aftermath",
        chapter_id: "ch_0001",
      },
    ],
  },
  scenes: [
    {
      id: "sc_0001",
      title: "Opening",
      order: 1,
      chapter_id: "ch_0001",
    },
    {
      id: "sc_0002",
      title: "Aftermath",
      order: 2,
      chapter_id: "ch_0001",
    },
  ],
  drafts: {
    sc_0001: "Once upon a time...",
    sc_0002: "The day continued.",
  },
};

function collectIntegrationKnownIds() {
  const knownIds = new Set<string>();

  for (const fixture of NARRATIVE_QUALITATIVE_FIXTURES) {
    for (const id of collectNarrativeObjectIds(fixture.bundle)) {
      knownIds.add(id);
    }
    if (fixture.comparisonBundle) {
      for (const id of collectNarrativeObjectIds(fixture.comparisonBundle)) {
        knownIds.add(id);
      }
    }
  }

  return knownIds;
}

describe("Narrative foundation integration proof", () => {
  it("connects manual qualitative fixtures to validated qualitative signals without mutation", () => {
    const input = structuredClone(NARRATIVE_QUALITATIVE_FIXTURES);
    const before = structuredClone(input);
    const knownIds = collectIntegrationKnownIds();

    for (const fixture of input) {
      const bundleValidation = validateNarrativeObjectBundle(fixture.bundle);

      expect(bundleValidation.ok).toBe(true);
      if (fixture.comparisonBundle) {
        expect(validateNarrativeObjectBundle(fixture.comparisonBundle).ok).toBe(true);
      }
    }

    const evaluation = evaluateStaticQualitativeFixtures(input);

    expect(input).toEqual(before);
    expect(evaluation.ok).toBe(true);
    if (evaluation.ok) {
      expect(evaluation.value).toHaveLength(8);

      for (const signal of evaluation.value) {
        const validation = validateNarrativeQualitativeSignal(signal, { knownIds });

        expect(validation.ok).toBe(true);
        expect(signal.relatedObjectIds.length).toBeGreaterThan(0);
        expect(signal.relatedObjectIds.every((id) => typeof id === "string")).toBe(true);
        expect(signal.relatedObjectIds.every((id) => knownIds.has(id))).toBe(true);
        expect(signal.provenance.status).toBe("derived");
        expect(signal.provenance.authorConfirmed).toBe(false);
      }
    }
  });

  it("keeps the integration path free of grading metadata and object-instance references", () => {
    const evaluation = evaluateStaticQualitativeFixtures(NARRATIVE_QUALITATIVE_FIXTURES);

    expect(evaluation.ok).toBe(true);
    if (evaluation.ok) {
      const payload = JSON.stringify(evaluation.value).toLowerCase();

      expect(payload).not.toMatch(/\bscore\b/);
      expect(payload).not.toMatch(/\bgrade\b/);
      expect(payload).not.toMatch(/\brating\b/);
      expect(payload).not.toMatch(/\bquality verdict\b/);
      expect(payload).not.toMatch(/\bpass\/fail\b/);

      for (const signal of evaluation.value) {
        expect(signal.relatedObjectIds.every((id) => typeof id === "string")).toBe(true);
        expect(signal.relatedObjectIds.some((id) => id.includes("[object Object]"))).toBe(false);
      }
    }
  });

  it("does not require Story Units for orphaned assertions and does not parse prose into signals", () => {
    const orphanedFixture = NARRATIVE_QUALITATIVE_FIXTURES.find((fixture) => fixture.category === "orphaned_assertion");
    const foreshadowFixture = NARRATIVE_QUALITATIVE_FIXTURES.find((fixture) => fixture.category === "foreshadow_payoff");

    expect(orphanedFixture).toBeDefined();
    expect(foreshadowFixture).toBeDefined();
    if (!orphanedFixture || !foreshadowFixture) {
      return;
    }

    const orphanedValidation = validateNarrativeObjectBundle(orphanedFixture.bundle);
    const evaluation = evaluateStaticQualitativeFixtures([orphanedFixture, foreshadowFixture]);

    expect(orphanedValidation.ok).toBe(true);
    expect(orphanedFixture.bundle.storyUnits).toHaveLength(0);
    expect(orphanedFixture.bundle.scenes).toHaveLength(0);
    expect(evaluation.ok).toBe(true);
    if (evaluation.ok) {
      const orphanedSignal = evaluation.value.find((signal) => signal.category === "orphaned_assertion");
      const foreshadowSignal = evaluation.value.find((signal) => signal.category === "foreshadow_payoff");

      expect(orphanedSignal?.relatedObjectIds).toEqual(["qual_orphan_red_umbrella"]);
      expect(foreshadowSignal?.explanation).not.toContain("The air smelled of rain.");
      expect(foreshadowSignal?.explanation).not.toContain("The roof had been leaking for hours.");
    }
  });

  it("keeps inferred and derived provenance from becoming authored truth across the integration slice", () => {
    const evaluation = evaluateStaticQualitativeFixtures(NARRATIVE_QUALITATIVE_FIXTURES);

    expect(evaluation.ok).toBe(true);
    if (evaluation.ok) {
      const boundarySignal = evaluation.value.find((signal) => signal.category === "authored_inferred_boundary");
      const projectionSignal = evaluation.value.find((signal) => signal.category === "scene_projection");

      expect(boundarySignal).toBeDefined();
      expect(projectionSignal).toBeDefined();
      expect(boundarySignal?.provenance.status).toBe("derived");
      expect(boundarySignal?.provenance.authorConfirmed).toBe(false);
      expect(projectionSignal?.provenance.status).toBe("derived");
      expect(projectionSignal?.provenance.authorConfirmed).toBe(false);
      expect(boundarySignal?.claimMode).toBeUndefined();
      expect(projectionSignal?.claimMode).toBeUndefined();
    }
  });

  it("optionally proves the read-only scene adapter remains derived and preserves scene ids and order", () => {
    const input = structuredClone(SCENE_COMPATIBILITY_FIXTURE);
    const before = structuredClone(input);
    const result = deriveReadOnlyNarrativeObjectsFromScenes(input);

    expect(input).toEqual(before);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(validateNarrativeObjectBundle(result.bundle).ok).toBe(true);
      expect(result.bundle.assertions).toEqual([]);
      expect(result.bundle.scenes.map((scene) => scene.id)).toEqual(["sc_0001", "sc_0002"]);
      expect(result.bundle.scenes.map((scene) => scene.order)).toEqual([1, 2]);
      expect(result.bundle.storyUnits.map((storyUnit) => storyUnit.sceneId)).toEqual(["sc_0001", "sc_0002"]);
      expect(result.bundle.storyUnits.every((storyUnit) => storyUnit.provenance.status === "derived")).toBe(true);
      expect(result.bundle.scenes.every((scene) => scene.provenance.status === "derived")).toBe(true);
      expect(result.bundle.chapters.every((chapter) => chapter.provenance.status === "derived")).toBe(true);
    }
  });
});
