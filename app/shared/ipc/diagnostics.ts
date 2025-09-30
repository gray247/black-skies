export const DIAGNOSTICS_CHANNELS = {
  openHistory: 'diagnostics:open-history',
} as const;

export type DiagnosticsChannel =
  (typeof DIAGNOSTICS_CHANNELS)[keyof typeof DIAGNOSTICS_CHANNELS];

export interface DiagnosticsOpenSuccess {
  ok: true;
  path: string;
}

export interface DiagnosticsOpenFailure {
  ok: false;
  error: string;
}

export type DiagnosticsOpenResult = DiagnosticsOpenSuccess | DiagnosticsOpenFailure;

export interface DiagnosticsBridge {
  openDiagnosticsFolder: () => Promise<DiagnosticsOpenResult>;
}
