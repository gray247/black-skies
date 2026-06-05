import type { NarrativeProvenance } from "./narrativeObjectContract";
import {
  collectNarrativeObjectIds,
  validateNarrativeObjectBundle,
  type NarrativeValidationIssue,
  type NarrativeValidationResult,
} from "./narrativeObjectValidation";
import {
  validateNarrativeQualitativeSignal,
} from "./narrativeQualitativeSignalValidation";
import type { NarrativeQualitativeSignal } from "./narrativeQualitativeSignals";
import type {
  NarrativeQualitativeFixtureCase,
  NarrativeQualitativeFixtureCategory,
} from "./narrativeQualitativeFixtures";

const SIGNAL_SOURCE = "static-qualitative-evaluator-v0";

const SIGNAL_CATEGORIES = new Set<NarrativeQualitativeFixtureCategory>([
  "contradiction",
  "unresolved_narrative_gap",
  "relationship_provenance",
  "foreshadow_payoff",
  "orphaned_assertion",
  "sequence_reorder",
  "scene_projection",
  "authored_vs_inferred_boundary",
]);

const SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY: Record<
  NarrativeQualitativeFixtureCategory,
  NarrativeQualitativeSignal["category"]
> = {
  contradiction: "contradiction",
  unresolved_narrative_gap: "unresolved_gap",
  relationship_provenance: "relationship_provenance",
  foreshadow_payoff: "foreshadow_payoff",
  orphaned_assertion: "orphaned_assertion",
  sequence_reorder: "sequence_reorder",
  scene_projection: "scene_projection",
  authored_vs_inferred_boundary: "authored_inferred_boundary",
};

const SIGNAL_CONFIDENCE_BY_CATEGORY: Record<
  NarrativeQualitativeFixtureCategory,
  NarrativeQualitativeSignal["confidence"]
