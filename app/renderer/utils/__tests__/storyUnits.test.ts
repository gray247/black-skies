import { describe, expect, it } from "vitest";

import type { LoadedProject } from "../../../shared/ipc/projectLoader";
import { deriveActiveOutline, deriveStoryUnits } from "../storyUnits";

const PROJECT: LoadedProject = {
  path: "/projects/demo",
  projectId: "proj_demo",
  name: "Demo",
  outline: {
    schema_version: "OutlineSchema v1",
    outline_id: "out_demo",
    acts: [],
    chapters: [],
    scenes: [
      { id: "sc_0002", order: 2, title: "Second", chapter_id: "ch_1", beat_refs: [] },
      { id: "sc_0001", order: 1, title: "First", chapter_id: "ch_1", beat_refs: [] },
    ],
  },
  scenes: [
    {
      id: "sc_0002",
      title: "Second",
      order: 2,
      chapter_id: "ch_1",
      purpose: "Escalate the problem.",
    },
    {
      id: "sc_0001",
      title: "First",
      order: 1,
      chapter_id: "ch_1",
      goal: "Open the door.",
    },
  ],
  drafts: {
    sc_0001: "Existing draft text should not change lifecycle state.",
  },
};

describe("Story Unit v1 compatibility view", () => {
  it("derives read-only scene-backed units in scene order", () => {
    const units = deriveStoryUnits(PROJECT);

    expect(units.map((unit) => unit.sceneId)).toEqual(["sc_0001", "sc_0002"]);
    expect(units[0]).toMatchObject({
      unitId: "sc_0001",
      title: "First",
      sourceType: "scene",
      state: "placed",
      order: 1,
      placement: {
        outlineKey: "main",
        sourceOutlineId: "out_demo",
        chapterId: "ch_1",
        order: 1,
      },
      source: {
        projectPath: "/projects/demo",
        sceneId: "sc_0001",
      },
    });
  });

  it("does not infer drafted state from non-empty draft text", () => {
    const [firstUnit] = deriveStoryUnits(PROJECT);

    expect(firstUnit.contentPreview).toContain("Existing draft text");
    expect(firstUnit.state).toBe("placed");
  });

  it("represents the current scene ordering as one active main outline", () => {
    const outline = deriveActiveOutline(PROJECT);

    expect(outline.outlineKey).toBe("main");
    expect(outline.label).toBe("main");
    expect(outline.sourceOutlineId).toBe("out_demo");
    expect(outline.units.map((unit) => unit.unitId)).toEqual(["sc_0001", "sc_0002"]);
  });

  it("does not mutate the loaded project while deriving units", () => {
    const before = structuredClone(PROJECT);

    deriveStoryUnits(PROJECT);
    deriveActiveOutline(PROJECT);

    expect(PROJECT).toEqual(before);
  });
});
