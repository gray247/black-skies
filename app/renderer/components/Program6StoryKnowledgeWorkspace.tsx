import { useState } from 'react';

import type { StoryIntelligenceDocumentV1, StoryPositionRefV1 } from '../../shared/ipc/storyIntelligence';
import { buildProgram6ProductionProjection, type Program6ProductionProjectionV1 } from '../../shared/program6ProductionProjection';
import ContinuityReview from './ContinuityReview';
import EmotionGraph from './EmotionGraph';
import TimelineReview from './TimelineReview';
import type { ProjectSpineProjectContext } from '../../shared/ipc/projectSpine';

export type Program6StoryKnowledgeLens =
  | 'overview'
  | 'emotion'
  | 'continuity'
  | 'timeline'
  | 'pacing'
  | 'pressure'
  | 'signals';

export interface Program6StoryKnowledgeWorkspaceProps {
  readonly project: ProjectSpineProjectContext;
  readonly generation: number;
  readonly document: StoryIntelligenceDocumentV1;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onSignalDisposition?: (signalId: string, lifecycle: 'dismissed' | 'suppressed' | 'resolved' | 'converted') => void;
}

const LENSES: readonly { id: Program6StoryKnowledgeLens; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'emotion', label: 'Emotion' },
  { id: 'continuity', label: 'Continuity' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'pacing', label: 'Pacing' },
  { id: 'pressure', label: 'Pressure' },
  { id: 'signals', label: 'Signals' },
];

function sourceLabel(source: StoryPositionRefV1): string {
  return `${source.sourceKind}/${source.sourceId} · revision ${source.sourceRevision}`;
}

function LensSummary({ projection, document }: { readonly projection: Program6ProductionProjectionV1; readonly document: StoryIntelligenceDocumentV1 }): JSX.Element {
  return (
    <section className="stage19-program6__overview" aria-label="Story Knowledge overview">
      <header><h2>Overview</h2><p>Current-project scope and authority posture.</p></header>
      <dl className="stage19-program6__facts">
        <div><dt>Project scope</dt><dd>Current project only</dd></div>
        <div><dt>Source units</dt><dd>{projection.sourceUnitCount}</dd></div>
        <div><dt>Signal posture</dt><dd>{document.settings.signalPosture}</dd></div>
        <div><dt>Project posture</dt><dd>{document.settings.projectPosture}</dd></div>
        <div><dt>Deterministic lane</dt><dd>{document.settings.analysisPolicy.deterministicEnabled ? 'Available' : 'Disabled'}</dd></div>
        <div><dt>Optional inference</dt><dd>{document.settings.analysisPolicy.optionalInferenceEnabled ? 'Manually enabled' : 'AI disabled'}</dd></div>
      </dl>
      <p className="stage19-program6__boundary">Advisory source-linked support only. Findings do not become canon, prose, outline, quality judgment, or durable memory.</p>
    </section>
  );
}

function PacingLens({ projection, onSourceReturn }: { readonly projection: Program6ProductionProjectionV1; readonly onSourceReturn?: (source: StoryPositionRefV1) => void }): JSX.Element {
  return (
    <section className="stage19-program6__lens" aria-label="Pacing detail">
      <header><h2>Pacing</h2><p>Planned and observed tempo stay separate. Differences are review opportunities, not automatic defects.</p></header>
      {projection.timeline.pacing.length === 0 ? <p>No source-linked pacing observations are available.</p> : (
        <ul>{projection.timeline.pacing.map((item) => <li key={item.unitId}><strong>{item.unitId}</strong><span>{item.direction.replace(/-/g, ' ')}{item.isReviewOpportunity ? ' · review opportunity' : ''}</span>{item.positionRefs[0] ? <button type="button" onClick={() => onSourceReturn?.(item.positionRefs[0]!)}>Review source</button> : null}</li>)}</ul>
      )}
    </section>
  );
}

function PressureLens({ projection, onSourceReturn }: { readonly projection: Program6ProductionProjectionV1; readonly onSourceReturn?: (source: StoryPositionRefV1) => void }): JSX.Element {
  return (
    <section className="stage19-program6__lens" aria-label="Pressure detail">
      <header><h2>Pressure</h2><p>Urgency, consequence, constraint, and conflict remain independent. No universal pressure score is produced.</p></header>
      {projection.timeline.pressure.length === 0 ? <p>No source-linked pressure observations are available.</p> : (
        <ul>{projection.timeline.pressure.map((item) => <li key={item.eventId}><strong>{item.eventId}</strong><span>{Object.entries(item.dimensions).map(([dimension, band]) => `${dimension}: ${band}`).join(' · ') || 'No pressure dimensions recorded'}</span>{item.positionRefs[0] ? <button type="button" onClick={() => onSourceReturn?.(item.positionRefs[0]!)}>Review source</button> : null}</li>)}</ul>
      )}
    </section>
  );
}

