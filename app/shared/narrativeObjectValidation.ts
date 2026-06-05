import type {
  NarrativeAssertion,
  NarrativeAuthorshipStatus,
  NarrativeChapter,
  NarrativeConfidence,
  NarrativeGap,
  NarrativeLifecycle,
  NarrativeLifecycleState,
  NarrativeLineage,
  NarrativeObjectBundle,
  NarrativeObjectKind,
  NarrativeProvenance,
  NarrativeRelationship,
  NarrativeRelationshipCategory,
  NarrativeRelationshipType,
  NarrativeScene,
  StoryUnit,
} from "./narrativeObjectContract";

export interface NarrativeValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface NarrativeValidationSuccess<T> {
  readonly ok: true;
  readonly value: T;
  readonly issues: readonly NarrativeValidationIssue[];
}

export interface NarrativeValidationFailure {
  readonly ok: false;
  readonly issues: readonly NarrativeValidationIssue[];
}

export type NarrativeValidationResult<T> = NarrativeValidationSuccess<T> | NarrativeValidationFailure;

interface NarrativeValidationContext {
  readonly knownIds?: ReadonlySet<string>;
}

const PROVENANCE_ORIGINS = new Set(["author", "companion", "system", "import", "derived"] as const);
const AUTHORSHIP_STATUSES = new Set(["authored", "inferred", "generated", "derived"] as const);
const CONFIDENCE_LEVELS = new Set(["low", "medium", "high", "certain"] as const);
const LIFECYCLE_STATES = new Set([
  "draft",
  "candidate",
  "active",
  "promoted",
  "merged",
  "split",
  "archived",
  "deleted",
  "recovered",
  "superseded",
] as const);
const RELATIONSHIP_CATEGORIES = new Set(["structural", "narrative", "editorial", "inferred"] as const);
const RELATIONSHIP_TYPES = new Set([
  "supports",
  "continues",
  "causes",
  "contradicts",
  "foreshadows",
  "pays_off",
  "belongs_to",
  "related_to",
  "blocks",
  "resolves",
  "merged_from",
  "split_into",
  "promoted_to",
  "demoted_to",
] as const);
const OBJECT_KINDS = new Set([
  "narrative_assertion",
  "story_unit",
  "narrative_gap",
  "narrative_relationship",
  "scene",
  "chapter",
] as const);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function createFailure(issues: readonly NarrativeValidationIssue[]): NarrativeValidationFailure {
  return { ok: false, issues };
}

function createSuccess<T>(value: T, issues: readonly NarrativeValidationIssue[] = []): NarrativeValidationSuccess<T> {
  return { ok: true, value, issues };
}

function validateIdentity(value: Record<string, unknown>, path = "$"): NarrativeValidationIssue[] {
  const issues: NarrativeValidationIssue[] = [];
  if (!isNonEmptyString(value.id)) {
    issues.push({ path: `${path}.id`, message: "id must be a non-empty string." });
  }
  if (typeof value.kind !== "string" || !OBJECT_KINDS.has(value.kind as NarrativeObjectKind)) {
    issues.push({ path: `${path}.kind`, message: "kind must be a supported narrative object kind." });
  }
  return issues;
}

export function validateNarrativeProvenance(
  value: unknown,
  path = "$.provenance",
): NarrativeValidationResult<NarrativeProvenance> {
  const issues: NarrativeValidationIssue[] = [];
  if (!isPlainObject(value)) {
    return createFailure([{ path, message: "provenance must be an object." }]);
  }
  if (typeof value.origin !== "string" || !PROVENANCE_ORIGINS.has(value.origin as NarrativeProvenance["origin"])) {
    issues.push({ path: `${path}.origin`, message: "origin must be one of author, companion, system, import, or derived." });
  }
  if (
    typeof value.status !== "string" ||
    !AUTHORSHIP_STATUSES.has(value.status as NarrativeAuthorshipStatus)
  ) {
    issues.push({ path: `${path}.status`, message: "status must be authored, inferred, generated, or derived." });
  }
  if (
    typeof value.confidence !== "string" ||
    !CONFIDENCE_LEVELS.has(value.confidence as NarrativeConfidence)
  ) {
    issues.push({ path: `${path}.confidence`, message: "confidence must be low, medium, high, or certain." });
  }
  if (typeof value.authorConfirmed !== "boolean") {
    issues.push({ path: `${path}.authorConfirmed`, message: "authorConfirmed must be a boolean." });
  }

  if (issues.length === 0) {
    const provenance = value as unknown as NarrativeProvenance;
    if (provenance.status === "authored" && provenance.authorConfirmed !== true) {
      issues.push({
        path: `${path}.authorConfirmed`,
        message: "authored provenance must be explicitly author-confirmed.",
      });
    }
    if (provenance.status !== "authored" && provenance.authorConfirmed === true) {
      issues.push({
        path: `${path}.authorConfirmed`,
        message: "inferred/generated/derived provenance must not be treated as authored truth.",
      });
    }
  }

  if (issues.length > 0) {
    return createFailure(issues);
  }

  return createSuccess(value as unknown as NarrativeProvenance);
}

