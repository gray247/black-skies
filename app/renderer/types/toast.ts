export type ToastTone = 'info' | 'warning' | 'error';

export interface ToastPayload {
  tone: ToastTone;
  title: string;
  description?: string;
}

export interface ToastInstance extends ToastPayload {
  id: string;
  createdAt: number;
}
