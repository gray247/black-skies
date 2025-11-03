import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  OutlineBuildBridgeRequest,
  ServicesBridge,
  SnapshotSummary,
  WizardLocks,
  WizardLockStepId,
} from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';
import { TID } from '../utils/testIds';

const STORAGE_KEY = 'blackskies.wizard-locks.v2';
const LEGACY_STORAGE_KEYS = ['blackskies.wizard-locks.v1'];

const DEFAULT_ACTS = ['Act I', 'Act II', 'Act III'].join('\n');
const DEFAULT_CHAPTERS = ['1|Arrival', '2|Storm Rising', '3|Break In'].join('\n');
const DEFAULT_SCENES = ['1|Basement Pulse|inciting', '2|Locked Parlor|turn'].join('\n');

interface WizardDraftState {
  projectId: string;
  inputScope: string;
  framing: string;
  structureActs: string;
  scenes: string;
  characters: string;
  conflict: string;
  beats: string;
  pacing: string;
  chapters: string;
  themes: string;
}

type WizardStep =
  | 'inputScope'
  | 'framing'
  | 'structure'
  | 'scenes'
  | 'characters'
  | 'conflict'
  | 'beats'
  | 'pacing'
  | 'chapters'
  | 'themes'
  | 'finalize';

interface StepLockState {
  locked: boolean;
  snapshot?: SnapshotSummary | null;
}

type WizardStepLocks = Record<WizardStep, StepLockState>;

type LockRequestMap = Record<WizardStep, boolean>;

interface WizardPanelProps {
  services?: ServicesBridge;
  onToast: (toast: ToastPayload) => void;
  onOutlineReady?: (projectId: string) => void;
}

interface ParsedChapter {
  title: string;
  actIndex: number;
}

interface ParsedScene {
  title: string;
  chapterIndex: number;
  beatRefs: string[];
}

interface WizardStoragePayload {
  version?: number;
  draft?: Partial<WizardDraftState>;
  locks?: Partial<Record<WizardStep, Partial<StepLockState>>>;
}

const STEP_SEQUENCE: WizardStep[] = [
  'inputScope',
  'framing',
  'structure',
  'scenes',
  'characters',
  'conflict',
  'beats',
  'pacing',
  'chapters',
  'themes',
  'finalize',
];

const STEP_TO_SERVICE_ID: Record<WizardStep, WizardLockStepId> = {
  inputScope: 'input_scope',
  framing: 'framing',
  structure: 'structure',
  scenes: 'scenes',
  characters: 'characters',
  conflict: 'conflict',
  beats: 'beats',
  pacing: 'pacing',
  chapters: 'chapters',
  themes: 'themes',
  finalize: 'finalize',
};

interface StepFieldConfig {
  valueKey: keyof WizardDraftState;
  label: string;
  rows: number;
  hint?: string;
  placeholder?: string;
}

const STEP_FIELDS: Partial<Record<WizardStep, StepFieldConfig>> = {
  inputScope: {
    valueKey: 'inputScope',
    label: 'Input & Scope',
    rows: 5,
    hint: 'Collect your raw notes, premise bullets, and scope decisions.',
  },
  framing: {
    valueKey: 'framing',
    label: 'Initial Framing',
    rows: 4,
    hint: 'Premise, logline, genre, and audience expectations.',
  },
  structure: {
    valueKey: 'structureActs',
    label: 'Structure (Acts)',
    rows: 4,
    hint: 'List each act or section (one per line). Example: Act I',
    placeholder: DEFAULT_ACTS,
  },
  scenes: {
    valueKey: 'scenes',
    label: 'Scene Skeleton',
    rows: 6,
    hint: 'Format: CHAPTER_INDEX|Title|beat,beat. Example: 1|Basement Pulse|inciting',
    placeholder: DEFAULT_SCENES,
  },
  characters: {
    valueKey: 'characters',
    label: 'Character Decisions',
    rows: 5,
    hint: 'Who are the core characters and how do they arc?',
  },
  conflict: {
    valueKey: 'conflict',
    label: 'Conflict & Stakes',
    rows: 4,
    hint: 'Central conflict and what happens if they fail.',
  },
  beats: {
    valueKey: 'beats',
    label: 'Beats & Turning Points',
    rows: 4,
    hint: 'Note the inciting incident, midpoint, climax, and twists.',
  },
  pacing: {
    valueKey: 'pacing',
    label: 'Pacing & Flow',
    rows: 4,
    hint: 'Word count targets, where to speed up or slow down.',
  },
  chapters: {
    valueKey: 'chapters',
    label: 'Chapterization',
    rows: 5,
    hint: 'Format: ACT_INDEX|Title. Example: 1|Arrival',
    placeholder: DEFAULT_CHAPTERS,
  },
  themes: {
    valueKey: 'themes',
    label: 'Thematic Layering',
    rows: 4,
    hint: 'Which themes and motifs should echo across the story?',
  },
};