export function validateNarrativeLifecycle(
  value: unknown,
  path = "$.lifecycle",
): NarrativeValidationResult<NarrativeLifecycle> {
  const issues: NarrativeValidationIssue[] = [];
  if (!isPlainObject(value)) {
    return createFailure([{ path, message: "lifecycle must be an object." }]);
  }
  if (typeof value.state !== "string" || !LIFECYCLE_STATES.has(value.state as NarrativeLifecycleState)) {
    issues.push({ path: `${path}.state`, message: "state must be a supported lifecycle state." });
  }
  for (const key of ["createdAt", "updatedAt", "archivedAt"] as const) {
    const candidate = value[key];
    if (!(candidate === undefined || candidate === null || typeof candidate === "string")) {
      issues.push({ path: `${path}.${key}`, message: `${key} must be a string or null when present.` });
    }
  }
  if (issues.length > 0) {
    return createFailure(issues);
  }
  return createSuccess(value as unknown as NarrativeLifecycle);
}

export function validateNarrativeLineage(
  value: unknown,
  path = "$.lineage",
): NarrativeValidationResult<NarrativeLineage> {
  const issues: NarrativeValidationIssue[] = [];
  if (!isPlainObject(value)) {
    return createFailure([{ path, message: "lineage must be an object." }]);
  }
  if (!isNonEmptyString(value.originId)) {
    issues.push({ path: `${path}.originId`, message: "originId must be a non-empty string." });
  }
  for (const key of ["parentIds", "mergedFromIds", "childIds"] as const) {
    if (!isStringArray(value[key])) {
      issues.push({ path: `${path}.${key}`, message: `${key} must be an array of strings.` });
    }
  }
  for (const key of ["splitFromId", "promotedFromId", "supersededById", "branchId"] as const) {
    if (!isNullableString(value[key])) {
      issues.push({ path: `${path}.${key}`, message: `${key} must be a string or null.` });
    }
  }
  if (issues.length > 0) {
    return createFailure(issues);
  }
  return createSuccess(value as unknown as NarrativeLineage);
}

function validateObjectEnvelope(value: unknown, expectedKind: NarrativeObjectKind): NarrativeValidationIssue[] {
  const issues: NarrativeValidationIssue[] = [];
  if (!isPlainObject(value)) {
    return [{ path: "$", message: "value must be an object." }];
  }
  issues.push(...validateIdentity(value));
  if (value.kind !== expectedKind) {
    issues.push({ path: "$.kind", message: `kind must be ${expectedKind}.` });
  }

  const provenanceResult = validateNarrativeProvenance(value.provenance);
  if (!provenanceResult.ok) {
    issues.push(...provenanceResult.issues);
  }

  const lifecycleResult = validateNarrativeLifecycle(value.lifecycle);
  if (!lifecycleResult.ok) {
    issues.push(...lifecycleResult.issues);
  }

  const lineageResult = validateNarrativeLineage(value.lineage);
  if (!lineageResult.ok) {
    issues.push(...lineageResult.issues);
  }

  return issues;
}

function validateNarrativeObjectWithRefs(
  value: unknown,
  expectedKind: NarrativeObjectKind,
  context: NarrativeValidationContext = {},
): NarrativeValidationIssue[] {
  const issues = validateObjectEnvelope(value, expectedKind);
  if (!isPlainObject(value)) {
    return issues;
  }

  const knownIds = context.knownIds;
  if (knownIds) {
    const refs = extractReferencedIds(value, expectedKind);
    for (const ref of refs) {
      if (!knownIds.has(ref.id)) {
        issues.push({ path: ref.path, message: `unknown referenced id: ${ref.id}` });
      }
    }
  }

  return issues;
}

