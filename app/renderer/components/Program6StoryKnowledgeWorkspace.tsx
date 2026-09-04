import { useEffect, useState } from 'react';

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

export interface EmotionRecordDraftV1 {
  readonly kind: 'emotion-graph';
  readonly unitId: string;
  readonly lane: 'planned' | 'observed';
  readonly label: string;
  readonly intensity: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  readonly subjectLabel?: string;
}

export type StoryKnowledgeAuthorRecordDraftV1 = EmotionRecordDraftV1 | {
  readonly kind: 'timeline-event';
  readonly unitId: string;
  readonly label: string;
  readonly storyWorldOrder: number;
  readonly temporalState: 'certain' | 'uncertain' | 'disputed' | 'simultaneous' | 'unavailable';
} | {
  readonly kind: 'pacing-intent';
  readonly unitId: string;
  readonly tempo: 'very-slow' | 'slow' | 'steady' | 'fast' | 'very-fast';
} | {
  readonly kind: 'pressure-point';
  readonly unitId: string;
  readonly lane: 'planned' | 'observed';
  readonly dimension: 'urgency' | 'consequence' | 'constraint' | 'conflict';
  readonly band: 'none' | 'low' | 'medium' | 'high' | 'very-high' | 'unknown';
};

export interface Program6StoryKnowledgeWorkspaceProps {
  readonly project: ProjectSpineProjectContext;
  readonly generation: number;
  readonly document: StoryIntelligenceDocumentV1;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onAuthorRecordCreate?: (draft: StoryKnowledgeAuthorRecordDraftV1) => void;
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

function EmotionLens({
  project,
  projection,
  onSourceReturn,
  onEmotionRecordCreate,
}: {
  readonly project: ProjectSpineProjectContext;
  readonly projection: Program6ProductionProjectionV1;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onEmotionRecordCreate?: (draft: EmotionRecordDraftV1) => void;
}): JSX.Element {
  const [unitId, setUnitId] = useState(project.units[0]?.id ?? '');
  const [lane, setLane] = useState<EmotionRecordDraftV1['lane']>('planned');
  const [label, setLabel] = useState('');
  const [intensity, setIntensity] = useState<EmotionRecordDraftV1['intensity']>('medium');
  const [subjectLabel, setSubjectLabel] = useState('');

  useEffect(() => {
    setUnitId(project.units[0]?.id ?? '');
    setLabel('');
    setSubjectLabel('');
  }, [project.projectId, project.units]);

  const submit = () => {
    const emotionLabel = label.trim();
    if (!unitId || !emotionLabel) return;
    onEmotionRecordCreate?.({
      kind: 'emotion-graph',
      unitId,
      lane,
      label: emotionLabel,
      intensity,
      ...(subjectLabel.trim() ? { subjectLabel: subjectLabel.trim() } : {}),
    });
    setLabel('');
  };

  return (
    <section className="stage19-program6__emotion" aria-label="Emotion detail">
      <EmotionGraph projection={projection.emotion} onSelectPoint={(selection) => selection.positionRefs[0] && onSourceReturn?.(selection.positionRefs[0])} />
      <form className="stage19-program6__emotion-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <header><h3>Add an emotion point</h3><p>No AI reading happens here. Record what you intend for a section or what you believe the current manuscript conveys.</p></header>
        <label><span>Story section</span><select aria-label="Emotion point story section" value={unitId} onChange={(event) => setUnitId(event.target.value)}>{project.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.displayTitle || unit.title}</option>)}</select></label>
        <label><span>Lane</span><select aria-label="Emotion point lane" value={lane} onChange={(event) => setLane(event.target.value as EmotionRecordDraftV1['lane'])}><option value="planned">Planned intent</option><option value="observed">Observed in manuscript</option></select></label>
        <label><span>Emotion</span><input aria-label="Emotion point label" value={label} maxLength={240} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. guarded hope" /></label>
        <label><span>Intensity</span><select aria-label="Emotion point intensity" value={intensity} onChange={(event) => setIntensity(event.target.value as EmotionRecordDraftV1['intensity'])}>{['very-low', 'low', 'medium', 'high', 'very-high'].map((value) => <option key={value} value={value}>{value.replace('-', ' ')}</option>)}</select></label>
        <label><span>Subject (optional)</span><input aria-label="Emotion point subject" value={subjectLabel} maxLength={160} onChange={(event) => setSubjectLabel(event.target.value)} placeholder="e.g. Mara" /></label>
        <button type="submit" disabled={!unitId || !label.trim()}>Save emotion point</button>
      </form>
    </section>
  );
}

