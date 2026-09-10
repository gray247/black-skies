import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  IDEATION_FILENAME,
  IDEATION_FIXED_CORE_QUESTIONS,
  IDEATION_MAX_HISTORY,
  IDEATION_MAX_AI_ALTERNATIVE_HISTORY,
  IDEATION_MAX_OBJECT_HISTORY,
  IDEATION_MAX_PROMOTION_HISTORY,
  IDEATION_MAX_TEST_HISTORY,
  IDEATION_MAX_TEXT_LENGTH,
  IDEATION_SCHEMA_VERSION,
  type IdeationAiAlternativeV1,
  type IdeationBranchPosture,
  type IdeationContributionClass,
  type IdeationDocumentV1,
  type IdeationExplorationBranchV1,
  type IdeationExplorationFindingV1,
  type IdeationHistoryEventV1,
  type IdeationIdeaSeedV1,
  type IdeationImportance,
  type IdeationLifecycle,
  type IdeationPremiseQuestionV1,
  type IdeationPremiseTestV1,
  type IdeationPremiseVersionV1,
  type IdeationProvenanceKind,
  type IdeationProvenanceV1,
  type IdeationPromotionDestination,
  type IdeationPromotionPackageV1,
  type IdeationSeedKind,
  type IdeationSeedVersionV1,
  type IdeationSnapshotV1,
  type IdeationSourceContributionV1,
  type IdeationUnresolvedAreaV1,
} from '../shared/ipc/ideation.js';
import {
  PROGRAM7_LOCAL_INFERENCE_BOUNDS,
  PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
  type Program7LocalInferenceReceiptV1,
  type Program7LocalInferenceRequestV1,
  type Program7LocalInferenceResponseV1,
} from '../shared/localInference.js';
import { program7LocalInferenceSchemaHash, validateProgram7LocalInferenceRequest, validateProgram7LocalInferenceResponse } from './program7LocalInferenceService.js';
import { program7LocalInferencePromptHash } from './ollamaLocalInferenceTransport.js';

export const IDEATION_FILENAME_EXPORT = IDEATION_FILENAME;
const writeQueues = new Map<string, Promise<void>>();
const seedKinds = new Set<IdeationSeedKind>(['fragment', 'title', 'image', 'character', 'creature', 'location', 'ending', 'line', 'question', 'mood', 'partial-premise']);
const branchPostures = new Set<IdeationBranchPosture>(['draft', 'active', 'preferred', 'paused', 'stale', 'merged', 'promoted', 'rejected', 'archived']);
const contributionClasses = new Set<IdeationContributionClass>(['central', 'supporting', 'transformed', 'background', 'thematic', 'reserved', 'rejected', 'unresolved']);
const importanceValues = new Set<IdeationImportance>(['anchor', 'essential', 'supporting', 'desirable', 'optional', 'experimental']);
const destinationValues = new Set<IdeationPromotionDestination>(['author-intent', 'outline', 'story-unit', 'narrative-insertion', 'character', 'lore', 'memory']);

export class IdeationRepositoryError extends Error {
  constructor(readonly code: 'UNAVAILABLE' | 'WRITE_FAILED' | 'STALE' | 'UNKNOWN_SEED' | 'UNKNOWN_BRANCH' | 'ARCHIVED_BRANCH' | 'INVALID_LINEAGE' | 'INVALID' | 'AI_NOT_REQUESTED' | 'AI_UNAVAILABLE', message: string) {
    super(message);
    this.name = 'IdeationRepositoryError';
  }
}
export interface IdeationLocalInferenceRequest extends Program7LocalInferenceRequestV1 {}
export type IdeationLocalInferenceProvider = (request: IdeationLocalInferenceRequest) => Promise<unknown>;
/** @deprecated retained as a source-compatible name; providers must return a Program 7 response. */
export type IdeationAiAlternativeProvider = IdeationLocalInferenceProvider;

