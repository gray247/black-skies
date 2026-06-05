import { describe, expect, it } from "vitest";

import { NARRATIVE_QUALITATIVE_FIXTURES } from "../../../shared/narrativeQualitativeFixtures";
import { evaluateStaticQualitativeFixtures } from "../../../shared/narrativeStaticQualitativeEvaluator";
import {
  collectNarrativeObjectIds,
  validateNarrativeObjectBundle,
} from "../../../shared/narrativeObjectValidation";
import {
  validateNarrativeQualitativeSignal,
} from "../../../shared/narrativeQualitativeSignalValidation";

function collectFixtureKnownIds() {
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

describe("Static qualitative evaluator v0", () => {
  it("emits one signal for each implemented fixture category", () => {
    const result = evaluateStaticQualitativeFixtures(NARRATIVE_QUALITATIVE_FIXTURES);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((signal) => signal.category)).toEqual([
        "contradiction",
        "unresolved_gap",
        "relationship_provenance",
        "foreshadow_payoff",
        "orphaned_assertion",
        "sequence_reorder",
        "scene_projection",
        "authored_inferred_boundary",
      ]);
      expect(result.value).toHaveLength(8);
    }
  });

  it("validates emitted signals under the qualitative signal contract", () => {
    const result = evaluateStaticQualitativeFixtures(NARRATIVE_QUALITATIVE_FIXTURES);
    const knownIds = collectFixtureKnownIds();

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const signal of result.value) {
        const validation = validateNarrativeQualitativeSignal(signal, { knownIds });

        expect(validation.ok).toBe(true);
        expect(signal.relatedObjectIds.every((id) => typeof id === "string")).toBe(true);
      }
    }
  });

  it("keeps emitted signal objects limited to the contract fields", () => {
    const result = evaluateStaticQualitativeFixtures(NARRATIVE_QUALITATIVE_FIXTURES);

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const signal of result.value) {
        expect(Object.keys(signal).sort()).toEqual([
          "category",
          "confidence",
          "explanation",
          "id",
          "label",
          "provenance",
          "relatedObjectIds",
        ]);
      }
    }
  });

  it("does not mutate the input fixtures", () => {
    const input = structuredClone(NARRATIVE_QUALITATIVE_FIXTURES);
    const before = structuredClone(input);

    const result = evaluateStaticQualitativeFixtures(input);

    expect(input).toEqual(before);
    expect(result.ok).toBe(true);
  });

  it("preserves contradiction signals as competing authored assertions", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "contradiction");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = evaluateStaticQualitativeFixtures([fixture]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].category).toBe("contradiction");
      expect(result.value[0].relatedObjectIds).toEqual([
        "qual_contradiction_lantern_lit",
        "qual_contradiction_lantern_dark",
        "qual_rel_contradiction_lantern",
      ]);
      expect(result.value[0].explanation).toContain("qual_rel_contradiction_lantern");
      expect(result.value[0].explanation).toContain("does not resolve");
    }
  });

  it("keeps the unresolved gap signal attached to a first-class Narrative Gap", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "unresolved_narrative_gap");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = evaluateStaticQualitativeFixtures([fixture]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].category).toBe("unresolved_gap");
      expect(result.value[0].relatedObjectIds).toEqual([
        "qual_gap_station_to_motel",
        "qual_gap_departure",
        "qual_gap_arrival",
        "qual_rel_gap_route",
      ]);
      expect(validateNarrativeObjectBundle(fixture.bundle).ok).toBe(true);
    }
  });

  it("uses explicit relationships rather than prose parsing for foreshadow/payoff", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "foreshadow_payoff");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = evaluateStaticQualitativeFixtures([fixture]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].category).toBe("foreshadow_payoff");
      expect(result.value[0].relatedObjectIds).toEqual([
        "qual_foreshadow_rain_air",
        "qual_foreshadow_roof_leak",
        "qual_foreshadow_bucket",
        "qual_rel_rain_foreshadows_leak",
        "qual_rel_leak_pays_off_bucket",
      ]);
      expect(result.value[0].explanation).toContain("qual_rel_rain_foreshadows_leak");
      expect(result.value[0].explanation).not.toContain("The air smelled of rain.");
      expect(result.value[0].explanation).not.toContain("The roof had been leaking for hours.");
    }
  });

  it("keeps orphaned assertions unowned by Story Units or Scenes", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "orphaned_assertion");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = evaluateStaticQualitativeFixtures([fixture]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].category).toBe("orphaned_assertion");
      expect(result.value[0].relatedObjectIds).toEqual(["qual_orphan_red_umbrella"]);
      expect(fixture.bundle.storyUnits).toHaveLength(0);
      expect(fixture.bundle.scenes).toHaveLength(0);
    }
  });

  it("preserves durable ids while the sequence order and relationship context change", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "sequence_reorder");

    expect(fixture).toBeDefined();
    if (!fixture || !fixture.comparisonBundle) {
      return;
    }

    const result = evaluateStaticQualitativeFixtures([fixture]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].category).toBe("sequence_reorder");
      expect(result.value[0].relatedObjectIds).toEqual([
        "qual_sequence_train_arrives",
        "qual_sequence_clock_strikes",
        "qual_sequence_letter_waiting",
        "qual_sequence_dawn_arrival",
        "qual_sequence_bench_letter",
        "qual_rel_sequence_arrival_to_letter",
        "qual_scene_dawn_platform",
        "qual_scene_bench_letter",
        "qual_chapter_morning_sequence",
      ]);
      expect(fixture.bundle.scenes.map((scene) => scene.order)).toEqual([1, 2]);
      expect(fixture.comparisonBundle.scenes.map((scene) => scene.order)).toEqual([2, 1]);
    }
  });

  it("keeps the scene projection signal derived and read-only", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "scene_projection");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = evaluateStaticQualitativeFixtures([fixture]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].category).toBe("scene_projection");
      expect(result.value[0].relatedObjectIds).toEqual([
        "qual_projection_market_story_unit",
        "qual_projection_market_scene",
        "qual_projection_market_chapter",
      ]);
      expect(result.value[0].explanation).toContain("read-only projection");
      expect(result.value[0].explanation).not.toContain("narrative assertions");
    }
  });

  it("keeps authored and inferred provenance separated in the boundary signal", () => {
    const fixture = NARRATIVE_QUALITATIVE_FIXTURES.find((entry) => entry.category === "authored_vs_inferred_boundary");

    expect(fixture).toBeDefined();
    if (!fixture) {
      return;
    }

    const result = evaluateStaticQualitativeFixtures([fixture]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].category).toBe("authored_inferred_boundary");
      expect(result.value[0].relatedObjectIds).toEqual([
        "qual_boundary_archive_key",
        "qual_boundary_room_searched",
        "qual_boundary_inferred_cluster",
        "qual_rel_boundary_supports",
      ]);
      expect(result.value[0].provenance.status).toBe("derived");
      expect(result.value[0].provenance.authorConfirmed).toBe(false);
      expect(result.value[0].explanation).toContain("inferred story unit");
      expect(result.value[0].explanation).toContain("keeps the inferred provenance separate");
    }
  });

  it("fails clearly when given an unknown qualitative category", () => {
    const result = evaluateStaticQualitativeFixtures([
      {
        ...NARRATIVE_QUALITATIVE_FIXTURES[0],
        category: "unknown_category" as never,
      },
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes("$.fixtures[0].category"))).toBe(true);
    }
  });

  it("does not emit grading or score-as-truth metadata", () => {
    const result = evaluateStaticQualitativeFixtures(NARRATIVE_QUALITATIVE_FIXTURES);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const payload = JSON.stringify(result.value).toLowerCase();

      expect(payload).not.toMatch(/\bscore\b/);
      expect(payload).not.toMatch(/\bgrade\b/);
      expect(payload).not.toMatch(/\brating\b/);
      expect(payload).not.toMatch(/\bquality verdict\b/);
      expect(payload).not.toMatch(/\bgood writing\b/);
      expect(payload).not.toMatch(/\bbad writing\b/);
      expect(payload).not.toMatch(/\bpass\/fail\b/);
      expect(payload).not.toMatch(/\bcertain\b/);
    }
  });
});
