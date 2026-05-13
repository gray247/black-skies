import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildVerificationReport,
  getVerificationReportPaths,
  startServiceStubs,
  stopServiceStubs,
} from '../../tests/e2e/utils/serviceStubs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const reportPaths = getVerificationReportPaths();

function removeVerificationReports(): void {
  for (const reportPath of reportPaths) {
    try {
      fs.rmSync(reportPath, { force: true });
    } catch {
      // best-effort cleanup for generated harness state
    }
  }
}

afterEach(() => {
  removeVerificationReports();
});

describe('service stubs verification report authority', () => {
  it('seeds both sample-project aliases for last_verification.json', () => {
    const reportPaths = getVerificationReportPaths().map((reportPath) =>
      reportPath.replace(/\\/g, '/'),
    );
    const estherEstatePath = path
      .join(repoRoot, 'sample_project', 'Esther_Estate', '.snapshots', 'last_verification.json')
      .replace(/\\/g, '/');
    const canonicalPath = path
      .join(repoRoot, 'sample_project', 'proj_esther_estate', '.snapshots', 'last_verification.json')
      .replace(/\\/g, '/');

    expect(reportPaths).toContain(estherEstatePath);
    expect(reportPaths).toContain(canonicalPath);
  });

  it('builds a verification report with snapshot summaries and a verified_at timestamp', () => {
    const report = buildVerificationReport();

    expect(report.project_id).toBeTruthy();
    expect(report.verified_at).toEqual(expect.any(String));
    expect(report.snapshots.length).toBeGreaterThan(0);
    expect(report.snapshots[0]).toEqual(
      expect.objectContaining({
        snapshot_id: expect.any(String),
        status: 'ok',
        errors: [],
        issues: [],
      }),
    );
  });

  it('re-seeds last_verification.json when the service stubs start', async () => {
    removeVerificationReports();

    await startServiceStubs();
    try {
      for (const reportPath of reportPaths) {
        expect(fs.existsSync(reportPath)).toBe(true);
      }
    } finally {
      await stopServiceStubs();
    }
  });
});
