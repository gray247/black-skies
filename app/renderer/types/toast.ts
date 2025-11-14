export type ToastTone = 'info' | 'warning' | 'error' | 'success';

export interface ToastAction {
  label: string;
  onPress: () => void;
  dismissOnPress?: boolean;
}

export interface ToastPayload {
  tone: ToastTone;
  title: string;
  description?: string;
  traceId?: string;
  actions?: readonly ToastAction[];
  durationMs?: number;
}

export interface ToastInstance extends ToastPayload {
  id: string;
  createdAt: number;
}
