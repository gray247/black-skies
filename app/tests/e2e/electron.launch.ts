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
    const packagedEntry = path.resolve(appDir, 'dist-electron', 'main', 'main.js');
    const devFallback = path.resolve(appDir, 'main', 'main.ts');
    const entryPoint = fs.existsSync(packagedEntry) ? packagedEntry : devFallback;
    const rendererIndex = path.resolve(appDir, 'dist', 'index.html');
    const rendererUrl = fs.existsSync(rendererIndex)
      ? pathToFileURL(rendererIndex).toString()
      : undefined;

    const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1';
    const launchEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PLAYWRIGHT: '1',
      ...(disableAnimations ? { PLAYWRIGHT_DISABLE_ANIMATIONS: '1' } : {}),
    };

    if (!launchEnv.ELECTRON_RENDERER_URL && rendererUrl) {
      launchEnv.ELECTRON_RENDERER_URL = rendererUrl;
    }

    const application = await electron.launch({
      args: [entryPoint],
      env: launchEnv,
    });

    try {
      await use(application);
    } finally {
      await application.close();
    }
  },

  page: async ({ app }, use) => {
    const firstWindow = await app.firstWindow();
    await use(firstWindow);
  },
});

export { expect } from '@playwright/test';
