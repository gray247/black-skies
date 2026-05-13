#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SCENE_COUNT = 4;
const PROJECT_ID = 'proj_esther_estate';
const SNAPSHOT_IDS = ['snapshot-current', 'pw-wizard-final'];
const VERIFICATION_REPORT = {
  project_id: PROJECT_ID,
  status: 'ok',
  message: 'Snapshot verified successfully.',
  verified_at: new Date().toISOString(),
  snapshots: [
    {
      snapshot_id: 'pw-wizard-final',
      status: 'ok',
      errors: [],
      issues: [],
    },
  ],
};

const PROJECT_ROOTS = [
  path.join('sample_project', 'proj_esther_estate'),
  path.join('sample_project', 'Esther_Estate'),
];

function buildOutline() {
  return {
    schema_version: 'OutlineSchema v1',
    outline_id: 'out_001',
    project_id: PROJECT_ID,
    acts: ['Act I'],
    chapters: [{ id: 'ch_0001', order: 1, title: 'Chapter 1' }],
    scenes: Array.from({ length: SCENE_COUNT }, (_, index) => {
      const sceneNumber = index + 1;
      return {
        id: `sc_${String(sceneNumber).padStart(4, '0')}`,
        order: sceneNumber,
        title: `Scene ${sceneNumber}`,
        chapter_id: 'ch_0001',
      };
    }),
  };
}

function buildSnapshotFixture(snapshotId) {
  const createdAt = new Date().toISOString();
  const metadata = {
    snapshot_id: snapshotId,
    created_at: createdAt,
    label: 'wizard-finalize',
  };
  const manifest = {
    files_included: [
      { path: 'metadata.json' },
      { path: 'snapshot.json' },
    ],
  };
  const snapshot = {
    snapshot_id: snapshotId,
    created_at: createdAt,
    label: 'wizard-finalize',
    files_included: manifest.files_included,
    status: 'ok',
  };
  return { metadata, manifest, snapshot };
}

function materializeSnapshotDir(snapshotsRoot, snapshotId) {
  const snapshotRoot = path.join(snapshotsRoot, snapshotId);
  mkdirSync(snapshotRoot, { recursive: true });
  const fixture = buildSnapshotFixture(snapshotId);
  writeFileSync(
    path.join(snapshotRoot, 'metadata.json'),
    `${JSON.stringify(fixture.metadata, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    path.join(snapshotRoot, 'manifest.json'),
    `${JSON.stringify(fixture.manifest, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    path.join(snapshotRoot, 'snapshot.json'),
    `${JSON.stringify(fixture.snapshot, null, 2)}\n`,
    'utf8',
  );
  return snapshotRoot;
}

function materializeProjectRoot(relativeRoot) {
  const root = path.resolve(REPO_ROOT, relativeRoot);
  const drafts = path.join(root, 'drafts');
  const snapshotsRoot = path.join(root, '.snapshots');
  mkdirSync(drafts, { recursive: true });
  mkdirSync(snapshotsRoot, { recursive: true });

  writeFileSync(
    path.join(root, 'project.json'),
    `${JSON.stringify(
      {
        project_id: PROJECT_ID,
        name: 'Esther Estate',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(path.join(root, 'outline.json'), `${JSON.stringify(buildOutline(), null, 2)}\n`, 'utf8');
  writeFileSync(
    path.join(snapshotsRoot, 'last_verification.json'),
    `${JSON.stringify(VERIFICATION_REPORT, null, 2)}\n`,
    'utf8',
  );
  for (const snapshotId of SNAPSHOT_IDS) {
    materializeSnapshotDir(snapshotsRoot, snapshotId);
  }

  for (let index = 1; index <= SCENE_COUNT; index += 1) {
    const sceneId = `sc_${String(index).padStart(4, '0')}`;
    writeFileSync(
      path.join(drafts, `${sceneId}.md`),
      [
        '---',
        `id: ${sceneId}`,
        `title: Scene ${index}`,
        `order: ${index}`,
        'chapter_id: ch_0001',
        '---',
        `Scene ${index} body.`,
        '',
      ].join('\n'),
      'utf8',
    );
  }

  return {
    root,
    projectJson: path.join(root, 'project.json'),
    outlineJson: path.join(root, 'outline.json'),
    draftsDir: drafts,
  };
}

function main() {
  const results = PROJECT_ROOTS.map((root) => materializeProjectRoot(root));
  console.log(
    '[fixtures] materialized e2e fixture roots',
    JSON.stringify(
      {
        project_id: PROJECT_ID,
        roots: results,
      },
      null,
      2,
    ),
  );
}

main();
