import { useId, useMemo, useState } from 'react';

import type {
  EmotionGraphCandidatePointV1,
  EmotionGraphPointV1,
  EmotionGraphProjectionPointV1,
  EmotionGraphProjectionV1,
  EmotionGraphSelectionV1,
} from '../../shared/emotionGraph';

export interface EmotionGraphProps {
  readonly projection: EmotionGraphProjectionV1;
  readonly onSelectPoint?: (selection: EmotionGraphSelectionV1) => void;
}

function pointId(item: EmotionGraphProjectionPointV1): string {
  return 'pointId' in item.point ? item.point.pointId : item.point.candidateId;
}

function sourceStatus(item: EmotionGraphProjectionPointV1): string {
  return item.point.currentness === 'current' ? 'Source available' : `Source ${item.point.currentness}`;
}

function intensityPosition(intensity: string): number {
  const positions: Record<string, number> = {
    'very-low': 206,
    low: 170,
    medium: 134,
    high: 98,
    'very-high': 62,
    unknown: 224,
  };
  return positions[intensity] ?? positions.unknown;
}

function itemSelection(item: EmotionGraphProjectionPointV1): EmotionGraphSelectionV1 {
  const point = item.point;
  return {
    pointId: 'pointId' in point ? point.pointId : point.candidateId,
    positionRefs: point.positionRefs,
    status: point.currentness === 'stale' ? 'stale' : point.currentness === 'unavailable' ? 'unavailable' : 'selected',
  };
}

function isCandidate(point: EmotionGraphPointV1 | EmotionGraphCandidatePointV1): point is EmotionGraphCandidatePointV1 {
  return 'candidateId' in point;
}

export default function EmotionGraph({ projection, onSelectPoint }: EmotionGraphProps): JSX.Element {
  const titleId = useId();
  const descriptionId = useId();
  const [subject, setSubject] = useState<string>('');
  const subjects = useMemo(() => [...new Set(projection.orderedPoints
    .map(({ point }) => point.subjectLabel)
    .filter((value): value is string => Boolean(value)))].sort(), [projection.orderedPoints]);
  const visible = projection.visiblePoints.filter(({ point }) => !subject || point.subjectLabel === subject);
  const select = (item: EmotionGraphProjectionPointV1) => onSelectPoint?.(itemSelection(item));

  return (
    <section className="emotion-graph" aria-labelledby={titleId} aria-describedby={descriptionId} data-testid="emotion-graph">
      <header className="emotion-graph__header">
        <div>
          <h2 id={titleId}>Emotion Graph</h2>
          <p id={descriptionId}>{projection.accessibleSummary.description}</p>
        </div>
        {subjects.length > 0 && (
          <label className="emotion-graph__subject-filter">
            <span>Subject lane</span>
            <select aria-label="Emotion Graph subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option value="">Primary lane</option>
              {subjects.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
      </header>
      {visible.length === 0 ? (
        <p className="emotion-graph__empty" data-testid="emotion-graph-empty">No source-linked emotional points are available for this view.</p>
      ) : (
        <>
          <div className="emotion-graph__visual-wrap">
            <svg className="emotion-graph__visual" viewBox={`0 0 ${Math.max(720, visible.length * 110)} 250`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
              <line x1="30" y1="224" x2={Math.max(690, visible.length * 110)} y2="224" className="emotion-graph__axis" />
              {visible.slice(1).map((item, index) => {
                const previous = visible[index];
                if (!previous) return null;
                return <line key={`line-${pointId(item)}`} x1={40 + index * 100} y1={intensityPosition(previous.point.intensity)} x2={140 + index * 100} y2={intensityPosition(item.point.intensity)} className="emotion-graph__line" />;
              })}
              {visible.map((item, index) => {
                const id = pointId(item);
                return (
                  <g
                    key={id}
                    className={`emotion-graph__point emotion-graph__point--${item.point.lane}`}
                    data-testid="emotion-graph-point"
                    data-point-id={id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.point.lane}: ${item.point.emotionLabel}; intensity ${item.point.intensity}; ${sourceStatus(item)}`}
                    onClick={() => select(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        select(item);
                      }
                    }}
                  >
                    <circle cx={40 + index * 100} cy={intensityPosition(item.point.intensity)} r="10" />
                    <text x={40 + index * 100} y="244" textAnchor="middle">{item.narrativeIndex}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="emotion-graph__legend" aria-label="Emotion Graph lane legend">
            <span>Observed manuscript</span><span>Planned overlay</span><span>Reader effect</span>
          </div>
          <table className="emotion-graph__summary" data-testid="emotion-graph-summary">
            <caption>Ordered source-linked emotional points</caption>
            <thead><tr><th scope="col">Position</th><th scope="col">Lane</th><th scope="col">Subject</th><th scope="col">Emotion</th><th scope="col">Intensity</th><th scope="col">Source</th></tr></thead>
            <tbody>
              {visible.map((item) => {
                const candidate = isCandidate(item.point);
                return <tr key={`summary-${pointId(item)}`}>
                  <td>{item.narrativeIndex}</td><td>{candidate ? 'inferred candidate' : item.point.lane}</td><td>{item.point.subjectLabel ?? 'Unlabeled'}</td><td>{item.point.emotionLabel}</td><td>{item.point.intensity}</td><td>{sourceStatus(item)}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
