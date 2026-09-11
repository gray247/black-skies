import type {
  LivingOutlineItemKind,
  LivingOutlineItemState,
  LivingOutlineSourceAnchorV1,
} from './livingOutline.js';
import type { StoryFoundationPosture } from './storyFoundation.js';
import type {
  NarrativeInsertionCalculationRequestV1,
  NarrativeInsertionCalculationV1,
} from '../narrativeInsertion.js';

export const PROGRAM7_PROMOTION_CHANNELS = {
  handoff: 'program7:promotion-handoff',
} as const;

export const PROGRAM7_PROMOTION_SCHEMA_VERSION = 'BlackSkiesProgram7Promotion v1' as const;
export const PROGRAM7_PROMOTION_MAX_ITEMS = 8;
export const PROGRAM7_PROMOTION_MAX_TEXT_LENGTH = 12_000;

export type Program7PromotionDestinationV1 =
  | 'author-intent'
  | 'outline'
  | 'narrative-insertion'
  | 'character'
  | 'lore';

export type Program7PromotionSourceKindV1 =
  | 'ideation-seed'
  | 'ideation-branch'
  | 'revision-candidate'
  | 'feedback-note'
  | 'manual';

export type Program7PromotionProtectionClassV1 =
  | 'ordinary'
  | 'protected'
  | 'metadata-only'
  | 'ai-excluded';

export interface Program7PromotionProtectionV1 {
  readonly excluded: boolean;
  readonly class: Program7PromotionProtectionClassV1;
}

export interface Program7PromotionProvenanceV1 {
  readonly origin: 'author' | 'manual' | 'local-ai' | 'mixed';
  readonly sourceReference: string | null;
  readonly authorRequested: boolean;
}

export interface Program7PromotionSourceV1 {
  readonly kind: Program7PromotionSourceKindV1;
  readonly sourceId: string;
  readonly sourceRevision: number;
  readonly sourceFingerprint: string;
  readonly selectedTextSha256: string;
  readonly provenance: Program7PromotionProvenanceV1;
  readonly protection: Program7PromotionProtectionV1;
}

export interface Program7PromotionOwnerAcceptanceV1 {
  readonly accepted: true;
  readonly actor: 'author';
  readonly acceptanceId: string;
}

export interface Program7AuthorIntentPromotionPayloadV1 {
  readonly destination: 'author-intent';
  readonly questionId: string;
  readonly posture: StoryFoundationPosture;
  readonly text: string;
}

export interface Program7OutlinePromotionPayloadV1 {
  readonly destination: 'outline';
  readonly label: string;
  readonly body: string;
  readonly kind: LivingOutlineItemKind;
  readonly state: LivingOutlineItemState;
  readonly manuscriptUnitId: string | null;
  readonly sourceAnchor: LivingOutlineSourceAnchorV1 | null;
}

export interface Program7NarrativeInsertionPromotionPayloadV1 {
  readonly destination: 'narrative-insertion';
  readonly calculation: NarrativeInsertionCalculationRequestV1;
}

export interface Program7DeferredPromotionPayloadV1 {
  readonly destination: 'character' | 'lore';
  readonly label: string;
  readonly summary: string;
  readonly selectedText?: string;
}

export type Program7PromotionPayloadV1 =
  | Program7AuthorIntentPromotionPayloadV1
  | Program7OutlinePromotionPayloadV1
  | Program7NarrativeInsertionPromotionPayloadV1
  | Program7DeferredPromotionPayloadV1;

export interface Program7PromotionItemV1 {
  readonly itemId: string;
  readonly destination: Program7PromotionDestinationV1;
  readonly source: Program7PromotionSourceV1;
  readonly payload: Program7PromotionPayloadV1;
  readonly ownerAcceptance: Program7PromotionOwnerAcceptanceV1;
}

export interface Program7PromotionHandoffRequestV1 {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
  readonly items: readonly Program7PromotionItemV1[];
}

export interface Program7DeferredPromotionPackageV1 {
  readonly schemaVersion: typeof PROGRAM7_PROMOTION_SCHEMA_VERSION;
  readonly itemId: string;
  readonly destination: 'character' | 'lore';
  readonly source: Program7PromotionSourceV1;
  readonly label: string;
  readonly summary: string;
  readonly selectedText: string | null;
  readonly contentAvailable: boolean;
  readonly status: 'deferred';
  readonly reason: 'destination-owner-required';
}

export interface Program7PromotionOutcomeV1 {
  readonly itemId: string;
  readonly destination: Program7PromotionDestinationV1;
  readonly status: 'routed' | 'deferred' | 'failed';
  readonly source: Program7PromotionSourceV1;
  readonly artifactId: string | null;
  readonly message: string;
  readonly narrativeCalculation?: NarrativeInsertionCalculationV1;
  readonly deferredPackage?: Program7DeferredPromotionPackageV1;
}

export interface Program7PromotionHandoffResultV1 {
  readonly schemaVersion: typeof PROGRAM7_PROMOTION_SCHEMA_VERSION;
  readonly operationId: string;
  readonly projectId: string;
  readonly status: 'complete' | 'partial' | 'failed';
  readonly outcomes: readonly Program7PromotionOutcomeV1[];
  readonly message: string;
}

export interface Program7PromotionDestinationInputV1 {
  readonly request: Program7PromotionHandoffRequestV1;
  readonly item: Program7PromotionItemV1;
}

export interface Program7PromotionOwnerReceiptV1 {
  readonly artifactId: string;
  readonly message: string;
}

export type Program7PromotionOwnerResultV1 =
  | { readonly ok: true; readonly receipt: Program7PromotionOwnerReceiptV1 }
  | { readonly ok: false; readonly message: string };

export interface Program7PromotionBridge {
  handoff(request: Program7PromotionHandoffRequestV1): Promise<Program7PromotionHandoffResultV1>;
}
