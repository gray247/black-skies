import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

export interface SampleProjectFixture {
  projectId: string;
  projectRoot: string;
  outline: any;
  projectMeta: any;
  drafts: Record<string, string>;
  scenes: Array<{
    id: string;
    title: string | null;
    order: number;
    chapter_id?: string | null;
    beat_refs?: string[] | null;
    purpose: string;
    emotion_tag: string;
  }>;
  loadedProject: {
    path: string;
    name: string;
    outline: any;
    scenes: SampleProjectFixture['scenes'];
    drafts: Record<string, string>;
    project_id: string;
  };
}

function resolveSampleProjectRoot(projectId: string): string {
  const directRoot = path.join(repoRoot, 'sample_project', projectId);
  const directOutline = path.join(directRoot, 'outline.json');
  const directProject = path.join(directRoot, 'project.json');
  if (fs.existsSync(directOutline) && fs.existsSync(directProject)) {
    return directRoot;
  }

  if (projectId === 'proj_esther_estate') {
    const canonicalRoot = path.join(repoRoot, 'sample_project', 'Esther_Estate');
    const canonicalOutline = path.join(canonicalRoot, 'outline.json');
    const canonicalProject = path.join(canonicalRoot, 'project.json');
    if (fs.existsSync(canonicalOutline) && fs.existsSync(canonicalProject)) {
      return canonicalRoot;
    }
  }

  for (const snapshotDirName of ['.snapshots', '.snapshots.bak']) {
    const snapshotsRoot = path.join(directRoot, snapshotDirName);
    if (!fs.existsSync(snapshotsRoot)) {
      continue;
    }

    if (snapshotDirName === '.snapshots') {
      const verificationPath = path.join(snapshotsRoot, 'last_verification.json');
      if (fs.existsSync(verificationPath)) {
        try {
          const verification = JSON.parse(fs.readFileSync(verificationPath, 'utf-8'));
          if (verification?.status === 'ok' && Array.isArray(verification.snapshots)) {
            for (const snapshot of verification.snapshots) {
              if (typeof snapshot?.path !== 'string') {
                continue;
              }
              const candidate = path.join(directRoot, snapshot.path);
              if (
                fs.existsSync(path.join(candidate, 'outline.json')) &&
                fs.existsSync(path.join(candidate, 'project.json'))
              ) {
                return candidate;
              }
            }
          }
        } catch {
          // Fall through to the directory scan below if the verification file is malformed.
        }
      }
    }

    const snapshotDirs = fs
      .readdirSync(snapshotsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('ss_'))
      .map((entry) => entry.name)
      .sort();
    const latestSnapshot = snapshotDirs.at(-1);
    if (latestSnapshot) {
      return path.join(snapshotsRoot, latestSnapshot);
    }
  }

  throw new Error(
    `Sample project fixture for ${projectId} is missing the expected outline/project files and project-local snapshots under ${directRoot}.`,
  );
}

export function loadSampleProject(projectId = 'proj_esther_estate'): SampleProjectFixture {
  const projectRoot = resolveSampleProjectRoot(projectId);
  const outline = JSON.parse(fs.readFileSync(path.join(projectRoot, 'outline.json'), 'utf-8'));
  const projectMeta = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.json'), 'utf-8'));
  const draftsDir = path.join(projectRoot, 'drafts');
  const drafts = Object.fromEntries(
    fs
      .readdirSync(draftsDir)
      .filter((file) => file.endsWith('.md'))
      .map((file) => [path.basename(file, '.md'), fs.readFileSync(path.join(draftsDir, file), 'utf-8')]),
  );

  const scenes = outline.scenes.map((scene: any) => ({
    id: scene.id,
    title: scene.title ?? null,
    order: scene.order ?? 0,
    chapter_id: scene.chapter_id ?? null,
    beat_refs: scene.beat_refs ?? null,
    purpose: 'escalation',
    emotion_tag: 'tension',
  }));

  return {
    projectId,
    projectRoot,
    outline,
    projectMeta,
    drafts,
    scenes,
    loadedProject: {
      path: projectRoot.replace(/\\/g, '/'),
      name: projectMeta.name,
      outline,
      scenes,
      drafts,
      project_id: projectId,
    },
  };
}
