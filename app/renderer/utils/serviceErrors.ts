import type { ServiceError } from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';

export type ServiceErrorContext = 'preflight' | 'generation' | 'critique' | 'analytics';

export interface StructuredServiceError {
  toast: ToastPayload;
  budgetBlock?: boolean;
  analyticsWarning?: boolean;
}

export const ANALYTICS_WARNING_TOAST: ToastPayload = {
  tone: 'warning',
  title: 'Usage analytics temporarily unavailable.',
  description: 'Usage analytics temporarily unreachable; generation still works.',
};

const GENERIC_ERROR_TITLE = 'Something went wrong.';
const GENERIC_ERROR_DESC = 'An unexpected issue occurred. Try again or contact support.';
const SANDBOX_WARNING = {
  tone: 'warning' as const,
  title: 'Sandbox policy violation.',
  description: 'This plugin tried to do something that’s not allowed.',
};

export function mapServiceErrorToToast(
  error: ServiceError,
  context: ServiceErrorContext,
  traceId?: string,
): StructuredServiceError {
  const message = error.message || GENERIC_ERROR_DESC;
  const code = (error.code ?? '').toUpperCase();
  const resolvedTraceId = traceId ?? error.traceId;
  const attachTraceId = (payload: ToastPayload): ToastPayload =>
    resolvedTraceId ? { ...payload, traceId: resolvedTraceId } : payload;

  if (code === 'BUDGET_EXCEEDED' || (error.httpStatus === 402 && code === '')) {
    return {
      budgetBlock: true,
      toast: attachTraceId({
        tone: 'error',
        title: 'Budget exhausted.',
        description:
          'Budget exhausted for this project/session. Adjust settings or wait/reset.',
      }),
    };
  }

  if (context === 'analytics') {
    if (code === 'SERVICE_UNAVAILABLE' || code === 'TIMEOUT' || code === 'INTERNAL') {
      return {
        toast: attachTraceId(ANALYTICS_WARNING_TOAST),
        analyticsWarning: true,
      };
    }
  }

  if (code.startsWith('SANDBOX') || code === 'SANDBOX_POLICY') {
    return { toast: attachTraceId(SANDBOX_WARNING) };
  }

  return {
    toast: attachTraceId({
      tone: 'error',
      title: GENERIC_ERROR_TITLE,
      description: message,
    }),
  };
}

export interface HandleServiceErrorOptions {
  suppressToast?: boolean;
}

export function handleServiceError(
  error: ServiceError,
  context: ServiceErrorContext,
  pushToast: (toast: ToastPayload) => void,
  onBudgetBlock?: () => void,
  traceId?: string,
  options?: HandleServiceErrorOptions,
): StructuredServiceError {
  const interpretation = mapServiceErrorToToast(error, context, traceId);
  if (!options?.suppressToast) {
    pushToast(interpretation.toast);
  }
  if (interpretation.budgetBlock) {
    onBudgetBlock?.();
  }
  return interpretation;
}

export default handleServiceError;
