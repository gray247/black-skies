import { useEffect, type RefObject } from 'react';

interface DockHotkeyOptions {
  enableHotkeys: boolean;
  applyPreset: (presetKey: string) => void;
  resetToDefault: () => void;
  cycleFocus: (direction: 1 | -1) => void;
  defaultPresetKey: string;
  containerRef: RefObject<HTMLElement | null>;
}

export function useDockHotkeys(options: DockHotkeyOptions): void {
  const {
    enableHotkeys,
    applyPreset,
    resetToDefault,
    cycleFocus,
    defaultPresetKey,
    containerRef,
  } = options;

  useEffect(() => {
    if (!enableHotkeys) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const container = containerRef.current;
      if (container) {
        const activeElement = document.activeElement;
        const focusWithinContainer =
          (activeElement instanceof HTMLElement && container.contains(activeElement)) ||
          (target instanceof HTMLElement && container.contains(target));
        if (!focusWithinContainer) {
          return;
        }
      }
      const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
      if (hasCtrlOrMeta && event.shiftKey && !event.altKey && (event.key === 'E' || event.key === 'e')) {
        event.preventDefault();
        cycleFocus(1);
        return;
      }
      if (!(hasCtrlOrMeta && event.altKey)) {
        return;
      }
      switch (event.key) {
        case '0':
          event.preventDefault();
          void resetToDefault();
          break;
        case '1':
          event.preventDefault();
          applyPreset(defaultPresetKey);
          break;
        case '2':
          event.preventDefault();
          applyPreset('analysis');
          break;
        case '3':
          event.preventDefault();
          applyPreset('critique');
          break;
        case ']':
          event.preventDefault();
          cycleFocus(1);
          break;
        case '[':
          event.preventDefault();
          cycleFocus(-1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyPreset, containerRef, cycleFocus, defaultPresetKey, enableHotkeys, resetToDefault]);
}
