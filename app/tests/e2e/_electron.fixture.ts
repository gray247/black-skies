import { _electron as electron, test as base, expect as baseExpect } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SERVICE_PORT } from './servicePort';

type Fixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const test = base.extend<Fixtures>({
  electronApp: async ({}, use) => {
    const appDir = path.resolve(__dirname, '..', '..');
    const packagedEntry = path.resolve(appDir, 'dist-electron', 'main', 'main.js');
    const devFallback = path.resolve(appDir, 'main', 'main.ts');
    const entryPoint = fs.existsSync(packagedEntry) ? packagedEntry : devFallback;
    const rendererIndex = path.resolve(appDir, 'dist', 'index.html');
    const rendererUrl = fs.existsSync(rendererIndex) ? pathToFileURL(rendererIndex).toString() : undefined;
    const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1' || !!process.env.CI;
    const launchEnv: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'test',
      ...(rendererUrl ? { ELECTRON_RENDERER_URL: rendererUrl } : {}),
      PLAYWRIGHT: '1',
      ...(disableAnimations ? { PLAYWRIGHT_DISABLE_ANIMATIONS: '1' } : {}),
      BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
    };

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

  page: async ({ electronApp }, use, testInfo) => {
    const window = await electronApp.firstWindow();
    window.on('console', (msg) => {
      console.log('[renderer]', msg.type(), msg.text());
    });
    window.on('pageerror', (err) => {
      console.error('[renderer.pageerror]', err);
    });

    const url = await window.url();
    console.log('[electron.url]', url);

    try {
      await window.waitForLoadState('domcontentloaded', { timeout: 5000 });
      const screenshotPath = testInfo.outputPath('boot.png');
      await window.screenshot({ path: screenshotPath });
      console.log('[boot.screenshot]', screenshotPath);
    } catch {
      // best effort screenshot
    }

    await window.waitForFunction(
      () => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true,
      null,
      { timeout: 30000 },
    );
    await baseExpect(window.getByTestId('app-root')).toBeVisible({ timeout: 30000 });

    await use(window);
  },
});

export const expect = test.expect;
