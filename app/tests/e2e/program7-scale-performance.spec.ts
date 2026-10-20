// HARNESS_ONLY:
// Reason: measures bounded Carmilla and explicitly synthetic scale fixtures in the Electron harness; timings do not establish installed-product or human acceptance.
// Owner: app/tests/e2e/program7-scale-performance.spec.ts
// Retire when: installed-build performance qualification provides equivalent bounded project-open, rendering, selection and frame-gap coverage without harness-only dependencies.

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  materializeProgram7SyntheticProject,
  openProgram7Project,
} from './program7-e2e-support';
import { removeTemporaryDirectory, openWritingStudioRail } from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

const PROFILE_SCALE = process.env.P75_SCALE_PROFILE_SCALE ?? '8x';

const SCALES = [
  {
    scale: '1x',
    count: 17,
    kind: 'carmilla-baseline' as const,
    finalTitle: 'Chapter XVI — Conclusion',
  },
  {
    scale: '2x',
    count: 34,
    kind: 'synthetic-non-evidence' as const,
    finalTitle: 'Synthetic 2x Unit 034',
  },
  {
    scale: '4x',
    count: 68,
    kind: 'synthetic-non-evidence' as const,
    finalTitle: 'Synthetic 4x Unit 068',
  },
  {
    scale: '8x',
    count: 136,
    kind: 'synthetic-non-evidence' as const,
    finalTitle: 'Synthetic 8x Unit 136',
  },
];

