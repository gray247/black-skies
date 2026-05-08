import { describe, expect, it } from "vitest";

import { listCommandRegistryEntries } from "../commands/commandRegistry";

describe("command registry metadata", () => {
  it("is declarative metadata without execution hooks", () => {
    const entries = listCommandRegistryEntries();
    const generateActiveScene = entries.find((entry) => entry.id === "draft.generateActiveScene");

    expect(generateActiveScene).toMatchObject({
      label: "Generate Active Scene",
      mutatesData: true,
      requiresConfirmation: true,
      preferredZone: "writing_studio",
      modelRoute: "api",
    });

    for (const entry of entries) {
      expect(entry).not.toHaveProperty("execute");
      expect(entry).not.toHaveProperty("dispatch");
      expect(entry).not.toHaveProperty("middleware");
      expect(entry).not.toHaveProperty("plugin");
    }
  });
});
