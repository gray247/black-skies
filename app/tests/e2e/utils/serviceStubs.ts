import http from 'node:http';
import type { Page } from '@playwright/test';
import { SERVICE_PORT } from '../servicePort';
import { loadSampleProject } from './sampleProject';
import { setFlatMode, setRecoveryMode, setFullMode } from './testModeConfig';

type ServiceScenario = 'normal' | 'snapshot' | 'budget' | 'budget-indicator' | 'offline';
type TestMode = 'flat' | 'full' | 'recovery';

const { loadedProject } = loadSampleProject();
const projectPath = loadedProject.path.replace(/\\/g, '/');

const draftTexts = Object.fromEntries(
  Object.entries(loadedProject.drafts).map(([id, text]) => [id, text]),
);

const wordCount = (text = '') => text.trim().split(/\s+/).filter(Boolean).length;

const sceneMetrics = loadedProject.scenes.map((scene, index) => {
  const draftText = draftTexts[scene.id] ?? '';
  const sceneWordCount = wordCount(draftText);
  const readability = 16 + index;
  return {
    sceneId: scene.id,
    index,
    title: scene.title ?? `Scene ${index + 1}`,
    wordCount: sceneWordCount,
    readability: parseFloat((readability).toFixed(2)),
    readabilityMetrics: {
      avg_sentence_len: parseFloat((readability + 4).toFixed(2)),
      pct_long_sentences: parseFloat((0.25 + index * 0.01).toFixed(2)),
      ttr: parseFloat((0.4 + index * 0.01).toFixed(3)),
      bucket: 'Moderate',
    },
    density: {
      dialogueRatio: parseFloat((0.42 - index * 0.01).toFixed(2)),
      narrationRatio: parseFloat((0.58 + index * 0.01).toFixed(2)),
    },
    pacing: {
      structuralScore: parseFloat((1.2 + index * 0.1).toFixed(2)),
      bucket: 'Neutral',
    },
  };
});

const analyticsSummary = {
  projectId: loadedProject.project_id,
  projectPath,
  scenes: sceneMetrics.length,
  wordCount: sceneMetrics.reduce((sum, scene) => sum + scene.wordCount, 0),
  avgReadability: sceneMetrics.reduce((sum, scene) => sum + scene.readability, 0) / sceneMetrics.length,
  readability: {
    avg_sentence_len: sceneMetrics[0]?.readabilityMetrics.avg_sentence_len ?? 20,
    pct_long_sentences: sceneMetrics[0]?.readabilityMetrics.pct_long_sentences ?? 0.25,
    ttr: sceneMetrics[0]?.readabilityMetrics.ttr ?? 0.42,
    bucket: 'Moderate',
  },
  dialogue_ratio: sceneMetrics[0]?.density.dialogueRatio ?? 0.4,
  narration_ratio: sceneMetrics[0]?.density.narrationRatio ?? 0.6,
};

const analyticsScenes = {
  projectId: loadedProject.project_id,
  projectPath,
  scenes: sceneMetrics,
};

const analyticsRelationships = {
  projectId: loadedProject.project_id,
  nodes: sceneMetrics.map((scene) => ({
    id: `scene:${scene.sceneId}`,
    label: scene.title,
    type: 'scene',
  })),
  edges: [],
};

const preflightEstimate = {
  unitScope: 'scene',
  unitIds: [loadedProject.scenes[0].id],
  budget: {
    estimated_usd: 0.02,
    status: 'ok',
    message: 'Estimate within budget.',
    soft_limit_usd: 5.0,
    hard_limit_usd: 10.0,
    spent_usd: 0.02,
    total_after_usd: 0.02,
  },
};

const generateDraftResponse = {
  draft_id: 'flow-draft',
  schema_version: 'DraftUnitSchema v1',
  units: [
    {
      id: loadedProject.scenes[0].id,
      title: loadedProject.scenes[0].title ?? 'Scene',
      text: loadedProject.drafts[loadedProject.scenes[0].id] ?? 'Story text',
      meta: {
        id: loadedProject.scenes[0].id,
        order: loadedProject.scenes[0].order ?? 1,
        chapter_id: loadedProject.scenes[0].chapter_id,
        purpose: 'escalation',
        emotion_tag: 'tension',
        pov: 'Mara',
      },
    },
  ],
};

const critiqueResponse = {
  unit_id: loadedProject.scenes[0].id,
  schema_version: 'CritiqueOutputSchema v1',
  summary: 'Scene is strong.',
  line_comments: [],
  priorities: ['Pacing'],
  rubric: ['Logic'],
  model: { name: 'critique-model-v1', provider: 'offline' },
  heuristics: {},
  budget: {
    estimated_usd: 0.01,
    status: 'ok',
    message: 'Critique complete.',
    soft_limit_usd: 5.0,
    hard_limit_usd: 10.0,
    spent_usd: 0.02,
    total_after_usd: 0.02,
  },
};

