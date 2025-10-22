import type { AnalyticsConfig } from '../../shared/config/runtime';
import type { SceneDraftMetadata } from '../../shared/ipc/projectLoader';
import { extractSceneBody } from './sceneMarkdown';

export interface EmotionArcPoint {
  sceneId: string;
  order: number;
  title: string;
  emotionTag: string | null;
  intensity: number;
}

export interface ScenePacingMetric {
  sceneId: string;
  order: number;
  title: string;
  wordCount: number;
  beatCount: number | null;
  wordsPerBeat: number | null;
  paceLabel: 'slow' | 'steady' | 'fast';
}

export interface PacingProfile {
  averageWordCount: number;
  medianWordCount: number;
  standardDeviationWordCount: number;
  sceneMetrics: ScenePacingMetric[];
}

export interface ResolvedAnalyticsConfig {
  emotionIntensity: Record<string, number>;
  defaultEmotionIntensity: number;
  pace: {
    slowThreshold: number;
    fastThreshold: number;
  };
}

const DEFAULT_EMOTION_INTENSITY: Record<string, number> = {
  dread: 1.0,
  tension: 0.85,
  revelation: 0.65,
  aftermath: 0.45,
  respite: 0.25,
};

const DEFAULT_CONFIG: ResolvedAnalyticsConfig = {
  emotionIntensity: DEFAULT_EMOTION_INTENSITY,
  defaultEmotionIntensity: 0.5,
  pace: {
    slowThreshold: 1.2,
    fastThreshold: 0.8,
  },
};

export function resolveAnalyticsConfig(config?: AnalyticsConfig | null): ResolvedAnalyticsConfig {
  if (!config) {
    return DEFAULT_CONFIG;
  }

  const emotionIntensity = {
    ...DEFAULT_EMOTION_INTENSITY,
    ...config.emotionIntensity,
  };

  const defaultEmotionIntensity =
    typeof config.defaultEmotionIntensity === 'number'
      ? config.defaultEmotionIntensity
      : DEFAULT_CONFIG.defaultEmotionIntensity;

  const slowThreshold =
    typeof config.pace?.slowThreshold === 'number'
      ? config.pace.slowThreshold
      : DEFAULT_CONFIG.pace.slowThreshold;
  const fastThreshold =
    typeof config.pace?.fastThreshold === 'number'
      ? config.pace.fastThreshold
      : DEFAULT_CONFIG.pace.fastThreshold;

  return {
    emotionIntensity,
    defaultEmotionIntensity,
    pace: {
      slowThreshold,
      fastThreshold,
    },
  };
}

export function computeEmotionArc(
  scenes: SceneDraftMetadata[],
  config: ResolvedAnalyticsConfig,
): EmotionArcPoint[] {
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  return sortedScenes.map((scene) => {
    const emotionTag = scene.emotion_tag ?? null;
    const intensityRaw =
      emotionTag && config.emotionIntensity[emotionTag] !== undefined
        ? config.emotionIntensity[emotionTag]
        : config.defaultEmotionIntensity;
    const intensity = Number(Number.parseFloat(String(intensityRaw)).toFixed(2));
    return {
      sceneId: scene.id,
      order: scene.order,
      title: scene.title ?? `Scene ${scene.order}`,
      emotionTag,
      intensity,
    };
  });
}

function countWords(text: string): number {
  if (!text) {
    return 0;
  }
  const tokens = text
    .replace(/\r\n/g, '\n')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  return tokens.length;
}

function classifyPace(
  wordCount: number,
  average: number,
  config: ResolvedAnalyticsConfig,
): 'slow' | 'steady' | 'fast' {
  if (average <= 0) {
    return 'steady';
  }
  if (wordCount >= average * config.pace.slowThreshold) {
    return 'slow';
  }
  if (wordCount <= average * config.pace.fastThreshold) {
    return 'fast';
  }
  return 'steady';
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function standardDeviation(values: number[], meanValue: number): number {
  if (values.length <= 1) {
    return 0;
  }
  const variance =
    values.reduce((total, value) => total + (value - meanValue) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computePacingProfile(
  scenes: SceneDraftMetadata[],
  drafts: Record<string, string>,
  config: ResolvedAnalyticsConfig,
): PacingProfile {
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  const metrics: ScenePacingMetric[] = [];
  const wordCounts: number[] = [];

  for (const scene of sortedScenes) {
    const rawDraft = drafts[scene.id] ?? '';
    const body = extractSceneBody(rawDraft);
    const wordCount = countWords(body);
    wordCounts.push(wordCount);

    const averageSoFar =
      wordCounts.reduce((total, count) => total + count, 0) / wordCounts.length;
    const paceLabel = classifyPace(wordCount, averageSoFar, config);

    const beats = Array.isArray(scene.beats) ? scene.beats : undefined;
    const beatCount = beats?.length ? beats.length : null;
    const wordsPerBeat =
      beatCount && beatCount > 0 ? Number((wordCount / beatCount).toFixed(2)) : null;

    metrics.push({
      sceneId: scene.id,
      order: scene.order,
      title: scene.title ?? `Scene ${scene.order}`,
      wordCount,
      beatCount,
      wordsPerBeat,
      paceLabel,
    });
  }

  const averageWordCount =
    wordCounts.length > 0
      ? wordCounts.reduce((total, count) => total + count, 0) / wordCounts.length
      : 0;
  const medianWordCount = median(wordCounts);
  const standardDeviationWordCount = standardDeviation(wordCounts, averageWordCount);

  return {
    averageWordCount: Number(averageWordCount.toFixed(2)),
    medianWordCount: Number(medianWordCount.toFixed(2)),
    standardDeviationWordCount: Number(standardDeviationWordCount.toFixed(2)),
    sceneMetrics: metrics,
  };
}

