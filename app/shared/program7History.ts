import type { IdeationExplorationBranchV1, IdeationIdeaSeedV1 } from './ipc/ideation.js';
import type { Program7PromotionOutcomeV1 } from './ipc/program7Promotion.js';
import type { RevisionCandidateV1 } from './ipc/revisionCandidates.js';
import type { RevisionItem } from './ipc/feedbackNotes.js';

export const PROGRAM7_HISTORY_DEFAULT_LIMIT = 100;

export type Program7HistoryOwnerKind = 'feedback-note' | 'revision-candidate' | 'idea-seed' | 'idea-branch' | 'promotion';
export type Program7HistoryBucket = 'active' | 'history';
export type Program7HistorySourceStatus = 'current' | 'stale' | 'unavailable';
export type Program7HistoryAcceptanceStatus = 'none' | 'partial' | 'complete' | 'deferred' | 'failed';

export interface Program7HistoryItemV1 {
  readonly reference: string;
  readonly ownerKind: Program7HistoryOwnerKind;
  readonly ownerId: string;
  readonly bucket: Program7HistoryBucket;
  readonly lifecycle: string;
  readonly title: string;
  readonly summary: string;
  readonly occurredAt: string;
  readonly updatedAt: string;
  readonly sourceStatus: Program7HistorySourceStatus;
  readonly sourceReference: string | null;
  readonly recurrenceReference: string | null;
  readonly protection: {
    readonly protected: boolean;
    readonly class: string;
  };
  readonly provenance: {
    readonly origin: string;
    readonly sourceReference: string | null;
  };
  readonly acceptance: Program7HistoryAcceptanceStatus;
}

export interface Program7HistorySourceInputV1 {
  readonly feedbackItems?: readonly RevisionItem[];
  readonly revisionCandidates?: readonly RevisionCandidateV1[];
  readonly ideaSeeds?: readonly IdeationIdeaSeedV1[];
  readonly ideaBranches?: readonly IdeationExplorationBranchV1[];
  readonly promotionOutcomes?: readonly Program7PromotionOutcomeV1[];
}

export interface Program7HistoryProjectionV1 {
  readonly items: readonly Program7HistoryItemV1[];
  readonly activeItems: readonly Program7HistoryItemV1[];
  readonly historyItems: readonly Program7HistoryItemV1[];
  readonly totalSourceItems: number;
  readonly trimmedCount: number;
  readonly limit: number;
}

function bucketForLifecycle(lifecycle: string, historical: readonly string[]): Program7HistoryBucket {
  return historical.includes(lifecycle) ? 'history' : 'active';
}

function sourceStatusFromFeedback(item: RevisionItem): Program7HistorySourceStatus {
  if (item.lifecycle === 'stale') return 'stale';
  return item.sourceBodyFingerprint || item.anchor || item.sourceId ? 'current' : 'unavailable';
}

function sourceStatusFromReference(sourceReference: string | null): Program7HistorySourceStatus {
  return sourceReference ? 'current' : 'unavailable';
}

function makeItem(item: Omit<Program7HistoryItemV1, 'reference'>): Program7HistoryItemV1 {
  return { ...item, reference: `${item.ownerKind}:${item.ownerId}` };
}

function feedbackHistory(item: RevisionItem): Program7HistoryItemV1 {
  const sourceReference = item.sourceId ?? item.sourceFindingId ?? null;
  return makeItem({
    ownerKind: 'feedback-note',
    ownerId: item.id,
    bucket: bucketForLifecycle(item.lifecycle, ['parked', 'dismissed', 'resolved', 'abandoned']),
    lifecycle: item.lifecycle,
    title: item.lens ?? 'Revision item',
    summary: item.body,
    occurredAt: item.createdAt,
    updatedAt: item.revision ? String(item.revision) : item.createdAt,
    sourceStatus: sourceStatusFromFeedback(item),
    sourceReference,
    recurrenceReference: item.relatedRecurrenceId ?? item.relatedRevisionItemId ?? item.relatedItemId ?? item.recurrenceOf ?? null,
    protection: { protected: item.protection?.protected === true, class: item.protection?.protected ? 'protected' : 'ordinary' },
    provenance: { origin: item.provenance?.origin ?? 'author', sourceReference: item.provenance?.findingId ?? item.provenance?.source ?? null },
    acceptance: 'none',
  });
}

function candidateHistory(item: RevisionCandidateV1): Program7HistoryItemV1 {
  const sourceStatus: Program7HistorySourceStatus = item.currentness;
  const acceptance: Program7HistoryAcceptanceStatus = item.lifecycle === 'partially accepted'
    ? 'partial'
    : item.lifecycle === 'accepted'
      ? 'complete'
      : 'none';
  return makeItem({
    ownerKind: 'revision-candidate',
    ownerId: item.id,
    bucket: bucketForLifecycle(item.lifecycle, ['accepted', 'partially accepted', 'rejected', 'parked', 'abandoned']),
    lifecycle: item.lifecycle,
    title: item.purpose || 'Revision candidate',
    summary: item.editedCandidateText ?? item.candidateText,
    occurredAt: item.createdAt,
    updatedAt: item.updatedAt,
    sourceStatus,
    sourceReference: item.sourceAnchor?.unitId ?? item.unitId,
    recurrenceReference: null,
    protection: { protected: item.protection.class !== 'ordinary' || item.protection.excluded, class: item.protection.class },
    provenance: { origin: item.origin, sourceReference: item.provenance.receipt?.promptSha256 ?? item.provenance.source },
    acceptance,
  });
}