function extractReferencedIds(
  value: Record<string, unknown>,
  kind: NarrativeObjectKind,
): Array<{ readonly path: string; readonly id: string }> {
  const refs: Array<{ readonly path: string; readonly id: string }> = [];
  switch (kind) {
    case "narrative_assertion":
      break;
    case "story_unit":
      for (const [index, id] of (value.assertionIds as readonly string[] | undefined ?? []).entries()) {
        refs.push({ path: `$.assertionIds[${index}]`, id });
      }
      for (const [index, id] of (value.anchorAssertionIds as readonly string[] | undefined ?? []).entries()) {
        refs.push({ path: `$.anchorAssertionIds[${index}]`, id });
      }
      if (typeof value.sceneCandidateId === "string" && value.sceneCandidateId.length > 0) {
        refs.push({ path: "$.sceneCandidateId", id: value.sceneCandidateId });
      }
      if (typeof value.sceneId === "string" && value.sceneId.length > 0) {
        refs.push({ path: "$.sceneId", id: value.sceneId });
      }
      break;
    case "narrative_gap":
      for (const [index, id] of (value.startAnchorIds as readonly string[] | undefined ?? []).entries()) {
        refs.push({ path: `$.startAnchorIds[${index}]`, id });
      }
      for (const [index, id] of (value.endAnchorIds as readonly string[] | undefined ?? []).entries()) {
        refs.push({ path: `$.endAnchorIds[${index}]`, id });
      }
      for (const [index, id] of (value.relatedRelationshipIds as readonly string[] | undefined ?? []).entries()) {
        refs.push({ path: `$.relatedRelationshipIds[${index}]`, id });
      }
      break;
    case "narrative_relationship":
      if (typeof value.sourceId === "string" && value.sourceId.length > 0) {
        refs.push({ path: "$.sourceId", id: value.sourceId });
      }
      if (typeof value.targetId === "string" && value.targetId.length > 0) {
        refs.push({ path: "$.targetId", id: value.targetId });
      }
      break;
    case "scene":
      for (const [index, id] of (value.assertionIds as readonly string[] | undefined ?? []).entries()) {
        refs.push({ path: `$.assertionIds[${index}]`, id });
      }
      for (const [index, id] of (value.storyUnitIds as readonly string[] | undefined ?? []).entries()) {
        refs.push({ path: `$.storyUnitIds[${index}]`, id });
      }
      if (typeof value.chapterId === "string" && value.chapterId.length > 0) {
        refs.push({ path: "$.chapterId", id: value.chapterId });
      }
      break;
    case "chapter":
      for (const [index, id] of (value.sceneIds as readonly string[] | undefined ?? []).entries()) {
        refs.push({ path: `$.sceneIds[${index}]`, id });
      }
      break;
  }
  return refs;
}

export function validateNarrativeAssertion(
  value: unknown,
  context: NarrativeValidationContext = {},
): NarrativeValidationResult<NarrativeAssertion> {
  const issues = validateNarrativeObjectWithRefs(value, "narrative_assertion", context);
  if (!isPlainObject(value)) {
    return createFailure(issues);
  }
  if (!isNonEmptyString(value.text)) {
    issues.push({ path: "$.text", message: "text must be a non-empty string." });
  }
  if (!isNullableString(value.normalizedText)) {
    issues.push({ path: "$.normalizedText", message: "normalizedText must be a string or null." });
  }
  if (!isNullableString(value.sceneId)) {
    issues.push({ path: "$.sceneId", message: "sceneId must be a string or null." });
  }
  if (!Array.isArray(value.tags) || !value.tags.every((entry) => typeof entry === "string")) {
    issues.push({ path: "$.tags", message: "tags must be an array of strings." });
  }
  if (issues.length > 0) {
    return createFailure(issues);
  }
  return createSuccess(value as unknown as NarrativeAssertion);
}

