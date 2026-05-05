#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const baseDir = join(process.cwd(), 'sample_project', 'Esther_Estate');
const projectPath = join(baseDir, 'project.json');
const outlinePath = join(baseDir, 'outline.json');
const port = Number.parseInt(process.env.BLACKSKIES_SERVICES_PORT ?? '8000', 10);
const baseUrl = `http://127.0.0.1:${Number.isFinite(port) ? port : 8000}/api/v1`;
const traceId = randomUUID();

function printResult(label, response, elapsedMs, responseTraceId) {
  console.log(
    JSON.stringify(
      {
        label,
        status: response.status,
        traceId: responseTraceId ?? null,
        elapsedMs,
      },
      null,
      2,
    ),
  );
}

async function postJson(pathname, payload) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-trace-id': traceId,
    },
    body: JSON.stringify(payload),
  });
  const responseTraceId = response.headers.get('x-trace-id') ?? undefined;
  const elapsedMs = Math.round(performance.now() - startedAt);
  printResult(pathname, response, elapsedMs, responseTraceId);
  return response;
}

async function main() {
  const project = JSON.parse(await readFile(projectPath, 'utf-8'));
  const outline = JSON.parse(await readFile(outlinePath, 'utf-8'));
  const sceneIds = Array.isArray(outline?.scenes)
    ? outline.scenes
        .map((scene) => scene?.id)
        .filter((sceneId) => typeof sceneId === 'string')
        .slice(0, 4)
    : [];

  if (!project?.project_id || sceneIds.length === 0) {
    throw new Error('Unable to resolve sample project identifiers.');
  }

  const payload = {
    project_id: project.project_id,
    unit_scope: 'scene',
    unit_ids: sceneIds,
  };

  await postJson('/draft/preflight', payload);
  await postJson('/draft/generate', payload);
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
});
