import { _electron as electron, test as base, expect as baseExpect } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SERVICE_PORT } from './servicePort';
import { startServiceStubs, stopServiceStubs } from './utils/serviceStubs';

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
      BLACKSKIES_E2E_PORT: String(SERVICE_PORT),
    };

    const prevServicePort = process.env.BLACKSKIES_SERVICES_PORT;
    const prevE2ePort = process.env.BLACKSKIES_E2E_PORT;
    process.env.BLACKSKIES_SERVICES_PORT = launchEnv.BLACKSKIES_SERVICES_PORT;
    process.env.BLACKSKIES_E2E_PORT = launchEnv[ 'BLACKSKIES_E2E_PORT' ] ?? launchEnv.BLACKSKIES_SERVICES_PORT;

    await startServiceStubs();
    const application = await electron.launch({
      args: [entryPoint],
      env: launchEnv,
    });

    try {
      await use(application);
    } finally {
      await application.close();
      await stopServiceStubs();
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

    const url = await window.url();
    console.log('[electron.url]', url);

    await window.waitForLoadState('domcontentloaded', { timeout: 5000 });
    try {
      const screenshotPath = testInfo.outputPath('boot.png');
      const screenshotBuffer = await window.screenshot();
      await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
      await fs.promises.writeFile(screenshotPath, screenshotBuffer);
      console.log('[boot.screenshot]', screenshotPath);

      // Playwright auto-attaches files created via `page.screenshot({ path })` to the currently
      // running fixture step, but the attach event can fire after the fixture step completes,
      // which is what led to "Internal error: step id not found: fixture@NN". Attach manually
      // while the fixture is alive so the attachment is tied to a `test.attach` step instead.
      await testInfo.attach('boot screenshot', {
        body: screenshotBuffer,
        contentType: 'image/png',
      });
    } catch {
      // best effort screenshot
    }

    await window.waitForFunction(
      () => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true,
      null,
      { timeout: 30000 },
    );
    await baseExpect(window.getByTestId('app-root')).toBeVisible({ timeout: 30000 });

    try {
      await use(window);
    } finally {
      if (testInfo.status === 'passed') {
        return;
      }
      // Capture failure screenshots while the page fixture step is still active so that the
      // attachment can be associated with a valid step and avoid "step id not found: fixture@NN".
      try {
        const failureScreenshot = await window.screenshot();
        await testInfo.attach('failure screenshot', {
          body: failureScreenshot,
          contentType: 'image/png',
        });
      } catch (error) {
        console.warn('[electron.fixture] failed to capture failure screenshot', error);
      }
    }
  },
});

export const expect = test.expect;
