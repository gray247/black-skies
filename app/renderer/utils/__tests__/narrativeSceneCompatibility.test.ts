import { describe, expect, it } from "vitest";

import type { ReadOnlySceneCompatibilityInput } from "../../../shared/narrativeSceneCompatibility";
import { deriveReadOnlyNarrativeObjectsFromScenes } from "../../../shared/narrativeSceneCompatibility";
import { validateNarrativeObjectBundle } from "../../../shared/narrativeObjectValidation";

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

describe("read-only scene compatibility adapter", () => {
  it("derives a valid narrative object bundle without mutating the input", () => {
    const input = structuredClone(SCENE_COMPATIBILITY_FIXTURE);
    const before = structuredClone(input);

    const result = deriveReadOnlyNarrativeObjectsFromScenes(input);

    expect(input).toEqual(before);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bundle.storyUnits).toHaveLength(2);
      expect(result.bundle.scenes).toHaveLength(2);
      expect(result.bundle.chapters).toHaveLength(1);
      expect(result.bundle.assertions).toHaveLength(0);
      expect(result.bundle.gaps).toHaveLength(0);
      expect(result.bundle.relationships).toHaveLength(0);
      expect(validateNarrativeObjectBundle(result.bundle).ok).toBe(true);
    }
  });

  it("preserves scene ids and order in the derived output", () => {
    const result = deriveReadOnlyNarrativeObjectsFromScenes(SCENE_COMPATIBILITY_FIXTURE);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bundle.scenes.map((scene) => scene.id)).toEqual(["sc_0001", "sc_0002"]);
      expect(result.bundle.scenes.map((scene) => scene.order)).toEqual([1, 2]);
      expect(result.bundle.scenes[0].storyUnitIds).toEqual(["su_sc_0001"]);
      expect(result.bundle.storyUnits[0].sceneId).toBe("sc_0001");
    }
  });

  it("marks derived objects as derived rather than authored", () => {
    const result = deriveReadOnlyNarrativeObjectsFromScenes(SCENE_COMPATIBILITY_FIXTURE);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bundle.storyUnits[0].provenance.status).toBe("derived");
      expect(result.bundle.storyUnits[0].provenance.authorConfirmed).toBe(false);
      expect(result.bundle.scenes[0].provenance.status).toBe("derived");
      expect(result.bundle.chapters[0].provenance.status).toBe("derived");
    }
  });

  it("does not auto-extract narrative assertions from prose", () => {
    const result = deriveReadOnlyNarrativeObjectsFromScenes(SCENE_COMPATIBILITY_FIXTURE);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bundle.assertions).toEqual([]);
      expect(result.bundle.scenes[0].draftText).toBe("Once upon a time...");
    }
  });

  it("keeps scene-first loading valid without requiring Story Units up front", () => {
    const result = deriveReadOnlyNarrativeObjectsFromScenes({
      ...SCENE_COMPATIBILITY_FIXTURE,
      scenes: [
        {
          id: "sc_0001",
          title: "Opening",
          order: 1,
          chapter_id: "ch_0001",
        },
      ],
      drafts: {
        sc_0001: "Once upon a time...",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bundle.storyUnits).toHaveLength(1);
      expect(validateNarrativeObjectBundle(result.bundle).ok).toBe(true);
    }
  });

  it("fails safely on invalid or blank scene ids", () => {
    const result = deriveReadOnlyNarrativeObjectsFromScenes({
      ...SCENE_COMPATIBILITY_FIXTURE,
      scenes: [
        {
          id: "   ",
          title: "Broken",
          order: 1,
          chapter_id: "ch_0001",
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes("$.scenes"))).toBe(true);
    }
  });
});
