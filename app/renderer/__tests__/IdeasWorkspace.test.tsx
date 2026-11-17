import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IDEATION_FIXED_CORE_QUESTIONS, type IdeationBranchPosture, type IdeationSnapshotV1 } from '../../shared/ipc/ideation';
import IdeasWorkspace, { type IdeasUnfinishedWork } from '../components/program7/IdeasWorkspace';

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
  it('withholds an old destination preview while a fresh preview is still being saved', async () => {
    const direction = branch();
    const prepared = { id: 'old-preview', branchId: direction.id, seedIds: direction.seedIds, destination: 'author-intent' as const,
      selectedText: direction.premiseVersions[0]!.text, selectedTextSha256: 'a'.repeat(64), sourceContributions: [], preparedAt: '2026-11-17T00:00:00Z',
      provenance: { kind: 'author' as const, actor: 'author' as const, capturedAt: '2026-11-17T00:00:00Z', sourceReference: ':premise=branch-a-premise-v1:', authorRequested: true }, status: 'prepared' as const };
    const data = snapshot({ document: { ...snapshot().document, branches: [direction], promotionPackages: [prepared] } });
    let finish!: () => void;
    const pending = new Promise<void>(resolve => { finish = resolve; });
    const prepare = vi.fn(() => pending), route = vi.fn();
    render(<IdeasWorkspace snapshot={data} onPreparePromotion={prepare} onRoutePromotion={route} />);
    const send = screen.getByRole('button', { name: 'Send to Story Foundation' });
    expect(send).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Preview destination' }));
    expect(send).toBeDisabled();
    fireEvent.click(send);
    expect(route).not.toHaveBeenCalled();
    await act(async () => { finish(); await pending; });
    await waitFor(() => expect(send).toBeEnabled());
    fireEvent.click(send);
    expect(route).toHaveBeenCalledOnce();
  });

  it('retains unfinished seed/direction fields by project/path and leaves a different project blank', () => {
    const memory = new Map<string, IdeasUnfinishedWork>();
    const a = render(<IdeasWorkspace snapshot={snapshot()} draftKey="a:path-a" draftMemory={memory} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Your idea' }), { target: { value: 'The forest grows a door.' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Direction name' }), { target: { value: 'Duplicate name' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Core idea for this direction' }), { target: { value: 'Unfinished direction.' } });
    a.unmount();
    const b = render(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, projectId: 'project-b' } })} draftKey="b:path-b" draftMemory={memory} />);
    expect(screen.getByRole('textbox', { name: 'Your idea' })).toHaveValue('');
    b.unmount();
    render(<IdeasWorkspace snapshot={snapshot()} draftKey="a:path-a" draftMemory={memory} />);
    expect(screen.getByRole('textbox', { name: 'Your idea' })).toHaveValue('The forest grows a door.');
    expect(screen.getByRole('textbox', { name: 'Direction name' })).toHaveValue('Duplicate name');
    expect(screen.getByRole('textbox', { name: 'Core idea for this direction' })).toHaveValue('Unfinished direction.');
  });

  it('explains the saved idea requirement instead of sending an empty-source direction', () => {
    const onCreateBranch = vi.fn();
    const { rerender } = render(<IdeasWorkspace snapshot={snapshot()} onCreateBranch={onCreateBranch} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Direction name' }), { target: { value: 'Native handoff check' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Core idea for this direction' }), { target: { value: 'An invitation draws a wary visitor back to an old house.' } });
    const create = screen.getByRole('button', { name: 'Create direction' });
    expect(create).toBeDisabled();
    expect(create).toHaveAccessibleDescription('Save an idea, then select it under Saved ideas before creating a direction.');
    fireEvent.click(create);
    expect(onCreateBranch).not.toHaveBeenCalled();

    rerender(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-private', { protected: true })] } })} onCreateBranch={onCreateBranch} />);
    expect(create).toBeDisabled();
    expect(create).toHaveAccessibleDescription('Select at least one saved idea under Saved ideas to create a direction.');
    expect(within(screen.getByTestId('idea-seed-seed-private')).getByRole('checkbox')).toBeDisabled();
    fireEvent.click(within(screen.getByTestId('idea-seed-seed-a')).getByRole('checkbox'));
    expect(create).toBeEnabled();
    fireEvent.click(create);
    expect(onCreateBranch).toHaveBeenCalledOnce();
    expect(onCreateBranch).toHaveBeenCalledWith('Native handoff check', 'An invitation draws a wary visitor back to an old house.', ['seed-a'], []);
  });

  it('offers a possible next step when every saved idea is private', () => {
    render(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-private', { protected: true })] } })} onCreateBranch={vi.fn()} />);
    expect(within(screen.getByTestId('idea-seed-seed-private')).getByRole('checkbox')).toBeDisabled();
    const create = screen.getByRole('button', { name: 'Create direction' });
    expect(create).toBeDisabled();
    expect(create).toHaveAccessibleDescription('Save a new idea without marking its text private, then select it under Saved ideas to create a direction.');
  });

  it('explains missing direction fields and does not create until both are supplied', () => {
    const onCreateBranch = vi.fn();
    render(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a')] } })} onCreateBranch={onCreateBranch} />);
    fireEvent.click(within(screen.getByTestId('idea-seed-seed-a')).getByRole('checkbox'));
    const create = screen.getByRole('button', { name: 'Create direction' });
    expect(create).toBeDisabled();
    expect(create).toHaveAccessibleDescription('Add a direction name before creating it.');
    fireEvent.change(screen.getByRole('textbox', { name: 'Direction name' }), { target: { value: '  ' } });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Direction name' }), { target: { value: 'The invitation' } });
    expect(create).toBeDisabled();
    expect(create).toHaveAccessibleDescription('Add the core idea for this direction before creating it.');
    fireEvent.change(screen.getByRole('textbox', { name: 'Core idea for this direction' }), { target: { value: '  ' } });
    expect(create).toBeDisabled();
    fireEvent.click(create);
    expect(onCreateBranch).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Core idea for this direction' }), { target: { value: 'A visitor returns.' } });
    expect(create).toBeEnabled();
    fireEvent.click(create);
    expect(onCreateBranch).toHaveBeenCalledWith('The invitation', 'A visitor returns.', ['seed-a'], []);
  });
  it('is manual-first, optional, and exposes an Idea Library with protected redaction', () => {
    const onCaptureSeed = vi.fn();
    render(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-protected', { protected: true })] } })} onCaptureSeed={onCaptureSeed} />);
    expect(screen.getByRole('heading', { name: 'Ideas' })).toBeInTheDocument();
    expect(screen.getByTestId('ideas-optional')).toHaveTextContent('continue writing');
    expect(screen.getByTestId('ideas-workspace')).toHaveAttribute('data-writing-gate', 'false');
    expect(screen.getByRole('heading', { name: 'Saved ideas' })).toBeInTheDocument();
    expect(screen.getByText('Save ideas in your own words. They stay separate from the manuscript unless you choose to use them.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Core idea for this direction' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Questions you want to leave open, one per line' })).toBeInTheDocument();
    expect(screen.getByTestId('idea-seed-seed-protected')).toHaveTextContent('Content hidden by protection policy.');
    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'A first thought' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Your idea' }), { target: { value: 'A door that remembers.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save idea' }));
    expect(onCaptureSeed).toHaveBeenCalledWith({ title: 'A first thought', body: 'A door that remembers.', kind: 'fragment', tags: [], protected: false });
  });

  it('clears unsaved idea fields and selections when the project changes', () => {
    const first = snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a')] } });
    const { rerender } = render(<IdeasWorkspace snapshot={first} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'Project A idea' } });
    fireEvent.click(within(screen.getByTestId('idea-seed-seed-a')).getByRole('checkbox'));
    rerender(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, projectId: 'project-b', seeds: [] } })} />);
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');
    expect(screen.getByText(/0 ideas selected/)).toBeInTheDocument();
  });

  it('shows related directions, intentional ambiguity, and explicit archive/restore', () => {
    const onArchiveBranch = vi.fn();
    const onRestoreBranch = vi.fn();
    const branchData = branch();
    const base = snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-b')], branches: [branchData] } });
    const { rerender } = render(<IdeasWorkspace snapshot={base} onArchiveBranch={onArchiveBranch} onRestoreBranch={onRestoreBranch} />);
    const branchCard = screen.getByTestId('idea-branch-branch-a');
    expect(within(branchCard).getByRole('heading', { name: 'Current idea' }).parentElement).toHaveTextContent('A friendship becomes a haunting.');
    expect(within(branchCard).getByText('Left open')).toBeInTheDocument();
    expect(within(branchCard).getByText('The haunted branch')).toBeInTheDocument();
    expect(within(branchCard).getByText('Saved direction')).toBeInTheDocument();
    expect(within(branchCard).getByText('Seed seed-a, Seed seed-b')).toBeInTheDocument();
    fireEvent.click(within(branchCard).getByRole('button', { name: 'Archive direction' }));
    expect(onArchiveBranch).toHaveBeenCalledWith(branchData);
    rerender(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-b')], branches: [{ ...branchData, posture: 'archived' }] } })} onArchiveBranch={onArchiveBranch} onRestoreBranch={onRestoreBranch} />);
    fireEvent.click(within(screen.getByTestId('idea-branch-branch-a')).getByRole('button', { name: 'Restore direction' }));
    expect(onRestoreBranch).toHaveBeenCalledWith(expect.objectContaining({ id: 'branch-a', posture: 'archived' }));
  });

  it('labels premise exploration clearly and preserves source contributions for combinations', () => {
    const onTestPremise = vi.fn();
    const onCombineSeeds = vi.fn();
    const branchData = branch();
    render(<IdeasWorkspace snapshot={snapshot({ document: { ...snapshot().document, seeds: [seed('seed-a'), seed('seed-b')], branches: [branchData] } })} onTestPremise={onTestPremise} onCombineSeeds={onCombineSeeds} />);
    const seedA = screen.getByTestId('idea-seed-seed-a');
    const seedB = screen.getByTestId('idea-seed-seed-b');
    fireEvent.click(within(seedA).getByRole('checkbox'));
    fireEvent.click(within(seedB).getByRole('checkbox'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Combination name' }), { target: { value: 'Combined thread' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Combined idea' }), { target: { value: 'Two images become one premise.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Combine selected ideas' }));
    const branchCard = screen.getByTestId('idea-branch-branch-a');
    fireEvent.change(within(branchCard).getByRole('textbox', { name: IDEATION_FIXED_CORE_QUESTIONS[0].prompt }), { target: { value: 'A witness.' } });
    fireEvent.click(within(branchCard).getByRole('button', { name: 'Save exploration notes' }));
    expect(onCombineSeeds).toHaveBeenCalledWith(['seed-a', 'seed-b'], 'Combined thread', 'Two images become one premise.', expect.arrayContaining([expect.objectContaining({ seedId: 'seed-a', sourceVersionId: 'seed-a-v1' })]));
    expect(onTestPremise).toHaveBeenCalledWith(branchData, expect.objectContaining({ 'focal-force': 'A witness.' }));
    expect(within(branchCard).getByText(/do not change the manuscript/)).toBeInTheDocument();
  });

  it('exposes a promotion preview without performing a destination write and reports degraded storage', () => {
    const onPreparePromotion = vi.fn();
    const branchData = branch();
    render(<IdeasWorkspace snapshot={snapshot({ availability: 'degraded', message: 'Ideation storage cannot be read.', document: { ...snapshot().document, branches: [branchData] } })} onPreparePromotion={onPreparePromotion} />);
    const branchCard = screen.getByTestId('idea-branch-branch-a');
    expect(screen.getByRole('alert')).toHaveTextContent('Ideation storage cannot be read.');
    fireEvent.change(within(branchCard).getByRole('combobox', { name: 'Send to' }), { target: { value: 'outline' } });
    fireEvent.click(within(branchCard).getByRole('button', { name: 'Preview destination' }));
    expect(onPreparePromotion).toHaveBeenCalledWith(branchData, 'outline', 'A friendship becomes a haunting.', ['seed-a', 'seed-b']);
    expect(within(branchCard).getByText(/before anything is copied/)).toBeInTheDocument();
  });
});
