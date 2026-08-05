import { describe, expect, it } from "vitest";

// @ts-expect-error Installed smoke is plain JavaScript test tooling.
import {
  expectedRepresentativeMarkdown,
  isOwnedProcessSurvivor
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
