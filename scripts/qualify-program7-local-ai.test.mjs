import assert from 'node:assert/strict';

import {
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

process.stdout.write('Program 7 local-AI qualification evidence tests passed.\n');
