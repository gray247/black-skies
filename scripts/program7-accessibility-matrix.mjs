import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');

const routes = [
  { id: 'revision-desk', state: 'active and history', topologies: ['attached', 'detached'] },
  { id: 'story-foundation', state: 'blank, unknown, revised, read-only', topologies: ['attached', 'detached'] },
  { id: 'ideas', state: 'empty, seed, branch, advisory, promotion preview', topologies: ['attached', 'detached'] },
  { id: 'history', state: 'empty, provenance, stale, recurrence', topologies: ['attached', 'detached'] },
  { id: 'operations-approvals', state: 'empty and explicit owner handoff', topologies: ['attached', 'detached'] },
  { id: 'manual-alternative', state: 'manual candidate, drawer, and compare-before-accept', topologies: ['attached'] },
];
const themes = ['dark', 'light'];
const viewports = [
  { id: 'wide', width: 1280, height: 900 },
  { id: 'narrow', width: 640, height: 900 },
];
const matrixProfiles = [
  { id: '100-wide-normal', zoom: 100, viewport: 'wide', reducedMotion: false },
  { id: '200-narrow-normal', zoom: 200, viewport: 'narrow', reducedMotion: false },
  { id: '100-wide-reduced', zoom: 100, viewport: 'wide', reducedMotion: true },
];
const sourceFiles = [
  'app/renderer/components/program7/Program7CreateDevelopWorkspace.tsx',
  'app/renderer/components/program7/RevisionDesk.tsx',
  'app/renderer/components/program7/RevisionComparison.tsx',
  'app/renderer/components/program7/StoryFoundation.tsx',
  'app/renderer/components/program7/IdeasWorkspace.tsx',
  'app/renderer/components/program7/Program7History.tsx',
  'app/renderer/components/program7/WritingRevisionDrawer.tsx',
  'app/renderer/Stage19WritingSpineView.tsx',
  'app/renderer/styles/app.css',
  'app/tests/e2e/program7-accessibility.spec.ts',
  'app/renderer/__tests__/Program7AccessibilityMatrix.test.tsx',
  'scripts/program7-accessibility-matrix.mjs',
];
const requiredStates = [
  'empty', 'active', 'manual', 'local', 'stale', 'protected', 'loading',
  'unavailable', 'cancelled', 'failure', 'partial', 'resolved', 'recurrence',
];

// These are bindings to existing focused assertions, not inferred coverage
// from an observed route packet. Keep the test titles exact: a renamed or
// removed assertion must fail closed instead of silently becoming evidence.
const stateAssertions = {
  empty: [
    { file: 'renderer/__tests__/RevisionDesk.test.tsx', test: 'shows honest empty and degraded states' },
    { file: 'renderer/__tests__/Program7History.test.tsx', test: 'shows honest empty states for both buckets' },
  ],
  active: [
    { file: 'renderer/__tests__/RevisionDesk.test.tsx', test: 'separates active items from history and hides protected content while preserving metadata' },
    { file: 'renderer/__tests__/Program7History.test.tsx', test: 'keeps active records separate from resolved history and shows provenance, staleness, recurrence, and partial acceptance' },
  ],
  manual: [
    { file: 'renderer/__tests__/WritingRevisionDrawer.test.tsx', test: 'opens as an explicit candidate editor and saves edits without accepting them' },
    { file: 'renderer/__tests__/IdeasWorkspace.test.tsx', test: 'is manual-first, optional, and exposes an Idea Library with protected redaction' },
  ],
  local: [
    { file: 'renderer/__tests__/RevisionDesk.test.tsx', test: 'exposes return, recheck, disposition, author resolution, recurrence, and keyboard actions' },
    { file: 'renderer/__tests__/RevisionComparison.test.tsx', test: 'keeps current and candidate text visibly separate and exposes origin, warning, and stale state' },
    { file: 'main/__tests__/program7LocalInferenceService.test.ts', test: 'validates the closed response and returns a visible receipt' },
  ],
  stale: [
    { file: 'renderer/__tests__/RevisionComparison.test.tsx', test: 'keeps current and candidate text visibly separate and exposes origin, warning, and stale state' },
    { file: 'renderer/__tests__/RevisionComparison.test.tsx', test: 'does not offer acceptance through a stale candidate or expose protected source text' },
  ],
  protected: [
    { file: 'renderer/__tests__/RevisionDesk.test.tsx', test: 'separates active items from history and hides protected content while preserving metadata' },
    { file: 'renderer/__tests__/RevisionComparison.test.tsx', test: 'does not offer acceptance through a stale candidate or expose protected source text' },
    { file: 'renderer/__tests__/WritingRevisionDrawer.test.tsx', test: 'redacts protected content and prevents editing' },
  ],
  // No existing Program 7 assertion renders a loading posture. This remains
  // an explicit gap until a controlled loading fixture is added.
  loading: [],
  unavailable: [
    { file: 'renderer/__tests__/RevisionDesk.test.tsx', test: 'shows honest empty and degraded states' },
    { file: 'renderer/__tests__/StoryFoundation.test.tsx', test: 'keeps answer controls keyboard reachable and reports degraded storage honestly' },
    { file: 'renderer/__tests__/IdeasWorkspace.test.tsx', test: 'exposes a promotion preview without performing a destination write and reports degraded storage' },
    { file: 'main/__tests__/program7LocalInferenceService.test.ts', test: 'preserves the first abort cause when timeout and author cancellation race' },
  ],
  cancelled: [
    { file: 'main/__tests__/program7LocalInferenceService.test.ts', test: 'returns cancelled before invoking an abort-ignoring transport for a pre-aborted signal' },
    { file: 'main/__tests__/program7LocalInferenceService.test.ts', test: 'aborts the underlying request on cancellation' },
  ],
  failure: [
    { file: 'main/__tests__/program7LocalInferenceService.test.ts', test: 'fails closed on unknown response keys and never retries' },
    { file: 'main/__tests__/program7LocalInferenceService.test.ts', test: 'rejects a fabricated final response envelope from the model' },
  ],
  partial: [
    { file: 'renderer/__tests__/RevisionComparison.test.tsx', test: 'requires explicit all or selected acceptance and keeps disposition actions separate' },
    { file: 'renderer/__tests__/Program7History.test.tsx', test: 'keeps active records separate from resolved history and shows provenance, staleness, recurrence, and partial acceptance' },
  ],
  // The acceptance and rejection assertions are part of the resolved
  // lifecycle binding; no assertion is promoted to a human acceptance claim.
  resolved: [
    { file: 'renderer/__tests__/RevisionDesk.test.tsx', test: 'exposes return, recheck, disposition, author resolution, recurrence, and keyboard actions' },
    { file: 'renderer/__tests__/RevisionDesk.test.tsx', test: 'allows the Writing surface to enable the author resolution gesture' },
    { file: 'renderer/__tests__/RevisionComparison.test.tsx', test: 'requires explicit all or selected acceptance and keeps disposition actions separate' },
  ],
  recurrence: [
    { file: 'renderer/__tests__/RevisionDesk.test.tsx', test: 'exposes return, recheck, disposition, author resolution, recurrence, and keyboard actions' },
    { file: 'renderer/__tests__/Program7History.test.tsx', test: 'keeps active records separate from resolved history and shows provenance, staleness, recurrence, and partial acceptance' },
  ],
};

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

