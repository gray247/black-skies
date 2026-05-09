import type { LoadedProject, SceneDraftMetadata } from "../../shared/ipc/projectLoader";

export type StoryUnitSourceType = "scene";
export type StoryUnitState = "placed";
export type StoryUnitDraftStatus = "empty" | "has_draft";

export interface StoryUnitPlacement {
  readonly outlineKey: "main";
  readonly sourceOutlineId: string | null;
  readonly chapterId: string | null;
  readonly order: number;
}

export interface StoryUnitSource {
  readonly projectPath: string;
  readonly sceneId: string;
}

export interface StoryUnitV1 {
  readonly unitId: string;
  readonly title: string;
  readonly contentPreview: string;
  readonly sourceType: StoryUnitSourceType;
  readonly state: StoryUnitState;
  readonly placement: StoryUnitPlacement;
  readonly order: number;
  readonly draftStatus: StoryUnitDraftStatus;
  readonly isAiGenerated: false;
  readonly sceneId: string;
  readonly source: StoryUnitSource;
}

export interface ActiveOutlineV1 {
  readonly outlineKey: "main";
  readonly label: "main";
  readonly sourceOutlineId: string | null;
  readonly units: readonly StoryUnitV1[];
}

function sceneContentPreview(scene: SceneDraftMetadata, draft: string | undefined): string {
  const trimmedDraft = draft?.trim();
  if (trimmedDraft) {
    return trimmedDraft.replace(/\s+/g, " ").slice(0, 180);
  }

  const metadataPreview = [scene.purpose, scene.goal, scene.conflict, scene.turn]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  return metadataPreview.trim().slice(0, 180);
}

function sceneDraftStatus(draft: string | undefined): StoryUnitDraftStatus {
  return draft?.trim() ? "has_draft" : "empty";
}

export function deriveStoryUnits(project: LoadedProject | null | undefined): readonly StoryUnitV1[] {
  if (!project) {
    return [];
  }

  const sourceOutlineId = project.outline.outline_id ?? null;

  return [...project.scenes]
    .sort((left, right) => left.order - right.order)
    .map((scene) => ({
      unitId: scene.id,
      title: scene.title || scene.id,
      contentPreview: sceneContentPreview(scene, project.drafts[scene.id]),
      sourceType: "scene",
      state: "placed",
      placement: {
        outlineKey: "main",
        sourceOutlineId,
        chapterId: scene.chapter_id ?? null,
        order: scene.order,
      },
      order: scene.order,
      draftStatus: sceneDraftStatus(project.drafts[scene.id]),
      isAiGenerated: false,
      sceneId: scene.id,
      source: {
        projectPath: project.path,
        sceneId: scene.id,
      },
    }));
}

export function deriveActiveOutline(project: LoadedProject | null | undefined): ActiveOutlineV1 {
  return {
    outlineKey: "main",
    label: "main",
    sourceOutlineId: project?.outline.outline_id ?? null,
    units: deriveStoryUnits(project),
  };
}

export function activeOutlineContainsScene(
  outline: ActiveOutlineV1,
  sceneId: string | null | undefined,
): boolean {
  if (!sceneId) {
    return false;
  }
  return outline.units.some((unit) => unit.sceneId === sceneId);
}
