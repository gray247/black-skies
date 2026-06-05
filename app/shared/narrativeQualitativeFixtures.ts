import type {
  NarrativeAssertion,
  NarrativeChapter,
  NarrativeConfidence,
  NarrativeGap,
  NarrativeLifecycle,
  NarrativeLineage,
  NarrativeObjectBundle,
  NarrativeProvenance,
  NarrativeRelationship,
  NarrativeScene,
  StoryUnit,
} from "./narrativeObjectContract";

export type NarrativeQualitativeFixtureCategory =
  | "contradiction"
  | "unresolved_narrative_gap"
  | "relationship_provenance"
  | "foreshadow_payoff"
  | "orphaned_assertion"
  | "sequence_reorder"
  | "scene_projection"
  | "authored_vs_inferred_boundary";

export interface NarrativeQualitativeFixtureCase {
  readonly category: NarrativeQualitativeFixtureCategory;
  readonly bundle: NarrativeObjectBundle;
  readonly comparisonBundle?: NarrativeObjectBundle;
  readonly expectedFutureSignals: readonly string[];
  readonly provenanceBoundaries: readonly string[];
  readonly mustNotOverclaim: readonly string[];
}

const authoredTimestamp = "2026-06-05T00:00:00Z";

function createProvenance(
  origin: NarrativeProvenance["origin"],
  status: NarrativeProvenance["status"],
  confidence: NarrativeConfidence,
  authorConfirmed: boolean,
  source: string,
  note: string,
): NarrativeProvenance {
  return {
    origin,
    status,
    confidence,
    authorConfirmed,
    source,
    note,
  };
}

function createLifecycle(state: NarrativeLifecycle["state"]): NarrativeLifecycle {
  return {
    state,
    createdAt: authoredTimestamp,
    updatedAt: authoredTimestamp,
    archivedAt: null,
  };
}

function createLineage(
  originId: string,
  parentIds: readonly string[] = [],
  childIds: readonly string[] = [],
  branchId: string | null = null,
): NarrativeLineage {
  return {
    originId,
    parentIds,
    mergedFromIds: [],
    splitFromId: null,
    promotedFromId: null,
    supersededById: null,
    childIds,
    branchId,
  };
}

function createAssertion(params: {
  readonly id: string;
  readonly text: string;
  readonly tags: readonly string[];
  readonly provenance: NarrativeProvenance;
  readonly lifecycle?: NarrativeLifecycle;
  readonly sceneId?: string | null;
  readonly lineage?: NarrativeLineage;
}): NarrativeAssertion {
  return {
    id: params.id,
    kind: "narrative_assertion",
    text: params.text,
    normalizedText: params.text,
    sceneId: params.sceneId ?? null,
    tags: params.tags,
    provenance: params.provenance,
    lifecycle: params.lifecycle ?? authoredLifecycle,
    lineage: params.lineage ?? createLineage(params.id),
  };
}

function createStoryUnit(params: {
  readonly id: string;
  readonly title: string;
  readonly assertionIds: readonly string[];
  readonly anchorAssertionIds: readonly string[];
  readonly order: number;
  readonly provenance: NarrativeProvenance;
  readonly lifecycle?: NarrativeLifecycle;
  readonly sceneCandidateId?: string | null;
  readonly sceneId?: string | null;
  readonly lineage?: NarrativeLineage;
}): StoryUnit {
  return {
    id: params.id,
    kind: "story_unit",
    title: params.title,
    assertionIds: params.assertionIds,
    anchorAssertionIds: params.anchorAssertionIds,
    order: params.order,
    sceneCandidateId: params.sceneCandidateId ?? null,
    sceneId: params.sceneId ?? null,
    provenance: params.provenance,
    lifecycle: params.lifecycle ?? authoredLifecycle,
    lineage: params.lineage ?? createLineage(params.id),
  };
}

function createGap(params: {
  readonly id: string;
  readonly description: string;
  readonly startAnchorIds: readonly string[];
  readonly endAnchorIds: readonly string[];
  readonly relatedRelationshipIds: readonly string[];
  readonly provenance: NarrativeProvenance;
  readonly lifecycle?: NarrativeLifecycle;
  readonly lineage?: NarrativeLineage;
}): NarrativeGap {
  return {
    id: params.id,
    kind: "narrative_gap",
    description: params.description,
    startAnchorIds: params.startAnchorIds,
    endAnchorIds: params.endAnchorIds,
    relatedRelationshipIds: params.relatedRelationshipIds,
    provenance: params.provenance,
    lifecycle: params.lifecycle ?? authoredLifecycle,
    lineage: params.lineage ?? createLineage(params.id),
  };
}

