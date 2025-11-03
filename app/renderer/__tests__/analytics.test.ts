import { describe, expect, it } from 'vitest';

import {
  computeEmotionArc,
  computePacingProfile,
  resolveAnalyticsConfig,
  type ResolvedAnalyticsConfig,
} from '../utils/analytics';

const SAMPLE_CONFIG: ResolvedAnalyticsConfig = {
  emotionIntensity: {
    dread: 1,
    tension: 0.75,
  },
  defaultEmotionIntensity: 0.4,
  pace: {
    slowThreshold: 1.5,
    fastThreshold: 0.5,
  },
};

describe('analytics helpers', () => {
  it('resolves analytics config with defaults when values are missing', () => {
    const resolved = resolveAnalyticsConfig({
      emotionIntensity: { dread: 0.9 },
      defaultEmotionIntensity: 0.7,
      pace: { slowThreshold: 1.4 },
    });

    expect(resolved.emotionIntensity).toMatchObject({ dread: 0.9, tension: 0.85 });
    expect(resolved.defaultEmotionIntensity).toBe(0.7);
    expect(resolved.pace.slowThreshold).toBe(1.4);
    expect(resolved.pace.fastThreshold).toBe(0.8);
  });

  it('computes emotion arc intensity using config overrides', () => {
    const scenes = [
      { id: 'a', order: 2, title: 'Two', emotion_tag: 'dread' },
      { id: 'b', order: 1, title: 'One', emotion_tag: 'unknown' },
    ];

    const arc = computeEmotionArc(scenes as any, SAMPLE_CONFIG);
    expect(arc.map((point) => point.sceneId)).toEqual(['b', 'a']);
    expect(arc[0].intensity).toBe(0.4); // falls back to default
    expect(arc[1].intensity).toBe(1);
  });

  it('computes pacing profile with running averages and summaries', () => {
    const scenes = [
      { id: 'a', order: 1, title: 'One' },
      { id: 'b', order: 2, title: 'Two', beats: ['beat1', 'beat2'] },
    ];
    const drafts = {
      a: '# Scene A\n\nFirst scene text with four words.',
      b: '# Scene B\n\nSecond scene has more words overall for testing.',
    };

    const profile = computePacingProfile(scenes as any, drafts, SAMPLE_CONFIG);
    expect(profile.sceneMetrics).toHaveLength(2);
    expect(profile.sceneMetrics[0].paceLabel).toBe('steady');
    expect(profile.sceneMetrics[1].paceLabel).toBe('steady');
    expect(profile.sceneMetrics[1].wordsPerBeat).toBeGreaterThan(0);
    expect(profile.averageWordCount).toBeGreaterThan(0);
    expect(profile.sceneMetrics[0].wordCount).toBeGreaterThan(0);
  });
});
