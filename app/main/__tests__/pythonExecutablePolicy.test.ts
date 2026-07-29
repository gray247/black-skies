import { describe, expect, it } from 'vitest';
import { requiresBundledPython } from '../pythonExecutablePolicy';

describe('Python executable policy', () => {
  it('requires the configured bundled interpreter in a packaged app', () => {
    expect(requiresBundledPython(true, '{{APP_RESOURCES}}/python/python.exe')).toBe(true);
  });

  it('allows an approved explicit interpreter in an unpackaged production-built app', () => {
    expect(requiresBundledPython(false, '{{APP_RESOURCES}}/python/python.exe')).toBe(false);
  });

  it('does not require a bundle when no bundled interpreter is configured', () => {
    expect(requiresBundledPython(true, '')).toBe(false);
  });
});