function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> { return record(value) && Object.keys(value).sort().join('|') === [...keys].sort().join('|'); }
function nonEmpty(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
function text(value: unknown): value is string { return typeof value === 'string' && value.length <= IDEATION_MAX_TEXT_LENGTH; }
function timestamp(value: unknown): value is string { return nonEmpty(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)); }
function id(value: unknown): value is string { return nonEmpty(value) && value.length <= 240 && /^[A-Za-z0-9_-]+$/.test(value); }
function unique(values: readonly string[]): boolean { return new Set(values).size === values.length; }
function provenance(value: unknown): value is IdeationProvenanceV1 {
  if (!exact(value, ['kind', 'actor', 'capturedAt', 'sourceReference', 'authorRequested'])) return false;
  const c = value as Partial<IdeationProvenanceV1>;
  return (c.kind === 'author' || c.kind === 'ai-advisory' || c.kind === 'mixed') && (c.actor === 'author' || c.actor === 'local-ai') && timestamp(c.capturedAt) && (c.sourceReference === null || (typeof c.sourceReference === 'string' && c.sourceReference.length <= 2_000)) && typeof c.authorRequested === 'boolean';
}
function unresolved(value: unknown): value is IdeationUnresolvedAreaV1 {
  if (!exact(value, ['id', 'statement', 'posture', 'revisitCondition'])) return false;
  const c = value as Partial<IdeationUnresolvedAreaV1>;
  return id(c.id) && text(c.statement) && nonEmpty(c.statement) && (c.posture === 'unknown' || c.posture === 'intentional-ambiguity' || c.posture === 'conflict' || c.posture === 'exploratory') && (c.revisitCondition === null || (typeof c.revisitCondition === 'string' && text(c.revisitCondition)));
}
function historyEvent(value: unknown): value is IdeationHistoryEventV1 {
  if (!exact(value, ['id', 'action', 'objectId', 'occurredAt', 'pinned', 'lineageRelevant', 'detail'])) return false;
  const c = value as Partial<IdeationHistoryEventV1>;
  return id(c.id) && id(c.objectId) && nonEmpty(c.action) && c.action.length <= 120 && timestamp(c.occurredAt) && typeof c.pinned === 'boolean' && typeof c.lineageRelevant === 'boolean' && (c.detail === null || (typeof c.detail === 'string' && text(c.detail)));
}
function validHistory(value: unknown, objectId: string | null = null, max = IDEATION_MAX_OBJECT_HISTORY): value is readonly IdeationHistoryEventV1[] {
  return Array.isArray(value) && value.length <= max && value.every((item) => historyEvent(item) && (objectId === null || item.objectId === objectId)) && unique(value.map((item) => item.id));
}
function seedVersion(value: unknown): value is IdeationSeedVersionV1 {
  if (!exact(value, ['id', 'title', 'body', 'kind', 'provenance', 'createdAt', 'supersededAt'])) return false;
  const c = value as Partial<IdeationSeedVersionV1>;
  return id(c.id) && text(c.title) && nonEmpty(c.title) && text(c.body) && seedKinds.has(c.kind as IdeationSeedKind) && provenance(c.provenance) && timestamp(c.createdAt) && (c.supersededAt === null || timestamp(c.supersededAt));
}
function validSeed(value: unknown, projectId: string): value is IdeationIdeaSeedV1 {
  if (!exact(value, ['id', 'lifecycle', 'currentVersionId', 'versions', 'tags', 'projectReferences', 'branchIds', 'protected', 'pinned', 'history'])) return false;
  const c = value as Partial<IdeationIdeaSeedV1>; const versions = c.versions ?? [];
  return id(c.id) && (c.lifecycle === 'active' || c.lifecycle === 'archived') && id(c.currentVersionId) && Array.isArray(versions) && versions.length > 0 && versions.every(seedVersion) && unique(versions.map((v) => v.id)) && versions[versions.length - 1]?.id === c.currentVersionId && versions.every((v, index) => index === versions.length - 1 ? v.supersededAt === null : v.supersededAt !== null) && Array.isArray(c.tags) && c.tags.length <= 64 && c.tags.every((tag) => nonEmpty(tag) && text(tag)) && unique(c.tags) && Array.isArray(c.projectReferences) && c.projectReferences.length > 0 && c.projectReferences.every((ref) => ref === projectId) && Array.isArray(c.branchIds) && c.branchIds.every(id) && unique(c.branchIds) && typeof c.protected === 'boolean' && typeof c.pinned === 'boolean' && validHistory(c.history, c.id);
}
function contribution(value: unknown): value is IdeationSourceContributionV1 {
  if (!exact(value, ['seedId', 'importance', 'classification', 'sourceVersionId', 'note'])) return false;
  const c = value as Partial<IdeationSourceContributionV1>;
  return id(c.seedId) && importanceValues.has(c.importance as IdeationImportance) && contributionClasses.has(c.classification as IdeationContributionClass) && (c.sourceVersionId === null || id(c.sourceVersionId)) && (c.note === null || text(c.note));
}
function premiseVersion(value: unknown): value is IdeationPremiseVersionV1 {
  if (!exact(value, ['id', 'text', 'unresolvedAreas', 'provenance', 'createdAt', 'supersededAt'])) return false;
  const c = value as Partial<IdeationPremiseVersionV1>;
  return id(c.id) && text(c.text) && nonEmpty(c.text) && Array.isArray(c.unresolvedAreas) && c.unresolvedAreas.length <= 64 && c.unresolvedAreas.every(unresolved) && unique(c.unresolvedAreas.map((area) => area.id)) && provenance(c.provenance) && timestamp(c.createdAt) && (c.supersededAt === null || timestamp(c.supersededAt));
}
function validBranch(value: unknown, projectId: string): value is IdeationExplorationBranchV1 {
  if (!exact(value, ['id', 'name', 'posture', 'seedIds', 'sourceContributions', 'premiseVersions', 'currentPremiseVersionId', 'parentBranchId', 'lineageBranchIds', 'unknowns', 'projectReferences', 'pinned', 'history'])) return false;
  const c = value as Partial<IdeationExplorationBranchV1>; const versions = c.premiseVersions; const seedIds = c.seedIds; const contributions = c.sourceContributions;
  if (!Array.isArray(seedIds) || !Array.isArray(contributions) || !Array.isArray(versions)) return false;
  return id(c.id) && nonEmpty(c.name) && c.name.length <= 500 && branchPostures.has(c.posture as IdeationBranchPosture) && seedIds.every(id) && unique(seedIds) && contributions.length === seedIds.length && contributions.every(contribution) && unique(contributions.map((item) => item.seedId)) && contributions.every((item) => seedIds.includes(item.seedId)) && versions.length > 0 && versions.every(premiseVersion) && unique(versions.map((v) => v.id)) && versions[versions.length - 1]?.id === c.currentPremiseVersionId && versions.every((v, index) => index === versions.length - 1 ? v.supersededAt === null : v.supersededAt !== null) && id(c.currentPremiseVersionId) && (c.parentBranchId === null || id(c.parentBranchId)) && Array.isArray(c.lineageBranchIds) && c.lineageBranchIds.every(id) && unique(c.lineageBranchIds) && !c.lineageBranchIds.includes(c.id) && Array.isArray(c.unknowns) && c.unknowns.length <= 64 && c.unknowns.every(unresolved) && unique(c.unknowns.map((area) => area.id)) && Array.isArray(c.projectReferences) && c.projectReferences.length > 0 && c.projectReferences.every((ref) => ref === projectId) && typeof c.pinned === 'boolean' && validHistory(c.history, c.id);
}
function premiseQuestion(value: unknown): value is IdeationPremiseQuestionV1 { if (!exact(value, ['id', 'prompt', 'required', 'adaptive'])) return false; const c = value as unknown as IdeationPremiseQuestionV1; return id(c.id) && nonEmpty(c.prompt) && text(c.prompt) && typeof c.required === 'boolean' && typeof c.adaptive === 'boolean'; }
function adaptiveQuestionsForBranch(branch: IdeationExplorationBranchV1, premiseVersion = branch.premiseVersions.find((version) => version.id === branch.currentPremiseVersionId), branchPosture = branch.posture): readonly IdeationPremiseQuestionV1[] {
  const result: IdeationPremiseQuestionV1[] = [];
  if (branch.seedIds.length > 1) result.push({ id: 'relationship', prompt: 'What relationship connects the contributing seeds?', required: false, adaptive: true });
  if (premiseVersion?.unresolvedAreas.some((area) => area.posture === 'intentional-ambiguity')) result.push({ id: 'ambiguity-purpose', prompt: 'What effect should the intentional ambiguity create?', required: false, adaptive: true });
  if (branchPosture === 'draft') result.push({ id: 'next-discovery', prompt: 'What would you like to discover next?', required: false, adaptive: true });
  return result;
}
function validPremiseTest(value: unknown, branches: readonly IdeationExplorationBranchV1[]): value is IdeationPremiseTestV1 {
  if (!exact(value, ['id', 'branchId', 'premiseVersionId', 'branchPosture', 'fixedCore', 'adaptive', 'answers', 'findings', 'createdAt', 'provenance'])) return false;
  const c = value as Partial<IdeationPremiseTestV1>; const branch = branches.find((item) => item.id === c.branchId); const current = branch?.premiseVersions.find((item) => item.id === c.premiseVersionId); if (!branch || !current || !id(c.id)) return false;
  const fixed = c.fixedCore; const adaptive = c.adaptive; const answers = c.answers; const findings = c.findings;
  if (!Array.isArray(fixed) || !Array.isArray(adaptive) || !record(answers) || !Array.isArray(findings)) return false;
  const questions = [...fixed, ...adaptive];
  return branchPostures.has(c.branchPosture as IdeationBranchPosture) && c.branchPosture !== 'archived' && fixed.length === IDEATION_FIXED_CORE_QUESTIONS.length && fixed.every(premiseQuestion) && JSON.stringify(fixed) === JSON.stringify(IDEATION_FIXED_CORE_QUESTIONS) && adaptive.length <= 8 && adaptive.every(premiseQuestion) && JSON.stringify(adaptive) === JSON.stringify(adaptiveQuestionsForBranch(branch, current, c.branchPosture as IdeationBranchPosture)) && unique(questions.map((question) => question.id)) && Object.keys(answers).every((key) => questions.some((question) => question.id === key) && text(answers[key])) && findings.length <= questions.length && findings.every((finding) => { const item = finding as unknown as Partial<IdeationExplorationFindingV1>; return exact(finding, ['id', 'premiseVersionId', 'dimension', 'summary', 'uncertainty', 'provenance', 'authorResponse']) && id(item.id) && item.premiseVersionId === current.id && questions.some((question) => question.id === item.dimension) && text(item.summary) && nonEmpty(item.summary) && ['low', 'medium', 'high', 'unknown'].includes(String(item.uncertainty)) && provenance(item.provenance) && (item.authorResponse === null || text(item.authorResponse)); }) && unique(findings.map((finding) => (finding as IdeationExplorationFindingV1).id)) && timestamp(c.createdAt) && provenance(c.provenance);
}
function sha256(value: string): string { return createHash('sha256').update(value, 'utf8').digest('hex'); }
function promotionSourceReference(projectId: string, branchId: string, premiseId: string, seedIds: readonly string[], contributions: readonly IdeationSourceContributionV1[], selectedTextSha256: string): string {
  const versions = contributions.map((item) => `${item.seedId}@${item.sourceVersionId ?? 'none'}`).join(',');
  return `ideation:${projectId}:${branchId}:premise=${premiseId}:seeds=${seedIds.join(',')}:versions=${versions}:selectedSha256=${selectedTextSha256}:protection=ordinary`;
}
function validPromotionPackage(value: unknown, projectId: string, branches: readonly IdeationExplorationBranchV1[], seeds: readonly IdeationIdeaSeedV1[]): value is IdeationPromotionPackageV1 {
  if (!exact(value, ['id', 'branchId', 'seedIds', 'destination', 'selectedText', 'selectedTextSha256', 'sourceContributions', 'preparedAt', 'provenance', 'status'])) return false;
  const pkg = value as Partial<IdeationPromotionPackageV1>; const branch = branches.find((candidate) => candidate.id === pkg.branchId); const seedIds = pkg.seedIds; const contributions = pkg.sourceContributions;
  if (!branch || !Array.isArray(seedIds) || !Array.isArray(contributions) || !id(pkg.id) || seedIds.length === 0 || !unique(seedIds) || !seedIds.every((seedId) => branch.seedIds.includes(seedId) && seeds.some((seed) => seed.id === seedId && !seed.protected)) || !destinationValues.has(pkg.destination as IdeationPromotionDestination) || !text(pkg.selectedText) || !nonEmpty(pkg.selectedText) || !/^[a-f0-9]{64}$/.test(String(pkg.selectedTextSha256)) || pkg.selectedTextSha256 !== sha256(pkg.selectedText as string) || !timestamp(pkg.preparedAt) || !provenance(pkg.provenance) || pkg.status !== 'prepared') return false;
  const premise = branch.premiseVersions.find((version) => version.id === branch.currentPremiseVersionId); if (!premise || contributions.length !== seedIds.length || !contributions.every(contribution) || !unique(contributions.map((item) => item.seedId))) return false;
  const expectedContributions = seedIds.map((seedId) => branch.sourceContributions.find((item) => item.seedId === seedId));
  if (expectedContributions.some((item) => !item) || contributions.some((item, index) => JSON.stringify(item) !== JSON.stringify(expectedContributions[index]))) return false;
  return pkg.provenance.sourceReference === promotionSourceReference(projectId, branch.id, premise.id, seedIds, contributions, pkg.selectedTextSha256 as string);
}
function validAiAlternative(value: unknown, projectId: string, branches: readonly IdeationExplorationBranchV1[]): value is IdeationAiAlternativeV1 {
  if (!exact(value, ['id', 'branchId', 'premiseVersionId', 'text', 'request', 'provenance', 'model', 'receipt', 'accepted'])) return false;
  const alternative = value as Partial<IdeationAiAlternativeV1>; const branch = branches.find((candidate) => candidate.id === alternative.branchId); const request = alternative.request; const premise = branch?.premiseVersions.find((version) => version.id === alternative.premiseVersionId);
  if (!branch || !premise || !id(alternative.id) || !text(alternative.text) || !nonEmpty(alternative.text) || !provenance(alternative.provenance) || alternative.model !== PROGRAM7_LOCAL_INFERENCE_MODEL || alternative.accepted !== false || validateProgram7LocalInferenceRequest(request as Program7LocalInferenceRequestV1) !== null || !validSuccessfulReceipt(alternative.receipt)) return false;
  const typedRequest = request as Program7LocalInferenceRequestV1; const receipt = alternative.receipt as Program7LocalInferenceReceiptV1;
  return typedRequest.projectId === projectId && typedRequest.operation === 'premise_alternative' && typedRequest.source.unitId === `ideation-branch:${branch.id}` && typedRequest.source.text === premise.text.trim() && typedRequest.source.bodySha256 === sha256(typedRequest.source.text) && typedRequest.protection.excluded === false && typedRequest.protection.class === 'ordinary' && receipt.promptSha256 === program7LocalInferencePromptHash(typedRequest) && receipt.schemaSha256 === program7LocalInferenceSchemaHash() && alternative.provenance?.sourceReference === `${receipt.endpoint}|${receipt.requestedModel}|${receipt.promptSha256}`;
}
function validDocument(value: unknown, projectId: string): value is IdeationDocumentV1 {
  if (!exact(value, ['schemaVersion', 'projectId', 'revision', 'seeds', 'branches', 'premiseTests', 'promotionPackages', 'aiAlternatives', 'history'])) return false;
  const c = value as Partial<IdeationDocumentV1>;
  if (c.schemaVersion !== IDEATION_SCHEMA_VERSION || c.projectId !== projectId || !Number.isInteger(c.revision) || (c.revision ?? -1) < 0 || !Array.isArray(c.seeds) || !Array.isArray(c.branches) || !Array.isArray(c.premiseTests) || !Array.isArray(c.promotionPackages) || !Array.isArray(c.aiAlternatives) || !validHistory(c.history, null, IDEATION_MAX_HISTORY)) return false;
  const seeds = c.seeds; const branches = c.branches; const premiseTests = c.premiseTests;
  if (!seeds.every((seed) => validSeed(seed, projectId)) || !branches.every((branch) => validBranch(branch, projectId)) || premiseTests.length > IDEATION_MAX_TEST_HISTORY) return false;
  const seedIds = new Set(seeds.map((seed) => seed.id)); const branchIds = new Set(branches.map((branch) => branch.id)); const seedVersionIds = seeds.flatMap((seed) => seed.versions.map((version) => version.id)); const versions = new Map(seeds.flatMap((seed) => seed.versions.map((version) => [version.id, seed.id] as const)));
  if (!unique(seeds.map((seed) => seed.id)) || !unique(branches.map((branch) => branch.id)) || !unique(seedVersionIds) || !unique(premiseTests.map((test) => test.id)) || branches.some((branch) => branch.seedIds.some((seedId) => !seedIds.has(seedId)) || (branch.parentBranchId !== null && !branchIds.has(branch.parentBranchId)) || branch.lineageBranchIds.some((branchId) => !branchIds.has(branchId)) || branch.sourceContributions.some((item) => item.sourceVersionId !== null && versions.get(item.sourceVersionId) !== item.seedId))) return false;
  if (seeds.some((seed) => seed.branchIds.some((branchId) => !branchIds.has(branchId)) || seed.branchIds.some((branchId) => !branches.find((branch) => branch.id === branchId)?.seedIds.includes(seed.id)))) return false;
  if (!premiseTests.every((test) => validPremiseTest(test, branches))) return false;
  const premiseVersionIds = branches.flatMap((branch) => branch.premiseVersions.map((version) => version.id)); const premiseIds = new Set(premiseVersionIds);
  const promotionIds = c.promotionPackages.map((pkg) => (pkg as unknown as Partial<IdeationPromotionPackageV1>).id as string);
  const alternativeIds = c.aiAlternatives.map((alternative) => (alternative as unknown as Partial<IdeationAiAlternativeV1>).id as string);
  if (!unique(premiseVersionIds) || !unique([...seeds.map((seed) => seed.id), ...branches.map((branch) => branch.id), ...seedVersionIds, ...premiseVersionIds, ...premiseTests.map((test) => test.id), ...promotionIds, ...alternativeIds]) || c.promotionPackages.length > IDEATION_MAX_PROMOTION_HISTORY || !unique(promotionIds) || !c.promotionPackages.every((value) => validPromotionPackage(value, projectId, branches, seeds))) return false;
  if (c.aiAlternatives.length > IDEATION_MAX_AI_ALTERNATIVE_HISTORY) return false;
  return unique(c.aiAlternatives.map((alternative) => (alternative as unknown as Partial<IdeationAiAlternativeV1>).id as string)) && c.aiAlternatives.every((value) => validAiAlternative(value, projectId, branches));
}
function validReceipt(value: unknown): value is Program7LocalInferenceReceiptV1 {
  return record(value) && exact(value, ['endpoint', 'requestedModel', 'actualModel', 'modelDigest', 'ollamaVersion', 'promptSha256', 'schemaSha256', 'startedAt', 'firstTokenAt', 'endedAt', 'promptTokens', 'outputTokens']) && value.endpoint === PROGRAM7_LOCAL_INFERENCE_ENDPOINT && value.requestedModel === PROGRAM7_LOCAL_INFERENCE_MODEL && (value.actualModel === null || value.actualModel === PROGRAM7_LOCAL_INFERENCE_MODEL) && (value.modelDigest === null || /^[a-f0-9]{64}$/.test(String(value.modelDigest))) && (value.ollamaVersion === null || (typeof value.ollamaVersion === 'string' && value.ollamaVersion.length <= 80)) && /^[a-f0-9]{64}$/.test(String(value.promptSha256)) && value.schemaSha256 === program7LocalInferenceSchemaHash() && timestamp(value.startedAt) && (value.firstTokenAt === null || timestamp(value.firstTokenAt)) && timestamp(value.endedAt) && Number.isInteger(value.promptTokens) && Number(value.promptTokens) >= 0 && Number.isInteger(value.outputTokens) && Number(value.outputTokens) >= 0;
}
function validSuccessfulReceipt(value: unknown): value is Program7LocalInferenceReceiptV1 {
  return validReceipt(value) && value.actualModel === PROGRAM7_LOCAL_INFERENCE_MODEL && typeof value.modelDigest === 'string' && /^[a-f0-9]{64}$/.test(value.modelDigest) && typeof value.ollamaVersion === 'string' && nonEmpty(value.ollamaVersion);
}
function emptyDocument(projectId: string): IdeationDocumentV1 {
  return { schemaVersion: IDEATION_SCHEMA_VERSION, projectId, revision: 0, seeds: [], branches: [], premiseTests: [], promotionPackages: [], aiAlternatives: [], history: [] };
}
function snapshot(document: IdeationDocumentV1, message: string | null = null): IdeationSnapshotV1 { return { availability: 'ready', document, message }; }
function newProvenance(now: string, kind: IdeationProvenanceKind = 'author', actor: 'author' | 'local-ai' = 'author', authorRequested = false): IdeationProvenanceV1 { return { kind, actor, capturedAt: now, sourceReference: null, authorRequested }; }
function trimHistory(history: readonly IdeationHistoryEventV1[]): readonly IdeationHistoryEventV1[] {
  return trimBoundedHistory(history, IDEATION_MAX_HISTORY);
}
function trimBoundedHistory(history: readonly IdeationHistoryEventV1[], limit: number): readonly IdeationHistoryEventV1[] {
  if (history.length <= limit) return history;
  const retained = history.filter((item) => item.pinned || item.lineageRelevant);
  if (retained.length > limit) throw new IdeationRepositoryError('INVALID', 'History retention would discard pinned or lineage-relevant evidence.');
  const retainedIds = new Set(retained.map((item) => item.id));
  const recent = history.slice(-limit).filter((item) => !retainedIds.has(item.id));
  const selected = [...retained, ...recent].slice(0, limit);
  const selectedIds = new Set(selected.map((item) => item.id));
  return history.filter((item) => selectedIds.has(item.id));
}
function event(objectId: string, action: string, now: string, detail: string | null = null, lineageRelevant = false): IdeationHistoryEventV1 { return { id: 'history_' + randomUUID(), action, objectId, occurredAt: now, pinned: false, lineageRelevant, detail }; }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function serializationKey(filePath: string): string { const normalized = path.normalize(filePath); return process.platform === 'win32' ? normalized.toLowerCase() : normalized; }

