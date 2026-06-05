export const NARRATIVE_OBJECT_CONTRACT_VERSION = "narrative-object-contract-v0" as const;

export type NarrativeObjectKind =
  | "narrative_assertion"
  | "story_unit"
  | "narrative_gap"
  | "narrative_relationship"
  | "scene"
  | "chapter";

export type NarrativeProvenanceOrigin =
  | "author"
  | "companion"
  | "system"
  | "import"
  | "derived";

export type NarrativeAuthorshipStatus = "authored" | "inferred" | "generated" | "derived";

export type NarrativeConfidence = "low" | "medium" | "high" | "certain";

export type NarrativeLifecycleState =
  | "draft"
  | "candidate"
  | "active"
  | "promoted"
  | "merged"
  | "split"
  | "archived"
  | "deleted"
  | "recovered"
  | "superseded";

export type NarrativeRelationshipCategory =
  | "structural"
  | "narrative"
  | "editorial"
  | "inferred";

export type NarrativeRelationshipType =
  | "supports"
  | "continues"
  | "causes"
  | "contradicts"
  | "foreshadows"
  | "pays_off"
  | "belongs_to"
  | "related_to"
  | "blocks"
  | "resolves"
  | "merged_from"
  | "split_into"
  | "promoted_to"
  | "demoted_to";

export interface NarrativeProvenance {
  readonly origin: NarrativeProvenanceOrigin;
  readonly status: NarrativeAuthorshipStatus;
  readonly confidence: NarrativeConfidence;
  readonly authorConfirmed: boolean;
  readonly source?: string | null;
  readonly note?: string | null;
}

export interface NarrativeLifecycle {
  readonly state: NarrativeLifecycleState;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly archivedAt?: string | null;
}

export interface NarrativeLineage {
  readonly originId: string;
  readonly parentIds: readonly string[];
  readonly mergedFromIds: readonly string[];
  readonly splitFromId: string | null;
  readonly promotedFromId: string | null;
  readonly supersededById: string | null;
  readonly childIds: readonly string[];
  readonly branchId: string | null;
}

export interface NarrativeObjectBase {
  readonly id: string;
  readonly kind: NarrativeObjectKind;
  readonly provenance: NarrativeProvenance;
  readonly lifecycle: NarrativeLifecycle;
  readonly lineage: NarrativeLineage;
}

export interface NarrativeAssertion extends NarrativeObjectBase {
  readonly kind: "narrative_assertion";
  readonly text: string;
  readonly normalizedText: string | null;
  readonly sceneId: string | null;
  readonly tags: readonly string[];
}

export interface StoryUnit extends NarrativeObjectBase {
  readonly kind: "story_unit";
  readonly title: string;
  readonly assertionIds: readonly string[];
  readonly anchorAssertionIds: readonly string[];
  readonly order: number;
  readonly sceneCandidateId: string | null;
  readonly sceneId: string | null;
}

export interface NarrativeGap extends NarrativeObjectBase {
  readonly kind: "narrative_gap";
  readonly description: string;
  readonly startAnchorIds: readonly string[];
  readonly endAnchorIds: readonly string[];
  readonly relatedRelationshipIds: readonly string[];
}

export interface NarrativeRelationship extends NarrativeObjectBase {
  readonly kind: "narrative_relationship";
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationshipType: NarrativeRelationshipType;
  readonly category: NarrativeRelationshipCategory;
  readonly description: string | null;
}

export interface NarrativeScene extends NarrativeObjectBase {
  readonly kind: "scene";
  readonly title: string;
  readonly order: number;
  readonly chapterId: string | null;
  readonly assertionIds: readonly string[];
  readonly storyUnitIds: readonly string[];
  readonly draftText: string | null;
}

export interface NarrativeChapter extends NarrativeObjectBase {
  readonly kind: "chapter";
  readonly title: string;
  readonly order: number;
  readonly sceneIds: readonly string[];
}

export interface NarrativeObjectBundle {
  readonly assertions: readonly NarrativeAssertion[];
  readonly storyUnits: readonly StoryUnit[];
  readonly gaps: readonly NarrativeGap[];
  readonly relationships: readonly NarrativeRelationship[];
  readonly scenes: readonly NarrativeScene[];
  readonly chapters: readonly NarrativeChapter[];
}

