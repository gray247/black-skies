import { useEffect, useState, type ReactNode } from 'react';
import { revisionItemSources, captureProgram7SourceEvidence, buildProgram7SourceEnvelope } from '../../../shared/program7SourceBinding';
import type { StoryPositionRefV1 } from '../../../shared/ipc/storyIntelligence';
import type {
  FeedbackNoteRecheck,
  FeedbackSourceEvidence,
  FeedbackRevisionDisposition,
  FeedbackRevisionLifecycle,
  RevisionItem,
} from '../../../shared/ipc/feedbackNotes';

export interface RevisionDeskProps {
  readonly activeItems: readonly RevisionItem[];
  readonly historyItems: readonly RevisionItem[];
  readonly availability?: 'ready' | 'degraded';
  readonly unavailableMessage?: string | null;
  readonly canResolve?: boolean;
  readonly localAiAvailable?: boolean;
  readonly pending?: boolean;
  readonly renderEvidence?: (item: RevisionItem) => ReactNode;
  readonly onConsiderRevision?: (item: RevisionItem) => void;
  readonly onReturnToSource?: (item: RevisionItem) => void;
  readonly onLifecycle?: (item: RevisionItem, lifecycle: FeedbackRevisionLifecycle) => void;
  readonly onRecheck?: (item: RevisionItem, method: 'deterministic' | 'local-ai') => void;
  readonly onOpenRecurrence?: (item: RevisionItem, recurrenceId: string) => void;
}

const dispositionActions: readonly FeedbackRevisionDisposition[] = [
  'parked',
  'dismissed',
  'abandoned',
];

function sourceStatus(item: RevisionItem): string {
  if (item.lifecycle === 'stale') return 'The passage changed after this task was created';
  if (item.sourceBodyFingerprint || item.anchor || item.sourceId) return 'Ready to open';
  return 'Original location unavailable';
}

function sourceDescription(item: RevisionItem): string {
  const kind = item.sourceKind ?? 'unknown source';
  if (kind === 'manuscript' || kind === 'story-unit') return 'Manuscript passage';
  if (kind === 'outline') return 'Outline point';
  if (kind === 'author-intent') return 'Story Foundation answer';
  return 'Project note';
}

function originDescription(item: RevisionItem): string {
  return item.provenance?.source === 'manual' ? 'Author concern' : item.provenance?.origin === 'local-ai' ? 'Local advisory suggestion' : 'Story Knowledge';
}

function lifecycleLabel(lifecycle: FeedbackRevisionLifecycle): string {
  switch (lifecycle) {
    case 'active':
    case 'review': return 'Open';
    case 'intended': return 'Planned';
    case 'underway': return 'In progress';
    case 'ready_for_recheck': return 'Ready to check';
    case 'recheck_pending': return 'Checking';
    case 'resolved': return 'Finished';
    case 'parked': return 'Set aside';
    case 'dismissed': return 'Dismissed';
    case 'intentional': return 'Marked intentional';
    case 'abandoned': return 'Stopped';
    case 'stale': return 'Needs review';
    default: return 'Unavailable';
  }
}

function dispositionLabel(lifecycle: FeedbackRevisionDisposition): string {
  return lifecycle === 'parked' ? 'Set aside' : lifecycle === 'dismissed' ? 'Dismiss' : 'Stop working on this';
}

function safeBody(item: RevisionItem): JSX.Element {
  if (item.protection?.protected) {
    return <span className="program7-revision-desk__protected">Content hidden by protection policy.</span>;
  }
  return <span>{item.body}</span>;
}

function sourceStatusLabel(status: FeedbackNoteRecheck['sourceStatus']): string | null {
  if (status === 'potentially-outdated') return 'edited passage found';
  if (status === 'relocated') return 'passage found in its new position';
  if (status === 'exact' || status === 'current') return 'linked passage found';
  if (status === 'ambiguous') return 'more than one possible passage';
  if (status === 'stale') return 'original passage no longer identifiable';
  if (status === 'unavailable') return 'source unavailable';
  if (status === 'protected') return 'protected source';
  return null;
}

function evidenceLabel(recheck: FeedbackNoteRecheck): string | undefined {
  if (!recheck.evidence?.startsWith('Deterministic source check')) return recheck.evidence;
  if (recheck.sourceStatus === 'ambiguous') {
    return 'More than one passage may match this concern, so Black Skies did not choose one.';
  }
  if (recheck.sourceStatus === 'stale' || recheck.sourceStatus === 'unavailable') {
    return 'The original passage could not be identified safely after the edit.';
  }
  return 'The linked passage is available. Black Skies did not decide whether the concern is resolved.';
}

