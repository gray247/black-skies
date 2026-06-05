import type { LoadedProject, SceneDraftMetadata } from "./ipc/projectLoader";
import type {
  NarrativeAssertion,
  NarrativeChapter,
  NarrativeConfidence,
  NarrativeGap,
  NarrativeLifecycle,
  NarrativeObjectBundle,
  NarrativeProvenance,
  NarrativeRelationship,
  NarrativeScene,
  StoryUnit,
} from "./narrativeObjectContract";
import { validateNarrativeObjectBundle, type NarrativeValidationIssue } from "./narrativeObjectValidation";

export type ReadOnlySceneCompatibilityInput = Pick<LoadedProject, "path" | "outline" | "scenes" | "drafts">;

export interface ReadOnlySceneCompatibilitySuccess {
  readonly ok: true;
  readonly bundle: NarrativeObjectBundle;
  readonly issues: readonly NarrativeValidationIssue[];
}

export interface ReadOnlySceneCompatibilityFailure {
  readonly ok: false;
  readonly issues: readonly NarrativeValidationIssue[];
}

export type ReadOnlySceneCompatibilityResult =
  | ReadOnlySceneCompatibilitySuccess
  | ReadOnlySceneCompatibilityFailure;

const derivedLifecycle: NarrativeLifecycle = {
  state: "active",
  createdAt: null,
  updatedAt: null,
  archivedAt: null,
};

function createDerivedProvenance(source: string, note: string): NarrativeProvenance {
  return {
    origin: "derived",
    status: "derived",
    confidence: "high" as NarrativeConfidence,
    authorConfirmed: false,
    source,
    note,
  };
}

function createDerivedStoryUnit(scene: SceneDraftMetadata, projectPath: string): StoryUnit {
  const id = `su_${scene.id}`;
  return {
    id,
    kind: "story_unit",
    title: scene.title,
    assertionIds: [],
    anchorAssertionIds: [],
    order: scene.order,
    sceneCandidateId: null,
    sceneId: scene.id,
    provenance: createDerivedProvenance(
      projectPath,
      "Derived from scene metadata without prose extraction.",
    ),
    lifecycle: derivedLifecycle,
    lineage: {
      originId: id,
      parentIds: [scene.id],
      mergedFromIds: [],
      splitFromId: null,
      promotedFromId: null,
      supersededById: null,
      childIds: [],
      branchId: null,
    },
  };
}

function createDerivedScene(
  scene: SceneDraftMetadata,
  draftText: string | undefined,
  projectPath: string,
  storyUnitId: string,
): NarrativeScene {
  return {
    id: scene.id,
    kind: "scene",
    title: scene.title,
    order: scene.order,
    chapterId: scene.chapter_id ?? null,
    assertionIds: [],
    storyUnitIds: [storyUnitId],
    draftText: typeof draftText === "string" && draftText.trim().length > 0 ? draftText : null,
    provenance: createDerivedProvenance(
      projectPath,
      "Derived from scene-first compatibility scaffolding.",
    ),
    lifecycle: derivedLifecycle,
    lineage: {
      originId: scene.id,
      parentIds: [],
      mergedFromIds: [],
      splitFromId: null,
      promotedFromId: null,
      supersededById: null,
      childIds: [storyUnitId],
      branchId: null,
    },
  };
}

function createDerivedChapter(
  chapter: Readonly<{ id: string; order: number; title: string }>,
  sceneIds: readonly string[],
  projectPath: string,
): NarrativeChapter {
  return {
    id: chapter.id,
    kind: "chapter",
    title: chapter.title,
    order: chapter.order,
    sceneIds,
    provenance: createDerivedProvenance(
      projectPath,
      "Derived from outline chapter data without persistence mutation.",
    ),
    lifecycle: derivedLifecycle,
    lineage: {
      originId: chapter.id,
      parentIds: [...sceneIds],
      mergedFromIds: [],
      splitFromId: null,
      promotedFromId: null,
      supersededById: null,
      childIds: [],
      branchId: null,
    },
  };
}

function isValidSceneDraftMetadata(scene: SceneDraftMetadata): boolean {
  return (
    typeof scene.id === "string" &&
    scene.id.trim().length > 0 &&
    typeof scene.title === "string" &&
    scene.title.trim().length > 0 &&
    typeof scene.order === "number" &&
    !Number.isNaN(scene.order)
  );
}

export function deriveReadOnlyNarrativeObjectsFromScenes(
  input: ReadOnlySceneCompatibilityInput | null | undefined,
): ReadOnlySceneCompatibilityResult {
  if (!input) {
    return {
      ok: false,
      issues: [
        {
          path: "$",
          message: "scene compatibility input is required.",
        },
      ],
    };
  }

  const issues: NarrativeValidationIssue[] = [];
  if (!input.path || typeof input.path !== "string") {
    issues.push({ path: "$.path", message: "path must be a string." });
  }
  if (!input.outline || typeof input.outline !== "object") {
    issues.push({ path: "$.outline", message: "outline must be an object." });
  }
  if (!Array.isArray(input.scenes)) {
    issues.push({ path: "$.scenes", message: "scenes must be an array." });
  }
  if (!input.drafts || typeof input.drafts !== "object") {
    issues.push({ path: "$.drafts", message: "drafts must be an object." });
  }
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const derivedStoryUnits: StoryUnit[] = [];
  const derivedScenes: NarrativeScene[] = [];
  const derivedChapters: NarrativeChapter[] = [];
  const derivedRelationships: NarrativeRelationship[] = [];
  const derivedAssertions: NarrativeAssertion[] = [];
  const derivedGaps: NarrativeGap[] = [];

  const outlineChapters = [...input.outline.chapters].sort((left, right) => left.order - right.order);
  const sceneIdsInOrder: string[] = [];

  for (const scene of input.scenes) {
    if (!isValidSceneDraftMetadata(scene)) {
      issues.push({
        path: `$.scenes[${sceneIdsInOrder.length}]`,
        message: "scene id, title, and order must be valid.",
      });
      continue;
    }

    const storyUnit = createDerivedStoryUnit(scene, input.path);
    sceneIdsInOrder.push(scene.id);
    derivedStoryUnits.push(storyUnit);
    derivedScenes.push(createDerivedScene(scene, input.drafts[scene.id], input.path, storyUnit.id));
  }

  for (const chapter of outlineChapters) {
    if (typeof chapter.id !== "string" || chapter.id.trim().length === 0) {
      issues.push({
        path: "$.outline.chapters",
        message: "outline chapter ids must be non-empty strings.",
      });
      continue;
    }

    const chapterSceneIds = input.scenes
      .filter((scene) => scene.chapter_id === chapter.id)
      .map((scene) => scene.id);
    derivedChapters.push(createDerivedChapter(chapter, chapterSceneIds, input.path));
  }

  const bundle: NarrativeObjectBundle = {
    assertions: derivedAssertions,
    storyUnits: derivedStoryUnits,
    gaps: derivedGaps,
    relationships: derivedRelationships,
    scenes: derivedScenes,
    chapters: derivedChapters,
  };

  const validation = validateNarrativeObjectBundle(bundle);
  if (!validation.ok) {
    return {
      ok: false,
      issues: [...issues, ...validation.issues],
    };
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    bundle: validation.value,
    issues: validation.issues,
  };
}
