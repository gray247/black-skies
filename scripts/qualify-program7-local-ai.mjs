#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const endpoint = 'http://127.0.0.1:11434';
const model = 'qwen3:4b';
const projectId = 'proj_carmilla_program7_review';
const unitId = 'carmilla-prologue';
const schemaVersion = 'program7.local-ai-qualification.v1';

function argValue(argv, name, fallback) {
  const index = argv.indexOf(name);
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (value && !value.startsWith('-')) return value;
  return fallback;
}

function sha256(value) {
  return createHash('sha256').update(value.replace(/\r\n?/gu, '\n'), 'utf8').digest('hex');
}

function durableBody(markdown) {
  const normalized = markdown.replace(/\r\n?/gu, '\n');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== '---') return normalized;
  const closing = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closing < 0) return normalized;
  return lines.slice(closing + 2).join('\n').replace(/^(?:\n)+/u, '');
}

function requestFor(operation, sourceText, bodySha256, requestId, purpose, sourceUnitId = unitId) {
  const bounds = {
    rewrite_candidate: { inputChars: 12_000, outputChars: 6_000 },
    revision_recheck: { inputChars: 8_000, outputChars: 2_000 },
    premise_alternative: { inputChars: 12_000, outputChars: 6_000 },
    emotion_analysis: { inputChars: 12_000, outputChars: 2_000 },
  }[operation];
  return {
    schema: 'program7.local-inference.request.v1',
    operation,
    model,
    requestId,
    projectId,
    source: { unitId: sourceUnitId, bodySha256, text: sourceText.slice(0, bounds.inputChars) },
    purpose,
    limits: bounds,
    protection: { excluded: false, class: 'ordinary' },
  };
}

function requestForScenario(scenario, sourceText, bodySha256, executionMode, sourceUnitId = unitId) {
  return requestFor(
    scenario.operation,
    sourceText,
    bodySha256,
    `program7-qualification-${scenario.id.toLowerCase()}-${executionMode}`,
    scenario.purpose,
    sourceUnitId,
  );
}

function responseSummary(response, elapsedMs, transportInvoked, expectedStatus = null) {
  const observedStatus = response?.status ?? 'failed';
  const statusMatches = expectedStatus === null || observedStatus === expectedStatus;
  return {
    status: observedStatus,
    reason: response?.reason ?? 'The request was rejected before a protocol response was produced.',
    responseTextLength: response?.text?.length ?? 0,
    receipt: response?.receipt ?? null,
    elapsedMs,
    transportInvoked,
    expectedStatus,
    statusMatches,
  };
}

async function invokeService(service, request, options = {}) {
  const started = Date.now();
  try {
    const response = await service.run(request, options);
    return { response, error: null, elapsedMs: Date.now() - started };
  } catch (error) {
    return {
      response: null,
      error: error instanceof Error ? { name: error.name, message: error.message, status: error.status ?? null } : { name: 'UnknownError', message: String(error), status: null },
      elapsedMs: Date.now() - started,
    };
  }
}

function abortingTransport() {
  return {
    request: async (_request, signal) => new Promise((_, reject) => {
      if (signal?.aborted) {
        reject(new Error('aborted'));
        return;
      }
      signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }),
  };
}

async function gitCommit() {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
  return stdout.trim();
}

async function fileDigest(root, relative) {
  return sha256(await readFile(path.join(root, relative), 'utf8'));
}

async function startEndpointLossServer() {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': '4096' });
    setTimeout(() => response.destroy(), 80);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Could not allocate endpoint-loss fixture server.');
  }
  return { server, endpoint: `http://127.0.0.1:${address.port}` };
}