function rowId(topology, route, theme, zoom, viewport, motion) {
  return ['P7-A11Y', topology, route.id, theme, `${zoom}PCT`, viewport.id, motion]
    .join('-').toUpperCase();
}

function expectedRows() {
  const rows = [];
  for (const route of routes) {
    for (const topology of route.topologies) {
      for (const theme of themes) {
        for (const profile of matrixProfiles) {
          const viewport = viewports.find((candidate) => candidate.id === profile.viewport);
          if (!viewport) throw new Error(`Matrix profile references unknown viewport ${profile.viewport}.`);
          rows.push({
            evidenceId: rowId(topology, route, theme, profile.zoom, viewport, profile.reducedMotion ? 'reduced' : 'normal'),
            topology,
            route: route.id,
            expectedStateCoverage: route.state,
            theme,
            zoom: profile.zoom,
            viewport,
            reducedMotion: profile.reducedMotion,
            profile: profile.id,
            expected: 'axe has zero WCAG A/AA violations; all visible controls are named and keyboard reachable; IDs are unique; focus is visible; contrast is readable; no horizontal overflow; attached and detached projection match where both surfaces are supported.',
            result: 'Pass',
          });
        }
      }
    }
  }
  return rows;
}

function parseArgs(argv) {
  let output = null;
  let observed = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--output') {
      output = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--observed') {
      observed = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      return { help: true, output: null, observed: null };
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { help: false, output, observed };
}

