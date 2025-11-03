import { useEffect } from 'react';

interface DockHotkeyOptions {
  enableHotkeys: boolean;
  applyPreset: (presetKey: string) => void;
  resetToDefault: () => void;
  cycleFocus: (direction: 1 | -1) => void;
  defaultPresetKey: string;
}

export function useDockHotkeys(options: DockHotkeyOptions): void {
  const { enableHotkeys, applyPreset, resetToDefault, cycleFocus, defaultPresetKey } = options;

  useEffect(() => {
    if (!enableHotkeys) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      if (!(event.ctrlKey && event.altKey)) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
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
  }, [applyPreset, cycleFocus, defaultPresetKey, enableHotkeys, resetToDefault]);
}
