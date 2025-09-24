declare module 'electron' {
  type DialogProperty =
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory';

  interface OpenDialogOptions {
    properties?: DialogProperty[];
  }

  interface OpenDialogReturnValue {
    canceled: boolean;
    filePaths: string[];
  }

  interface ContextBridge {
    exposeInMainWorld(key: string, api: unknown): void;
  }

  interface IpcRenderer {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  }

  interface IpcMain {
    handle(channel: string, listener: (event: unknown, ...args: unknown[]) => unknown): void;
    removeHandler(channel: string): void;
  }

  interface AppModule {
    getAppPath(): string;
  }

  export const dialog: {
    showOpenDialog: (options?: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
  };

  export const contextBridge: ContextBridge;
  export const ipcRenderer: IpcRenderer;
  export const ipcMain: IpcMain;
  export const app: AppModule;
}
