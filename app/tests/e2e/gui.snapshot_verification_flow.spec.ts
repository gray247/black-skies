import type { Page } from '@playwright/test';
import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';

const FAILURE_TOAST_PATTERNS = [
  /failed/i,
  /unable/i,
  /unavailable/i,
  /error/i,
  /missing/i,
  /could not/i,
  /timed out/i,
];

const EXPECTED_TOAST_PATTERNS = [/^Snapshot created$/i, /^Snapshot verification$/i];
const SNAPSHOTS_HEALTH_OK_PATTERN =
  /latest (snapshot verified|verification record shows no issues)/i;

type ToastCapture = {
  assertNoUnexpectedToasts: () => Promise<void>;
  stop: () => Promise<void>;
};

async function installSnapshotFsShim(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type SnapshotFs = {
      stat?: (path: string) => Promise<unknown>;
      readJson?: (path: string) => Promise<unknown>;
      readDir?: (path: string) => Promise<Array<{ name: string; isDirectory?: boolean; isFile?: boolean }>>;
      resolvePath?: (...segments: string[]) => string;
    };

    const globalWindow = window as typeof window & {
      __e2eSnapshotFsShim?: { patch: () => boolean; intervalHandle?: number | null };
      __electronApi?: { fs?: SnapshotFs };
    };

    if (globalWindow.__e2eSnapshotFsShim) {
      return;
    }

    const normalizePath = (value: string): string =>
      String(value).replace(/[\\/]+/g, '/').replace(/\/+$/, '');
    const matchesPath = (value: string, suffix: string): boolean =>
      normalizePath(value).endsWith(suffix);

    const patch = (): boolean => {
      const fs = globalWindow.__electronApi?.fs;
      if (!fs || (fs as SnapshotFs & { __patched?: boolean }).__patched) {
        return Boolean((fs as SnapshotFs & { __patched?: boolean })?.__patched);
      }

      const originalStat = fs.stat?.bind(fs);
      const originalReadJson = fs.readJson?.bind(fs);
      const originalReadDir = fs.readDir?.bind(fs);

      fs.stat = async (targetPath: string) => {
        const normalized = normalizePath(targetPath);
        if (
          matchesPath(normalized, '/.snapshots/last_verification.json') ||
          matchesPath(normalized, '/.snapshots/snapshot-current') ||
          matchesPath(normalized, '/.snapshots/snapshot-current/manifest.json') ||
          matchesPath(normalized, '/.snapshots/pw-wizard-final') ||
          matchesPath(normalized, '/.snapshots/pw-wizard-final/manifest.json')
        ) {
          return {
            size: 2048,
            isFile: normalized.endsWith('.json'),
            isDirectory: !normalized.endsWith('.json'),
            mtimeMs: Date.now(),
          };
        }
        return originalStat ? originalStat(targetPath) : undefined;
      };

      fs.readJson = async (targetPath: string) => {
        const normalized = normalizePath(targetPath);
        if (matchesPath(normalized, '/.snapshots/snapshot-current/metadata.json')) {
          return {
            snapshot_id: 'snapshot-current',
            created_at: '2025-11-17T13:00:00Z',
            label: 'wizard-finalize',
          };
        }
        if (matchesPath(normalized, '/.snapshots/pw-wizard-final/metadata.json')) {
          return {
            snapshot_id: 'pw-wizard-final',
            created_at: '2025-11-17T13:00:00Z',
            label: 'wizard-finalize',
          };
        }
        if (
          matchesPath(normalized, '/.snapshots/snapshot-current/manifest.json') ||
          matchesPath(normalized, '/.snapshots/snapshot-current/snapshot.json') ||
          matchesPath(normalized, '/.snapshots/pw-wizard-final/manifest.json') ||
          matchesPath(normalized, '/.snapshots/pw-wizard-final/snapshot.json')
        ) {
          return {
            files_included: [
              { path: 'outline.json' },
              { path: 'drafts/story.json' },
            ],
          };
        }
        return originalReadJson ? originalReadJson(targetPath) : undefined;
      };

      fs.readDir = async (targetPath: string) => {
        const normalized = normalizePath(targetPath);
        if (matchesPath(normalized, '/history/snapshots') || matchesPath(normalized, '/.snapshots')) {
          return [
            { name: 'snapshot-current', isDirectory: true, isFile: false },
            { name: 'pw-wizard-final', isDirectory: true, isFile: false },
          ];
        }
        if (matchesPath(normalized, '/.snapshots/snapshot-current')) {
          return [
            { name: 'metadata.json', isDirectory: false, isFile: true },
            { name: 'manifest.json', isDirectory: false, isFile: true },
            { name: 'snapshot.json', isDirectory: false, isFile: true },
          ];
        }
        if (matchesPath(normalized, '/.snapshots/pw-wizard-final')) {
          return [
            { name: 'metadata.json', isDirectory: false, isFile: true },
            { name: 'manifest.json', isDirectory: false, isFile: true },
            { name: 'snapshot.json', isDirectory: false, isFile: true },
          ];
        }
        return originalReadDir ? originalReadDir(targetPath) : [];
      };

      (fs as SnapshotFs & { __patched?: boolean }).__patched = true;
      return true;
    };

    globalWindow.__e2eSnapshotFsShim = {
      patch,
      intervalHandle: null,
    };

    const ensurePatch = (): void => {
      if (patch()) {
        if (globalWindow.__e2eSnapshotFsShim?.intervalHandle) {
          window.clearInterval(globalWindow.__e2eSnapshotFsShim.intervalHandle);
          globalWindow.__e2eSnapshotFsShim.intervalHandle = null;
        }
        return;
      }
      if (!globalWindow.__e2eSnapshotFsShim?.intervalHandle) {
        globalWindow.__e2eSnapshotFsShim.intervalHandle = window.setInterval(() => {
          if (patch() && globalWindow.__e2eSnapshotFsShim?.intervalHandle) {
            window.clearInterval(globalWindow.__e2eSnapshotFsShim.intervalHandle);
            globalWindow.__e2eSnapshotFsShim.intervalHandle = null;
          }
        }, 25);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensurePatch, { once: true });
    } else {
      ensurePatch();
    }
  });

  await page.evaluate(() => {
    const shim = window as typeof window & {
      __e2eSnapshotFsShim?: { patch: () => boolean };
    };
    shim.__e2eSnapshotFsShim?.patch();
  });
}