export function validateStoryUnit(
  value: unknown,
  context: NarrativeValidationContext = {},
): NarrativeValidationResult<StoryUnit> {
  const issues = validateNarrativeObjectWithRefs(value, "story_unit", context);
  if (!isPlainObject(value)) {
    return createFailure(issues);
  }
  if (!isNonEmptyString(value.title)) {
    issues.push({ path: "$.title", message: "title must be a non-empty string." });
  }
  if (typeof value.order !== "number" || Number.isNaN(value.order)) {
    issues.push({ path: "$.order", message: "order must be a number." });
  }
  for (const key of ["assertionIds", "anchorAssertionIds"] as const) {
    if (!Array.isArray(value[key]) || !value[key].every((entry: unknown) => typeof entry === "string")) {
      issues.push({ path: `$.${key}`, message: `${key} must be an array of strings.` });
    }
  }
  if (!isNullableString(value.sceneCandidateId)) {
    issues.push({ path: "$.sceneCandidateId", message: "sceneCandidateId must be a string or null." });
  }
  if (!isNullableString(value.sceneId)) {
    issues.push({ path: "$.sceneId", message: "sceneId must be a string or null." });
  }
  if (issues.length > 0) {
    return createFailure(issues);
  }
  return createSuccess(value as unknown as StoryUnit);
}

export function validateNarrativeGap(
  value: unknown,
  context: NarrativeValidationContext = {},
): NarrativeValidationResult<NarrativeGap> {
  const issues = validateNarrativeObjectWithRefs(value, "narrative_gap", context);
  if (!isPlainObject(value)) {
    return createFailure(issues);
  }
  if (!isNonEmptyString(value.description)) {
    issues.push({ path: "$.description", message: "description must be a non-empty string." });
  }
  for (const key of ["startAnchorIds", "endAnchorIds", "relatedRelationshipIds"] as const) {
    if (!Array.isArray(value[key]) || !value[key].every((entry: unknown) => typeof entry === "string")) {
      issues.push({ path: `$.${key}`, message: `${key} must be an array of strings.` });
    }
  }
  if (issues.length > 0) {
    return createFailure(issues);
  }
  return createSuccess(value as unknown as NarrativeGap);
}

export function validateNarrativeRelationship(
  value: unknown,
  context: NarrativeValidationContext & { readonly knownIds?: ReadonlySet<string> } = {},
): NarrativeValidationResult<NarrativeRelationship> {
  const issues = validateNarrativeObjectWithRefs(value, "narrative_relationship", context);
  if (!isPlainObject(value)) {
    return createFailure(issues);
  }
  if (!isNonEmptyString(value.sourceId)) {
    issues.push({ path: "$.sourceId", message: "sourceId must be a non-empty string." });
  }
  if (!isNonEmptyString(value.targetId)) {
    issues.push({ path: "$.targetId", message: "targetId must be a non-empty string." });
  }
  if (
    typeof value.relationshipType !== "string" ||
    !RELATIONSHIP_TYPES.has(value.relationshipType as NarrativeRelationshipType)
  ) {
    issues.push({ path: "$.relationshipType", message: "relationshipType must be a supported relationship type." });
  }
  if (
    typeof value.category !== "string" ||
    !RELATIONSHIP_CATEGORIES.has(value.category as NarrativeRelationshipCategory)
  ) {
    issues.push({ path: "$.category", message: "category must be structural, narrative, editorial, or inferred." });
  }
  if (!isNullableString(value.description)) {
    issues.push({ path: "$.description", message: "description must be a string or null." });
  }
  if (context.knownIds) {
    if (isNonEmptyString(value.sourceId) && !context.knownIds.has(value.sourceId)) {
      issues.push({ path: "$.sourceId", message: `unknown referenced id: ${value.sourceId}` });
    }
    if (isNonEmptyString(value.targetId) && !context.knownIds.has(value.targetId)) {
      issues.push({ path: "$.targetId", message: `unknown referenced id: ${value.targetId}` });
    }
  }
  if (issues.length > 0) {
    return createFailure(issues);
  }
  return createSuccess(value as unknown as NarrativeRelationship);
}

