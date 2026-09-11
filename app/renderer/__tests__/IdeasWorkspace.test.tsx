import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IDEATION_FIXED_CORE_QUESTIONS, type IdeationBranchPosture, type IdeationSnapshotV1 } from '../../shared/ipc/ideation';
import IdeasWorkspace from '../components/program7/IdeasWorkspace';

function snapshot(overrides: Partial<IdeationSnapshotV1> = {}): IdeationSnapshotV1 {
  return {
    availability: 'ready',
    document: {
      schemaVersion: 'BlackSkiesIdeation v1',
      projectId: 'project-a',
      revision: 3,
      seeds: [],
      branches: [],
      premiseTests: [],
      promotionPackages: [],
      aiAlternatives: [],
      history: [],
    },
    message: null,
    ...overrides,
  };
}

function seed(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    lifecycle: 'active' as const,
    currentVersionId: `${id}-v1`,
    versions: [{ id: `${id}-v1`, title: `Seed ${id}`, body: `Body ${id}`, kind: 'fragment' as const, provenance: { kind: 'author' as const, actor: 'author' as const, capturedAt: '2026-09-11T00:00:00.000Z', sourceReference: null, authorRequested: true }, createdAt: '2026-09-11T00:00:00.000Z', supersededAt: null }],
    tags: ['test'],
    projectReferences: [],
    branchIds: [],
    protected: false,
    pinned: false,
    history: [],
    ...overrides,
  };
}

function branch(id = 'branch-a', posture: IdeationBranchPosture = 'active') {
  return {
    id,
    name: 'The haunted branch',
    posture,
    seedIds: ['seed-a', 'seed-b'],
    sourceContributions: [{ seedId: 'seed-a', importance: 'anchor' as const, classification: 'central' as const, sourceVersionId: 'seed-a-v1', note: 'Focal image' }],
    premiseVersions: [{ id: `${id}-premise-v1`, text: 'A friendship becomes a haunting.', unresolvedAreas: [{ id: 'unknown-a', statement: 'Who is telling the truth?', posture: 'intentional-ambiguity' as const, revisitCondition: 'After the midpoint.' }], provenance: { kind: 'author' as const, actor: 'author' as const, capturedAt: '2026-09-11T00:00:00.000Z', sourceReference: null, authorRequested: true }, createdAt: '2026-09-11T00:00:00.000Z', supersededAt: null }],
    currentPremiseVersionId: `${id}-premise-v1`,
    parentBranchId: 'branch-root',
    lineageBranchIds: ['branch-child'],
    unknowns: [{ id: 'unknown-a', statement: 'Who is telling the truth?', posture: 'intentional-ambiguity' as const, revisitCondition: 'After the midpoint.' }],
    projectReferences: [],
    pinned: false,
    history: [],
  };
}

