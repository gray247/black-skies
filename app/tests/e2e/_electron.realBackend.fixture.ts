import { _electron as electron, test as base, expect as baseExpect } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import type { Readable } from 'node:stream';
import { loadSampleProject } from './utils/sampleProject';

type BackendAccessEntry = {
  method: string;
  target: string;
  status: number;
};

type Fixtures = {
  electronApp: ElectronApplication;
  page: Page;
  backend: {
    port: number;
    projectId: string;
    projectRoot: string;
    accessLog: BackendAccessEntry[];
  };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REAL_BACKEND_PORT = 9998;
const HEALTH_PATH = '/api/v1/healthz';

function parseUvicornAccessLine(line: string): BackendAccessEntry | null {
  let source = line;
  try {
    const parsed = JSON.parse(line) as { message?: unknown } | null;
    if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') {
      source = parsed.message;
    }
  } catch {
    // fall back to the raw line
  }

  const match = source.match(/"([A-Z]+)\s+([^\s]+)\s+HTTP\/[0-9.]+"\s+(\d{3})\b/);
  if (!match) {
    return null;
  }
  return {
    method: match[1],
    target: match[2],
    status: Number.parseInt(match[3], 10),
  };
}

function attachStreamLineParser(stream: Readable | null, onLine: (line: string) => void): void {
  if (!stream) {
    return;
  }
  let buffer = '';
  stream.setEncoding('utf-8');
  stream.on('data', (chunk) => {
    buffer += chunk;
    while (true) {
      const idx = buffer.indexOf('\n');
      if (idx === -1) {
        break;
      }
      const line = buffer.slice(0, idx).trimEnd();
      buffer = buffer.slice(idx + 1);
      if (line) {
        onLine(line);
      }
    }
  });
  stream.on('end', () => {
    const line = buffer.trimEnd();
    if (line) {
      onLine(line);
    }
  });
}

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return;
      }
    } catch {
      // ignore; backend may still be booting
    }
    await delay(500);
  }
  throw new Error(`[e2e.real-backend] Backend did not respond at ${url} within ${timeoutMs}ms`);
}

function materializeSampleProject(baseDir: string): { projectId: string; projectRoot: string } {
  const sample = loadSampleProject();
  const projectId = sample.projectId;
  const destRoot = path.join(baseDir, projectId);
  fs.mkdirSync(destRoot, { recursive: true });
  fs.copyFileSync(path.join(sample.projectRoot, 'project.json'), path.join(destRoot, 'project.json'));
  fs.copyFileSync(path.join(sample.projectRoot, 'outline.json'), path.join(destRoot, 'outline.json'));
  fs.cpSync(path.join(sample.projectRoot, 'drafts'), path.join(destRoot, 'drafts'), { recursive: true });
  return { projectId, projectRoot: destRoot.replace(/\\/g, '/') };
}

