import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The policy is deliberately executable as plain Node.js in clean CI jobs.
// @ts-expect-error JavaScript policy module has no separate declaration file.
import {
  assertFoundationActionRuntimePolicy,
  assertStage19PackagingWorkflow,
  validateFoundationActionRuntimePolicy,
  validateStage19PackagingWorkflow
} from "../../../scripts/stage19-packaging-workflow-policy.mjs";

// @ts-expect-error The stability gate is executable plain Node.js.
import { validateStabilityManifest, validateStabilityInventories, validateStabilityPackageBinding } from '../../../scripts/stage19-regression.mjs';

const workflowPath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  ".github",
  "workflows",
  "stage19-packaging.yml"
);

function workflow(trigger: string, artifactName = "black-skies-${{ github.sha }}") {
  return `name: Stage 19 Windows Packaging Proof

on:
  ${trigger}

jobs:
  package:
    steps:
      - name: Upload
        uses: actions/upload-artifact@v6
        with:
          name: ${artifactName}
`;
}

describe("Stage 19 packaging workflow policy", () => {
  it("accepts only explicit manual dispatch with SHA-bound artifacts", () => {
    expect(
      validateStage19PackagingWorkflow(workflow("workflow_dispatch: {}"))
    ).toEqual([]);
  });

  it.each(["push: {}", "schedule: {}", "pull_request: {}"])(
    "rejects automatic %s packaging",
    (trigger) => {
      expect(validateStage19PackagingWorkflow(workflow(trigger))).toContainEqual(
        expect.stringContaining("manual dispatch only")
      );
    }
  );

  it("rejects artifact names that omit the exact source SHA", () => {
    expect(
      validateStage19PackagingWorkflow(
        workflow("workflow_dispatch: {}", "black-skies-latest")
      )
    ).toContainEqual(expect.stringContaining("exact source SHA"));
  });

  it.each([
    ["missing validation step", (source: string) => source.replace("id: validate_source", "id: unverified_source")],
    ["unverified SHA assignment", (source: string) => source.replace("$qualificationSha = git rev-parse HEAD", "$qualificationSha = 'latest'")],
    ["unbound output", (source: string) => source.replace('"sha=$qualificationSha"', '"sha=latest"')],
    ["another checkout after validation", (source: string) => source.replace("      - name: Upload qualified development candidate", "      - name: Another checkout\n        uses: actions/checkout@v7\n      - name: Upload qualified development candidate")],
  ] as const)("rejects a selected-source artifact with %s", (_label, change) => {
    expect(validateStage19PackagingWorkflow(change(readFileSync(workflowPath, "utf8"))))
      .toContainEqual(expect.stringContaining("exact source SHA"));
  });

  it("guards the committed workflow including its verified selected-source SHA", () => {
    expect(() =>
      assertStage19PackagingWorkflow(readFileSync(workflowPath, "utf8"))
    ).not.toThrow();
  });

  it("rejects stale checkout, Node, and pnpm action runtimes across every foundation workflow", () => {
    expect(() => assertFoundationActionRuntimePolicy()).not.toThrow();
    expect(
      validateFoundationActionRuntimePolicy({
        "Stage 19 Fixed Regression Gate":
          "uses: actions/checkout@v5\nuses: actions/setup-node@v5\nuses: pnpm/action-setup@v4\nuses: actions/download-artifact@v7\nnode-version: '20'",
      })
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("older checkout action runtime"),
        expect.stringContaining("older setup-node action runtime"),
        expect.stringContaining("deprecated pnpm/action-setup runtime"),
        expect.stringContaining("deprecated Node 20 action runtime"),
        expect.stringContaining("deterministic Git initial branch"),
        expect.stringContaining("warning-free GitHub CLI artifact download path"),
      ])
    );
  });

  it("rejects a security workflow that permits lower-severity vulnerabilities", () => {
    const securityWorkflowPath = path.resolve(
      import.meta.dirname,
      "..",
      "..",
      "..",
      ".github",
      "workflows",
      "security.yml"
    );
    const validSecurity = readFileSync(securityWorkflowPath, "utf8");

    expect(
      validateFoundationActionRuntimePolicy({
        "Security Audit": validSecurity.replace(
          'SEVERITIES = {"info", "low", "moderate", "high", "critical"}',
          'SEVERITIES = {"high", "critical"}'
        ),
      })
    ).toContainEqual(expect.stringContaining("every known vulnerability severity"));
  });
});

