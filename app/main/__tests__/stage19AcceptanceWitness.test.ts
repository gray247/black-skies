import { describe, expect, it } from "vitest";

// @ts-expect-error Installed smoke is plain JavaScript test tooling.
import {
  expectedRepresentativeMarkdown,
  isOwnedProcessSurvivor,
  selectInstalledProcessTree,
  installedMainProcessId
} from "../../scripts/stage19-installed-smoke.mjs";

// The witness is plain Node.js so Codex can run it without application code.
// @ts-expect-error JavaScript witness module has no separate declaration file.
import {
  stage19Candidate,
  validateCandidateFacts,
  validateInstalledFacts,
  validatePathFacts,
  validatePreservation,
  validateRegistrationFacts,
  validateShortcutFacts
} from "../../../scripts/stage19-20-acceptance-witness.mjs";

function candidateFacts() {
  return {
    filename: stage19Candidate.installerFilename,
    byteLength: stage19Candidate.installerByteLength,
    sha256: stage19Candidate.installerSha256,
    signatureStatus: stage19Candidate.signatureStatus,
    receipt: {
      qualifiedCommit: stage19Candidate.sourceCommit,
      version: stage19Candidate.version,
      architecture: "x64",
      target: "nsis",
      protectedEvidenceUsed: false,
      installer: {
        filename: stage19Candidate.installerFilename,
        byteLength: stage19Candidate.installerByteLength,
        sha256: stage19Candidate.installerSha256,
        signatureStatus: stage19Candidate.signatureStatus
      },
      installedLifecycle: { status: "passed" }
    }
  };
}

