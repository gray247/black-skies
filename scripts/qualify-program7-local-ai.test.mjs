import assert from 'node:assert/strict';

import {
  buildProgram7QualificationScenarios,
  responseSummary,
  prepareProviderForMode,
  scanProtectedSentinels,
  timingPassFor,
} from './qualify-program7-local-ai.mjs';

const response = {
  status: 'candidate',
  text: 'A bounded author-review candidate.',
  reason: 'Offered for review.',
  receipt: { endedAt: '2026-09-14T01:02:03.000Z' },
};
const summary = responseSummary(response, 321, true, 'candidate');
assert.equal(summary.responseText, response.text);
assert.equal(summary.responseTextLength, response.text.length);
assert.equal(summary.responseMode, 'non-streaming');
assert.equal(summary.firstStructuredResponseAt, response.receipt.endedAt);
assert.equal(summary.firstVisibleResultMs, 321);
assert.equal(timingPassFor('real-cold', 60_000, 120_000), true);
assert.equal(timingPassFor('real-cold', 60_001, 120_000), false);
assert.equal(timingPassFor('real-cold', 60_000, 120_001), false);
assert.equal(timingPassFor('real-warm', 21_774, 21_774), true);
assert.equal(timingPassFor('real-warm', 60_000, 60_000), true);
assert.equal(timingPassFor('real-warm', 60_001, 60_001), false);
assert.equal(timingPassFor('real-warm', 60_000, 60_001), false);
assert.equal(timingPassFor('unknown', 0, 0), false);

const sentinel = 'P7_PROTECTED_SENTINEL_7F3A';
assert.deepEqual(scanProtectedSentinels({ response: { text: 'ordinary' } }, [sentinel]).hits, []);
assert.deepEqual(
  scanProtectedSentinels({ response: { text: `leak ${sentinel}` } }, [sentinel]).hits,
  [sentinel],
);

const decomposed = 'P7_AI_EXCLUDED_SENTINEL_E\u0301';
const composed = 'P7_AI_EXCLUDED_SENTINEL_É';
assert.deepEqual(scanProtectedSentinels({ response: composed }, [decomposed]).hits, [decomposed]);

const fixtureScenarios = buildProgram7QualificationScenarios({
  durable: [
    'PROLOGUE',
    '',
    'Upon a paper attached to the Narrative, Doctor Hesselius has written a note.',
    '',
    'As I publish the case, I shall abstain from presenting any précis of the learned Doctor’s reasoning.',
  ].join('\n'),
  dialogueSource: '“Yes; and very splendid, I believe, they were,” said my father.\n\n“Princely! The grounds were illuminated. I felt myself carried back into the romance and poetry of my early youth.\n\n“When the fireworks were ended, the ball began.',
  factsFixture: { facts: [{ id: 'fact-narrator', statement: 'Laura narrates retrospectively.' }] },
  protectedFixture: { unitId: 'protected-unit', start: 6, end: 12, sentinel: 'PROTECTED' },
  protectedBody: 'Before PROTECTED after.',
});
const q02 = fixtureScenarios.find((scenario) => scenario.id === 'Q02');
const q03 = fixtureScenarios.find((scenario) => scenario.id === 'Q03');
const q05 = fixtureScenarios.find((scenario) => scenario.id === 'Q05');
const q06 = fixtureScenarios.find((scenario) => scenario.id === 'Q06');
const q07 = fixtureScenarios.find((scenario) => scenario.id === 'Q07');
assert.ok(q02?.sourceText?.endsWith('early youth.'));
assert.ok(!q02?.sourceText?.includes('When the fireworks'));
assert.equal(q03?.sourceText, 'Immutable continuity fact: Laura narrates retrospectively.');
assert.equal(q05?.purpose, q06?.purpose);
assert.ok(q06?.purpose?.includes('presented or withheld'));
assert.ok(q06?.purpose?.includes('do not assess whether the reasoning itself is supplied'));
assert.equal(q05?.expectedStatus, 'still_appears_present');
assert.equal(q06?.expectedStatus, 'appears_resolved');
assert.notEqual(q05?.sourceText, q06?.sourceText);
assert.ok(!q05?.sourceText?.includes('précis'));
assert.ok(q06?.sourceText?.includes('précis'));
assert.ok(q07?.purpose?.includes('hypothetical premise-level'));


async function checkPreparation(mode, models) {
  const calls = [];
  const preparation = await prepareProviderForMode(mode, async (url, init) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(String(url).endsWith('/api/ps') ? { models } : { done: true }), { status: 200 });
  }, 0);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].body, { model: 'qwen3:4b', keep_alive: mode === 'real-cold' ? 0 : '5m' });
  assert.ok(!('prompt' in calls[0].body), 'Preparation must not generate an author alternative');
  return preparation;
}
assert.equal((await checkPreparation('real-cold', [])).targetResident, false);
assert.equal((await checkPreparation('real-warm', [{ name: 'qwen3:4b', size: 123 }])).targetResident, true);
await assert.rejects(checkPreparation('real-cold', [{ name: 'qwen3:4b', size: 123 }]), /precondition/);
await assert.rejects(checkPreparation('real-warm', []), /precondition/);
await assert.rejects(checkPreparation('real-warm', [{ name: 'other-model', size: 123 }]), /precondition/);
await assert.rejects(prepareProviderForMode('unknown'), /Unknown/);
let failedCalls = 0;
await assert.rejects(prepareProviderForMode('real-cold', async () => { failedCalls += 1; throw new Error('offline'); }), /offline/);
assert.equal(failedCalls, 1, 'Preparation failure must not retry');


let preparationCalls = 0;
let residencyCalls = 0;
const delayedUnload = await prepareProviderForMode('real-cold', async (url) => {
  if (String(url).endsWith('/api/generate')) {
    preparationCalls += 1;
    return new Response(JSON.stringify({ done: true }), { status: 200 });
  }
  residencyCalls += 1;
  return new Response(JSON.stringify({ models: residencyCalls === 1 ? [{ name: 'qwen3:4b', size: 123 }] : [] }), { status: 200 });
}, 1000);
assert.equal(delayedUnload.targetResident, false);
assert.equal(delayedUnload.residencyChecks, 2);
assert.equal(preparationCalls, 1, 'Delayed unload must not cause another generation/load request');

process.stdout.write('Program 7 local-AI qualification evidence tests passed.\n');
