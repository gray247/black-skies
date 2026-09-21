import assert from 'node:assert/strict';

import {
  buildProgram7QualificationScenarios,
  responseSummary,
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
assert.equal(timingPassFor('real-warm', 20_000, 60_000), true);
assert.equal(timingPassFor('real-warm', 20_001, 60_000), false);
assert.equal(timingPassFor('real-warm', 20_000, 60_001), false);
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
assert.notEqual(q05?.sourceText, q06?.sourceText);
assert.ok(!q05?.sourceText?.includes('précis'));
assert.ok(q06?.sourceText?.includes('précis'));
assert.ok(q07?.purpose?.includes('hypothetical premise-level'));

process.stdout.write('Program 7 local-AI qualification evidence tests passed.\n');
