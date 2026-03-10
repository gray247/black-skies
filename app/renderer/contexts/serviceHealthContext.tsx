import { createContext, useContext, type ReactNode } from "react";

export interface ServiceHealthContextValue {
  serviceUnavailable: boolean;
  onRetry: () => Promise<void>;
}

const DEFAULT_SERVICE_HEALTH_CONTEXT_VALUE: ServiceHealthContextValue = {
  serviceUnavailable: false,
  onRetry: async () => {},
};

const ServiceHealthContext = createContext<ServiceHealthContextValue | null>(null);

export function ServiceHealthProvider({
  value,
  children,
}: {
  value: ServiceHealthContextValue;
  children: ReactNode;
}): JSX.Element {
  return <ServiceHealthContext.Provider value={value}>{children}</ServiceHealthContext.Provider>;
}

export function useServiceHealthContext(): ServiceHealthContextValue {
  const context = useContext(ServiceHealthContext);
  if (!context) {
    return DEFAULT_SERVICE_HEALTH_CONTEXT_VALUE;
  }
  return context;
}
