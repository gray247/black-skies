import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
} from './program7-e2e-support';
import { removeTemporaryDirectory, openWritingStudioRail } from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

const SCALES = [
  { scale: '1x', count: 17, kind: 'carmilla-baseline' as const },
  { scale: '2x', count: 34, kind: 'synthetic-non-evidence' as const },
  { scale: '4x', count: 68, kind: 'synthetic-non-evidence' as const },
  { scale: '8x', count: 136, kind: 'synthetic-non-evidence' as const },
];

test('Program 7 scale journey opens, renders, and selects every bounded fixture', async ({ page, electronApp }) => {
  test.slow();
  const { writing } = await getProgram7Windows(electronApp, page);
  const temporaryRoots: string[] = [];
  const observations: Array<Record<string, unknown>> = [];
  try {
    for (const fixture of SCALES) {
      let projectPath: string;
      let projectId: string;
      if (fixture.kind === 'carmilla-baseline') {
        const materialized = await materializeProgram7Carmilla();
        temporaryRoots.push(materialized.reviewRoot);
        projectPath = materialized.projectPath;
        projectId = materialized.projectId;
      } else {
        const parentPath = await mkdtemp(path.join(tmpdir(), `black-skies-p7-${fixture.scale}-`));
        temporaryRoots.push(parentPath);
        const created = await writing.evaluate(async ({ parentPath: requestedParent, fixture }) => {
          const bridge = window.projectSpine!;
          const initial = await bridge.createProject({
            parentPath: requestedParent,
            title: `Program 7 ${fixture.scale} synthetic scale`,
            operationId: `program7-scale-create-${fixture.scale}`,
          });
          if (!initial.ok) throw new Error(initial.error.message);
          let snapshot = initial.snapshot;
          for (let index = 1; index <= fixture.count; index += 1) {
            const result = await bridge.createUnit!({
              projectId: snapshot.project!.projectId,
              projectPath: snapshot.project!.path,
              generation: snapshot.generation,
              operationId: `program7-scale-${fixture.scale}-unit-${index}`,
              title: `Synthetic ${fixture.scale} Unit ${String(index).padStart(3, '0')}`,
            });
            if (!result.ok) throw new Error(result.error.message);
            snapshot = result.snapshot;
          }
          return { projectPath: snapshot.project!.path, projectId: snapshot.project!.projectId };
        }, { parentPath, fixture });
        projectPath = created.projectPath;
        projectId = created.projectId;
      }

      await writing.evaluate(() => {
        const target = window as unknown as {
          __program7ScaleFrameMonitor?: { running: boolean; last: number; maxGap: number };
        };
        const monitor = { running: true, last: performance.now(), maxGap: 0 };
        target.__program7ScaleFrameMonitor = monitor;
        const tick = (timestamp: number) => {
          monitor.maxGap = Math.max(monitor.maxGap, timestamp - monitor.last);
          monitor.last = timestamp;
          if (monitor.running) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      });
      const openStartedAt = performance.now();
      await openProgram7Project(writing, projectPath);
      const openDurationMs = performance.now() - openStartedAt;
      await openWritingStudioRail(writing, 'Story');
      const renderStartedAt = performance.now();
      const unitRail = writing.locator('[data-manuscript-unit-id]');
      await expect(unitRail).toHaveCount(fixture.count);
      const renderDurationMs = performance.now() - renderStartedAt;
      const lastUnit = unitRail.last();
      const selectStartedAt = performance.now();
      await lastUnit.getByRole('button').first().click();
      await expect(writing.getByRole('textbox', { name: new RegExp(`(?:${fixture.kind === 'carmilla-baseline' ? 'Chapter|Prologue' : 'Synthetic'}).*${fixture.count === 17 ? '16|Prologue' : String(fixture.count).padStart(3, '0')}`, 'u') })).toBeVisible();
      const selectDurationMs = performance.now() - selectStartedAt;
      const frameGapMs = await writing.evaluate(() => {
        const target = window as unknown as {
          __program7ScaleFrameMonitor?: { running: boolean; maxGap: number };
        };
        const monitor = target.__program7ScaleFrameMonitor;
        if (!monitor) return null;
        monitor.running = false;
        return monitor.maxGap;
      });
      observations.push({ scale: fixture.scale, kind: fixture.kind, projectId, count: fixture.count, openDurationMs, renderDurationMs, selectDurationMs, frameGapMs });
      const openLimitMs = fixture.scale === '1x' ? 5_000 : fixture.scale === '2x' ? 7_500 : fixture.scale === '4x' ? 10_000 : 20_000;
      expect(openDurationMs).toBeLessThanOrEqual(openLimitMs);
      expect(renderDurationMs).toBeLessThan(5_000);
      expect(selectDurationMs).toBeLessThan(3_000);
      expect(frameGapMs).not.toBeNull();
      expect(frameGapMs as number).toBeLessThanOrEqual(100);
    }
    console.info('[program7-scale-electron]', observations);
  } finally {
    await Promise.all(temporaryRoots.map((root) => removeTemporaryDirectory(root)));
  }
});
