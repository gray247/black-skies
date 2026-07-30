import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The verifier is deliberately executable as plain Node.js in clean packaging jobs.
// @ts-expect-error JavaScript verification module has no separate declaration file.
import {
  INSTALLER_NAME,
  RELEASE_VERSION,
  WINDOWS_NUMERIC_VERSION,
  WINDOWS_PRODUCT_VERSION,
  verifyPreflight,
} from "../../scripts/stage19-package-verify.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const rootPackage = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
) as { version: string };
const appPackage = JSON.parse(
  readFileSync(path.join(repoRoot, "app", "package.json"), "utf8"),
) as { version: string };
const builder = readFileSync(
  path.join(repoRoot, "app", "electron-builder.yml"),
  "utf8",
);
const releaseRecord = readFileSync(path.join(repoRoot, "RELEASE.md"), "utf8");
const masterPlan = readFileSync(
  path.join(
    repoRoot,
    "docs",
    "product_systems",
    "stage19_v1_master_implementation_and_acceptance_plan.md",
  ),
  "utf8",
);

describe("Stage 19 internal V1 baseline identity", () => {
  it("keeps manifests, verifier, installer, and Windows version encodings aligned", () => {
    expect(rootPackage.version).toBe(RELEASE_VERSION);
    expect(appPackage.version).toBe(RELEASE_VERSION);
    expect(RELEASE_VERSION).toBe("1.0.0-rc1");
    expect(WINDOWS_NUMERIC_VERSION).toBe("1.0.0.1");
    expect(WINDOWS_PRODUCT_VERSION).toBe("1.0.0.0");
    expect(INSTALLER_NAME).toBe("BlackSkies-Setup-1.0.0-rc1.exe");
    expect(builder).toContain("oneClick: false");
    expect(builder).toContain("perMachine: false");
    expect(builder).toContain("publish: null");
    expect(verifyPreflight()).toMatchObject({
      version: RELEASE_VERSION,
      windowsNumericVersion: WINDOWS_NUMERIC_VERSION,
      windowsProductVersion: WINDOWS_PRODUCT_VERSION,
      target: "nsis",
      architecture: "x64",
    });
  });

  it("states an internal baseline boundary without public-release authority", () => {
    for (const authority of [releaseRecord, masterPlan]) {
      expect(authority).toMatch(/internal/i);
      expect(authority).toMatch(/public release[^.\n]*(?:not authorized|prohibited)/i);
      expect(authority).not.toMatch(/\brelease ready\b/i);
      expect(authority).not.toMatch(/\bproduction ready\b/i);
      expect(authority).not.toMatch(/\bpublic V1\b/i);
    }
  });
});
