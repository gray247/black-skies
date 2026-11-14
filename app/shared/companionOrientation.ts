import type { LivingOutlineSnapshotV1 } from './ipc/livingOutline';
import type { ProjectSpineSaveStatus, ProjectSpineSessionSnapshot } from './ipc/projectSpine';

export const COMPANION_ORIENTATION_SCHEMA_VERSION = 1 as const;
export const COMPANION_MAX_REQUEST_LENGTH = 500;

export type CompanionRouteV1 = 'orientation' | 'help' | 'not-routed';
export type CompanionOrientationStatusV1 = 'available' | 'unavailable' | 'not-routed';

export interface CompanionRequestV1 {
  readonly schemaVersion: typeof COMPANION_ORIENTATION_SCHEMA_VERSION;
  readonly requestId: string;
  readonly projectId: string | null;
  readonly generation: number;
  readonly text: string;
  readonly route: CompanionRouteV1;
}

export type CompanionOrientationSourceOwnerV1 =
  | 'Project session'
  | 'Manuscript unit'
  | 'Story plan'
  | 'Tool help';

export interface CompanionOrientationSourceFactV1 {
  readonly owner: CompanionOrientationSourceOwnerV1;
  readonly label: string;
  readonly currentness: 'current' | 'unavailable';
  readonly value: string;
}

export type CompanionOrientationAllowedActionV1 = 'return-to-writing' | 'dismiss';

export type CompanionHelpDestination = 'structure' | 'create-develop' | 'project-interchange' | 'writing';

export interface CompanionOrientationResultV1 {
  readonly helpDestination?: CompanionHelpDestination;
  readonly schemaVersion: typeof COMPANION_ORIENTATION_SCHEMA_VERSION;
  readonly requestId: string;
  readonly projectId: string | null;
  readonly generation: number;
  readonly route: CompanionRouteV1;
  readonly status: CompanionOrientationStatusV1;
  readonly requestLabel: string;
  readonly sourceFacts: readonly CompanionOrientationSourceFactV1[];
  readonly limitationText: string;
  readonly allowedActions: readonly CompanionOrientationAllowedActionV1[];
}

const ORIENTATION_REQUESTS = new Set([
  'where am i',
  'where am i in this project',
  'where am i in the project',
  'where was i',
  'where was i in this project',
  'what am i working on',
  'what am i working on in this project',
]);

const HELP_TOPICS: readonly { aliases: readonly string[]; title: string; text: string; destination: CompanionHelpDestination }[] = [
  { aliases: ['help', 'how does black skies work', 'what can i do here'], title: 'Writing and tools', destination: 'writing', text: 'Write directly in Writing Studio. Pin groups exact writing without making chapters. Story holds Outline and Notebook; Review and Develop hold manual concerns and alternatives. Save keeps writing. AI story answers and background reading remain separate capabilities.' },
  { aliases: ['where is notebook', 'where are my notes', 'how do i add a note', 'open notebook'], title: 'Notebook and passage Notes', destination: 'structure', text: 'Open Story, then All-story Notebook. Browse or search Notes by their text; duplicate names remain separate. Select writing and use Note for an exact passage attachment. Whole-story, deliberately unattached and unavailable-source Notes have different meanings. Keep saves a Note; closing a rail keeps its temporary draft in this window.' },
  { aliases: ['how do i pin writing', 'what does pin do', 'where is outline'], title: 'Pin and Outline', destination: 'structure', text: 'Select exact words and choose Pin, or use one Pin button to place a beginning and ending. Pin groups writing without locking it or deciding chapters. The Outline follows the manuscript. Choose Move beside writing, then an insertion marker, or drag a pinned Outline row to a marker. Supported Notes and formatting follow; Undo restores the move. Keep open locks a rail, not writing.' },
  { aliases: ['how do i export', 'where can i export', 'where is import', 'import and export'], title: 'Supported interchange', destination: 'project-interchange', text: 'Save writing before exporting all saved sections as Markdown or UTF-8 source text. Source text retains Markdown characters and body whitespace. Notes and other project records are outside manuscript export; whole-project archive and named versions are not supplied by it. Import stages a separate UTF-8/Markdown copy for review and Apply.' },
  { aliases: ['where are writing preferences', 'how do i change spacing', 'where is spelling', 'how do i set a word goal'], title: 'Writing preferences and spelling', destination: 'writing', text: 'Writing preferences is on the Writing toolbar. Typeface, size, line height, extra paragraph spacing and indentation affect the whole manuscript display, not source bytes. A blank story word goal turns it off. Spelling and accepted words reports actual native dictionary availability; accepted words belong to the native session across projects and may also affect Windows.' },
  { aliases: ['how do i save', 'how do i undo'], title: 'Save and Undo', destination: 'writing', text: 'Save writing or Ctrl+S keeps current writing and its links. Undo and Redo work independently of AI. Later typing or link changes can refuse an obsolete structural Undo to protect newer work. Session Undo is not a named whole-project version.' },
  { aliases: ['what is a source check', 'how do i revise a concern', 'where is history'], title: 'Concerns, revisions and History', destination: 'create-develop', text: 'A manual concern can link primary and related exact evidence. Review each current source before considering a revision. Author choices, partial application and History use the same concern identity. A source check verifies source availability; it does not judge whether a literary concern still applies. History preserves decisions, not a claim of fresh reading.' },
];

