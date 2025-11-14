import type { FloatingPaneDescriptor } from '../../shared/ipc/layout';

export interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function boundsDiffer(
  before?: FloatingPaneDescriptor['bounds'],
  after?: FloatingPaneDescriptor['bounds'],
): boolean {
  if (!before || !after) {
    return false;
  }
  return (
    before.x !== after.x ||
    before.y !== after.y ||
    before.width !== after.width ||
    before.height !== after.height
  );
}

export function clampBoundsToArea(bounds: RectLike, workArea: RectLike): RectLike {
  const width = Math.max(240, Math.min(bounds.width, workArea.width));
  const height = Math.max(180, Math.min(bounds.height, workArea.height));
  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;
  const clampedX = Math.min(Math.max(bounds.x, workArea.x), maxX);
  const clampedY = Math.min(Math.max(bounds.y, workArea.y), maxY);
  return {
    x: clampedX,
    y: clampedY,
    width,
    height,
  };
}
