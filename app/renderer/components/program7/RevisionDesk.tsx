import type {
  FeedbackNoteRecheck,
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
  if (item.lifecycle === 'stale') return 'Passage changed since this task was created';
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
  return item.provenance?.origin === 'local-ai' ? 'Local AI suggestion' : 'Story Knowledge';
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
            <span>{recheck.method === 'local-ai' ? 'Local AI' : 'Passage check'}:</span>{' '}
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
  onReturnToSource,
  onLifecycle,
  onRecheck,
  onOpenRecurrence,
}: {
  readonly item: RevisionItem;
  readonly history: boolean;
  readonly canResolve: boolean;
  readonly onReturnToSource?: (item: RevisionItem) => void;
  readonly onLifecycle?: (item: RevisionItem, lifecycle: FeedbackRevisionLifecycle) => void;
  readonly onRecheck?: (item: RevisionItem, method: 'deterministic' | 'local-ai') => void;
  readonly onOpenRecurrence?: (item: RevisionItem, recurrenceId: string) => void;
}): JSX.Element {
  const recurrenceId = item.relatedRecurrenceId ?? item.relatedItemId ?? item.relatedRevisionItemId;
  return (
    <article
      className="program7-revision-desk__card"
      tabIndex={0}
      aria-label={`Revision item ${item.id}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && onReturnToSource) onReturnToSource(item);
      }}
    >
      <header className="program7-revision-desk__card-header">
        <div>
          <h3>{item.lens ? `${item.lens[0]?.toUpperCase()}${item.lens.slice(1)} concern` : 'Revision to consider'}</h3>
          <p>{sourceDescription(item)} · {sourceStatus(item)}</p>
        </div>
        {history ? <span>{item.lifecycle}</span> : null}
      </header>
      <dl className="program7-revision-desk__metadata">
        <div><dt>Added from</dt><dd>{originDescription(item)}</dd></div>
        {item.protection?.protected ? <div><dt>Privacy</dt><dd>Protected · details hidden</dd></div> : null}
      </dl>
      <p className="program7-revision-desk__body"><strong>What to consider:</strong> {safeBody(item)}</p>
      {item.evidence && item.evidence.trim() !== item.body.trim() ? (
        <p className="program7-revision-desk__evidence">
          <strong>Why it was noted:</strong>{' '}
          {item.protection?.protected ? 'Evidence hidden by protection policy.' : item.evidence}
        </p>
      ) : null}
      <RecheckList rechecks={item.rechecks} />
      {recurrenceId && onOpenRecurrence ? (
        <p>
          <button type="button" onClick={() => onOpenRecurrence?.(item, recurrenceId)}>
            Open related recurrence
          </button>
        </p>
      ) : null}
      <div className="program7-revision-desk__actions" aria-label={`Actions for ${item.id}`}>
        {onReturnToSource ? (
          <button type="button" onClick={() => onReturnToSource(item)}>Open passage</button>
        ) : null}
        {!history && onRecheck ? (
          <>
            <button type="button" onClick={() => onRecheck(item, 'deterministic')}>Check after revising</button>
            <button type="button" onClick={() => onRecheck(item, 'local-ai')}>Ask local AI to check again</button>
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
      </div>
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
  readonly onReturnToSource?: (item: RevisionItem) => void;
  readonly onLifecycle?: (item: RevisionItem, lifecycle: FeedbackRevisionLifecycle) => void;
  readonly onRecheck?: (item: RevisionItem, method: 'deterministic' | 'local-ai') => void;
  readonly onOpenRecurrence?: (item: RevisionItem, recurrenceId: string) => void;
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
        onReturnToSource={onReturnToSource}
        onLifecycle={onLifecycle}
        onRecheck={onRecheck}
        onOpenRecurrence={onOpenRecurrence}
      />
      <ItemSection
        title="Completed revision tasks"
        items={historyItems}
        history
        canResolve={canResolve}
        onReturnToSource={onReturnToSource}
        onLifecycle={onLifecycle}
        onRecheck={onRecheck}
        onOpenRecurrence={onOpenRecurrence}
      />
    </section>
  );
}
