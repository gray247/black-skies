import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { runInNewContext } from "node:vm";

import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const rootPackage = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8")
) as {
  pnpm?: { patchedDependencies?: Record<string, string> };
};
const patchPath = path.join(
  repoRoot,
  rootPackage.pnpm?.patchedDependencies?.["app-builder-lib@26.15.3"] ?? ""
);
const patch = readFileSync(patchPath, "utf8");
const appRequire = createRequire(path.join(repoRoot, "app/package.json"));
const builderRequire = createRequire(appRequire.resolve("electron-builder"));
const nsisUtilPath = builderRequire.resolve("app-builder-lib/out/targets/nsis/nsisUtil.js");
const nsisRequire = createRequire(nsisUtilPath);
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith("p75-nsis-test-")) {
      throw new Error("Unexpected test cleanup target");
    }
    rmSync(root, { recursive: true, force: true });
  }
});

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "p75-nsis-test-"));
  temporaryRoots.push(root);
  let templates = root;
  while (templates.length < 270) templates = path.join(templates, "template-resources");
  mkdirSync(path.join(templates, "include"), { recursive: true });
  writeFileSync(path.join(templates, "installer.nsi"), '!include "include/fixture.nsh"\n');
  writeFileSync(path.join(templates, "include/fixture.nsh"), "!define PRESERVED_RESOURCE 1\n");
  return { root, templates };
}

function loadTemplates(templates: string, stagingParent: string, platform = "win32") {
  const exports: { nsisTemplatesDir?: string } = {};
  runInNewContext(readFileSync(nsisUtilPath, "utf8"), {
    exports,
    process: { platform },
    require: (name: string) => {
      if (name === "../../util/pathManager") return { getTemplatePath: () => templates };
      if (name === "os") return { tmpdir: () => stagingParent };
      if (name === "builder-util" || name === "../../toolsets/windows") return {};
      return nsisRequire(name);
    },
  }, { filename: nsisUtilPath });
  return exports.nsisTemplatesDir!;
}

describe("Stage 19 NSIS Windows 11 compatibility patch", () => {
  it("pins the exact upgraded app-builder-lib patch", () => {
    expect(
      rootPackage.pnpm?.patchedDependencies?.["app-builder-lib@26.15.3"]
    ).toBe("patches/app-builder-lib@26.15.3.patch");
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

  it("stages the complete long-path Windows template tree without changing source bytes", () => {
    const { root, templates } = fixture();
    const staged = loadTemplates(templates, root);
    expect(staged).not.toBe(templates);
    expect(staged.length).toBeLessThan(248);
    for (const file of ["installer.nsi", "include/fixture.nsh"]) {
      expect(readFileSync(path.join(staged, file))).toEqual(readFileSync(path.join(templates, file)));
    }
    expect(loadTemplates(templates, root)).not.toBe(staged);
  });

  it("retains short Windows paths and non-Windows template locations", () => {
    const { root, templates } = fixture();
    expect(loadTemplates(root, root)).toBe(root);
    expect(loadTemplates(templates, root, "linux")).toBe(templates);
  });

  it("reports an unusably long temporary parent before copying templates", () => {
    const { templates } = fixture();
    expect(() => loadTemplates(templates, templates)).toThrow("shorter TEMP/TMP");
  });
});
