import { useCallback, useRef, useState } from 'react';
import type { ToastInstance, ToastPayload } from '../types/toast';

interface UseToastsResult {
  toasts: ToastInstance[];
  pushToast: (payload: ToastPayload) => void;
  dismissToast: (id: string) => void;
}

export function useToasts(): UseToastsResult {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const counterRef = useRef(0);

  const pushToast = useCallback((payload: ToastPayload) => {
    counterRef.current += 1;
    const id = `${payload.tone}-${Date.now()}-${counterRef.current}`;
    const toast: ToastInstance = {
      ...payload,
      id,
      createdAt: Date.now(),
    };
    setToasts((previous) => [...previous, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}

export default useToasts;
