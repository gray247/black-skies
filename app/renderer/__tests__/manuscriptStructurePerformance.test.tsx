import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ManuscriptStructureView, type Stage19WritingSpineViewActions, type Stage19WritingSpineViewModel } from '../Stage19WritingSpineView';

function largeStructure() {
  const source = Array.from({ length: 5000 }, (_, index) => `# Section ${index}\nParagraph ${index}\n`).join('\n');
  const proposals = Array.from({ length: 5000 }, (_, index) => ({
    id: `proposal-${index}`,
    label: `Section ${index}`,
    state: 'proposed' as const,
    provenance: 'heading' as const,
    blockIds: [`block-${index}`],
    anchor: {
      schemaVersion: 1 as const,
      anchorKind: 'span' as const,
      selectionStart: index * 32,
      selectionEnd: Math.min(source.length, index * 32 + 24),
      selectionSearchFingerprint: '00000000',
      sourceFingerprint: 'source',
      selectionFingerprint: 'selection',
      prefixLength: 0,
      prefixSearchFingerprint: '00000000',
      prefixFingerprint: 'prefix',
      suffixLength: 0,
      suffixSearchFingerprint: '00000000',
      suffixFingerprint: 'suffix',
    },
    appliedUnitId: null,
    createdAt: '2026-08-22T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  }));
  return {
    availability: 'ready' as const,
    sourceStatus: 'current' as const,
    projectId: 'project-large',
    projectPath: 'C:\\projects\\large',
    sourceText: source,
    document: {
      schemaVersion: 'BlackSkiesManuscriptStructure v1' as const,
      projectId: 'project-large',
      revision: 1,
      source: { fileName: 'large.md', sourceFingerprint: 'source', normalizedLength: source.length, lineEnding: 'lf' as const },
      blocks: [],
      proposals,
    },
    message: null,
  };
}

describe('paginated manuscript Structure rendering', () => {
  it('keeps DOM size bounded for thousands of structural candidates', () => {
    const started = performance.now();
    const actions = {
      setManuscriptStructurePage: vi.fn(),
    } as unknown as Stage19WritingSpineViewActions;
    render(<ManuscriptStructureView
      model={{
        manuscriptStructure: largeStructure(),
        manuscriptStructureLoading: false,
        manuscriptStructureNotice: null,
        manuscriptStructurePage: 0,
        structureBoundaryStart: null,
        structureBoundaryEnd: null,
      } as unknown as Stage19WritingSpineViewModel}
      actions={actions}
    />);
    const disclosure = screen.getByLabelText('Manuscript structure intake');
    fireEvent.click(disclosure.querySelector(':scope > summary')!);
    const elapsed = performance.now() - started;
    expect(document.querySelectorAll('[data-structure-proposal="true"]')).toHaveLength(12);
    expect(document.querySelectorAll('[data-structure-excerpt="true"]')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(elapsed).toBeLessThan(1000);
    expect(screen.queryByText('Paragraph 4999')).not.toBeInTheDocument();
  });
});
