import { test, expect } from './_electron.fixture';
import { bootstrapHarness, collectStartupStateSnapshot } from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';

// HARNESS_ONLY:
// Reason: deterministic-startup regression is a harness stability diagnostic.
// Owner: app/tests/e2e/startup_determinism.spec.ts
// Retire when: equivalent determinism checks are enforced via truth-lane startup evidence.

test('startup_determinism (diagnostic)', async ({ page }, testInfo) => {
  await installServiceStubs(page, 'normal', 'full');
  await bootstrapHarness(page, { expectedMode: 'full' });
  const first = await collectStartupStateSnapshot(page);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await installServiceStubs(page, 'normal', 'full');
  await bootstrapHarness(page, { expectedMode: 'full' });
  const second = await collectStartupStateSnapshot(page);

  const view = (snapshot: Awaited<ReturnType<typeof collectStartupStateSnapshot>>) => ({
    mode: snapshot.mode.body ?? snapshot.mode.html,
    recovery: {
      present: snapshot.recovery.present,
      visible: snapshot.recovery.visible,
    },
    projectPath: snapshot.project.pathBody ?? snapshot.project.pathHtml,
    serviceStatus: snapshot.service.status,
    visiblePanes: snapshot.dock.panes
      .filter((pane) => pane.visible)
      .map((pane) => pane.paneId)
      .sort(),
  });

  const firstView = view(first);
  const secondView = view(second);

  await testInfo.attach('startup-determinism-compare.json', {
    body: Buffer.from(
      `${JSON.stringify(
        {
          first: firstView,
          second: secondView,
        },
        null,
        2,
      )}\n`,
      'utf-8',
    ),
    contentType: 'application/json',
  });

  expect(secondView).toEqual(firstView);
});