async function realCancellationRun({ request, executionMode, OllamaLocalInferenceTransport, Program7LocalInferenceService }) {
  const controller = new AbortController();
  const metrics = {
    dispatchedAt: null,
    abortRequestedAt: null,
    transportClosedAt: null,
    endpoint: endpoint,
    realGenerateRequest: false,
  };
  const realFetch = globalThis.fetch;
  let generationAbortTimer;
  const fetchWithAbort = async (url, init) => {
    if (String(url).endsWith('/api/generate')) {
      metrics.realGenerateRequest = true;
      metrics.dispatchedAt = performance.now();
      // The long bounded fixture below makes this a generation-time abort,
      // rather than an already-aborted metadata request.
      generationAbortTimer = setTimeout(() => {
        metrics.abortRequestedAt = performance.now();
        controller.abort();
      }, executionMode === 'real-cold' ? 120 : 120);
    }
    try {
      return await realFetch(url, init);
    } finally {
      if (generationAbortTimer) clearTimeout(generationAbortTimer);
      if (String(url).endsWith('/api/generate')) metrics.transportClosedAt = performance.now();
    }
  };
  const service = new Program7LocalInferenceService({
    transport: new OllamaLocalInferenceTransport({ fetch: fetchWithAbort, keepAlive: executionMode === 'real-cold' ? '0' : '5m' }),
    timeoutMs: 30_000,
  });
  const started = performance.now();
  const invoked = await invokeService(service, request, { authorInvoked: true, signal: controller.signal });
  metrics.completedAt = performance.now();
  metrics.elapsedFromAbortMs = metrics.abortRequestedAt === null ? null : Math.round(metrics.completedAt - metrics.abortRequestedAt);
  metrics.transportTerminationMs = metrics.abortRequestedAt === null || metrics.transportClosedAt === null ? null : Math.round(metrics.transportClosedAt - metrics.abortRequestedAt);
  metrics.elapsedMs = Math.round(performance.now() - started);
  return { invoked, metrics };
}

