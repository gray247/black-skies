const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SECRET_KEY_NAMES = new Set(['api_key', 'apikey', 'auth', 'authorization', 'bearer', 'secret', 'token']);
const SECRET_VALUE_PATTERN = /(sk-[A-Za-z0-9]{20,}|[A-Za-z0-9]{24,})/g;

type PlainValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

function normalizeValue(value: unknown, seen: WeakSet<object>): PlainValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value !== 'object') {
    return String(value) as string;
  }

  if (seen.has(value as object)) {
    return '[Circular]';
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry, seen));
  }

  if (value instanceof Map) {
    const entries: Record<string, unknown> = {};
    for (const [key, entryValue] of value.entries()) {
      entries[String(key)] = normalizeValue(entryValue, seen);
    }
    return entries;
  }

  if (value instanceof Set) {
    return Array.from(value.values(), (entry) => normalizeValue(entry, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    result[key] = normalizeValue(entryValue, seen);
  }
  return result;
}

function scrubValue(value: unknown, keyHint: string | null): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => scrubValue(entry, keyHint));
  }

  if (value && typeof value === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [innerKey, innerValue] of Object.entries(value as Record<string, unknown>)) {
      scrubbed[innerKey] = scrubValue(innerValue, innerKey);
    }
    return scrubbed;
  }

  if (typeof value === 'string') {
    if (keyHint && SECRET_KEY_NAMES.has(keyHint.toLowerCase())) {
      return '[REDACTED]';
    }
    let sanitized = value.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
    sanitized = sanitized.replace(SECRET_VALUE_PATTERN, '[REDACTED_SECRET]');
    return sanitized;
  }

  return value;
}

export function redactSensitiveDetails(details: unknown): unknown {
  const normalised = normalizeValue(details, new WeakSet());
  return scrubValue(normalised, null);
}
