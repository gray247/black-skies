export interface OptionalServiceStartupFailure {
  readonly message: string;
}

export async function startOptionalServicesForCoreShell(
  startServices: () => Promise<void>,
  onUnavailable: (failure: OptionalServiceStartupFailure) => void,
): Promise<boolean> {
  try {
    await startServices();
    return true;
  } catch (error) {
    onUnavailable({
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
