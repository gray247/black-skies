import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
        { id: 'p2', label: 'Second', state: 'accepted', provenance: 'heading', blockIds: ['b2'], anchor: anchor(20, 42), appliedUnitId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    },
  };
}

function model(value: ManuscriptStructureSnapshotV1, order: readonly string[] | null = null): Stage19WritingSpineViewModel {
  return {
    manuscriptStructure: value,
    manuscriptStructureLoading: false,
    manuscriptStructureNotice: null,
    manuscriptStructurePage: 0,
    manuscriptStructureOrder: order,
    structureBoundaryStart: null,
    structureBoundaryEnd: null,
  } as Stage19WritingSpineViewModel;
}

function actions(): Stage19WritingSpineViewActions {
  return {
    selectStructureBoundary: vi.fn(),
    stageStructureOrder: vi.fn(),
    saveStructureOrder: vi.fn(),
    cancelStructureOrder: vi.fn(),
  } as unknown as Stage19WritingSpineViewActions;
}

describe('ManuscriptStructureView renderer contract', () => {
  it('exposes bounded source boundaries and stages proposal-sidecar reorder only', () => {
    const viewActions = actions();
    const { rerender } = render(<ManuscriptStructureView model={model(structure('current', false))} actions={viewActions} />);
    const proposals = screen.getByRole('list', { name: 'Structure proposals' });

    fireEvent.click(within(proposals).getAllByRole('button', { name: 'Start boundary' })[1]!);
    fireEvent.click(within(proposals).getAllByRole('button', { name: 'End boundary' })[1]!);
    expect(viewActions.selectStructureBoundary).toHaveBeenNthCalledWith(1, 20, 'start');
    expect(viewActions.selectStructureBoundary).toHaveBeenNthCalledWith(2, 42, 'end');

    fireEvent.click(within(proposals).getAllByRole('button', { name: 'Move up' })[1]!);
    expect(viewActions.stageStructureOrder).toHaveBeenCalledWith(['p2', 'p1']);
    rerender(<ManuscriptStructureView model={model(structure(), ['p2', 'p1'])} actions={viewActions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save order' }));
    expect(viewActions.saveStructureOrder).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(viewActions.cancelStructureOrder).toHaveBeenCalledTimes(1);
  });

  it('keeps applied proposals immutable while allowing later accepted proposals to apply', () => {
    const viewActions = actions();
    const { rerender } = render(<ManuscriptStructureView model={model(structure())} actions={viewActions} />);
    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]!).getByText(/Applied/)).toHaveTextContent('Applied');
    expect(within(rows[0]!).getByRole('button', { name: 'Accept' })).toBeDisabled();
    expect(within(rows[0]!).getByRole('button', { name: 'Save name' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply accepted structure to Units' })).toBeEnabled();

    const changed = structure('changed-after-apply');
    rerender(<ManuscriptStructureView model={model(changed)} actions={viewActions} />);
    expect(screen.getByRole('button', { name: 'Rediscover' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply accepted structure to Units' })).toBeDisabled();
    rerender(<ManuscriptStructureView model={model(structure())} actions={viewActions} />);
  });
});
