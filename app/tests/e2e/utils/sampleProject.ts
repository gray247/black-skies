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

export function loadSampleProject(projectId = 'proj_esther_estate'): SampleProjectFixture {
  const projectRoot = path.join(repoRoot, 'sample_project', projectId);
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
