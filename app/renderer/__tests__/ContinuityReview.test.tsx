import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { runContinuityV1, type ContinuityFindingV1 } from '../../shared/continuity';
import ContinuityReview from '../components/ContinuityReview';

function finding(): ContinuityFindingV1 {
  const ref = {
    projectId: 'project-a' as const,
    sourceKind: 'assertion' as const,
    sourceId: 'fact-one',
    sourceRevision: 1,
    sourceFingerprint: 'fingerprint-fact-one',
    unitId: 'unit-a',
    orderIndex: 1,
    orderBasis: 'story-world' as const,
  };
  return runContinuityV1({
    schemaVersion: 'BlackSkiesContinuity v1', projectId: 'project-a', generation: 1, analysisId: 'review-1',
    projectPovExpectation: 'close-third',
    units: [{ unitId: 'unit-a', explicitPovMetadata: 'first-person', interpretationState: 'ordinary', positionRefs: [ref] }],
    facts: [], events: [], carryoverRequirements: [], causalDependencies: [],
    sourceRecords: [{ sourceRef: ref, sourceClass: 'included', currentness: 'current' }], priorDecisions: [], createdAt: '2026-09-01T12:00:00.000Z',
  }).findings[0]!;
}

describe('ContinuityReview component', () => {
  it('exposes candidate-only semantics, exact refs, source status, and owner-routed actions', () => {
    const onAction = vi.fn();
    render(<ContinuityReview findings={[finding()]} onAction={onAction} />);
    expect(screen.getByRole('heading', { name: 'Continuity review' })).toBeInTheDocument();
    expect(screen.getByText('Candidate only')).toBeInTheDocument();
    expect(screen.getByText('Refs: unit/unit-a')).toBeInTheDocument();
    expect(screen.getByText('Source available')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'return to source' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ category: 'drift' }), 'return-to-source');
  });

  it('renders an honest empty state and retains non-color, overflow, and reduced-motion styling', () => {
    render(<ContinuityReview findings={[]} />);
    expect(screen.getByTestId('continuity-review-empty')).toHaveTextContent('No current structured continuity findings');
    const css = readFileSync(resolve(import.meta.dirname, '../styles/app.css'), 'utf8');
    expect(css).toContain('.continuity-review__actions button:focus-visible');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
