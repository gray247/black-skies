import type { NarrativeProvenance } from "./narrativeObjectContract";
import { validateNarrativeProvenance, type NarrativeValidationIssue, type NarrativeValidationResult } from "./narrativeObjectValidation";
import {
  NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES,
  type NarrativeQualitativeSignal,
  type NarrativeQualitativeSignalCategory,
  type NarrativeQualitativeSignalClaimMode,
  type NarrativeQualitativeSignalConfidence,
} from "./narrativeQualitativeSignals";

export { NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES } from "./narrativeQualitativeSignals";

const SIGNAL_CATEGORIES = new Set<NarrativeQualitativeSignalCategory>(NARRATIVE_QUALITATIVE_SIGNAL_CATEGORIES);
const SIGNAL_CONFIDENCE_LEVELS = new Set<NarrativeQualitativeSignalConfidence>(["low", "medium", "high"]);
const SIGNAL_CLAIM_MODES = new Set<NarrativeQualitativeSignalClaimMode>([
  "observation",
  "interpretation",
  "assertion",
]);

interface NarrativeQualitativeSignalValidationContext {
  readonly knownIds?: ReadonlySet<string>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function createFailure(issues: readonly NarrativeValidationIssue[]): NarrativeValidationResult<NarrativeQualitativeSignal> {
  return { ok: false, issues };
}

function createSuccess(
  value: NarrativeQualitativeSignal,
  issues: readonly NarrativeValidationIssue[] = [],
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  return { ok: true, value, issues };
}

function validateForbiddenGradingFields(value: Record<string, unknown>, path = "$"): NarrativeValidationIssue[] {
  const issues: NarrativeValidationIssue[] = [];
  for (const key of ["score", "grade", "rating"] as const) {
    if (key in value) {
      issues.push({ path: `${path}.${key}`, message: `${key} is not allowed on qualitative signals.` });
    }
  }
  return issues;
}

export function validateNarrativeQualitativeSignal(
  value: unknown,
  context: NarrativeQualitativeSignalValidationContext = {},
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const issues: NarrativeValidationIssue[] = [];
  if (!isPlainObject(value)) {
    return createFailure([{ path: "$", message: "signal must be an object." }]);
  }

  issues.push(...validateForbiddenGradingFields(value));

  if (!isNonEmptyString(value.id)) {
    issues.push({ path: "$.id", message: "id must be a non-empty string." });
  }
  if (typeof value.category !== "string" || !SIGNAL_CATEGORIES.has(value.category as NarrativeQualitativeSignalCategory)) {
    issues.push({
      path: "$.category",
      message: "category must be one of contradiction, unresolved_gap, relationship_provenance, foreshadow_payoff, orphaned_assertion, sequence_reorder, scene_projection, or authored_inferred_boundary.",
    });
  }
  if (!isNonEmptyString(value.label)) {
    issues.push({ path: "$.label", message: "label must be a non-empty string." });
  }
  if (!isNonEmptyString(value.explanation)) {
    issues.push({ path: "$.explanation", message: "explanation must be a non-empty string." });
  }
  if (!isStringArray(value.relatedObjectIds) || value.relatedObjectIds.length === 0) {
    issues.push({ path: "$.relatedObjectIds", message: "relatedObjectIds must be a non-empty array of strings." });
  } else if (value.relatedObjectIds.some((entry) => entry.trim().length === 0)) {
    issues.push({ path: "$.relatedObjectIds", message: "relatedObjectIds must not include blank ids." });
  }

  if (context.knownIds && isStringArray(value.relatedObjectIds)) {
    for (const [index, id] of value.relatedObjectIds.entries()) {
      if (id.trim().length > 0 && !context.knownIds.has(id)) {
        issues.push({ path: `$.relatedObjectIds[${index}]`, message: `unknown referenced id: ${id}` });
      }
    }
  }

  const provenanceResult = validateNarrativeProvenance(value.provenance as NarrativeProvenance);
  if (!provenanceResult.ok) {
    issues.push(...provenanceResult.issues);
  }

  if (typeof value.confidence !== "string" || !SIGNAL_CONFIDENCE_LEVELS.has(value.confidence as NarrativeQualitativeSignalConfidence)) {
    issues.push({ path: "$.confidence", message: "confidence must be low, medium, or high." });
  }

  if (value.claimMode !== undefined) {
    if (typeof value.claimMode !== "string" || !SIGNAL_CLAIM_MODES.has(value.claimMode as NarrativeQualitativeSignalClaimMode)) {
      issues.push({ path: "$.claimMode", message: "claimMode must be observation, interpretation, or assertion." });
    } else if (value.claimMode === "assertion" && isPlainObject(value.provenance) && value.provenance.status !== "authored") {
      issues.push({
        path: "$.claimMode",
        message: "assertion-mode signals require authored provenance.",
      });
    }
  }

  if (issues.length > 0) {
    return createFailure(issues);
  }

  return createSuccess(value as unknown as NarrativeQualitativeSignal);
}