const ORIENTATION_ACTIONS = ['return-to-writing', 'dismiss'] as const;

function normalizeRequestText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[?!.,]+$/u, '').replace(/\s+/gu, ' ');
}

function saveStateValue(status: ProjectSpineSaveStatus, dirtyUnitCount: number): string {
  switch (status) {
    case 'dirty':
      return `${dirtyUnitCount} unsaved manuscript unit${dirtyUnitCount === 1 ? '' : 's'}`;
    case 'saving':
      return 'Saving the current manuscript state';
    case 'saved':
      return 'Saved durably';
    case 'save-failed':
      return 'Save failed; local writing remains available';
    default:
      return 'No unsaved manuscript changes reported';
  }
}

export function routeCompanionRequest(
  text: string,
  context: {
    readonly requestId: string;
    readonly projectId: string | null;
    readonly generation: number;
  },
): CompanionRequestV1 {
  const trimmed = text.trim().slice(0, COMPANION_MAX_REQUEST_LENGTH);
  return {
    schemaVersion: COMPANION_ORIENTATION_SCHEMA_VERSION,
    requestId: context.requestId,
    projectId: context.projectId,
    generation: context.generation,
    text: trimmed,
    route: ORIENTATION_REQUESTS.has(normalizeRequestText(trimmed))
      ? 'orientation'
      : HELP_TOPICS.some(topic => topic.aliases.includes(normalizeRequestText(trimmed))) ? 'help' : 'not-routed',
  };
}

export function deriveCompanionOrientationResult(
  request: CompanionRequestV1,
  snapshot: ProjectSpineSessionSnapshot,
  livingOutline: LivingOutlineSnapshotV1 | null,
): CompanionOrientationResultV1 {
  const base = {
    schemaVersion: COMPANION_ORIENTATION_SCHEMA_VERSION,
    requestId: request.requestId,
    projectId: request.projectId,
    generation: request.generation,
    route: request.route,
    requestLabel: request.route === 'orientation'
      ? 'Where you are in this project'
      : 'This request is not supported by this Companion slice yet',
    allowedActions: ORIENTATION_ACTIONS,
  } as const;
  const project = snapshot.project;
  const currentProjectMatches = Boolean(
    project && request.projectId === project.projectId && request.generation === snapshot.generation,
  );

  if (request.route === 'help') {
    const topic = HELP_TOPICS.find(value => value.aliases.includes(normalizeRequestText(request.text)));
    if (currentProjectMatches && topic) return {
      ...base, status: 'available', requestLabel: topic.title, helpDestination: topic.destination,
      sourceFacts: [{ owner: 'Tool help', label: 'Built-in instructions', currentness: 'current', value: topic.text }],
      limitationText: 'Built-in product help. No story was analyzed, no AI was called and no writing changed.',
    };
    return { ...base, status: 'unavailable', sourceFacts: [], limitationText: 'The project changed before this help was opened. Ask again from the current project.' };
  }

  if (request.route === 'not-routed') {
    return {
      ...base,
      status: 'not-routed',
      sourceFacts: [],
      limitationText: 'Companion currently helps you find your place in this project and offers selected built-in product help. It did not change your manuscript or save anything.',
    };
  }

  if (!currentProjectMatches || !project) {
    return {
      ...base,
      status: 'unavailable',
      sourceFacts: [],
      limitationText: 'The project changed or is unavailable, so no local orientation summary was created. Writing remains available.',
    };
  }

  const activeUnit = project.units.find((unit) => unit.id === snapshot.activeUnitId) ?? null;
  const linkedOutlineItems = activeUnit && livingOutline?.availability === 'ready'
    ? livingOutline.document.items.filter((item) => item.manuscriptUnitId === activeUnit.id)
    : [];
  const sourceFacts: CompanionOrientationSourceFactV1[] = [
    {
      owner: 'Project session',
      label: 'Project',
      currentness: 'current',
      value: `${project.title} · ${project.units.length} manuscript unit${project.units.length === 1 ? '' : 's'} · ${saveStateValue(snapshot.saveState.status, snapshot.dirtyUnitIds.length)}`,
    },
    {
      owner: 'Manuscript unit',
      label: 'Current writing',
      currentness: activeUnit ? 'current' : 'unavailable',
      value: activeUnit
        ? `${activeUnit.displayTitle} · unit ${activeUnit.order} of ${project.units.length}`
        : 'No manuscript unit is selected',
    },
    livingOutline?.availability === 'ready'
      ? {
          owner: 'Story plan',
          label: 'Outline relationship',
          currentness: 'current',
          value: activeUnit
            ? linkedOutlineItems.length === 0
              ? 'No Note is placed with the current writing'
              : `${linkedOutlineItems.length} Note${linkedOutlineItems.length === 1 ? '' : 's'} placed with the current writing`
            : 'No current writing is selected to compare with the outline',
        }
      : {
          owner: 'Story plan',
          label: 'Outline relationship',
          currentness: 'unavailable',
          value: livingOutline?.message ?? 'The story plan is unavailable; manuscript writing is unaffected',
        },
  ];

  return {
    ...base,
    status: 'available',
    sourceFacts,
    limitationText: 'This is a temporary orientation summary. It did not change your manuscript, create a saved record, or decide what you should do next.',
  };
}