function TimelineLens({ project, projection, onSourceReturn, onAuthorRecordCreate }: {
  readonly project: ProjectSpineProjectContext;
  readonly projection: Program6ProductionProjectionV1;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onAuthorRecordCreate?: (draft: StoryKnowledgeAuthorRecordDraftV1) => void;
}): JSX.Element {
  const [unitId, setUnitId] = useState(project.units[0]?.id ?? '');
  const [label, setLabel] = useState('');
  const [storyWorldOrder, setStoryWorldOrder] = useState(1);
  const [temporalState, setTemporalState] = useState<'certain' | 'uncertain' | 'disputed' | 'simultaneous' | 'unavailable'>('certain');
  useEffect(() => {
    setUnitId(project.units[0]?.id ?? '');
    setLabel('');
    setStoryWorldOrder(1);
  }, [project.projectId, project.units]);
  return <section className="stage19-program6__lens" aria-label="Timeline detail">
    <TimelineReview result={projection.timeline} onSourceReturn={onSourceReturn} onAction={(finding) => finding.positionRefs[0] && onSourceReturn?.(finding.positionRefs[0])} />
    <form className="stage19-program6__emotion-form" onSubmit={(event) => { event.preventDefault(); if (!unitId || !label.trim()) return; onAuthorRecordCreate?.({ kind: 'timeline-event', unitId, label: label.trim(), storyWorldOrder, temporalState }); setLabel(''); }}>
      <header><h3>Add a story-world event</h3><p>You name the event and its story-world order. Manuscript order remains separate.</p></header>
      <label><span>Story section</span><select aria-label="Timeline event story section" value={unitId} onChange={(event) => setUnitId(event.target.value)}>{project.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.displayTitle}</option>)}</select></label>
      <label><span>Event</span><input aria-label="Timeline event label" value={label} maxLength={240} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Mara finds the sealed letter" /></label>
      <label><span>Story-world order</span><input aria-label="Timeline story-world order" type="number" min="0" step="1" value={storyWorldOrder} onChange={(event) => setStoryWorldOrder(Math.max(0, Number.parseInt(event.target.value || '0', 10)))} /></label>
      <label><span>Certainty</span><select aria-label="Timeline certainty" value={temporalState} onChange={(event) => setTemporalState(event.target.value as typeof temporalState)}>{['certain', 'uncertain', 'disputed', 'simultaneous', 'unavailable'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <button type="submit" disabled={!unitId || !label.trim()}>Save timeline event</button>
    </form>
  </section>;
}

function PacingLens({ project, projection, onSourceReturn, onAuthorRecordCreate }: { readonly project: ProjectSpineProjectContext; readonly projection: Program6ProductionProjectionV1; readonly onSourceReturn?: (source: StoryPositionRefV1) => void; readonly onAuthorRecordCreate?: (draft: StoryKnowledgeAuthorRecordDraftV1) => void }): JSX.Element {
  const [unitId, setUnitId] = useState(project.units[0]?.id ?? '');
  const [tempo, setTempo] = useState<'very-slow' | 'slow' | 'steady' | 'fast' | 'very-fast'>('steady');
  const titleByUnit = new Map(project.units.map((unit) => [unit.id, unit.displayTitle]));
  useEffect(() => setUnitId(project.units[0]?.id ?? ''), [project.projectId, project.units]);
  return (
    <section className="stage19-program6__lens" aria-label="Pacing detail">
      <header><h2>Pacing</h2><p>Measured structure and author pacing intent stay separate. Length is evidence, not a pace-quality score.</p></header>
      {projection.timeline.pacing.length === 0 ? <p>No source-linked pacing measurements are available.</p> : (
        <ul>{projection.timeline.pacing.map((item) => <li key={item.unitId}><strong>{titleByUnit.get(item.unitId) ?? item.unitId}</strong><span>{item.observedWordCount ?? 0} words · {item.observedSentenceCount ?? 0} sentences · {item.observedParagraphCount ?? 0} paragraphs · {Math.round((item.observedDialogueRatio ?? 0) * 100)}% dialogue · {item.relativeLength ?? 'unclassified'} relative length{item.plannedTempo ? ` · planned ${item.plannedTempo}` : ' · no pacing intent recorded'}</span>{item.positionRefs[0] ? <button type="button" onClick={() => onSourceReturn?.(item.positionRefs[0]!)}>Review source</button> : null}</li>)}</ul>
      )}
      <form className="stage19-program6__emotion-form" onSubmit={(event) => { event.preventDefault(); if (unitId) onAuthorRecordCreate?.({ kind: 'pacing-intent', unitId, tempo }); }}>
        <header><h3>Add pacing intent</h3><p>Word, sentence, paragraph, and dialogue counts are measured. The intended tempo is yours.</p></header>
        <label><span>Story section</span><select aria-label="Pacing intent story section" value={unitId} onChange={(event) => setUnitId(event.target.value)}>{project.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.displayTitle}</option>)}</select></label>
        <label><span>Intended tempo</span><select aria-label="Pacing intended tempo" value={tempo} onChange={(event) => setTempo(event.target.value as typeof tempo)}>{['very-slow', 'slow', 'steady', 'fast', 'very-fast'].map((value) => <option key={value} value={value}>{value.replace('-', ' ')}</option>)}</select></label>
        <button type="submit" disabled={!unitId}>Save pacing intent</button>
      </form>
    </section>
  );
}

