import { useState } from 'react';

import type {
  RevisionCandidateLifecycle,
  RevisionCandidateV1,
} from '../../../shared/ipc/revisionCandidates';

export interface RevisionComparisonProps {
  readonly candidate: RevisionCandidateV1;
  readonly canAccept?: boolean;
  readonly onAcceptAll?: (candidate: RevisionCandidateV1) => void;
  readonly onPartialAccept?: (candidate: RevisionCandidateV1, selectedText: string) => void;
  readonly onLifecycle?: (candidate: RevisionCandidateV1, lifecycle: Extract<RevisionCandidateLifecycle, 'rejected' | 'parked' | 'abandoned'>) => void;
  readonly onOpenEditor?: (candidate: RevisionCandidateV1) => void;
}

const dispositionActions: readonly Extract<RevisionCandidateLifecycle, 'rejected' | 'parked' | 'abandoned'>[] = [
  'rejected',
  'parked',
  'abandoned',
];

function visibleCandidateText(candidate: RevisionCandidateV1): string {
  return candidate.editedCandidateText ?? candidate.candidateText;
}

function protectedContent(candidate: RevisionCandidateV1): boolean {
  return candidate.protection.excluded || candidate.protection.class !== 'ordinary';
}

function originLabel(candidate: RevisionCandidateV1): string {
  if (candidate.origin === 'local-ai') {
    return candidate.provenance.model ? `Local-AI · ${candidate.provenance.model}` : 'Local-AI';
  }
  return 'Manual author entry';
}

export default function RevisionComparison({
  candidate,
  canAccept = false,
  onAcceptAll,
  onPartialAccept,
  onLifecycle,
  onOpenEditor,
}: RevisionComparisonProps): JSX.Element {
  const [selectedText, setSelectedText] = useState(() => visibleCandidateText(candidate));
  const redacted = protectedContent(candidate);
  const stale = candidate.currentness !== 'current';
  const acceptEnabled = canAccept && !stale;

  return (
    <section className="program7-revision-comparison" aria-labelledby={`revision-comparison-${candidate.id}`} data-testid="revision-comparison">
      <header className="program7-revision-comparison__header">
        <div>
          <h1 id={`revision-comparison-${candidate.id}`}>Compare revision candidate</h1>
          <p>{candidate.purpose}</p>
        </div>
        <span data-testid="revision-comparison-origin">{originLabel(candidate)}</span>
      </header>
      <dl className="program7-revision-comparison__metadata">
        <div><dt>Lifecycle</dt><dd>{candidate.lifecycle}</dd></div>
        <div><dt>Source status</dt><dd>{candidate.currentness === 'current' ? 'Current source' : `Source ${candidate.currentness}`}</dd></div>
        <div><dt>Unit</dt><dd>{candidate.unitId}</dd></div>
        <div><dt>Protection</dt><dd>{redacted ? `Hidden · ${candidate.protection.class}` : 'Ordinary'}</dd></div>
      </dl>
      {stale ? (
        <p role="alert" data-testid="revision-comparison-stale">
          This source is {candidate.currentness}. Recheck the source before accepting any candidate text.
        </p>
      ) : null}
      {candidate.warnings.length > 0 ? (
        <aside className="program7-revision-comparison__warnings" aria-label="Revision warnings">
          <strong>Warnings</strong>
          <ul>{candidate.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </aside>
      ) : null}
      <div className="program7-revision-comparison__panes">
        <article aria-labelledby={`revision-current-${candidate.id}`}>
          <h2 id={`revision-current-${candidate.id}`}>Current manuscript text</h2>
          <p>Read-only source snapshot. It remains separate from the candidate.</p>
          <pre data-testid="revision-current-text">{redacted ? 'Content hidden by protection policy.' : candidate.sourceSnapshot.text}</pre>
        </article>
        <article aria-labelledby={`revision-candidate-${candidate.id}`}>
          <h2 id={`revision-candidate-${candidate.id}`}>Candidate text</h2>
          <p>{candidate.editedCandidateText ? 'Edited candidate; still not manuscript truth.' : 'Candidate; still not manuscript truth.'}</p>
          <pre data-testid="revision-candidate-text">{redacted ? 'Content hidden by protection policy.' : visibleCandidateText(candidate)}</pre>
        </article>
      </div>
      <div className="program7-revision-comparison__partial">
        <label htmlFor={`revision-partial-${candidate.id}`}>Text to accept for partial acceptance</label>
        <textarea
          id={`revision-partial-${candidate.id}`}
          aria-label="Text to accept for partial acceptance"
          value={redacted ? '' : selectedText}
          disabled={redacted}
          onChange={(event) => setSelectedText(event.target.value)}
          placeholder={redacted ? 'Hidden by protection policy.' : 'Select or type only the candidate text you intend to accept.'}
        />
      </div>
      <div className="program7-revision-comparison__actions" aria-label="Revision candidate actions">
        {onOpenEditor ? <button type="button" onClick={() => onOpenEditor(candidate)}>Edit candidate</button> : null}
        <button type="button" disabled={!acceptEnabled || !onAcceptAll} onClick={() => onAcceptAll?.(candidate)}>
          Accept all candidate text
        </button>
        <button type="button" disabled={!acceptEnabled || !onPartialAccept || selectedText.length === 0} onClick={() => onPartialAccept?.(candidate, selectedText)}>
          Accept selected text only
        </button>
        {onLifecycle ? dispositionActions.map((lifecycle) => (
          <button key={lifecycle} type="button" onClick={() => onLifecycle(candidate, lifecycle)}>
            {lifecycle === 'rejected' ? 'Reject' : lifecycle === 'parked' ? 'Park' : 'Abandon'} candidate
          </button>
        )) : null}
      </div>
      <p className="program7-revision-comparison__note">Accepting a candidate requires an explicit destination-owner action. No button here silently resolves the revision item.</p>
    </section>
  );
}