function readObserved(file, expected) {
  if (!file) return new Map();
  const absolute = path.resolve(repositoryRoot, file);
  if (!existsSync(absolute)) throw new Error(`Observed result packet does not exist: ${absolute}`);
  const parsed = JSON.parse(readFileSync(absolute, 'utf8'));
  const rows = Array.isArray(parsed) ? parsed : parsed?.rows;
  if (!Array.isArray(rows)) throw new Error('Observed result packet must be an array or an object with a rows array.');
  const map = new Map();
  const expectedIds = new Set(expected.map((row) => row.evidenceId));
  for (const row of rows) {
    if (!row || typeof row.evidenceId !== 'string' || !['Pass', 'Fail', 'Uncertain'].includes(row.result)) {
      throw new Error('Observed result packet contains a malformed row.');
    }
    if (map.has(row.evidenceId)) throw new Error(`Observed result packet duplicates ${row.evidenceId}.`);
    if (!expectedIds.has(row.evidenceId)) throw new Error(`Observed result packet contains unknown ${row.evidenceId}.`);
    map.set(row.evidenceId, row.result);
  }
  return map;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function runFocusedStateAssertions() {
  const assertions = Object.values(stateAssertions).flat();
  const files = [...new Set(assertions.map((assertion) => assertion.file))];
  const testNames = [...new Set(assertions.map((assertion) => assertion.test))];
  const vitestCli = path.join(repositoryRoot, 'app', 'node_modules', 'vitest', 'vitest.mjs');
  if (!existsSync(vitestCli)) {
    return {
      status: 'Uncertain',
      command: null,
      assertionCount: assertions.length,
      reason: 'Vitest CLI is unavailable; no state assertion was treated as evidence.',
    };
  }
  const pattern = testNames.map(escapeRegExp).join('|');
  try {
    execFileSync(process.execPath, [vitestCli, 'run', ...files, '-t', pattern], {
      cwd: path.join(repositoryRoot, 'app'),
      stdio: 'ignore',
      env: process.env,
    });
    return {
      status: 'Pass',
      command: `vitest run ${files.join(' ')} -t <exact-bound-test-titles>`,
      assertionCount: assertions.length,
      reason: null,
    };
  } catch {
    return {
      status: 'Fail',
      command: `vitest run ${files.join(' ')} -t <exact-bound-test-titles>`,
      assertionCount: assertions.length,
      reason: 'One or more focused state assertions failed; no state was treated as passing evidence.',
    };
  }
}

export function buildQualificationPacket({ observedFile = null } = {}) {
  const statusOutput = git(['status', '--porcelain']);
  const exactCommit = git(['rev-parse', 'HEAD']);
  const treeHash = git(['rev-parse', 'HEAD^{tree}']);
  const expected = expectedRows();
  const observed = readObserved(observedFile, expected);
  const rows = expected.map((row) => ({ ...row, result: observed.get(row.evidenceId) ?? 'Uncertain' }));
  const absentRows = rows.filter((row) => !observed.has(row.evidenceId)).map((row) => row.evidenceId);
  const failedRows = rows.filter((row) => row.result === 'Fail').map((row) => row.evidenceId);
  const uncertainRows = rows.filter((row) => row.result === 'Uncertain').map((row) => row.evidenceId);
  const stateAssertionRun = runFocusedStateAssertions();
  const stateBindings = Object.fromEntries(requiredStates.map((state) => {
    const assertions = stateAssertions[state] ?? [];
    const result = assertions.length === 0
      ? 'Uncertain'
      : stateAssertionRun.status;
    return [state, {
      result,
      assertions,
      missing: assertions.length === 0
        ? `No existing focused Vitest assertion covers the Program 7 ${state} state.`
        : null,
    }];
  }));
  // Semantic fixture outcomes are not inferred from a rendered route. A state
  // without a bound assertion (currently loading) remains unresolved and
  // keeps the packet partial even if every route row is observed as Pass.
  const unresolvedRequiredStates = requiredStates.filter((state) => stateBindings[state].result !== 'Pass');
  const sourceHashes = Object.fromEntries(sourceFiles.map((relativePath) => {
    const absolutePath = path.join(repositoryRoot, relativePath);
    if (!existsSync(absolutePath)) throw new Error(`Required source file does not exist: ${absolutePath}`);
    return [relativePath, { path: absolutePath, sha256: sha256(readFileSync(absolutePath)) }];
  }));
  const status = statusOutput || absentRows.length > 0 || failedRows.length > 0 || uncertainRows.length > 0 || unresolvedRequiredStates.length > 0 ? 'partial' : 'qualified';
  return {
    schema: 'program7.accessibility-qualification.v1',
    status,
    exactCommit,
    exactTree: treeHash,
    cleanExactCommitBinding: statusOutput === '',
    dirtyPaths: statusOutput ? statusOutput.split(/\r?\n/u).filter(Boolean) : [],
    sourceHashes,
    requiredRoutes: routes,
    requiredTopologies: [...new Set(routes.flatMap((route) => route.topologies))],
    requiredThemes: themes,
    requiredProfiles: matrixProfiles,
    requiredViewports: viewports,
    requiredStates,
    rows,
    absentRows,
    failedRows,
    uncertainRows,
    unresolvedRequiredStates,
    stateAssertions,
    stateAssertionRun,
    stateBindings,
    protectedEvidenceUsed: false,
    humanAcceptanceClaimed: false,
    limitations: [
      'This runner records objective matrix bindings only; it does not infer aesthetics, usefulness, visual acceptance, or human resolution.',
      'The loading state has no existing focused Program 7 Vitest assertion and remains Uncertain until a controlled loading fixture is supplied.',
    ],
  };
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write('Usage: node scripts/program7-accessibility-matrix.mjs [--output <path>] [--observed <path>]\n');
    return 0;
  }
  const packet = buildQualificationPacket({ observedFile: args.observed });
  const serialized = `${JSON.stringify(packet, null, 2)}\n`;
  if (args.output) writeFileSync(path.resolve(repositoryRoot, args.output), serialized, 'utf8');
  process.stdout.write(serialized);
  return packet.status === 'qualified' ? 0 : 2;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) process.exitCode = main();
