export type ToastTone = 'info' | 'warning' | 'error' | 'success';

export interface ToastPayload {
  tone: ToastTone;
  title: string;
  description?: string;
  traceId?: string;
}

export interface ToastInstance extends ToastPayload {
  id: string;
  createdAt: number;
}