function createRelationship(params: {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationshipType: NarrativeRelationship["relationshipType"];
  readonly category: NarrativeRelationship["category"];
  readonly description: string | null;
  readonly provenance: NarrativeProvenance;
  readonly lifecycle?: NarrativeLifecycle;
  readonly lineage?: NarrativeLineage;
}): NarrativeRelationship {
  return {
    id: params.id,
    kind: "narrative_relationship",
    sourceId: params.sourceId,
    targetId: params.targetId,
    relationshipType: params.relationshipType,
    category: params.category,
    description: params.description,
    provenance: params.provenance,
    lifecycle: params.lifecycle ?? authoredLifecycle,
    lineage: params.lineage ?? createLineage(params.id, [params.sourceId, params.targetId]),
  };
}

function createScene(params: {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly chapterId: string | null;
  readonly assertionIds: readonly string[];
  readonly storyUnitIds: readonly string[];
  readonly draftText: string | null;
  readonly provenance: NarrativeProvenance;
  readonly lifecycle?: NarrativeLifecycle;
  readonly lineage?: NarrativeLineage;
}): NarrativeScene {
  return {
    id: params.id,
    kind: "scene",
    title: params.title,
    order: params.order,
    chapterId: params.chapterId,
    assertionIds: params.assertionIds,
    storyUnitIds: params.storyUnitIds,
    draftText: params.draftText,
    provenance: params.provenance,
    lifecycle: params.lifecycle ?? authoredLifecycle,
    lineage: params.lineage ?? createLineage(params.id, [], [...params.storyUnitIds]),
  };
}

function createChapter(params: {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly sceneIds: readonly string[];
  readonly provenance: NarrativeProvenance;
  readonly lifecycle?: NarrativeLifecycle;
  readonly lineage?: NarrativeLineage;
}): NarrativeChapter {
  return {
    id: params.id,
    kind: "chapter",
    title: params.title,
    order: params.order,
    sceneIds: params.sceneIds,
    provenance: params.provenance,
    lifecycle: params.lifecycle ?? authoredLifecycle,
    lineage: params.lineage ?? createLineage(params.id, [...params.sceneIds]),
  };
}

const authoredProvenance = createProvenance(
  "author",
  "authored",
  "high",
  true,
  "manual-qualitative-fixture",
  "Manually authored qualitative fixture.",
);

const inferredProvenance = createProvenance(
  "system",
  "inferred",
  "medium",
  false,
  "manual-qualitative-fixture",
  "Explicitly inferred qualitative fixture boundary.",
);

const derivedProvenance = createProvenance(
  "derived",
  "derived",
  "high",
  false,
  "scene-projection-fixture",
  "Read-only scene projection fixture.",
);

const authoredLifecycle = createLifecycle("active");
const candidateLifecycle = createLifecycle("candidate");
const derivedLifecycle: NarrativeLifecycle = {
  state: "active",
  createdAt: null,
  updatedAt: null,
  archivedAt: null,
};

const contradictionAssertionA = createAssertion({
  id: "qual_contradiction_lantern_lit",
  text: "The lantern was lit at midnight.",
  tags: ["lantern", "light", "midnight"],
  provenance: authoredProvenance,
});

const contradictionAssertionB = createAssertion({
  id: "qual_contradiction_lantern_dark",
  text: "The lantern was dark at midnight.",
  tags: ["lantern", "darkness", "midnight"],
  provenance: authoredProvenance,
});

const contradictionRelationship = createRelationship({
  id: "qual_rel_contradiction_lantern",
  sourceId: contradictionAssertionA.id,
  targetId: contradictionAssertionB.id,
  relationshipType: "contradicts",
  category: "narrative",
  description: "Competing midnight lantern assertions remain unresolved.",
  provenance: authoredProvenance,
  lineage: createLineage(
    "qual_rel_contradiction_lantern",
    [contradictionAssertionA.id, contradictionAssertionB.id],
    [],
    "branch_contradiction_lantern",
  ),
});

const gapDepartureAssertion = createAssertion({
  id: "qual_gap_departure",
  text: "Mara left the station.",
  tags: ["mara", "departure", "station"],
  provenance: authoredProvenance,
});