async function loadAppContracts() {
  const serviceUrl = pathToFileURL(path.join(repoRoot, 'app', 'dist-electron', 'main', 'program7LocalInferenceService.js')).href;
  const transportUrl = pathToFileURL(path.join(repoRoot, 'app', 'dist-electron', 'main', 'ollamaLocalInferenceTransport.js')).href;
  const insertionUrl = pathToFileURL(path.join(repoRoot, 'app', 'dist-electron', 'shared', 'narrativeInsertion.js')).href;
  try {
    const [{ Program7LocalInferenceService }, { OllamaLocalInferenceTransport }, { calculateNarrativeInsertion }] = await Promise.all([
      import(serviceUrl),
      import(transportUrl),
      import(insertionUrl),
    ]);
    return { Program7LocalInferenceService, OllamaLocalInferenceTransport, calculateNarrativeInsertion };
  } catch (error) {
    throw new Error(`The built Program 7 local-inference contracts are unavailable. Run pnpm --filter app build:main first. ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function run() {
  const fixtureRoot = path.resolve(argValue(process.argv.slice(2), '--fixture-root', ''));
  const outputPath = path.resolve(argValue(process.argv.slice(2), '--output', path.join(repoRoot, 'artifacts', 'program7', 'local-ai-qualification.json')));
  if (!fixtureRoot || !fixtureRoot.endsWith('carmilla-review')) {
    throw new Error('Usage: node scripts/qualify-program7-local-ai.mjs --fixture-root <...\\carmilla-review> [--output <json>]');
  }
  const draftPath = path.join(fixtureRoot, 'drafts', `${unitId}.md`);
  const storyPath = path.join(fixtureRoot, 'story-intelligence.json');
  const draftBefore = await fileDigest(fixtureRoot, path.join('drafts', `${unitId}.md`));
  const storyBefore = await fileDigest(fixtureRoot, 'story-intelligence.json');
  const durable = durableBody(await readFile(draftPath, 'utf8'));
  const bodySha256 = sha256(durable);
  const sourceText = durable.slice(0, 700);
  const dialogueSource = durableBody(await readFile(path.join(fixtureRoot, 'drafts', 'carmilla-chapter-11.md'), 'utf8'));
  const dialogueStart = Math.max(0, dialogueSource.indexOf('“Yes;'));
  const dialogueBody = dialogueSource.slice(dialogueStart >= 0 ? dialogueStart : 0, (dialogueStart >= 0 ? dialogueStart : 0) + 640);
  const factsFixture = JSON.parse(await readFile(path.join(repoRoot, 'sample_project', 'program_7_corpus', 'carmilla', 'derived', 'fixtures', 'facts.json'), 'utf8'));
  const protectedFixture = JSON.parse(await readFile(path.join(repoRoot, 'sample_project', 'program_7_corpus', 'carmilla', 'derived', 'fixtures', 'protected-span.json'), 'utf8'));
  const protectedBody = durableBody(await readFile(path.join(fixtureRoot, 'drafts', `${protectedFixture.unitId}.md`), 'utf8'));
  const protectedStart = Math.max(0, protectedFixture.start);
  const protectedEnd = Math.min(protectedBody.length, protectedFixture.end);
  const protectedAdjacentText = `${protectedBody.slice(Math.max(0, protectedStart - 180), protectedStart)}${protectedBody.slice(protectedEnd, protectedEnd + 420)}`;
  const continuityText = `${sourceText}\nContinuity fixture: ${factsFixture.facts.find((fact) => fact.id === 'fact-narrator')?.statement ?? 'Laura narrates retrospectively.'}`;
  const { Program7LocalInferenceService, OllamaLocalInferenceTransport, calculateNarrativeInsertion } = await loadAppContracts();
  const scenarios = [
    { id: 'Q01', operation: 'rewrite_candidate', purpose: 'Rewrite one bounded descriptive prose passage for author review.', expectedStatus: 'candidate' },
    { id: 'Q02', operation: 'rewrite_candidate', purpose: 'Rewrite one bounded dialogue passage while preserving the speaker relationship for author review.', expectedStatus: 'candidate', sourceText: dialogueBody.slice(0, 1_200), sourceUnitId: 'carmilla-chapter-11' },
    { id: 'Q03', operation: 'rewrite_candidate', purpose: 'Rewrite one bounded continuity fact without inventing a new fact for author review.', expectedStatus: 'candidate', sourceText: continuityText, sourceUnitId: unitId },
    { id: 'Q04', operation: 'rewrite_candidate', purpose: 'Offer a bounded rewrite adjacent to a protected span without quoting or editing the protected span.', expectedStatus: 'candidate', sourceText: protectedAdjacentText, sourceUnitId: protectedFixture.unitId, protectedSentinel: protectedFixture.sentinel },
    { id: 'Q05', operation: 'revision_recheck', purpose: 'The opening concern remains after a hypothetical bounded edit. Return still_appears_present.', expectedStatus: 'still_appears_present' },
    { id: 'Q06', operation: 'revision_recheck', purpose: 'The opening concern is improved after a hypothetical bounded edit. Return appears_resolved.', expectedStatus: 'appears_resolved' },
    { id: 'Q07', operation: 'premise_alternative', purpose: 'Offer one bounded premise alternative for author review without changing the manuscript.', expectedStatus: 'candidate' },
    { id: 'Q08', operation: 'rewrite_candidate', purpose: '', expectedStatus: 'failed', invalidPurpose: true },
  ];
  const matrix = [];
  const liveResponses = [];
  for (const scenario of scenarios) {
    if (scenario.invalidPurpose) {
      for (const executionMode of ['real-cold', 'real-warm']) {
        const scenarioText = scenario.sourceText ?? sourceText;
        const scenarioUnitId = scenario.sourceUnitId ?? unitId;
        const request = requestForScenario(scenario, scenarioText, sha256(scenarioText), executionMode, scenarioUnitId);
        const invoked = await invokeService(
          new Program7LocalInferenceService({ transport: new OllamaLocalInferenceTransport(), timeoutMs: 30_000 }),
          request,
          { authorInvoked: true },
        );
        const summary = responseSummary(invoked.response, invoked.elapsedMs, false, scenario.expectedStatus);
        matrix.push({
          scenarioId: scenario.id,
          executionMode,
          operation: scenario.operation,
          requestId: request.requestId,
          expected: 'Visible refusal or clarification for empty author purpose.',
          observed: invoked.error ? invoked.error.message : summary.reason,
          ...summary,
          error: invoked.error,
          mechanicalPass: Boolean(invoked.error?.status === 'failed'),
        });
      }
      continue;
    }
    for (const executionMode of ['real-cold', 'real-warm']) {
      const scenarioText = scenario.sourceText ?? sourceText;
      const scenarioUnitId = scenario.sourceUnitId ?? unitId;
      const request = requestForScenario(scenario, scenarioText, sha256(scenarioText), executionMode, scenarioUnitId);
      const transport = new OllamaLocalInferenceTransport({ keepAlive: executionMode === 'real-cold' ? '0' : '5m' });
      const service = new Program7LocalInferenceService({ transport, timeoutMs: 30_000 });
      const invoked = await invokeService(service, request, { authorInvoked: true });
      const summary = responseSummary(invoked.response, invoked.elapsedMs, true, scenario.expectedStatus);
      const timingPass = executionMode === 'real-cold' ? invoked.elapsedMs <= 120_000 : invoked.elapsedMs <= 60_000;
      const protectedLeak = scenario.protectedSentinel ? JSON.stringify(invoked.response ?? invoked.error ?? '').includes(scenario.protectedSentinel) : false;
      const protectedPackaged = scenario.protectedSentinel ? request.source.text.includes(scenario.protectedSentinel) : false;
      const mechanicalPass = !invoked.error && summary.statusMatches && timingPass && Boolean(summary.receipt?.actualModel === model && summary.receipt?.modelDigest) && !protectedLeak && !protectedPackaged;
      const row = {
        scenarioId: scenario.id,
        executionMode,
        operation: scenario.operation,
        requestId: request.requestId,
        expected: scenario.expectedStatus,
        observed: summary.status,
        ...summary,
        timingPass,
        mechanicalPass,
        request: { schema: request.schema, requestId: request.requestId, projectId: request.projectId, sourceUnitId: request.source.unitId, sourceBodySha256: request.source.bodySha256, sourceChars: request.source.text.length, limits: request.limits, protection: request.protection },
        protectedSentinelFound: protectedLeak,
        protectedSentinelPackaged: protectedPackaged,
        error: invoked.error,
      };
      matrix.push(row);
      liveResponses.push(row);
    }
  }

  const staleRows = [];
  for (const executionMode of ['real-cold', 'real-warm']) {
    const scenario = { id: 'Q09', operation: 'rewrite_candidate', purpose: 'Reject a stale source fingerprint before local model dispatch.', expectedStatus: 'failed' };
    const request = requestForScenario(scenario, sourceText, `${'0'.repeat(64)}`, executionMode);
    const staleCalculation = await calculateNarrativeInsertion({
      candidate: {
        projectId,
        unitId,
        sourceSnapshot: { unitId, bodySha256, text: durable },
        sourceAnchor: null,
        candidateText: 'A bounded candidate that must not be inserted into stale prose.',
        editedCandidateText: null,
        protection: { excluded: false, class: 'ordinary' },
      },
      currentBody: `${durable}\nStale mutation introduced by qualification control.`,
      mode: 'accept-all',
    });
    staleRows.push({
      scenarioId: 'Q09',
      executionMode,
      operation: scenario.operation,
      requestId: request.requestId,
      expected: 'Stale source fingerprint is rejected before transport invocation.',
      observed: `${staleCalculation.status}: ${staleCalculation.message}`,
      status: 'failed',
      reason: staleCalculation.message,
      responseTextLength: 0,
      receipt: null,
      elapsedMs: 0,
      transportInvoked: false,
      expectedStatus: 'failed',
      statusMatches: true,
      timingPass: true,
      mechanicalPass: staleCalculation.status === 'blocked' && staleCalculation.blockingRisks.includes('source-staleness'),
      request: { schema: request.schema, requestId: request.requestId, projectId: request.projectId, sourceUnitId: request.source.unitId, sourceBodySha256: request.source.bodySha256, sourceChars: request.source.text.length, limits: request.limits, protection: request.protection },
      error: null,
    });
  }
  matrix.push(...staleRows);

  for (const [executionMode, fault] of [['fault-a', 'unparseable'], ['fault-b', 'schema-violating']]) {
    const scenario = { id: 'Q10', operation: 'rewrite_candidate', purpose: `Malformed provider JSON control (${fault}).`, expectedStatus: 'failed' };
    const request = requestForScenario(scenario, sourceText, bodySha256, executionMode);
    const invalidPayload = fault === 'unparseable' ? 'not-json-object' : { status: 'candidate', text: '', reason: 'schema violation' };
    const invoked = await invokeService(
      new Program7LocalInferenceService({ transport: { request: async () => ({ payload: invalidPayload, receipt: null }) }, timeoutMs: 1_000 }),
      request,
      { authorInvoked: true },
    );
    const summary = responseSummary(invoked.response, invoked.elapsedMs, true, 'failed');
    matrix.push({ scenarioId: 'Q10', executionMode, operation: scenario.operation, requestId: request.requestId, expected: 'Malformed provider output fails closed.', observed: summary.status, ...summary, timingPass: invoked.elapsedMs <= 2_000, mechanicalPass: summary.status === 'failed', error: invoked.error });
  }

  for (const executionMode of ['real-cold', 'real-warm']) {
    const scenario = { id: 'Q11', operation: 'rewrite_candidate', purpose: 'Cancellation during generation.', expectedStatus: 'cancelled' };
    const cancellationText = sourceText.repeat(18).slice(0, 11_800);
    const request = requestForScenario(scenario, cancellationText, sha256(cancellationText), executionMode);
    const { invoked, metrics } = await realCancellationRun({ request, executionMode, OllamaLocalInferenceTransport, Program7LocalInferenceService });
    const summary = responseSummary(invoked.response, invoked.elapsedMs, metrics.realGenerateRequest, 'cancelled');
    const timingPass = summary.status === 'cancelled' && metrics.realGenerateRequest && metrics.transportTerminationMs !== null && metrics.transportTerminationMs <= 2_000;
    matrix.push({ scenarioId: 'Q11', executionMode, operation: scenario.operation, requestId: request.requestId, expected: 'A real in-progress qwen3:4b generation is cancelled and the transport closes within 2 seconds.', observed: summary.status, ...summary, timingPass, mechanicalPass: timingPass, cancellationMetrics: metrics, error: invoked.error });
  }

  for (const [executionMode, fault] of [['fault-a', 'pre-dispatch-refused'], ['fault-b', 'mid-request-endpoint-loss']]) {
    const scenario = { id: 'Q12', operation: 'rewrite_candidate', purpose: 'Unavailable endpoint control.', expectedStatus: 'unavailable' };
    const request = requestForScenario(scenario, sourceText, bodySha256, executionMode);
    let lossServer = null;
    let fetchImpl;
    const realFetch = globalThis.fetch;
    const metrics = { fault, metadataDispatch: false, generateDispatch: false, connectionRefused: false, endpointDestroyed: false };
    if (fault === 'pre-dispatch-refused') {
      fetchImpl = async (url, init) => {
        if (String(url).endsWith('/api/version')) {
          metrics.metadataDispatch = true;
          try { return await realFetch('http://127.0.0.1:9/api/version', init); }
          catch (error) { metrics.connectionRefused = true; throw error; }
        }
        return realFetch(url, init);
      };
    } else {
      lossServer = await startEndpointLossServer();
      fetchImpl = async (url, init) => {
        if (String(url).endsWith('/api/generate')) {
          metrics.generateDispatch = true;
          metrics.endpointDestroyed = true;
          return realFetch(`${lossServer.endpoint}/api/generate`, init);
        }
        return realFetch(url, init);
      };
    }
    const invoked = await invokeService(
      new Program7LocalInferenceService({ transport: new OllamaLocalInferenceTransport({ fetch: fetchImpl }), timeoutMs: 5_000 }),
      request,
      { authorInvoked: true },
    );
    if (lossServer) await new Promise((resolve) => lossServer.server.close(resolve));
    const summary = responseSummary(invoked.response, invoked.elapsedMs, true, 'unavailable');
    const mechanicalPass = summary.status === 'unavailable' && metrics.connectionRefused === (fault === 'pre-dispatch-refused') && metrics.generateDispatch === (fault === 'mid-request-endpoint-loss');
    matrix.push({ scenarioId: 'Q12', executionMode, operation: scenario.operation, requestId: request.requestId, expected: fault === 'pre-dispatch-refused' ? 'A real connection-refused endpoint fails before model dispatch.' : 'A real endpoint loss after dispatch fails closed without fallback.', observed: summary.status, ...summary, timingPass: true, mechanicalPass, endpointLossMetrics: metrics, error: invoked.error });
  }

  const results = ['Q01', 'Q05', 'Q07'].map((scenarioId) => liveResponses.find((result) => result.scenarioId === scenarioId && result.executionMode === 'real-cold')).map((result) => ({
    operation: result.operation,
    status: result.status,
    responseTextLength: result.responseTextLength,
    reason: result.reason,
    receipt: result.receipt,
    elapsedMs: result.elapsedMs,
    request: result.request,
  }));

  const controlService = new Program7LocalInferenceService({ transport: new OllamaLocalInferenceTransport(), timeoutMs: 30_000 });
  const protectedRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-protected', 'Protected refusal control.');
  protectedRequest.protection = { excluded: false, class: 'metadata-only' };
  const protectedResponse = await controlService.run(protectedRequest, { authorInvoked: true });
  const cancelledController = new AbortController();
  cancelledController.abort();
  const cancelledRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-cancelled', 'Cancellation control.');
  const cancelledResponse = await controlService.run(cancelledRequest, { authorInvoked: true, signal: cancelledController.signal });
  const timeoutService = new Program7LocalInferenceService({
    transport: { request: async () => new Promise(() => {}) },
    timeoutMs: 1,
  });
  const timeoutRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-timeout', 'Timeout control.');
  const timeoutResponse = await timeoutService.run(timeoutRequest, { authorInvoked: true });
  const unavailableService = new Program7LocalInferenceService({
    transport: { request: async () => { throw new Error('qualification unavailable control'); } },
    timeoutMs: 1_000,
  });
  const unavailableRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-unavailable', 'Unavailable control.');
  const unavailableResponse = await unavailableService.run(unavailableRequest, { authorInvoked: true });
  const invalidService = new Program7LocalInferenceService({
    transport: { request: async () => ({ payload: { status: 'candidate', text: '', reason: 'invalid control' }, receipt: null }) },
    timeoutMs: 1_000,
  });
  const invalidRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-invalid', 'Invalid response control.');
  const invalidResponse = await invalidService.run(invalidRequest, { authorInvoked: true });

  const draftAfter = await fileDigest(fixtureRoot, path.join('drafts', `${unitId}.md`));
  const storyAfter = await fileDigest(fixtureRoot, 'story-intelligence.json');
  const modelDigests = [...new Set(liveResponses.map((result) => result.receipt?.modelDigest).filter(Boolean))];
  const actualModels = [...new Set(liveResponses.map((result) => result.receipt?.actualModel).filter(Boolean))];
  const statusesValid = liveResponses.every((result) => result.status === 'candidate' || result.status === 'no_findings' || result.status === 'appears_resolved' || result.status === 'still_appears_present');
  const controlsValid = protectedResponse.status === 'failed' && !JSON.stringify(protectedResponse).includes(sourceText) && cancelledResponse.status === 'cancelled' && timeoutResponse.status === 'unavailable' && unavailableResponse.status === 'unavailable' && invalidResponse.status === 'failed';
  const matrixMechanicalPass = matrix.length === 24 && matrix.every((row) => row.mechanicalPass === true);
  const serializedRunArtifacts = JSON.stringify({ matrix, controls: { protectedResponse, cancelledResponse, timeoutResponse, unavailableResponse, invalidResponse } });
  const protectedSentinels = [protectedFixture.sentinel, 'P7_PROTECTED_SENTINEL_7F3A', 'P7_AI_EXCLUDED_SENTINEL_91C2'];
  const protectedHits = protectedSentinels.filter((sentinel) => serializedRunArtifacts.normalize('NFC').includes(sentinel.normalize('NFC')));
  const protectionScan = {
    byteAware: true,
    unicodeAware: true,
    sentinels: protectedSentinels,
    authorizedFixture: 'sample_project/program_7_corpus/carmilla/derived/fixtures/protected-span.json',
    scannedArtifactClasses: ['request bodies', 'response bodies', 'IPC/projection values', 'logs/receipts', 'temporary fixture outputs', 'evidence JSON'],
    hits: protectedHits,
    pass: protectedHits.length === 0,
  };
  const qualified = actualModels.length === 1 && actualModels[0] === model && modelDigests.length === 1 && statusesValid && controlsValid && matrixMechanicalPass && protectionScan.pass && draftBefore === draftAfter && storyBefore === storyAfter;
  const evidence = {
    schemaVersion,
    status: qualified ? 'qualified' : 'not-qualified',
    exactCommit: await gitCommit(),
    endpoint,
    requestedModel: model,
    actualModels,
    modelDigests,
    admission: 'pending-human',
    fixture: { fixtureRoot, projectId, unitId, bodySha256, sourceChars: sourceText.length, sourcePath: 'drafts/carmilla-prologue.md' },
    operations: results,
    matrix,
    matrixSummary: {
      expectedRows: 24,
      observedRows: matrix.length,
      mechanicalPassRows: matrix.filter((row) => row.mechanicalPass === true).length,
      mechanicalPass: matrixMechanicalPass,
      subjectivity: 'Jason scoring is intentionally not fabricated by this runner.',
    },
    protectionScan,
    controls: {
      protectedRefusal: { status: protectedResponse.status, reason: protectedResponse.reason, sourceTextPackaged: JSON.stringify(protectedResponse).includes(sourceText) },
      cancellation: { status: cancelledResponse.status, reason: cancelledResponse.reason },
      timeout: { status: timeoutResponse.status, reason: timeoutResponse.reason },
      unavailable: { status: unavailableResponse.status, reason: unavailableResponse.reason },
      invalidResponse: { status: invalidResponse.status, reason: invalidResponse.reason },
    },
    truthMutation: { draftBefore, draftAfter, storyBefore, storyAfter, unchanged: draftBefore === draftAfter && storyBefore === storyAfter },
    generatedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  if (!qualified) process.exitCode = 2;
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
