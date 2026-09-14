import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { FeedbackNotesRepository } from '../feedbackNotesRepository';
import { IdeationRepository } from '../ideationRepository';
import { RevisionCandidateRepository } from '../revisionCandidateRepository';
import { StoryFoundationRepository } from '../storyFoundationRepository';
import { STORY_FOUNDATION_QUESTIONS } from '../../shared/ipc/storyFoundation';
import { buildProgram7HistoryProjection } from '../../shared/program7History';

const PROJECT_ID = 'program7-scale-project';
const FIXTURE_NOW = '2026-09-13T12:00:00.000Z';
const CORPUS_ROOT = resolve(process.cwd(), '..', 'sample_project', 'program_7_corpus', 'carmilla');
const BASELINE_DRAFT_ROOT = join(CORPUS_ROOT, 'derived', 'baseline', 'drafts');
const SCALES = [1, 2, 4, 8] as const;
const roots: string[] = [];
const scaleObservations: unknown[] = [];

type Scale = (typeof SCALES)[number];
type Unit = { readonly id: string; readonly body: string };

function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

async function corpusUnits(): Promise<readonly Unit[]> {
  const names = ['carmilla-prologue.md', ...Array.from({ length: 16 }, (_, i) => `carmilla-chapter-${String(i + 1).padStart(2, '0')}.md`)];
  return Promise.all(names.map(async (name, index) => ({
    id: index === 0 ? 'carmilla-prologue' : `carmilla-chapter-${String(index).padStart(2, '0')}`,
    body: await readFile(join(BASELINE_DRAFT_ROOT, name), 'utf8'),
  })));
}

function scaleUnits(baseline: readonly Unit[], scale: Scale): readonly Unit[] {
  if (scale === 1) return baseline;
  return Array.from({ length: baseline.length * scale }, (_, index) => ({
    id: `synthetic-${scale}x-unit-${String(index + 1).padStart(3, '0')}`,
    body: `P7 synthetic scale fixture ${scale}x, unit ${index + 1}. A bounded non-evidence passage for mechanical qualification.`,
  }));
}

function boundedSource(unit: Unit): string {
  return unit.body.slice(0, 2_000) || `Synthetic source for ${unit.id}.`;
}

async function makeFixture(scale: Scale, baseline: readonly Unit[]) {
  const root = await mkdtemp(join(tmpdir(), `black-skies-p7-scale-${scale}x-`));
  roots.push(root);
  let id = 0;
  const createId = () => `fixture-${++id}`;
  const now = () => new Date(FIXTURE_NOW);
  const units = scaleUnits(baseline, scale);
  const feedback = new FeedbackNotesRepository(root, now);
  const candidates = new RevisionCandidateRepository(root, now, createId);
  const ideation = new IdeationRepository(root, now, createId);
  const foundation = new StoryFoundationRepository(root, now, createId);

  const first = units[0]!;
  const firstSource = boundedSource(first);
  const sourceBodySha256 = digest(firstSource);
  const feedbackSeed = await feedback.createRevisionItem({
    projectId: PROJECT_ID,
    unitId: first.id,
    body: 'A bounded deterministic review concern.',
    sourceId: first.id,
    sourceKind: 'manuscript',
    sourceBodyFingerprint: digest(first.body),
    sourceRevision: 1,
    sourceGeneration: 1,
    provenance: { source: 'manual', origin: 'author' },
  });
  const feedbackTemplate = feedbackSeed.document.notes[0]!;
  await writeFile(feedback.filePath, `${JSON.stringify({
    ...feedbackSeed.document,
    revision: units.length,
    notes: units.map((unit, index) => ({
      ...feedbackTemplate,
      id: `revision-${scale}-${index + 1}`,
      unitId: unit.id,
      body: `Concern ${index + 1} in ${scale}x mechanical fixture.`,
      sourceId: unit.id,
      sourceBodyFingerprint: digest(unit.body),
      documentRevision: index + 1,
    })),
  }, null, 2)}\n`, 'utf8');

  const candidateSeed = await candidates.createManual(PROJECT_ID, 0, {
    sourceSnapshot: { unitId: first.id, bodySha256: sourceBodySha256, text: firstSource },
    sourceAnchor: {
      unitId: first.id,
      selectionStart: 0,
      selectionEnd: Math.min(16, firstSource.length),
      selectionFingerprint: digest(firstSource.slice(0, Math.min(16, firstSource.length))),
    },
    purpose: 'Improve a bounded transition.',
    protection: { excluded: false, class: 'ordinary' },
    warnings: [],
    candidateText: 'A bounded candidate for author comparison.',
  });
  const candidateTemplate = candidateSeed.document.candidates[0]!;
  await writeFile(candidates.filePath, `${JSON.stringify({
    ...candidateSeed.document,
    revision: units.length,
    candidates: units.map((unit, index) => {
      const source = boundedSource(unit);
      const selection = source.slice(0, Math.min(16, source.length));
      return {
        ...candidateTemplate,
        id: `candidate-${scale}-${index + 1}`,
        unitId: unit.id,
        sourceBodySha256: digest(source),
        sourceSnapshot: { unitId: unit.id, bodySha256: digest(source), text: source },
        sourceAnchor: {
          ...candidateTemplate.sourceAnchor,
          unitId: unit.id,
          selectionEnd: selection.length,
          selectionFingerprint: digest(selection),
        },
        history: [{ ...candidateTemplate.history[0]!, id: `candidate-event-${scale}-${index + 1}` }],
      };
    }),
  }, null, 2)}\n`, 'utf8');

  const seedResult = await ideation.captureSeed(PROJECT_ID, 0, {
    title: 'Carmilla-derived mechanical seed',
    body: 'A deterministic seed used only for scale qualification.',
    kind: 'fragment',
    tags: ['scale-fixture', 'scale-search-target'],
    protected: false,
  });
  const seedTemplate = seedResult.document.seeds[0]!;
  await writeFile(ideation.filePath, `${JSON.stringify({
    ...seedResult.document,
    revision: units.length,
    seeds: units.map((unit, index) => {
      const seedId = `seed-${scale}-${index + 1}`;
      const versionId = `seed-version-${scale}-${index + 1}`;
      return {
        ...seedTemplate,
        id: seedId,
        versions: [{ ...seedTemplate.versions[0]!, id: versionId }],
        currentVersionId: versionId,
        history: [{ ...seedTemplate.history[0]!, id: `seed-event-${scale}-${index + 1}`, objectId: seedId }],
        tags: index === 0 ? ['scale-fixture', 'scale-search-target'] : ['scale-fixture'],
        projectReferences: [PROJECT_ID],
        branchIds: [],
      };
    }),
    branches: [],
    premiseTests: [],
    promotionPackages: [],
    aiAlternatives: [],
    history: units.map((unit, index) => ({
      ...seedResult.document.history[0]!,
      id: `ideation-event-${scale}-${index + 1}`,
      objectId: `seed-${scale}-${index + 1}`,
    })),
  }, null, 2)}\n`, 'utf8');

  await foundation.setAnswer(PROJECT_ID, 0, {
    questionId: STORY_FOUNDATION_QUESTIONS[0]!.id,
    posture: 'answered',
    text: 'A bounded mechanical qualification project.',
  });

  return { root, units, feedback, candidates, ideation, foundation };
}

