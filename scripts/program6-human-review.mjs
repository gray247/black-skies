#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), '..');
const REVIEW_ROOT = path.join(os.tmpdir(), 'black-skies-program6-human-review');
const NOW = '2026-09-01T12:00:00.000Z';

const PROJECTS = [
  {
    directory: 'lantern-house',
    projectId: 'proj_lantern_house_review',
    name: 'Lantern House',
    signalPosture: 'quiet',
    projectPosture: 'develop',
    units: [
      ['lh_01', 'The Unlit Door'],
      ['lh_02', 'A Map in the Dust'],
      ['lh_03', 'The Borrowed Flame'],
    ],
    signal: {
      id: 'signal_lantern_threshold',
      lifecycle: 'accepted',
      currentness: 'current',
      evidenceClass: 'observed',
      impact: 'attention',
      confidenceBand: 'medium',
      summary: 'The threshold image recurs before each disclosure.',
      evidenceSummary: 'Three source units use the threshold as a transition marker; review the pattern before treating it as intentional structure.',
      protectionClass: 'included',
    },
    emotion: [
      ['lh_01', 'unease', 'medium', 'planned', 'author-intent'],
      ['lh_01', 'uncertainty', 'high', 'observed', 'manuscript'],
      ['lh_02', 'resolve', 'medium', 'planned', 'author-intent'],
      ['lh_03', 'resolve', 'high', 'observed', 'manuscript'],
    ],
  },
  {
    directory: 'northline-letters',
    projectId: 'proj_northline_letters_review',
    name: 'Northline Letters',
    signalPosture: 'ask-only',
    projectPosture: 'finish',
    units: [
      ['nl_01', 'The First Letter'],
      ['nl_02', 'The Missing Letter'],
      ['nl_03', 'The First Letter'],
      ['nl_04', 'The Reply'],
    ],
    signal: {
      id: 'signal_northline_order',
      lifecycle: 'reviewed',
      currentness: 'stale',
      evidenceClass: 'planned',
      impact: 'informational',
      confidenceBand: 'low',
      summary: 'A repeated letter title may indicate a reveal-order collision.',
      evidenceSummary: 'The same event label appears in two source units while the saved signal predates the current project revision.',
      protectionClass: 'included',
    },
    emotion: [
      ['nl_01', 'hope', 'low', 'planned', 'author-intent'],
      ['nl_02', 'doubt', 'high', 'observed', 'manuscript'],
      ['nl_03', 'doubt', 'medium', 'planned', 'author-intent'],
      ['nl_04', 'relief', 'medium', 'observed', 'manuscript'],
    ],
  },
  {
    directory: 'glass-orchard',
    projectId: 'proj_glass_orchard_review',
    name: 'Glass Orchard',
    signalPosture: 'alert',
    projectPosture: 'explore',
    units: [
      ['go_01', 'The Empty Conservatory'],
      ['go_02', 'A Red Apple'],
      ['go_03', 'The Frost Line'],
      ['go_04', 'The Keeper Returns'],
    ],
    signal: {
      id: 'signal_glass_protected',
      lifecycle: 'reviewed',
      currentness: 'stale',
      evidenceClass: 'observed',
      impact: 'urgent',
      confidenceBand: 'high',
      summary: 'This protected source summary must never be rendered.',
      evidenceSummary: 'This protected source explanation must never be rendered.',
      protectionClass: 'protected',
    },
    emotion: [
      ['go_01', 'stillness', 'medium', 'planned', 'author-intent'],
      ['go_02', 'alarm', 'high', 'observed', 'manuscript'],
      ['go_03', 'alarm', 'very-high', 'planned', 'author-intent'],
      ['go_04', 'release', 'medium', 'observed', 'manuscript'],
    ],
  },
];

function ref(projectId, unitId, order, sourceKind = 'story-unit', sourceRevision = 1) {
  return {
    projectId,
    sourceKind,
    sourceId: unitId,
    sourceRevision,
    sourceFingerprint: `${projectId}:${unitId}:fixture`,
    unitId,
    orderIndex: order,
    orderBasis: sourceKind === 'manuscript' ? 'manuscript' : 'planning',
  };
}

function provenance(project, protectionClass = 'included', origin = 'author') {
  return {
    sourceOwner: `Program 6 review fixture · ${project.name}`,
    origin,
    visibility: protectionClass === 'included' ? 'included' : 'metadata-only',
    citationRequired: true,
    protectionClass,
  };
}

