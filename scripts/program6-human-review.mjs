#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
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
    subjectLabel: 'Mara Vale',
    signalPosture: 'quiet',
    projectPosture: 'develop',
    units: [
      ['lh_01', 'The Unlit Door'],
      ['lh_02', 'A Map in the Dust'],
      ['lh_03', 'The Borrowed Flame'],
    ],
    prose: {
      lh_01: `Mara Vale reached the unlit door before dusk. The brass key fit, but the lock turned without resistance, as if someone inside had been waiting for her hand.

She kept one foot on the porch. Dust lay smooth across the hall except for a narrow track leading toward her father's study. When the house sighed around her, Mara could not tell whether the sound came from old pipes or a person trying not to breathe.`,
      lh_02: `In the study, Mara found a map pressed into the dust beneath the desk. Her father had drawn the coast from memory, then marked the abandoned lighthouse with the same threshold symbol carved above the front door.

She folded the map once and put it in her coat. Whatever had crossed this house before every family confession, she would meet it at the lighthouse instead of waiting for it to return.`,
      lh_03: `The lighthouse lantern had no oil, yet a small blue flame waited inside its cracked lens. Mara cupped it between her palms. It gave no heat, but the hidden writing on her father's map brightened at once.

She climbed the final stair without looking back. By the time the storm struck the glass, her fear had narrowed into a decision: carry the borrowed flame home and open the study door from the other side.`,
    },
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
    timeline: [
      ['lh_01', 'Mara enters the house', 1, 'certain'],
      ['lh_02', 'Mara finds the lighthouse map', 2, 'certain'],
      ['lh_03', 'Mara takes the borrowed flame', 3, 'certain'],
    ],
    pacing: [['lh_01', 'slow'], ['lh_02', 'steady'], ['lh_03', 'fast']],
    pressure: [['lh_01', 'planned', 'constraint', 'medium'], ['lh_02', 'observed', 'consequence', 'high'], ['lh_03', 'planned', 'urgency', 'high']],
  },
  {
    directory: 'northline-letters',
    projectId: 'proj_northline_letters_review',
    name: 'Northline Letters',
    subjectLabel: 'Elian Ward',
    signalPosture: 'ask-only',
    projectPosture: 'finish',
    units: [
      ['nl_01', 'The First Letter'],
      ['nl_02', 'The Missing Letter'],
      ['nl_03', 'The First Letter'],
      ['nl_04', 'The Reply'],
    ],
    prose: {
      nl_01: `Elian Ward found the first letter beneath the station clock, sealed with red wax and dated three winters in the future. It contained only one sentence: Do not board the northline after the river freezes.

The river was already freezing. Elian put the letter inside his coat and watched the evening train arrive, allowing himself the smallest hope that the warning meant someone, somewhere, expected him to survive.`,
      nl_02: `The second envelope should have been between the stationmaster's receipts. Its place in the bundle was empty, but the twine had been cut and retied.

Elian questioned the clerk twice. Her answers matched word for word, including the pause before she denied recognizing the red seal. On the platform, he began to doubt the warning, the clerk, and the future hand that seemed to know his name.`,
      nl_03: `Three days earlier, before Elian ever saw the station clock, a red-sealed letter arrived at his boardinghouse. The handwriting resembled his own, made unsteady by age or cold.

He hid it unopened beneath a loose floorboard. Now, remembering that choice on the northbound train, Elian wondered whether the missing letter had never been stolen at all—whether he had placed the first piece of the mystery beyond his own reach.`,
      nl_04: `The reply waited in the last carriage, tucked into the seat Elian had been warned not to take. This time he broke the seal.

The older version of his handwriting did not offer certainty. It offered a route home, the name of the clerk who had helped him, and permission to stop treating every unanswered question as a trap. Elian read it twice before the tightness in his chest began to ease.`,
    },
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
    timeline: [
      ['nl_01', 'Elian finds the station letter', 2, 'certain'],
      ['nl_02', 'Elian discovers the missing envelope', 3, 'uncertain'],
      ['nl_03', 'The boardinghouse letter arrives', 1, 'certain'],
      ['nl_04', 'Elian reads the reply', 4, 'certain'],
    ],
    pacing: [['nl_01', 'steady'], ['nl_02', 'slow'], ['nl_03', 'very-slow'], ['nl_04', 'steady']],
    pressure: [['nl_01', 'planned', 'consequence', 'medium'], ['nl_02', 'observed', 'conflict', 'high'], ['nl_03', 'planned', 'constraint', 'high'], ['nl_04', 'observed', 'urgency', 'low']],
  },
  {
    directory: 'glass-orchard',
    projectId: 'proj_glass_orchard_review',
    name: 'Glass Orchard',
    subjectLabel: 'Iris Bell',
    signalPosture: 'alert',
    projectPosture: 'explore',
    units: [
      ['go_01', 'The Empty Conservatory'],
      ['go_02', 'A Red Apple'],
      ['go_03', 'The Frost Line'],
      ['go_04', 'The Keeper Returns'],
    ],
    prose: {
      go_01: `Iris Bell entered the empty conservatory at noon. Frost filmed the inside of every pane, though sunlight warmed the orchard beyond the glass.

She stood among the bare planters and listened. No leaves moved. No pipes knocked. Even her breath seemed unwilling to cloud the air. Iris had come expecting evidence of the keeper's return; the room offered only a deliberate, watchful stillness.`,
      go_02: `A single red apple rested on the center table. When Iris touched it, a hairline crack raced through the glass beneath her palm.

The orchard outside answered all at once. Branches struck the panes, the locked doors shuddered, and a bell began ringing under the floor. Iris snatched back her hand. A second apple appeared beside the first, wet with melting frost and marked by a fresh human bite.`,
      go_03: `The frost line crossed the conservatory faster than Iris could retreat. It climbed the iron table legs and sealed the eastern door before she reached it.

Beyond the whitening glass, the orchard bent toward the building. Every red apple turned on its stem until the bitten sides faced her. Iris raised the keeper's key, knowing the next moment had to feel like the point of greatest alarm: the lock was on the outside.`,
      go_04: `The keeper returned carrying a lantern and no weapon. At the sight of him, the branches settled and the bell beneath the floor stopped mid-strike.

He opened the door, then placed the bitten apple in Iris's hands as carefully as an apology. The frost withdrew from the panes in long clear ribbons. Iris did not trust him yet, but she could breathe again, and for the first time the conservatory felt like a room rather than a trap.`,
    },
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
    timeline: [
      ['go_01', 'Iris enters the conservatory', 1, 'certain'],
      ['go_02', 'Iris touches the red apple', 2, 'certain'],
      ['go_03', 'The frost seals the eastern door', 3, 'certain'],
      ['go_04', 'The keeper returns', 4, 'certain'],
    ],
    pacing: [['go_01', 'slow'], ['go_02', 'fast'], ['go_03', 'very-fast'], ['go_04', 'slow']],
    pressure: [['go_01', 'planned', 'constraint', 'low'], ['go_02', 'observed', 'urgency', 'high'], ['go_03', 'planned', 'conflict', 'very-high'], ['go_04', 'observed', 'consequence', 'medium']],
  },
];

