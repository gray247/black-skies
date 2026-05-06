import type { ServiceError } from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';

export type ServiceErrorContext = 'preflight' | 'generation' | 'critique' | 'rewrite' | 'analytics';

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

const BUDGET_TITLE_BY_CONTEXT: Record<ServiceErrorContext, string> = {
  generation: "Couldn't write draft.",
  critique: 'Feedback unavailable.',
  preflight: 'Budget limit exceeded.',
  analytics: 'Budget exhausted.',
};

const BUDGET_DESCRIPTION = 'Budget limit exceeded.';

export function describeServiceError(
  error: ServiceError,
  context: ServiceErrorContext,
): string {
  const code = (error.code ?? '').toUpperCase();
  const message = error.message || GENERIC_ERROR_DESC;

  if (context === 'preflight') {
    if (code === 'NETWORK_ERROR' || code === 'SERVICE_UNAVAILABLE') {
      return [
        'Writing tools backend unreachable.',
        'No draft text was changed.',
        'Start the FastAPI services with `uvicorn blackskies.services.app:app --host 127.0.0.1 --port 8000`, then retry.',
      ].join(' ');
    }
    if (code === 'TIMEOUT') {
      return 'Preflight timed out before any draft text was changed. The backend may still be starting or responding too slowly.';
    }
    if (code === 'PORT_UNAVAILABLE') {
      return 'Preflight did not start because the bridge could not resolve a service port.';
    }
  }

  if (context === 'generation') {
    if (code === 'NETWORK_ERROR' || code === 'SERVICE_UNAVAILABLE') {
      return [
        'Draft generation backend unreachable.',
        'No draft text was changed.',
        'Start the FastAPI services with `uvicorn blackskies.services.app:app --host 127.0.0.1 --port 8000`, then retry.',
      ].join(' ');
    }
    if (code === 'TIMEOUT') {
      return 'Draft generation timed out before any draft text was saved. The backend may still be starting or responding too slowly.';
    }
    if (code === 'PROVIDER_TIMEOUT') {
      return 'Provider/model timed out before draft text was saved. The backend did not finish the generation request in time.';
    }
    if (code === 'PORT_UNAVAILABLE') {
      return 'Draft generation did not start because the bridge could not resolve a service port.';
    }
    if (code === 'INTERNAL' || code === 'ADAPTER') {
      return 'Draft generation failed in the backend or provider/model layer.';
    }
  }

  if (context === 'rewrite' && (code === 'CONFLICT' || error.httpStatus === 409)) {
    return [
      'The scene changed on disk after critique.',
      'The rewrite request was not saved.',
      'Refresh the project or rerun critique, then request the rewrite again.',
    ].join(' ');
  }

  return message;
}

export function mapServiceErrorToToast(
  error: ServiceError,
  context: ServiceErrorContext,
  traceId?: string,
): StructuredServiceError {
  const code = (error.code ?? '').toUpperCase();
  const resolvedTraceId = traceId ?? error.traceId;
  const attachTraceId = (payload: ToastPayload): ToastPayload =>
    resolvedTraceId ? { ...payload, traceId: resolvedTraceId } : payload;

  if (code === 'BUDGET_EXCEEDED' || (error.httpStatus === 402 && code === '')) {
    return {
      budgetBlock: true,
      toast: attachTraceId({
        tone: 'error',
        title: BUDGET_TITLE_BY_CONTEXT[context] ?? 'Budget exhausted.',
        description: BUDGET_DESCRIPTION,
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
      description: describeServiceError(error, context),
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
