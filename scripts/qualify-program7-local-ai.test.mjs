import assert from 'node:assert/strict';

import {
  responseSummary,
  scanProtectedSentinels,
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
