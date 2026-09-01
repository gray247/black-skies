import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { runTimelineV1 } from '../../shared/timeline';
import TimelineReview from '../components/TimelineReview';

const ref = (id: string, order: number) => ({ projectId: 'project-a', sourceKind: 'manuscript' as const, sourceId: id, sourceRevision: 1, sourceFingerprint: id, unitId: id, orderIndex: order, orderBasis: 'manuscript' as const });
function result() { return runTimelineV1({ schemaVersion: 'BlackSkiesTimeline v1', projectId: 'project-a', generation: 1, analysisId: 'timeline-ui', events: [{ eventId: 'event-a', unitId: 'unit-a', label: 'Arrival', orders: { manuscript: 1, 'story-world': 1 }, temporalState: 'certain', positionRefs: [ref('unit-a', 1)] }], pacing: [], pressure: [{ eventId: 'event-a', dimension: 'urgency', band: 'high', positionRefs: [ref('unit-a', 1)] }], sourceRecords: [{ sourceRef: ref('unit-a', 1), sourceClass: 'included', currentness: 'current' }], priorDecisions: [], createdAt: '2026-09-01T12:00:00.000Z' }); }

describe('TimelineReview component', () => {
  it('labels all modules as advisory support and separates pressure dimensions', () => {
    render(<TimelineReview result={result()} />);
    expect(screen.getByRole('heading', { name: 'Timeline review' })).toBeInTheDocument();
    expect(screen.getByText('Support only')).toBeInTheDocument();
    expect(screen.getByText(/No universal score/)).toBeInTheDocument();
    expect(screen.getByText(/urgency: high/)).toBeInTheDocument();
  });

  it('renders an honest empty findings state', () => {
    const empty = { ...result(), chronology: [], pressure: [], findings: [] };
    render(<TimelineReview result={empty} />);
    expect(screen.getByTestId('timeline-review-empty')).toHaveTextContent('No current timeline review opportunities');
  });
});
