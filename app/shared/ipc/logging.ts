export const LOGGING_CHANNELS = {
  diagnostics: 'logging:diagnostics',
} as const;

export type LoggingChannel =
  (typeof LOGGING_CHANNELS)[keyof typeof LOGGING_CHANNELS];

export type DiagnosticsLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DiagnosticsLogPayload {
  level: DiagnosticsLogLevel;
  message: string;
  scope?: string;
  details?: unknown;
}

