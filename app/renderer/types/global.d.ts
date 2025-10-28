import type { ProjectLoaderApi } from '../../shared/ipc/projectLoader';
import type { ServicesBridge } from '../../shared/ipc/services';
import type { DiagnosticsBridge } from '../../shared/ipc/diagnostics';
import type { LayoutBridge } from '../../shared/ipc/layout';
import type { RuntimeConfig } from '../../shared/config/runtime';

declare global {
  interface Window {
    projectLoader?: ProjectLoaderApi;
    services?: ServicesBridge;
    diagnostics?: DiagnosticsBridge;
    runtimeConfig?: RuntimeConfig;
    layout?: LayoutBridge;
  }
}

export {};
