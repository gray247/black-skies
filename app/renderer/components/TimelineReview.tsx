import { useId } from 'react';

import type { TimelineFindingV1, TimelineRunResultV1 } from '../../shared/timeline';

export interface TimelineReviewProps {
  readonly result: TimelineRunResultV1;
  readonly onAction?: (finding: TimelineFindingV1, action: string) => void;
}

export default function TimelineReview({ result, onAction }: TimelineReviewProps): JSX.Element {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <section className="timeline-review" aria-labelledby={titleId} aria-describedby={descriptionId} data-testid="timeline-review">
      <header className="timeline-review__header">
        <div><h2 id={titleId}>Timeline review</h2><p id={descriptionId}>Advisory chronology, pacing, and pressure support. Review cited sources before owner-governed action.</p></div>
        <span className="timeline-review__posture">Support only</span>
      </header>
      <div className="timeline-review__modules">
        <section aria-labelledby={`${titleId}-chronology`}><h3 id={`${titleId}-chronology`}>Chronology</h3><p>Story-world, manuscript, planning, projection, and reveal orders stay distinct.</p><ol>{result.chronology.map((row) => <li key={row.eventId}><strong>{row.label}</strong><span>{row.temporalState} · manuscript {row.orders.manuscript ?? 'unknown'} · story-world {row.orders['story-world'] ?? 'unknown'}</span></li>)}</ol></section>
        <section aria-labelledby={`${titleId}-pacing`}><h3 id={`${titleId}-pacing`}>Pacing</h3><p>Differences are review opportunities, not automatic defects.</p><ul>{result.pacing.map((item) => <li key={item.unitId}><strong>{item.unitId}</strong><span>{item.direction.replace(/-/g, ' ')}{item.isReviewOpportunity ? ' · review opportunity' : ''}</span></li>)}</ul></section>
        <section aria-labelledby={`${titleId}-pressure`}><h3 id={`${titleId}-pressure`}>Pressure</h3><p>Urgency, consequence, constraint, and conflict remain separate. No universal score.</p><ul>{result.pressure.map((item) => <li key={item.eventId}><strong>{item.eventId}</strong><span>{Object.entries(item.dimensions).map(([dimension, band]) => `${dimension}: ${band}`).join(' · ') || 'No pressure dimensions recorded'}</span></li>)}</ul></section>
      </div>
      <section className="timeline-review__findings" aria-labelledby={`${titleId}-findings`}><h3 id={`${titleId}-findings`}>Review opportunities</h3>{result.findings.length === 0 ? <p data-testid="timeline-review-empty">No current timeline review opportunities are available.</p> : <ul>{result.findings.map((finding) => <li key={finding.findingId}><strong>{finding.summary}</strong><span>{finding.evidenceSummary}</span><div className="timeline-review__actions" aria-label={`Actions for ${finding.summary}`}>{finding.allowedActions.map((action) => <button key={action} type="button" onClick={() => onAction?.(finding, action)}>{action.replace(/-/g, ' ')}</button>)}</div></li>)}</ul>}</section>
    </section>
  );
}
