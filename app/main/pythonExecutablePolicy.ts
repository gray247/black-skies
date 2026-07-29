export function requiresBundledPython(
  isPackaged: boolean,
  bundledPythonPath: string,
): boolean {
  return isPackaged && bundledPythonPath.trim().length > 0;
}
