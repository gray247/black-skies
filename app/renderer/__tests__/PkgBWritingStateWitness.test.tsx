import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import DraftEditor from '../DraftEditor';
import WorkspaceHeader from '../components/WorkspaceHeader';

function ActiveWritingShellHarness(): JSX.Element {
  const [draft, setDraft] = useState('# Scene One');
  const hasLocalEdit = draft !== '# Scene One';
  const draftSessionStateLabel = hasLocalEdit ? 'persisted, dirty, unsaved' : 'persisted';

  return (
    <div data-testid="pkg-b-writing-shell">
      <WorkspaceHeader
        projectLabel="Witness Project"
        draftSessionStateLabel={draftSessionStateLabel}
        serviceStatus="online"
        serviceReason="online"
        onRetry={vi.fn().mockResolvedValue(undefined)}
        onToggleCompanion={vi.fn()}
        onGenerate={vi.fn()}
        onCritique={vi.fn()}
        onExport={vi.fn()}
        exportFormat="md"
        onExportFormatChange={vi.fn()}
        generationScope="active-scene"
        generationScopeCount={1}
        onGenerationScopeChange={vi.fn()}
        onSnapshot={vi.fn()}
        onVerify={vi.fn()}
        onSnapshots={vi.fn()}
        companionOpen={false}
        disableCompanion={false}
        disableGenerate={false}
        disableCritique={false}
        disableExport={false}
        disableSnapshot={false}
        disableVerify={false}
        disableSnapshots={false}
        showSnapshotsPanel={false}
        serviceOffline={false}
      />
      <button type="button" onClick={() => setDraft('# Scene One\n\nEdited locally.')}>
        Apply local edit
      </button>
      <DraftEditor value={draft} onChange={setDraft} />
    </div>
  );
}

describe('PKG-B active writing save-state witness', () => {
  it('keeps workflow controls visible after a local edit while surfacing active-writing save-state truth', () => {
    render(<ActiveWritingShellHarness />);

    fireEvent.click(screen.getByRole('button', { name: /apply local edit/i }));

    expect(
      screen.getByRole('button', { name: /Backend services ready/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Generate active scene/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Create snapshot/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Draft editor/i })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /Active draft state/i })).toHaveTextContent(
      'Draft/session state: persisted, dirty, unsaved',
    );

    const shellText = screen.getByTestId('pkg-b-writing-shell').textContent ?? '';
    expect(shellText).toMatch(/Draft\/session state:/i);
    expect(shellText).toMatch(/\bpersisted\b/i);
    expect(shellText).toMatch(/\bdirty\b/i);
    expect(shellText).toContain('unsaved');
    expect(shellText).not.toMatch(/Signal classification:/i);
    expect(shellText).not.toMatch(/\bstale\b/i);
    expect(shellText).not.toMatch(/recovery-required/i);
  });
});