function sanitizeProjectId(value: string): string {
  return value.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

function createDefaultDraft(): WizardDraftState {
  return {
    projectId: '',
    inputScope: '',
    framing: '',
    structureActs: DEFAULT_ACTS,
    scenes: DEFAULT_SCENES,
    characters: '',
    conflict: '',
    beats: '',
    pacing: '',
    chapters: DEFAULT_CHAPTERS,
    themes: '',
  };
}

function createInitialLocks(): WizardStepLocks {
  return STEP_SEQUENCE.reduce((accumulator, step) => {
    accumulator[step] = { locked: false, snapshot: null };
    return accumulator;
  }, {} as WizardStepLocks);
}

function createInitialLockRequests(): LockRequestMap {
  return STEP_SEQUENCE.reduce((accumulator, step) => {
    accumulator[step] = false;
    return accumulator;
  }, {} as LockRequestMap);
}

function normalizeDraft(candidate: unknown): WizardDraftState {
  const base = createDefaultDraft();
  if (!candidate || typeof candidate !== 'object') {
    return base;
  }
  const record = candidate as Record<string, unknown>;
  (Object.keys(base) as Array<keyof WizardDraftState>).forEach((key) => {
    const value = record[key as string];
    if (typeof value === 'string') {
      base[key] = value;
    }
  });
  if (typeof record.acts === 'string' && typeof record.structureActs !== 'string') {
    base.structureActs = record.acts;
  }
  if (typeof record.chapters === 'string') {
    base.chapters = record.chapters;
  }
  if (typeof record.scenes === 'string') {
    base.scenes = record.scenes;
  }
  if (typeof record.projectId === 'string') {
    base.projectId = record.projectId;
  }
  return base;
}

function normalizeLocks(candidate: unknown): WizardStepLocks {
  const base = createInitialLocks();
  if (!candidate || typeof candidate !== 'object') {
    return base;
  }
  const record = candidate as Record<string, unknown>;
  STEP_SEQUENCE.forEach((step) => {
    const value = record[step];
    if (!value || typeof value !== 'object') {
      return;
    }
    const lockRecord = value as Record<string, unknown>;
    const locked = Boolean(lockRecord.locked);
    const snapshot = lockRecord.snapshot;
    base[step] = {
      locked,
      snapshot:
        snapshot && typeof snapshot === 'object'
          ? ({
              snapshot_id:
                typeof (snapshot as Record<string, unknown>).snapshot_id === 'string'
                  ? ((snapshot as Record<string, unknown>).snapshot_id as string)
                  : undefined,
              label:
                typeof (snapshot as Record<string, unknown>).label === 'string'
                  ? ((snapshot as Record<string, unknown>).label as string)
                  : undefined,
              created_at:
                typeof (snapshot as Record<string, unknown>).created_at === 'string'
                  ? ((snapshot as Record<string, unknown>).created_at as string)
                  : undefined,
              path:
                typeof (snapshot as Record<string, unknown>).path === 'string'
                  ? ((snapshot as Record<string, unknown>).path as string)
                  : undefined,
              includes:
                Array.isArray((snapshot as Record<string, unknown>).includes)
                  ? ((snapshot as Record<string, unknown>).includes as string[])
                  : undefined,
            } as SnapshotSummary)
          : null,
    };
  });
  return base;
}

function readStoredState(): { draft: WizardDraftState; locks: WizardStepLocks } {
  if (typeof window === 'undefined') {
    return { draft: createDefaultDraft(), locks: createInitialLocks() };
  }

  const keysToCheck = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of keysToCheck) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }
    try {
      const parsed = JSON.parse(raw) as WizardStoragePayload | Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && 'draft' in parsed) {
        const payload = parsed as WizardStoragePayload;
        const draft = normalizeDraft(payload.draft);
        const locks = normalizeLocks(payload.locks);
        return { draft, locks };
      }
      const legacy = parsed as Record<string, unknown>;
      const draft = normalizeDraft(legacy);
      return { draft, locks: createInitialLocks() };
    } catch (error) {
      console.warn('[WizardPanel] Failed to parse stored wizard state', error);
      break;
    }
  }

  return { draft: createDefaultDraft(), locks: createInitialLocks() };
}

function toActLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function toChapterLines(text: string): ParsedChapter[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [actIndexRaw, titleRaw] = line.split('|');
      const actIndexCandidate = Number.parseInt(actIndexRaw ?? '1', 10);
      const actIndex = Number.isFinite(actIndexCandidate) && actIndexCandidate > 0 ? actIndexCandidate : 1;
      const title = (titleRaw ?? actIndexRaw ?? '').trim() || 'Untitled chapter';
      return { title, actIndex };
    });
}

function toSceneLines(text: string): ParsedScene[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [chapterIndexRaw, titleRaw, beatsRaw] = line.split('|');
      const chapterCandidate = Number.parseInt(chapterIndexRaw ?? '1', 10);
      const chapterIndex = Number.isFinite(chapterCandidate) && chapterCandidate > 0 ? chapterCandidate : 1;
      const title = (titleRaw ?? chapterIndexRaw ?? '').trim() || 'Untitled scene';
      const beatRefs = beatsRaw
        ? beatsRaw
            .split(',')
            .map((beat) => beat.trim())
            .filter((beat) => beat.length > 0)
        : [];
      return { title, chapterIndex, beatRefs };
    });
}

function buildLocksFromDraft(draft: WizardDraftState): WizardLocks {
  const acts = toActLines(draft.structureActs).map((title) => ({ title }));
  const chapters = toChapterLines(draft.chapters).map((chapter) => ({
    title: chapter.title,
    actIndex: chapter.actIndex,
  }));
  const scenes = toSceneLines(draft.scenes).map((scene) => ({
    title: scene.title,
    chapterIndex: scene.chapterIndex,
    beatRefs: scene.beatRefs,
  }));

  return {
    acts,
    chapters,
    scenes,
  };
}

function locksToRequest(locks: WizardLocks): OutlineBuildBridgeRequest['wizardLocks'] {
  return {
    acts: locks.acts,
    chapters: locks.chapters,
    scenes: locks.scenes,
  };
}

function stepLabel(step: WizardStep): string {
  switch (step) {
    case 'inputScope':
      return 'Input & Scope';
    case 'framing':
      return 'Framing';
    case 'structure':
      return 'Structure';
    case 'scenes':
      return 'Scenes';
    case 'characters':
      return 'Characters';
    case 'conflict':
      return 'Conflict';
    case 'beats':
      return 'Beats';
    case 'pacing':
      return 'Pacing';
    case 'chapters':
      return 'Chapters';
    case 'themes':
      return 'Themes';
    case 'finalize':
      return 'Finalize';
    default:
      return step;
  }
}

