import { useEffect, useRef, useState } from 'react';

import type { RevisionCandidateV1 } from '../../../shared/ipc/revisionCandidates';

export type WritingRevisionSaveResult = { readonly ok: boolean; readonly message: string };

export interface WritingRevisionDrawerProps {
  readonly open: boolean;
  readonly candidate: RevisionCandidateV1 | null;
  readonly onClose?: () => void;
  readonly onSaveEdit?: (candidate: RevisionCandidateV1, editedCandidateText: string) => void | WritingRevisionSaveResult | Promise<WritingRevisionSaveResult>;
  readonly onDirtyChange?: (dirty: boolean) => void;
  readonly onSavingChange?: (saving: boolean) => void;
}

function protectedContent(candidate: RevisionCandidateV1): boolean {
  return candidate.protection.excluded || candidate.protection.class !== 'ordinary';
}

function candidateText(candidate: RevisionCandidateV1): string {
  return candidate.editedCandidateText ?? candidate.candidateText;
}

function sourceStatus(candidate: RevisionCandidateV1): string {
  if (candidate.currentness === 'stale') return 'This alternative was created from an older version of the passage.';
  if (candidate.currentness === 'unavailable') return 'The original passage is no longer available.';
  if (!candidate.sourceAnchor) return 'This alternative uses the current saved section, but was not linked to selected words.';
  return 'This alternative is linked to the current saved passage.';
}

export default function WritingRevisionDrawer({
  open,
  candidate,
  onClose,
  onSaveEdit,
  onDirtyChange,
  onSavingChange,
}: WritingRevisionDrawerProps): JSX.Element | null {
  const [editedText, setEditedText] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<WritingRevisionSaveResult | null>(null);

  useEffect(() => {
    setEditedText(candidate ? candidateText(candidate) : '');
    setSaving(false);
  }, [candidate?.id, candidate?.updatedAt]);

  useEffect(() => { setSaveResult(null); }, [candidate?.id]);
  useEffect(() => {
    onSavingChange?.(saving);
    return () => onSavingChange?.(false);
  }, [onSavingChange, saving]);

  useEffect(() => {
    if (!open || !candidate) {
      if (wasOpenRef.current && returnFocusRef.current?.isConnected) {
        returnFocusRef.current.focus();
      }
      wasOpenRef.current = false;
      return;
    }

    if (!wasOpenRef.current) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      wasOpenRef.current = true;
    }
    const focusHandle = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(focusHandle);
  }, [candidate?.id, open]);

  const redacted = candidate ? protectedContent(candidate) : false;
  const originalText = candidate ? candidateText(candidate) : '';
  const changed = !redacted && editedText !== originalText;
  const editable = candidate?.lifecycle === 'generated' || candidate?.lifecycle === 'reviewing';

  useEffect(() => {
    onDirtyChange?.(Boolean(open && candidate && changed));
    return () => onDirtyChange?.(false);
  }, [changed, candidate, onDirtyChange, open]);
  useEffect(() => {
    if (!changed || !open) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saving) {
        event.preventDefault();
        event.returnValue = '';
        return;
      }
      event.preventDefault();
      event.returnValue = '';
      setSaveResult({
        ok: false,
        message: 'Your window stayed open because this revision alternative has unsaved changes. Save the alternative or close the drawer to decide whether to discard it. Your manuscript has not changed.',
      });
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [changed, open, saving]);
  if (!open || !candidate) return null;
  const close = () => {
    if (saving) return;
    if (changed && !window.confirm('Discard unsaved revision alternative changes?')) return;
    if (changed) onDirtyChange?.(false);
    onClose?.();
  };
  const save = async () => {
    if (!onSaveEdit || saving || !changed) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const result = await onSaveEdit(candidate, editedText);
      if (result) setSaveResult(result);
    } catch {
      setSaveResult({ ok: false, message: 'The revision alternative could not be saved. Your manuscript has not changed.' });
    } finally { setSaving(false); }
  };

  return (
    <aside
      className="program7-writing-revision-drawer"
      aria-label="Writing revision drawer"
      data-testid="writing-revision-drawer"
      data-dirty={changed ? 'true' : 'false'}
    >
      <header>
        <div>
          <h1>Edit revision alternative</h1>
          <p>Saving changes this alternative only. Your manuscript has not changed.</p>
        </div>
        {onClose ? <button ref={closeButtonRef} type="button" onClick={close} disabled={saving}>Close drawer</button> : null}
      </header>
      <p className="program7-writing-revision-drawer__source-status">{sourceStatus(candidate)}</p>
      {candidate.currentness !== 'current' ? (
        <p role="alert">
          {candidate.currentness === 'stale'
            ? 'This alternative cannot be applied because the passage changed. Return to the passage and create a fresh alternative after reviewing it.'
            : 'This alternative cannot be applied because its original passage is unavailable.'}
        </p>
      ) : null}
      {redacted ? <p role="alert">Alternative text is hidden by protection policy.</p> : null}
      <section aria-labelledby={`drawer-source-${candidate.id}`}>
        <h2 id={`drawer-source-${candidate.id}`}>Your current manuscript</h2>
        <pre>{redacted ? 'Content hidden by protection policy.' : candidate.sourceSnapshot.text}</pre>
      </section>
      <section aria-labelledby={`drawer-candidate-${candidate.id}`}>
        <h2 id={`drawer-candidate-${candidate.id}`}>Revision alternative</h2>
        <textarea
          aria-label="Revision alternative text"
          value={redacted ? '' : editedText}
          disabled={redacted || !editable || saving}
          onChange={(event) => { setSaveResult(null); setEditedText(event.target.value); }}
        />
      </section>
      <div aria-label="Writing revision drawer actions">
        <button type="button" disabled={redacted || !editable || !changed || !onSaveEdit || saving} onClick={() => void save()}>
          Save revision alternative
        </button>
      </div>
      {saving ? <p role="status">Saving this alternative… Your manuscript has not changed.</p> : null}
      {saveResult ? <p role={saveResult.ok ? 'status' : 'alert'}>{saveResult.message}</p> : null}
      <p>After saving, compare this alternative again. Saving does not apply it or mark the related concern finished.</p>
      <details className="program7-writing-revision-drawer__technical-details">
        <summary>Technical details</summary>
        <dl>
          <div><dt>Unit ID</dt><dd>{candidate.unitId}</dd></div>
          <div><dt>Alternative status</dt><dd>{candidate.lifecycle}</dd></div>
          <div><dt>Source status</dt><dd>{candidate.currentness}</dd></div>
          <div><dt>Origin</dt><dd>{candidate.origin === 'local-ai' ? `Local AI${candidate.provenance.model ? ` · ${candidate.provenance.model}` : ''}` : 'Manual author entry'}</dd></div>
        </dl>
      </details>
    </aside>
  );
}
