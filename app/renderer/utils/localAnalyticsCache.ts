import type {
  AnalyticsScenes,
  AnalyticsSummary,
  ReadabilityMetrics,
} from '../../shared/ipc/services';

type SceneCacheRecord = {
  scene_id: string;
  order?: number;
  title?: string;
  word_count?: number;
  dialogue_ratio?: number;
  narration_ratio?: number;
  readability_metrics?: ReadabilityMetrics;
};

type LocalAnalyticsCache = {
  summary: AnalyticsSummary;
  scenes: AnalyticsScenes;
};

const ANALYTICS_DIR = ['history', 'analytics'];

function getFsApi() {
  const fsApi = window.__electronApi?.fs;
  if (!fsApi) {
    throw new Error('Filesystem bridge unavailable while loading analytics cache.');
  }
  return fsApi;
}

function clampRatio(value?: number | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function computeStructuralScore(wordCount: number, dialogueRatio: number): number {
  const base = Math.max(wordCount, 0);
  const scale = clampRatio(dialogueRatio);
  return Number((base * (1 + scale)).toFixed(2));
}

function classifyPacingBucket(score: number, meanScore: number): 'Slow' | 'Neutral' | 'Fast' {
  if (meanScore <= 0) {
    return 'Neutral';
  }
  const slowThreshold = meanScore * 0.9;
  const fastThreshold = meanScore * 1.1;
  if (score <= slowThreshold) {
    return 'Slow';
  }
  if (score >= fastThreshold) {
    return 'Fast';
  }
  return 'Neutral';
}

function averageNumeric(
  records: ReadabilityMetrics[],
  key: keyof ReadabilityMetrics,
): number | null {
  const values = records
    .map((record) => record[key])
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number | null, decimals: number): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return Number(value.toFixed(decimals));
}

function majorityBucket(records: ReadabilityMetrics[]): string | null {
  const counts = new Map<string, number>();
  for (const record of records) {
    const bucket = record.bucket;
    if (typeof bucket !== 'string' || !bucket) {
      continue;
    }
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  let winning: string | null = null;
  let maxCount = 0;
  for (const [bucket, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      winning = bucket;
    }
  }
  return winning;
}

async function readSceneCacheFiles(projectPath: string): Promise<SceneCacheRecord[]> {
  const fsApi = getFsApi();
  const analyticsPath = fsApi.resolvePath(projectPath, ...ANALYTICS_DIR);
  let entries: Array<{ name: string; isFile: boolean }> = [];
  try {
    entries = await fsApi.readDir(analyticsPath);
  } catch {
    return [];
  }
  const records: SceneCacheRecord[] = [];
  for (const entry of entries) {
    if (!entry.isFile || !entry.name.endsWith('.json')) {
      continue;
    }
    try {
      const payload = await fsApi.readJson(fsApi.resolvePath(analyticsPath, entry.name));
      if (
        payload &&
        typeof payload === 'object' &&
        typeof payload.scene_id === 'string'
      ) {
        records.push(payload as SceneCacheRecord);
      }
    } catch {
      continue;
    }
  }
  return records;
}

function buildScenePayload(
  records: SceneCacheRecord[],
  projectPath: string,
  projectId?: string | null,
): AnalyticsScenes {
  if (!records.length) {
    return { projectId: projectId ?? '', projectPath, scenes: [] };
  }
  const sorted = [...records].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const structuralScores = sorted.map((record) =>
    computeStructuralScore(record.word_count ?? 0, record.dialogue_ratio ?? 0),
  );
  const meanScore =
    structuralScores.length > 0
      ? structuralScores.reduce((total, value) => total + value, 0) / structuralScores.length
      : 0;
  const scenes = sorted.map((record, index) => {
    const dialogue = clampRatio(record.dialogue_ratio ?? 0);
    const narration = clampRatio(record.narration_ratio ?? 0);
    const structuralScore = structuralScores[index];
    const bucket = classifyPacingBucket(structuralScore, meanScore);
    const readabilityMetrics = record.readability_metrics ?? null;
    const avgSentence = readabilityMetrics?.avg_sentence_len;
    const readabilityValue =
      typeof avgSentence === 'number' && avgSentence > 0
        ? Number(avgSentence.toFixed(2))
        : null;
    return {
      sceneId: record.scene_id,
      index,
      title: record.title || `Scene ${index + 1}`,
      wordCount: record.word_count ?? 0,
      readability: readabilityValue,
      readabilityMetrics,
      density: {
        dialogueRatio: Number(dialogue.toFixed(3)),
        narrationRatio: Number(narration.toFixed(3)),
      },
      pacing: {
        structuralScore,
        bucket,
      },
    };
  });
  return {
    projectId: projectId ?? '',
    projectPath,
    scenes,
  };
}

function buildSummaryPayload(
  records: SceneCacheRecord[],
  projectPath: string,
  projectId?: string | null,
): AnalyticsSummary {
  const wordCount = records.reduce((total, record) => total + (record.word_count ?? 0), 0);
  const readabilityRecords = records
    .map((record) => record.readability_metrics)
    .filter((value): value is ReadabilityMetrics => Boolean(value));
  const avgSentence = round(averageNumeric(readabilityRecords, 'avg_sentence_len'), 2);
  const pctLong = round(averageNumeric(readabilityRecords, 'pct_long_sentences'), 3);
  const ttr = round(averageNumeric(readabilityRecords, 'ttr'), 3);
  const bucket = majorityBucket(readabilityRecords) ?? 'Moderate';
  const dialogueValues = records.map((record) => clampRatio(record.dialogue_ratio ?? 0));
  const narrationValues = records.map((record) => clampRatio(record.narration_ratio ?? 0));
  const dialogueRatio =
    dialogueValues.length > 0
      ? Number(
          (dialogueValues.reduce((total, value) => total + value, 0) / dialogueValues.length).toFixed(
            3,
          ),
        )
      : 0;
  const narrationRatio =
    narrationValues.length > 0
      ? Number(
          (
            narrationValues.reduce((total, value) => total + value, 0) / narrationValues.length
          ).toFixed(3),
        )
      : 0;
  const summary: AnalyticsSummary = {
    projectId: projectId ?? '',
    projectPath,
    scenes: records.length,
    wordCount,
    avgReadability: avgSentence,
    readability: {
      avg_sentence_len: avgSentence,
      pct_long_sentences: pctLong,
      ttr,
      bucket,
    },
    dialogue_ratio: dialogueRatio,
    narration_ratio: narrationRatio,
  };
  return summary;
}

export async function loadLocalAnalytics(
  projectPath: string,
  projectId?: string | null,
): Promise<LocalAnalyticsCache | null> {
  if (!projectPath) {
    return null;
  }
  const records = await readSceneCacheFiles(projectPath);
  if (!records.length) {
    return null;
  }
  const scenes = buildScenePayload(records, projectPath, projectId);
  const summary = buildSummaryPayload(records, projectPath, projectId);
  return { summary, scenes };
}