function SignalsLens({
  projection,
  document,
  onSourceReturn,
  onSignalDisposition,
}: {
  readonly projection: Program6ProductionProjectionV1;
  readonly document: StoryIntelligenceDocumentV1;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onSignalDisposition?: (signalId: string, lifecycle: 'dismissed' | 'suppressed' | 'resolved' | 'converted') => void;
}): JSX.Element {
  return (
    <section className="stage19-program6__lens" aria-label="Signals detail" data-testid="program6-signals-lens">
      <header><h2>Signals</h2><p>Project-local findings remain advisory, qualitative, source-linked, currentness-labelled, and owner-routed.</p></header>
      <div className="stage19-program6__signal-posture"><span>Signal posture: <strong>{document.settings.signalPosture}</strong></span><span>Project posture: <strong>{document.settings.projectPosture}</strong></span></div>
      {projection.signals.length === 0 ? <p>No durable signals are waiting for review.</p> : (
        <ul className="stage19-program6__signals">
          {projection.signals.map((signal) => {
            const source = signal.positionRefs[0];
            const protectedSource = signal.provenance.protectionClass !== 'included' && signal.provenance.protectionClass !== 'deterministic-only' && signal.provenance.protectionClass !== 'local-only';
            return (
              <li key={signal.signalId} data-signal-id={signal.signalId} data-currentness={signal.currentness}>
                <div><strong>{protectedSource ? 'Protected signal metadata' : signal.summary}</strong><span>{signal.evidenceClass} · {signal.confidenceBand} confidence · {signal.currentness} · {signal.lifecycle}</span></div>
                <p>{protectedSource ? 'Content is excluded; no summary is displayed.' : signal.evidenceSummary}</p>
                <div className="stage19-program6__actions">
                  {source ? <button type="button" onClick={() => onSourceReturn?.(source)}>Review source</button> : null}
                  {signal.lifecycle === 'accepted' || signal.lifecycle === 'reviewed' ? <button type="button" onClick={() => onSignalDisposition?.(signal.signalId, 'dismissed')}>Dismiss</button> : null}
                  {signal.lifecycle === 'accepted' ? <button type="button" onClick={() => onSignalDisposition?.(signal.signalId, 'suppressed')}>Suppress</button> : null}
                  {signal.lifecycle === 'reviewed' ? <button type="button" onClick={() => onSignalDisposition?.(signal.signalId, 'resolved')}>Resolve</button> : null}
                  {signal.lifecycle === 'reviewed' ? <button type="button" disabled={signal.currentness !== 'current'} onClick={() => onSignalDisposition?.(signal.signalId, 'converted')}>Convert</button> : null}
                </div>
                {source ? <small>Source: {sourceLabel(source)} · provenance: {signal.provenance.origin} · citation required: {signal.provenance.citationRequired ? 'yes' : 'no'}</small> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Program6StoryKnowledgeWorkspace({
  project,
  generation,
  document,
  onSourceReturn,
  onSignalDisposition,
}: Program6StoryKnowledgeWorkspaceProps): JSX.Element {
  const [lens, setLens] = useState<Program6StoryKnowledgeLens>('overview');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const projection = buildProgram6ProductionProjection({ project, generation, document });
  const selectSource = (source: StoryPositionRefV1) => {
    setActionNotice(`Source return requested for ${sourceLabel(source)}.`);
    onSourceReturn?.(source);
  };
  const disposition = (signalId: string, lifecycle: 'dismissed' | 'suppressed' | 'resolved' | 'converted') => {
    setActionNotice(`Signal ${lifecycle} requested. The owning story-intelligence record remains authoritative.`);
    onSignalDisposition?.(signalId, lifecycle);
  };
  return (
    <section className="stage19-program6" aria-label="Story Knowledge workspace" data-testid="stage19-program6-story-knowledge">
      <header className="stage19-program6__header">
        <div><span className="stage19-spine__eyebrow">Program 6 · {project.title}</span><h2>Story Knowledge</h2><p>Source-linked story lenses for the current project. Advisory only.</p></div>
        <div className="stage19-program6__status"><span>Project-bound</span><span>{document.settings.analysisPolicy.optionalInferenceEnabled ? 'Manual inference enabled' : 'AI disabled'}</span></div>
      </header>
      <nav className="stage19-program6__lenses" aria-label="Story Knowledge lenses">
        {LENSES.map((item) => <button key={item.id} type="button" aria-current={lens === item.id ? 'page' : undefined} className={lens === item.id ? 'is-active' : ''} onClick={() => setLens(item.id)}>{item.label}</button>)}
      </nav>
      {actionNotice ? <p className="stage19-program6__notice" role="status">{actionNotice}</p> : null}
      {lens === 'overview' ? <LensSummary projection={projection} document={document} /> : null}
      {lens === 'emotion' ? <EmotionGraph projection={projection.emotion} onSelectPoint={(selection) => selection.positionRefs[0] && selectSource(selection.positionRefs[0])} /> : null}
      {lens === 'continuity' ? <ContinuityReview findings={projection.continuity.findings} onAction={(finding) => finding.positionRefs[0] && selectSource(finding.positionRefs[0])} /> : null}
      {lens === 'timeline' ? <TimelineReview result={projection.timeline} onAction={(finding) => finding.positionRefs[0] && selectSource(finding.positionRefs[0])} /> : null}
      {lens === 'pacing' ? <PacingLens projection={projection} onSourceReturn={selectSource} /> : null}
      {lens === 'pressure' ? <PressureLens projection={projection} onSourceReturn={selectSource} /> : null}
      {lens === 'signals' ? <SignalsLens projection={projection} document={document} onSourceReturn={selectSource} onSignalDisposition={disposition} /> : null}
    </section>
  );
}