describe("Package 19.20 acceptance witness", () => {
  it("accepts only the exact Package 19.19 candidate and receipt", () => {
    expect(validateCandidateFacts(candidateFacts())).toEqual([]);
  });

  it.each([
    ["installer hash", { sha256: "changed" }],
    ["source binding", { receipt: { ...candidateFacts().receipt, qualifiedCommit: "later" } }],
    ["signature truth", { signatureStatus: "Valid" }]
  ])("rejects changed %s", (_label, change) => {
    expect(
      validateCandidateFacts({ ...candidateFacts(), ...change })
    ).not.toEqual([]);
  });

  it("rejects changed installed executable, ASAR, version, or signature identity", () => {
    const valid = {
      executableSha256: stage19Candidate.installedExecutableSha256,
      asarSha256: stage19Candidate.installedAsarSha256,
      signatureStatus: stage19Candidate.signatureStatus,
      fileVersion: stage19Candidate.fileVersion,
      productVersion: stage19Candidate.executableProductVersion
    };
    expect(validateInstalledFacts(valid)).toEqual([]);
    for (const key of Object.keys(valid)) {
      expect(
        validateInstalledFacts({ ...valid, [key]: "changed" })
      ).not.toEqual([]);
    }
  });

  it("rejects ambiguous or machine-wide registration", () => {
    const entry = {
      scope: "HKCU",
      displayName: "Black Skies 1.0.0-rc1",
      displayVersion: "1.0.0-rc1",
      uninstallString: "C:/Install/Uninstall Black Skies.exe /currentuser"
    };
    expect(
      validateRegistrationFacts([entry], "C:/Install/Uninstall Black Skies.exe")
    ).toEqual([]);
    expect(validateRegistrationFacts([entry, entry])).not.toEqual([]);
    expect(
      validateRegistrationFacts([{ ...entry, scope: "HKLM" }])
    ).not.toEqual([]);
  });

  it("rejects shortcut targets, arguments, working directories, and icons outside the installation", () => {
    const valid = {
      path: "C:/Desktop/Black Skies.lnk",
      targetPath: "C:/Install/Black Skies.exe",
      arguments: "",
      workingDirectory: "C:/Install",
      iconLocation: "C:/Install/Black Skies.exe,0"
    };
    expect(
      validateShortcutFacts(
        [valid, { ...valid, path: "C:/Start/Black Skies.lnk" }],
        "C:/Install/Black Skies.exe",
        "C:/Install"
      )
    ).toEqual([]);
    expect(
      validateShortcutFacts(
        [{ ...valid, targetPath: "C:/Elsewhere/Black Skies.exe" }, valid],
        "C:/Install/Black Skies.exe",
        "C:/Install"
      )
    ).not.toEqual([]);
    expect(
      validateShortcutFacts(
        [{ ...valid, arguments: "--unexpected" }, valid],
        "C:/Install/Black Skies.exe",
        "C:/Install"
      )
    ).not.toEqual([]);
  });

  it("rejects reparse-point and junction path facts", () => {
    expect(
      validatePathFacts([
        { path: "C:/Safe", reparse: false },
        { path: "C:/Safe/Linked", reparse: true }
      ])
    ).toEqual([expect.stringContaining("reparse point")]);
  });

  it("rejects changed or missing external files and adjacent sentinels", () => {
    const expected = [
      { path: "Project/project.json", byteLength: 10, sha256: "aaa" },
      { path: "sentinel.txt", byteLength: 20, sha256: "bbb" }
    ];
    expect(validatePreservation(expected, expected)).toEqual([]);
    expect(
      validatePreservation(expected, [
        expected[0],
        { ...expected[1], sha256: "changed" }
      ])
    ).toEqual([expect.stringContaining("bytes changed")]);
    expect(validatePreservation(expected, [expected[0]])).not.toEqual([]);
  });

  it("defines deterministic exact bytes for the packaged 100-unit export", () => {
    const markdown = expectedRepresentativeMarkdown();
    expect(markdown.match(/^## Representative /gmu)).toHaveLength(100);
    expect(markdown).toContain("Packaged scale opening — Café 🌌 **bold**");
    expect(markdown).toContain("[Closing](https://example.invalid/closing)");
    expect(markdown.endsWith("\n")).toBe(true);
  });

  it("does not mistake a reused PID for an owned survivor", () => {
    const expected = {
      pid: 3888,
      name: "electron.exe",
      executablePath: "C:/Install/Black Skies.exe",
      creationDate: "2026-08-05T22:30:00.000000Z"
    };
    expect(
      isOwnedProcessSurvivor(expected, {
        pid: 3888,
        name: "dwm.exe",
        executablePath: "C:/Windows/System32/dwm.exe",
        creationDate: "2026-08-05T22:31:00.000000Z"
      })
    ).toBe(false);
    expect(
      isOwnedProcessSurvivor(expected, { ...expected })
    ).toBe(true);
  });
});


describe("Installed process ancestry identity", () => {
  it("uses the observed Electron main PID instead of a Windows shell launcher PID", async () => {
    const application = { evaluate: async () => 900, process: () => ({ pid: 50 }) };
    expect(await installedMainProcessId(application)).toBe(900);
    await expect(installedMainProcessId({ evaluate: async () => null })).rejects.toThrow("main PID");
  });


  const executablePath = "C:/Install/Black Skies.exe";
  const root = { pid: 900, parentPid: 50, name: "Black Skies.exe",
    executablePath, creationDate: "/Date(2000)/" };
  const currentChild = { ...root, pid: 901, parentPid: 900, creationDate: "/Date(2001)/" };

  it("counts the main process and current child in the application resource total", () => {
    const main = { ...root, workingSetBytes: 4096 };
    const child = { ...currentChild, workingSetBytes: 1024 };
    const inventory = selectInstalledProcessTree([main, child], 900, executablePath);
    expect(inventory.map((entry: { pid: number }) => entry.pid)).toEqual([900, 901]);
    expect(inventory.reduce((sum: number, entry: { workingSetBytes: number }) => sum + entry.workingSetBytes, 0)).toBe(5120);
  });

  it("excludes older orphan ancestry when a parent PID was reused", () => {
    const oldHelper = { pid: 10200, parentPid: 900, name: "node.exe",
      executablePath: "C:/Codex/node.exe", creationDate: "/Date(1000)/" };
    const codexChild = { ...oldHelper, pid: 19172, parentPid: 10200, creationDate: "/Date(1500)/" };
    expect(selectInstalledProcessTree([root, oldHelper, codexChild, currentChild], 900, executablePath))
      .toEqual([root, currentChild]);
  });

  it.each(["node.exe", "python.exe", "python3.exe"])("retains a genuine external %s descendant for the forbidden-runtime gate", (name) => {
    const forbidden = { pid: 902, parentPid: 901, name,
      executablePath: "C:/External/" + name, creationDate: "1970-01-01T00:00:02.002Z" };
    expect(selectInstalledProcessTree([forbidden, currentChild, root], 900, executablePath))
      .toEqual([root, currentChild, forbidden]);
  });

  it("fails closed when the root is missing or has a different executable identity", () => {
    expect(() => selectInstalledProcessTree([currentChild], 900, executablePath)).toThrow();
    expect(() => selectInstalledProcessTree([{ ...root, executablePath: "C:/Codex/node.exe" }], 900, executablePath)).toThrow();
  });

  it("fails closed for missing creation-time evidence on the root or a reachable child", () => {
    expect(() => selectInstalledProcessTree([{ ...root, creationDate: null }], 900, executablePath)).toThrow();
    expect(() => selectInstalledProcessTree([root, { ...currentChild, creationDate: null }], 900, executablePath)).toThrow();
  });

  it("accepts Windows casing and same-millisecond child creation without traversing a cycle twice", () => {
    const child = { ...currentChild, creationDate: root.creationDate };
    const cyclicRoot = { ...root, parentPid: 901 };
    expect(selectInstalledProcessTree([cyclicRoot, child], 900, "c:/install/BLACK SKIES.exe"))
      .toEqual([cyclicRoot, child]);
  });
});
