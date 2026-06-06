export interface SalvageShellSceneItem {
  readonly id: string;
  readonly label: string;
  readonly statusText: string;
}

export interface SalvageShellStaticModel {
  readonly projectTitle: string;
  readonly projectStatusText: string;
  readonly selectedSceneId: string;
  readonly currentSceneLabel: string;
  readonly prosePlaceholder: string;
  readonly sceneList: readonly SalvageShellSceneItem[];
}

export const MINIMAL_SALVAGE_SHELL_MODEL: SalvageShellStaticModel = {
  projectTitle: "Signal House Draft",
  projectStatusText: "Static scaffold only. Runtime project data is not connected.",
  selectedSceneId: "scene_002",
  currentSceneLabel: "Scene 02 - Hallway Argument",
  prosePlaceholder: "The selected scene opens mid-conflict. Draft prose begins here.",
  sceneList: [
    {
      id: "scene_001",
      label: "Scene 01 - Arrival at Signal House",
      statusText: "Available",
    },
    {
      id: "scene_002",
      label: "Scene 02 - Hallway Argument",
      statusText: "Selected",
    },
    {
      id: "scene_003",
      label: "Scene 03 - Basement Lantern",
      statusText: "Queued",
    },
  ],
};
