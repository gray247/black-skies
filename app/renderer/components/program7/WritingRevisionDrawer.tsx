import { useEffect, useState } from 'react';

import type { RevisionCandidateV1 } from '../../../shared/ipc/revisionCandidates';

export interface WritingRevisionDrawerProps {
  readonly open: boolean;
  readonly candidate: RevisionCandidateV1 | null;
  readonly onClose?: () => void;
  readonly onSaveEdit?: (candidate: RevisionCandidateV1, editedCandidateText: string) => void;
}

function protectedContent(candidate: RevisionCandidateV1): boolean {
  return candidate.protection.excluded || candidate.protection.class !== 'ordinary';
}

function candidateText(candidate: RevisionCandidateV1): string {
  return candidate.editedCandidateText ?? candidate.candidateText;
}

export default function WritingRevisionDrawer({
  open,
  candidate,
  onClose,
  onSaveEdit,
}: WritingRevisionDrawerProps): JSX.Element | null {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    setEditedText(candidate ? candidateText(candidate) : '');
  }, [candidate?.id, candidate?.updatedAt]);

  if (!open || !candidate) return null;

  const redacted = protectedContent(candidate);
  const originalText = candidateText(candidate);
  const changed = !redacted && editedText !== originalText;

  return (
    <aside
      className="program7-writing-revision-drawer"
      aria-label="Writing revision drawer"
      data-testid="writing-revision-drawer"
      data-dirty={changed ? 'true' : 'false'}
    >
      <header>
        <div>
          <h1>Write revision candidate</h1>
          <p>Editing creates a candidate version only. It does not change the manuscript.</p>
        </div>
        {onClose ? <button type="button" onClick={onClose}>Close drawer</button> : null}
      </header>
      <dl>
        <div><dt>Source unit</dt><dd>{candidate.unitId}</dd></div>
        <div><dt>Origin</dt><dd>{candidate.origin === 'local-ai' ? `Local-AI · ${candidate.provenance.model ?? 'model not recorded'}` : 'Manual author entry'}</dd></div>
        <div><dt>Source status</dt><dd>{candidate.currentness === 'current' ? 'Current source' : `Source ${candidate.currentness}`}</dd></div>
      </dl>
      {redacted ? <p role="alert">Candidate text is hidden by protection policy.</p> : null}
      <section aria-labelledby={`drawer-source-${candidate.id}`}>
        <h2 id={`drawer-source-${candidate.id}`}>Current manuscript text</h2>
        <pre>{redacted ? 'Content hidden by protection policy.' : candidate.sourceSnapshot.text}</pre>
      </section>
      <section aria-labelledby={`drawer-candidate-${candidate.id}`}>
        <h2 id={`drawer-candidate-${candidate.id}`}>Candidate text to edit</h2>
        <textarea
          aria-label="Candidate text to edit"
          value={redacted ? '' : editedText}
          disabled={redacted}
          onChange={(event) => setEditedText(event.target.value)}
        />
      </section>
      <div aria-label="Writing revision drawer actions">
        <button type="button" disabled={redacted || !changed || !onSaveEdit} onClick={() => onSaveEdit?.(candidate, editedText)}>
          Save candidate edit
        </button>
      </div>
      <p>After saving, compare the candidate again. Saving this edit does not accept, reject, park, abandon, or resolve anything.</p>
    </aside>
  );
}
