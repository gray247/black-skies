import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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
  it("writes all lifecycle JSON outputs as BOM-free UTF-8 with a trailing newline", () => {
    const lifecycleScript = readFileSync(resolve(import.meta.dirname, "../../../scripts/stage19-installed-lifecycle.ps1"), "utf8");
    const helper = lifecycleScript.match(/function Write-JsonUtf8NoBom \{[\s\S]*?\r?\n\}/)?.[0];
    expect(helper).toBeDefined();
    expect(lifecycleScript).toMatch(/Write-JsonUtf8NoBom -LiteralPath \$externalManifestPath -Value \$externalManifest -Depth 5/);
    expect(lifecycleScript).toMatch(/Write-JsonUtf8NoBom -LiteralPath \$receipt -Value \$receiptDocument -Depth 20/);
    expect(lifecycleScript).toMatch(/Write-JsonUtf8NoBom -LiteralPath \$lifecycleEvidencePath -Value \$lifecycleEvidence -Depth 5/);

    const working = mkdtempSync(join(tmpdir(), "black-skies-json-writer-"));
    const outputPaths = ["external-manifest.json", "receipt.json", "lifecycle-evidence.json"].map((name) => join(working, name));
    try {
      const command = `${helper}\n$sample = [ordered]@{ schema = 'test'; nested = [ordered]@{ value = 'ok' } }\nWrite-JsonUtf8NoBom -LiteralPath $env:MANIFEST_PATH -Value $sample -Depth 5\nWrite-JsonUtf8NoBom -LiteralPath $env:RECEIPT_PATH -Value $sample -Depth 20\nWrite-JsonUtf8NoBom -LiteralPath $env:LIFECYCLE_PATH -Value $sample -Depth 5`;
      execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], {
        env: { ...process.env, MANIFEST_PATH: outputPaths[0]!, RECEIPT_PATH: outputPaths[1]!, LIFECYCLE_PATH: outputPaths[2]! },
        stdio: "pipe",
      });

      for (const outputPath of outputPaths) {
        const bytes = readFileSync(outputPath);
        expect(bytes[0]).toBe(0x7b);
        expect(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).toBe(false);
        expect(bytes.subarray(-2).equals(Buffer.from([0x0d, 0x0a]))).toBe(true);
        expect(JSON.parse(bytes.toString("utf8"))).toMatchObject({ schema: "test", nested: { value: "ok" } });
      }
    } finally {
      rmSync(working, { recursive: true, force: true });
    }
  });

  it("updates an existing installedLifecycle receipt property without a duplicate-member error", () => {
    const lifecycleScript = readFileSync(resolve(import.meta.dirname, "../../../scripts/stage19-installed-lifecycle.ps1"), "utf8");
    const updater = lifecycleScript.match(/function Set-ReceiptInstalledLifecycle \{[\s\S]*?\r?\n\}\r?\n\r?\n(?=function Test-IsElevated)/)?.[0]?.trim();
    expect(updater).toBeDefined();
    if (!updater) throw new Error("Set-ReceiptInstalledLifecycle helper was not found");

    const command = `${updater}
$receipt = [pscustomobject]@{ schema = 'black-skies.stage19.package-receipt.v1'; unrelated = 'preserve'; installedLifecycle = [ordered]@{ status = 'old'; staleGuidance = 'remove' } }
$replacement = [ordered]@{ status = 'passed'; qualificationMode = 'offline-firewall-isolated' }
Set-ReceiptInstalledLifecycle -ReceiptDocument $receipt -Value $replacement
$receipt | ConvertTo-Json -Depth 10`;
    const updated = JSON.parse(execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8", stdio: "pipe" }));

    expect(updated).toMatchObject({
      schema: "black-skies.stage19.package-receipt.v1",
      unrelated: "preserve",
      installedLifecycle: { status: "passed", qualificationMode: "offline-firewall-isolated" },
    });
    expect(updated.installedLifecycle).not.toHaveProperty("staleGuidance");
  });

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