describe('IdeasWorkspace component', () => {
  it('is manual-first, optional, and exposes an Idea Library with protected redaction', () => {
    const onCaptureSeed = vi.fn();
    render(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-protected', { protected: true })] } })} onCaptureSeed={onCaptureSeed} />);
    expect(screen.getByRole('heading', { name: 'Ideas' })).toBeInTheDocument();
    expect(screen.getByTestId('ideas-optional')).toHaveTextContent('continue writing');
    expect(screen.getByTestId('ideas-workspace')).toHaveAttribute('data-writing-gate', 'false');
    expect(screen.getByRole('heading', { name: 'Idea Library' })).toBeInTheDocument();
    expect(screen.getByTestId('idea-seed-seed-protected')).toHaveTextContent('Content hidden by protection policy.');
    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'A first thought' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Your idea' }), { target: { value: 'A door that remembers.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Capture idea seed' }));
    expect(onCaptureSeed).toHaveBeenCalledWith({ title: 'A first thought', body: 'A door that remembers.', kind: 'fragment', tags: [], protected: false });
  });

  it('shows branch and premise lineage, intentional ambiguity, and explicit archive/restore', () => {
    const onArchiveBranch = vi.fn();
    const onRestoreBranch = vi.fn();
    const branchData = branch();
    const base = snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-b')], branches: [branchData] } });
    const { rerender } = render(<IdeasWorkspace snapshot={base} onArchiveBranch={onArchiveBranch} onRestoreBranch={onRestoreBranch} />);
    const branchCard = screen.getByTestId('idea-branch-branch-a');
    expect(within(branchCard).getByRole('heading', { name: 'Current premise' }).parentElement).toHaveTextContent('A friendship becomes a haunting.');
    expect(within(branchCard).getByText(/intentional ambiguity/)).toBeInTheDocument();
    expect(within(branchCard).getByText('branch-root')).toBeInTheDocument();
    fireEvent.click(within(branchCard).getByRole('button', { name: 'Archive branch' }));
    expect(onArchiveBranch).toHaveBeenCalledWith(branchData);
    rerender(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-b')], branches: [{ ...branchData, posture: 'archived' }] } })} onArchiveBranch={onArchiveBranch} onRestoreBranch={onRestoreBranch} />);
    fireEvent.click(within(screen.getByTestId('idea-branch-branch-a')).getByRole('button', { name: 'Restore branch' }));
    expect(onRestoreBranch).toHaveBeenCalledWith(expect.objectContaining({ id: 'branch-a', posture: 'archived' }));
  });

  it('labels premise tests advisory and preserves source contributions for combinations', () => {
    const onTestPremise = vi.fn();
    const onCombineSeeds = vi.fn();
    const branchData = branch();
    render(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-b')], branches: [branchData] } })} onTestPremise={onTestPremise} onCombineSeeds={onCombineSeeds} />);
    const seedA = screen.getByTestId('idea-seed-seed-a');
    const seedB = screen.getByTestId('idea-seed-seed-b');
    fireEvent.click(within(seedA).getByRole('checkbox'));
    fireEvent.click(within(seedB).getByRole('checkbox'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Combination name' }), { target: { value: 'Combined thread' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Combination premise' }), { target: { value: 'Two images become one premise.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Combine selected seeds' }));
    const branchCard = screen.getByTestId('idea-branch-branch-a');
    fireEvent.change(within(branchCard).getByRole('textbox', { name: IDEATION_FIXED_CORE_QUESTIONS[0].prompt }), { target: { value: 'A witness.' } });
    fireEvent.click(within(branchCard).getByRole('button', { name: 'Run advisory premise test' }));
    expect(onCombineSeeds).toHaveBeenCalledWith(['seed-a', 'seed-b'], 'Combined thread', 'Two images become one premise.', expect.arrayContaining([expect.objectContaining({ seedId: 'seed-a', sourceVersionId: 'seed-a-v1' })]));
    expect(onTestPremise).toHaveBeenCalledWith(branchData, expect.objectContaining({ 'focal-force': 'A witness.' }));
    expect(within(branchCard).getByText(/not canon/)).toBeInTheDocument();
  });

  it('exposes a promotion preview without performing a destination write and reports degraded storage', () => {
    const onPreparePromotion = vi.fn();
    const branchData = branch();
    render(<IdeasWorkspace snapshot={snapshot({ availability: 'degraded', message: 'Ideation storage cannot be read.', document: { ...snapshot().document, branches: [branchData] } })} onPreparePromotion={onPreparePromotion} />);
    const branchCard = screen.getByTestId('idea-branch-branch-a');
    expect(screen.getByRole('alert')).toHaveTextContent('Ideation storage cannot be read.');
    fireEvent.change(within(branchCard).getByRole('combobox', { name: 'Destination' }), { target: { value: 'outline' } });
    fireEvent.click(within(branchCard).getByRole('button', { name: 'Prepare promotion preview' }));
    expect(onPreparePromotion).toHaveBeenCalledWith(branchData, 'outline', 'A friendship becomes a haunting.', ['seed-a', 'seed-b']);
    expect(within(branchCard).getByText(/not a destination write/)).toBeInTheDocument();
  });
});