> = {
  contradiction: "medium",
  unresolved_narrative_gap: "medium",
  relationship_provenance: "medium",
  foreshadow_payoff: "medium",
  orphaned_assertion: "low",
  sequence_reorder: "medium",
  scene_projection: "low",
  authored_vs_inferred_boundary: "medium",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKnownCategory(value: unknown): value is NarrativeQualitativeFixtureCategory {
  return typeof value === "string" && SIGNAL_CATEGORIES.has(value as NarrativeQualitativeFixtureCategory);
}

function createFailure<T>(issues: readonly NarrativeValidationIssue[]): NarrativeValidationResult<T> {
  return { ok: false, issues };
}

function createSuccess<T>(value: T): NarrativeValidationResult<T> {
  return { ok: true, value, issues: [] };
}

function prefixIssues(
  issues: readonly NarrativeValidationIssue[],
  pathPrefix: string,
): NarrativeValidationIssue[] {
  return issues.map((issue) => ({
    path: `${pathPrefix}${issue.path.slice(1)}`,
    message: issue.message,
  }));
}

function uniqueIds(...groups: readonly (readonly string[])[]): readonly string[] {
  const ids = new Set<string>();
  const ordered: string[] = [];

  for (const group of groups) {
    for (const id of group) {
      if (!ids.has(id)) {
        ids.add(id);
        ordered.push(id);
      }
    }
  }

  return ordered;
}

function createSignalProvenance(
  category: NarrativeQualitativeFixtureCategory,
  note: string,
): NarrativeProvenance {
  return {
    origin: "derived",
    status: "derived",
    confidence: "high",
    authorConfirmed: false,
    source: SIGNAL_SOURCE,
    note: `Static qualitative evaluator v0 derived from ${category} fixture data; ${note}`,
  };
}

function buildValidatedSignal(
  signal: NarrativeQualitativeSignal,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  return validateNarrativeQualitativeSignal(signal, { knownIds });
}

function createContradictionSignal(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const [firstAssertion, secondAssertion] = fixture.bundle.assertions;
  const relationship = fixture.bundle.relationships[0];

  if (!firstAssertion || !secondAssertion || !relationship) {
    return createFailure<NarrativeQualitativeSignal>([
      {
        path: "$.fixtures",
        message: "contradiction fixtures require two assertions and one contradiction relationship.",
      },
    ]);
  }

  const relatedObjectIds = uniqueIds([firstAssertion.id, secondAssertion.id, relationship.id]);
  return buildValidatedSignal(
    {
      id: `qual_signal_contradiction_${relationship.id}`,
      category: SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY[fixture.category],
      label: "Contradiction remains explicit",
      explanation: `Assertions ${firstAssertion.id} and ${secondAssertion.id} remain in conflict through relationship ${relationship.id} (${relationship.relationshipType}); the evaluator preserves both claims and does not resolve the contradiction.`,
      relatedObjectIds,
      provenance: createSignalProvenance(
        fixture.category,
        "both competing assertions remain visible without any truth-resolution claim.",
      ),
      confidence: SIGNAL_CONFIDENCE_BY_CATEGORY[fixture.category],
    },
    knownIds,
  );
}

function createUnresolvedGapSignal(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const gap = fixture.bundle.gaps[0];
  const relationship = fixture.bundle.relationships[0];

  if (!gap || !relationship) {
    return createFailure<NarrativeQualitativeSignal>([
      {
        path: "$.fixtures",
        message: "unresolved gap fixtures require one Narrative Gap and one supporting relationship.",
      },
    ]);
  }

  const relatedObjectIds = uniqueIds([
    gap.id,
    ...gap.startAnchorIds,
    ...gap.endAnchorIds,
    ...gap.relatedRelationshipIds,
    relationship.id,
  ]);
  return buildValidatedSignal(
    {
      id: `qual_signal_unresolved_gap_${gap.id}`,
      category: SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY[fixture.category],
      label: "Narrative gap remains unresolved",
      explanation: `Gap ${gap.id} stays explicit between anchors ${gap.startAnchorIds.join(", ")} and ${gap.endAnchorIds.join(", ")}; relationship ${relationship.id} acknowledges the boundary without filling the missing middle.`,
      relatedObjectIds,
      provenance: createSignalProvenance(
        fixture.category,
        "the missing bridge stays open rather than being inferred into existence.",
      ),
      confidence: SIGNAL_CONFIDENCE_BY_CATEGORY[fixture.category],
    },
    knownIds,
  );
}

function createRelationshipProvenanceSignal(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const relationship = fixture.bundle.relationships[0];

  if (!relationship) {
    return createFailure<NarrativeQualitativeSignal>([
      {
        path: "$.fixtures",
        message: "relationship provenance fixtures require one relationship.",
      },
    ]);
  }

  const relatedObjectIds = uniqueIds([relationship.id, relationship.sourceId, relationship.targetId]);
  return buildValidatedSignal(
    {
      id: `qual_signal_relationship_provenance_${relationship.id}`,
      category: SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY[fixture.category],
      label: "Relationship provenance stays explicit",
      explanation: `Relationship ${relationship.id} links ${relationship.sourceId} to ${relationship.targetId} as ${relationship.relationshipType}/${relationship.category}; provenance remains ${relationship.provenance.status} and is not reclassified.`,
      relatedObjectIds,
      provenance: createSignalProvenance(
        fixture.category,
        "the relationship is described as provenance-bearing rather than authorial status.",
      ),
      confidence: SIGNAL_CONFIDENCE_BY_CATEGORY[fixture.category],
    },
    knownIds,
  );
}

function createForeshadowPayoffSignal(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const [setupAssertion, payoffAssertion, bucketAssertion] = fixture.bundle.assertions;
  const [foreshadowRelationship, payoffRelationship] = fixture.bundle.relationships;

  if (!setupAssertion || !payoffAssertion || !bucketAssertion || !foreshadowRelationship || !payoffRelationship) {
    return createFailure<NarrativeQualitativeSignal>([
      {
        path: "$.fixtures",
        message: "foreshadow/payoff fixtures require three assertions and two relationships.",
      },
    ]);
  }

  const relatedObjectIds = uniqueIds([
    setupAssertion.id,
    payoffAssertion.id,
    bucketAssertion.id,
    foreshadowRelationship.id,
    payoffRelationship.id,
  ]);
  return buildValidatedSignal(
    {
      id: `qual_signal_foreshadow_payoff_${foreshadowRelationship.id}`,
      category: SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY[fixture.category],
      label: "Foreshadow/payoff chain remains explicit",
      explanation: `Relationships ${foreshadowRelationship.id} and ${payoffRelationship.id} connect setup ${setupAssertion.id} to payoff ${payoffAssertion.id} and onward to ${bucketAssertion.id}; the evaluator uses relationship structure, not prose parsing, to preserve the chain.`,
      relatedObjectIds,
      provenance: createSignalProvenance(
        fixture.category,
        "the setup/payoff chain is preserved as relationship structure rather than a verdict.",
      ),
      confidence: SIGNAL_CONFIDENCE_BY_CATEGORY[fixture.category],
    },
    knownIds,
  );
}

function createOrphanedAssertionSignal(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const assertion = fixture.bundle.assertions[0];

  if (!assertion) {
    return createFailure<NarrativeQualitativeSignal>([
      {
        path: "$.fixtures",
        message: "orphaned assertion fixtures require one assertion.",
      },
    ]);
  }

  const relatedObjectIds = uniqueIds([assertion.id]);
  return buildValidatedSignal(
    {
      id: `qual_signal_orphaned_assertion_${assertion.id}`,
      category: SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY[fixture.category],
      label: "Standalone assertion remains unplaced",
      explanation: `Assertion ${assertion.id} exists without Story Unit or Scene ownership; the evaluator does not invent either.`,
      relatedObjectIds,
      provenance: createSignalProvenance(
        fixture.category,
        "the assertion remains standalone without any invented placement authority.",
      ),
      confidence: SIGNAL_CONFIDENCE_BY_CATEGORY[fixture.category],
    },
    knownIds,
  );
}

function createSequenceReorderSignal(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const comparisonBundle = fixture.comparisonBundle;
  const chapter = fixture.bundle.chapters[0];
  const firstScene = fixture.bundle.scenes[0];
  const relationship = fixture.bundle.relationships[0];

  if (!comparisonBundle || !chapter || !firstScene || !relationship) {
    return createFailure<NarrativeQualitativeSignal>([
      {
        path: "$.fixtures",
        message: "sequence reorder fixtures require a comparison bundle, a chapter, at least one scene, and one relationship.",
      },
    ]);
  }

  const relatedObjectIds = uniqueIds(
    [...collectNarrativeObjectIds(fixture.bundle)],
    [...collectNarrativeObjectIds(comparisonBundle)],
  );
  const comparisonSceneOrders = comparisonBundle.scenes.map((scene) => scene.order).join(", ");
  const baselineSceneOrders = fixture.bundle.scenes.map((scene) => scene.order).join(", ");
  return buildValidatedSignal(
    {
      id: `qual_signal_sequence_reorder_${chapter.id}`,
      category: SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY[fixture.category],
      label: "Sequence reorder preserves durable ids",
      explanation: `Baseline scene order ${baselineSceneOrders} and comparison scene order ${comparisonSceneOrders} keep the same durable ids across reordered presentation; relationship ${relationship.id} retains identity while context changes.`,
      relatedObjectIds,
      provenance: createSignalProvenance(
        fixture.category,
        "the comparison bundle is used only as a read-only ordering comparison.",
      ),
      confidence: SIGNAL_CONFIDENCE_BY_CATEGORY[fixture.category],
    },
    knownIds,
  );
}

function createSceneProjectionSignal(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const storyUnit = fixture.bundle.storyUnits[0];
  const scene = fixture.bundle.scenes[0];
  const chapter = fixture.bundle.chapters[0];

  if (!storyUnit || !scene || !chapter) {
    return createFailure<NarrativeQualitativeSignal>([
      {
        path: "$.fixtures",
        message: "scene projection fixtures require one story unit, one scene, and one chapter.",
      },
    ]);
  }

  const relatedObjectIds = uniqueIds([storyUnit.id, scene.id, chapter.id]);
  return buildValidatedSignal(
    {
      id: `qual_signal_scene_projection_${scene.id}`,
      category: SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY[fixture.category],
      label: "Scene projection remains read-only",
      explanation: `Derived scene ${scene.id}, story unit ${storyUnit.id}, and chapter ${chapter.id} remain a read-only projection; the evaluator does not parse draft text into assertions or mutate ids or order.`,
      relatedObjectIds,
      provenance: createSignalProvenance(
        fixture.category,
        "the projection stays derived and does not claim persistence or extraction authority.",
      ),
      confidence: SIGNAL_CONFIDENCE_BY_CATEGORY[fixture.category],
    },
    knownIds,
  );
}

function createAuthoredInferredBoundarySignal(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  const storyUnit = fixture.bundle.storyUnits[0];
  const relationship = fixture.bundle.relationships[0];

  if (!storyUnit || !relationship) {
    return createFailure<NarrativeQualitativeSignal>([
      {
        path: "$.fixtures",
        message: "authored/inferred boundary fixtures require one inferred story unit and one inferred relationship.",
      },
    ]);
  }

  const relatedObjectIds = uniqueIds([
    ...fixture.bundle.assertions.map((assertion) => assertion.id),
    storyUnit.id,
    relationship.id,
  ]);
  return buildValidatedSignal(
    {
      id: `qual_signal_authored_inferred_boundary_${storyUnit.id}`,
      category: SIGNAL_CATEGORIES_TO_SIGNAL_CATEGORY[fixture.category],
      label: "Authored and inferred provenance stay separated",
      explanation: `Authored assertions ${fixture.bundle.assertions.map((assertion) => assertion.id).join(", ")} stay authored while inferred story unit ${storyUnit.id} and relationship ${relationship.id} remain explicitly inferred; the evaluator keeps the inferred provenance separate.`,
      relatedObjectIds,
      provenance: createSignalProvenance(
        fixture.category,
        "mixed provenance stays explicit without converting inferred data into authored status.",
      ),
      confidence: SIGNAL_CONFIDENCE_BY_CATEGORY[fixture.category],
    },
    knownIds,
  );
}

function createSignalForFixture(
  fixture: NarrativeQualitativeFixtureCase,
  knownIds: ReadonlySet<string>,
): NarrativeValidationResult<NarrativeQualitativeSignal> {
  switch (fixture.category) {
    case "contradiction":
      return createContradictionSignal(fixture, knownIds);
    case "unresolved_narrative_gap":
      return createUnresolvedGapSignal(fixture, knownIds);
    case "relationship_provenance":
      return createRelationshipProvenanceSignal(fixture, knownIds);
    case "foreshadow_payoff":
      return createForeshadowPayoffSignal(fixture, knownIds);
    case "orphaned_assertion":
      return createOrphanedAssertionSignal(fixture, knownIds);
    case "sequence_reorder":
      return createSequenceReorderSignal(fixture, knownIds);
    case "scene_projection":
      return createSceneProjectionSignal(fixture, knownIds);
    case "authored_vs_inferred_boundary":
      return createAuthoredInferredBoundarySignal(fixture, knownIds);
    default:
      return createFailure<NarrativeQualitativeSignal>([
        {
          path: "$.category",
          message: "unknown qualitative fixture category.",
        },
      ]);
  }
}

export function evaluateStaticQualitativeFixtures(
  fixtures: readonly NarrativeQualitativeFixtureCase[],
): NarrativeValidationResult<readonly NarrativeQualitativeSignal[]> {
  if (!Array.isArray(fixtures)) {
    return createFailure<readonly NarrativeQualitativeSignal[]>([{ path: "$", message: "fixtures must be an array." }]);
  }

  const issues: NarrativeValidationIssue[] = [];
  const signals: NarrativeQualitativeSignal[] = [];

  for (const [index, fixture] of fixtures.entries()) {
    const fixturePath = `$.fixtures[${index}]`;

    if (!isPlainObject(fixture) || !isKnownCategory((fixture as Record<string, unknown>).category)) {
      issues.push({
        path: `${fixturePath}.category`,
        message: "unknown qualitative fixture category.",
      });
      continue;
    }

    const typedFixture = fixture as unknown as NarrativeQualitativeFixtureCase;

    const bundleResult = validateNarrativeObjectBundle(typedFixture.bundle);
    if (!bundleResult.ok) {
      issues.push(...prefixIssues(bundleResult.issues, `${fixturePath}.bundle`));
      continue;
    }

    if (typedFixture.comparisonBundle !== undefined) {
      const comparisonResult = validateNarrativeObjectBundle(typedFixture.comparisonBundle);
      if (!comparisonResult.ok) {
        issues.push(...prefixIssues(comparisonResult.issues, `${fixturePath}.comparisonBundle`));
        continue;
      }
    }

    const knownIds = new Set<string>([
      ...collectNarrativeObjectIds(typedFixture.bundle),
      ...(typedFixture.comparisonBundle ? [...collectNarrativeObjectIds(typedFixture.comparisonBundle)] : []),
    ]);

    const signalResult = createSignalForFixture(typedFixture, knownIds);
    if (!signalResult.ok) {
      issues.push(...prefixIssues(signalResult.issues, `${fixturePath}.signal`));
      continue;
    }

    const validationResult = validateNarrativeQualitativeSignal(signalResult.value, { knownIds });
    if (!validationResult.ok) {
      issues.push(...prefixIssues(validationResult.issues, `${fixturePath}.signal`));
      continue;
    }

    signals.push(validationResult.value);
  }

  if (issues.length > 0) {
    return createFailure<readonly NarrativeQualitativeSignal[]>(issues);
  }

  return createSuccess(signals);
}
