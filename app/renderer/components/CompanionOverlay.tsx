import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedProject, SceneDraftMetadata } from '../../shared/ipc/projectLoader';
import {
  computeEmotionArc,
  computePacingProfile,
  resolveAnalyticsConfig,
} from '../utils/analytics';
import type { EmotionArcPoint, ScenePacingMetric } from '../utils/analytics';

const RUBRIC_PATTERN = /^[A-Za-z0-9 ,.&:/'-]+$/;
const MAX_RUBRIC_LENGTH = 40;

interface CompanionOverlayProps {
  open: boolean;
  onClose: () => void;
  activeScene: { id: string; title: string | null } | null;
  activeDraft: string;
  project: LoadedProject | null;
  drafts: Record<string, string>;
  rubric: string[];
  onRubricChange: (next: string[]) => void;
  builtInRubric: readonly string[];
  scenes: SceneDraftMetadata[];
  activeSceneId: string | null;
  batchState: BatchCritiqueState;
  onBatchCritique: (sceneIds: string[]) => void | Promise<void>;
}

interface SceneInsight {
  label: string;
  value: string;
}

interface DraftAnalysis {
  wordCount: number;
  sentenceAverage: number;
  longestSentenceLength: number;
  longestSentence: string;
  paragraphCount: number;
}

type BatchCritiqueStatus = 'idle' | 'running' | 'success' | 'error';

interface BatchCritiqueSceneResult {
  status: BatchCritiqueStatus;
  summary?: string;
  error?: string;
  traceId?: string;
}

interface BatchCritiqueState {
  running: boolean;
  results: Record<string, BatchCritiqueSceneResult>;
}

function normaliseWhitespace(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

function sentenceSegments(text: string): string[] {
  const cleaned = normaliseWhitespace(text).trim();
  if (!cleaned) {
    return [];
  }
  return cleaned
    .split(/[.!?]+/u)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function analyseDraft(text: string): DraftAnalysis {
  const paragraphs = normaliseWhitespace(text)
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const sentences = sentenceSegments(text);
  const sentenceLengths = sentences.map((segment) => segment.split(/\s+/).filter(Boolean).length);
  const wordTokens = normaliseWhitespace(text).split(/\s+/).filter(Boolean);
  const longestSentenceLength = sentenceLengths.length
    ? Math.max(...sentenceLengths)
    : 0;
  const longestSentenceIndex = sentenceLengths.indexOf(longestSentenceLength);

  return {
    wordCount: wordTokens.length,
    sentenceAverage:
      sentenceLengths.length > 0
        ? sentenceLengths.reduce((total, length) => total + length, 0) / sentenceLengths.length
        : 0,
    longestSentenceLength,
    longestSentence: longestSentenceIndex >= 0 ? sentences[longestSentenceIndex] ?? '' : '',
    paragraphCount: paragraphs.length,
  };
}

function buildInsights(
  analysis: DraftAnalysis,
  scene: SceneDraftMetadata | null,
  draftEmpty: boolean,
): string[] {
  if (draftEmpty) {
    return ['Draft has no content yet. Add a few sentences to unlock pacing guidance.'];
  }

  const suggestions: string[] = [];
  if (analysis.wordCount < 150) {
    suggestions.push('Scene is lean. Consider expanding sensory detail or internal beats.');
  } else if (analysis.wordCount > 900) {
    suggestions.push('Scene is lengthy. Check for places to tighten or split the momentum.');
  }

  if (analysis.sentenceAverage > 24) {
    suggestions.push('Average sentence length is high; introduce shorter beats to restore pacing.');
  } else if (analysis.sentenceAverage > 0 && analysis.sentenceAverage < 9) {
    suggestions.push('Sentences are very short. Weave in longer lines to vary rhythm.');
  }

  if (scene?.word_target && analysis.wordCount < scene.word_target * 0.7) {
    suggestions.push('Draft is below the planned word target. Flesh out missing beats.');
  } else if (scene?.word_target && analysis.wordCount > scene.word_target * 1.3) {
    suggestions.push('Draft exceeds the planned word target. Trim or redistribute content.');
  }

  if (!scene?.emotion_tag) {
    suggestions.push('No emotion tag set. Add one to highlight the intended tone for critiques.');
  }

  return suggestions;
}

function statusLabel(status: BatchCritiqueStatus): string {
  switch (status) {
    case 'running':
      return 'Running';
    case 'success':
      return 'Complete';
    case 'error':
      return 'Failed';
    default:
      return 'Ready';
  }
}

function formatIntensity(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

function formatWordCount(value: number): string {
  return value.toLocaleString();
}

function formatPercentage(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0%';
  }
  const ratio = Math.max(0, Math.min(1, value));
  return `${Math.round(ratio * 100)}%`;
}

function describeEmotionPoint(point: EmotionArcPoint | null): string {
  if (!point) {
    return 'No neighbouring scenes tagged yet.';
  }
  const tagLabel = point.emotionTag ?? 'untagged';
  return `${point.order}. ${point.title} — ${tagLabel} (${formatIntensity(point.intensity)})`;
}

function describePaceHighlights(metrics: ScenePacingMetric[]): string {
  if (metrics.length === 0) {
    return 'None flagged';
  }
  return metrics
    .map((metric) => `${metric.title} (${formatWordCount(metric.wordCount)} words)`)
    .join(', ');
}

export default function CompanionOverlay({
  open,
  onClose,
  activeScene,
  activeDraft,
  project,
  drafts,
  rubric,
  onRubricChange,
  builtInRubric,
  scenes,
  activeSceneId,
  batchState,
  onBatchCritique,
}: CompanionOverlayProps): JSX.Element | null {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [rubricError, setRubricError] = useState<string | null>(null);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setNewCategory('');
      setRubricError(null);
      setSelectedScenes([]);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const nextFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(nextFrame);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !activeSceneId) {
      return;
    }
    setSelectedScenes((current) => {
      if (current.length > 0) {
        return current;
      }
      return [activeSceneId];
    });
  }, [activeSceneId, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedScenes((current) => {
      const availableIds = scenes.map((scene) => scene.id);
      const filtered = current.filter((sceneId) => availableIds.includes(sceneId));
      if (filtered.length > 0) {
        return filtered;
      }
      const fallback = activeSceneId && availableIds.includes(activeSceneId)
        ? activeSceneId
        : availableIds[0] ?? null;
      return fallback ? [fallback] : [];
    });
  }, [activeSceneId, open, scenes]);

  const analyticsConfig = useMemo(
    () =>
      resolveAnalyticsConfig(
        typeof window !== 'undefined' ? window.runtimeConfig?.analytics ?? null : null,
      ),
    [],
  );

  const emotionArc = useMemo(
    () => computeEmotionArc(scenes, analyticsConfig),
    [analyticsConfig, scenes],
  );

  const pacingProfile = useMemo(
    () => computePacingProfile(scenes, drafts, analyticsConfig),
    [analyticsConfig, drafts, scenes],
  );

  const emotionContext = useMemo(() => {
    if (emotionArc.length === 0) {
      return { active: null, previous: null, next: null, taggedCount: 0, ratio: 0 };
    }
    let index = -1;
    if (activeScene?.id) {
      index = emotionArc.findIndex((point) => point.sceneId === activeScene.id);
    }
    if (index < 0) {
      index = 0;
    }
    const activePoint = emotionArc[index] ?? null;
    const previousPoint = index > 0 ? emotionArc[index - 1] : null;
    const nextPoint = index >= 0 && index < emotionArc.length - 1 ? emotionArc[index + 1] : null;
    const taggedCount = emotionArc.reduce(
      (total, point) => (point.emotionTag ? total + 1 : total),
      0,
    );
    const ratio = emotionArc.length > 0 ? taggedCount / emotionArc.length : 0;
    return {
      active: activePoint,
      previous: previousPoint,
      next: nextPoint,
      taggedCount,
      ratio,
    };
  }, [activeScene?.id, emotionArc]);

  const pacingContext = useMemo(() => {
    const metrics = pacingProfile.sceneMetrics;
    if (metrics.length === 0) {
      return {
        active: null,
        slowHighlights: [] as ScenePacingMetric[],
        fastHighlights: [] as ScenePacingMetric[],
      };
    }
    let activeMetric: ScenePacingMetric | null = metrics[0] ?? null;
    if (activeScene?.id) {
      const match = metrics.find((metric) => metric.sceneId === activeScene.id);
      if (match) {
        activeMetric = match;
      }
    }
    const slowHighlights = metrics
      .filter((metric) => metric.paceLabel === 'slow' && metric.sceneId !== activeMetric?.sceneId)
      .slice()
      .sort((left, right) => right.wordCount - left.wordCount)
      .slice(0, 2);
    const fastHighlights = metrics
      .filter((metric) => metric.paceLabel === 'fast' && metric.sceneId !== activeMetric?.sceneId)
      .slice()
      .sort((left, right) => left.wordCount - right.wordCount)
      .slice(0, 2);
    return {
      active: activeMetric,
      slowHighlights,
      fastHighlights,
    };
  }, [activeScene?.id, pacingProfile]);

  const sceneMeta = useMemo(() => {
    if (!project || !activeScene) {
      return null;
    }
    return project.scenes.find((scene) => scene.id === activeScene.id) ?? null;
  }, [project, activeScene]);

  const analysis = useMemo(() => analyseDraft(activeDraft), [activeDraft]);
  const insights = useMemo(
    () => buildInsights(analysis, sceneMeta, activeDraft.trim().length === 0),
    [analysis, sceneMeta, activeDraft],
  );

  const stats: SceneInsight[] = useMemo(() => {
    const items: SceneInsight[] = [
      { label: 'Word count', value: analysis.wordCount.toLocaleString() },
      {
        label: 'Avg sentence length',
        value: analysis.sentenceAverage > 0 ? `${analysis.sentenceAverage.toFixed(1)} words` : '—',
      },
      {
        label: 'Paragraphs',
        value: analysis.paragraphCount.toString(),
      },
    ];
    if (analysis.longestSentenceLength > 0) {
      items.push({
        label: 'Longest sentence',
        value: `${analysis.longestSentenceLength} words`,
      });
    }
    if (sceneMeta?.word_target) {
      items.push({
        label: 'Target',
        value: `${sceneMeta.word_target.toLocaleString()} words`,
      });
    }
    if (sceneMeta?.emotion_tag) {
      items.push({
        label: 'Emotion tag',
        value: sceneMeta.emotion_tag,
      });
    }
    if (sceneMeta?.purpose) {
      items.push({
        label: 'Scene purpose',
        value: sceneMeta.purpose,
      });
    }
    return items;
  }, [analysis, sceneMeta]);

  const sortedScenes = useMemo(
    () => [...scenes].sort((left, right) => left.order - right.order),
    [scenes],
  );

  const selectionSet = useMemo(() => new Set(selectedScenes), [selectedScenes]);
  const disableBatchRun = batchState.running || selectedScenes.length === 0;

  const handleRemoveCategory = useCallback(
    (category: string) => {
      onRubricChange(rubric.filter((entry) => entry !== category));
    },
    [onRubricChange, rubric],
  );

  const quickAddOptions = useMemo(
    () =>
      builtInRubric.filter(
        (entry) => !rubric.some((item) => item.toLowerCase() === entry.toLowerCase()),
      ),
    [builtInRubric, rubric],
  );

  const handleToggleScene = useCallback((sceneId: string) => {
    setSelectedScenes((previous) =>
      previous.includes(sceneId)
        ? previous.filter((id) => id !== sceneId)
        : [...previous, sceneId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedScenes(sortedScenes.map((scene) => scene.id));
  }, [sortedScenes]);

  const handleClearSelection = useCallback(() => {
    setSelectedScenes([]);
  }, []);

  const handleRunBatch = useCallback(() => {
    if (batchState.running) {
      return;
    }
    onBatchCritique(selectedScenes);
  }, [batchState.running, onBatchCritique, selectedScenes]);

  const handleAddCategory = useCallback(() => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      setRubricError('Enter a category name to add.');
      return;
    }
    if (trimmed.length > MAX_RUBRIC_LENGTH) {
      setRubricError(`Categories must be ${MAX_RUBRIC_LENGTH} characters or fewer.`);
      return;
    }
    if (!RUBRIC_PATTERN.test(trimmed)) {
      setRubricError('Only letters, numbers, spaces, and basic punctuation (- . , & : / \') are allowed.');
      return;
    }
    const normalised = trimmed.replace(/\s+/g, ' ');
    if (rubric.some((entry) => entry.toLowerCase() === normalised.toLowerCase())) {
      setRubricError('Category already exists in the rubric.');
      return;
    }
    onRubricChange([...rubric, normalised]);
    setNewCategory('');
    setRubricError(null);
  }, [newCategory, onRubricChange, rubric]);

  const handleQuickAdd = useCallback(
    (category: string) => {
      if (rubric.some((entry) => entry.toLowerCase() === category.toLowerCase())) {
        return;
      }
      onRubricChange([...rubric, category]);
    },
    [onRubricChange, rubric],
  );

  const handleReset = useCallback(() => {
    onRubricChange([...builtInRubric]);
    setRubricError(null);
  }, [builtInRubric, onRubricChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="companion-overlay" role="dialog" aria-modal="true" aria-label="Companion overlay">
      <div className="companion-overlay__panel">
        <header className="companion-overlay__header">
          <div>
            <h2>Companion</h2>
            <p>Guidance and pacing feedback for your current scene.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="companion-overlay__close"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div className="companion-overlay__content">
          <section className="companion-overlay__section">
            <header className="companion-overlay__section-header">
              <h3>Scene insights</h3>
              {activeScene ? <span>{activeScene.id}</span> : null}
            </header>
            {activeScene ? (
              <>
                <p className="companion-overlay__scene-title">
                  {activeScene.title ?? 'Untitled scene'}
                </p>
                <dl className="companion-overlay__stats">
                  {stats.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="companion-overlay__analytics">
                  <div className="companion-overlay__analytics-card">
                    <h4>Emotion arc</h4>
                    {emotionArc.length > 0 ? (
                      <>
                        <p className="companion-overlay__analytics-summary">
                          {emotionContext.active
                            ? `Arc position: ${emotionContext.active.emotionTag ?? 'untagged'} (${formatIntensity(emotionContext.active.intensity)}).`
                            : 'Select a scene to chart its arc position.'}
                        </p>
                        <ul className="companion-overlay__analytics-list">
                          <li>
                            {emotionContext.previous
                              ? `Previous: ${describeEmotionPoint(emotionContext.previous)}`
                              : 'Arc starts here.'}
                          </li>
                          <li>
                            {emotionContext.next
                              ? `Next: ${describeEmotionPoint(emotionContext.next)}`
                              : 'Tag the next scene to extend the arc.'}
                          </li>
                        </ul>
                        <p className="companion-overlay__analytics-footnote">
                          Tagged scenes: {emotionContext.taggedCount}/{emotionArc.length}
                          {emotionArc.length > 0 ? ` (${formatPercentage(emotionContext.ratio)})` : null}
                        </p>
                      </>
                    ) : (
                      <p className="companion-overlay__placeholder">
                        Tag scenes with emotions to build the arc summary.
                      </p>
                    )}
                  </div>
                  <div className="companion-overlay__analytics-card">
                    <h4>Pacing</h4>
                    {pacingProfile.sceneMetrics.length > 0 ? (
                      <>
                        <p className="companion-overlay__analytics-summary">
                          {pacingContext.active
                            ? `Current pace: ${pacingContext.active.paceLabel} at ${formatWordCount(pacingContext.active.wordCount)} words${pacingContext.active.wordsPerBeat ? ` (${pacingContext.active.wordsPerBeat} words/beat)` : ''}.`
                            : 'Select a scene to see pacing metrics.'}
                        </p>
                        <dl className="companion-overlay__analytics-stats">
                          <div>
                            <dt>Average</dt>
                            <dd>{`${formatWordCount(Math.round(pacingProfile.averageWordCount))} words`}</dd>
                          </div>
                          <div>
                            <dt>Median</dt>
                            <dd>{`${formatWordCount(Math.round(pacingProfile.medianWordCount))} words`}</dd>
                          </div>
                          <div>
                            <dt>Std dev</dt>
                            <dd>{`${formatWordCount(Math.round(pacingProfile.standardDeviationWordCount))} words`}</dd>
                          </div>
                        </dl>
                        <ul className="companion-overlay__analytics-list">
                          <li>
                            Slow beats:{' '}
                            {pacingContext.slowHighlights.length > 0
                              ? describePaceHighlights(pacingContext.slowHighlights)
                              : 'None flagged'}
                          </li>
                          <li>
                            Fast beats:{' '}
                            {pacingContext.fastHighlights.length > 0
                              ? describePaceHighlights(pacingContext.fastHighlights)
                              : 'None flagged'}
                          </li>
                        </ul>
                      </>
                    ) : (
                      <p className="companion-overlay__placeholder">
                        Add draft text to measure pacing.
                      </p>
                    )}
                  </div>
                </div>
                <ul className="companion-overlay__insights">
                  {insights.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                  {insights.length === 0 ? (
                    <li>Scene metrics look healthy. Iterate or expand before running a critique.</li>
                  ) : null}
                </ul>
                {analysis.longestSentenceLength > 28 && analysis.longestSentence ? (
                  <blockquote className="companion-overlay__highlight">
                    <strong>Longest sentence snapshot:</strong>
                    <span>{analysis.longestSentence}</span>
                  </blockquote>
                ) : null}
              </>
            ) : (
              <p className="companion-overlay__placeholder">
                Load and select a scene to view pacing and rubric recommendations.
              </p>
            )}
          </section>

          <section className="companion-overlay__section companion-overlay__section--rubric">
            <header className="companion-overlay__section-header">
            <h3>Focus points</h3>
              <span>{rubric.length}</span>
            </header>
            {rubric.length > 0 ? (
              <ul className="companion-overlay__chips">
                {rubric.map((category) => (
                  <li key={category}>
                    <span>{category}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${category}`}
                      onClick={() => handleRemoveCategory(category)}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="companion-overlay__placeholder">
                Add one or more rubric categories to drive critiques.
              </p>
            )}

            <div className="companion-overlay__form">
              <label htmlFor="companion-rubric-input">Add category</label>
              <div className="companion-overlay__input-row">
                <input
                  id="companion-rubric-input"
                  type="text"
                  value={newCategory}
                  maxLength={MAX_RUBRIC_LENGTH}
                  onChange={(event) => {
                    setNewCategory(event.target.value);
                    if (rubricError) {
                      setRubricError(null);
                    }
                  }}
                  aria-describedby={rubricError ? 'companion-rubric-error' : undefined}
                />
                <button type="button" onClick={handleAddCategory}>
                  Add
                </button>
                <button type="button" onClick={handleReset}>
                  Reset defaults
                </button>
              </div>
              {rubricError ? (
                <p
                  id="companion-rubric-error"
                  className="companion-overlay__error"
                  aria-live="polite"
                >
                  {rubricError}
                </p>
              ) : null}
            </div>

            {quickAddOptions.length > 0 ? (
              <div className="companion-overlay__quick-add">
                <span>Quick add</span>
                <div className="companion-overlay__quick-add-buttons">
                  {quickAddOptions.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleQuickAdd(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
          <section className="companion-overlay__section companion-overlay__section--batch">
            <header className="companion-overlay__section-header">
              <h3>Scene reviews</h3>
              <span>{selectedScenes.length}</span>
            </header>
            {sortedScenes.length === 0 ? (
              <p className="companion-overlay__placeholder">
                Load a project with scenes to run batch critiques.
              </p>
            ) : (
              <>
                <ul className="companion-overlay__batch-list">
                  {sortedScenes.map((scene) => {
                    const result = batchState.results[scene.id];
                    const status = result?.status ?? 'idle';
                    const isSelected = selectionSet.has(scene.id);
                    return (
                      <li
                        key={scene.id}
                        className={`companion-overlay__batch-item companion-overlay__batch-item--${status}`}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={batchState.running}
                            onChange={() => handleToggleScene(scene.id)}
                            aria-label={`Select ${scene.title ?? scene.id}`}
                          />
                          <span>
                            <strong>{scene.title}</strong>
                            <em>
                              {scene.id} · #{scene.order}
                            </em>
                          </span>
                        </label>
                        <span
                          className={`companion-overlay__batch-status companion-overlay__batch-status--${status}`}
                        >
                          {statusLabel(status)}
                        </span>
                        {result?.summary ? (
                          <p className="companion-overlay__batch-summary">{result.summary}</p>
                        ) : null}
                        {result?.error ? (
                          <p className="companion-overlay__batch-error">{result.error}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <div className="companion-overlay__batch-actions">
                  <button type="button" onClick={handleSelectAll} disabled={batchState.running}>
                    Select all
                  </button>
                  <button type="button" onClick={handleClearSelection} disabled={batchState.running}>
                    Clear
                  </button>
                  <button type="button" onClick={handleRunBatch} disabled={disableBatchRun}>
                    {batchState.running ? 'Running…' : 'Review selected scenes'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