function ref(projectId, unitId, order, sourceKind = 'story-unit', sourceRevision = 1) {
  const project = PROJECTS.find((candidate) => candidate.projectId === projectId);
  const sourceFingerprint = sourceKind === 'manuscript' || sourceKind === 'story-unit'
    ? createHash('sha256').update(`\n${project?.prose?.[unitId] ?? ''}\n`, 'utf8').digest('hex')
    : `${projectId}:${unitId}:author-intent`;
  return {
    projectId,
    sourceKind,
    sourceId: unitId,
    sourceRevision,
    sourceFingerprint,
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
  const emotionRecords = project.emotion.map(([unitId, label, intensity, lane, sourceKind], index) => ({
    recordId: `emotion_${project.directory}_${index + 1}`,
    projectId: project.projectId,
    unitId,
    evidenceClass: lane,
    label,
    intensityBand: intensity,
    recordKind: 'emotion-graph',
    emotionLane: lane,
    emotionIntensity: intensity,
    subjectLabel: project.subjectLabel,
    currentness: 'current',
    positionRefs: [ref(project.projectId, unitId, project.units.findIndex(([id]) => id === unitId) + 1, sourceKind)],
    provenance: provenance(project),
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const timelineRecords = project.timeline.map(([unitId, label, timelineWorldOrder, timelineTemporalState], index) => ({
    recordId: `timeline_${project.directory}_${index + 1}`,
    projectId: project.projectId,
    unitId,
    evidenceClass: 'planned',
    label,
    recordKind: 'timeline-event',
    timelineWorldOrder,
    timelineTemporalState,
    currentness: 'current',
    positionRefs: [ref(project.projectId, unitId, project.units.findIndex(([id]) => id === unitId) + 1, 'author-intent')],
    provenance: provenance(project),
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const pacingRecords = project.pacing.map(([unitId, pacingTempo], index) => ({
    recordId: `pacing_${project.directory}_${index + 1}`,
    projectId: project.projectId,
    unitId,
    evidenceClass: 'planned',
    label: `Pacing intent: ${pacingTempo}`,
    recordKind: 'pacing-intent',
    pacingTempo,
    currentness: 'current',
    positionRefs: [ref(project.projectId, unitId, project.units.findIndex(([id]) => id === unitId) + 1, 'author-intent')],
    provenance: provenance(project),
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const pressureRecords = project.pressure.map(([unitId, lane, pressureDimension, pressureBand], index) => ({
    recordId: `pressure_${project.directory}_${index + 1}`,
    projectId: project.projectId,
    unitId,
    evidenceClass: lane,
    label: `${pressureDimension}: ${pressureBand}`,
    recordKind: 'pressure-point',
    pressureDimension,
    pressureBand,
    currentness: 'current',
    positionRefs: [ref(project.projectId, unitId, project.units.findIndex(([id]) => id === unitId) + 1, lane === 'observed' ? 'manuscript' : 'author-intent')],
    provenance: provenance(project),
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const authorRecords = [...emotionRecords, ...timelineRecords, ...pacingRecords, ...pressureRecords];
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
    `---\nid: ${id}\ntitle: ${title}\norder: ${index + 1}\nchapter_id: ch_0001\n---\n\n${project.prose[id]}\n`,
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
