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
  if (item.lifecycle === 'stale') return 'Source stale';
  if (item.sourceBodyFingerprint || item.anchor || item.sourceId) return 'Source linked';
  return 'Source status unavailable';
}

function sourceDescription(item: RevisionItem): string {
  const kind = item.sourceKind ?? 'unknown source';
  const id = item.sourceId ?? item.sourceFindingId ?? 'unidentified';
  return `${kind}/${id}`;
}

function safeBody(item: RevisionItem): JSX.Element {
  if (item.protection?.protected) {
    return <span className="program7-revision-desk__protected">Content hidden by protection policy.</span>;
  }
  return <span>{item.body}</span>;
}

function RecheckList({ rechecks }: { readonly rechecks: readonly FeedbackNoteRecheck[] | undefined }): JSX.Element | null {
  if (!rechecks || rechecks.length === 0) return null;
  return (
    <div className="program7-revision-desk__rechecks" aria-label="Recheck evidence">
      <strong>Rechecks</strong>
      <ul>
        {rechecks.map((recheck) => (
          <li key={recheck.id}>
            <span>{recheck.method === 'local-ai' ? 'Local-AI' : 'Deterministic'}:</span>{' '}
            <span>{recheck.status.replace(/_/gu, ' ')}</span>
            {recheck.sourceStatus ? <span> · {recheck.sourceStatus}</span> : null}
            {recheck.evidence ? <span> · {recheck.evidence}</span> : null}
          </li>
        ))}
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
          <h3>{item.id}</h3>
          <p>{item.lens ?? 'Revision item'}</p>
        </div>
        <span>{history ? item.lifecycle : sourceStatus(item)}</span>
      </header>
      <dl className="program7-revision-desk__metadata">
        <div><dt>Source</dt><dd>{sourceDescription(item)}</dd></div>
        <div><dt>Unit</dt><dd>{item.unitId}</dd></div>
        <div><dt>Origin</dt><dd>{item.provenance?.origin ?? 'author'}</dd></div>
        <div><dt>Protection</dt><dd>{item.protection?.protected ? 'Protected · metadata only' : 'Ordinary'}</dd></div>
      </dl>
      <p className="program7-revision-desk__body">{safeBody(item)}</p>
      {item.evidence ? (
        <p className="program7-revision-desk__evidence">
          {item.protection?.protected ? 'Evidence hidden by protection policy.' : item.evidence}
        </p>
      ) : null}
      <RecheckList rechecks={item.rechecks} />
      {recurrenceId ? (
        <p>
          <button type="button" onClick={() => onOpenRecurrence?.(item, recurrenceId)}>
            Open related recurrence
          </button>
        </p>
      ) : null}
      <div className="program7-revision-desk__actions" aria-label={`Actions for ${item.id}`}>
        {onReturnToSource ? (
          <button type="button" onClick={() => onReturnToSource(item)}>Return to source</button>
        ) : null}
        {!history && onRecheck ? (
          <>
            <button type="button" onClick={() => onRecheck(item, 'deterministic')}>Run deterministic recheck</button>
            <button type="button" onClick={() => onRecheck(item, 'local-ai')}>Run local-AI recheck</button>
          </>
        ) : null}
        {!history && onLifecycle ? dispositionActions.map((lifecycle) => (
          <button key={lifecycle} type="button" onClick={() => onLifecycle(item, lifecycle)}>
            {lifecycle.replace(/_/gu, ' ')}
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
              Resolve (Jason only)
            </button>
            <small id={`${item.id}-resolution-note`}>Only Jason can resolve this revision item.</small>
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
          {cardProps.history ? 'No resolved revision history.' : 'No active revision items.'}
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
        <p>Review source-linked revision items. Nothing here changes manuscript text automatically.</p>
      </header>
      {availability === 'degraded' ? (
        <p role="alert" data-testid="revision-desk-degraded">
          {unavailableMessage ?? 'Revision items are unavailable. No change was made.'}
        </p>
      ) : null}
      <ItemSection
        title="Active revision items"
        items={activeItems}
        history={false}
        canResolve={canResolve}
        onReturnToSource={onReturnToSource}
        onLifecycle={onLifecycle}
        onRecheck={onRecheck}
        onOpenRecurrence={onOpenRecurrence}
      />
      <ItemSection
        title="Resolved history"
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
