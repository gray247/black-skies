import { test as base, expect } from '@playwright/test';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type AppFixtures = {
  app: ElectronApplication;
  page: Page;
  tmpProjectDir: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resetPersistedHarnessState(repoRoot: string): void {
  const candidateLayoutDirs = [
    path.join(repoRoot, 'sample_project', 'proj_esther_estate', '.blackskies'),
    path.join(repoRoot, 'sample_project', 'Esther_Estate', '.blackskies'),
  ];
  for (const dir of candidateLayoutDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort cleanup for deterministic launches
    }
  }
}

function requireElectronBuildArtifacts(params: {
  packagedEntry: string;
  packagedEntryExists: boolean;
  rendererIndex: string;
  rendererIndexExists: boolean;
  devFallback: string;
  strict: boolean;
}): void {
  const {
    packagedEntry,
    packagedEntryExists,
    rendererIndex,
    rendererIndexExists,
    devFallback,
    strict,
  } = params;
  if (packagedEntryExists && rendererIndexExists) {
    return;
  }
  const message =
    '[electron.launch] missing Electron build artifacts: ' +
    `packagedEntry=${packagedEntry} exists=${packagedEntryExists}, ` +
    `rendererIndex=${rendererIndex} exists=${rendererIndexExists}, ` +
    `devFallback=${devFallback}. Run app build:renderer and app build:main before e2e.`;
  if (strict) {
    throw new Error(message);
  }
  console.warn(message);
}

export const test = base.extend<AppFixtures>({
  tmpProjectDir: async ({}, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackskies-e2e-'));
    try {
      await use(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },

  app: async ({}, use) => {
    const appDir = path.resolve(__dirname, '..', '..');
    const repoRoot = path.resolve(appDir, '..');
    const packagedEntry = path.resolve(appDir, 'dist-electron', 'main', 'main.js');
    const devFallback = path.resolve(appDir, 'main', 'main.ts');
    const packagedEntryExists = fs.existsSync(packagedEntry);
    const rendererIndex = path.resolve(appDir, 'dist', 'index.html');
    const rendererIndexExists = fs.existsSync(rendererIndex);
    const strictPackagedArtifacts =
      process.env.CI === 'true' || process.env.PLAYWRIGHT === '1';
    requireElectronBuildArtifacts({
      packagedEntry,
      packagedEntryExists,
      rendererIndex,
      rendererIndexExists,
      devFallback,
      strict: strictPackagedArtifacts,
    });
    const entryPoint = packagedEntryExists ? packagedEntry : devFallback;
    const rendererUrl = rendererIndexExists
      ? pathToFileURL(rendererIndex).toString()
      : undefined;
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackskies-e2e-userdata-'));

    const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1' || !!process.env.CI;
    const launchEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PLAYWRIGHT: '1',
      BLACKSKIES_ENABLE_HARNESS_HOOKS: '1',
      BLACKSKIES_E2E_MODE: '1',
      ...(disableAnimations ? { PLAYWRIGHT_DISABLE_ANIMATIONS: '1' } : {}),
    };

    if (!launchEnv.ELECTRON_RENDERER_URL && rendererUrl) {
      launchEnv.ELECTRON_RENDERER_URL = rendererUrl;
    }
    if (process.platform === 'linux') {
      launchEnv.ELECTRON_DISABLE_SANDBOX = '1';
    }
    resetPersistedHarnessState(repoRoot);

    const application = await electron.launch({
      args: [
        ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
        `--user-data-dir=${userDataDir}`,
        entryPoint,
      ],
      env: launchEnv,
    });

    try {
      await use(application);
    } finally {
      await application.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },

  page: async ({ app }, use) => {
    const firstWindow = await app.firstWindow();
    await use(firstWindow);
  },
});

export { expect } from '@playwright/test';
