export interface DisplayWorkArea {
  readonly id: number;
  readonly workArea: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
}

export interface InitialWindowBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function deriveSplitCommandInitialPlacement(
  displays: readonly DisplayWorkArea[],
  primaryDisplay: DisplayWorkArea,
) {
  const secondaryDisplay = displays.find((display) => display.id !== primaryDisplay.id);
  if (secondaryDisplay) {
    return {
      writingStudio: { ...primaryDisplay.workArea },
      commandCenter: { ...secondaryDisplay.workArea },
      displayMode: 'dual-display' as const,
    };
  }

  const area = primaryDisplay.workArea;
  const width = Math.min(area.width, Math.max(640, Math.floor(area.width * 0.72)));
  const height = Math.min(area.height, Math.max(560, Math.floor(area.height * 0.82)));
  const inset = Math.min(24, Math.max(0, Math.floor((area.width - width) / 2)));
  return {
    writingStudio: { x: area.x + inset, y: area.y + inset, width, height },
    commandCenter: {
      x: area.x + Math.max(0, area.width - width - inset),
      y: area.y + Math.max(0, area.height - height - inset),
      width,
      height,
    },
    displayMode: 'single-display' as const,
  };
}
