import { describe, expect, it, beforeEach, vi } from 'vitest';

let displays: Array<{ id: number; workArea: { x: number; y: number; width: number; height: number } }> = [];

vi.mock('electron', () => ({
  screen: {
    getAllDisplays: () => displays,
    getPrimaryDisplay: () => displays[0],
    getDisplayMatching: (bounds: { x: number; y: number; width: number; height: number }) => {
      return (
        displays.find((display) =>
          bounds.x >= display.workArea.x &&
          bounds.x < display.workArea.x + display.workArea.width &&
          bounds.y >= display.workArea.y &&
          bounds.y < display.workArea.y + display.workArea.height,
        ) || displays[0]
      );
    },
  },
}));

import { clampBoundsToDisplay } from '../layoutIpc';

describe('clampBoundsToDisplay', () => {
  beforeEach(() => {
    displays = [
      { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
      { id: 2, workArea: { x: 1920, y: 0, width: 1920, height: 1080 } },
    ];
  });

  it('returns undefined when bounds missing', () => {
    expect(clampBoundsToDisplay(undefined, undefined)).toBeUndefined();
  });

  it('clamps bounds within specified display', () => {
    const bounds = clampBoundsToDisplay({ x: 2000, y: 50, width: 3000, height: 2000 }, 2);
    expect(bounds).toEqual({
      x: 1920,
      y: 0,
      width: 1920,
      height: 1080,
    });
  });

  it('falls back to primary display when id not found', () => {
    const bounds = clampBoundsToDisplay({ x: -200, y: 10, width: 100, height: 100 }, 99);
    expect(bounds).toEqual({ x: 0, y: 10, width: 240, height: 180 });
  });

  it('clamps negative coordinates inside work area', () => {
    const bounds = clampBoundsToDisplay({ x: -500, y: -500, width: 400, height: 400 }, 1);
    expect(bounds).toEqual({ x: 0, y: 0, width: 400, height: 400 });
  });
});