export class IdeationRepository {
  readonly filePath: string;
  constructor(readonly projectPath: string, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = () => randomUUID(), private readonly aiAlternativeProvider?: IdeationLocalInferenceProvider) { this.filePath = path.join(path.resolve(projectPath), IDEATION_FILENAME); }

  async read(projectId: string): Promise<IdeationSnapshotV1> {
    if (!nonEmpty(projectId) || projectId.length > 240) return { availability: 'degraded', document: emptyDocument('invalid-project'), message: 'The Ideation project binding is invalid.' };
    try {
      const parsed = JSON.parse(await fs.readFile(this.filePath, 'utf8')) as unknown;
      if (!validDocument(parsed, projectId)) throw new IdeationRepositoryError('UNAVAILABLE', 'Saved Ideation state has an unsupported format.');
      return snapshot(parsed);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return snapshot(emptyDocument(projectId));
      return { availability: 'degraded', document: emptyDocument(projectId), message: error instanceof IdeationRepositoryError ? error.message : 'Saved Ideation state is not readable.' };
    }
  }

  async captureSeed(projectId: string, expectedRevision: number, input: { readonly title: string; readonly body: string; readonly kind: IdeationSeedKind; readonly tags: readonly string[]; readonly protected: boolean; }): Promise<IdeationSnapshotV1> {
    this.validateSeedInput(input);
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const seedId = 'seed_' + this.createId(); const versionId = 'seed_version_' + this.createId();
      const version: IdeationSeedVersionV1 = { id: versionId, title: input.title.trim(), body: input.body.trim(), kind: input.kind, provenance: newProvenance(now), createdAt: now, supersededAt: null };
      const seed: IdeationIdeaSeedV1 = { id: seedId, lifecycle: 'active', currentVersionId: versionId, versions: [version], tags: [...new Set(input.tags.map((tag) => tag.trim()).filter(nonEmpty))], projectReferences: [projectId], branchIds: [], protected: input.protected, pinned: false, history: [event(seedId, 'captured', now, 'manual author capture', true)] };
      return { ...document, seeds: [...document.seeds, seed], history: trimHistory([...document.history, event(seedId, 'captured', now, 'manual author capture', true)]) };
    });
  }

  async updateSeed(projectId: string, expectedRevision: number, input: { readonly seedId: string; readonly title: string; readonly body: string; readonly kind: IdeationSeedKind; readonly tags: readonly string[]; }): Promise<IdeationSnapshotV1> {
    this.validateSeedInput(input);
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const existing = document.seeds.find((seed) => seed.id === input.seedId);
      if (!existing) throw new IdeationRepositoryError('UNKNOWN_SEED', 'The Idea Seed does not exist.');
      const prior = existing.versions.find((version) => version.id === existing.currentVersionId);
      if (!prior) throw new IdeationRepositoryError('UNAVAILABLE', 'The Idea Seed current version is missing.');
      const versionId = 'seed_version_' + this.createId();
      const version: IdeationSeedVersionV1 = { id: versionId, title: input.title.trim(), body: input.body.trim(), kind: input.kind, provenance: newProvenance(now), createdAt: now, supersededAt: null };
      const versions = existing.versions.map((candidate) => candidate.id === prior.id ? { ...candidate, supersededAt: now } : candidate);
      const seed: IdeationIdeaSeedV1 = { ...existing, currentVersionId: versionId, versions: [...versions, version], tags: [...new Set(input.tags.map((tag) => tag.trim()).filter(nonEmpty))], history: trimBoundedHistory([...existing.history, event(existing.id, 'revised', now, 'manual author revision', true)], IDEATION_MAX_OBJECT_HISTORY) };
      const staleBranches = document.branches.map((branch) => branch.seedIds.includes(seed.id) && branch.posture !== 'archived' ? { ...branch, posture: 'stale' as const, history: trimBoundedHistory([...branch.history, event(branch.id, 'stale-source', now, 'dependent seed revised', true)], IDEATION_MAX_OBJECT_HISTORY) } : branch);
      return { ...document, seeds: document.seeds.map((candidate) => candidate.id === seed.id ? seed : candidate), branches: staleBranches, history: trimHistory([...document.history, event(seed.id, 'revised', now, 'dependent branches marked stale', true)]) };
    });
  }

  async createBranch(projectId: string, expectedRevision: number, input: { readonly name: string; readonly seedIds: readonly string[]; readonly premise: string; readonly unknowns: readonly IdeationUnresolvedAreaV1[]; }): Promise<IdeationSnapshotV1> {
    if (!record(input) || !nonEmpty(input.name) || input.name.length > 500 || !text(input.premise) || !nonEmpty(input.premise) || !Array.isArray(input.seedIds) || input.seedIds.length === 0 || !input.seedIds.every(id) || !unique(input.seedIds) || !Array.isArray(input.unknowns) || input.unknowns.length > 64 || !input.unknowns.every(unresolved) || !unique(input.unknowns.map((area) => area.id))) throw new IdeationRepositoryError('INVALID', 'The Exploration Branch request is invalid.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const seeds = this.requireSeeds(document, input.seedIds); const branchId = 'branch_' + this.createId(); const premiseId = 'premise_' + this.createId();
      const premise: IdeationPremiseVersionV1 = { id: premiseId, text: input.premise.trim(), unresolvedAreas: clone(input.unknowns), provenance: newProvenance(now), createdAt: now, supersededAt: null };
      const branch: IdeationExplorationBranchV1 = { id: branchId, name: input.name.trim(), posture: 'draft', seedIds: [...input.seedIds], sourceContributions: seeds.map((seed) => ({ seedId: seed.id, importance: 'essential', classification: 'central', sourceVersionId: seed.currentVersionId, note: null })), premiseVersions: [premise], currentPremiseVersionId: premiseId, parentBranchId: null, lineageBranchIds: [], unknowns: clone(input.unknowns), projectReferences: [projectId], pinned: false, history: [event(branchId, 'created', now, 'manual author branch', true)] };
      const nextSeeds = document.seeds.map((seed) => input.seedIds.includes(seed.id) ? { ...seed, branchIds: [...seed.branchIds, branchId], history: trimBoundedHistory([...seed.history, event(seed.id, 'branch-linked', now, branchId, true)], IDEATION_MAX_OBJECT_HISTORY) } : seed);
      return { ...document, seeds: nextSeeds, branches: [...document.branches, branch], history: trimHistory([...document.history, event(branchId, 'created', now, 'manual author branch', true)]) };
    });
  }

  async copyBranch(projectId: string, expectedRevision: number, branchId: string, name: string): Promise<IdeationSnapshotV1> {
    if (!id(branchId) || !nonEmpty(name) || name.length > 500) throw new IdeationRepositoryError('INVALID', 'A copied branch needs a valid name.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const source = this.requireBranch(document, branchId); const copiedId = 'branch_' + this.createId(); const versionMap = new Map<string, string>();
      const premiseVersions = source.premiseVersions.map((version) => { const nextId = 'premise_' + this.createId(); versionMap.set(version.id, nextId); return { ...clone(version), id: nextId }; });
      const copied: IdeationExplorationBranchV1 = { ...clone(source), id: copiedId, name: name.trim(), posture: 'draft', parentBranchId: source.id, lineageBranchIds: [...new Set([...source.lineageBranchIds, source.id])], premiseVersions, currentPremiseVersionId: source.currentPremiseVersionId ? versionMap.get(source.currentPremiseVersionId) ?? null : null, history: [event(copiedId, 'copied', now, source.id, true)] };
      const seeds = document.seeds.map((seed) => source.seedIds.includes(seed.id) ? { ...seed, branchIds: [...seed.branchIds, copiedId], history: trimBoundedHistory([...seed.history, event(seed.id, 'branch-linked', now, copiedId, true)], IDEATION_MAX_OBJECT_HISTORY) } : seed);
      return { ...document, seeds, branches: [...document.branches, copied], history: trimHistory([...document.history, event(copiedId, 'copied', now, source.id, true)]) };
    });
  }

  async mergeBranches(projectId: string, expectedRevision: number, branchIds: readonly string[], name: string, premiseText: string): Promise<IdeationSnapshotV1> {
    if (!Array.isArray(branchIds) || branchIds.length < 2 || !branchIds.every(id) || !unique(branchIds) || !nonEmpty(name) || name.length > 500 || !nonEmpty(premiseText) || !text(premiseText)) throw new IdeationRepositoryError('INVALID_LINEAGE', 'A merge needs two or more distinct branches.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const sources = branchIds.map((branchId) => this.requireBranch(document, branchId)); const sourceSeedIds = sources.flatMap((branch) => branch.seedIds); if (!unique(sourceSeedIds)) throw new IdeationRepositoryError('INVALID_LINEAGE', 'Merging branches with overlapping seeds would erase source contribution lineage.'); const seedIds = [...sourceSeedIds]; const mergedId = 'branch_' + this.createId(); const premiseId = 'premise_' + this.createId();
      const sourceContributions = [...new Map(sources.flatMap((branch) => branch.sourceContributions).map((item) => [item.seedId, { ...item }] as const)).values()];
      const merged: IdeationExplorationBranchV1 = { id: mergedId, name: name.trim(), posture: 'draft', seedIds, sourceContributions, premiseVersions: [{ id: premiseId, text: premiseText.trim(), unresolvedAreas: [], provenance: newProvenance(now), createdAt: now, supersededAt: null }], currentPremiseVersionId: premiseId, parentBranchId: null, lineageBranchIds: [...branchIds], unknowns: [], projectReferences: [projectId], pinned: false, history: [event(mergedId, 'merged', now, branchIds.join(','), true)] };
      const branches = document.branches.map((branch) => branchIds.includes(branch.id) ? { ...branch, posture: 'merged' as const, history: trimBoundedHistory([...branch.history, event(branch.id, 'merged-into', now, mergedId, true)], IDEATION_MAX_OBJECT_HISTORY) } : branch);
      const seeds = document.seeds.map((seed) => seedIds.includes(seed.id) ? { ...seed, branchIds: [...seed.branchIds, mergedId], history: trimBoundedHistory([...seed.history, event(seed.id, 'branch-linked', now, mergedId, true)], IDEATION_MAX_OBJECT_HISTORY) } : seed);
      return { ...document, seeds, branches: [...branches, merged], history: trimHistory([...document.history, event(mergedId, 'merged', now, branchIds.join(','), true)]) };
    });
  }

  async splitBranch(projectId: string, expectedRevision: number, input: { readonly branchId: string; readonly name: string; readonly premise: string; readonly seedIds: readonly string[]; }): Promise<IdeationSnapshotV1> {
    if (!record(input) || !id(input.branchId) || !nonEmpty(input.name) || input.name.length > 500 || !nonEmpty(input.premise) || !text(input.premise) || !Array.isArray(input.seedIds) || input.seedIds.length === 0 || !input.seedIds.every(id) || !unique(input.seedIds)) throw new IdeationRepositoryError('INVALID_LINEAGE', 'A split must select existing branch seeds.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const source = this.requireBranch(document, input.branchId);
      if (!nonEmpty(input.name) || !text(input.premise) || input.seedIds.length === 0 || !input.seedIds.every((seedId) => source.seedIds.includes(seedId))) throw new IdeationRepositoryError('INVALID_LINEAGE', 'A split must select existing branch seeds.');
      const childId = 'branch_' + this.createId(); const premiseId = 'premise_' + this.createId();
      const child: IdeationExplorationBranchV1 = { id: childId, name: input.name.trim(), posture: 'draft', seedIds: [...new Set(input.seedIds)], sourceContributions: source.sourceContributions.filter((item) => input.seedIds.includes(item.seedId)), premiseVersions: [{ id: premiseId, text: input.premise.trim(), unresolvedAreas: clone(source.unknowns), provenance: newProvenance(now), createdAt: now, supersededAt: null }], currentPremiseVersionId: premiseId, parentBranchId: source.id, lineageBranchIds: [...new Set([...source.lineageBranchIds, source.id])], unknowns: clone(source.unknowns), projectReferences: [projectId], pinned: false, history: [event(childId, 'split', now, source.id, true)] };
      return { ...document, seeds: document.seeds.map((seed) => input.seedIds.includes(seed.id) ? { ...seed, branchIds: [...seed.branchIds, childId], history: trimBoundedHistory([...seed.history, event(seed.id, 'branch-linked', now, childId, true)], IDEATION_MAX_OBJECT_HISTORY) } : seed), branches: [...document.branches, child], history: trimHistory([...document.history, event(childId, 'split', now, source.id, true)]) };
    });
  }
  async archiveBranch(projectId: string, expectedRevision: number, branchId: string): Promise<IdeationSnapshotV1> { return this.changeBranchLifecycle(projectId, expectedRevision, branchId, 'archived', 'archived'); }
  async restoreBranch(projectId: string, expectedRevision: number, branchId: string): Promise<IdeationSnapshotV1> { return this.changeBranchLifecycle(projectId, expectedRevision, branchId, 'draft', 'restored'); }

  async addPremiseVersion(projectId: string, expectedRevision: number, input: { readonly branchId: string; readonly text: string; readonly unresolvedAreas: readonly IdeationUnresolvedAreaV1[] }): Promise<IdeationSnapshotV1> {
    if (!record(input) || !id(input.branchId) || !text(input.text) || !nonEmpty(input.text) || !Array.isArray(input.unresolvedAreas) || input.unresolvedAreas.length > 64 || !input.unresolvedAreas.every(unresolved) || !unique(input.unresolvedAreas.map((area) => area.id))) throw new IdeationRepositoryError('INVALID', 'The Premise Version is invalid.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const branch = this.requireBranch(document, input.branchId); if (branch.posture === 'archived') throw new IdeationRepositoryError('ARCHIVED_BRANCH', 'Restore the branch before adding a premise version.');
      const current = branch.premiseVersions.find((version) => version.id === branch.currentPremiseVersionId); const premiseId = 'premise_' + this.createId(); const next: IdeationPremiseVersionV1 = { id: premiseId, text: input.text.trim(), unresolvedAreas: clone(input.unresolvedAreas), provenance: newProvenance(now), createdAt: now, supersededAt: null };
      const updated: IdeationExplorationBranchV1 = { ...branch, premiseVersions: [...branch.premiseVersions.map((version) => version.id === current?.id ? { ...version, supersededAt: now } : version), next], currentPremiseVersionId: premiseId, unknowns: clone(input.unresolvedAreas), history: trimBoundedHistory([...branch.history, event(branch.id, 'premise-revised', now, premiseId, true)], IDEATION_MAX_OBJECT_HISTORY) };
      return { ...document, branches: document.branches.map((candidate) => candidate.id === branch.id ? updated : candidate), history: trimHistory([...document.history, event(branch.id, 'premise-revised', now, premiseId, true)]) };
    });
  }

  async testPremise(projectId: string, expectedRevision: number, input: { readonly branchId: string; readonly answers: Readonly<Record<string, string>>; readonly purpose: string | null }): Promise<IdeationSnapshotV1> {
    if (!record(input) || !id(input.branchId) || !record(input.answers) || Object.keys(input.answers).length > IDEATION_FIXED_CORE_QUESTIONS.length + 8 || !Object.entries(input.answers).every(([key, value]) => id(key) && text(value)) || (input.purpose !== null && (!text(input.purpose) || input.purpose.length > 1_000))) throw new IdeationRepositoryError('INVALID', 'The premise test request is invalid.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const branch = this.requireBranch(document, input.branchId); if (branch.posture === 'archived') throw new IdeationRepositoryError('ARCHIVED_BRANCH', 'Restore the branch before testing its premise.'); const current = branch.premiseVersions.find((version) => version.id === branch.currentPremiseVersionId); if (!current) throw new IdeationRepositoryError('INVALID', 'The branch has no current premise.');
      const adaptive = this.adaptiveQuestions(branch); const questions = [...IDEATION_FIXED_CORE_QUESTIONS, ...adaptive]; if (Object.keys(input.answers).some((key) => !questions.some((question) => question.id === key))) throw new IdeationRepositoryError('INVALID', 'The premise test contains an answer for an unknown question.'); const findings: IdeationExplorationFindingV1[] = questions.filter((question) => !nonEmpty(input.answers[question.id])).map((question) => ({ id: 'finding_' + this.createId(), premiseVersionId: current.id, dimension: question.id, summary: 'This dimension remains unanswered; review is advisory.', uncertainty: 'unknown', provenance: newProvenance(now), authorResponse: null }));
      const test: IdeationPremiseTestV1 = { id: 'test_' + this.createId(), branchId: branch.id, premiseVersionId: current.id, branchPosture: branch.posture, fixedCore: IDEATION_FIXED_CORE_QUESTIONS, adaptive, answers: clone(input.answers), findings, createdAt: now, provenance: newProvenance(now) };
      return { ...document, premiseTests: [...document.premiseTests, test].slice(-IDEATION_MAX_TEST_HISTORY), history: trimHistory([...document.history, event(branch.id, 'premise-tested', now, input.purpose, false)]) };
    });
  }

  async combineSeeds(projectId: string, expectedRevision: number, input: { readonly seedIds: readonly string[]; readonly name: string; readonly premise: string; readonly contributions: readonly IdeationSourceContributionV1[] }): Promise<IdeationSnapshotV1> {
    if (!record(input) || !nonEmpty(input.name) || input.name.length > 500 || !text(input.premise) || !nonEmpty(input.premise) || !Array.isArray(input.seedIds) || input.seedIds.length < 2 || !input.seedIds.every(id) || !unique(input.seedIds) || !Array.isArray(input.contributions) || input.contributions.length !== input.seedIds.length || !input.contributions.every(contribution) || new Set(input.contributions.map((item) => item.seedId)).size !== input.contributions.length || input.contributions.some((item) => !input.seedIds.includes(item.seedId))) throw new IdeationRepositoryError('INVALID_LINEAGE', 'A combination needs distinct seeds and each source contribution.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const seeds = this.requireSeeds(document, input.seedIds); const branchId = 'branch_' + this.createId(); const premiseId = 'premise_' + this.createId(); const premise: IdeationPremiseVersionV1 = { id: premiseId, text: input.premise.trim(), unresolvedAreas: [], provenance: newProvenance(now), createdAt: now, supersededAt: null };
      const branch: IdeationExplorationBranchV1 = { id: branchId, name: input.name.trim(), posture: 'draft', seedIds: [...input.seedIds], sourceContributions: clone(input.contributions), premiseVersions: [premise], currentPremiseVersionId: premiseId, parentBranchId: null, lineageBranchIds: [], unknowns: [], projectReferences: [projectId], pinned: false, history: [event(branchId, 'combined', now, input.seedIds.join(','), true)] };
      return { ...document, seeds: document.seeds.map((seed) => input.seedIds.includes(seed.id) ? { ...seed, branchIds: [...seed.branchIds, branchId], history: trimBoundedHistory([...seed.history, event(seed.id, 'branch-linked', now, branchId, true)], IDEATION_MAX_OBJECT_HISTORY) } : seed), branches: [...document.branches, branch], history: trimHistory([...document.history, event(branchId, 'combined', now, input.seedIds.join(','), true)]) };
    });
  }

  async filterLibrary(projectId: string, filters: { readonly lifecycle?: IdeationLifecycle; readonly kind?: IdeationSeedKind; readonly tag?: string; readonly provenance?: IdeationProvenanceKind; readonly includeArchived?: boolean }): Promise<IdeationSnapshotV1> {
    if (!record(filters) || (filters.lifecycle !== undefined && filters.lifecycle !== 'active' && filters.lifecycle !== 'archived') || (filters.kind !== undefined && !seedKinds.has(filters.kind)) || (filters.tag !== undefined && !text(filters.tag)) || (filters.provenance !== undefined && !['author', 'ai-advisory', 'mixed'].includes(filters.provenance)) || (filters.includeArchived !== undefined && typeof filters.includeArchived !== 'boolean')) throw new IdeationRepositoryError('INVALID', 'The library filter is invalid.');
    const current = await this.read(projectId); if (current.availability === 'degraded') return current;
    const seeds = current.document.seeds.filter((seed) => { if (seed.protected) return false; const version = seed.versions.find((candidate) => candidate.id === seed.currentVersionId); return (!filters.lifecycle || seed.lifecycle === filters.lifecycle) && (filters.includeArchived || seed.lifecycle !== 'archived') && (!filters.kind || version?.kind === filters.kind) && (!filters.tag || seed.tags.includes(filters.tag)) && (!filters.provenance || version?.provenance.kind === filters.provenance); });
    const visibleSeedIds = new Set(seeds.map((seed) => seed.id));
    const candidateBranches = current.document.branches.filter((branch) => branch.seedIds.length > 0 && branch.seedIds.every((seedId) => visibleSeedIds.has(seedId)));
    const candidateBranchIds = new Set(candidateBranches.map((branch) => branch.id));
    const branches = candidateBranches.filter((branch) => (branch.parentBranchId === null || candidateBranchIds.has(branch.parentBranchId)) && branch.lineageBranchIds.every((branchId) => candidateBranchIds.has(branchId)));
    const branchIds = new Set(branches.map((branch) => branch.id));
    const premiseVersionIds = new Set(branches.flatMap((branch) => branch.premiseVersions.map((version) => version.id)));
    const premiseTests = current.document.premiseTests.filter((test) => branchIds.has(test.branchId) && premiseVersionIds.has(test.premiseVersionId));
    const promotionPackages = current.document.promotionPackages.filter((pkg) => branchIds.has(pkg.branchId) && pkg.seedIds.every((seedId) => visibleSeedIds.has(seedId)));
    const aiAlternatives = current.document.aiAlternatives.filter((alternative) => branchIds.has(alternative.branchId) && premiseVersionIds.has(alternative.premiseVersionId));
    const visibleObjectIds = new Set([...visibleSeedIds, ...branchIds, ...premiseVersionIds, ...premiseTests.map((test) => test.id), ...promotionPackages.map((pkg) => pkg.id), ...aiAlternatives.map((alternative) => alternative.id)]);
    return snapshot({ ...current.document, seeds, branches, premiseTests, promotionPackages, aiAlternatives, history: current.document.history.filter((item) => visibleObjectIds.has(item.objectId)) });
  }

  async preparePromotion(projectId: string, expectedRevision: number, input: { readonly branchId: string; readonly destination: IdeationPromotionDestination; readonly seedIds: readonly string[]; readonly selectedText: string }): Promise<IdeationSnapshotV1> {
    if (!record(input) || !id(input.branchId) || !destinationValues.has(input.destination) || !text(input.selectedText) || !nonEmpty(input.selectedText) || !Array.isArray(input.seedIds) || input.seedIds.length === 0 || !input.seedIds.every(id) || !unique(input.seedIds)) throw new IdeationRepositoryError('INVALID', 'The promotion package is invalid.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const branch = this.requireBranch(document, input.branchId); if (branch.posture === 'archived') throw new IdeationRepositoryError('ARCHIVED_BRANCH', 'Restore the branch before preparing promotion.'); const seeds = this.requireSeeds(document, input.seedIds); if (input.seedIds.some((seedId) => !branch.seedIds.includes(seedId))) throw new IdeationRepositoryError('INVALID_LINEAGE', 'Promotion seeds must belong to the branch.'); const premise = branch.premiseVersions.find((version) => version.id === branch.currentPremiseVersionId); if (!premise) throw new IdeationRepositoryError('INVALID_LINEAGE', 'Promotion requires the branch current premise.');
      if (seeds.some((seed) => seed.protected)) throw new IdeationRepositoryError('INVALID_LINEAGE', 'Protected Idea Seeds cannot be included in a promotion package.');
      const selectedText = input.selectedText.trim(); const selectedTextSha256 = sha256(selectedText); const sourceContributions = input.seedIds.map((seedId) => branch.sourceContributions.find((item) => item.seedId === seedId)).filter((item): item is IdeationSourceContributionV1 => Boolean(item));
      if (sourceContributions.length !== input.seedIds.length) throw new IdeationRepositoryError('INVALID_LINEAGE', 'Promotion source contribution lineage is incomplete.');
      const provenance = { ...newProvenance(now), sourceReference: promotionSourceReference(projectId, branch.id, premise.id, input.seedIds, sourceContributions, selectedTextSha256) };
      const pkg: IdeationPromotionPackageV1 = { id: 'promotion_' + this.createId(), branchId: branch.id, seedIds: [...input.seedIds], destination: input.destination, selectedText, selectedTextSha256, sourceContributions: clone(sourceContributions), preparedAt: now, provenance, status: 'prepared' };
      return { ...document, promotionPackages: [...document.promotionPackages, pkg].slice(-IDEATION_MAX_PROMOTION_HISTORY), history: trimHistory([...document.history, event(pkg.id, 'promotion-prepared', now, input.destination, true)]) };
    });
  }

  async requestAiAlternatives(projectId: string, expectedRevision: number, input: { readonly branchId: string; readonly authorRequested: true; readonly purpose: string }): Promise<IdeationSnapshotV1> {
    if (!record(input) || !exact(input, ['branchId', 'authorRequested', 'purpose']) || !id(input.branchId) || input.authorRequested !== true || !nonEmpty(input.purpose) || !text(input.purpose) || input.purpose.length > 1_000) throw new IdeationRepositoryError('INVALID', 'The local-AI alternative request is invalid.');
    if (!this.aiAlternativeProvider) throw new IdeationRepositoryError('AI_UNAVAILABLE', 'No Program 7 local-inference seam is configured.');
    const current = await this.read(projectId); if (current.availability === 'degraded') throw new IdeationRepositoryError('UNAVAILABLE', current.message ?? 'Ideation is unavailable.');
    if (current.document.revision !== expectedRevision) throw new IdeationRepositoryError('STALE', 'Ideation changed. Reload before trying again.');
    const branch = this.requireBranch(current.document, input.branchId); if (branch.posture === 'archived') throw new IdeationRepositoryError('ARCHIVED_BRANCH', 'Restore the branch before requesting alternatives.');
    const sourceSeeds = this.requireSeeds(current.document, branch.seedIds); if (sourceSeeds.some((seed) => seed.protected)) throw new IdeationRepositoryError('INVALID_LINEAGE', 'Protected Idea Seeds cannot be sent to local inference.');
    const premise = branch.premiseVersions.find((version) => version.id === branch.currentPremiseVersionId); if (!premise) throw new IdeationRepositoryError('INVALID', 'The branch has no current premise.');
    const sourceText = premise.text.trim();
    const request: IdeationLocalInferenceRequest = {
      schema: PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
      operation: 'premise_alternative',
      model: PROGRAM7_LOCAL_INFERENCE_MODEL,
      requestId: 'ideation_' + this.createId(),
      projectId,
      source: { unitId: `ideation-branch:${branch.id}`, bodySha256: createHash('sha256').update(sourceText, 'utf8').digest('hex'), text: sourceText },
      purpose: input.purpose.trim(),
      limits: PROGRAM7_LOCAL_INFERENCE_BOUNDS.premise_alternative,
      protection: { excluded: false, class: 'ordinary' },
    };
    const responseValue = await this.aiAlternativeProvider(request);
    const response = validateProgram7LocalInferenceResponse(responseValue, request);
    if (!response) throw new IdeationRepositoryError('AI_UNAVAILABLE', 'Local inference returned no trusted Program 7 response.');
    if (response.status !== 'candidate' || !nonEmpty(response.text)) throw new IdeationRepositoryError('AI_UNAVAILABLE', 'Local inference did not produce an advisory alternative.');
    return this.mutate(projectId, expectedRevision, (document, now) => {
      const currentBranch = this.requireBranch(document, input.branchId); const currentPremise = currentBranch.premiseVersions.find((version) => version.id === currentBranch.currentPremiseVersionId); if (!currentPremise) throw new IdeationRepositoryError('INVALID', 'The branch has no current premise.');
      const alternative: IdeationAiAlternativeV1 = { id: 'ai_alternative_' + this.createId(), branchId: currentBranch.id, premiseVersionId: currentPremise.id, text: response.text.trim(), request, provenance: { ...newProvenance(now, 'ai-advisory', 'local-ai', true), sourceReference: `${response.receipt.endpoint}|${response.receipt.requestedModel}|${response.receipt.promptSha256}` }, model: PROGRAM7_LOCAL_INFERENCE_MODEL, receipt: response.receipt, accepted: false };
      return { ...document, aiAlternatives: [...document.aiAlternatives, alternative].slice(-IDEATION_MAX_AI_ALTERNATIVE_HISTORY), history: trimHistory([...document.history, event(currentBranch.id, 'ai-alternatives-requested', now, input.purpose, true)]) };
    });
  }

  private validateSeedInput(input: { readonly title: string; readonly body: string; readonly kind: IdeationSeedKind; readonly tags?: readonly string[]; readonly protected?: boolean; readonly seedId?: string; }): void { if (!record(input) || !nonEmpty(input.title) || input.title.length > IDEATION_MAX_TEXT_LENGTH || !text(input.title) || !text(input.body) || !seedKinds.has(input.kind) || !Array.isArray(input.tags) || input.tags.length > 64 || !input.tags.every((tag) => nonEmpty(tag) && text(tag)) || (input.protected !== undefined && typeof input.protected !== 'boolean') || (input.seedId !== undefined && !id(input.seedId))) throw new IdeationRepositoryError('INVALID', 'The Idea Seed is invalid.'); }
  private requireSeeds(document: IdeationDocumentV1, seedIds: readonly string[]): readonly IdeationIdeaSeedV1[] { return seedIds.map((seedId) => { const seed = document.seeds.find((candidate) => candidate.id === seedId); if (!seed) throw new IdeationRepositoryError('UNKNOWN_SEED', 'An Idea Seed does not exist.'); return seed; }); }
  private requireBranch(document: IdeationDocumentV1, branchId: string): IdeationExplorationBranchV1 { const branch = document.branches.find((candidate) => candidate.id === branchId); if (!branch) throw new IdeationRepositoryError('UNKNOWN_BRANCH', 'The Exploration Branch does not exist.'); return branch; }
  private adaptiveQuestions(branch: IdeationExplorationBranchV1): readonly IdeationPremiseQuestionV1[] { return adaptiveQuestionsForBranch(branch); }
  private async changeBranchLifecycle(projectId: string, expectedRevision: number, branchId: string, posture: IdeationBranchPosture, action: string): Promise<IdeationSnapshotV1> { return this.mutate(projectId, expectedRevision, (document, now) => { const branch = this.requireBranch(document, branchId); if (posture === 'draft' && branch.posture !== 'archived') throw new IdeationRepositoryError('INVALID', 'Only archived branches can be restored.'); if (posture === branch.posture) return document; const updated = { ...branch, posture, history: trimBoundedHistory([...branch.history, event(branch.id, action, now, null, true)], IDEATION_MAX_OBJECT_HISTORY) }; return { ...document, branches: document.branches.map((candidate) => candidate.id === branch.id ? updated : candidate), history: trimHistory([...document.history, event(branch.id, action, now, null, true)]) }; }); }
  private async mutate(projectId: string, expectedRevision: number, change: (document: IdeationDocumentV1, now: string) => IdeationDocumentV1): Promise<IdeationSnapshotV1> {
    const key = serializationKey(this.filePath); const previous = writeQueues.get(key) ?? Promise.resolve(); const result = previous.catch(() => undefined).then(async () => { const current = await this.read(projectId); if (current.availability === 'degraded') throw new IdeationRepositoryError('UNAVAILABLE', current.message ?? 'Ideation is unavailable.'); if (!Number.isInteger(expectedRevision) || expectedRevision < 0 || current.document.revision !== expectedRevision) throw new IdeationRepositoryError('STALE', 'Ideation changed. Reload before trying again.'); const changed = change(current.document, this.now().toISOString()); const next = { ...changed, revision: current.document.revision + 1 }; if (!validDocument(next, projectId)) throw new IdeationRepositoryError('INVALID', 'The Ideation change failed document validation.'); await this.write(next); return snapshot(next); }); const tail = result.then(() => undefined, () => undefined); writeQueues.set(key, tail); try { return await result; } finally { if (writeQueues.get(key) === tail) writeQueues.delete(key); }
  }
  private async write(document: IdeationDocumentV1): Promise<void> { const tempPath = path.join(path.dirname(this.filePath), '.' + IDEATION_FILENAME + '.' + this.createId() + '.tmp'); try { await fs.mkdir(path.dirname(this.filePath), { recursive: true }); await fs.writeFile(tempPath, JSON.stringify(document, null, 2) + '\n', 'utf8'); await fs.rename(tempPath, this.filePath); } catch { await fs.rm(tempPath, { force: true }).catch(() => undefined); throw new IdeationRepositoryError('WRITE_FAILED', 'The Ideation change could not be saved.'); } }
}
