import { useEffect, useState } from 'react';

import type {
  StoryIntelligenceDocumentV1,
  StoryPositionRefV1,
} from '../../shared/ipc/storyIntelligence';
import {
  AUTOMATIC_STORY_INTELLIGENCE_LENSES,
  AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
  type AutomaticStoryIntelligenceFindingV1,
  type AutomaticStoryIntelligenceRunStateV1,
} from '../../shared/ipc/automaticStoryIntelligence';
import type { ContinuityAllowedActionV1, ContinuityFindingV1 } from '../../shared/continuity';
import type { EmotionGraphCandidatePointV1 } from '../../shared/emotionGraph';
import {
  buildProgram6ProductionProjection,
  type Program6ProductionProjectionV1,
} from '../../shared/program6ProductionProjection';
import ContinuityReview from './ContinuityReview';
import EmotionGraph from './EmotionGraph';
import TimelineReview from './TimelineReview';
import type { ProjectSpineProjectContext } from '../../shared/ipc/projectSpine';
import {
  buildProgram7SourceEnvelope,
  type Program7SourceEnvelopeV1,
} from '../../shared/program7SourceBinding';
import type { TimelineAllowedActionV1, TimelineFindingV1 } from '../../shared/timeline';

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

export type StoryKnowledgeAuthorRecordDraftV1 =
  | EmotionRecordDraftV1
  | {
      readonly kind: 'timeline-event';
      readonly unitId: string;
      readonly label: string;
      readonly storyWorldOrder: number;
      readonly temporalState: 'certain' | 'uncertain' | 'disputed' | 'simultaneous' | 'unavailable';
    }
  | {
      readonly kind: 'pacing-intent';
      readonly unitId: string;
      readonly tempo: 'very-slow' | 'slow' | 'steady' | 'fast' | 'very-fast';
    }
  | {
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
  readonly onEnableLocalInference?: () => void;
  readonly onSignalDisposition?: (
    signalId: string,
    lifecycle: 'dismissed' | 'suppressed' | 'resolved' | 'converted',
  ) => void;
  readonly onWorkOnThis?: (envelope: Program7SourceEnvelopeV1) => void;
  readonly onContinuityAction?: (
    finding: ContinuityFindingV1,
    action: ContinuityAllowedActionV1,
  ) => void;
  readonly onTimelineAction?: (finding: TimelineFindingV1, action: TimelineAllowedActionV1) => void;
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

function signalHandlingLabel(
  value: StoryIntelligenceDocumentV1['settings']['signalPosture'],
): string {
  const labels: Record<typeof value, string> = {
    off: 'Off — do not collect concerns',
    'ask-only': 'Ask first — record only when you choose',
    quiet: 'Quiet — keep concerns out of the way until you review them',
    alert: 'Alert — bring concerns needing attention forward',
  };
  return labels[value];
}

function projectStageLabel(
  value: StoryIntelligenceDocumentV1['settings']['projectPosture'],
): string {
  const labels: Record<typeof value, string> = {
    explore: 'Exploring — discovering the story',
    develop: 'Developing — shaping the story',
    finish: 'Finishing — preparing the story for completion',
  };
  return labels[value];
}

function LensSummary({
  projection,
  document,
}: {
  readonly projection: Program6ProductionProjectionV1;
  readonly document: StoryIntelligenceDocumentV1;
  readonly sourceDrafts?: Readonly<Record<string, string>>;
}): JSX.Element {
  return (
    <section className="stage19-program6__overview" aria-label="Story Knowledge overview">
      <header>
        <h2>Overview</h2>
        <p>What this project covers and what remains in your hands.</p>
      </header>
      <dl className="stage19-program6__facts">
        <div>
          <dt>Project</dt>
          <dd>Current project only</dd>
        </div>
        <div>
          <dt>Story sections</dt>
          <dd>{projection.sourceUnitCount}</dd>
        </div>
        <div>
          <dt>Story concerns</dt>
          <dd>{signalHandlingLabel(document.settings.signalPosture)}</dd>
        </div>
        <div>
          <dt>Project mode</dt>
          <dd>{projectStageLabel(document.settings.projectPosture)}</dd>
        </div>
        <div>
          <dt>Source-based review</dt>
          <dd>{document.settings.analysisPolicy.deterministicEnabled ? 'Available' : 'Off'}</dd>
        </div>
        <div>
          <dt>Optional interpretation</dt>
          <dd>
            {document.settings.analysisPolicy.optionalInferenceEnabled
              ? 'Available when you choose'
              : 'Off — no AI is used'}
          </dd>
        </div>
      </dl>
      <p className="stage19-program6__boundary">
        This is review support only. It never becomes story canon, edits your prose, judges quality,
        or saves lasting memory.
      </p>
    </section>
  );
}

function scanId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function AutomaticScanPanel({
  state,
  busy,
  notice,
  onScan,
  onLocalEmotionScan,
  onCancel,
  onSourceReturn,
  localInferenceEnabled,
  onEnableLocalInference,
}: {
  readonly state: AutomaticStoryIntelligenceRunStateV1 | null;
  readonly busy: boolean;
  readonly notice: string | null;
  readonly onScan: () => void;
  readonly onLocalEmotionScan: () => void;
  readonly onCancel: () => void;
  readonly onSourceReturn: (source: StoryPositionRefV1) => void;
  readonly localInferenceEnabled: boolean;
  readonly onEnableLocalInference?: () => void;
}): JSX.Element {
  const findings = state?.analysis?.lensResults.flatMap((result) => result.findings) ?? [];
  return (
    <section className="stage19-program6__automatic-scan" aria-label="Automatic manuscript scan">
      <header>
        <h3>Automatic manuscript scan</h3>
        <p>
          Read-only review prompts from the saved manuscript. Keyword/rhythm prompts are not AI
          judgments. Local-AI emotion results are temporary, advisory, and source-linked.
        </p>
      </header>
      <div className="stage19-program6__automatic-scan-actions">
        <button type="button" onClick={onScan} disabled={busy}>
          {busy ? 'Scanning manuscript…' : 'Scan manuscript automatically'}
        </button>
        <button type="button" onClick={onLocalEmotionScan} disabled={busy || !localInferenceEnabled}>
          {busy ? 'Analyzing emotion…' : 'Analyze emotion with local AI'}
        </button>
        {busy ? (
          <button type="button" onClick={onCancel}>Cancel scan</button>
        ) : null}
      </div>
      {notice ? <p role="status">{notice}</p> : null}
      {state ? (
        <div aria-live="polite">
          <p>
            Scan status: <strong>{state.status}</strong>. Checked {state.progress.includedUnitCount}{' '}
            saved section{state.progress.includedUnitCount === 1 ? '' : 's'} and found{' '}
            {state.progress.findingCount} review prompt{state.progress.findingCount === 1 ? '' : 's'}.
          </p>
          {state.progress.excludedUnitCount > 0 ? (
            <p>{state.progress.excludedUnitCount} section{state.progress.excludedUnitCount === 1 ? '' : 's'} were excluded by policy or unavailable.</p>
          ) : null}
          {state.error ? <p>{state.error.message}</p> : null}
          {findings.length > 0 ? (
            <ul className="stage19-program6__automatic-scan-findings">
              {findings.map((finding: AutomaticStoryIntelligenceFindingV1) => {
                const source = finding.positionRefs[0];
                return (
                  <li key={finding.findingId}>
                    <strong>{finding.lens}</strong>: {finding.summary}
                    {source ? (
                      <button type="button" onClick={() => onSourceReturn(source)}>
                        Return to source
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : state.status === 'completed' ? (
            <p>{state.origin === 'local-inference'
              ? 'The local model returned no emotional observations for this saved snapshot.'
              : 'No deterministic review prompts were found in this saved snapshot.'}</p>
          ) : null}
        </div>
      ) : null}
      {state?.origin === 'local-inference' ? <small>Model: qwen3:4b · loopback only · temporary advisory results</small> : null}
      {!localInferenceEnabled ? (
        <p>
          Local AI is disabled by this project policy.{' '}
          {onEnableLocalInference ? (
            <button type="button" onClick={onEnableLocalInference}>Enable optional interpretation</button>
          ) : 'Enable optional interpretation before running it.'}
        </p>
      ) : null}
      <small>Available lenses: {AUTOMATIC_STORY_INTELLIGENCE_LENSES.join(', ')}.</small>
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
      <EmotionGraph
        projection={projection.emotion}
        onSelectPoint={(selection) =>
          selection.positionRefs[0] && onSourceReturn?.(selection.positionRefs[0])
        }
      />
      <form
        className="stage19-program6__emotion-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <header>
          <h3>Record the feeling for a section</h3>
          <p>
            Note the feeling you want a section to carry, or the feeling you think it currently
            conveys. This is your note; the app does not read the prose.
          </p>
        </header>
        <label>
          <span>Story section</span>
          <select
            aria-label="Emotion point story section"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
          >
            {project.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.displayTitle || unit.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Record as</span>
          <select
            aria-label="Emotion point lane"
            value={lane}
            onChange={(event) => setLane(event.target.value as EmotionRecordDraftV1['lane'])}
          >
            <option value="planned">Planned intent</option>
            <option value="observed">Observed in manuscript</option>
          </select>
        </label>
        <label>
          <span>Feeling</span>
          <input
            aria-label="Emotion point label"
            value={label}
            maxLength={240}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="e.g. guarded hope"
          />
        </label>
        <label>
          <span>Intensity</span>
          <select
            aria-label="Emotion point intensity"
            value={intensity}
            onChange={(event) =>
              setIntensity(event.target.value as EmotionRecordDraftV1['intensity'])
            }
          >
            {['very-low', 'low', 'medium', 'high', 'very-high'].map((value) => (
              <option key={value} value={value}>
                {value.replace('-', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Subject (optional)</span>
          <input
            aria-label="Emotion point subject"
            value={subjectLabel}
            maxLength={160}
            onChange={(event) => setSubjectLabel(event.target.value)}
            placeholder="e.g. Mara"
          />
        </label>
        <button type="submit" disabled={!unitId || !label.trim()}>
          Save feeling note
        </button>
      </form>
    </section>
  );
}

function TimelineLens({
  project,
  projection,
  onSourceReturn,
  onAuthorRecordCreate,
  onAction,
}: {
  readonly project: ProjectSpineProjectContext;
  readonly projection: Program6ProductionProjectionV1;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onAuthorRecordCreate?: (draft: StoryKnowledgeAuthorRecordDraftV1) => void;
  readonly onAction?: (finding: TimelineFindingV1, action: TimelineAllowedActionV1) => void;
}): JSX.Element {
  const [unitId, setUnitId] = useState(project.units[0]?.id ?? '');
  const [label, setLabel] = useState('');
  const [storyWorldOrder, setStoryWorldOrder] = useState(1);
  const [temporalState, setTemporalState] = useState<
    'certain' | 'uncertain' | 'disputed' | 'simultaneous' | 'unavailable'
  >('certain');
  useEffect(() => {
    setUnitId(project.units[0]?.id ?? '');
    setLabel('');
    setStoryWorldOrder(1);
  }, [project.projectId, project.units]);
  return (
    <section className="stage19-program6__lens" aria-label="Timeline detail">
      <TimelineReview
        result={projection.timeline}
        onSourceReturn={onSourceReturn}
        onAction={onAction}
      />
      <form
        className="stage19-program6__emotion-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!unitId || !label.trim()) return;
          onAuthorRecordCreate?.({
            kind: 'timeline-event',
            unitId,
            label: label.trim(),
            storyWorldOrder,
            temporalState,
          });
          setLabel('');
        }}
      >
        <header>
          <h3>Record a story event</h3>
          <p>
            Name an event and place it in story time. The order in your manuscript stays separate.
          </p>
        </header>
        <label>
          <span>Story section</span>
          <select
            aria-label="Timeline event story section"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
          >
            {project.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.displayTitle}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Event</span>
          <input
            aria-label="Timeline event label"
            value={label}
            maxLength={240}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="e.g. Mara finds the sealed letter"
          />
        </label>
        <label>
          <span>Story order</span>
          <input
            aria-label="Timeline story-world order"
            type="number"
            min="0"
            step="1"
            value={storyWorldOrder}
            onChange={(event) =>
              setStoryWorldOrder(Math.max(0, Number.parseInt(event.target.value || '0', 10)))
            }
          />
        </label>
        <label>
          <span>Certainty</span>
          <select
            aria-label="Timeline certainty"
            value={temporalState}
            onChange={(event) => setTemporalState(event.target.value as typeof temporalState)}
          >
            {['certain', 'uncertain', 'disputed', 'simultaneous', 'unavailable'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!unitId || !label.trim()}>
          Save story event
        </button>
      </form>
    </section>
  );
}

function PacingLens({
  project,
  projection,
  onSourceReturn,
  onAuthorRecordCreate,
}: {
  readonly project: ProjectSpineProjectContext;
  readonly projection: Program6ProductionProjectionV1;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onAuthorRecordCreate?: (draft: StoryKnowledgeAuthorRecordDraftV1) => void;
}): JSX.Element {
  const [unitId, setUnitId] = useState(project.units[0]?.id ?? '');
  const [tempo, setTempo] = useState<'very-slow' | 'slow' | 'steady' | 'fast' | 'very-fast'>(
    'steady',
  );
  const titleByUnit = new Map(project.units.map((unit) => [unit.id, unit.displayTitle]));
  useEffect(() => setUnitId(project.units[0]?.id ?? ''), [project.projectId, project.units]);
  return (
    <section className="stage19-program6__lens" aria-label="Pacing detail">
      <header>
        <h2>Pacing</h2>
        <p>
          Measured structure and author pacing intent stay separate. Length is evidence, not a
          pace-quality score.
        </p>
      </header>
      {projection.timeline.pacing.length === 0 ? (
        <p>No source-linked pacing measurements are available.</p>
      ) : (
        <ul>
          {projection.timeline.pacing.map((item) => (
            <li key={item.unitId}>
              <strong>{titleByUnit.get(item.unitId) ?? item.unitId}</strong>
              <span>
                {item.observedWordCount ?? 0} words · {item.observedSentenceCount ?? 0} sentences ·{' '}
                {item.observedParagraphCount ?? 0} paragraphs ·{' '}
                {Math.round((item.observedDialogueRatio ?? 0) * 100)}% dialogue ·{' '}
                {item.relativeLength ?? 'unclassified'} relative length
                {item.plannedTempo
                  ? ` · planned ${item.plannedTempo}`
                  : ' · no pacing intent recorded'}
              </span>
              {item.positionRefs[0] ? (
                <button type="button" onClick={() => onSourceReturn?.(item.positionRefs[0]!)}>
                  Review source
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form
        className="stage19-program6__emotion-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (unitId) onAuthorRecordCreate?.({ kind: 'pacing-intent', unitId, tempo });
        }}
      >
        <header>
          <h3>Set the pace you want</h3>
          <p>
            Word, sentence, paragraph, and dialogue counts are measured. The pace you want is yours
            to choose.
          </p>
        </header>
        <label>
          <span>Story section</span>
          <select
            aria-label="Pacing intent story section"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
          >
            {project.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.displayTitle}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Intended tempo</span>
          <select
            aria-label="Pacing intended tempo"
            value={tempo}
            onChange={(event) => setTempo(event.target.value as typeof tempo)}
          >
            {['very-slow', 'slow', 'steady', 'fast', 'very-fast'].map((value) => (
              <option key={value} value={value}>
                {value.replace('-', ' ')}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!unitId}>
          Save pacing intent
        </button>
      </form>
    </section>
  );
}

function PressureLens({
  project,
  projection,
  onSourceReturn,
  onAuthorRecordCreate,
}: {
  readonly project: ProjectSpineProjectContext;
  readonly projection: Program6ProductionProjectionV1;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onAuthorRecordCreate?: (draft: StoryKnowledgeAuthorRecordDraftV1) => void;
}): JSX.Element {
  const [unitId, setUnitId] = useState(project.units[0]?.id ?? '');
  const [lane, setLane] = useState<'planned' | 'observed'>('planned');
  const [dimension, setDimension] = useState<'urgency' | 'consequence' | 'constraint' | 'conflict'>(
    'urgency',
  );
  const [band, setBand] = useState<'none' | 'low' | 'medium' | 'high' | 'very-high' | 'unknown'>(
    'medium',
  );
  const titleByUnit = new Map(project.units.map((unit) => [unit.id, unit.displayTitle]));
  useEffect(() => setUnitId(project.units[0]?.id ?? ''), [project.projectId, project.units]);
  return (
    <section className="stage19-program6__lens" aria-label="Pressure detail">
      <header>
        <h2>Pressure</h2>
        <p>
          Urgency, consequence, constraint, and conflict remain independent. No universal pressure
          score is produced.
        </p>
      </header>
      {projection.timeline.pressure.length === 0 ? (
        <p>No source-linked pressure observations are available.</p>
      ) : (
        <ul>
          {projection.timeline.pressure.map((item) => (
            <li key={item.eventId}>
              <strong>{titleByUnit.get(item.eventId) ?? item.eventId}</strong>
              <span>
                planned:{' '}
                {Object.entries(item.plannedDimensions)
                  .map(([key, value]) => `${key} ${value}`)
                  .join(' · ') || 'none'}
                ; observed:{' '}
                {Object.entries(item.observedDimensions)
                  .map(([key, value]) => `${key} ${value}`)
                  .join(' · ') || 'none'}
              </span>
              {item.positionRefs[0] ? (
                <button type="button" onClick={() => onSourceReturn?.(item.positionRefs[0]!)}>
                  Review source
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form
        className="stage19-program6__emotion-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (unitId)
            onAuthorRecordCreate?.({ kind: 'pressure-point', unitId, lane, dimension, band });
        }}
      >
        <header>
          <h3>Note a source of pressure</h3>
          <p>
            Record one kind of pressure at a time. What you planned and what you observe stay
            separate.
          </p>
        </header>
        <label>
          <span>Story section</span>
          <select
            aria-label="Pressure point story section"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
          >
            {project.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.displayTitle}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Record as</span>
          <select
            aria-label="Pressure point lane"
            value={lane}
            onChange={(event) => setLane(event.target.value as typeof lane)}
          >
            <option value="planned">Planned intent</option>
            <option value="observed">Observed by author</option>
          </select>
        </label>
        <label>
          <span>Kind of pressure</span>
          <select
            aria-label="Pressure point dimension"
            value={dimension}
            onChange={(event) => setDimension(event.target.value as typeof dimension)}
          >
            {['urgency', 'consequence', 'constraint', 'conflict'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Strength</span>
          <select
            aria-label="Pressure point band"
            value={band}
            onChange={(event) => setBand(event.target.value as typeof band)}
          >
            {['none', 'low', 'medium', 'high', 'very-high', 'unknown'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!unitId}>
          Save pressure point
        </button>
      </form>
    </section>
  );
}

function SignalsLens({
  projection,
  document,
  onSourceReturn,
  onSignalDisposition,
  onWorkOnThis,
  sourceDrafts,
}: {
  readonly projection: Program6ProductionProjectionV1;
  readonly document: StoryIntelligenceDocumentV1;
  readonly sourceDrafts?: Readonly<Record<string, string>>;
  readonly onSourceReturn?: (source: StoryPositionRefV1) => void;
  readonly onSignalDisposition?: (
    signalId: string,
    lifecycle: 'dismissed' | 'suppressed' | 'resolved' | 'converted',
  ) => void;
  readonly onWorkOnThis?: (envelope: Program7SourceEnvelopeV1) => void;
}): JSX.Element {
  return (
    <section
      className="stage19-program6__lens"
      aria-label="Signals detail"
      data-testid="program6-signals-lens"
    >
      <header>
        <h2>Signals</h2>
        <p>
          Signals are saved story concerns or observations the author chooses to keep track of. They
          remain advisory and never change prose or canon.
        </p>
      </header>
      <div className="stage19-program6__signal-posture">
        <span>
          Story concerns: <strong>{signalHandlingLabel(document.settings.signalPosture)}</strong>
        </span>
        <span>
          Project mode: <strong>{projectStageLabel(document.settings.projectPosture)}</strong>
        </span>
      </div>
      {projection.signals.length === 0 ? (
        <p>No durable signals are waiting for review.</p>
      ) : (
        <ul className="stage19-program6__signals">
          {projection.signals.map((signal) => {
            const source = signal.positionRefs[0];
            const protectedSource =
              signal.provenance.protectionClass !== 'included' &&
              signal.provenance.protectionClass !== 'deterministic-only' &&
              signal.provenance.protectionClass !== 'local-only';
            return (
              <li
                key={signal.signalId}
                data-signal-id={signal.signalId}
                data-currentness={signal.currentness}
              >
                <div>
                  <strong>{protectedSource ? 'Protected signal metadata' : signal.summary}</strong>
                  <span>
                    {signal.evidenceClass} · {signal.confidenceBand} confidence ·{' '}
                    {signal.currentness} · {signal.lifecycle}
                  </span>
                </div>
                <p>
                  {protectedSource
                    ? 'Content is excluded; no summary is displayed.'
                    : signal.evidenceSummary}
                </p>
                <div className="stage19-program6__actions">
                  {source ? (
                    <button type="button" onClick={() => onSourceReturn?.(source)}>
                      Review source
                    </button>
                  ) : null}
                  {signal.lifecycle === 'accepted' || signal.lifecycle === 'reviewed' ? (
                    <button
                      type="button"
                      onClick={() => onSignalDisposition?.(signal.signalId, 'dismissed')}
                    >
                      Dismiss
                    </button>
                  ) : null}
                  {signal.lifecycle === 'accepted' ? (
                    <button
                      type="button"
                      onClick={() => onSignalDisposition?.(signal.signalId, 'suppressed')}
                    >
                      Suppress
                    </button>
                  ) : null}
                  {signal.lifecycle === 'reviewed' ? (
                    <button
                      type="button"
                      onClick={() => onSignalDisposition?.(signal.signalId, 'resolved')}
                    >
                      Resolve
                    </button>
                  ) : null}
                  {signal.lifecycle === 'reviewed' ? (
                    <button
                      type="button"
                      disabled={signal.currentness !== 'current'}
                      onClick={() => onSignalDisposition?.(signal.signalId, 'converted')}
                    >
                      Convert
                    </button>
                  ) : null}
                  {source && signal.currentness === 'current' ? (
                    <button
                      type="button"
                      onClick={() => {
                        void buildProgram7SourceEnvelope({
                          projectId: signal.projectId,
                          generation: projection.generation,
                          unitId: source.unitId ?? source.sourceId,
                          sourceId: source.sourceId,
                          sourceKind: source.sourceKind,
                          sourceRevision: source.sourceRevision,
                          sourceFingerprint: source.sourceFingerprint,
                          sourceClass: signal.provenance.protectionClass,
                          sourceText: sourceDrafts?.[source.unitId ?? source.sourceId],
                          bodySha256: source.bodySha256,
                          selectionFingerprint: source.selectionFingerprint,
                          selectionStart: source.selectionStart,
                          selectionEnd: source.selectionEnd,
                          signalId: signal.signalId,
                          lens: 'signals',
                          evidenceSummary: protectedSource ? undefined : signal.evidenceSummary,
                        }).then((envelope) => onWorkOnThis?.(envelope));
                      }}
                    >
                      Work on this
                    </button>
                  ) : null}
                </div>
                {source ? (
                  <small>
                    Source: {sourceLabel(source)} · provenance: {signal.provenance.origin} ·
                    citation required: {signal.provenance.citationRequired ? 'yes' : 'no'}
                  </small>
                ) : null}
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
  onEnableLocalInference,
  onSignalDisposition,
  onWorkOnThis,
  onContinuityAction,
  onTimelineAction,
}: Program6StoryKnowledgeWorkspaceProps): JSX.Element {
  const [lens, setLens] = useState<Program6StoryKnowledgeLens>('overview');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [automaticScan, setAutomaticScan] = useState<AutomaticStoryIntelligenceRunStateV1 | null>(null);
  const [automaticRun, setAutomaticRun] = useState<{ readonly runId: string; readonly analysisId: string } | null>(null);
  const [automaticScanBusy, setAutomaticScanBusy] = useState(false);
  const [automaticScanNotice, setAutomaticScanNotice] = useState<string | null>(null);
  const automaticEmotionCandidates: EmotionGraphCandidatePointV1[] = automaticScan?.status === 'completed' && automaticScan.origin === 'local-inference'
    ? (automaticScan.analysis?.lensResults.find((result) => result.lens === 'emotion')?.findings ?? []).flatMap((finding) => finding.emotionLabel && finding.intensityBand ? [{
        schemaVersion: 'BlackSkiesEmotionGraph v1',
        candidateId: finding.findingId,
        projectId: finding.projectId,
        lane: 'inferred' as const,
        emotionLabel: finding.emotionLabel,
        intensity: finding.intensityBand,
        ...(finding.subjectLabel ? { subjectLabel: finding.subjectLabel } : {}),
        positionRefs: finding.positionRefs,
        sourceOwner: finding.provenance.sourceOwner,
        provenance: finding.provenance,
        currentness: 'current' as const,
        temporary: true as const,
        createdAt: automaticScan.analysis?.createdAt ?? new Date().toISOString(),
      }] : [])
    : [];
  const projection = buildProgram6ProductionProjection({
    project,
    generation,
    document,
    automaticEmotionCandidates,
  });
  const selectSource = (source: StoryPositionRefV1) => {
    setActionNotice(`Source return requested for ${sourceLabel(source)}.`);
    onSourceReturn?.(source);
  };
  const disposition = (
    signalId: string,
    lifecycle: 'dismissed' | 'suppressed' | 'resolved' | 'converted',
  ) => {
    setActionNotice(
      `Signal ${lifecycle} requested. The owning story-intelligence record remains authoritative.`,
    );
    onSignalDisposition?.(signalId, lifecycle);
  };
  const continuityAction = (finding: ContinuityFindingV1, action: ContinuityAllowedActionV1) => {
    if (action === 'return-to-source') {
      const source = finding.positionRefs[0];
      if (source) selectSource(source);
      return;
    }
    setActionNotice(
      `Continuity action ${action.replace(/-/g, ' ')} requested. No source navigation or manuscript change was made.`,
    );
    onContinuityAction?.(finding, action);
  };
  const timelineAction = (finding: TimelineFindingV1, action: TimelineAllowedActionV1) => {
    if (action === 'return-to-source') {
      const source = finding.positionRefs[0];
      if (source) selectSource(source);
      return;
    }
    setActionNotice(
      `Timeline action ${action.replace(/-/g, ' ')} requested. No source navigation or manuscript change was made.`,
    );
    onTimelineAction?.(finding, action);
  };
  const saveAuthorRecord = (draft: StoryKnowledgeAuthorRecordDraftV1) => {
    const label =
      draft.kind === 'emotion-graph'
        ? `${draft.lane} emotion`
        : draft.kind === 'timeline-event'
          ? 'timeline event'
          : draft.kind === 'pacing-intent'
            ? 'pacing intent'
            : `${draft.lane} pressure point`;
    setActionNotice(`Saving ${label} for ${draft.unitId}. The manuscript will not be changed.`);
    onAuthorRecordCreate?.(draft);
  };
  const runAutomaticScan = async (origin: 'deterministic' | 'local-inference' = 'deterministic') => {
    const bridge = window.storyIntelligence;
    if (!bridge) {
      setAutomaticScanNotice('Automatic manuscript scanning is unavailable in this window.');
      return;
    }
    const runId = scanId('automatic-story-scan');
    const analysisId = scanId('analysis');
    setAutomaticScanBusy(true);
    setAutomaticRun({ runId, analysisId });
    setAutomaticScanNotice(null);
    try {
      const result = await bridge.automaticScan({
        schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
        operationId: scanId('automatic-scan-operation'),
        projectId: project.projectId,
        projectPath: project.path,
        generation,
        runId,
        analysisId,
        requestedAt: new Date().toISOString(),
        origin,
        lenses: [...AUTOMATIC_STORY_INTELLIGENCE_LENSES],
        ...(automaticScan?.status === 'completed'
          ? { rerunOf: { runId: automaticScan.runId, analysisId: automaticScan.analysisId } }
          : {}),
      });
      if (result.ok) {
        setAutomaticScan(result.data);
        setAutomaticScanNotice(result.data.status === 'completed'
          ? origin === 'local-inference'
            ? 'Local-AI emotion analysis finished. The inferred layer is temporary and advisory.'
            : 'Automatic scan finished. Review the source-linked prompts below.'
          : result.data.error?.message ?? `Automatic scan ${result.data.status}.`);
      } else {
        setAutomaticScanNotice(result.error.message);
      }
    } catch {
      setAutomaticScanNotice('The automatic manuscript scan could not be completed.');
    } finally {
      setAutomaticScanBusy(false);
      setAutomaticRun(null);
    }
  };
  const cancelAutomaticScan = () => {
    const bridge = window.storyIntelligence;
    const run = automaticRun;
    if (!bridge || !run) return;
    void bridge.automaticCancel({
      schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
      operationId: scanId('automatic-cancel-operation'),
      projectId: project.projectId,
      projectPath: project.path,
      generation,
      runId: run.runId,
      analysisId: run.analysisId,
      requestedAt: new Date().toISOString(),
      reason: 'Author cancelled the automatic manuscript scan.',
    }).then((result) => {
      if (!result.ok) setAutomaticScanNotice(result.error.message);
    }).catch(() => setAutomaticScanNotice('The scan could not be cancelled.'));
  };
  return (
    <section
      className="stage19-program6"
      aria-label="Story Knowledge workspace"
      data-testid="stage19-program6-story-knowledge"
    >
      <header className="stage19-program6__header">
        <div>
          <span className="stage19-spine__eyebrow">Program 6 · {project.title}</span>
          <h2>Story Knowledge</h2>
          <p>Source-linked story lenses for the current project. Advisory only.</p>
        </div>
        <div className="stage19-program6__status">
          <span>This project</span>
          <span>
            {document.settings.analysisPolicy.optionalInferenceEnabled
              ? 'Optional interpretation on'
              : 'No AI is used'}
          </span>
        </div>
      </header>
      <nav className="stage19-program6__lenses" aria-label="Story Knowledge lenses">
        {LENSES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={lens === item.id ? 'page' : undefined}
            className={lens === item.id ? 'is-active' : ''}
            onClick={() => setLens(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {actionNotice ? (
        <p className="stage19-program6__notice" role="status">
          {actionNotice}
        </p>
      ) : null}
      {lens === 'overview' ? (
        <>
          <AutomaticScanPanel
            state={automaticScan}
            busy={automaticScanBusy}
            notice={automaticScanNotice}
            onScan={() => void runAutomaticScan()}
            onLocalEmotionScan={() => void runAutomaticScan('local-inference')}
            onCancel={cancelAutomaticScan}
            onSourceReturn={selectSource}
            localInferenceEnabled={document.settings.analysisPolicy.optionalInferenceEnabled}
            onEnableLocalInference={onEnableLocalInference}
          />
          <LensSummary projection={projection} document={document} />
        </>
      ) : null}
      {lens === 'emotion' ? (
        <EmotionLens
          project={project}
          projection={projection}
          onSourceReturn={selectSource}
          onEmotionRecordCreate={(draft) => {
            saveAuthorRecord(draft);
          }}
        />
      ) : null}
      {lens === 'continuity' ? (
        <ContinuityReview
          findings={projection.continuity.findings}
          sourceDrafts={project.drafts}
          onAction={continuityAction}
          onWorkOnThis={onWorkOnThis}
        />
      ) : null}
      {lens === 'timeline' ? (
        <TimelineLens
          project={project}
          projection={projection}
          onSourceReturn={selectSource}
          onAction={timelineAction}
          onAuthorRecordCreate={saveAuthorRecord}
        />
      ) : null}
      {lens === 'pacing' ? (
        <PacingLens
          project={project}
          projection={projection}
          onSourceReturn={selectSource}
          onAuthorRecordCreate={saveAuthorRecord}
        />
      ) : null}
      {lens === 'pressure' ? (
        <PressureLens
          project={project}
          projection={projection}
          onSourceReturn={selectSource}
          onAuthorRecordCreate={saveAuthorRecord}
        />
      ) : null}
      {lens === 'signals' ? (
        <SignalsLens
          projection={projection}
          document={document}
          sourceDrafts={project.drafts}
          onSourceReturn={selectSource}
          onSignalDisposition={disposition}
          onWorkOnThis={onWorkOnThis}
        />
      ) : null}
    </section>
  );
}