function documentFor(project) {
  const authorRecords = project.emotion.map(([unitId, label, intensity, lane, sourceKind], index) => ({
    recordId: `emotion_${project.directory}_${index + 1}`,
    projectId: project.projectId,
    unitId,
    evidenceClass: lane,
    label,
    intensityBand: intensity,
    recordKind: 'emotion-graph',
    emotionLane: lane,
    emotionIntensity: intensity,
    subjectLabel: 'protagonist',
    currentness: 'current',
    positionRefs: [ref(project.projectId, unitId, project.units.findIndex(([id]) => id === unitId) + 1, sourceKind)],
    provenance: provenance(project),
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const signalRef = ref(project.projectId, project.units[0][0], 1);
  const signal = {
    schemaVersion: 'BlackSkiesStoryIntelligence v1',
    signalId: project.signal.id,
    projectId: project.projectId,
    positionRefs: [signalRef],
    sourceOwner: `Program 6 review fixture · ${project.name}`,
    evidenceClass: project.signal.evidenceClass,
    impact: project.signal.impact,
    confidenceBand: project.signal.confidenceBand,
    currentness: project.signal.currentness,
    lifecycle: project.signal.lifecycle,
    summary: project.signal.summary,
    evidenceSummary: project.signal.evidenceSummary,
    provenance: provenance(project, project.signal.protectionClass),
    createdAt: NOW,
    updatedAt: NOW,
  };
  return {
    schemaVersion: 'BlackSkiesStoryIntelligence v1',
    projectId: project.projectId,
    revision: 0,
    settings: {
      signalPosture: project.signalPosture,
      projectPosture: project.projectPosture,
      analysisPolicy: {
        schemaVersion: 1,
        signalPosture: project.signalPosture,
        projectPosture: project.projectPosture,
        deterministicEnabled: true,
        optionalInferenceEnabled: false,
        readerEffectLaneEnabled: false,
        allowedSourceClasses: ['included', 'deterministic-only', 'local-only'],
        excludedSourceClasses: ['hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'protected', 'ai-excluded'],
        selectedScopePolicy: 'project-local',
        retentionPolicy: 'metadata-only-bounded',
        updatedAt: NOW,
      },
    },
    unitPolicies: project.units.map(([unitId]) => ({ unitId, enabled: true, updatedAt: NOW })),
    authorRecords,
    durableSignals: [signal],
    dispositions: [],
    history: [],
    updatedAt: NOW,
  };
}

async function materializeProject(project, root) {
  const projectRoot = path.join(root, project.directory);
  await mkdir(path.join(projectRoot, 'drafts'), { recursive: true });
  await writeFile(path.join(projectRoot, 'project.json'), `${JSON.stringify({
    schema_version: 'ProjectMetadataSchema v1',
    project_id: project.projectId,
    name: project.name,
    bootstrap_state: 'scaffold_initialized',
    bootstrap_template: 'starter-scaffold-v1',
  }, null, 2)}\n`);
  await writeFile(path.join(projectRoot, 'outline.json'), `${JSON.stringify({
    schema_version: 'OutlineSchema v1',
    outline_id: `outline_${project.projectId}`,
    project_id: project.projectId,
    acts: ['Act I'],
    chapters: [{ id: 'ch_0001', order: 1, title: 'Review Corpus' }],
    scenes: project.units.map(([id, title], index) => ({ id, title, order: index + 1, chapter_id: 'ch_0001' })),
  }, null, 2)}\n`);
  await Promise.all(project.units.map(([id, title], index) => writeFile(
    path.join(projectRoot, 'drafts', `${id}.md`),
    `---\nid: ${id}\ntitle: ${title}\norder: ${index + 1}\nchapter_id: ch_0001\n---\n\nSynthetic review-corpus prose for ${title}.\n`,
  )));
  await writeFile(path.join(projectRoot, 'story-intelligence.json'), `${JSON.stringify(documentFor(project), null, 2)}\n`);
  return projectRoot;
}

function git(command, args) {
  return execFileSync(command, args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export async function materializeProgram6Review(root = REVIEW_ROOT) {
  const resolvedRoot = path.resolve(root);
  await mkdir(resolvedRoot, { recursive: true });
  const paths = [];
  for (const project of PROJECTS) paths.push(await materializeProject(project, resolvedRoot));
  return { root: resolvedRoot, projects: paths };
}

async function main() {
  const rootIndex = process.argv.indexOf('--root');
  const root = rootIndex >= 0 ? process.argv[rootIndex + 1] : REVIEW_ROOT;
  if (!root) throw new Error('--root requires a directory path.');
  const materialized = await materializeProgram6Review(root);
  const branch = git('git', ['branch', '--show-current']);
  const head = git('git', ['rev-parse', 'HEAD']);
  const status = git('git', ['status', '--short']);
  console.log(JSON.stringify({
    repoRoot,
    branch,
    head,
    worktree: status ? 'dirty' : 'clean',
    rendererSource: 'pnpm dev',
    fixtures: materialized,
    instructions: [
      'Start the source checkout with pnpm dev.',
      'Open each printed project path through Writing Studio > Open Project.',
      'In Command Center choose Story Knowledge and walk Overview, Emotion, Continuity, Timeline, Pacing, Pressure, and Signals one lens at a time.',
      'Protected Glass Orchard metadata must remain visible only as redacted metadata; no protected source summary or prose may appear.',
    ],
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) {
  main().catch((error) => {
    console.error(`[program6-human-review] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