test('Program 7 scale journey opens, renders, and selects every bounded fixture', async ({
  page,
  electronApp,
}) => {
  test.slow();
  const testInfo = test.info();
  const { writing } = await getProgram7Windows(electronApp, page);
  const temporaryRoots: string[] = [];
  const observations: Array<Record<string, unknown>> = [];
  try {
    for (const fixture of SCALES) {
      const fixtureStartedAt = performance.now();
      const cpuSession =
        process.env.P75_SCALE_PROFILE === '1' && fixture.scale === PROFILE_SCALE
          ? await writing.context().newCDPSession(writing)
          : null;
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
        const created = await materializeProgram7SyntheticProject(
          parentPath,
          fixture.scale,
          fixture.count,
        );
        projectPath = created.projectPath;
        projectId = created.projectId;
      }

      const fixtureReadyAt = performance.now();
      const traceSession =
        process.env.P75_SCALE_TRACE === '1' && fixture.scale === PROFILE_SCALE
          ? await writing.context().newCDPSession(writing)
          : null;
      const traceEvents: unknown[] = [];
      let traceCompleted: Promise<void> | null = null;
      if (traceSession) {
        traceSession.on('Tracing.dataCollected', (event) => traceEvents.push(...event.value));
        traceCompleted = new Promise<void>((resolve) => {
          traceSession.once('Tracing.tracingComplete', () => resolve());
        });
        await traceSession.send('Tracing.start', {
          categories: [
            'devtools.timeline',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-devtools.timeline.frame',
            'blink.user_timing',
          ].join(','),
          transferMode: 'ReportEvents',
        });
      }

      await writing.evaluate(() => {
        const target = window as unknown as {
          __program7ScaleFrameMonitor?: {
            running: boolean;
            last: number;
            maxGap: number;
            phase: string;
            phaseMaxGaps: Record<string, number>;
            events: Array<{ name: string; at: number }>;
            gaps: Array<{ phase: string; startTime: number; durationMs: number }>;
            longTasks: Array<{
              startTime: number;
              durationMs: number;
              attribution: Array<Record<string, unknown>>;
            }>;
            observer: PerformanceObserver;
          };
        };
        const longTasks: Array<{
          startTime: number;
          durationMs: number;
          attribution: Array<Record<string, unknown>>;
        }> = [];
        const observer = new PerformanceObserver((records) => {
          for (const entry of records.getEntries()) {
            const task = entry as PerformanceEntry & {
              attribution?: Array<{
                name?: string;
                containerType?: string;
                containerName?: string;
                containerId?: string;
                src?: string;
              }>;
            };
            longTasks.push({
              startTime: entry.startTime,
              durationMs: entry.duration,
              attribution: (task.attribution ?? []).map((item) => ({
                name: item.name ?? null,
                containerType: item.containerType ?? null,
                containerName: item.containerName ?? null,
                containerId: item.containerId ?? null,
                src: item.src ?? null,
              })),
            });
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
        const monitor = {
          running: true,
          last: performance.now(),
          maxGap: 0,
          phase: 'project-open',
          phaseMaxGaps: {} as Record<string, number>,
          events: [{ name: 'project-open:start', at: performance.now() }],
          gaps: [] as Array<{ phase: string; durationMs: number }>,
          longTasks,
          observer,
        };
        performance.mark('p75-scale:project-open:start');
        target.__program7ScaleFrameMonitor = monitor;
        const tick = (timestamp: number) => {
          const durationMs = timestamp - monitor.last;
          monitor.maxGap = Math.max(monitor.maxGap, durationMs);
          monitor.phaseMaxGaps[monitor.phase] = Math.max(
            monitor.phaseMaxGaps[monitor.phase] ?? 0,
            durationMs,
          );
          if (durationMs > 50)
            monitor.gaps.push({
              phase: monitor.phase,
              startTime: timestamp - durationMs,
              durationMs,
            });
          monitor.last = timestamp;
          if (monitor.running) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      });
      const openStartedAt = performance.now();
      await openProgram7Project(writing, projectPath);
      const openDurationMs = performance.now() - openStartedAt;
      await writing.evaluate(() => {
        const monitor = (
          window as unknown as {
            __program7ScaleFrameMonitor?: {
              phase: string;
              events: Array<{ name: string; at: number }>;
            };
          }
        ).__program7ScaleFrameMonitor;
        if (monitor) {
          monitor.events.push({ name: 'project-open:bridge-returned', at: performance.now() });
          performance.mark('p75-scale:project-open:bridge-returned');
          monitor.phase = 'story-rail-open';
        }
      });
      await openWritingStudioRail(writing, 'Story');
      const renderStartedAt = performance.now();
      const unitRail = writing.locator('[data-manuscript-unit-id]');
      await expect(unitRail).toHaveCount(fixture.count);
      const storyRailDomDurationMs = performance.now() - renderStartedAt;
      await writing.evaluate(
        async () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
      const storyRailVisualDurationMs = performance.now() - renderStartedAt;
      if (fixture.scale === '8x') {
        const firstUnit = unitRail.first();
        await firstUnit.getByRole('button').first().click();
        const firstEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Synthetic 8x Unit 001' });
        await expect(firstEditor).toBeVisible();
        await writing.locator('.stage19-writing-shell__rail--left').evaluate((rail) => {
          rail.scrollTop = rail.scrollHeight;
        });
        await writing.evaluate(
          async () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
        );
        await expect(firstEditor, 'scrolling the large Story rail must leave the active manuscript available').toBeVisible();
        await expect(writing.locator('[data-manuscript-scroll-owner] .cm-editor')).toBeVisible();
      }
      await writing.evaluate(() => {
        const monitor = (
          window as unknown as {
            __program7ScaleFrameMonitor?: {
              phase: string;
              events: Array<{ name: string; at: number }>;
            };
          }
        ).__program7ScaleFrameMonitor;
        if (monitor) {
          monitor.events.push({ name: 'story-rail:visual-frames-complete', at: performance.now() });
          performance.mark('p75-scale:story-rail:visual-frames-complete');
          monitor.phase = 'final-unit-selection';
        }
      });
      const lastUnit = unitRail.last();
      const selectStartedAt = performance.now();
      await lastUnit.getByRole('button').first().click();
      await expect(
        writing.getByRole('textbox', { name: `Manuscript editor: ${fixture.finalTitle}` }),
      ).toBeVisible();
      const selectDurationMs = performance.now() - selectStartedAt;
      await expect(writing.locator('.cm-editor')).toBeVisible();
      const editorAvailableAt = performance.now();
      await writing.evaluate(() => {
        const monitor = (
          window as unknown as {
            __program7ScaleFrameMonitor?: {
              phase: string;
              events: Array<{ name: string; at: number }>;
            };
          }
        ).__program7ScaleFrameMonitor;
        if (monitor) {
          monitor.events.push({ name: 'final-editor:available', at: performance.now() });
          performance.mark('p75-scale:final-editor:available');
          monitor.phase = 'navigation-visual-settle';
        }
      });
      await writing.evaluate(
        async () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
      const frameObservation = await writing.evaluate(() => {
        const target = window as unknown as {
          __program7ScaleFrameMonitor?: {
            running: boolean;
            maxGap: number;
            phaseMaxGaps: Record<string, number>;
            events: Array<{ name: string; at: number }>;
            gaps: Array<{ phase: string; startTime: number; durationMs: number }>;
            longTasks: Array<{
              startTime: number;
              durationMs: number;
              attribution: Array<Record<string, unknown>>;
            }>;
            observer: PerformanceObserver;
          };
        };
        const monitor = target.__program7ScaleFrameMonitor;
        if (!monitor) return null;
        monitor.running = false;
        monitor.events.push({ name: 'navigation-visual-settle:complete', at: performance.now() });
        performance.mark('p75-scale:navigation-visual-settle:complete');
        monitor.longTasks.push(
          ...(monitor.observer.takeRecords() as PerformanceEntry[]).map((entry) => {
            const task = entry as PerformanceEntry & {
              attribution?: Array<{
                name?: string;
                containerType?: string;
                containerName?: string;
                containerId?: string;
                src?: string;
              }>;
            };
            return {
              startTime: entry.startTime,
              durationMs: entry.duration,
              attribution: (task.attribution ?? []).map((item) => ({
                name: item.name ?? null,
                containerType: item.containerType ?? null,
                containerName: item.containerName ?? null,
                containerId: item.containerId ?? null,
                src: item.src ?? null,
              })),
            };
          }),
        );
        monitor.observer.disconnect();
        return {
          maxGap: monitor.maxGap,
          phaseMaxGaps: monitor.phaseMaxGaps,
          events: monitor.events,
          gaps: monitor.gaps,
          longTasks: monitor.longTasks,
        };
      });
      const frameGapMs = frameObservation?.maxGap ?? null;
      const observation = {
        scale: fixture.scale,
        kind: fixture.kind,
        projectId,
        count: fixture.count,
        fixtureDurationMs: fixtureReadyAt - fixtureStartedAt,
        openDurationMs,
        storyRailDomDurationMs,
        storyRailVisualDurationMs,
        selectDurationMs,
        editorAvailabilityAfterClickMs: editorAvailableAt - selectStartedAt,
        frameGapMs,
        frameObservation,
      };
      observations.push(observation);
      console.info('[program7-scale-electron-observation]', JSON.stringify(observation));
      if (cpuSession) {
        const { profile } = await cpuSession.send('Profiler.stop');
        const profileText = JSON.stringify(profile);
        await test.info().attach(`program7-scale-${fixture.scale}-cpu`, {
          body: Buffer.from(profileText),
          contentType: 'application/json',
        });
        await writeFile(
          testInfo.outputPath(`program7-scale-${fixture.scale}-cpu-profile.json`),
          profileText,
          'utf8',
        );
        await cpuSession.detach();
      }
      if (traceSession && traceCompleted) {
        await traceSession.send('Tracing.end');
        await traceCompleted;
        const traceText = JSON.stringify({ traceEvents });
        await testInfo.attach(`program7-scale-${fixture.scale}-chromium-trace`, {
          body: Buffer.from(traceText),
          contentType: 'application/json',
        });
        await writeFile(
          testInfo.outputPath(`program7-scale-${fixture.scale}-chromium-trace.json`),
          traceText,
          'utf8',
        );
        await traceSession.detach();
      }
      const renderDurationMs = storyRailVisualDurationMs;
      const openLimitMs =
        fixture.scale === '1x'
          ? 5_000
          : fixture.scale === '2x'
            ? 7_500
            : fixture.scale === '4x'
              ? 10_000
              : 20_000;
      expect(openDurationMs).toBeLessThanOrEqual(openLimitMs);
      expect(renderDurationMs).toBeLessThan(5_000);
      expect(selectDurationMs).toBeLessThan(3_000);
      expect(frameGapMs).not.toBeNull();
      expect(frameGapMs as number).toBeLessThanOrEqual(100);
    }
    console.info('[program7-scale-electron]', observations);
  } finally {
    await testInfo.attach('program7-scale-observations.json', {
      body: Buffer.from(JSON.stringify(observations, null, 2)),
      contentType: 'application/json',
    });
    await Promise.all(temporaryRoots.map((root) => removeTemporaryDirectory(root)));
  }
});
