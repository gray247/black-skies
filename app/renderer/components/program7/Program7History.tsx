import type { Program7HistoryItemV1, Program7HistoryProjectionV1 } from '../../../shared/program7History';

export interface Program7HistoryProps {
  readonly projection: Program7HistoryProjectionV1;
  readonly onOpenSource?: (item: Program7HistoryItemV1) => void;
  readonly onOpenRecurrence?: (item: Program7HistoryItemV1, recurrenceReference: string) => void;
}

function titleCase(value: string): string {
  return value.replace(/[-_]/gu, ' ').replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function recordLabel(kind: Program7HistoryItemV1['ownerKind']): string {
  if (kind === 'feedback-note') return 'Revision task';
  if (kind === 'revision-candidate') return 'Revision alternative';
  if (kind === 'idea-seed') return 'Idea';
  if (kind === 'idea-branch') return 'Idea direction';
  return 'Project update';
}

function originLabel(origin: string): string {
  if (origin === 'local-ai') return 'Local AI';
  if (origin === 'author' || origin === 'manual') return 'You';
  return titleCase(origin);
}

function sourceLabel(status: Program7HistoryItemV1['sourceStatus']): string {
  return status === 'current' ? 'Original available' : status === 'stale' ? 'Original has changed' : 'Original unavailable';
}

function acceptanceLabel(status: Program7HistoryItemV1['acceptance']): string {
  if (status === 'none') return 'Not applied';
  return status === 'partial' ? 'Partly applied' : status === 'complete' ? 'Completed' : status === 'deferred' ? 'Waiting for a later tool' : 'Could not complete';
}

function lifecycleLabel(item: Program7HistoryItemV1): string {
  if (item.ownerKind === 'revision-candidate') {
    if (item.lifecycle === 'generated') return 'Draft';
    if (item.lifecycle === 'partially accepted') return 'Partly applied';
    if (item.lifecycle === 'accepted') return 'Applied';
  }
  return titleCase(item.lifecycle);
}

function RecordedTime({ value }: { readonly value: string }): JSX.Element {
  // Other history families may use revision counters; those are not dates.
  const milliseconds = /^\d{4}-\d{2}-\d{2}T/u.test(value) ? Date.parse(value) : NaN;
  if (!Number.isFinite(milliseconds)) return <span>Time not recorded</span>;
  const label = new Date(milliseconds).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
  });
  return <time dateTime={value}>{label}</time>;
}

function HistoryCard({ item, onOpenSource, onOpenRecurrence }: { readonly item: Program7HistoryItemV1; readonly onOpenSource?: (item: Program7HistoryItemV1) => void; readonly onOpenRecurrence?: (item: Program7HistoryItemV1, recurrenceReference: string) => void }): JSX.Element {
  const protectedItem = item.protection.protected;
  return (
    <article className="program7-history__card" tabIndex={0} data-testid={`program7-history-item-${item.reference}`} aria-label={`History item ${item.reference}`}>
      <header>
        <div><h3>{item.title}</h3><p>{recordLabel(item.ownerKind)}</p></div>
        <span>{lifecycleLabel(item)}</span>
      </header>
      <p className="program7-history__summary">{protectedItem ? 'Content hidden by protection policy.' : item.summary}</p>
      <dl className="program7-history__metadata">
        <div><dt>Source</dt><dd>{sourceLabel(item.sourceStatus)}</dd></div>
        <div><dt>Created by</dt><dd>{originLabel(item.provenance.origin)}</dd></div>
        {item.acceptance !== 'none' || item.ownerKind === 'revision-candidate'
          ? <div><dt>Outcome</dt><dd>{acceptanceLabel(item.acceptance)}</dd></div>
          : null}
        {item.ownerKind === 'revision-candidate' ? <>
          <div><dt>Created</dt><dd><RecordedTime value={item.occurredAt} /></dd></div>
          <div><dt>Last changed</dt><dd><RecordedTime value={item.updatedAt} /></dd></div>
        </> : null}
        <div><dt>Content</dt><dd>{protectedItem ? 'Hidden because this material is protected' : 'Visible'}</dd></div>
      </dl>
      <div className="program7-history__actions" aria-label={`Actions for ${item.reference}`}>
        {onOpenSource ? <button type="button" onClick={() => onOpenSource(item)}>Open source</button> : null}
        {item.recurrenceReference && onOpenRecurrence ? <button type="button" onClick={() => onOpenRecurrence(item, item.recurrenceReference!)}>Open recurrence</button> : null}
      </div>
    </article>
  );
}

function HistorySection({ title, items, ...cardProps }: { readonly title: string; readonly items: readonly Program7HistoryItemV1[]; readonly onOpenSource?: (item: Program7HistoryItemV1) => void; readonly onOpenRecurrence?: (item: Program7HistoryItemV1, recurrenceReference: string) => void }): JSX.Element {
  const sectionId = `program7-history-${title.toLowerCase().replace(/\s+/gu, '-')}`;
  return (
    <section className="program7-history__section" aria-labelledby={sectionId}>
      <h2 id={sectionId}>{title}</h2>
      {items.length === 0 ? <p data-testid={`program7-history-empty-${title === 'Active records' ? 'active' : 'history'}`}>{title === 'Active records' ? 'No active records.' : 'No resolved or archived history.'}</p> : <div className="program7-history__cards">{items.map((item) => <HistoryCard key={item.reference} item={item} {...cardProps} />)}</div>}
    </section>
  );
}

export default function Program7History({ projection, onOpenSource, onOpenRecurrence }: Program7HistoryProps): JSX.Element {
  return (
    <section className="program7-history" aria-labelledby="program7-history-heading" data-testid="program7-history" data-history-store="projection-only">
      <header>
        <h1 id="program7-history-heading">History</h1>
        <p>Revisit revision work, ideas, and choices from this project.</p>
        <p>{projection.items.length} recent item{projection.items.length === 1 ? '' : 's'} shown.</p>
      </header>
      {projection.trimmedCount > 0 ? <p role="status" data-testid="program7-history-trimmed">Showing the newest {projection.items.length} items. {projection.trimmedCount} older item{projection.trimmedCount === 1 ? ' is' : 's are'} not shown.</p> : null}
      <HistorySection title="Active records" items={projection.activeItems} onOpenSource={onOpenSource} onOpenRecurrence={onOpenRecurrence} />
      <HistorySection title="Resolved and archived history" items={projection.historyItems} onOpenSource={onOpenSource} onOpenRecurrence={onOpenRecurrence} />
    </section>
  );
}
