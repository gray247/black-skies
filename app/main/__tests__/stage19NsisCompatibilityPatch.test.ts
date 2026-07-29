import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(process.cwd(), "..");
const rootPackage = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8")
) as {
  pnpm?: { patchedDependencies?: Record<string, string> };
};
const patchPath = path.join(
  repoRoot,
  rootPackage.pnpm?.patchedDependencies?.["app-builder-lib@26.8.1"] ?? ""
);
const patch = readFileSync(patchPath, "utf8");

describe("Stage 19 NSIS Windows 11 compatibility patch", () => {
  it("pins the exact app-builder-lib patch", () => {
    expect(
      rootPackage.pnpm?.patchedDependencies?.["app-builder-lib@26.8.1"]
    ).toBe("patches/app-builder-lib@26.8.1.patch");
  });

  it("removes only the crashing per-user known-folder System calls", () => {
    expect(patch).toContain(
      '-      System::Call \'SHELL32::SHGetKnownFolderPath'
    );
    expect(patch).toContain(
      '-        System::Call \'OLE32::CoTaskMemFree(p r2)\''
    );
    expect(patch).toContain('       StrCpy $0 "$LocalAppData\\Programs"');
    expect(patch).not.toContain("+      System::Call");
  });
});