async function startUnexpectedToastCapture(page: Page): Promise<ToastCapture> {
  await page.addInitScript(() => {
    type ToastRecord = {
      tone: string;
      title: string;
      description: string;
      text: string;
      timestamp: number;
    };

    const globalWindow = window as typeof window & {
      __e2eToastCapture?: {
        records: ToastRecord[];
        seen: Set<string>;
        observer?: MutationObserver;
        intervalHandle?: number;
        scan: () => void;
        stop: () => void;
      };
    };

    if (globalWindow.__e2eToastCapture) {
      return;
    }

    const records: ToastRecord[] = [];
    const seen = new Set<string>();

    const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();

    const captureToast = (node: Element | null): void => {
      if (!node) {
        return;
      }
      const toastNode = node.classList.contains('toast') ? node : node.querySelector('.toast');
      if (!toastNode) {
        return;
      }
      const title = normalize(toastNode.querySelector('.toast__title')?.textContent ?? '');
      const description = normalize(toastNode.querySelector('.toast__description')?.textContent ?? '');
      const text = normalize([title, description].filter(Boolean).join(' '));
      if (!text) {
        return;
      }
      const tone =
        Array.from(toastNode.classList)
          .find((className) => className.startsWith('toast--'))
          ?.replace('toast--', '') ?? 'unknown';
      const key = `${tone}|${text}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      records.push({
        tone,
        title,
        description,
        text,
        timestamp: Date.now(),
      });
    };

    const scan = (): void => {
      document.querySelectorAll('.toast').forEach((node) => captureToast(node));
    };

    const stop = (): void => {
      globalWindow.__e2eToastCapture?.observer?.disconnect();
      if (typeof globalWindow.__e2eToastCapture?.intervalHandle === 'number') {
        window.clearInterval(globalWindow.__e2eToastCapture.intervalHandle);
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            captureToast(node);
          }
        });
      }
      scan();
    });

    globalWindow.__e2eToastCapture = {
      records,
      seen,
      observer,
      scan,
      stop,
    };

    const start = (): void => {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
      scan();
      globalWindow.__e2eToastCapture!.intervalHandle = window.setInterval(scan, 50);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  });

  await page.evaluate(() => {
    (window as typeof window & { __e2eToastCapture?: { scan: () => void } })
      .__e2eToastCapture?.scan();
  });

  const assertNoUnexpectedToasts = async (): Promise<void> => {
    const records = await page.evaluate(() => {
      const capture = window as typeof window & {
        __e2eToastCapture?: {
          records: Array<{
            tone: string;
            title: string;
            description: string;
            text: string;
            timestamp: number;
          }>;
        };
      };
      return capture.__e2eToastCapture?.records ?? [];
    });

    const unexpected = records.filter((record) => {
      if (EXPECTED_TOAST_PATTERNS.some((pattern) => pattern.test(record.title) || pattern.test(record.text))) {
        return false;
      }
      if (record.tone === 'error' || record.tone === 'warning') {
        return true;
      }
      return FAILURE_TOAST_PATTERNS.some(
        (pattern) => pattern.test(record.title) || pattern.test(record.description) || pattern.test(record.text),
      );
    });

    expect(
      unexpected.map((record) => `${record.tone}: ${record.title}${record.description ? ` | ${record.description}` : ''}`),
    ).toEqual([]);
  };

  const stop = async (): Promise<void> => {
    await page.evaluate(() => {
      const capture = window as typeof window & {
        __e2eToastCapture?: { stop: () => void };
      };
      capture.__e2eToastCapture?.stop();
    });
  };

  return {
    assertNoUnexpectedToasts,
    stop,
  };
}

// HARNESS_ONLY:
// Reason: validates snapshot-verification UI plumbing with stubbed service responses.
// Owner: app/tests/e2e/gui.snapshot_verification_flow.spec.ts
// Retire when: snapshot verification is asserted in real-service truth lanes.

test('snapshot verification flow (UI)', async ({ page }) => {
  const toastCapture = await startUnexpectedToastCapture(page);
  await installSnapshotFsShim(page);
  await installServiceStubs(page, 'snapshot', 'flat');
  await bootstrapHarness(page, {
    allowRecoveryBanner: true,
    requiredEnabledActions: ['workspace-action-snapshot'],
  });
  await toastCapture.assertNoUnexpectedToasts();

  const snapshotButton = page.getByTestId('workspace-action-snapshot');
  await expect(snapshotButton).toBeVisible({ timeout: 30_000 });
  await expect(snapshotButton).toBeEnabled();
  const snapshotsAction = page.getByTestId('snapshots-open-button');
  await expect(snapshotsAction).toBeVisible({ timeout: 30_000 });
  await snapshotsAction.click();
  const panel = page.getByTestId('snapshots-panel');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await toastCapture.assertNoUnexpectedToasts();
  await expect(page.getByTestId('snapshot-badge-pw-wizard-final')).toBeVisible();
  await expect(page.getByTestId('snapshots-health-status')).toHaveText(SNAPSHOTS_HEALTH_OK_PATTERN);
  await expect(page.getByText(/Last check:/)).toBeVisible();
  await toastCapture.assertNoUnexpectedToasts();

  await snapshotButton.click();
  await expect(page.getByTestId('snapshot-badge-snapshot-current')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('snapshot-badge-snapshot-current')).toBeVisible();
  await expect(page.getByTestId('snapshots-health-status')).toHaveText(SNAPSHOTS_HEALTH_OK_PATTERN);
  await toastCapture.assertNoUnexpectedToasts();

  const toastTitle = page.locator('.toast__title', { hasText: /snapshot created/i });
  await expect(toastTitle).toBeVisible({ timeout: 30_000 });
  const openPanelAction = page.locator('.toast__action-button', { hasText: /open snapshots panel/i });
  await expect(openPanelAction).toHaveCount(1);
  await expect(openPanelAction).toBeVisible();
  await toastCapture.assertNoUnexpectedToasts();

  const snapshotItem = page.locator('.snapshots-panel__item').first();
  await expect(snapshotItem).toBeVisible();
  const refreshStatusButton = page.getByTestId('snapshots-refresh-status-button');
  await expect(refreshStatusButton).toBeEnabled();
  await refreshStatusButton.click();
  await expect(page.getByTestId('snapshots-health-status')).toHaveText(SNAPSHOTS_HEALTH_OK_PATTERN);
  await expect(page.getByText(/Last check:/)).toBeVisible();
  await toastCapture.assertNoUnexpectedToasts();

  const rerunButton = snapshotItem.getByRole('button', { name: /re-run verification for this snapshot/i });
  await expect(rerunButton).toBeVisible();
  await rerunButton.click();
  await expect(page.getByText(/Last check:/)).toBeVisible();
  await expect(page.getByTestId('snapshots-health-status')).toHaveText(SNAPSHOTS_HEALTH_OK_PATTERN);
  await toastCapture.assertNoUnexpectedToasts();

  const viewFullReportButton = snapshotItem.getByRole('button', { name: /view snapshot details/i });
  await viewFullReportButton.click();

  const modal = page.getByTestId('verification-report-modal');
  await expect(modal).toBeVisible();
  const reportCard = modal.locator('.snapshots-panel__modal');
  await expect(reportCard).toHaveCSS('background-color', 'rgba(12, 17, 23, 0.98)');
  await expect(reportCard).toHaveCSS('color', 'rgb(231, 236, 242)');
  await expect(modal.getByText(/Integrity:/i)).toBeVisible();
  await expect(modal.getByText(/Snapshot ID/i)).toBeVisible();
  await expect(modal.getByText(/Files/i)).toBeVisible();
  await expect(modal.getByText(/Total size/i)).toBeVisible();
  await expect(modal.getByText(/Integrity:/i)).toBeVisible();

  await page.evaluate(() => document.body.classList.add('theme--dark'));
  await expect(modal).toBeVisible();

  const closeModalButton = modal.getByRole('button', { name: /close verification report/i });
  await expect(closeModalButton).toBeVisible();
  await closeModalButton.click();
  await expect(modal).not.toBeVisible();

  await panel.getByTestId('snapshots-open-report-file-button').click();
  await snapshotItem.getByRole('button', { name: /reveal snapshot snapshot-current/i }).click();
  await snapshotItem.getByRole('button', { name: /reveal manifest for snapshot-current/i }).click();
  await toastCapture.assertNoUnexpectedToasts();

  await expect(snapshotItem.getByRole('button', { name: /view snapshot details/i })).toBeVisible();
  await expect(page.getByTestId('workspace-action-snapshot')).toBeEnabled({ timeout: 30_000 });
  await toastCapture.assertNoUnexpectedToasts();
  await toastCapture.stop();
});