describe('stability acceptance gate evidence', () => {
  const manifest = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../../docs/testing/program7_stability_repair_manifest.json'), 'utf8'));
  it('refuses dirty candidates and omission of any required native spec', () => {
    expect(validateStabilityManifest(manifest, '', 'candidate')).toEqual([]);
    expect(validateStabilityManifest(manifest, ' M app/main/main.ts', 'candidate')).toContainEqual(expect.stringContaining('clean committed source'));
    for (const file of manifest.electronFiles) expect(validateStabilityManifest({ ...manifest, electronFiles: manifest.electronFiles.filter((item: string) => item !== file) })).toContainEqual(expect.stringContaining(file));
  });
  it('refuses dropped unit cases, todos, failed or retried native results', () => {
    const unit = { file: 'app/main/example.test.ts', title: 'an existing check', status: 'passed' };
    const native = { file: 'example.spec.ts', title: 'an existing native check', expectedStatus: 'passed', results: [{ status: 'passed', retry: 0 }] };
    expect(validateStabilityInventories(manifest, [unit], [native], [unit], [native])).toEqual([]);
    expect(validateStabilityInventories(manifest, [{ ...unit, status: 'todo' }], [native], [unit], [native])).not.toEqual([]);
    expect(validateStabilityInventories(manifest, [unit], [native], [{ ...unit, title: 'dropped' }], [native])).not.toEqual([]);
    expect(validateStabilityInventories(manifest, [unit], [{ ...native, results: [{ status: 'passed', retry: 1 }] }])).not.toEqual([]);
  });
  it('allows only the documented strengthened spelling case rename', () => {
    const rename = manifest.caseRenames[0];
    const unit = { file: 'app/main/example.test.ts', title: 'existing', status: 'passed' };
    const native = { file: rename.file, title: 'suite / ' + rename.to, expectedStatus: 'passed', results: [{ status: 'passed', retry: 0 }] };
    expect(validateStabilityInventories(manifest, [unit], [native], [], [{ ...native, title: 'suite / ' + rename.from }])).toEqual([]);
    expect(validateStabilityInventories({ ...manifest, caseRenames: [] }, [unit], [native], [], [{ ...native, title: 'suite / ' + rename.from }])).not.toEqual([]);
  });
  it('binds first-offline results to the exact commit, binaries, locales and negative control', () => {
    const head = 'a'.repeat(40), runtime = '45.3.3';
    const hashes = { executable: 'b'.repeat(64), asar: 'c'.repeat(64), installer: 'd'.repeat(64) };
    const activatedAtUtc = '2026-11-17T00:00:00Z';
    const witness = { schema: 'black-skies.stability-offline-spelling.v1', qualifiedCommit: head,
      executableSha256: hashes.executable, asarSha256: hashes.asar, engine: 'nspell@2.1.5', sourceDictionary: 'dictionary-en@4.0.0', checkerLanguage: 'en-US',
      firewall: { activatedAtUtc }, profiles: ['en-US', 'en-GB'].map(locale => ({ locale, packaged: true, sandbox: true, runtime, firstProfileWasEmpty: true,
        typoDetected: true, intendedCorrectionApplied: true, chronologicalUndoRedo: true, languages: ['en-US'] })),
      acceptedWordSurvivedExit: true, removedWordSurvivedExit: true, correctedWritingSurvivedExit: true, missingSourceRefused: true, writingAvailableWithoutDictionary: true, sourceRestoredExactly: true };
    const receipt = { qualifiedCommit: head, unpacked: { executable: { sha256: hashes.executable }, asar: { sha256: hashes.asar } }, installer: { sha256: hashes.installer },
      installedLifecycle: { status: 'passed', offlineFirewallRuleApplied: true, firewallActivatedBeforeInstall: true, firewallActivatedAtUtc: activatedAtUtc, installerStartedAtUtc: '2026-11-17T00:00:01Z' } };
    expect(validateStabilityPackageBinding(witness, receipt, head, runtime, hashes)).toEqual([]);
    expect(validateStabilityPackageBinding({ ...witness, qualifiedCommit: 'e'.repeat(40) }, receipt, head, runtime, hashes)).not.toEqual([]);
    expect(validateStabilityPackageBinding({ ...witness, missingSourceRefused: false }, receipt, head, runtime, hashes)).not.toEqual([]);
    expect(validateStabilityPackageBinding({ ...witness, profiles: witness.profiles.slice(0, 1) }, receipt, head, runtime, hashes)).not.toEqual([]);
    expect(validateStabilityPackageBinding(witness, receipt, head, runtime, { ...hashes, asar: 'f'.repeat(64) })).not.toEqual([]);
  });
});
