import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ManuscriptStructureSnapshotV1 } from '../../shared/ipc/manuscriptStructure';
import {
  ManuscriptStructureView,
  type Stage19WritingSpineViewActions,
  type Stage19WritingSpineViewModel,
} from '../Stage19WritingSpineView';

function anchor(start: number, end: number) {
  return {
    schemaVersion: 1 as const,
    anchorKind: 'span' as const,
    selectionStart: start,
    selectionEnd: end,
    selectionSearchFingerprint: '00000001',
    sourceFingerprint: 'a'.repeat(64),
    selectionFingerprint: 'b'.repeat(64),
    prefixLength: 0,
    prefixSearchFingerprint: '00000000',
    prefixFingerprint: 'c'.repeat(64),
    suffixLength: 0,
    suffixSearchFingerprint: '00000000',
    suffixFingerprint: 'd'.repeat(64),
  };
}

function structure(sourceStatus: ManuscriptStructureSnapshotV1['sourceStatus'] = 'current', includeApplied = true): ManuscriptStructureSnapshotV1 {
  return {
    availability: 'ready',
    sourceStatus,
    projectId: 'project-1',
    projectPath: 'C:/project-1',
    sourceText: '# First\nFirst prose\n# Second\nSecond prose',
    message: null,
    document: {
      schemaVersion: 'BlackSkiesManuscriptStructure v1',
      projectId: 'project-1',
      revision: 4,
      source: { fileName: 'intake.md', sourceFingerprint: 'a'.repeat(64), normalizedLength: 42, lineEnding: 'lf' },
      blocks: [
        { id: 'b1', kind: 'heading', label: 'First', order: 1, anchor: anchor(0, 20) },
        { id: 'b2', kind: 'heading', label: 'Second', order: 2, anchor: anchor(20, 42) },
      ],
      proposals: [
        { id: 'p1', label: 'First', state: 'accepted', provenance: 'heading', blockIds: ['b1'], anchor: anchor(0, 20), appliedUnitId: includeApplied ? 'unit-1' : null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'p2', label: 'Second', state: 'proposed', provenance: 'heading', blockIds: ['b2'], anchor: anchor(20, 42), appliedUnitId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    },
  };
}

function model(value: ManuscriptStructureSnapshotV1, order: readonly string[] | null = null, selected: string | null = 'p2'): Stage19WritingSpineViewModel {
  return {
    manuscriptStructure: value,
    manuscriptStructureLoading: false,
    manuscriptStructureNotice: null,
    manuscriptStructurePage: 0,
    manuscriptStructureOrder: order,
    structureBoundaryStart: null,
    structureBoundaryEnd: null,
    selectedManuscriptProposalId: selected,
  } as Stage19WritingSpineViewModel;
}

function actions(): Stage19WritingSpineViewActions {
  return {
    selectStructureBoundary: vi.fn(),
    stageStructureOrder: vi.fn(),
    saveStructureOrder: vi.fn(),
    cancelStructureOrder: vi.fn(),
    acceptStructureProposal: vi.fn(),
    rejectStructureProposal: vi.fn(),
    renameStructureProposal: vi.fn(),
    pinSelectedStructureBoundary: vi.fn(),
    splitStructureProposal: vi.fn(),
    mergeStructureProposals: vi.fn(),
    selectManuscriptStructureProposal: vi.fn(),
  } as unknown as Stage19WritingSpineViewActions;
}

function renderStructure(value: ManuscriptStructureSnapshotV1, order: readonly string[] | null = null, selected: string | null = 'p2', viewActions: Stage19WritingSpineViewActions = actions()) {
  const result = render(<ManuscriptStructureView model={model(value, order, selected)} actions={viewActions} />);
  const disclosure = screen.getByLabelText('Manuscript structure intake') as HTMLDetailsElement;
  disclosure.open = true;
  return result;
}

describe('ManuscriptStructureView renderer contract', () => {
  it('renders compact rows without source excerpts or repeated structural controls', () => {
    const viewActions = actions();
    renderStructure(structure('current', false), null, 'p2', viewActions);
    const proposals = screen.getByRole('list', { name: 'Structure proposals' });
    const rows = within(proposals).getAllByRole('listitem');

    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByLabelText('Proposal order 1')).toHaveTextContent('1');
    expect(within(rows[0]!).getByText('Accepted')).toBeVisible();
    expect(within(rows[1]!).getByText('Needs decision')).toBeVisible();
    expect(within(rows[0]!).getAllByRole('button')).toHaveLength(1);
    expect(document.querySelector('[data-structure-excerpt="true"]')).toBeNull();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Merge selected' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start boundary' })).not.toBeInTheDocument();
  });

  it('exposes decision and editing controls only for the selected proposal', () => {
    const viewActions = actions();
    renderStructure(structure('current', false), null, 'p2', viewActions);
    const rows = screen.getAllByRole('listitem');
    expect(screen.getByRole('region', { name: 'Selected section controls' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled();
    expect(within(rows[0]!).queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
    expect(within(rows[0]!).queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('More section actions'));
    const split = screen.getByLabelText('Split selected section at');
    fireEvent.change(split, { target: { value: '29' } });
    fireEvent.click(screen.getByRole('button', { name: 'Split section' }));
    expect(viewActions.splitStructureProposal).toHaveBeenCalledWith('p2', 29);
    fireEvent.change(screen.getByLabelText('Section name'), { target: { value: 'Renamed second' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }));
    expect(viewActions.renameStructureProposal).toHaveBeenCalledWith('p2', 'Renamed second');
  });

  it('uses direct adjacent merge actions and stages both reorder directions transactionally', () => {
    const viewActions = actions();
    const rendered = renderStructure(structure('current', false), null, 'p1', viewActions);
    fireEvent.click(screen.getByText('More section actions'));
    fireEvent.click(screen.getByRole('button', { name: 'Merge with next: Second' }));
    expect(viewActions.mergeStructureProposals).toHaveBeenCalledWith(['p1', 'p2']);
    fireEvent.click(screen.getByRole('button', { name: 'Move down' }));
    expect(viewActions.stageStructureOrder).toHaveBeenCalledWith(['p2', 'p1']);

    rendered.rerender(<ManuscriptStructureView model={model(structure('current', false), ['p2', 'p1'], 'p1')} actions={viewActions} />);
    (screen.getByLabelText('Manuscript structure intake') as HTMLDetailsElement).open = true;
    fireEvent.click(screen.getByRole('button', { name: 'Save order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(viewActions.saveStructureOrder).toHaveBeenCalledTimes(1);
    expect(viewActions.cancelStructureOrder).toHaveBeenCalledTimes(1);
    const disclosure = screen.getAllByLabelText('Manuscript structure intake').at(-1)!;
    (disclosure as HTMLDetailsElement).open = false;
    fireEvent(disclosure, new Event('toggle', { bubbles: true }));
    expect(viewActions.cancelStructureOrder).toHaveBeenCalledTimes(2);
    rendered.rerender(<ManuscriptStructureView model={model(structure('current', false), null, 'p2')} actions={viewActions} />);
  });

  it('keeps applied proposals immutable and opens advanced tools as selectors', () => {
    const viewActions = actions();
    renderStructure(structure(), null, 'p1', viewActions);
    expect(within(screen.getByRole('region', { name: 'Selected section controls' })).getByText('Applied')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
    fireEvent.click(screen.getByText('More section actions'));
    expect(screen.getByRole('button', { name: 'Save name' })).toBeDisabled();
    fireEvent.click(screen.getByText('Advanced boundary tools'));
    expect(screen.getByLabelText('Start boundary')).toBeVisible();
    expect(screen.getByLabelText('End boundary')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Set .* boundary/ })).not.toBeInTheDocument();
  });

  it('keeps reversed advanced boundary selections controlled and unpinnable', () => {
    const viewActions = actions();
    const value = structure('current', false);
    render(<ManuscriptStructureView model={{ ...model(value, null, 'p2'), structureBoundaryStart: 42, structureBoundaryEnd: 20 }} actions={viewActions} />);
    (screen.getByLabelText('Manuscript structure intake') as HTMLDetailsElement).open = true;
    fireEvent.click(screen.getByText('More section actions'));
    fireEvent.click(screen.getByText('Advanced boundary tools'));
    expect(screen.getByRole('status')).toHaveTextContent('Choose a valid start before the end');
    expect(screen.getByRole('button', { name: 'Pin boundary' })).toBeDisabled();
    expect(viewActions.pinSelectedStructureBoundary).not.toHaveBeenCalled();
  });

  it('bounds pagination at twelve compact rows', () => {
    const base = structure('current', false);
    const proposals = Array.from({ length: 13 }, (_, index) => ({
      ...base.document.proposals[1]!,
      id: `p-${index + 1}`,
      label: `Section ${index + 1}`,
      anchor: anchor(20, 42),
    }));
    const paginated = { ...base, document: { ...base.document, proposals } };
    renderStructure(paginated, null, 'p-1');
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
  });

  it('does not render nested structure scroll owners', () => {
    renderStructure(structure('current', false));
    const workspace = document.querySelector('.stage19-manuscript-structure__workspace') as HTMLElement;
    const proposals = document.querySelector('.stage19-manuscript-structure__proposals') as HTMLElement;
    expect(workspace).toBeTruthy();
    expect(proposals).toBeTruthy();
    expect(workspace).not.toHaveAttribute('data-structure-source-row');
    expect(proposals.querySelector('[data-structure-source-row="true"]')).toBeNull();
  });
});
