import { describe, expect, it } from "vitest";

import { listCommandRegistryEntries } from "../commands/commandRegistry";

describe("command registry metadata", () => {
  it("is declarative metadata without execution hooks", () => {
    const entries = listCommandRegistryEntries();
    const generateActiveScene = entries.find((entry) => entry.id === "draft.generateActiveScene");

    expect(generateActiveScene).toMatchObject({
      label: "Generate Active Scene",
      allowedZones: ["writing_studio", "global"],
      mutatesData: true,
      requiresConfirmation: true,
      preferredZone: "writing_studio",
      modelRoute: "api",
      riskLevel: "medium",
      resultType: "draft_text",
    });

    for (const entry of entries) {
      expect(entry.id).toMatch(/^[a-z]+(\.[A-Za-z0-9]+)+$/);
      expect(entry.allowedZones.length).toBeGreaterThan(0);
      expect(entry).not.toHaveProperty("execute");
      expect(entry).not.toHaveProperty("dispatch");
      expect(entry).not.toHaveProperty("middleware");
      expect(entry).not.toHaveProperty("plugin");
    }
  });
});