const gapArrivalAssertion = createAssertion({
  id: "qual_gap_arrival",
  text: "Mara arrived at the motel.",
  tags: ["mara", "arrival", "motel"],
  provenance: authoredProvenance,
});

const gapRelationship = createRelationship({
  id: "qual_rel_gap_route",
  sourceId: gapDepartureAssertion.id,
  targetId: gapArrivalAssertion.id,
  relationshipType: "continues",
  category: "narrative",
  description: "The route is acknowledged but not explained.",
  provenance: inferredProvenance,
  lifecycle: candidateLifecycle,
  lineage: createLineage(
    "qual_rel_gap_route",
    [gapDepartureAssertion.id, gapArrivalAssertion.id],
    [],
    "branch_gap_route",
  ),
});

const unresolvedGap = createGap({
  id: "qual_gap_station_to_motel",
  description: "The travel interval between departure and arrival remains unfilled.",
  startAnchorIds: [gapDepartureAssertion.id],
  endAnchorIds: [gapArrivalAssertion.id],
  relatedRelationshipIds: [gapRelationship.id],
  provenance: inferredProvenance,
  lifecycle: candidateLifecycle,
  lineage: createLineage(
    "qual_gap_station_to_motel",
    [gapDepartureAssertion.id, gapArrivalAssertion.id],
  ),
});

const relationshipSourceAssertion = createAssertion({
  id: "qual_relationship_key_found",
  text: "Nico found the brass key.",
  tags: ["nico", "key", "discovery"],
  provenance: authoredProvenance,
});

const relationshipTargetAssertion = createAssertion({
  id: "qual_relationship_cellar_opened",
  text: "Nico opened the cellar door.",
  tags: ["nico", "cellar", "opening"],
  provenance: authoredProvenance,
});

const provenanceRelationship = createRelationship({
  id: "qual_rel_key_supports_opening",
  sourceId: relationshipSourceAssertion.id,
  targetId: relationshipTargetAssertion.id,
  relationshipType: "supports",
  category: "inferred",
  description: "The key finding supports the cellar opening.",
  provenance: inferredProvenance,
  lifecycle: candidateLifecycle,
  lineage: createLineage(
    "qual_rel_key_supports_opening",
    [relationshipSourceAssertion.id, relationshipTargetAssertion.id],
    [],
    "branch_relationship_provenance",
  ),
});

const foreshadowSetupAssertion = createAssertion({
  id: "qual_foreshadow_rain_air",
  text: "The air smelled of rain.",
  tags: ["weather", "setup", "rain"],
  provenance: authoredProvenance,
});

const foreshadowPayoffAssertion = createAssertion({
  id: "qual_foreshadow_roof_leak",
  text: "The roof had been leaking for hours.",
  tags: ["roof", "leak", "payoff"],
  provenance: authoredProvenance,
});

const foreshadowBucketAssertion = createAssertion({
  id: "qual_foreshadow_bucket",
  text: "A bucket sat under the drip.",
  tags: ["bucket", "drip", "payoff"],
  provenance: authoredProvenance,
});

const foreshadowRelationship = createRelationship({
  id: "qual_rel_rain_foreshadows_leak",
  sourceId: foreshadowSetupAssertion.id,
  targetId: foreshadowPayoffAssertion.id,
  relationshipType: "foreshadows",
  category: "narrative",
  description: "The weather setup foreshadows the roof leak reveal.",
  provenance: authoredProvenance,
  lineage: createLineage(
    "qual_rel_rain_foreshadows_leak",
    [foreshadowSetupAssertion.id, foreshadowPayoffAssertion.id],
  ),
});

const payoffRelationship = createRelationship({
  id: "qual_rel_leak_pays_off_bucket",
  sourceId: foreshadowPayoffAssertion.id,
  targetId: foreshadowBucketAssertion.id,
  relationshipType: "pays_off",
  category: "narrative",
  description: "The roof leak pays off the bucket placement.",
  provenance: authoredProvenance,
  lineage: createLineage(
    "qual_rel_leak_pays_off_bucket",
    [foreshadowPayoffAssertion.id, foreshadowBucketAssertion.id],
  ),
});

const orphanedAssertion = createAssertion({
  id: "qual_orphan_red_umbrella",
  text: "The red umbrella was missing.",
  tags: ["umbrella", "missing", "object"],
  provenance: authoredProvenance,
});

