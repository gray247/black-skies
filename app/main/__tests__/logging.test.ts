import { describe, expect, it } from 'vitest';

import { redactSensitiveDetails } from '../redaction';

describe('redactSensitiveDetails', () => {
  it('redacts obvious secret values and emails', () => {
    const payload = {
      api_key: 'sk-secret-ABCDEFGHIJKLMNOPQRST',
      user: 'author@example.com',
      notes: ['Contact editor@example.com for review.'],
      token: 'ABCD1234EFGH5678IJKL9012',
    };

    const redacted = redactSensitiveDetails(payload) as Record<string, unknown>;

    expect(redacted.api_key).toBe('[REDACTED]');
    expect(redacted.user).toBe('[REDACTED_EMAIL]');
    expect((redacted.notes as string[])[0]).toContain('[REDACTED_EMAIL]');
    expect(redacted.token === '[REDACTED_SECRET]' || redacted.token === '[REDACTED]').toBe(true);
  });

  it('handles nested containers and circular references safely', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const payload = {
      headers: {
        Authorization: 'Bearer sk-nested-secret',
      },
      recipients: new Set(['alpha@example.com', 'beta@example.com']),
      metadata: new Map([
        ['token', 'sk-1234567890ABCDEFGHIJKLMNOP'],
        ['notes', ['reach out to gamma@example.com']],
      ]),
      circular,
    };

    const redacted = redactSensitiveDetails(payload) as Record<string, unknown>;
    const headers = redacted.headers as Record<string, unknown>;
    expect(headers.Authorization).toBe('[REDACTED]');

    const recipients = redacted.recipients as unknown[];
    expect(recipients).toEqual(['[REDACTED_EMAIL]', '[REDACTED_EMAIL]']);

    const metadata = redacted.metadata as Record<string, unknown>;
    expect(metadata.token === '[REDACTED_SECRET]' || metadata.token === '[REDACTED]').toBe(true);
    const notes = metadata.notes as string[];
    expect(notes[0]).toContain('[REDACTED_EMAIL]');

    const circularResult = (redacted.circular as Record<string, unknown>).self;
    expect(circularResult).toBe('[Circular]');
  });
});

