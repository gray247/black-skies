// HARNESS_ONLY:
// Reason: measures bounded Carmilla and explicitly synthetic scale fixtures in the Electron harness; timings do not establish installed-product or human acceptance.
// Owner: app/tests/e2e/program7-scale-performance.spec.ts
// Retire when: installed-build performance qualification provides equivalent bounded project-open, rendering, selection and frame-gap coverage without harness-only dependencies.

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
  { scale: '1x', count: 17, kind: 'carmilla-baseline' as const, finalTitle: 'Chapter XVI — Conclusion' },
  { scale: '2x', count: 34, kind: 'synthetic-non-evidence' as const, finalTitle: 'Synthetic 2x Unit 034' },
  { scale: '4x', count: 68, kind: 'synthetic-non-evidence' as const, finalTitle: 'Synthetic 4x Unit 068' },
  { scale: '8x', count: 136, kind: 'synthetic-non-evidence' as const, finalTitle: 'Synthetic 8x Unit 136' },
];

test('Program 7 scale journey opens, renders, and selects every bounded fixture', async ({ page, electronApp }) => {
  test.slow();
  const { writing } = await getProgram7Windows(electronApp, page);
  const temporaryRoots: string[] = [];
  const observations: Array<Record<string, unknown>> = [];
  try {
    for (const fixture of SCALES) {
      const cpuSession = process.env.P75_SCALE_PROFILE === '1' && fixture.scale === '8x'
        ? await writing.context().newCDPSession(writing) : null;
      if (cpuSession) {
        await cpuSession.send('Profiler.enable');
        await cpuSession.send('Profiler.start');
      }
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
          __program7ScaleFrameMonitor?: {
            running: boolean; last: number; maxGap: number; phase: string;
            gaps: Array<{ phase: string; durationMs: number }>;
            longTasks: Array<{ startTime: number; durationMs: number }>;
            observer: PerformanceObserver;
          };
        };
        const longTasks: Array<{ startTime: number; durationMs: number }> = [];
        const observer = new PerformanceObserver((records) => {
          for (const entry of records.getEntries()) longTasks.push({ startTime: entry.startTime, durationMs: entry.duration });
        });
        observer.observe({ entryTypes: ['longtask'] });
        const monitor = { running: true, last: performance.now(), maxGap: 0, phase: 'open',
          gaps: [] as Array<{ phase: string; durationMs: number }>, longTasks, observer };
        target.__program7ScaleFrameMonitor = monitor;
        const tick = (timestamp: number) => {
          const durationMs = timestamp - monitor.last;
          monitor.maxGap = Math.max(monitor.maxGap, durationMs);
          if (durationMs > 50) monitor.gaps.push({ phase: monitor.phase, durationMs });
          monitor.last = timestamp;
          if (monitor.running) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      });
      const openStartedAt = performance.now();
      await openProgram7Project(writing, projectPath);
      const openDurationMs = performance.now() - openStartedAt;
      await writing.evaluate(() => {
        const monitor = (window as unknown as { __program7ScaleFrameMonitor?: { phase: string } }).__program7ScaleFrameMonitor;
        if (monitor) monitor.phase = 'story-rail';
      });
      await openWritingStudioRail(writing, 'Story');
      const renderStartedAt = performance.now();
      const unitRail = writing.locator('[data-manuscript-unit-id]');
      await expect(unitRail).toHaveCount(fixture.count);
      const renderDurationMs = performance.now() - renderStartedAt;
      const lastUnit = unitRail.last();
      const selectStartedAt = performance.now();
      await lastUnit.getByRole('button').first().click();
      await expect(writing.getByRole('textbox', { name: `Manuscript editor: ${fixture.finalTitle}` })).toBeVisible();
      const selectDurationMs = performance.now() - selectStartedAt;
      const frameObservation = await writing.evaluate(() => {
        const target = window as unknown as {
          __program7ScaleFrameMonitor?: {
            running: boolean; maxGap: number;
            gaps: Array<{ phase: string; durationMs: number }>;
            longTasks: Array<{ startTime: number; durationMs: number }>;
            observer: PerformanceObserver;
          };
        };
        const monitor = target.__program7ScaleFrameMonitor;
        if (!monitor) return null;
        monitor.running = false;
        monitor.observer.disconnect();
        return { maxGap: monitor.maxGap, gaps: monitor.gaps, longTasks: monitor.longTasks };
      });
      const frameGapMs = frameObservation?.maxGap ?? null;
      const observation = { scale: fixture.scale, kind: fixture.kind, projectId, count: fixture.count, openDurationMs, renderDurationMs, selectDurationMs, frameGapMs, frameObservation };
      observations.push(observation);
      console.info('[program7-scale-electron-observation]', JSON.stringify(observation));
      if (cpuSession) {
        const { profile } = await cpuSession.send('Profiler.stop');
        await test.info().attach('program7-scale-8x-cpu', {
          body: Buffer.from(JSON.stringify(profile)), contentType: 'application/json',
        });
        await cpuSession.detach();
      }
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
