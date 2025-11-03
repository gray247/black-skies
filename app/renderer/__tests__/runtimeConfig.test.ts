import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DEFAULT_RUNTIME_CONFIG,
  clearRuntimeConfigCache,
  loadRuntimeConfig,
} from '../../shared/config/runtime';

describe('loadRuntimeConfig caching and validation', () => {
  let tempDir: string;
  let originalEnvPath: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'runtime-config-test-'));
    originalEnvPath = process.env.BLACKSKIES_CONFIG_PATH;
  });

  afterEach(() => {
    if (originalEnvPath === undefined) {
      delete process.env.BLACKSKIES_CONFIG_PATH;
    } else {
      process.env.BLACKSKIES_CONFIG_PATH = originalEnvPath;
    }
    clearRuntimeConfigCache();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('reuses cached config for the same path until cleared', () => {
    const configPath = join(tempDir, 'runtime.yaml');
    writeFileSync(configPath, 'service:\n  port_range: { min: 5000, max: 5001 }\n', 'utf8');

    process.env.BLACKSKIES_CONFIG_PATH = configPath;
    const first = loadRuntimeConfig();
    expect(first.service.portRange.min).toBe(5000);

    writeFileSync(configPath, 'service:\n  port_range: { min: 6000, max: 6001 }\n', 'utf8');
    const cached = loadRuntimeConfig();
    expect(cached.service.portRange.min).toBe(5000);

    clearRuntimeConfigCache(configPath);
    const reloaded = loadRuntimeConfig();
    expect(reloaded.service.portRange.min).toBe(6000);
  });

  it('warns and falls back to defaults when port range is out of bounds', () => {
    const configPath = join(tempDir, 'runtime-invalid.yaml');
    writeFileSync(configPath, 'service:\n  port_range: { min: 70000, max: 80000 }\n', 'utf8');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    process.env.BLACKSKIES_CONFIG_PATH = configPath;
    const config = loadRuntimeConfig();

    expect(config.service.portRange).toEqual(DEFAULT_RUNTIME_CONFIG.service.portRange);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('falls back to defaults when the config file is missing', () => {
    process.env.BLACKSKIES_CONFIG_PATH = join(tempDir, 'does-not-exist.yaml');
    const config = loadRuntimeConfig();
    expect(config).toBe(DEFAULT_RUNTIME_CONFIG);
  });
});
