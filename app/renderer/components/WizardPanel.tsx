import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  OutlineBuildBridgeRequest,
  ServicesBridge,
  WizardLocks,
} from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';

const STORAGE_KEY = 'blackskies.wizard-locks.v1';

const DEFAULT_ACTS = ['Act I', 'Act II', 'Act III'].join('\n');
const DEFAULT_CHAPTERS = ['1|Arrival', '2|Storm Rising', '3|Break In'].join('\n');
const DEFAULT_SCENES = ['1|Basement Pulse|inciting', '2|Locked Parlor|turn'].join('\n');

interface WizardDraftState {
  projectId: string;
  acts: string;
  chapters: string;
  scenes: string;
}

type WizardStep = 'acts' | 'chapters' | 'scenes' | 'review';

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

function readStoredDraft(): WizardDraftState {
  if (typeof window === 'undefined') {
    return {
      projectId: '',
      acts: DEFAULT_ACTS,
      chapters: DEFAULT_CHAPTERS,
      scenes: DEFAULT_SCENES,
    };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        projectId: '',
        acts: DEFAULT_ACTS,
        chapters: DEFAULT_CHAPTERS,
        scenes: DEFAULT_SCENES,
      };
    }
    const parsed = JSON.parse(stored) as Partial<WizardDraftState>;
    return {
      projectId: typeof parsed.projectId === 'string' ? parsed.projectId : '',
      acts: typeof parsed.acts === 'string' && parsed.acts.trim().length > 0
        ? parsed.acts
        : DEFAULT_ACTS,
      chapters:
        typeof parsed.chapters === 'string' && parsed.chapters.trim().length > 0
          ? parsed.chapters
          : DEFAULT_CHAPTERS,
      scenes:
        typeof parsed.scenes === 'string' && parsed.scenes.trim().length > 0
          ? parsed.scenes
          : DEFAULT_SCENES,
    };
  } catch (error) {
    console.warn('[WizardPanel] Failed to parse stored draft state', error);
    return {
      projectId: '',
      acts: DEFAULT_ACTS,
      chapters: DEFAULT_CHAPTERS,
      scenes: DEFAULT_SCENES,
    };
  }
}

function sanitizeProjectId(value: string): string {
  return value.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '').toLowerCase();
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
      const chapterIndex =
        Number.isFinite(chapterCandidate) && chapterCandidate > 0 ? chapterCandidate : 1;
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
  const acts = toActLines(draft.acts).map((title) => ({ title }));
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

const STEP_SEQUENCE: WizardStep[] = ['acts', 'chapters', 'scenes', 'review'];

function stepLabel(step: WizardStep): string {
  switch (step) {
    case 'acts':
      return 'Acts';
    case 'chapters':
      return 'Chapters';
    case 'scenes':
      return 'Scenes';
    case 'review':
      return 'Review';
    default:
      return step;
  }
}