export default function WizardPanel({
  services,
  onToast,
  onOutlineReady,
}: WizardPanelProps): JSX.Element {
  const initialStateRef = useRef<{ draft: WizardDraftState; locks: WizardStepLocks } | null>(null);
  if (!initialStateRef.current) {
    initialStateRef.current = readStoredState();
  }

  const [draft, setDraft] = useState<WizardDraftState>(initialStateRef.current.draft);
  const [locks, setLocks] = useState<WizardStepLocks>(initialStateRef.current.locks);
  const [step, setStep] = useState<WizardStep>('inputScope');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockRequests, setLockRequests] = useState<LockRequestMap>(() => createInitialLockRequests());
  const [lastMessage, setLastMessage] = useState<ToastPayload | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const payload: WizardStoragePayload = {
        version: 2,
        draft,
        locks,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('[WizardPanel] Failed to persist wizard state', error);
    }
  }, [draft, locks]);

  const parsedLocks = useMemo(() => buildLocksFromDraft(draft), [draft]);
  const currentIndex = useMemo(() => STEP_SEQUENCE.indexOf(step), [step]);
  const canGoNext = currentIndex < STEP_SEQUENCE.length - 1;
  const canGoBack = currentIndex > 0;
  const hasPendingLock = useMemo(
    () => STEP_SEQUENCE.some((sequenceStep) => lockRequests[sequenceStep]),
    [lockRequests],
  );
  const allLocksEngaged = useMemo(
    () => STEP_SEQUENCE.every((sequenceStep) => locks[sequenceStep].locked),
    [locks],
  );
  const finalizeReady = step === 'finalize' && allLocksEngaged;

  const updateField = useCallback(
    (field: keyof WizardDraftState, value: string) => {
      setDraft((previous) => {
        if (previous[field] === value) {
          return previous;
        }
        return {
          ...previous,
          [field]: value,
        };
      });
    },
    [],
  );

  const handleAdvance = useCallback(() => {
    if (!canGoNext || hasPendingLock) {
      return;
    }
    setStep(STEP_SEQUENCE[currentIndex + 1]);
  }, [canGoNext, currentIndex, hasPendingLock]);

  const handleRetreat = useCallback(() => {
    if (!canGoBack || hasPendingLock) {
      return;
    }
    setStep(STEP_SEQUENCE[currentIndex - 1]);
  }, [canGoBack, currentIndex, hasPendingLock]);

  const handleReset = useCallback(() => {
    setDraft(createDefaultDraft());
    setLocks(createInitialLocks());
    setLockRequests(createInitialLockRequests());
    setStep('inputScope');
    setLastMessage(null);
  }, []);

  const handleToggleLock = useCallback(
    async (targetStep: WizardStep) => {
      if (lockRequests[targetStep]) {
        return;
      }

      const currentLock = locks[targetStep];
      if (currentLock?.locked) {
        setLocks((previous) => ({
          ...previous,
          [targetStep]: { locked: false, snapshot: null },
        }));
        onToast({
          tone: 'info',
          title: `${stepLabel(targetStep)} unlocked`,
          description: 'Editing re-enabled for this step.',
        });
        return;
      }

      if (!services) {
        onToast({
          tone: 'error',
          title: 'Services bridge unavailable',
          description: 'Unable to reach local services. Ensure the background process is running.',
        });
        return;
      }

      const projectIdRaw = draft.projectId.trim();
      if (projectIdRaw.length === 0) {
        onToast({
          tone: 'warning',
          title: 'Project ID required',
          description: 'Enter a project identifier before locking Wizard steps.',
        });
        setStep('inputScope');
        return;
      }

      const sanitizedProjectId = sanitizeProjectId(projectIdRaw);
      const safeProjectId = sanitizedProjectId || projectIdRaw;
      if (safeProjectId !== draft.projectId) {
        setDraft((previous) => ({
          ...previous,
          projectId: safeProjectId,
        }));
      }

      setLockRequests((previous) => ({
        ...previous,
        [targetStep]: true,
      }));

      try {
        const response = await services.createSnapshot({
          projectId: safeProjectId,
          step: STEP_TO_SERVICE_ID[targetStep],
          label: `wizard-${STEP_TO_SERVICE_ID[targetStep]}`,
        });

        if (!response.ok) {
          onToast({
            tone: 'error',
            title: 'Snapshot failed',
            description: response.error.message || 'Unable to create a snapshot for this step.',
            traceId: response.traceId ?? response.error.traceId,
          });
          return;
        }

        const snapshot = response.data;
        setLocks((previous) => ({
          ...previous,
          [targetStep]: { locked: true, snapshot },
        }));
        onToast({
          tone: 'success',
          title: `${stepLabel(targetStep)} locked`,
          description: `Snapshot ${snapshot.snapshot_id} created.`,
          traceId: response.traceId,
        });
      } catch (error) {
        onToast({
          tone: 'error',
          title: 'Snapshot failed',
          description:
            error instanceof Error
              ? error.message
              : 'Unable to create a snapshot for this step.',
        });
      } finally {
        setLockRequests((previous) => ({
          ...previous,
          [targetStep]: false,
        }));
      }
    },
    [draft.projectId, lockRequests, locks, onToast, services],
  );

  const handleBuildOutline = useCallback(async () => {
    if (hasPendingLock) {
      return;
    }

    if (!finalizeReady) {
      onToast({
        tone: 'warning',
        title: 'Lock all steps first',
        description: 'Finalize locks must be complete before building the outline.',
      });
      return;
    }

    if (!services) {
      onToast({
        tone: 'error',
        title: 'Services bridge unavailable',
        description: 'Unable to reach local services. Ensure the background process is running.',
      });
      return;
    }

    const projectIdRaw = draft.projectId.trim();
    if (projectIdRaw.length === 0) {
      onToast({
        tone: 'warning',
        title: 'Project ID required',
        description: 'Enter a project identifier before building the outline.',
      });
      setStep('inputScope');
      return;
    }

    const sanitizedProjectId = sanitizeProjectId(projectIdRaw);
    const safeProjectId = sanitizedProjectId || projectIdRaw;
    if (safeProjectId !== draft.projectId) {
      setDraft((previous) => ({
        ...previous,
        projectId: safeProjectId,
      }));
    }

    const locksPayload = parsedLocks;

    if (locksPayload.acts.length === 0) {
      onToast({
        tone: 'warning',
        title: 'Add at least one act',
        description: 'The outline requires at least one act label.',
      });
      setStep('structure');
      return;
    }

    if (locksPayload.chapters.length === 0) {
      onToast({
        tone: 'warning',
        title: 'Add at least one chapter',
        description: 'Define at least one chapter entry (format: ACT_INDEX|Title).',
      });
      setStep('chapters');
      return;
    }

    if (locksPayload.scenes.length === 0) {
      onToast({
        tone: 'warning',
        title: 'Add at least one scene',
        description: 'Provide at least one scene (format: CHAPTER_INDEX|Title|beat).',
      });
      setStep('scenes');
      return;
    }

    const request: OutlineBuildBridgeRequest = {
      projectId: safeProjectId,
      forceRebuild: false,
      wizardLocks: locksToRequest(locksPayload),
    };

    setIsSubmitting(true);
    setLastMessage(null);

    const result = await services.buildOutline(request);
    setIsSubmitting(false);

    if (result.ok) {
      const successToast: ToastPayload = {
        tone: 'success',
        title: 'Outline built',
        description: `Outline ${result.data.outline_id} saved for project ${safeProjectId}.`,
        traceId: result.traceId,
      };
      onToast(successToast);
      setLastMessage(successToast);
      onOutlineReady?.(safeProjectId);
      return;
    }

    const errorToast: ToastPayload = {
      tone: 'error',
      title: 'Outline build failed',
      description:
        result.error.message || 'The service returned an unknown error during outline build.',
      traceId: result.traceId ?? result.error.traceId,
    };
    onToast(errorToast);
    setLastMessage(errorToast);
  }, [
    draft.projectId,
    finalizeReady,
    hasPendingLock,
    onOutlineReady,
    onToast,
    parsedLocks,
    services,
  ]);

  const renderLockControl = (targetStep: WizardStep) => {
    const lockState = locks[targetStep];
    const snapshot = lockState.snapshot ?? null;
    const busy = lockRequests[targetStep] || isSubmitting;
    return (
      <div className="wizard-panel__lock">
        <div
          className={`wizard-panel__lock-status ${lockState.locked ? 'wizard-panel__lock-status--locked' : 'wizard-panel__lock-status--unlocked'}`}
        >
          <span>{lockState.locked ? 'Locked' : 'Unlocked'}</span>
          {lockState.locked && snapshot ? (
            <span className="wizard-panel__lock-meta">
              Snapshot {snapshot.label || snapshot.snapshot_id}
              {snapshot.created_at ? ` • ${snapshot.created_at}` : ''}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="wizard-panel__button wizard-panel__button--secondary"
          onClick={() => void handleToggleLock(targetStep)}
          disabled={busy}
        >
          {busy ? 'Working…' : lockState.locked ? 'Unlock' : 'Lock'}
        </button>
      </div>
    );
  };

  const renderStepContent = () => {
    if (step === 'finalize') {
      return (
        <div className="wizard-panel__section wizard-panel__section--finalize">
          <div className="wizard-panel__section-header">
            <h3>Finalize</h3>
            {renderLockControl('finalize')}
          </div>
          <p>
            Ensure every step is locked before building the outline. Locked steps capture a snapshot you can restore later.
          </p>
          <dl className="wizard-panel__summary">
            <dt>Acts</dt>
            <dd>{parsedLocks.acts.map((act) => act.title).join(', ') || '—'}</dd>
            <dt>Chapters</dt>
            <dd>
              {parsedLocks.chapters
                .map((chapter) => `Act ${chapter.actIndex}: ${chapter.title}`)
                .join(', ') || '—'}
            </dd>
            <dt>Scenes</dt>
            <dd>
              {parsedLocks.scenes
                .map((scene) => `Chapter ${scene.chapterIndex}: ${scene.title}`)
                .join(', ') || '—'}
            </dd>
          </dl>
          <ul className="wizard-panel__status-list">
            {STEP_SEQUENCE.map((sequenceStep) => {
              const lockState = locks[sequenceStep];
              return (
                <li
                  key={sequenceStep}
                  className={lockState.locked ? 'wizard-panel__status-item wizard-panel__status-item--locked' : 'wizard-panel__status-item'}
                >
                  <span className="wizard-panel__status-label">{stepLabel(sequenceStep)}</span>
                  <span className="wizard-panel__status-value">
                    {lockState.locked ? 'Locked' : 'Pending'}
                    {lockState.locked && lockState.snapshot?.snapshot_id
                      ? ` • ${lockState.snapshot.snapshot_id}`
                      : ''}
                  </span>
                </li>
              );
            })}
          </ul>
          {!allLocksEngaged ? (
            <p className="wizard-panel__hint">Lock remaining steps to enable outline build.</p>
          ) : null}
          {lastMessage ? (
            <p className={`wizard-panel__message wizard-panel__message--${lastMessage.tone}`}>
              {lastMessage.title}
            </p>
          ) : null}
        </div>
      );
    }

    const fieldConfig = STEP_FIELDS[step];
    if (!fieldConfig) {
      return null;
    }

    const fieldId = `wizard-${step}`;
    const outlineTestId = fieldConfig.valueKey === 'scenes' ? TID.outlineEditor : undefined;
    return (
      <div className="wizard-panel__section">
        <div className="wizard-panel__section-header">
          <label htmlFor={fieldId}>{fieldConfig.label}</label>
          {renderLockControl(step)}
        </div>
        {fieldConfig.hint ? <p className="wizard-panel__hint">{fieldConfig.hint}</p> : null}
        <textarea
          id={fieldId}
          value={draft[fieldConfig.valueKey]}
          onChange={(event) => updateField(fieldConfig.valueKey, event.target.value)}
          rows={fieldConfig.rows}
          className="wizard-panel__textarea"
          placeholder={fieldConfig.placeholder}
          disabled={locks[step].locked || lockRequests[step]}
          data-testid={outlineTestId}
        />
      </div>
    );
  };

  return (
    <div className="wizard-panel" aria-live="polite" data-testid={TID.wizardRoot}>
      <header className="wizard-panel__header">
        <h2>Wizard Controls</h2>
        <p>
          Lock each step to freeze your outline decisions and create a snapshot before building. Follow the formats below so
          acts, chapters, and scenes are saved exactly as listed.
        </p>
      </header>

      <div className="wizard-panel__control">
        <label htmlFor="wizard-project-id">Project ID</label>
        <input
          id="wizard-project-id"
          type="text"
          value={draft.projectId}
          onChange={(event) => updateField('projectId', event.target.value)}
          placeholder="e.g., esther_estate"
          className="wizard-panel__input"
          autoComplete="off"
          disabled={isSubmitting || hasPendingLock}
        />
        <p className="wizard-panel__hint">
          The project ID should match the folder within your project root. It will be normalised to snake_case when saved.
        </p>
      </div>

      <nav className="wizard-panel__steps" aria-label="Wizard progress">
        <ol>
          {STEP_SEQUENCE.map((sequenceStep, index) => {
            const active = sequenceStep === step;
            const locked = locks[sequenceStep].locked;
            const classes = ['wizard-panel__step'];
            if (active) {
              classes.push('wizard-panel__step--active');
            }
            if (locked) {
              classes.push('wizard-panel__step--locked');
            }
            return (
              <li key={sequenceStep} className={classes.join(' ')}>
                <button
                  type="button"
                  className="wizard-panel__step-button"
                  onClick={() => setStep(sequenceStep)}
                  aria-current={active ? 'step' : undefined}
                  disabled={hasPendingLock}
                >
                  {index + 1}. {stepLabel(sequenceStep)}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {renderStepContent()}

      <footer className="wizard-panel__footer">
        <div className="wizard-panel__footer-left">
          <button
            type="button"
            className="wizard-panel__button"
            onClick={handleRetreat}
            disabled={!canGoBack || isSubmitting || hasPendingLock}
          >
            Back
          </button>
          <button
            type="button"
            className="wizard-panel__button"
            onClick={handleAdvance}
            disabled={!canGoNext || isSubmitting || hasPendingLock}
            data-testid={TID.wizardNext}
          >
            Next
          </button>
        </div>
        <div className="wizard-panel__footer-right">
          <button
            type="button"
            className="wizard-panel__button wizard-panel__button--secondary"
            onClick={handleReset}
            disabled={isSubmitting || hasPendingLock}
          >
            Reset
          </button>
          {finalizeReady ? (
            <button
              type="button"
              className="wizard-panel__button wizard-panel__button--primary"
              onClick={handleBuildOutline}
              disabled={isSubmitting || hasPendingLock}
            >
              {isSubmitting ? 'Building…' : 'Build Outline'}
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
