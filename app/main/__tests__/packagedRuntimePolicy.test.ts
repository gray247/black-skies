import { describe, expect, it } from 'vitest';
import {
  shouldEnableDedicatedStage19Host,
  shouldResolveLegacyPython,
  shouldStartLegacyServices,
} from '../packagedRuntimePolicy';

describe('packaged runtime policy', () => {
  it('forces the dedicated Stage 19 host in packaged applications', () => {
    expect(shouldEnableDedicatedStage19Host(true, false)).toBe(true);
    expect(shouldEnableDedicatedStage19Host(true, true)).toBe(true);
  });

  it('preserves the explicit development host switch outside packaging', () => {
    expect(shouldEnableDedicatedStage19Host(false, false)).toBe(false);
    expect(shouldEnableDedicatedStage19Host(false, true)).toBe(true);
  });

  it('prohibits legacy Python resolution and services in packaged applications', () => {
    expect(shouldResolveLegacyPython(true)).toBe(false);
    expect(shouldStartLegacyServices(true)).toBe(false);
    expect(shouldResolveLegacyPython(false)).toBe(true);
    expect(shouldStartLegacyServices(false)).toBe(true);
  });
});