function createSequenceBundle(params: {
  readonly sceneOrder: readonly [number, number];
  readonly storyUnitOrder: readonly [number, number];
  readonly chapterSceneIds: readonly [string, string];
  readonly relationshipDescription: string;
}): NarrativeObjectBundle {
  const firstAssertion = createAssertion({
    id: "qual_sequence_train_arrives",
    text: "The train arrived at dawn.",
    tags: ["train", "dawn", "arrival"],
    provenance: authoredProvenance,
  });

  const secondAssertion = createAssertion({
    id: "qual_sequence_clock_strikes",
    text: "The station clock struck six.",
    tags: ["clock", "station", "time"],
    provenance: authoredProvenance,
  });

  const thirdAssertion = createAssertion({
    id: "qual_sequence_letter_waiting",
    text: "A letter was waiting on the bench.",
    tags: ["letter", "bench", "discovery"],
    provenance: authoredProvenance,
  });

  const firstStoryUnit = createStoryUnit({
    id: "qual_sequence_dawn_arrival",
    title: "Dawn arrival",
    assertionIds: [firstAssertion.id, secondAssertion.id],
    anchorAssertionIds: [firstAssertion.id],
    order: params.storyUnitOrder[0],
    provenance: authoredProvenance,
    lineage: createLineage(
      "qual_sequence_dawn_arrival",
      [firstAssertion.id, secondAssertion.id],
      [],
      "branch_sequence_reorder",
    ),
  });

  const secondStoryUnit = createStoryUnit({
    id: "qual_sequence_bench_letter",
    title: "Bench letter",
    assertionIds: [thirdAssertion.id],
    anchorAssertionIds: [thirdAssertion.id],
    order: params.storyUnitOrder[1],
    provenance: authoredProvenance,
    lineage: createLineage(
      "qual_sequence_bench_letter",
      [thirdAssertion.id],
      [],
      "branch_sequence_reorder",
    ),
  });

  const sequenceRelationship = createRelationship({
    id: "qual_rel_sequence_arrival_to_letter",
    sourceId: firstAssertion.id,
    targetId: thirdAssertion.id,
    relationshipType: "continues",
    category: "narrative",
    description: params.relationshipDescription,
    provenance: authoredProvenance,
    lineage: createLineage(
      "qual_rel_sequence_arrival_to_letter",
      [firstAssertion.id, thirdAssertion.id],
      [],
      "branch_sequence_reorder",
    ),
  });

  const firstScene = createScene({
    id: "qual_scene_dawn_platform",
    title: "Dawn Platform",
    order: params.sceneOrder[0],
    chapterId: "qual_chapter_morning_sequence",
    assertionIds: [firstAssertion.id, secondAssertion.id],
    storyUnitIds: [firstStoryUnit.id],
    draftText: "The train arrived at dawn. The station clock struck six.",
    provenance: authoredProvenance,
    lineage: createLineage(
      "qual_scene_dawn_platform",
      [firstStoryUnit.id],
      [],
      "branch_sequence_reorder",
    ),
  });

  const secondScene = createScene({
    id: "qual_scene_bench_letter",
    title: "Bench Letter",
    order: params.sceneOrder[1],
    chapterId: "qual_chapter_morning_sequence",
    assertionIds: [thirdAssertion.id],
    storyUnitIds: [secondStoryUnit.id],
    draftText: "A letter was waiting on the bench.",
    provenance: authoredProvenance,
    lineage: createLineage(
      "qual_scene_bench_letter",
      [secondStoryUnit.id],
      [],
      "branch_sequence_reorder",
    ),
  });

  const chapter = createChapter({
    id: "qual_chapter_morning_sequence",
    title: "Morning Sequence",
    order: 1,
    sceneIds: [...params.chapterSceneIds],
    provenance: authoredProvenance,
    lineage: createLineage(
      "qual_chapter_morning_sequence",
      [...params.chapterSceneIds],
      [],
      "branch_sequence_reorder",
    ),
  });

  return {
    assertions: [firstAssertion, secondAssertion, thirdAssertion],
    storyUnits: [firstStoryUnit, secondStoryUnit],
    gaps: [],
    relationships: [sequenceRelationship],
    scenes: [firstScene, secondScene],
    chapters: [chapter],
  };
}

const sequenceBaselineBundle = createSequenceBundle({
  sceneOrder: [1, 2],
  storyUnitOrder: [1, 2],
  chapterSceneIds: ["qual_scene_dawn_platform", "qual_scene_bench_letter"],
  relationshipDescription: "The arrival sequence leads into the bench discovery.",
});

