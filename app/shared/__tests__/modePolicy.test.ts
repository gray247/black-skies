import { afterEach, describe, expect, it } from 'vitest';
import * as modePolicy from '../modePolicy';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env.NODE_ENV = originalEnv.NODE_ENV;
  process.env.BLACKSKIES_E2E_MODE = originalEnv.BLACKSKIES_E2E_MODE;
  process.env.BLACKSKIES_E2E_SYNTHETIC_MODE = originalEnv.BLACKSKIES_E2E_SYNTHETIC_MODE;
  process.env.BLACKSKIES_E2E_EXTERNAL_SERVICE = originalEnv.BLACKSKIES_E2E_EXTERNAL_SERVICE;
  process.env.BLACKSKIES_ENABLE_HARNESS_HOOKS = originalEnv.BLACKSKIES_ENABLE_HARNESS_HOOKS;
  process.env.VISUAL_STRICT = originalEnv.VISUAL_STRICT;
});

describe('modePolicy', () => {
  it('defaults VISUAL_STRICT to false', () => {
    delete process.env.VISUAL_STRICT;
    expect(modePolicy.isVisualStrict()).toBe(false);
  });

  it('rejects synthetic mode in the truth lane', () => {
    process.env.NODE_ENV = 'test';
    process.env.BLACKSKIES_E2E_MODE = '1';
    process.env.BLACKSKIES_E2E_SYNTHETIC_MODE = '1';
    process.env.BLACKSKIES_E2E_EXTERNAL_SERVICE = '1';

    expect(() => modePolicy.assertValidMode()).toThrow(
      'Synthetic mode is forbidden in truth lane',
    );
  });

  it('rejects harness hooks in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.BLACKSKIES_ENABLE_HARNESS_HOOKS = '1';

    expect(() => modePolicy.assertValidMode()).toThrow(
      'Harness hooks are forbidden in production mode',
    );
  });
});
