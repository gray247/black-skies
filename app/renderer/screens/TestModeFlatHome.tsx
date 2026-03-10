import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ProjectHome, { type ProjectHomeProps } from "../components/ProjectHome";

type TestModeFlatHomeProps = ProjectHomeProps & {
  wizardPanel: ReactNode;
  workspaceHeader?: ReactNode;
  recoveryBanner?: ReactNode;
  onReload?: () => void;
};

const FOCUS_PANE_IDS = ["outline", "draftPreview", "critique", "timeline"];
const TEST_PANE_IDS = [
  ...FOCUS_PANE_IDS.filter((paneId) => paneId !== "outline"),
  "storyInsights",
  "corkboard",
];

export function TestModeFlatHome({
  wizardPanel,
  workspaceHeader,
  recoveryBanner,
  onReload,
  ...projectHomeProps
}: TestModeFlatHomeProps): ReactElement {
  const [storyInsightsVisible, setStoryInsightsVisible] = useState(true);
  const paneRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const registerPaneRef = useCallback((paneId: string) => (node: HTMLDivElement | null) => {
    if (node) {
      paneRefs.current.set(paneId, node);
    } else {
      paneRefs.current.delete(paneId);
    }
  }, []);

  const cycleFocus = useCallback(
    (direction: 1 | -1) => {
      const focusOrder = FOCUS_PANE_IDS.filter((paneId) =>
        paneRefs.current.has(paneId),
      );
      if (focusOrder.length === 0) {
        return;
      }
      const activeElement = document.activeElement;
      let currentIndex = -1;
      focusOrder.forEach((paneId, index) => {
        const paneElement = paneRefs.current.get(paneId);
        if (paneElement && paneElement.contains(activeElement)) {
          currentIndex = index;
        }
      });
      const fallbackIndex = direction === 1 ? 0 : focusOrder.length - 1;
      const nextIndex =
        currentIndex === -1
          ? fallbackIndex
          : (currentIndex + direction + focusOrder.length) % focusOrder.length;
      const targetPane = paneRefs.current.get(focusOrder[nextIndex]);
      if (targetPane) {
        targetPane.focus();
      }
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
      if (!hasCtrlOrMeta || !event.altKey) {
        return;
      }
      switch (event.key) {
        case "]":
          event.preventDefault();
          console.log('[test-mode-hotkey]', 'BracketRight');
          cycleFocus(1);
          break;
        case "[":
          event.preventDefault();
          console.log('[test-mode-hotkey]', 'BracketLeft');
          cycleFocus(-1);
          break;
        case "1":
          event.preventDefault();
          console.log('[test-mode-hotkey]', 'Digit1');
          setStoryInsightsVisible(false);
          break;
        case "2":
          event.preventDefault();
          console.log('[test-mode-hotkey]', 'Digit2');
          setStoryInsightsVisible(true);
          break;
        case "3":
          event.preventDefault();
          console.log('[test-mode-hotkey]', 'Digit3');
          setStoryInsightsVisible(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cycleFocus]);

  return (
    <div data-testid="test-flat-home" className="test-flat-home">
      {workspaceHeader ? (
        <div className="test-flat-home__workspace-header">{workspaceHeader}</div>
      ) : null}
      <div className="test-flat-home__wizard">{wizardPanel}</div>
      {recoveryBanner ? (
        <div className="test-flat-home__recovery-banner">
          {recoveryBanner}
          {onReload ? (
            <button
              type="button"
              className="test-flat-home__recovery-refresh"
              onClick={onReload}
            >
              Refresh from disk
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="test-flat-home__panes">
        {TEST_PANE_IDS.map((paneId) => {
          if (paneId === "storyInsights" && !storyInsightsVisible) {
            return null;
          }
          return (
            <div
              key={paneId}
              ref={registerPaneRef(paneId)}
              data-pane-id={paneId}
              className={`test-pane test-pane--${paneId}`}
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
            />
          );
        })}
      </div>
      <div
        ref={registerPaneRef("outline")}
        data-pane-id="outline"
        className="test-outline-pane"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      />
      <ProjectHome {...projectHomeProps} />
    </div>
  );
}
