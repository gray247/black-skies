export type CommandCategory =
  | "project"
  | "navigation"
  | "generation"
  | "critique"
  | "snapshot"
  | "export";

export type CommandPreferredZone = "command_center" | "writing_studio" | "global";
export type CommandModelRoute = "none" | "local" | "api";
export type CommandRiskLevel = "none" | "low" | "medium" | "high";
export type CommandResultType =
  | "project_handle"
  | "selection"
  | "draft_text"
  | "critique_report"
  | "rewrite_candidate"
  | "snapshot_record"
  | "export_artifact"
  | "verification_report"
  | "view_state";

export interface CommandRegistryEntry {
  readonly id: string;
  readonly label: string;
  readonly category: CommandCategory;
  readonly requiredContext: readonly string[];
  readonly allowedZones: readonly CommandPreferredZone[];
  readonly mutatesData: boolean;
  readonly requiresConfirmation: boolean;
  readonly preferredZone: CommandPreferredZone;
  readonly modelRoute: CommandModelRoute;
  readonly riskLevel: CommandRiskLevel;
  readonly resultType: CommandResultType;
}

export const COMMAND_REGISTRY: readonly CommandRegistryEntry[] = Object.freeze([
  {
    id: "project.open",
    label: "Open Project",
    category: "project",
    requiredContext: [],
    allowedZones: ["global", "writing_studio"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "global",
    modelRoute: "none",
    riskLevel: "low",
    resultType: "project_handle",
  },
  {
    id: "scene.select",
    label: "Select Scene",
    category: "navigation",
    requiredContext: ["project"],
    allowedZones: ["command_center", "writing_studio"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "command_center",
    modelRoute: "none",
    riskLevel: "none",
    resultType: "selection",
  },
  {
    id: "draft.generateActiveScene",
    label: "Generate Active Scene",
    category: "generation",
    requiredContext: ["project", "active_scene"],
    allowedZones: ["writing_studio", "global"],
    mutatesData: true,
    requiresConfirmation: true,
    preferredZone: "writing_studio",
    modelRoute: "api",
    riskLevel: "medium",
    resultType: "draft_text",
  },
  {
    id: "draft.generateAllScenes",
    label: "Generate All Scenes",
    category: "generation",
    requiredContext: ["project", "outline"],
    allowedZones: ["writing_studio", "global"],
    mutatesData: true,
    requiresConfirmation: true,
    preferredZone: "writing_studio",
    modelRoute: "api",
    riskLevel: "high",
    resultType: "draft_text",
  },
  {
    id: "critique.run",
    label: "Run Critique",
    category: "critique",
    requiredContext: ["project", "active_scene"],
    allowedZones: ["writing_studio", "global"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "writing_studio",
    modelRoute: "api",
    riskLevel: "low",
    resultType: "critique_report",
  },
  {
    id: "rewrite.run",
    label: "Rewrite Draft",
    category: "critique",
    requiredContext: ["project", "active_scene", "draft"],
    allowedZones: ["writing_studio"],
    mutatesData: true,
    requiresConfirmation: true,
    preferredZone: "writing_studio",
    modelRoute: "api",
    riskLevel: "high",
    resultType: "rewrite_candidate",
  },
  {
    id: "snapshot.create",
    label: "Create Snapshot",
    category: "snapshot",
    requiredContext: ["project"],
    allowedZones: ["global", "writing_studio"],
    mutatesData: true,
    requiresConfirmation: false,
    preferredZone: "global",
    modelRoute: "none",
    riskLevel: "low",
    resultType: "snapshot_record",
  },
  {
    id: "snapshot.verify",
    label: "Verify Snapshots",
    category: "snapshot",
    requiredContext: ["project"],
    allowedZones: ["global", "writing_studio"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "global",
    modelRoute: "none",
    riskLevel: "low",
    resultType: "verification_report",
  },
  {
    id: "project.export",
    label: "Export Project",
    category: "export",
    requiredContext: ["project"],
    allowedZones: ["global", "writing_studio"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "global",
    modelRoute: "none",
    riskLevel: "low",
    resultType: "export_artifact",
  },
  {
    id: "snapshots.openPanel",
    label: "Manage Snapshots",
    category: "snapshot",
    requiredContext: ["project"],
    allowedZones: ["global", "writing_studio"],
    mutatesData: false,
    requiresConfirmation: false,
    preferredZone: "global",
    modelRoute: "none",
    riskLevel: "none",
    resultType: "view_state",
  },
]);

export function listCommandRegistryEntries(): readonly CommandRegistryEntry[] {
  return COMMAND_REGISTRY;
}
