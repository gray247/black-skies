// This is used as a memoization anchor to keep props stable.
// Nothing more. This stable no-op identity function is used only under test mode.
export function freezeComponent<T>(value: T): T {
  return value;
}