export const test = base.extend<Fixtures>({
  backend: async ({}, use) => {
    if (process.env.BLACKSKIES_E2E_REAL_BACKEND !== '1') {
      throw new Error(
        '[e2e.real-backend] This test lane is opt-in. Re-run with BLACKSKIES_E2E_REAL_BACKEND=1 (and PYTHON set to your venv python).',
      );
    }

    const python = process.env.PYTHON || 'python3';
    const repoRoot = path.resolve(__dirname, '../../..');
    const launchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blackskies-e2e-real-backend-'));
    const projectBaseDir = path.join(launchRoot, 'project-base');
    fs.mkdirSync(projectBaseDir, { recursive: true });
    const project = materializeSampleProject(projectBaseDir);

    const accessLog: BackendAccessEntry[] = [];
    const backendEnv: NodeJS.ProcessEnv = {
      ...process.env,
      BLACKSKIES_SERVICES_PORT: String(REAL_BACKEND_PORT),
      BLACKSKIES_E2E_PORT: String(REAL_BACKEND_PORT),
      BLACKSKIES_E2E_MODE: '1',
      BLACKSKIES_PROJECT_BASE_DIR: projectBaseDir,
      PROJECT_BASE_DIR: projectBaseDir,
      PYTHONPATH: `${path.join(repoRoot, 'services', 'src')}${path.delimiter}${process.env.PYTHONPATH ?? ''}`,
    };

    const backend = spawn(
      python,
      [
        '-m',
        'uvicorn',
        'blackskies.services.app:create_app',
        '--factory',
        '--host',
        '127.0.0.1',
        '--port',
        String(REAL_BACKEND_PORT),
      ],
      {
        env: backendEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    backend.stdout?.pipe(process.stdout);
    backend.stderr?.pipe(process.stderr);
    attachStreamLineParser(backend.stdout, (line) => {
      const parsed = parseUvicornAccessLine(line);
      if (parsed) {
        accessLog.push(parsed);
      }
    });
    attachStreamLineParser(backend.stderr, (line) => {
      const parsed = parseUvicornAccessLine(line);
      if (parsed) {
        accessLog.push(parsed);
      }
    });

    try {
      await waitForHealth(`http://127.0.0.1:${REAL_BACKEND_PORT}${HEALTH_PATH}`, 30_000);
      await use({ port: REAL_BACKEND_PORT, projectId: project.projectId, projectRoot: project.projectRoot, accessLog });
    } finally {
      backend.kill('SIGTERM');
      try {
        fs.rmSync(launchRoot, { recursive: true, force: true });
      } catch {
        // best effort
      }
    }
  },

  electronApp: async ({ backend }, use) => {
    const appDir = path.resolve(__dirname, '..', '..');
    const packagedEntry = path.resolve(appDir, 'dist-electron', 'main', 'main.js');
    const rendererIndex = path.resolve(appDir, 'dist', 'index.html');
    if (!fs.existsSync(packagedEntry)) {
      throw new Error(
        `[e2e] Missing Electron main build artifact at ${packagedEntry}. Run: pnpm --filter app build:main`,
      );
    }
    if (!fs.existsSync(rendererIndex)) {
      throw new Error(
        `[e2e] Missing renderer build artifact at ${rendererIndex}. Run: pnpm --filter app build`,
      );
    }
    const rendererUrl = pathToFileURL(rendererIndex).toString();
    const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1' || !!process.env.CI;
    const launchEnv: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'test',
      ELECTRON_RENDERER_URL: rendererUrl,
      PLAYWRIGHT: '1',
      BLACKSKIES_ENABLE_HARNESS_HOOKS: '1',
      ...(disableAnimations ? { PLAYWRIGHT_DISABLE_ANIMATIONS: '1' } : {}),
      BLACKSKIES_SERVICES_PORT: String(backend.port),
      BLACKSKIES_E2E_PORT: String(backend.port),
      BLACKSKIES_E2E_MODE: '1',
    };

    const prevServicePort = process.env.BLACKSKIES_SERVICES_PORT;
    const prevE2ePort = process.env.BLACKSKIES_E2E_PORT;
    process.env.BLACKSKIES_SERVICES_PORT = launchEnv.BLACKSKIES_SERVICES_PORT;
    process.env.BLACKSKIES_E2E_PORT = launchEnv.BLACKSKIES_E2E_PORT;

    const application = await electron.launch({
      args: [packagedEntry],
      env: launchEnv,
    });

    try {
      await use(application);
    } finally {
      await application.close();
      process.env.BLACKSKIES_SERVICES_PORT = prevServicePort;
      process.env.BLACKSKIES_E2E_PORT = prevE2ePort;
    }
  },

  page: async ({ electronApp }, use, testInfo) => {
    const window = await electronApp.firstWindow();
    window.on('console', (msg) => {
      console.log('[renderer]', msg.type(), msg.text());
    });
    window.on('pageerror', (err) => {
      console.error('[renderer.pageerror]', err);
    });

    await window.waitForLoadState('domcontentloaded', { timeout: 5000 });
    await window.waitForFunction(
      () => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true,
      null,
      { timeout: 30_000 },
    );
    await baseExpect(window.getByTestId('app-root')).toBeVisible({ timeout: 30_000 });

    try {
      await use(window);
    } finally {
      if (testInfo.status === 'passed') {
        return;
      }
      try {
        const failureScreenshot = await window.screenshot();
        await testInfo.attach('failure screenshot', {
          body: failureScreenshot,
          contentType: 'image/png',
        });
      } catch (error) {
        console.warn('[electron.real-backend.fixture] failed to capture failure screenshot', error);
      }
    }
  },
});

export const expect = test.expect;
