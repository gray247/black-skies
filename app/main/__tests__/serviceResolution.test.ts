import { describe, expect, it } from 'vitest';

import { resolveConfiguredServicePort } from '../serviceResolution.js';

describe('resolveConfiguredServicePort', () => {
  it('honors BLACKSKIES_SERVICES_PORT when it is valid', () => {
    expect(
      resolveConfiguredServicePort({
        BLACKSKIES_SERVICES_PORT: '8000',
      } as NodeJS.ProcessEnv),
    ).toBe(8000);
  });

  it('returns null when the configured port is missing or invalid', () => {
    expect(resolveConfiguredServicePort({} as NodeJS.ProcessEnv)).toBeNull();
    expect(
      resolveConfiguredServicePort({
        BLACKSKIES_SERVICES_PORT: 'not-a-port',
      } as NodeJS.ProcessEnv),
    ).toBeNull();
    expect(
      resolveConfiguredServicePort({
        BLACKSKIES_SERVICES_PORT: '70000',
      } as NodeJS.ProcessEnv),
    ).toBeNull();
  });
});