function RecheckList({ rechecks }: { readonly rechecks: readonly FeedbackNoteRecheck[] | undefined }): JSX.Element | null {
  if (!rechecks || rechecks.length === 0) return null;
  return (
    <div className="program7-revision-desk__rechecks" aria-label="Check history">
      <strong>Check history</strong>
      <ul>
        {rechecks.map((recheck) => {
          const sourceStatus = sourceStatusLabel(recheck.sourceStatus);
          const evidence = evidenceLabel(recheck);
          return <li key={recheck.id}>
            <span>{recheck.method === 'local-ai' ? 'Earlier advisory check' : 'Passage check'}:</span>{' '}
            <span>{recheck.status === 'appears_resolved'
              ? 'may be resolved'
              : recheck.status === 'still_appears_present'
                ? 'the concern may still be present'
                : recheck.status === 'unavailable'
                  ? 'could not check'
                  : 'the passage was found; no writing judgment was made'}</span>
            {sourceStatus ? <span> · {sourceStatus}</span> : null}
            {evidence ? <span> · {evidence}</span> : null}
          </li>
        })}
      </ul>
    </div>
  );
}

function RevisionCard({
  item,
  history,
  canResolve,
  pending,
  renderEvidence,
  onConsiderRevision,
  onReturnToSource,
  onLifecycle,
  onRecheck,
  onOpenRecurrence,
  localAiAvailable,
}: {
  readonly item: RevisionItem;
  readonly history: boolean;
  readonly canResolve: boolean;
  readonly pending?: boolean;
  readonly renderEvidence?: (item: RevisionItem) => ReactNode;
  readonly onConsiderRevision?: (item: RevisionItem) => void;
  readonly onReturnToSource?: (item: RevisionItem) => void;
  readonly onLifecycle?: (item: RevisionItem, lifecycle: FeedbackRevisionLifecycle) => void;
  readonly onRecheck?: (item: RevisionItem, method: 'deterministic' | 'local-ai') => void;
  readonly onOpenRecurrence?: (item: RevisionItem, recurrenceId: string) => void;
  readonly localAiAvailable: boolean;
}): JSX.Element {
  const recurrenceId = item.relatedRecurrenceId ?? item.relatedItemId ?? item.relatedRevisionItemId;
  return (
    <article
      className="program7-revision-desk__card"
      tabIndex={0}
      data-concern-id={item.id}
      aria-label="Revision task"
      onKeyDown={(event) => {
        if (event.key === 'Enter' && onReturnToSource) onReturnToSource(item);
      }}
    >
      <header className="program7-revision-desk__card-header">
        <div>
          <h3>{item.lens ? `${item.lens[0]?.toUpperCase()}${item.lens.slice(1)} concern` : 'Revision to consider'}</h3>
          <p>{sourceDescription(item)} · {renderEvidence ? 'See each source check below' : sourceStatus(item)}</p>
        </div>
        {history ? <span>{lifecycleLabel(item.lifecycle)}</span> : null}
      </header>
      {item.protection?.protected ? <p>Some protected details are hidden.</p> : null}
      <p className="program7-revision-desk__body"><strong>What to consider:</strong> {safeBody(item)}</p>
      {item.evidence && item.evidence.trim() !== item.body.trim() ? (
        <p className="program7-revision-desk__evidence">
          <strong>Why it was noted:</strong>{' '}
          {item.protection?.protected ? 'Evidence hidden by protection policy.' : item.evidence}
        </p>
      ) : null}
      {renderEvidence?.(item)}
      {onConsiderRevision && !history ? <button type="button" disabled={pending} onClick={() => onConsiderRevision(item)}>Consider a revision</button> : null}
      <RecheckList rechecks={item.rechecks} />
      {recurrenceId && onOpenRecurrence ? (
        <p>
          <button type="button" onClick={() => onOpenRecurrence?.(item, recurrenceId)}>
            Open related concern
          </button>
        </p>
      ) : null}
      <fieldset disabled={pending} style={{ border: 0, padding: 0 }}><div className="program7-revision-desk__actions" aria-label={`Actions for ${item.id}`}>
        {onReturnToSource ? (
          <button type="button" onClick={() => onReturnToSource(item)}>Open passage in Writing Studio</button>
        ) : null}
        {!history && onRecheck ? (
          <>
            <button type="button" onClick={() => onRecheck(item, 'deterministic')}>Check source availability</button>
            {localAiAvailable ? <button type="button" onClick={() => onRecheck(item, 'local-ai')}>Ask for another advisory check</button> : null}
          </>
        ) : null}
        {!history && onLifecycle ? dispositionActions.map((lifecycle) => (
          <button key={lifecycle} type="button" onClick={() => onLifecycle(item, lifecycle)}>
            {dispositionLabel(lifecycle)}
          </button>
        )) : null}
        {!history ? (
          <>
            <button
              type="button"
              disabled={!canResolve}
              aria-describedby={`${item.id}-resolution-note`}
              onClick={() => {
                if (canResolve) onLifecycle?.(item, 'resolved');
              }}
            >
              I’m satisfied — mark resolved
            </button>
            <small id={`${item.id}-resolution-note`}>Only you can mark this concern finished.</small>
          </>
        ) : null}
      </div></fieldset>
      <details className="program7-revision-desk__technical-details">
        <summary>Technical details</summary>
        <dl className="program7-revision-desk__metadata">
          <div><dt>Revision task ID</dt><dd>{item.id}</dd></div>
          <div><dt>Unit ID</dt><dd>{item.unitId}</dd></div>
          <div><dt>Status</dt><dd>{item.lifecycle}</dd></div>
          <div><dt>Added from</dt><dd>{originDescription(item)}</dd></div>
          {item.protection?.protected ? <div><dt>Privacy</dt><dd>Protected · details hidden</dd></div> : null}
        </dl>
      </details>
    </article>
  );
}

