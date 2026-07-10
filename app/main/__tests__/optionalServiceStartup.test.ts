import { describe, expect, it, vi } from 'vitest';
import { startOptionalServicesForCoreShell } from '../optionalServiceStartup';

describe('optional service startup', () => {
  it('reports healthy startup without invoking degraded handling', async () => {
    const startServices = vi.fn(async () => {});
    const onUnavailable = vi.fn();

    await expect(
      startOptionalServicesForCoreShell(startServices, onUnavailable),
    ).resolves.toBe(true);
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('allows the core shell to continue after optional service startup fails', async () => {
    const startServices = vi.fn(async () => {
      throw new Error('service unavailable');
    });
    const onUnavailable = vi.fn();

    await expect(
      startOptionalServicesForCoreShell(startServices, onUnavailable),
    ).resolves.toBe(false);
    expect(onUnavailable).toHaveBeenCalledWith({ message: 'service unavailable' });
  });
});
