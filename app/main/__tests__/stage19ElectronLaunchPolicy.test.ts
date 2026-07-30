import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(import.meta.dirname, '..', '..');

function source(relativePath: string): string {
  return readFileSync(path.join(appRoot, relativePath), 'utf8');
}

describe('Stage 19 Electron launch policy', () => {
  it('uses the production GPU and sandbox contract in Playwright', () => {
    const launchSources = [
      source('main/main.ts'),
      source('tests/e2e/_electron.fixture.ts'),
      source('tests/e2e/stage19-electron-support.ts'),
    ];

    for (const launchSource of launchSources) {
      expect(launchSource).not.toContain("'--disable-gpu'");
      expect(launchSource).not.toContain('PLAYWRIGHT === \'1\') {\n  app.disableHardwareAcceleration()');
    }
  });

  it('keeps retries disabled for the complete Electron inventory', () => {
    expect(source('playwright.config.ts')).toContain('const resolvedRetries = 0;');
  });
});