function seedHistory(item: IdeationIdeaSeedV1): Program7HistoryItemV1 {
  const version = item.versions.find((candidate) => candidate.id === item.currentVersionId) ?? null;
  const sourceReference = version?.provenance.sourceReference ?? null;
  return makeItem({
    ownerKind: 'idea-seed',
    ownerId: item.id,
    bucket: item.lifecycle === 'archived' ? 'history' : 'active',
    lifecycle: item.lifecycle,
    title: item.protected ? 'Protected idea seed' : version?.title ?? 'Untitled idea seed',
    summary: item.protected ? 'Content hidden by protection policy.' : version?.body ?? 'No current seed version.',
    occurredAt: version?.createdAt ?? '',
    updatedAt: version?.createdAt ?? '',
    sourceStatus: sourceStatusFromReference(sourceReference),
    sourceReference,
    recurrenceReference: item.branchIds[0] ? `idea-branch:${item.branchIds[0]}` : null,
    protection: { protected: item.protected, class: item.protected ? 'protected' : 'ordinary' },
    provenance: { origin: version?.provenance.kind ?? 'author', sourceReference },
    acceptance: 'none',
  });
}

function branchHistory(item: IdeationExplorationBranchV1): Program7HistoryItemV1 {
  const version = item.currentPremiseVersionId ? item.premiseVersions.find((candidate) => candidate.id === item.currentPremiseVersionId) ?? null : null;
  const historical = ['merged', 'promoted', 'rejected', 'archived'];
  return makeItem({
    ownerKind: 'idea-branch',
    ownerId: item.id,
    bucket: bucketForLifecycle(item.posture, historical),
    lifecycle: item.posture,
    title: item.name,
    summary: version?.text ?? 'No premise saved yet.',
    occurredAt: version?.createdAt ?? '',
    updatedAt: version?.createdAt ?? '',
    sourceStatus: sourceStatusFromReference(version?.provenance.sourceReference ?? null),
    sourceReference: version?.provenance.sourceReference ?? null,
    recurrenceReference: item.parentBranchId ? `idea-branch:${item.parentBranchId}` : null,
    protection: { protected: false, class: 'ordinary' },
    provenance: { origin: version?.provenance.kind ?? 'author', sourceReference: version?.provenance.sourceReference ?? null },
    acceptance: item.posture === 'promoted' ? 'complete' : 'none',
  });
}

function promotionHistory(item: Program7PromotionOutcomeV1): Program7HistoryItemV1 {
  const sourceReference = item.source.sourceId;
  return makeItem({
    ownerKind: 'promotion',
    ownerId: item.itemId,
    bucket: 'history',
    lifecycle: item.status,
    title: `${item.destination} promotion`,
    summary: item.message,
    occurredAt: '',
    updatedAt: '',
    sourceStatus: item.source.protection.excluded ? 'unavailable' : 'current',
    sourceReference,
    recurrenceReference: null,
    protection: { protected: item.source.protection.class !== 'ordinary' || item.source.protection.excluded, class: item.source.protection.class },
    provenance: { origin: item.source.provenance.origin, sourceReference: item.source.provenance.sourceReference },
    acceptance: item.status === 'routed' ? 'complete' : item.status === 'deferred' ? 'deferred' : 'failed',
  });
}

function compareHistory(a: Program7HistoryItemV1, b: Program7HistoryItemV1): number {
  const timeA = Date.parse(a.updatedAt) || Date.parse(a.occurredAt) || 0;
  const timeB = Date.parse(b.updatedAt) || Date.parse(b.occurredAt) || 0;
  return timeB - timeA || a.reference.localeCompare(b.reference);
}

export function buildProgram7HistoryProjection(
  input: Program7HistorySourceInputV1,
  requestedLimit = PROGRAM7_HISTORY_DEFAULT_LIMIT,
): Program7HistoryProjectionV1 {
  const limit = Math.max(1, Math.floor(requestedLimit));
  const allItems = [
    ...(input.feedbackItems ?? []).map(feedbackHistory),
    ...(input.revisionCandidates ?? []).map(candidateHistory),
    ...(input.ideaSeeds ?? []).map(seedHistory),
    ...(input.ideaBranches ?? []).map(branchHistory),
    ...(input.promotionOutcomes ?? []).map(promotionHistory),
  ].sort(compareHistory);
  const items = allItems.slice(0, limit);
  return {
    items,
    activeItems: items.filter((item) => item.bucket === 'active'),
    historyItems: items.filter((item) => item.bucket === 'history'),
    totalSourceItems: allItems.length,
    trimmedCount: Math.max(0, allItems.length - items.length),
    limit,
  };
}