export function validateNarrativeScene(
  value: unknown,
  context: NarrativeValidationContext = {},
): NarrativeValidationResult<NarrativeScene> {
  const issues = validateNarrativeObjectWithRefs(value, "scene", context);
  if (!isPlainObject(value)) {
    return createFailure(issues);
  }
  if (!isNonEmptyString(value.title)) {
    issues.push({ path: "$.title", message: "title must be a non-empty string." });
  }
  if (typeof value.order !== "number" || Number.isNaN(value.order)) {
    issues.push({ path: "$.order", message: "order must be a number." });
  }
  if (!isNullableString(value.chapterId)) {
    issues.push({ path: "$.chapterId", message: "chapterId must be a string or null." });
  }
  for (const key of ["assertionIds", "storyUnitIds"] as const) {
    if (!Array.isArray(value[key]) || !value[key].every((entry: unknown) => typeof entry === "string")) {
      issues.push({ path: `$.${key}`, message: `${key} must be an array of strings.` });
    }
  }
  if (!isNullableString(value.draftText)) {
    issues.push({ path: "$.draftText", message: "draftText must be a string or null." });
  }
  if (issues.length > 0) {
    return createFailure(issues);
  }
  return createSuccess(value as unknown as NarrativeScene);
}

export function validateNarrativeChapter(
  value: unknown,
  context: NarrativeValidationContext = {},
): NarrativeValidationResult<NarrativeChapter> {
  const issues = validateNarrativeObjectWithRefs(value, "chapter", context);
  if (!isPlainObject(value)) {
    return createFailure(issues);
  }
  if (!isNonEmptyString(value.title)) {
    issues.push({ path: "$.title", message: "title must be a non-empty string." });
  }
  if (typeof value.order !== "number" || Number.isNaN(value.order)) {
    issues.push({ path: "$.order", message: "order must be a number." });
  }
  if (!Array.isArray(value.sceneIds) || !value.sceneIds.every((entry: unknown) => typeof entry === "string")) {
    issues.push({ path: "$.sceneIds", message: "sceneIds must be an array of strings." });
  }
  if (issues.length > 0) {
    return createFailure(issues);
  }
  return createSuccess(value as unknown as NarrativeChapter);
}

export function collectNarrativeObjectIds(bundle: NarrativeObjectBundle): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const item of [
    ...bundle.assertions,
    ...bundle.storyUnits,
    ...bundle.gaps,
    ...bundle.relationships,
    ...bundle.scenes,
    ...bundle.chapters,
  ]) {
    ids.add(item.id);
  }
  return ids;
}

export function validateNarrativeObjectBundle(
  bundle: NarrativeObjectBundle,
): NarrativeValidationResult<NarrativeObjectBundle> {
  const issues: NarrativeValidationIssue[] = [];
  const knownIds = collectNarrativeObjectIds(bundle);

  const seenIds = new Set<string>();
  for (const item of [
    ...bundle.assertions,
    ...bundle.storyUnits,
    ...bundle.gaps,
    ...bundle.relationships,
    ...bundle.scenes,
    ...bundle.chapters,
  ]) {
    if (seenIds.has(item.id)) {
      issues.push({ path: "$.id", message: `duplicate narrative id: ${item.id}` });
    }
    seenIds.add(item.id);
  }

  for (const [index, assertion] of bundle.assertions.entries()) {
    const result = validateNarrativeAssertion(assertion, { knownIds });
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => ({ path: `$.assertions[${index}]${issue.path.slice(1)}`, message: issue.message })));
    }
  }
  for (const [index, storyUnit] of bundle.storyUnits.entries()) {
    const result = validateStoryUnit(storyUnit, { knownIds });
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => ({ path: `$.storyUnits[${index}]${issue.path.slice(1)}`, message: issue.message })));
    }
  }
  for (const [index, gap] of bundle.gaps.entries()) {
    const result = validateNarrativeGap(gap, { knownIds });
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => ({ path: `$.gaps[${index}]${issue.path.slice(1)}`, message: issue.message })));
    }
  }
  for (const [index, relationship] of bundle.relationships.entries()) {
    const result = validateNarrativeRelationship(relationship, { knownIds });
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => ({ path: `$.relationships[${index}]${issue.path.slice(1)}`, message: issue.message })));
    }
  }
  for (const [index, scene] of bundle.scenes.entries()) {
    const result = validateNarrativeScene(scene, { knownIds });
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => ({ path: `$.scenes[${index}]${issue.path.slice(1)}`, message: issue.message })));
    }
  }
  for (const [index, chapter] of bundle.chapters.entries()) {
    const result = validateNarrativeChapter(chapter, { knownIds });
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => ({ path: `$.chapters[${index}]${issue.path.slice(1)}`, message: issue.message })));
    }
  }

  if (issues.length > 0) {
    return createFailure(issues);
  }

  return createSuccess(bundle);
}
