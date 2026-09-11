import type { Program7HistoryItemV1, Program7HistoryProjectionV1 } from '../../../shared/program7History';

export interface Program7HistoryProps {
  readonly projection: Program7HistoryProjectionV1;
  readonly onOpenSource?: (item: Program7HistoryItemV1) => void;
  readonly onOpenRecurrence?: (item: Program7HistoryItemV1, recurrenceReference: string) => void;
}

function titleCase(value: string): string {
  return value.replace(/[-_]/gu, ' ').replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function sourceLabel(status: Program7HistoryItemV1['sourceStatus']): string {
  return status === 'current' ? 'Source current' : status === 'stale' ? 'Source stale' : 'Source unavailable';
}

function acceptanceLabel(status: Program7HistoryItemV1['acceptance']): string {
  return status === 'none' ? 'No promotion acceptance' : status === 'partial' ? 'Partial acceptance' : status === 'complete' ? 'Promotion complete' : status === 'deferred' ? 'Promotion deferred' : 'Promotion failed';
}

function HistoryCard({ item, onOpenSource, onOpenRecurrence }: { readonly item: Program7HistoryItemV1; readonly onOpenSource?: (item: Program7HistoryItemV1) => void; readonly onOpenRecurrence?: (item: Program7HistoryItemV1, recurrenceReference: string) => void }): JSX.Element {
  const protectedItem = item.protection.protected;
  return (
    <article className="program7-history__card" tabIndex={0} data-testid={`program7-history-item-${item.reference}`} aria-label={`History item ${item.reference}`}>
      <header>
        <div><h3>{item.title}</h3><p>{titleCase(item.ownerKind)} · {item.ownerId}</p></div>
        <span>{titleCase(item.lifecycle)}</span>
      </header>
      <p className="program7-history__summary">{protectedItem ? 'Content hidden by protection policy.' : item.summary}</p>
      <dl className="program7-history__metadata">
        <div><dt>Source</dt><dd>{sourceLabel(item.sourceStatus)}{item.sourceReference ? ` · ${item.sourceReference}` : ''}</dd></div>
        <div><dt>Provenance</dt><dd>{titleCase(item.provenance.origin)}{item.provenance.sourceReference ? ` · ${item.provenance.sourceReference}` : ''}</dd></div>
        <div><dt>Acceptance</dt><dd>{acceptanceLabel(item.acceptance)}</dd></div>
        <div><dt>Protection</dt><dd>{protectedItem ? `Metadata only · ${item.protection.class}` : 'Ordinary'}</dd></div>
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
        <p>One bounded view of records owned by Feedback Notes, Revision Candidates, Ideas, and Promotion. This is a projection, not a new history store.</p>
        <p>{projection.items.length} shown · {projection.totalSourceItems} source records · limit {projection.limit}</p>
      </header>
      {projection.trimmedCount > 0 ? <p role="status" data-testid="program7-history-trimmed">Showing the newest {projection.items.length} records. {projection.trimmedCount} older record{projection.trimmedCount === 1 ? '' : 's'} trimmed by the history bound.</p> : null}
      <HistorySection title="Active records" items={projection.activeItems} onOpenSource={onOpenSource} onOpenRecurrence={onOpenRecurrence} />
      <HistorySection title="Resolved and archived history" items={projection.historyItems} onOpenSource={onOpenSource} onOpenRecurrence={onOpenRecurrence} />
    </section>
  );
}