const snapshotResponse = {
  snapshot_id: 'pw-wizard-final',
  label: 'wizard-finalize',
  created_at: new Date().toISOString(),
  path: 'history/snapshots/pw-wizard-final',
  includes: ['outline.json', 'drafts'],
};

const snapshotManifest = {
  snapshot_id: snapshotResponse.snapshot_id,
  created_at: snapshotResponse.created_at,
  path: snapshotResponse.path,
  files_included: [
    { path: 'outline.json', checksum: 'sha256-outline' },
    { path: 'drafts/story.json', checksum: 'sha256-draft' },
  ],
};

const verificationReport = {
  project_id: loadedProject.project_id,
  status: 'ok' as const,
  message: 'Snapshot verified successfully.',
  snapshots: [
    {
      snapshot_id: snapshotManifest.snapshot_id,
      status: 'ok' as const,
      errors: [],
      issues: [],
    },
  ],
};

const recoveryStatus = {
  project_id: loadedProject.project_id,
  status: 'idle',
  needs_recovery: false,
  last_snapshot: null,
};

const recoveryStatusSnapshot = {
  project_id: loadedProject.project_id,
  status: 'needs-recovery',
  needs_recovery: true,
  last_snapshot: snapshotResponse,
};

const restoreResponse = {
  project_id: loadedProject.project_id,
  status: 'idle',
  needs_recovery: false,
  last_snapshot: snapshotResponse,
};

let server: http.Server | null = null;
let currentScenario: ServiceScenario = 'normal';

async function syncForceOfflineFlag(page: Page, shouldForce: boolean): Promise<void> {
  const normalized = Boolean(shouldForce);
  await page.addInitScript((force: boolean) => {
    const target = window as typeof window & { __testEnvForceOffline?: boolean };
    target.__testEnvForceOffline = Boolean(force);
    window.dispatchEvent(new CustomEvent('test:force-offline', { detail: Boolean(force) }));
    if (force) {
      console.log('[service-stub-installed]', 'force-offline');
    }
  }, normalized);
  await page.evaluate((force) => {
    const target = window as typeof window & { __testEnvForceOffline?: boolean };
    target.__testEnvForceOffline = Boolean(force);
    window.dispatchEvent(new CustomEvent('test:force-offline', { detail: Boolean(force) }));
    if (force) {
      console.log('[service-stub-installed]', 'force-offline');
    }
  }, normalized);
}

async function applyTestMode(page: Page, mode: TestMode, reason?: string): Promise<void> {
  const modeSetter =
    mode === 'flat'
      ? setFlatMode
      : mode === 'recovery'
        ? setRecoveryMode
        : setFullMode;
  await page.addInitScript(modeSetter, reason);
  await page.evaluate(modeSetter, reason);
}

