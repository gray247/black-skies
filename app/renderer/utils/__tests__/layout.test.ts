import { describe, expect, it } from 'vitest';

import { boundsDiffer, clampBoundsToArea } from '../layout';

describe('layout utils', () => {
  describe('boundsDiffer', () => {
    it('returns false when either input is missing', () => {
      expect(boundsDiffer(undefined, undefined)).toBe(false);
      expect(boundsDiffer({ x: 0, y: 0, width: 100, height: 100 }, undefined)).toBe(false);
    });

    it('detects coordinate changes', () => {
      expect(
        boundsDiffer(
          { x: 0, y: 0, width: 320, height: 240 },
          { x: 5, y: 0, width: 320, height: 240 },
        ),
      ).toBe(true);
      expect(
        boundsDiffer(
          { x: 0, y: 0, width: 320, height: 240 },
          { x: 0, y: 0, width: 300, height: 240 },
        ),
      ).toBe(true);
      expect(
        boundsDiffer(
          { x: 10, y: 10, width: 320, height: 240 },
          { x: 10, y: 10, width: 320, height: 240 },
        ),
      ).toBe(false);
    });
  });

  describe('clampBoundsToArea', () => {
    it('keeps bounds inside the provided work area', () => {
      const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
      const results = clampBoundsToArea(
        { x: 2000, y: 1200, width: 300, height: 400 },
        workArea,
      );
      expect(results).toEqual({ x: 1620, y: 680, width: 300, height: 400 });
    });

    it('enforces minimum pane size', () => {
      const workArea = { x: 0, y: 0, width: 1024, height: 768 };
      const results = clampBoundsToArea({ x: 0, y: 0, width: 100, height: 100 }, workArea);
      expect(results.width).toBe(240);
      expect(results.height).toBe(180);
    });

    it('clamps negative coordinates to the work area', () => {
      const workArea = { x: -300, y: 0, width: 1200, height: 900 };
      const results = clampBoundsToArea({ x: -800, y: -200, width: 400, height: 400 }, workArea);
      expect(results.x).toBe(-300);
      expect(results.y).toBe(0);
    });
  });
});
