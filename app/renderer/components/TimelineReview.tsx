import { useId } from 'react';

import type {
  TimelineAllowedActionV1,
  TimelineFindingV1,
  TimelineRunResultV1,
} from '../../shared/timeline';

export interface TimelineReviewProps {
  readonly result: TimelineRunResultV1;
  readonly unitTitles?: Readonly<Record<string, string>>;
  readonly onAction?: (finding: TimelineFindingV1, action: TimelineAllowedActionV1) => void;
  readonly onSourceReturn?: (source: TimelineRunResultV1['chronology'][number]['positionRefs'][number]) => void;
}

export default function TimelineReview({ result, unitTitles, onAction, onSourceReturn }: TimelineReviewProps): JSX.Element {
  const titleId = useId();
  const descriptionId = useId();
  const titleForUnit = (unitId: string): string => unitTitles?.[unitId] ?? unitId;
  const titleForEvent = (eventId: string): string => titleForUnit(result.chronology.find((event) => event.eventId === eventId)?.unitId ?? eventId);
  return (
    <section className="timeline-review" aria-labelledby={titleId} aria-describedby={descriptionId} data-testid="timeline-review">
      <header className="timeline-review__header">
        <div><h2 id={titleId}>Timeline</h2><p id={descriptionId}>See when events happen in the story and where they appear in the manuscript. Review a source before making changes.</p></div>
        <span className="timeline-review__posture">For review only</span>
      </header>
      <div className="timeline-review__modules">
        <section aria-labelledby={`${titleId}-chronology`}><h3 id={`${titleId}-chronology`}>Story order</h3><p>Story order is when events happen; manuscript order is where you wrote them. They may differ.</p>{result.chronology.length === 0 ? <p>No story events have been recorded yet.</p> : <ol>{result.chronology.map((row) => <li key={row.eventId}><strong>{row.label}</strong><span>{row.temporalState} · manuscript {row.orders.manuscript ?? 'unknown'} · story order {row.orders['story-world'] ?? 'unknown'}</span>{row.positionRefs[0] ? <button type="button" onClick={() => onSourceReturn?.(row.positionRefs[0]!)}>Review source</button> : null}</li>)}</ol>}</section>
        <section aria-labelledby={`${titleId}-pacing`}><h3 id={`${titleId}-pacing`}>Pacing</h3><p>Differences are places you may want to review, not automatic problems.</p><ul>{result.pacing.map((item) => <li key={item.unitId}><strong>{titleForUnit(item.unitId)}</strong><span>{item.direction === 'unknown' ? 'Not enough information to compare length' : item.direction.replace(/-/g, ' ')}{item.isReviewOpportunity ? ' · review opportunity' : ''}</span></li>)}</ul></section>
        <section aria-labelledby={`${titleId}-pressure`}><h3 id={`${titleId}-pressure`}>Story pressure</h3><p>Urgency, consequence, constraint, and conflict stay separate. This does not grade the story’s overall tension.</p><ul>{result.pressure.map((item) => <li key={item.eventId}><strong>{titleForEvent(item.eventId)}</strong><span>{Object.entries(item.dimensions).map(([dimension, band]) => `${dimension}: ${band}`).join(' · ') || 'No sources of tension recorded'}</span></li>)}</ul></section>
      </div>
      <section className="timeline-review__findings" aria-labelledby={`${titleId}-findings`}><h3 id={`${titleId}-findings`}>Review opportunities</h3>{result.findings.length === 0 ? <p data-testid="timeline-review-empty">No current timeline review opportunities are available.</p> : <ul>{result.findings.map((finding) => <li key={finding.findingId}><strong>{finding.summary}</strong><span>{finding.evidenceSummary}</span><div className="timeline-review__actions" aria-label={`Actions for ${finding.summary}`}>{finding.allowedActions.map((action) => <button key={action} type="button" onClick={() => onAction?.(finding, action)}>{action.replace(/-/g, ' ')}</button>)}</div></li>)}</ul>}</section>
    </section>
  );
}
