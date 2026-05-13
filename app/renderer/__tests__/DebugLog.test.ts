import { afterEach, describe, expect, it } from 'vitest';

import { clearDebugLog, getDebugLogSnapshot, recordDebugEvent } from '../utils/debugLog';

describe('debugLog', () => {
  afterEach(() => {
    clearDebugLog();
    delete window.__blackskiesDebugLog;
  });

  it('recreates the window debug log when harness cleanup deletes it', () => {
    delete window.__blackskiesDebugLog;

    expect(() => recordDebugEvent('harness.reset', { ok: true })).not.toThrow();
    expect(Array.isArray(window.__blackskiesDebugLog)).toBe(true);
    expect(window.__blackskiesDebugLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scope: 'harness.reset',
        }),
      ]),
    );
  });

  it('replaces invalid debug log state before appending', () => {
    window.__blackskiesDebugLog = {} as never;

    recordDebugEvent('harness.invalid-state', { ok: true });

    expect(Array.isArray(window.__blackskiesDebugLog)).toBe(true);
    expect(getDebugLogSnapshot().events.at(-1)).toMatchObject({
      scope: 'harness.invalid-state',
    });
  });
});
