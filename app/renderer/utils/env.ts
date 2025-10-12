export function isTestEnvironment(): boolean {
  if (typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined") {
    const mode = import.meta.env.MODE ?? import.meta.env.NODE_ENV ?? import.meta.env.TEST;
    if (mode && String(mode).toLowerCase() === "test") {
      return true;
    }
  }

  if (typeof process !== "undefined" && process.env) {
    const nodeEnv = process.env.NODE_ENV ?? process.env.VITEST_ENV ?? process.env.VITEST;
    if (nodeEnv && nodeEnv.toLowerCase() === "test") {
      return true;
    }
    if (process.env.VITEST) {
      return true;
    }
  }

  return false;
}