const sequenceReorderedBundle = createSequenceBundle({
  sceneOrder: [2, 1],
  storyUnitOrder: [2, 1],
  chapterSceneIds: ["qual_scene_bench_letter", "qual_scene_dawn_platform"],
  relationshipDescription: "The same ordered claims now sit in a reversed presentation.",
});

const projectionStoryUnit = createStoryUnit({
  id: "qual_projection_market_story_unit",
  title: "Read-only market projection",
  assertionIds: [],
  anchorAssertionIds: [],
  order: 1,
  sceneId: "qual_projection_market_scene",
  provenance: derivedProvenance,
  lifecycle: derivedLifecycle,
  lineage: createLineage(
    "qual_projection_market_story_unit",
    ["qual_projection_market_scene"],
    [],
  ),
});

const projectionScene = createScene({
  id: "qual_projection_market_scene",
  title: "Market at Dusk",
  order: 1,
  chapterId: "qual_projection_market_chapter",
  assertionIds: [],
  storyUnitIds: [projectionStoryUnit.id],
  draftText: "The market closed at dusk without extracting any narrative assertions.",
  provenance: derivedProvenance,
  lifecycle: derivedLifecycle,
  lineage: createLineage(
    "qual_projection_market_scene",
    [],
    [projectionStoryUnit.id],
  ),
});

const projectionChapter = createChapter({
  id: "qual_projection_market_chapter",
  title: "Read-only Projection",
  order: 1,
  sceneIds: [projectionScene.id],
  provenance: derivedProvenance,
  lifecycle: derivedLifecycle,
  lineage: createLineage(
    "qual_projection_market_chapter",
    [projectionScene.id],
    [],
  ),
});

const boundaryAuthoredAssertion = createAssertion({
  id: "qual_boundary_archive_key",
  text: "The archive key sat on the table.",
  tags: ["archive", "key", "table"],
  provenance: authoredProvenance,
});

const boundaryContextAssertion = createAssertion({
  id: "qual_boundary_room_searched",
  text: "The room had already been searched.",
  tags: ["room", "searched", "context"],
  provenance: authoredProvenance,
});

const boundaryInferredStoryUnit = createStoryUnit({
  id: "qual_boundary_inferred_cluster",
  title: "Archive key cluster",
  assertionIds: [boundaryAuthoredAssertion.id, boundaryContextAssertion.id],
  anchorAssertionIds: [boundaryAuthoredAssertion.id],
  order: 1,
  provenance: inferredProvenance,
  lifecycle: candidateLifecycle,
  lineage: createLineage(
    "qual_boundary_inferred_cluster",
    [boundaryAuthoredAssertion.id, boundaryContextAssertion.id],
    [],
    "branch_authored_vs_inferred",
  ),
});

const boundaryInferredRelationship = createRelationship({
  id: "qual_rel_boundary_supports",
  sourceId: boundaryAuthoredAssertion.id,
  targetId: boundaryContextAssertion.id,
  relationshipType: "supports",
  category: "inferred",
  description: "The archive key and room-search context are linked as an inferred cluster.",
  provenance: inferredProvenance,
  lifecycle: candidateLifecycle,
  lineage: createLineage(
    "qual_rel_boundary_supports",
    [boundaryAuthoredAssertion.id, boundaryContextAssertion.id],
    [],
    "branch_authored_vs_inferred",
  ),
});

