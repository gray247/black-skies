export interface ServiceHealthPayload {
  status: string;
  version?: string;
}

export interface ServiceHealthError {
  message: string;
}

export interface ServiceHealthResponse {
  ok: boolean;
  data?: ServiceHealthPayload;
  error?: ServiceHealthError;
}

export interface ServicesBridge {
  checkHealth: () => Promise<ServiceHealthResponse>;
}

export type ServicesChannel = never;

