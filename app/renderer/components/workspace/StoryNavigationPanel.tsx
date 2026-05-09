import type { ActiveOutlineV1 } from "../../utils/storyUnits";

interface StoryNavigationPanelProps {
  readonly outline: ActiveOutlineV1;
  readonly activeSceneId: string | null;
  readonly onSelectScene?: (sceneId: string) => void;
}

function formatOutlineLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function StoryNavigationPanel({
  outline,
  activeSceneId,
  onSelectScene,
}: StoryNavigationPanelProps): JSX.Element {
  return (
    <section
      className="split-command__panel split-command__panel--primary split-command__panel--navigation"
      aria-label="Story Navigation"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Story Navigation</h3>
          <p>{formatOutlineLabel(outline.label)} outline</p>
        </div>
        <span className="split-command__count" aria-label={`${outline.units.length} story units`}>
          {outline.units.length}
        </span>
      </div>

      {outline.units.length > 0 ? (
        <ol className="split-command__story-list" aria-label="Story units">
          {outline.units.map((unit) => {
            const isActive = unit.sceneId === activeSceneId;
            return (
              <li
                key={unit.unitId}
                className={
                  isActive
                    ? "split-command__story-item split-command__story-item--active"
                    : "split-command__story-item"
                }
                aria-current={isActive ? "page" : undefined}
              >
                <button
                  type="button"
                  className="split-command__story-button"
                  onClick={() => onSelectScene?.(unit.sceneId)}
                  disabled={!onSelectScene}
                  aria-label={`Select ${unit.title}`}
                >
                  <div className="split-command__story-item-main">
                    <div className="split-command__story-title-row">
                      <span className="split-command__story-index" aria-hidden="true">
                        {String(unit.order).padStart(2, "0")}
                      </span>
                      <span className="split-command__story-title">{unit.title}</span>
                    </div>
                    {unit.contentPreview ? (
                      <p className="split-command__story-preview">{unit.contentPreview}</p>
                    ) : null}
                  </div>
                  <div className="split-command__story-meta" aria-label={`${unit.title} metadata`}>
                    {isActive ? <span className="split-command__story-state">Selected</span> : null}
                    <span className="split-command__chip">{unit.state}</span>
                    <span className="split-command__source">{unit.sourceType}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="split-command__story-empty">
          No project scenes loaded yet. This future surface will list story units when the
          project has an outline.
        </p>
      )}
    </section>
  );
}
