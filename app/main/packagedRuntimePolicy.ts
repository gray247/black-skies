export function shouldEnableDedicatedStage19Host(
  isPackaged: boolean,
  configuredEnabled: boolean,
): boolean {
  return isPackaged || configuredEnabled;
}

export function shouldResolveLegacyPython(isPackaged: boolean): boolean {
  return !isPackaged;
}

export function shouldStartLegacyServices(isPackaged: boolean): boolean {
  return !isPackaged;
}