async function measure<T>(action: () => Promise<T>): Promise<{ readonly value: T; readonly durationMs: number }> {
  const started = performance.now();
  const value = await action();
  return { value, durationMs: performance.now() - started };
}

async function runScale(scale: Scale, baseline: readonly Unit[]) {
  const fixture = await makeFixture(scale, baseline);
  const rssBeforeBytes = process.memoryUsage().rss;
  const maxRssBeforeBytes = Math.round(process.resourceUsage().maxRSS * 1024);
  const opened = await measure(() => Promise.all([
    fixture.feedback.read(PROJECT_ID),
    fixture.candidates.read(PROJECT_ID),
    fixture.ideation.read(PROJECT_ID),
    fixture.foundation.read(PROJECT_ID),
  ]));
  const listed = await measure(async () => {
    const [revisionItems, library, search] = await Promise.all([
      fixture.feedback.listRevisionItems(PROJECT_ID),
      fixture.ideation.filterLibrary(PROJECT_ID, { kind: 'fragment' }),
      fixture.ideation.filterLibrary(PROJECT_ID, { kind: 'fragment', tag: 'scale-search-target' }),
    ]);
    return { revisionItems, library, search };
  });
  const projected = await measure(async () => buildProgram7HistoryProjection({
    feedbackItems: listed.value.revisionItems,
    ideaSeeds: listed.value.library.document.seeds,
    revisionCandidates: (await fixture.candidates.read(PROJECT_ID)).document.candidates,
  }, 25));
  const firstCandidate = (await fixture.candidates.read(PROJECT_ID)).document.candidates[0]!;
  const firstNote = (await fixture.feedback.read(PROJECT_ID)).notes[0]!;
  const saved = await measure(async () => {
    const candidateDocument = await fixture.candidates.edit(PROJECT_ID, fixture.units.length, firstCandidate.id, 'Edited bounded candidate.');
    await fixture.foundation.setAnswer(PROJECT_ID, 1, {
      questionId: STORY_FOUNDATION_QUESTIONS[1]!.id,
      posture: 'answered',
      text: 'The fixture remains mechanical and non-evidence.',
    });
    return candidateDocument;
  });
  const rechecked = await measure(() => fixture.feedback.recordRecheck(
    PROJECT_ID,
    fixture.units.length,
    firstNote.id,
    'still_appears_present',
    'Deterministic bounded recheck.',
    { method: 'deterministic', sourceStatus: 'current' },
  ));
  const repeated = [] as number[];
  const rssSamplesBytes = [] as number[];
  for (let cycle = 0; cycle < 3; cycle += 1) {
    const cycleResult = await measure(async () => {
      const [feedbackDocument, candidateDocument, ideationSnapshot, foundationSnapshot] = await Promise.all([
        fixture.feedback.read(PROJECT_ID),
        fixture.candidates.read(PROJECT_ID),
        fixture.ideation.read(PROJECT_ID),
        fixture.foundation.read(PROJECT_ID),
      ]);
      buildProgram7HistoryProjection({
        feedbackItems: feedbackDocument.notes,
        revisionCandidates: candidateDocument.document.candidates,
        ideaSeeds: ideationSnapshot.document.seeds,
      }, 25);
      return foundationSnapshot;
    });
    repeated.push(cycleResult.durationMs);
    rssSamplesBytes.push(process.memoryUsage().rss);
  }
  const rssAfterBytes = process.memoryUsage().rss;
  const maxRssAfterBytes = Math.round(process.resourceUsage().maxRSS * 1024);
  const fileBytes = await Promise.all([
    fixture.feedback.filePath,
    fixture.candidates.filePath,
    fixture.ideation.filePath,
    fixture.foundation.filePath,
  ].map(async (filePath) => (await stat(filePath)).size));
  // The protocol defines 1x/4x/8x gates. 2x uses the conservative midpoint
  // between the adjacent published gates rather than inheriting 8x's bound.
  const openLimitMs = ({ 1: 5_000, 2: 7_500, 4: 10_000, 8: 20_000 } as const)[scale];
  const saveLimitMs = ({ 1: 1_000, 2: 2_000, 4: 2_500, 8: 3_000 } as const)[scale];
  const recheckLimitMs = ({ 1: 2_000, 2: 4_000, 4: 6_000, 8: 8_000 } as const)[scale];
  const rssCycleRangeBytes = Math.max(...rssSamplesBytes) - Math.min(...rssSamplesBytes);
  const result = {
    scale: `${scale}x`,
    fixtureKind: scale === 1 ? 'carmilla-baseline' : 'synthetic-non-evidence',
    unitCount: fixture.units.length,
    timingsMs: {
      open: opened.durationMs,
      listAndPagination: listed.durationMs,
      search: listed.durationMs,
      projection: projected.durationMs,
      save: saved.durationMs,
      recheck: rechecked.durationMs,
      repeatedLoadProjection: repeated,
    },
    limitsMs: { open: openLimitMs, save: saveLimitMs, recheck: recheckLimitMs },
    counts: {
      feedback: listed.value.revisionItems.length,
      candidates: (await fixture.candidates.read(PROJECT_ID)).document.candidates.length,
      ideationSeeds: listed.value.library.document.seeds.length,
      searchMatches: listed.value.search.document.seeds.length,
      historyTotal: projected.value.totalSourceItems,
      historyPageSize: projected.value.items.length,
      historyTrimmed: projected.value.trimmedCount,
    },
    resourceObservation: {
      rssBeforeBytes,
      rssAfterBytes,
      rssDeltaBytes: Math.max(0, rssAfterBytes - rssBeforeBytes),
      maxRssBeforeBytes,
      maxRssAfterBytes,
      maxRssDeltaBytes: Math.max(0, maxRssAfterBytes - maxRssBeforeBytes),
      repeatedCycles: 3,
      rssSamplesBytes,
      rssCycleRangeBytes,
      measured: 'process.memoryUsage().rss samples plus process.resourceUsage().maxRSS high-water observation; Windows working-set attribution and host physical-memory availability were not measured',
    },
    eventLoopFreezeObservation: 'not measured by this repository harness; no main-thread freeze claim is made',
    sidecarBytes: fileBytes,
  };
  expect(result.unitCount).toBe(result.counts.feedback);
  expect(result.unitCount).toBe(result.counts.candidates);
  expect(result.unitCount).toBe(result.counts.ideationSeeds);
  expect(result.counts.searchMatches).toBe(1);
  expect(result.counts.historyTotal).toBe(result.unitCount * 3);
  expect(result.counts.historyPageSize).toBeLessThanOrEqual(25);
  expect(result.counts.historyTrimmed).toBe(result.counts.historyTotal - result.counts.historyPageSize);
  expect(result.timingsMs.open).toBeLessThanOrEqual(result.limitsMs.open);
  expect(result.timingsMs.save).toBeLessThanOrEqual(result.limitsMs.save);
  expect(result.timingsMs.recheck).toBeLessThanOrEqual(result.limitsMs.recheck);
  expect(result.resourceObservation.rssCycleRangeBytes).toBeLessThan(512 * 1024 * 1024);
  expect(result.resourceObservation.maxRssDeltaBytes).toBeLessThan(512 * 1024 * 1024);
  expect(result.sidecarBytes.reduce((sum, value) => sum + value, 0)).toBeLessThan(64 * 1024 * 1024);
  scaleObservations.push(result);
  console.info(`[P7 scale] ${JSON.stringify(result)}`);
  return result;
}

describe('Program 7 G2 scale and performance mechanical matrix', () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  afterAll(async () => {
    const reportPath = process.env.P7_SCALE_REPORT_PATH;
    if (reportPath) await writeFile(reportPath, `${JSON.stringify(scaleObservations, null, 2)}\n`, 'utf8');
  });

  it.each(SCALES)('%dx Carmilla-derived load/list/persistence fixture remains bounded', async (scale) => {
    const baseline = await corpusUnits();
    await runScale(scale, baseline);
  });
});
