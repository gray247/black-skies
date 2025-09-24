import type { ProjectLoaderApi } from '../../shared/ipc/projectLoader';

declare global {
  interface Window {
    projectLoader?: ProjectLoaderApi;
  }
}

export {};