function ItemSection({
  title,
  items,
  ...cardProps
}: {
  readonly title: string;
  readonly items: readonly RevisionItem[];
  readonly history: boolean;
  readonly canResolve: boolean;
  readonly pending?: boolean;
  readonly renderEvidence?: (item: RevisionItem) => ReactNode;
  readonly onConsiderRevision?: (item: RevisionItem) => void;
  readonly onReturnToSource?: (item: RevisionItem) => void;
  readonly onLifecycle?: (item: RevisionItem, lifecycle: FeedbackRevisionLifecycle) => void;
  readonly onRecheck?: (item: RevisionItem, method: 'deterministic' | 'local-ai') => void;
  readonly onOpenRecurrence?: (item: RevisionItem, recurrenceId: string) => void;
  readonly localAiAvailable: boolean;
}): JSX.Element {
  return (
    <section className="program7-revision-desk__section" aria-labelledby={`${title.toLowerCase().replace(/\s+/gu, '-')}-heading`}>
      <h2 id={`${title.toLowerCase().replace(/\s+/gu, '-')}-heading`}>{title}</h2>
      {items.length === 0 ? (
        <p data-testid={`revision-desk-empty-${cardProps.history ? 'history' : 'active'}`}>
          {cardProps.history ? 'No completed revision tasks yet.' : 'No active revision tasks.'}
        </p>
      ) : (
        <div className="program7-revision-desk__cards">
          {items.map((item) => <RevisionCard key={item.id} item={item} {...cardProps} />)}
        </div>
      )}
    </section>
  );
}

export default function RevisionDesk({
  activeItems,
  historyItems,
  availability = 'ready',
  unavailableMessage,
  canResolve = false,
  localAiAvailable = true,
  pending,
  renderEvidence,
  onConsiderRevision,
  onReturnToSource,
  onLifecycle,
  onRecheck,
  onOpenRecurrence,
}: RevisionDeskProps): JSX.Element {
  return (
    <section className="program7-revision-desk" aria-labelledby="program7-revision-desk-heading">
      <header>
        <h1 id="program7-revision-desk-heading">Revision Desk</h1>
        <p>Concerns you choose to work on are saved here. Open the passage, revise and save it in Writing Studio, then come back to check whether the concern still applies. Nothing here changes your manuscript automatically.</p>
      </header>
      <ol className="program7-revision-desk__steps" aria-label="How to use Revision Desk">
        <li>Open the passage.</li>
        <li>Revise and save in Writing Studio.</li>
        <li>Return here to check it again or mark it finished.</li>
      </ol>
      {availability === 'degraded' ? (
        <p role="alert" data-testid="revision-desk-degraded">
          {unavailableMessage ?? 'Revision items are unavailable. No change was made.'}
        </p>
      ) : null}
      <ItemSection
        title="Active revision tasks"
        items={activeItems}
        history={false}
        canResolve={canResolve}
        pending={pending}
        renderEvidence={renderEvidence}
        onConsiderRevision={onConsiderRevision}
        onReturnToSource={onReturnToSource}
        onLifecycle={onLifecycle}
        onRecheck={onRecheck}
        onOpenRecurrence={onOpenRecurrence}
        localAiAvailable={localAiAvailable}
      />
      <ItemSection
        title="Completed revision tasks"
        items={historyItems}
        history
        canResolve={canResolve}
        pending={pending}
        renderEvidence={renderEvidence}
        onConsiderRevision={onConsiderRevision}
        onReturnToSource={onReturnToSource}
        onLifecycle={onLifecycle}
        onRecheck={onRecheck}
        onOpenRecurrence={onOpenRecurrence}
        localAiAvailable={localAiAvailable}
      />
    </section>
  );
}

