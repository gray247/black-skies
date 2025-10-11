export function generateDraftId(seed: string): string {
  const sanitized = seed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(-6) || 'scene';
  const timestamp = Date.now().toString(16);
  const entropy = Math.random().toString(16).slice(2, 8);
  return `dr_${sanitized}_${timestamp}_${entropy}`;
}
