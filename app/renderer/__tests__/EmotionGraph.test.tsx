import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { createEmotionGraphProjection, type EmotionGraphPointV1 } from '../../shared/emotionGraph';
import EmotionGraph from '../components/EmotionGraph';

const point = (pointId: string, lane: EmotionGraphPointV1['lane'], subjectLabel: string | undefined, orderIndex: number): EmotionGraphPointV1 => ({
  schemaVersion: 'BlackSkiesEmotionGraph v1',
  pointId,
  projectId: 'project-a',
  lane,
  emotionLabel: lane === 'planned' ? 'guarded' : 'relieved',
  intensity: lane === 'planned' ? 'high' : 'medium',
  subjectLabel,
  positionRefs: [{
    projectId: 'project-a',
    sourceKind: lane === 'planned' ? 'outline' : 'manuscript',
    sourceId: `${pointId}-source`,
    sourceRevision: 1,
    sourceFingerprint: `${pointId}-fingerprint`,
    unitId: `unit-${subjectLabel ?? 'unlabeled'}`,
    orderIndex,
    orderBasis: lane === 'planned' ? 'planning' : 'manuscript',
  }],
  sourceOwner: lane === 'planned' ? 'Author Intent / Story Setup' : 'Narrative Insertion / Assertion',
  provenance: {
    sourceOwner: lane === 'planned' ? 'Author Intent / Story Setup' : 'Narrative Insertion / Assertion',
    origin: 'author',
    visibility: 'metadata-only',
    citationRequired: true,
    protectionClass: 'included',
  },
  currentness: 'current',
  createdAt: '2026-08-31T12:00:00.000Z',
  updatedAt: '2026-08-31T12:00:00.000Z',
  ...(subjectLabel === undefined ? {} : { subjectLabel }),
});

describe('EmotionGraph component', () => {
  it('renders an accessible graph and ordered text-equivalent summary', () => {
    const projection = createEmotionGraphProjection('project-a', [
      point('observed-a', 'observed', 'A', 1),
      point('planned-a', 'planned', 'A', 1),
    ]);
    render(<EmotionGraph projection={projection} />);
    expect(screen.getByRole('heading', { name: 'Emotion Graph' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Emotion Graph/ })).toBeInTheDocument();
    expect(screen.getByTestId('emotion-graph-summary')).toBeInTheDocument();
    expect(screen.getByText('observed')).toBeInTheDocument();
    expect(screen.getByText('planned')).toBeInTheDocument();
  });

  it('supports keyboard selection and reports honest stale/unavailable statuses', () => {
    const onSelectPoint = vi.fn();
    const projection = createEmotionGraphProjection('project-a', [point('observed-a', 'observed', 'A', 1)]);
    render(<EmotionGraph projection={projection} onSelectPoint={onSelectPoint} />);
    const graphPoint = screen.getByTestId('emotion-graph-point');
    fireEvent.keyDown(graphPoint, { key: 'Enter' });
    expect(onSelectPoint).toHaveBeenCalledWith(expect.objectContaining({ pointId: 'observed-a', status: 'selected' }));
    fireEvent.keyDown(graphPoint, { key: ' ' });
    expect(onSelectPoint).toHaveBeenCalledTimes(2);

    const stale = createEmotionGraphProjection('project-a', [{ ...point('stale', 'observed', 'A', 1), currentness: 'stale' }]);
    const staleSelect = vi.fn();
    render(<EmotionGraph projection={stale} onSelectPoint={staleSelect} />);
    fireEvent.click(screen.getAllByTestId('emotion-graph-point')[1]);
    expect(staleSelect).toHaveBeenCalledWith(expect.objectContaining({ status: 'stale' }));
  });

  it('filters to one subject lane and exposes an honest empty state', () => {
    const projection = createEmotionGraphProjection('project-a', [
      point('observed-a', 'observed', 'A', 1),
      point('observed-b', 'observed', 'B', 2),
    ], [], { multipleSubjects: true });
    render(<EmotionGraph projection={projection} />);
    expect(screen.getByRole('option', { name: 'All subjects' })).toBeInTheDocument();
    expect(screen.getByLabelText('Emotion Graph subject')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Emotion Graph subject'), { target: { value: 'B' } });
    expect(screen.getByText('relieved')).toBeInTheDocument();
    expect(screen.getAllByTestId('emotion-graph-point')).toHaveLength(1);

    const empty = createEmotionGraphProjection('project-a', []);
    render(<EmotionGraph projection={empty} />);
    expect(screen.getByTestId('emotion-graph-empty')).toHaveTextContent('No source-linked emotional points');
  });

  it('shows one subject as context without rendering a misleading selector', () => {
    const projection = createEmotionGraphProjection('project-a', [
      point('observed-a', 'observed', 'protagonist', 1),
      point('planned-a', 'planned', 'protagonist', 1),
    ], [], { multipleSubjects: true });
    render(<EmotionGraph projection={projection} />);

    expect(screen.getByText('Subject: protagonist')).toBeInTheDocument();
    expect(screen.queryByLabelText('Emotion Graph subject')).not.toBeInTheDocument();
  });

  it('does not invent subject context when points have no labelled subject', () => {
    const projection = createEmotionGraphProjection('project-a', [
      point('observed-unlabeled', 'observed', undefined, 1),
    ], [], { multipleSubjects: true });
    render(<EmotionGraph projection={projection} />);

    expect(screen.queryByText(/^Subject:/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Emotion Graph subject')).not.toBeInTheDocument();
    expect(screen.getByText('Unlabeled')).toBeInTheDocument();
  });

  it('uses token-driven non-color distinctions and reduced-motion CSS', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../styles/app.css'), 'utf8');
    expect(css).toContain('.emotion-graph__point--planned circle');
    expect(css).toContain('stroke-dasharray');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('color: var(--stage19-semantic-text)');
    expect(css).toContain('border: 1px solid var(--stage19-semantic-border)');
  });
});