export const NARRATIVE_QUALITATIVE_FIXTURES: readonly NarrativeQualitativeFixtureCase[] = [
  {
    category: "contradiction",
    bundle: {
      assertions: [contradictionAssertionA, contradictionAssertionB],
      storyUnits: [],
      gaps: [],
      relationships: [contradictionRelationship],
      scenes: [],
      chapters: [],
    },
    expectedFutureSignals: ["contradiction-pair", "competing-assertions", "unresolved-conflict"],
    provenanceBoundaries: [
      "both assertions remain manually authored",
      "the contradiction link is explicit and not inferred from prose",
    ],
    mustNotOverclaim: [
      "do not resolve the conflict automatically",
      "do not collapse the assertions into one truth",
    ],
  },
  {
    category: "unresolved_narrative_gap",
    bundle: {
      assertions: [gapDepartureAssertion, gapArrivalAssertion],
      storyUnits: [],
      gaps: [unresolvedGap],
      relationships: [gapRelationship],
      scenes: [],
      chapters: [],
    },
    expectedFutureSignals: ["unresolved-middle", "missing-bridge", "gap-between-anchors"],
    provenanceBoundaries: [
      "the anchors are manually authored assertions",
      "the gap remains explicit, unresolved, and separately labeled",
    ],
    mustNotOverclaim: [
      "do not fill the missing middle",
      "do not mark the gap resolved",
    ],
  },
  {
    category: "relationship_provenance",
    bundle: {
      assertions: [relationshipSourceAssertion, relationshipTargetAssertion],
      storyUnits: [],
      gaps: [],
      relationships: [provenanceRelationship],
      scenes: [],
      chapters: [],
    },
    expectedFutureSignals: ["typed-relationship-provenance", "directional-link", "source-target-boundary"],
    provenanceBoundaries: [
      "source and target assertions remain authored",
      "the relationship itself stays explicitly inferred",
    ],
    mustNotOverclaim: [
      "do not treat the inferred relationship as authored truth",
      "do not infer stronger certainty than the provenance states",
    ],
  },
  {
    category: "foreshadow_payoff",
    bundle: {
      assertions: [
        foreshadowSetupAssertion,
        foreshadowPayoffAssertion,
        foreshadowBucketAssertion,
      ],
      storyUnits: [],
      gaps: [],
      relationships: [foreshadowRelationship, payoffRelationship],
      scenes: [],
      chapters: [],
    },
    expectedFutureSignals: ["setup-payoff-chain", "explicit-relationship-link", "anticipation-to-reveal"],
    provenanceBoundaries: [
      "setup and payoff are linked by explicit relationships",
      "no prose parsing is required to see the setup/payoff connection",
    ],
    mustNotOverclaim: [
      "do not convert the link into a verdict",
      "do not claim the setup guarantees a specific outcome",
    ],
  },
  {
    category: "orphaned_assertion",
    bundle: {
      assertions: [orphanedAssertion],
      storyUnits: [],
      gaps: [],
      relationships: [],
      scenes: [],
      chapters: [],
    },
    expectedFutureSignals: ["orphaned-assertion", "unplaced-claim", "standalone-boundary"],
    provenanceBoundaries: [
      "a standalone assertion may exist without scene or story-unit ownership",
      "no surrounding structure is invented for the orphaned claim",
    ],
    mustNotOverclaim: [
      "do not invent a scene for the assertion",
      "do not promote the assertion into a cluster",
    ],
  },
  {
    category: "sequence_reorder",
    bundle: sequenceBaselineBundle,
    comparisonBundle: sequenceReorderedBundle,
    expectedFutureSignals: ["stable-ids-across-reorder", "order-sensitive-context", "presentation-variant"],
    provenanceBoundaries: [
      "the durable ids stay the same across reorder variants",
      "order and relationship context can change without rewriting the claims",
    ],
    mustNotOverclaim: [
      "do not rewrite ids when presentation order changes",
      "do not mutate the prose to simulate a reorder",
    ],
  },
  {
    category: "scene_projection",
    bundle: {
      assertions: [],
      storyUnits: [projectionStoryUnit],
      gaps: [],
      relationships: [],
      scenes: [projectionScene],
      chapters: [projectionChapter],
    },
    expectedFutureSignals: ["read-only-scene-projection", "derived-view", "projection-boundary"],
    provenanceBoundaries: [
      "scene and story unit are derived read-only projections",
      "the projection does not claim persistence authority",
    ],
    mustNotOverclaim: [
      "do not treat the projection as migration authority",
      "do not extract assertions from the scene draft text",
    ],
  },
  {
    category: "authored_vs_inferred_boundary",
    bundle: {
      assertions: [boundaryAuthoredAssertion, boundaryContextAssertion],
      storyUnits: [boundaryInferredStoryUnit],
      gaps: [],
      relationships: [boundaryInferredRelationship],
      scenes: [],
      chapters: [],
    },
    expectedFutureSignals: ["authored-vs-inferred-boundary", "explicit-provenance-separation", "mixed-authorship"],
    provenanceBoundaries: [
      "authored and inferred objects stay labeled distinctly",
      "inferred objects do not become authored without explicit user action",
    ],
    mustNotOverclaim: [
      "do not relabel inferred objects as authored",
      "do not erase explicit provenance",
    ],
  },
];
