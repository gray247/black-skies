import type { NarrativeProvenance } from "./narrativeObjectContract";

export const NARRATIVE_QUALITATIVE_SIGNAL_CONTRACT_VERSION =
  "narrative-qualitative-signal-contract-v0" as const;

export type NarrativeQualitativeSignalCategory =
  | "contradiction"
  | "unresolved_gap"
  | "relationship_provenance"
  | "foreshadow_payoff"
  | "orphaned_assertion"
  | "sequence_reorder"
  | "scene_projection"
  | "authored_inferred_boundary";

export const NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES = [
  "contradiction",
  "unresolved_gap",
  "relationship_provenance",
  "foreshadow_payoff",
  "orphaned_assertion",
  "sequence_reorder",
  "scene_projection",
  "authored_inferred_boundary",
] as const satisfies readonly NarrativeQualitativeSignalCategory[];

export type NarrativeQualitativeSignalConfidence = "low" | "medium" | "high";

export type NarrativeQualitativeSignalClaimMode = "observation" | "interpretation" | "assertion";

export interface NarrativeQualitativeSignal {
  readonly id: string;
  readonly category: NarrativeQualitativeSignalCategory;
  readonly label: string;
  readonly explanation: string;
  readonly relatedObjectIds: readonly string[];
  readonly provenance: NarrativeProvenance;
  readonly confidence: NarrativeQualitativeSignalConfidence;
  readonly claimMode?: NarrativeQualitativeSignalClaimMode;
}
