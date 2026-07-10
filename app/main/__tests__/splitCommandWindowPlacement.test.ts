import { describe, expect, it } from 'vitest';
import { deriveSplitCommandInitialPlacement } from '../splitCommandWindowPlacement';

describe('split command initial window placement', () => {
  it('places Writing Studio on primary and Command Center on the second display', () => {
    const primary = { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1040 } };
    const secondary = { id: 2, workArea: { x: 1920, y: 0, width: 2560, height: 1400 } };
    expect(deriveSplitCommandInitialPlacement([primary, secondary], primary)).toEqual({
      writingStudio: primary.workArea,
      commandCenter: secondary.workArea,
      displayMode: 'dual-display',
    });
  });

  it('offsets two reachable windows within one display without exact overlap', () => {
    const primary = { id: 1, workArea: { x: 0, y: 0, width: 1366, height: 728 } };
    const placement = deriveSplitCommandInitialPlacement([primary], primary);
    expect(placement.displayMode).toBe('single-display');
    expect(placement.writingStudio).not.toEqual(placement.commandCenter);
    for (const bounds of [placement.writingStudio, placement.commandCenter]) {
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(1366);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(728);
    }
  });
});
