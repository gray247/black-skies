import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_callback: ResizeObserverCallback) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  // @ts-expect-error - assigning test stub
  window.ResizeObserver = ResizeObserverStub;
}

if (typeof window !== 'undefined' && typeof window.HTMLElement !== 'undefined') {
  const elementPrototype = window.HTMLElement.prototype as HTMLElement;
  if (typeof elementPrototype.scrollIntoView !== 'function') {
    elementPrototype.scrollIntoView = () => {};
  }
}
