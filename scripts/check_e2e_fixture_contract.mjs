#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    baseUrl: null,
    projectId: null,
    projectRoot: null,
    roots: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--base-url') {
      args.baseUrl = argv[++index] ?? null;
      continue;
    }
    if (token === '--project-id') {
      args.projectId = argv[++index] ?? null;
      continue;
    }
    if (token === '--project-root') {
      args.projectRoot = argv[++index] ?? null;
      continue;
    }
    if (token === '--root') {
      const root = argv[++index];
      if (root) {
        args.roots.push(root);
      }
    }
  }
  return args;
}

function validateOutlineShape(rootPath, label, expectedProjectId = null) {
  const projectPath = path.resolve(REPO_ROOT, rootPath);
  const projectJsonPath = path.join(projectPath, 'project.json');
  const outlinePath = path.join(projectPath, 'outline.json');
  const draftsDir = path.join(projectPath, 'drafts');
  const diagnostics = {
    label,
    project_path: projectPath,
    project_json_path: projectJsonPath,
    outline_path: outlinePath,
    drafts_dir: draftsDir,
    project_json_exists: existsSync(projectJsonPath),
    outline_exists: existsSync(outlinePath),
    drafts_dir_exists: existsSync(draftsDir),
    project_id: null,
    outline_id: null,
    scene_count: null,
    valid_outline_schema: false,
    issues: [],
  };

  if (!diagnostics.project_json_exists) {
    diagnostics.issues.push('project.json missing');
  }
  if (!diagnostics.outline_exists) {
    diagnostics.issues.push('outline.json missing');
  }
  if (!diagnostics.drafts_dir_exists) {
    diagnostics.issues.push('drafts/ directory missing');
  }

  if (diagnostics.project_json_exists) {
    try {
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf8'));
      const projectId = typeof projectJson?.project_id === 'string' ? projectJson.project_id.trim() : '';
      diagnostics.project_id = projectId || null;
      if (projectId.length === 0) {
        diagnostics.issues.push('project_id missing');
      } else if (expectedProjectId && projectId !== expectedProjectId) {
        diagnostics.issues.push(`project_id mismatch: ${projectId} !== ${expectedProjectId}`);
      }
    } catch (error) {
      diagnostics.issues.push(
        `project.json invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (diagnostics.outline_exists) {
    try {
      const outline = JSON.parse(readFileSync(outlinePath, 'utf8'));
      diagnostics.outline_id = typeof outline?.outline_id === 'string' ? outline.outline_id : null;
      diagnostics.scene_count = Array.isArray(outline?.scenes) ? outline.scenes.length : null;
      if (!diagnostics.outline_id) {
        diagnostics.issues.push('outline_id missing');
      } else if (!/^out_\d{3}$/.test(diagnostics.outline_id)) {
        diagnostics.issues.push(`outline_id invalid: ${diagnostics.outline_id}`);
      }
      if (!Array.isArray(outline?.scenes)) {
        diagnostics.issues.push('scenes missing or not an array');
      } else {
        for (const scene of outline.scenes) {
          const chapterId = scene?.chapter_id;
          if (typeof chapterId !== 'string' || !/^ch_\d{4}$/.test(chapterId)) {
            diagnostics.issues.push(`invalid scene.chapter_id: ${JSON.stringify(chapterId ?? null)}`);
            break;
          }
        }
      }
    } catch (error) {
      diagnostics.issues.push(
        `outline.json invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  diagnostics.valid_outline_schema = diagnostics.issues.length === 0;
  return diagnostics;
}

function validateSnapshotShape(rootPath, label) {
  const projectPath = path.resolve(REPO_ROOT, rootPath);
  const snapshotsRoot = path.join(projectPath, '.snapshots');
  const verificationPath = path.join(snapshotsRoot, 'last_verification.json');
  const requiredSnapshotIds = ['snapshot-current', 'pw-wizard-final'];
  const requiredFiles = ['metadata.json', 'manifest.json', 'snapshot.json'];
  const diagnostics = {
    label,
    project_path: projectPath,
    snapshots_root: snapshotsRoot,
    verification_path: verificationPath,
    snapshots_root_exists: existsSync(snapshotsRoot),
    verification_exists: existsSync(verificationPath),
    snapshot_dirs: [],
    issues: [],
  };

  if (!diagnostics.snapshots_root_exists) {
    diagnostics.issues.push('.snapshots/ directory missing');
    return diagnostics;
  }

  if (!diagnostics.verification_exists) {
    diagnostics.issues.push('last_verification.json missing');
  } else {
    try {
      const verification = JSON.parse(readFileSync(verificationPath, 'utf8'));
      const snapshotEntries = Array.isArray(verification?.snapshots) ? verification.snapshots : [];
      for (const snapshotId of requiredSnapshotIds) {
        const snapshotRoot = path.join(snapshotsRoot, snapshotId);
        const snapshotDiagnostics = {
          snapshot_id: snapshotId,
          snapshot_root: snapshotRoot,
          exists: existsSync(snapshotRoot),
          required_files: requiredFiles.map((fileName) => ({
            file: fileName,
            exists: existsSync(path.join(snapshotRoot, fileName)),
          })),
        };
        diagnostics.snapshot_dirs.push(snapshotDiagnostics);
        if (!snapshotDiagnostics.exists) {
          diagnostics.issues.push(`snapshot directory missing: ${snapshotId}`);
          continue;
        }
        for (const fileInfo of snapshotDiagnostics.required_files) {
          if (!fileInfo.exists) {
            diagnostics.issues.push(`snapshot file missing: ${snapshotId}/${fileInfo.file}`);
          }
        }
      }

      if (!Array.isArray(snapshotEntries) || snapshotEntries.length === 0) {
        diagnostics.issues.push('verification.snapshots missing or empty');
      }
    } catch (error) {
      diagnostics.issues.push(
        `last_verification.json invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  diagnostics.valid_snapshot_schema = diagnostics.issues.length === 0;
  return diagnostics;
}

async function probeAnalytics(baseUrl, projectId) {
  const endpoints = [
    `/api/v1/analytics/summary?project_id=${encodeURIComponent(projectId)}`,
    `/api/v1/analytics/scenes?project_id=${encodeURIComponent(projectId)}`,
  ];
  const failures = [];
  for (const endpoint of endpoints) {
    const response = await fetch(`${baseUrl}${endpoint}`, { method: 'GET' });
    if (!response.ok) {
      failures.push({
        endpoint,
        status: response.status,
        body: (await response.text()).slice(0, 400),
      });
    }
  }
  return failures;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const roots = new Map();
  roots.set('harness', {
    root: args.projectRoot ?? path.join('sample_project', 'proj_esther_estate'),
    expectedProjectId: 'proj_esther_estate',
  });
  roots.set('truth', {
    root: path.join('sample_project', 'Esther_Estate'),
    expectedProjectId: 'proj_esther_estate',
  });
  for (const extraRoot of args.roots) {
    roots.set(path.basename(extraRoot), { root: extraRoot, expectedProjectId: null });
  }

  const validations = Array.from(roots.entries()).map(([label, value]) =>
    validateOutlineShape(value.root, label, value.expectedProjectId),
  );
  const failedValidations = validations.filter((entry) => !entry.valid_outline_schema);
  if (failedValidations.length > 0) {
    throw new Error(`[fixtures] invalid sample project fixtures: ${JSON.stringify(failedValidations)}`);
  }

  const snapshotValidations = Array.from(roots.entries()).map(([label, value]) =>
    validateSnapshotShape(value.root, label),
  );
  const failedSnapshotValidations = snapshotValidations.filter((entry) => !entry.valid_snapshot_schema);
  if (failedSnapshotValidations.length > 0) {
    throw new Error(
      `[fixtures] invalid sample snapshot fixtures: ${JSON.stringify(failedSnapshotValidations)}`,
    );
  }

  if (args.baseUrl) {
    if (!args.projectId) {
      throw new Error('[fixtures] --project-id is required when --base-url is provided.');
    }
    const projectRoot = args.projectRoot ?? path.join('sample_project', args.projectId);
    const projectDiagnostics = validateOutlineShape(projectRoot, 'analytics', args.projectId);
    const failures = await probeAnalytics(args.baseUrl, args.projectId);
    if (failures.length > 0) {
      throw new Error(
        `[fixtures] analytics endpoints did not return 200: ${JSON.stringify({
          project_id: args.projectId,
          project_path: projectDiagnostics.project_path,
          outline_path: projectDiagnostics.outline_path,
          outline_exists: projectDiagnostics.outline_exists,
          outline_validation: {
            valid_outline_schema: projectDiagnostics.valid_outline_schema,
            outline_id: projectDiagnostics.outline_id,
            scene_count: projectDiagnostics.scene_count,
            issues: projectDiagnostics.issues,
          },
          failures,
        })}`,
      );
    }
  }

  console.log(
    '[fixtures] e2e fixture contract verified',
    JSON.stringify(
      {
      roots: validations.map((entry) => ({
        label: entry.label,
        project_path: entry.project_path,
        outline_exists: entry.outline_exists,
        outline_id: entry.outline_id,
        scene_count: entry.scene_count,
      })),
      snapshot_roots: snapshotValidations.map((entry) => ({
        label: entry.label,
        project_path: entry.project_path,
        snapshots_root_exists: entry.snapshots_root_exists,
        verification_exists: entry.verification_exists,
        snapshot_dirs: entry.snapshot_dirs,
      })),
      analytics: args.baseUrl
        ? {
            project_id: args.projectId,
              project_root: args.projectRoot ?? path.join('sample_project', args.projectId ?? ''),
              base_url: args.baseUrl,
            }
          : null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('[fixtures] failed', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
