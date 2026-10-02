/// <reference lib="es2022.intl" />

import { useEffect, useState } from 'react';

import type {
  RevisionCandidateLifecycle,
  RevisionCandidateV1,
} from '../../../shared/ipc/revisionCandidates';

export interface RevisionComparisonProps {
  readonly candidate: RevisionCandidateV1;
  readonly canAccept?: boolean;
  readonly onAcceptAll?: (candidate: RevisionCandidateV1) => void;
  readonly onPartialAccept?: (
    candidate: RevisionCandidateV1,
    selection: { readonly text: string; readonly start: number; readonly end: number },
  ) => void;
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

function sourceStatus(candidate: RevisionCandidateV1): string {
  if (candidate.lifecycle === 'accepted' || candidate.lifecycle === 'partially accepted') {
    return 'This alternative was applied. The saved source passage below shows the earlier wording.';
  }
  if (candidate.currentness === 'stale') return 'This alternative was created from an older version of the passage.';
  if (candidate.currentness === 'unavailable') return 'The original passage is no longer available.';
  if (!candidate.sourceAnchor) return 'This alternative uses the current saved section, but was not linked to selected words.';
  return 'This alternative is linked to the current saved passage.';
}

function lifecycleLabel(candidate: RevisionCandidateV1): string {
  switch (candidate.lifecycle) {
    case 'generated': return 'Draft';
    case 'reviewing': return 'Ready to review';
    case 'parked': return 'Set aside';
    case 'accepted': return 'Applied';
    case 'partially accepted': return 'Partly applied';
    case 'rejected': return 'Not used';
    case 'abandoned': return 'Stopped';
    case 'stale': return 'Needs a fresh alternative';
    default: return 'Unavailable';
  }
}

function graphemeBoundaries(text: string): number[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return [0, ...Array.from(segmenter.segment(text), (part) => part.index), text.length].filter((value, index, values) => index === 0 || value !== values[index - 1]);
}

function moveCaret(text: string, position: number, direction: -1 | 1, byLine: boolean): number {
  if (!byLine) {
    const boundaries = graphemeBoundaries(text);
    if (direction < 0) return [...boundaries].reverse().find((boundary) => boundary < position) ?? 0;
    return boundaries.find((boundary) => boundary > position) ?? text.length;
  }
  const lineStart = position === 0 ? 0 : text.lastIndexOf('\n', position - 1) + 1;
  const lineEndIndex = text.indexOf('\n', position);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  return direction < 0 ? lineStart : lineEnd;
}

export default function RevisionComparison({
  candidate,
  canAccept = false,
  onAcceptAll,
  onPartialAccept,
  onLifecycle,
  onOpenEditor,
}: RevisionComparisonProps): JSX.Element {
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const redacted = protectedContent(candidate);
  const candidateText = visibleCandidateText(candidate);
  const stale = candidate.currentness !== 'current' || candidate.lifecycle === 'stale';
  const editable = candidate.lifecycle === 'generated' || candidate.lifecycle === 'reviewing';
  const acceptEnabled = canAccept && editable && !stale && !redacted;
  const hasExactSourceAnchor = Boolean(
    candidate.sourceAnchor &&
    Number.isInteger(candidate.sourceAnchor.selectionStart) &&
    Number.isInteger(candidate.sourceAnchor.selectionEnd) &&
    candidate.sourceAnchor.selectionEnd > candidate.sourceAnchor.selectionStart &&
    candidate.sourceAnchor.selectionFingerprint.trim(),
  );
  const sourceIsHistorical = stale || candidate.lifecycle === 'accepted' || candidate.lifecycle === 'partially accepted';
  const partialHelpId = `revision-partial-help-${candidate.id}`;

  useEffect(() => {
    setSelection({ start: 0, end: 0 });
  }, [candidate.id, candidateText, redacted, candidate.sourceBodySha256, candidate.sourceAnchor?.unitId, candidate.sourceAnchor?.selectionStart, candidate.sourceAnchor?.selectionEnd, candidate.sourceAnchor?.selectionFingerprint]);

  return (
    <section className="program7-revision-comparison" aria-labelledby={`revision-comparison-${candidate.id}`} data-testid="revision-comparison">
      <header className="program7-revision-comparison__header">
        <div>
          <h1 id={`revision-comparison-${candidate.id}`}>Compare revision alternative</h1>
          <p>{candidate.purpose}</p>
        </div>
        <span data-testid="revision-comparison-origin">{lifecycleLabel(candidate)}</span>
      </header>
      <p className="program7-revision-comparison__source-status">{sourceStatus(candidate)}</p>
      {editable && stale ? (
        <p role="alert" data-testid="revision-comparison-stale">
          {candidate.currentness === 'stale'
            ? 'This alternative cannot be applied because the passage changed. Return to the passage and create a fresh alternative after reviewing it.'
            : 'This alternative cannot be applied because its original passage is unavailable.'}
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
          <h2 id={`revision-current-${candidate.id}`}>{sourceIsHistorical ? 'Saved source passage' : 'Your current manuscript'}</h2>
          <p>{sourceIsHistorical ? 'This is the saved passage used to create this alternative.' : 'This saved passage remains unchanged while you review the alternative.'}</p>
          <pre data-testid="revision-current-text">{redacted ? 'Content hidden by protection policy.' : candidate.sourceSnapshot.text}</pre>
        </article>
        <article aria-labelledby={`revision-candidate-${candidate.id}`}>
          <h2 id={`revision-candidate-${candidate.id}`}>Revision alternative</h2>
          <p>{candidate.lifecycle === 'accepted' || candidate.lifecycle === 'partially accepted'
            ? 'This is the alternative you applied.'
            : candidate.editedCandidateText ? 'Your edited alternative is ready to review.' : 'This alternative is ready to review.'}</p>
          <pre data-testid="revision-candidate-text">{redacted ? 'Content hidden by protection policy.' : visibleCandidateText(candidate)}</pre>
        </article>
      </div>
      <div className="program7-revision-comparison__partial">
        <label htmlFor={`revision-partial-${candidate.id}`}>Part of this alternative to apply</label>
        <textarea
          id={`revision-partial-${candidate.id}`}
          aria-label="Part of this alternative to apply"
          value={redacted ? '' : visibleCandidateText(candidate)}
          disabled={redacted || !hasExactSourceAnchor}
          readOnly
          onKeyDown={(event) => {
            if (redacted || !hasExactSourceAnchor) return;
            if (event.altKey || ((event.ctrlKey || event.metaKey) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight'))) return;
            const text = visibleCandidateText(candidate);
            const target = event.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const backward = target.selectionDirection === 'backward';
            const active = backward ? start : end;
            const anchor = backward ? end : start;
            let nextStart = start;
            let nextEnd = end;
            let direction: 'forward' | 'backward' = target.selectionDirection === 'backward' ? 'backward' : 'forward';
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
              nextStart = 0;
              nextEnd = text.length;
              direction = 'forward';
            } else if (event.key === 'Home' || event.key === 'End') {
              const destination = event.ctrlKey || event.metaKey
                ? event.key === 'Home' ? 0 : text.length
                : moveCaret(text, active, event.key === 'Home' ? -1 : 1, true);
              if (event.shiftKey) {
                nextStart = Math.min(anchor, destination);
                nextEnd = Math.max(anchor, destination);
                direction = destination < anchor ? 'backward' : 'forward';
              } else {
                nextStart = destination;
                nextEnd = destination;
              }
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              const directionStep = event.key === 'ArrowLeft' ? -1 : 1;
              const destination = !event.shiftKey && start !== end
                ? (directionStep < 0 ? start : end)
                : moveCaret(text, active, directionStep, false);
              if (event.shiftKey) {
                nextStart = Math.min(anchor, destination);
                nextEnd = Math.max(anchor, destination);
                direction = destination < anchor ? 'backward' : 'forward';
              } else {
                nextStart = destination;
                nextEnd = destination;
              }
            } else return;
            event.preventDefault();
            target.setSelectionRange(nextStart, nextEnd, direction);
            setSelection({ start: nextStart, end: nextEnd });
          }}
          onSelect={(event) => setSelection({
            start: event.currentTarget.selectionStart,
            end: event.currentTarget.selectionEnd,
          })}
          placeholder={redacted ? 'Hidden by protection policy.' : 'Select the exact text from this alternative that you want to apply.'}
        />
      </div>
      <div className="program7-revision-comparison__actions" aria-label="Revision alternative actions">
        {onOpenEditor && editable ? <button type="button" onClick={() => onOpenEditor(candidate)}>Edit alternative</button> : null}
        <button type="button" disabled={!acceptEnabled || !onAcceptAll} onClick={() => onAcceptAll?.(candidate)}>
          Apply all of this alternative
        </button>
        <button
          type="button"
          disabled={!acceptEnabled || !hasExactSourceAnchor || !onPartialAccept || selection.end <= selection.start}
          aria-describedby={partialHelpId}
          onClick={() => onPartialAccept?.(candidate, {
            text: visibleCandidateText(candidate).slice(selection.start, selection.end),
            start: selection.start,
            end: selection.end,
          })}
        >
          Apply only the selected part
        </button>
        {onLifecycle && editable ? dispositionActions.map((lifecycle) => (
          <button key={lifecycle} type="button" onClick={() => onLifecycle(candidate, lifecycle)}>
            {lifecycle === 'rejected' ? 'Do not use this alternative' : lifecycle === 'parked' ? 'Set this alternative aside' : 'Stop working on this alternative'}
          </button>
        )) : null}
      </div>
      <p id={partialHelpId} role="status" className="program7-revision-comparison__note">
        {!editable
          ? 'This alternative is closed. To make another change, select words in Writing Studio and save a new alternative.'
          : redacted
          ? 'This alternative is hidden by protection policy. Return to the passage and review its protection before creating a new alternative.'
          : !hasExactSourceAnchor
          ? 'To apply only part, return to Writing Studio, select the exact manuscript words to replace, and save a new alternative. Selecting text on this comparison cannot link the existing alternative.'
          : 'To apply only part, select the words to insert in the box labeled “Part of this alternative to apply” above.'}
      </p>
      <p className="program7-revision-comparison__note">{editable
        ? 'Only you can apply an alternative to your manuscript. Applying it does not finish the related concern.'
        : 'Applying or closing an alternative does not finish the related concern.'}</p>
      <details className="program7-revision-comparison__technical-details">
        <summary>Technical details</summary>
        <dl className="program7-revision-comparison__metadata">
          <div><dt>Alternative status</dt><dd>{candidate.lifecycle}</dd></div>
          <div><dt>Source status</dt><dd>{candidate.currentness}</dd></div>
          <div><dt>Unit ID</dt><dd>{candidate.unitId}</dd></div>
          <div><dt>Origin</dt><dd>{candidate.origin === 'local-ai' ? `Local AI${candidate.provenance.model ? ` · ${candidate.provenance.model}` : ''}` : 'Manual author entry'}</dd></div>
          <div><dt>Protection</dt><dd>{redacted ? `Hidden · ${candidate.protection.class}` : 'Ordinary'}</dd></div>
        </dl>
      </details>
    </section>
  );
}
