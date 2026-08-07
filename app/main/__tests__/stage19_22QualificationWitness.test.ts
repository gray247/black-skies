import { describe, expect, it } from "vitest";

// @ts-expect-error Plain Node.js qualification tooling has no declaration file.
import {
  validateCandidateReceipt,
  validateInstalledCandidate,
  validateLifecycleEvidence,
  validatePreservation
} from "../../../scripts/stage19-22-qualification-witness.mjs";

const commit = "a".repeat(40);
const installer = { filename: "BlackSkies-Setup-1.0.0-rc1.exe", byteLength: 100, sha256: "b".repeat(64) };
const receipt = {
  schema: "black-skies.stage19.package-receipt.v1",
  qualifiedCommit: commit,
  protectedEvidenceUsed: false,
  signatureStatus: "NotSigned",
  installer: { ...installer, signatureStatus: "NotSigned" },
  unpacked: { executable: { sha256: "c".repeat(64) }, asar: { sha256: "d".repeat(64) } }
};

describe("Package 19.22 candidate-bound qualification witness", () => {
  it("accepts an exact candidate receipt", () => {
    expect(validateCandidateReceipt(receipt, installer, commit)).toEqual([]);
  });

  it.each([
    ["source SHA", { qualifiedCommit: "later" }],
    ["installer hash", { installer: { ...receipt.installer, sha256: "changed" } }],
    ["signature status", { signatureStatus: "Valid" }],
    ["protected evidence", { protectedEvidenceUsed: true }]
  ])("rejects changed %s", (_label, change) => {
    expect(validateCandidateReceipt({ ...receipt, ...change }, installer, commit)).not.toEqual([]);
  });

  it("rejects altered installed executable, ASAR, and signature truth", () => {
    const installed = { executable: { sha256: receipt.unpacked.executable.sha256 }, asar: { sha256: receipt.unpacked.asar.sha256 }, signatureStatus: "NotSigned" };
    expect(validateInstalledCandidate(receipt, installed)).toEqual([]);
    expect(validateInstalledCandidate(receipt, { ...installed, signatureStatus: "Valid" })).not.toEqual([]);
    expect(validateInstalledCandidate(receipt, { ...installed, asar: { sha256: "changed" } })).not.toEqual([]);
  });

  it("rejects incomplete lifecycle and altered external preservation evidence", () => {
    const lifecycle = { qualifiedCommit: commit, installedOffline: true, representativeWorkloadPassed: true, forbiddenRuntimeProcessCount: 0, uninstallRemovedApplication: true, externalDataPreserved: true, sameInstallerReinstallPassed: true };
    expect(validateLifecycleEvidence(lifecycle, commit)).toEqual([]);
    expect(validateLifecycleEvidence({ ...lifecycle, qualifiedCommit: "wrong" }, commit)).not.toEqual([]);
    expect(validateLifecycleEvidence({ ...lifecycle, externalDataPreserved: false }, commit)).not.toEqual([]);
    const expected = [{ path: "project.json", byteLength: 10, sha256: "abc" }];
    expect(validatePreservation(expected, expected)).toEqual([]);
    expect(validatePreservation(expected, [{ ...expected[0], sha256: "changed" }])).not.toEqual([]);
  });
});