/** Current and recorded evidence remain distinct, including after source Undo. */
export function RevisionEvidence({ item, bodies, dirtyUnitIds, onRead, decisionEvidence }: {
  item: RevisionItem; bodies: Readonly<Record<string, string>>; dirtyUnitIds: ReadonlySet<string>;
  onRead?: (source: StoryPositionRefV1) => void;
  decisionEvidence?: readonly FeedbackSourceEvidence[];
}): JSX.Element {
  const [checked, setChecked] = useState<{ item: RevisionItem; bodies: Readonly<Record<string, string>>; values: readonly FeedbackSourceEvidence[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void Promise.all(revisionItemSources(item).map(source => captureProgram7SourceEvidence(source, bodies[source.unitId])))
      .then(values => { if (!cancelled) setChecked({ item, bodies, values }); })
      .catch(() => { if (!cancelled) setChecked(null); });
    return () => { cancelled = true; };
  }, [item, bodies]);
  const current = checked?.item === item && checked.bodies === bodies ? checked.values : [];
  return <div aria-label={`Concern evidence ${item.id}`}>
    {revisionItemSources(item).map((source, index) => {
      const evidence = current[index], original = item.originalEvidence?.[index], recorded = decisionEvidence?.[index];
      const protectedSource = item.protection?.protected || source.protection.metadataOnly || !evidence || evidence.status === 'protected';
      const dirty = dirtyUnitIds.has(source.unitId);
      const identifiable = evidence?.text !== undefined && !protectedSource;
      const changed = evidence && !['current', 'exact', 'relocated'].includes(evidence.status);
      const label = index === 0 ? 'primary' : 'related';
      return <section key={index} aria-label={`${index === 0 ? 'Primary' : 'Related'} evidence`}>
        <h4>{index === 0 ? 'Primary passage' : 'Related passage'}</h4>
        <p>{!evidence ? 'Checking source availability.' : protectedSource ? 'This source is protected; only metadata is available.' : changed ? 'Source changed. Review the original and current evidence.' : 'Linked passage found.'} {dirty ? 'Unsaved source changes.' : ''}</p>
        {!protectedSource && original?.text !== undefined && (original.text !== evidence?.text || original.truncated !== evidence?.truncated) ? <><strong>Original evidence</strong><blockquote aria-label={`Original ${label} evidence`}>{original.text}</blockquote>{original.truncated ? <small>Excerpt; original selection is longer.</small> : null}</> : null}
        {!protectedSource && recorded ? <><strong>Recorded at this decision</strong>{recorded.text !== undefined ? <blockquote aria-label={`Recorded ${label} evidence`}>{recorded.text}</blockquote> : <p>No quote was available at this decision.</p>}{recorded.truncated ? <small>Excerpt; recorded selection is longer.</small> : null}
          {recorded.bodyFingerprint && evidence?.bodyFingerprint && recorded.bodyFingerprint !== evidence.bodyFingerprint ? <p>Current source differs from this decision.</p> : null}</> : null}
        {identifiable ? <><strong>{dirty ? 'Current unsaved evidence' : 'Current evidence'}</strong><blockquote aria-label={`Current ${label} evidence`}>{evidence.text}</blockquote>{evidence.truncated ? <small>Excerpt; current selection is longer.</small> : null}</> : <p>Evidence excerpt withheld until this source is verified.</p>}
        <button type="button" disabled={!identifiable || dirty || !onRead} onClick={() => {
          if (!evidence || evidence.selectionStart === undefined || evidence.selectionEnd === undefined || bodies[source.unitId] === undefined) return;
          void buildProgram7SourceEnvelope({ projectId: source.projectId, generation: source.generation, unitId: source.unitId,
            sourceText: bodies[source.unitId], selectionStart: evidence.selectionStart, selectionEnd: evidence.selectionEnd })
            .then(fresh => onRead?.(fresh.sourceRef));
        }}>Read {label} evidence</button>
      </section>;
    })}
    <p>Source checks locate evidence. Editing does not automatically address a concern; you decide.</p>
  </div>;
}