function respond(res: http.ServerResponse, data: unknown, status = 200): void {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

async function ensureServer(): Promise<void> {
  if (server) {
    return;
  }

  server = http.createServer((req, res) => {
    if (!req.url) {
      respond(res, { message: 'Missing URL' }, 400);
      return;
    }
    const target = new URL(req.url, `http://127.0.0.1:${SERVICE_PORT}`);
    const path = target.pathname.replace('/api/v1', '');
    const method = req.method ?? 'GET';
    switch (path) {
      case '/healthz':
        respond(res, { status: 'ok' });
        return;
      case '/outline/build':
        respond(res, loadedProject.outline);
        return;
      case '/draft/preflight':
        respond(res, preflightEstimate);
        return;
      case '/draft/generate':
        if (currentScenario === 'budget') {
          respond(res, { code: 'BUDGET_EXCEEDED', message: 'Budget limit exceeded.' }, 402);
        } else {
          respond(res, generateDraftResponse);
        }
        return;
      case '/draft/critique':
        if (currentScenario === 'budget') {
          respond(res, { code: 'BUDGET_EXCEEDED', message: 'Budget limit exceeded.' }, 402);
        } else {
          respond(res, critiqueResponse);
        }
        return;
      case '/analytics/budget':
        respond(
          res,
          {
            code: 'ANALYTICS_DISABLED',
            message: 'Budget analytics calls are suppressed in this build.',
          },
          410,
        );
        return;
      case '/draft/wizard/lock':
        respond(res, snapshotResponse);
        return;
      case '/draft/recovery':
        if (method === 'GET') {
          respond(res, currentScenario === 'snapshot' ? recoveryStatusSnapshot : recoveryStatus);
        } else {
          respond(res, restoreResponse);
        }
        return;
      case '/draft/recovery/restore':
        respond(res, restoreResponse);
        return;
      case '/snapshots':
        if (method === 'POST') {
          respond(
            res,
            {
              ...snapshotManifest,
              files_included: snapshotManifest.files_included,
            },
            201,
          );
        } else {
          respond(res, [snapshotManifest]);
        }
        return;
      case '/backups':
        if (method === 'POST') {
          const payload = {
            ok: true,
            path: '/mock/path',
            timestamp: Date.now(),
            message: 'Mock backup created successfully.',
          };
          respond(res, payload);
          console.log('[backup-stub-installed]', 'POST /backups returning mock payload');
        } else {
          respond(res, [
            {
              project_id: loadedProject.project_id,
              filename: 'pw-backup.zip',
              path: '/mock/path',
              created_at: new Date().toISOString(),
              checksum: 'sha256-backup',
            },
          ]);
        }
        return;
      case '/backups/restore':
        respond(res, {
          status: 'ok',
          restored_path: `${projectPath}/restored-backup`,
          restored_project_slug: 'restored-project',
        });
        return;
      case '/export':
        respond(res, {
          project_id: loadedProject.project_id,
          path: '/mock/export.md',
          format: 'md',
          chapters: loadedProject.scenes.length,
          scenes: loadedProject.scenes.length,
          meta_header: Boolean(true),
          exported_at: new Date().toISOString(),
          schema_version: 'ProjectExportResult v1',
        });
        return;
      case '/backup_verifier/run':
        respond(
          res,
          {
            ...verificationReport,
            started_at: new Date().toISOString(),
            finished_at: new Date().toISOString(),
          },
        );
        return;
      case '/backup_verifier/report':
        respond(res, verificationReport);
        return;
      case '/analytics/summary':
        respond(res, analyticsSummary);
        return;
      case '/analytics/scenes':
        respond(res, analyticsScenes);
        return;
      case '/analytics/relationships':
        respond(res, analyticsRelationships);
        return;
      default:
        respond(res, { message: 'Not found' }, 404);
    }
  });

  await new Promise<void>((resolve, reject) => {
    if (!server) {
      reject(new Error('Failed to start service stub server.'));
      return;
    }
    server.once('error', reject);
    server.once('listening', () => resolve());
    server.listen(SERVICE_PORT, '127.0.0.1');
  });
}

async function shutdownServer(): Promise<void> {
  if (!server) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  server = null;
}

export async function installServiceStubs(
  page: Page,
  scenario: ServiceScenario,
  modeOverride?: TestMode,
): Promise<void> {
  await page.addInitScript(() => {
    (window as typeof window & { __testEnvActiveFlow?: boolean }).__testEnvActiveFlow = true;
  });
  await page.evaluate(() => {
    (window as typeof window & { __testEnvActiveFlow?: boolean }).__testEnvActiveFlow = true;
  });
  const forceOffline = scenario === 'offline';
  await syncForceOfflineFlag(page, forceOffline);
  if (forceOffline) {
    console.log('[service-stub-installed]', 'offline/service_port_unavailable');
  }
  await page.evaluate((shouldSetReason) => {
    const reason = shouldSetReason ? 'service_port_unavailable' : undefined;
    const targetWindow = window as typeof window & { __testEnvForceOfflineReason?: string };
    if (reason) {
      targetWindow.__testEnvForceOfflineReason = reason;
    } else {
      delete targetWindow.__testEnvForceOfflineReason;
    }
    if (document.body) {
      if (reason) {
        document.body.dataset.testEnvForceOfflineReason = reason;
      } else {
        delete document.body.dataset.testEnvForceOfflineReason;
      }
    }
  }, forceOffline);
  const defaultMode: TestMode =
    scenario === 'offline'
      ? 'recovery'
      : scenario === 'snapshot'
        ? 'full'
        : 'full';
  const targetMode = scenario === 'snapshot' ? 'full' : modeOverride ?? defaultMode;
  const offlineReason = scenario === 'offline' ? 'service_port_unavailable' : undefined;
  await applyTestMode(page, targetMode, offlineReason);
  await ensureServer();
  currentScenario = scenario;
  console.log('[backup-stub-installed]', `scenario=${scenario}, mode=${targetMode}`);
  await page.evaluate((enabled) => {
    (window as typeof window & { __testEnvSnapshotRestoreFlow?: boolean })
      .__testEnvSnapshotRestoreFlow = enabled;
  }, scenario === 'snapshot');
}

export async function startServiceStubs(): Promise<void> {
  await ensureServer();
  currentScenario = 'normal';
}

export async function stopServiceStubs(): Promise<void> {
  await shutdownServer();
}
