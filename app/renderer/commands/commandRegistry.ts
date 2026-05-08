export type CommandCategory =
  | "project"
  | "navigation"
  | "generation"
  | "critique"
  | "snapshot"
  | "export";

export type CommandPreferredZone = "command_center" | "writing_studio" | "global";
export type CommandModelRoute = "none" | "local" | "api";

export interface CommandRegistryEntry {
  readonly id: string;
  readonly label: string;
  readonly category: CommandCategory;
  readonly requiredContext: readonly string[];
  readonly mutatesData: boolean;
  readonly requiresConfirmation: boolean;
  readonly preferredZone: CommandPreferredZone;
  readonly modelRoute: CommandModelRoute;
}

export const COMMAND_REGISTRY: readonly CommandRegistryEntry[] = Object.freeze([
  {
    id: "project.open",
    label: "Open Project",
    category: "project",
    requiredContext: [],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "global",
    modelRoute: "none",
  },
  {
    id: "scene.select",
    label: "Select Scene",
    category: "navigation",
    requiredContext: ["project"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "command_center",
    modelRoute: "none",
  },
  {
    id: "draft.generateActiveScene",
    label: "Generate Active Scene",
    category: "generation",
    requiredContext: ["project", "active_scene"],
    mutatesData: true,
    requiresConfirmation: true,
    preferredZone: "writing_studio",
    modelRoute: "api",
  },
  {
    id: "draft.generateAllScenes",
    label: "Generate All Scenes",
    category: "generation",
    requiredContext: ["project", "outline"],
    mutatesData: true,
    requiresConfirmation: true,
    preferredZone: "writing_studio",
    modelRoute: "api",
  },
  {
    id: "critique.run",
    label: "Run Critique",
    category: "critique",
    requiredContext: ["project", "active_scene"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "writing_studio",
    modelRoute: "api",
  },
  {
    id: "rewrite.run",
    label: "Rewrite Draft",
    category: "critique",
    requiredContext: ["project", "active_scene", "draft"],
    mutatesData: true,
    requiresConfirmation: true,
    preferredZone: "writing_studio",
    modelRoute: "api",
  },
  {
    id: "snapshot.create",
    label: "Create Snapshot",
    category: "snapshot",
    requiredContext: ["project"],
    mutatesData: true,
    requiresConfirmation: false,
    preferredZone: "global",
    modelRoute: "none",
  },
  {
    id: "project.export",
    label: "Export Project",
    category: "export",
    requiredContext: ["project"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "global",
    modelRoute: "none",
  },
]);

export function listCommandRegistryEntries(): readonly CommandRegistryEntry[] {
  return COMMAND_REGISTRY;
}