export default function WizardPanel({
  services,
  onToast,
  onOutlineReady,
}: WizardPanelProps): JSX.Element {
  const [draft, setDraft] = useState<WizardDraftState>(() => readStoredDraft());
  const [step, setStep] = useState<WizardStep>('acts');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastMessage, setLastMessage] = useState<ToastPayload | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('[WizardPanel] Failed to persist draft state', error);
    }
  }, [draft]);

  const parsedLocks = useMemo(() => buildLocksFromDraft(draft), [draft]);

  const currentIndex = useMemo(() => STEP_SEQUENCE.indexOf(step), [step]);
  const canGoNext = currentIndex < STEP_SEQUENCE.length - 1;
  const canGoBack = currentIndex > 0;

  const updateField = useCallback(
    (field: keyof WizardDraftState, value: string) => {
      setDraft((previous) => ({
        ...previous,
        [field]: value,
      }));
    },
    [],
  );

  const handleAdvance = useCallback(() => {
    if (!canGoNext) {
      return;
    }
    setStep(STEP_SEQUENCE[currentIndex + 1]);
  }, [canGoNext, currentIndex]);

  const handleRetreat = useCallback(() => {
    if (!canGoBack) {
      return;
    }
    setStep(STEP_SEQUENCE[currentIndex - 1]);
  }, [canGoBack, currentIndex]);

  const handleReset = useCallback(() => {
    setDraft({
      projectId: '',
      acts: DEFAULT_ACTS,
      chapters: DEFAULT_CHAPTERS,
      scenes: DEFAULT_SCENES,
    });
    setStep('acts');
    setLastMessage(null);
  }, []);

  const handleBuildOutline = useCallback(async () => {
    const projectIdRaw = draft.projectId.trim();
    if (!services) {
      onToast({
        tone: 'error',
        title: 'Services bridge unavailable',
        description: 'Unable to reach local services. Ensure the background process is running.',
      });
      return;
    }
    if (projectIdRaw.length === 0) {
      onToast({
        tone: 'warning',
        title: 'Project ID required',
        description: 'Enter a project identifier before building the outline.',
      });
      setStep('acts');
      return;
    }

    const safeProjectId = sanitizeProjectId(projectIdRaw) || projectIdRaw;
    const locks = parsedLocks;

    if (locks.acts.length === 0) {
      onToast({
        tone: 'warning',
        title: 'Add at least one act',
        description: 'The outline requires at least one act label.',
      });
      setStep('acts');
      return;
    }

    if (locks.chapters.length === 0) {
      onToast({
        tone: 'warning',
        title: 'Add at least one chapter',
        description: 'Define at least one chapter entry (format: ACT|Title).',
      });
      setStep('chapters');
      return;
    }

    if (locks.scenes.length === 0) {
      onToast({
        tone: 'warning',
        title: 'Add at least one scene',
        description: 'Provide at least one scene (format: CHAPTER|Title|beat).',
      });
      setStep('scenes');
      return;
    }

    const request: OutlineBuildBridgeRequest = {
      projectId: safeProjectId,
      forceRebuild: false,
      wizardLocks: locksToRequest(locks),
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
  }, [draft.projectId, onOutlineReady, onToast, parsedLocks, services]);

  return (
    <div className="wizard-panel" aria-live="polite">
      <header className="wizard-panel__header">
        <h2>Wizard Controls</h2>
        <p>
          Lock each step to freeze your outline decisions and create a snapshot before building.
          Follow the formats below so acts, chapters, and scenes are saved exactly as listed.
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
        />
        <p className="wizard-panel__hint">
          The project ID should match the folder within your project root. It will be normalised to
          snake_case when saved.
        </p>
      </div>

      <nav className="wizard-panel__steps" aria-label="Wizard progress">
        <ol>
          {STEP_SEQUENCE.map((sequenceStep, index) => {
            const active = sequenceStep === step;
            return (
              <li key={sequenceStep} className={active ? 'wizard-panel__step--active' : ''}>
                <button
                  type="button"
                  className="wizard-panel__step-button"
                  onClick={() => setStep(sequenceStep)}
                  aria-current={active ? 'step' : undefined}
                >
                  {index + 1}. {stepLabel(sequenceStep)}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 'acts' ? (
        <div className="wizard-panel__section">
          <label htmlFor="wizard-acts">Acts (one per line)</label>
          <textarea
            id="wizard-acts"
            value={draft.acts}
            onChange={(event) => updateField('acts', event.target.value)}
            rows={4}
            className="wizard-panel__textarea"
          />
          <p className="wizard-panel__hint">Example: Act I</p>
        </div>
      ) : null}

      {step === 'chapters' ? (
        <div className="wizard-panel__section">
          <label htmlFor="wizard-chapters">Chapters (format: ACT_INDEX|Title)</label>
          <textarea
            id="wizard-chapters"
            value={draft.chapters}
            onChange={(event) => updateField('chapters', event.target.value)}
            rows={5}
            className="wizard-panel__textarea"
          />
          <p className="wizard-panel__hint">Example: 1|Arrival</p>
        </div>
      ) : null}

      {step === 'scenes' ? (
        <div className="wizard-panel__section">
          <label htmlFor="wizard-scenes">Scenes (format: CHAPTER_INDEX|Title|beat,beat)</label>
          <textarea
            id="wizard-scenes"
            value={draft.scenes}
            onChange={(event) => updateField('scenes', event.target.value)}
            rows={6}
            className="wizard-panel__textarea"
          />
          <p className="wizard-panel__hint">Example: 1|Basement Pulse|inciting</p>
        </div>
      ) : null}

      {step === 'review' ? (
        <div className="wizard-panel__section">
          <h3>Review</h3>
          <p>
            Review the locked inputs that will be sent to the outline builder. Acts, chapters, and
            scenes will be written to the project index in this order.
          </p>
          <dl className="wizard-panel__summary">
            <dt>Acts</dt>
            <dd>{parsedLocks.acts.map((act) => act.title).join(', ')}</dd>
            <dt>Chapters</dt>
            <dd>
              {parsedLocks.chapters
                .map((chapter) => `Act ${chapter.actIndex}: ${chapter.title}`)
                .join(', ')}
            </dd>
            <dt>Scenes</dt>
            <dd>
              {parsedLocks.scenes
                .map((scene) => `Chapter ${scene.chapterIndex}: ${scene.title}`)
                .join(', ')}
            </dd>
          </dl>
          {lastMessage ? (
            <p className={`wizard-panel__message wizard-panel__message--${lastMessage.tone}`}>
              {lastMessage.title}
            </p>
          ) : null}
        </div>
      ) : null}

      <footer className="wizard-panel__footer">
        <div className="wizard-panel__footer-left">
          <button
            type="button"
            className="wizard-panel__button"
            onClick={handleRetreat}
            disabled={!canGoBack || isSubmitting}
          >
            Back
          </button>
          <button
            type="button"
            className="wizard-panel__button"
            onClick={handleAdvance}
            disabled={!canGoNext || isSubmitting}
          >
            Next
          </button>
        </div>
        <div className="wizard-panel__footer-right">
          <button
            type="button"
            className="wizard-panel__button wizard-panel__button--secondary"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            Reset
          </button>
          <button
            type="button"
            className="wizard-panel__button wizard-panel__button--primary"
            onClick={handleBuildOutline}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Building…' : 'Build Outline'}
          </button>
        </div>
      </footer>
    </div>
  );
}