function PressureLens({ project, projection, onSourceReturn, onAuthorRecordCreate }: { readonly project: ProjectSpineProjectContext; readonly projection: Program6ProductionProjectionV1; readonly onSourceReturn?: (source: StoryPositionRefV1) => void; readonly onAuthorRecordCreate?: (draft: StoryKnowledgeAuthorRecordDraftV1) => void }): JSX.Element {
  const [unitId, setUnitId] = useState(project.units[0]?.id ?? '');
  const [lane, setLane] = useState<'planned' | 'observed'>('planned');
  const [dimension, setDimension] = useState<'urgency' | 'consequence' | 'constraint' | 'conflict'>('urgency');
  const [band, setBand] = useState<'none' | 'low' | 'medium' | 'high' | 'very-high' | 'unknown'>('medium');
  const titleByUnit = new Map(project.units.map((unit) => [unit.id, unit.displayTitle]));
  useEffect(() => setUnitId(project.units[0]?.id ?? ''), [project.projectId, project.units]);
  return (
    <section className="stage19-program6__lens" aria-label="Pressure detail">
      <header><h2>Pressure</h2><p>Urgency, consequence, constraint, and conflict remain independent. No universal pressure score is produced.</p></header>
      {projection.timeline.pressure.length === 0 ? <p>No source-linked pressure observations are available.</p> : (
        <ul>{projection.timeline.pressure.map((item) => <li key={item.eventId}><strong>{titleByUnit.get(item.eventId) ?? item.eventId}</strong><span>planned: {Object.entries(item.plannedDimensions).map(([key, value]) => `${key} ${value}`).join(' · ') || 'none'}; observed: {Object.entries(item.observedDimensions).map(([key, value]) => `${key} ${value}`).join(' · ') || 'none'}</span>{item.positionRefs[0] ? <button type="button" onClick={() => onSourceReturn?.(item.positionRefs[0]!)}>Review source</button> : null}</li>)}</ul>
      )}
      <form className="stage19-program6__emotion-form" onSubmit={(event) => { event.preventDefault(); if (unitId) onAuthorRecordCreate?.({ kind: 'pressure-point', unitId, lane, dimension, band }); }}>
        <header><h3>Add a pressure point</h3><p>Record one dimension at a time. Planned intent and your observation remain visibly separate.</p></header>
        <label><span>Story section</span><select aria-label="Pressure point story section" value={unitId} onChange={(event) => setUnitId(event.target.value)}>{project.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.displayTitle}</option>)}</select></label>
        <label><span>Lane</span><select aria-label="Pressure point lane" value={lane} onChange={(event) => setLane(event.target.value as typeof lane)}><option value="planned">Planned intent</option><option value="observed">Observed by author</option></select></label>
        <label><span>Dimension</span><select aria-label="Pressure point dimension" value={dimension} onChange={(event) => setDimension(event.target.value as typeof dimension)}>{['urgency', 'consequence', 'constraint', 'conflict'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Band</span><select aria-label="Pressure point band" value={band} onChange={(event) => setBand(event.target.value as typeof band)}>{['none', 'low', 'medium', 'high', 'very-high', 'unknown'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <button type="submit" disabled={!unitId}>Save pressure point</button>
      </form>
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
      <header><h2>Signals</h2><p>Signals are saved story concerns or observations the author chooses to keep track of. They remain advisory and never change prose or canon.</p></header>
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
  onAuthorRecordCreate,
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
  const saveAuthorRecord = (draft: StoryKnowledgeAuthorRecordDraftV1) => {
    const label = draft.kind === 'emotion-graph' ? `${draft.lane} emotion`
      : draft.kind === 'timeline-event' ? 'timeline event'
        : draft.kind === 'pacing-intent' ? 'pacing intent'
          : `${draft.lane} pressure point`;
    setActionNotice(`Saving ${label} for ${draft.unitId}. The manuscript will not be changed.`);
    onAuthorRecordCreate?.(draft);
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
      {lens === 'emotion' ? <EmotionLens project={project} projection={projection} onSourceReturn={selectSource} onEmotionRecordCreate={(draft) => {
        saveAuthorRecord(draft);
      }} /> : null}
      {lens === 'continuity' ? <ContinuityReview findings={projection.continuity.findings} onAction={(finding) => finding.positionRefs[0] && selectSource(finding.positionRefs[0])} /> : null}
      {lens === 'timeline' ? <TimelineLens project={project} projection={projection} onSourceReturn={selectSource} onAuthorRecordCreate={saveAuthorRecord} /> : null}
      {lens === 'pacing' ? <PacingLens project={project} projection={projection} onSourceReturn={selectSource} onAuthorRecordCreate={saveAuthorRecord} /> : null}
      {lens === 'pressure' ? <PressureLens project={project} projection={projection} onSourceReturn={selectSource} onAuthorRecordCreate={saveAuthorRecord} /> : null}
      {lens === 'signals' ? <SignalsLens projection={projection} document={document} onSourceReturn={selectSource} onSignalDisposition={disposition} /> : null}
    </section>
  );
}
