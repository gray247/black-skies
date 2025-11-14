import type { MosaicNode } from "react-mosaic-component";

export const LAYOUT_CHANNELS = {
  load: "layout:load",
  save: "layout:save",
  reset: "layout:reset",
  listFloating: "layout:floating:list",
  openFloating: "layout:floating:open",
  closeFloating: "layout:floating:close",
} as const;

export type LayoutPaneId =
  | "wizard"
  | "draft-board"
  | "critique"
  | "history"
  | "analytics";

export type LayoutTree = MosaicNode<LayoutPaneId>;

export interface LayoutLoadRequest {
  projectPath: string;
}

export interface LayoutSaveRequest extends LayoutLoadRequest {
  layout: LayoutTree;
  floatingPanes?: FloatingPaneDescriptor[];
  schemaVersion?: number;
}

export interface LayoutResetRequest extends LayoutLoadRequest {}

export interface LayoutLoadResponse {
  layout: LayoutTree | null;
  floatingPanes: FloatingPaneDescriptor[];
  schemaVersion?: number;
}

export interface FloatingPaneDescriptor {
  id: LayoutPaneId;
  bounds?: { x: number; y: number; width: number; height: number };
  displayId?: number;
}

export interface FloatingPaneClampInfo {
  reason: 'off-screen-clamp';
  before?: FloatingPaneDescriptor['bounds'];
  after: FloatingPaneDescriptor['bounds'];
  requestedDisplayId?: number;
  appliedDisplayId?: number;
}

export interface FloatingPaneOpenResult {
  opened: boolean;
  clamp?: FloatingPaneClampInfo | null;
}

export interface LayoutBridge {
  loadLayout(request: LayoutLoadRequest): Promise<LayoutLoadResponse>;
  saveLayout(request: LayoutSaveRequest): Promise<void>;
  resetLayout(request: LayoutResetRequest): Promise<void>;
  openFloatingPane(request: FloatingPaneOpenRequest): Promise<FloatingPaneOpenResult>;
  closeFloatingPane(request: FloatingPaneCloseRequest): Promise<void>;
  listFloatingPanes(projectPath: string): Promise<FloatingPaneDescriptor[]>;
}

export interface FloatingPaneOpenRequest {
  projectPath: string;
  paneId: LayoutPaneId;
  bounds?: FloatingPaneDescriptor["bounds"];
  displayId?: number;
}

export interface FloatingPaneCloseRequest {
  projectPath: string;
  paneId: LayoutPaneId;
}

export const DEFAULT_LAYOUT: LayoutTree = {
  direction: "row",
  first: "wizard",
  second: {
    direction: "row",
    first: {
      direction: "column",
      first: "draft-board",
      second: "history",
    },
    second: "critique",
  },
};
