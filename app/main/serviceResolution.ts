export function resolveConfiguredServicePort(
  env: NodeJS.ProcessEnv = process.env,
): number | null {
  const raw = env.BLACKSKIES_SERVICES_PORT;
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
    return null;
  }
  return parsed;
}

