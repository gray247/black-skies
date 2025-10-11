export async function computeSha256(value: string): Promise<string> {
  const crypto = globalThis.crypto;
  if (!crypto?.subtle) {
    throw new Error('Secure hashing APIs are unavailable in this environment.');
  }
  const normalized = value.replace(/\r\n/g, '\n');
  const trimmed = normalized.replace(/\n+$/g, '');
  const encoder = new TextEncoder();
  const bytes = encoder.encode(trimmed);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
