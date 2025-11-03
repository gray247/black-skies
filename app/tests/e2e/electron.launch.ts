import { test as base, expect } from '@playwright/test';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';

type AppFixtures = {
  app: ElectronApplication;
  page: Page;
  tmpProjectDir: string;
};

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
    const packagedEntry = path.resolve(appDir, 'dist-electron', 'main.js');
    const devFallback = path.resolve(appDir, 'main', 'main.ts');
    const entryPoint = fs.existsSync(packagedEntry) ? packagedEntry : devFallback;

    const application = await electron.launch({
      args: [entryPoint],
      env: {
        ...process.env,
        PLAYWRIGHT: '1',
      },
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
