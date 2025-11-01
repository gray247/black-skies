import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type {
  LoadedProject,
  ProjectIssue,
  ProjectLoaderApi,
} from '../../shared/ipc/projectLoader';
import type { ToastPayload } from '../types/toast';
import DraftEditor from '../DraftEditor';
import {
  clearDebugLog,
  getDebugLogSnapshot,
  recordDebugEvent,
  subscribeDebugLog,
} from '../utils/debugLog';

export type ProjectLoadStatus = 'init' | 'loaded' | 'failed' | 'cleared';

export interface ProjectLoadEvent {
  status: ProjectLoadStatus;
  project: LoadedProject | null;
  targetPath: string | null;
  lastOpenedPath: string | null;
}

export interface ActiveScenePayload {
  sceneId: string;
  sceneTitle: string | null;
  draft: string;
}

export interface ProjectHomeProps {
  onToast: (toast: ToastPayload) => void;
  onProjectLoaded?: (event: ProjectLoadEvent) => void;
  reopenRequest?: { path: string; requestId: number } | null;
  onReopenConsumed?: (result: { requestId: number; status: 'success' | 'error' }) => void;
  draftOverrides?: Record<string, string>;
  onActiveSceneChange?: (payload: ActiveScenePayload | null) => void;
  onDraftChange?: (sceneId: string, draft: string) => void;
}

interface RecentProjectEntry {
  path: string;
  name: string;
  lastOpened: number;
}

const RECENTS_STORAGE_KEY = 'blackskies.recent-projects';
const LAST_PROJECT_STORAGE_KEY = 'blackskies.last-project';
// Ceiling: keep the recent-project list lightweight for the home view and storage churn.
const MAX_RECENTS = 7;

function readStoredRecents(): RecentProjectEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(RECENTS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as RecentProjectEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry) => typeof entry?.path === 'string')
      .map((entry) => {
        const timestampCandidate =
          typeof entry.lastOpened === 'number'
            ? entry.lastOpened
            : Number.parseInt(String(entry.lastOpened ?? ''), 10);
        const lastOpened = Number.isFinite(timestampCandidate)
          ? timestampCandidate
          : Date.now();
        return {
          path: entry.path,
          name: entry.name ?? entry.path.split(/[/\\]/).at(-1) ?? entry.path,
          lastOpened,
        };
      });
  } catch (error) {
    console.warn('[ProjectHome] Failed to read recents from storage', error);
    return [];
  }
}

function persistRecents(entries: RecentProjectEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('[ProjectHome] Failed to persist recents', error);
  }
}

function readStoredLastProjectPath(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LAST_PROJECT_STORAGE_KEY);
    if (typeof stored === 'string' && stored.trim().length > 0) {
      return stored;
    }
  } catch (error) {
    console.warn('[ProjectHome] Failed to read last project path', error);
  }

  return null;
}

function persistLastProjectPath(path: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (typeof path === 'string' && path.trim().length > 0) {
      window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, path);
    } else {
      window.localStorage.removeItem(LAST_PROJECT_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[ProjectHome] Failed to persist last project path', error);
  }
}

function toneFromIssue(issue: ProjectIssue): ToastPayload['tone'] {
  switch (issue.level) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'info';
  }
}

export default function ProjectHome({
  onToast,
  onProjectLoaded,
  reopenRequest,
  onReopenConsumed,
  draftOverrides,
  onActiveSceneChange,
  onDraftChange,
}: ProjectHomeProps): JSX.Element {
  const projectLoader: ProjectLoaderApi | undefined = window.projectLoader;
  const loaderAvailable = Boolean(projectLoader);

  const [recentProjects, setRecentProjects] = useState<RecentProjectEntry[]>(() =>
    readStoredRecents(),
  );
  const [activeProject, setActiveProject] = useState<LoadedProject | null>(null);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [storedLastProjectPath, setStoredLastProjectPath] = useState<string | null>(() =>
    readStoredLastProjectPath(),
  );
  const sampleAttemptedRef = useRef(false);
  const stalePathsRef = useRef<Set<string>>(new Set());

  const debugLogSnapshot = useSyncExternalStore(subscribeDebugLog, getDebugLogSnapshot);
  const debugLogEntries = debugLogSnapshot.events;
  const debugLogText = useMemo(
    () => JSON.stringify(debugLogSnapshot.events, null, 2),
    [debugLogSnapshot],
  );
  const hasDebugLog = debugLogEntries.length > 0;

  const sortedRecents = useMemo(
    () =>
      [...recentProjects].sort((left, right) => right.lastOpened - left.lastOpened),
    [recentProjects],
  );

  const activeScene = useMemo(() => {
    if (!activeProject || !activeSceneId) {
      return null;
    }
    return (
      activeProject.scenes.find((scene) => scene.id === activeSceneId) ?? null
    );
  }, [activeProject, activeSceneId]);

  const activeSceneDraft = useMemo(() => {
    if (!activeProject || !activeSceneId) {
      return '';
    }
    const override = draftOverrides?.[activeSceneId];
    if (typeof override === 'string') {
      return override;
    }
    return activeProject.drafts[activeSceneId] ?? '';
  }, [activeProject, activeSceneId, draftOverrides]);

  const notifyIssues = useCallback(
    (items: ProjectIssue[]) => {
      const maxToasts = 3;
      items.slice(0, maxToasts).forEach((issue) => {
        onToast({
          tone: toneFromIssue(issue),
          title: issue.message,
          description: issue.detail,
        });
      });
    },
    [onToast],
  );

  const diagnostics = useMemo(
    () => ({
      loaderAvailable,
      projectLoaderDefined: Boolean(projectLoader),
      isLoading,
      sampleAttempted: sampleAttemptedRef.current,
      recentCount: recentProjects.length,
      storedLastProjectPath,
      activeProjectPath: activeProject?.path ?? null,
      activeProjectName: activeProject?.name ?? null,
      activeSceneId,
      activeSceneTitle:
        activeProject && activeSceneId
          ? activeProject.scenes.find((scene) => scene.id === activeSceneId)?.title ?? null
          : null,
      sceneCount: activeProject?.scenes.length ?? 0,
      draftCount: activeProject ? Object.keys(activeProject.drafts).length : 0,
      issuesCount: issues.length,
      lastIssues: issues.slice(0, 3).map((issue) => ({
        level: issue.level,
        message: issue.message,
        detail: issue.detail ?? null,
      })),
      recentEntries: sortedRecents.slice(0, 3).map((entry) => ({
        path: entry.path,
        name: entry.name,
        lastOpened: entry.lastOpened,
      })),
      debugLogVersion: debugLogSnapshot.version,
    }),
    [
      activeProject,
      activeSceneId,
      issues,
      loaderAvailable,
      projectLoader,
      recentProjects.length,
      sortedRecents,
      debugLogSnapshot,
      storedLastProjectPath,
    ],
  );

  const diagnosticsText = useMemo(
    () => JSON.stringify(diagnostics, null, 2),
    [diagnostics],
  );

  const handleCopyDebugLog = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(debugLogText).catch(() => {
        console.warn('[ProjectHome] Failed to copy debug log to clipboard');
      });
    }
  }, [debugLogText]);

  const handleClearDebugLog = useCallback(() => {
    clearDebugLog();
  }, []);

  const upsertRecent = useCallback((project: LoadedProject) => {
    setRecentProjects((previous) => {
      const now = Date.now();
      const filtered = previous.filter(
        (entry) =>
          entry.path !== project.path && !stalePathsRef.current.has(entry.path),
      );
      const nextEntries: RecentProjectEntry[] = [
        {
          path: project.path,
          name: project.name,
          lastOpened: now,
        },
        ...filtered,
      ].slice(0, MAX_RECENTS);
      persistRecents(nextEntries);
      return nextEntries;
    });
    stalePathsRef.current.delete(project.path);
  }, []);

  const pruneRecentImmediately = useCallback(
    (targetPath: string) => {
      const nextEntries = readStoredRecents().filter(
        (entry) => entry.path !== targetPath,
      );
      persistRecents(nextEntries);
      setRecentProjects(nextEntries);
      setStoredLastProjectPath((previous) => {
        if (previous === targetPath) {
          persistLastProjectPath(null);
          return null;
        }
        return previous;
      });
    },
    [],
  );

  const removeRecent = useCallback((targetPath: string, retainMarker = false) => {
    if (retainMarker) {
      stalePathsRef.current.add(targetPath);
    } else {
      stalePathsRef.current.delete(targetPath);
    }
    setRecentProjects((previous) => {
      const nextEntries = previous.filter((entry) => entry.path !== targetPath);
      if (nextEntries.length !== previous.length) {
        persistRecents(nextEntries);
      }
      return nextEntries;
    });
    setStoredLastProjectPath((previous) => {
      if (previous === targetPath) {
        persistLastProjectPath(null);
        return null;
      }
      return previous;
    });
    if (!retainMarker) {
      stalePathsRef.current.delete(targetPath);
    }
  }, []);

  const loadProjectAtPath = useCallback(
    async (
      targetPath: string,
      options?: {
        reason?: 'bootstrap' | 'recent' | 'dialog' | 'recovery';
        silent?: boolean;
        allowFallback?: boolean;
      },
    ): Promise<LoadedProject | null> => {
      if (!projectLoader) {
        recordDebugEvent('project-home.load.missing-bridge', { targetPath, options });
        onToast({
          tone: 'error',
          title: 'Project loader unavailable',
          description: 'Electron bridge is offline; cannot open project folders.',
        });
        onProjectLoaded?.({
          status: 'failed',
          project: null,
          targetPath,
          lastOpenedPath: storedLastProjectPath,
        });
        return null;
      }

      setIsLoading(true);
      try {
        recordDebugEvent('project-home.load.begin', { targetPath, options });
        const response = await projectLoader.loadProject({ path: targetPath });
        if (!response.ok) {
          recordDebugEvent('project-home.load.failure', {
            targetPath,
            options,
            error: response.error,
          });
          console.warn('[ProjectHome] Project load returned issues', {
            targetPath,
            code: response.error.code,
            message: response.error.message,
            issueCount: response.error.issues?.length ?? 0,
          });
          setIssues(response.error.issues ?? []);
          if (options?.reason === 'recent') {
            removeRecent(targetPath, true);
            pruneRecentImmediately(targetPath);
          }
          const detail = response.error.issues?.find((issue) => issue.detail)?.detail;
          const description = detail
            ? `${response.error.message} (${detail})`
            : response.error.message;
          onToast({
            tone: 'error',
            title: 'Could not open project',
            description,
          });
          notifyIssues(response.error.issues ?? []);
          onProjectLoaded?.({
            status: 'failed',
            project: null,
            targetPath,
            lastOpenedPath: storedLastProjectPath,
          });
          if (
            options?.allowFallback !== false &&
            options?.reason !== 'bootstrap' &&
            projectLoader.getSampleProjectPath
          ) {
            void (async () => {
              try {
                recordDebugEvent('project-home.load.sample-attempt', {
                  targetPath,
                });
                const samplePath = await projectLoader.getSampleProjectPath();
                if (samplePath && samplePath !== targetPath) {
                  const fallbackProject = await loadProjectAtPath(samplePath, {
                    reason: 'bootstrap',
                    silent: true,
                    allowFallback: false,
                  });
                  if (fallbackProject) {
                    setRecentProjects((previous) => {
                      const filtered = previous.filter(
                        (entry) =>
                          entry.path !== fallbackProject.path && entry.path !== targetPath,
                      );
                      const nextEntries: RecentProjectEntry[] = [
                        {
                          path: fallbackProject.path,
                          name: fallbackProject.name,
                          lastOpened: Date.now(),
                        },
                        ...filtered,
                      ].slice(0, MAX_RECENTS);
                      persistRecents(nextEntries);
                      return nextEntries;
                    });
                    persistLastProjectPath(fallbackProject.path);
                    setStoredLastProjectPath(fallbackProject.path);
                  }
                  stalePathsRef.current.delete(targetPath);
                } else {

                }
              } catch (fallbackError) {
                stalePathsRef.current.delete(targetPath);
                onToast({
                  tone: 'warning',
                  title: 'Sample project unavailable',
                  description:
                    fallbackError instanceof Error
                      ? fallbackError.message
                      : String(fallbackError),
                });
              }
            })();
          }
          return null;
        }

        console.info('[ProjectHome] Loaded project successfully', {
          path: response.project.path,
          sceneCount: response.project.scenes.length,
          issueCount: response.issues.length,
        });
        recordDebugEvent('project-home.load.success', {
          targetPath,
          options,
          projectPath: response.project.path,
          sceneCount: response.project.scenes.length,
          issueCount: response.issues.length,
        });
        setActiveProject(response.project);
        setActiveSceneId((previous) => {
          if (previous && response.project.drafts[previous]) {
            return previous;
          }
          const firstScene = response.project.scenes[0];
          if (firstScene) {
            return firstScene.id;
          }
          const fallbackOutlineScene = response.project.outline.scenes[0];
          return fallbackOutlineScene?.id ?? null;
        });
        setIssues(response.issues);
        upsertRecent(response.project);
        persistLastProjectPath(response.project.path);
        setStoredLastProjectPath(response.project.path);
        onProjectLoaded?.({
          status: 'loaded',
          project: response.project,
          targetPath,
          lastOpenedPath: response.project.path,
        });

        if (!options?.silent) {
          const successTitle =
            options?.reason === 'bootstrap'
              ? 'Sample project loaded'
              : `${response.project.name} ready`;
          const successDescription =
            options?.reason === 'bootstrap'
              ? 'Esther Estate is ready to explore the dock layout.'
              : 'Outline and draft metadata synced successfully.';
          onToast({
            tone: 'info',
            title: successTitle,
            description: successDescription,
          });
        }

        if (response.issues.length > 0) {
          notifyIssues(response.issues);
        }

        return response.project;
      } catch (error) {
        console.error('[ProjectHome] Project load failed', {
          targetPath,
          message: error instanceof Error ? error.message : String(error),
        });
        recordDebugEvent('project-home.load.exception', {
          targetPath,
          options,
          message: error instanceof Error ? error.message : String(error),
        });
        if (options?.reason === 'recent') {
          removeRecent(targetPath, true);
          pruneRecentImmediately(targetPath);
        } else if (recentProjects.some((entry) => entry.path === targetPath)) {
          removeRecent(targetPath, true);
          pruneRecentImmediately(targetPath);
        }
        const message = error instanceof Error ? error.message : String(error);
        onToast({
          tone: 'error',
          title: 'Project load failed',
          description: message,
        });
        onProjectLoaded?.({
          status: 'failed',
          project: null,
          targetPath,
          lastOpenedPath: storedLastProjectPath,
        });
        if (
          options?.allowFallback !== false &&
          options?.reason !== 'bootstrap' &&
          projectLoader?.getSampleProjectPath
        ) {
          try {
            recordDebugEvent('project-home.load.sample-attempt', { targetPath });
            const samplePath = await projectLoader.getSampleProjectPath();
            if (samplePath && samplePath !== targetPath) {
                  const fallbackProject = await loadProjectAtPath(samplePath, {
                    reason: 'bootstrap',
                    silent: true,
                    allowFallback: false,
                  });
                  if (fallbackProject) {
                    recordDebugEvent('project-home.load.sample-fallback', {
                      originalPath: targetPath,
                      samplePath,
                    });

                    setRecentProjects((previous) => {
                  const filtered = previous.filter(
                    (entry) =>
                      entry.path !== fallbackProject.path && entry.path !== targetPath,
                  );
                  const nextEntries: RecentProjectEntry[] = [
                    {
                      path: fallbackProject.path,
                      name: fallbackProject.name,
                      lastOpened: Date.now(),
                    },
                    ...filtered,
                  ].slice(0, MAX_RECENTS);
                  persistRecents(nextEntries);
                  return nextEntries;
                });
                persistLastProjectPath(fallbackProject.path);
                setStoredLastProjectPath(fallbackProject.path);
              }
              stalePathsRef.current.delete(targetPath);
            }
          } catch (fallbackError) {
            stalePathsRef.current.delete(targetPath);
            recordDebugEvent('project-home.load.sample-fallback-error', {
              originalPath: targetPath,
              error:
                fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
            });
            onToast({
              tone: 'warning',
              title: 'Sample project unavailable',
              description:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : String(fallbackError),
            });
          }
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      notifyIssues,
      onProjectLoaded,
      onToast,
      projectLoader,
      pruneRecentImmediately,
      removeRecent,
      recentProjects,
      storedLastProjectPath,
      upsertRecent,
    ],
  );

  const handleOpenProject = useCallback(async () => {
    if (!projectLoader) {
      onToast({
        tone: 'error',
        title: 'Electron bridge unavailable',
        description: 'Launch the desktop shell to choose a project folder.',
      });
      return;
    }
    recordDebugEvent('project-home.dialog.open', {});
    setIsLoading(true);
    try {
      const result = await projectLoader.openProjectDialog();
      if (result.canceled || !result.filePath) {
        recordDebugEvent('project-home.dialog.cancelled', {});
        return;
      }
      recordDebugEvent('project-home.dialog.selected', { path: result.filePath });
      await loadProjectAtPath(result.filePath, { reason: 'dialog' });
    } finally {
      setIsLoading(false);
    }
  }, [loadProjectAtPath, onToast, projectLoader]);

  const handleOpenRecent = useCallback(
    async (entry: RecentProjectEntry) => {
      recordDebugEvent('project-home.recent.open', { path: entry.path });
      await loadProjectAtPath(entry.path, { reason: 'recent' });
    },
    [loadProjectAtPath],
  );

  useEffect(() => {
    if (!projectLoader || activeProject || sampleAttemptedRef.current) {
      return;
    }

    let cancelled = false;
    sampleAttemptedRef.current = true;

    const bootstrap = async () => {
      try {
        recordDebugEvent('project-home.bootstrap.attempt', {});
        const samplePath = await projectLoader.getSampleProjectPath?.();
        if (!samplePath || cancelled) {
          return;
        }
        await loadProjectAtPath(samplePath, {
          reason: 'bootstrap',
          silent: true,
          allowFallback: false,
        });
        recordDebugEvent('project-home.bootstrap.success', { samplePath });
      } catch (error) {
        recordDebugEvent('project-home.bootstrap.error', {
          message: error instanceof Error ? error.message : String(error),
        });
        if (!cancelled) {
          onToast({
            tone: 'warning',
            title: 'Sample project unavailable',
            description: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [activeProject, loadProjectAtPath, onToast, projectLoader]);

  useEffect(() => {
    if (!onActiveSceneChange) {
      return;
    }
    if (!activeProject || !activeScene) {
      onActiveSceneChange(null);
      return;
    }
    onActiveSceneChange({
      sceneId: activeScene.id,
      sceneTitle: activeScene.title,
      draft: activeSceneDraft,
    });
  }, [activeProject, activeScene, activeSceneDraft, onActiveSceneChange]);

  useEffect(() => {
    if (!reopenRequest) {
      return;
    }

    let cancelled = false;

    const execute = async () => {
      const project = await loadProjectAtPath(reopenRequest.path, {
        reason: 'recovery',
      });
      if (cancelled) {
        return;
      }
      const status = project ? 'success' : 'error';
      onReopenConsumed?.({ requestId: reopenRequest.requestId, status });
    };

    void execute();

    return () => {
      cancelled = true;
    };
  }, [loadProjectAtPath, onReopenConsumed, reopenRequest]);

  return (
    <div className="project-home">
      <header className="project-home__header">
        <div>
          <h2>Project home</h2>
          <p>
            {loaderAvailable
              ? 'Browse a project folder to populate the dock and workspace.'
              : 'Project browsing is disabled outside the packaged Electron shell.'}
          </p>
        </div>
        <button
          type="button"
          className="project-home__open-button"
          onClick={handleOpenProject}
          disabled={!loaderAvailable || isLoading}
        >
          {isLoading ? 'Loading...' : 'Open project...'}
        </button>
      </header>

      <section className="project-home__diagnostics">
        <div>
          <h3>Troubleshooting snapshot</h3>
          <p className="project-home__diagnostics-hint">
            Copy this payload when reporting project-load issues. It represents the most recent loader state.
          </p>
        </div>
        <textarea
          className="project-home__diagnostics-output"
          value={diagnosticsText}
          readOnly
          aria-label="Project loader diagnostics"
        />
      </section>

      <section className="project-home__diagnostics">
        <div>
          <h3>Debug event log</h3>
          <p className="project-home__diagnostics-hint">
            Renderer-side events recorded during project loads and layout operations (up to 200 entries).
          </p>
        </div>
        <div className="project-home__diagnostics-actions">
          <button type="button" onClick={handleCopyDebugLog} disabled={!hasDebugLog}>
            Copy log
          </button>
          <button type="button" onClick={handleClearDebugLog} disabled={!hasDebugLog}>
            Clear log
          </button>
        </div>
        <textarea
          className="project-home__diagnostics-output"
          value={debugLogText}
          readOnly
          aria-label="Renderer debug events"
        />
      </section>

      <div className="project-home__layout">
        <section className="project-home__main">
          <section className="project-home__recents">
            <div className="project-home__section-header">
              <h3>Recent projects</h3>
              <span className="project-home__count">{sortedRecents.length}</span>
            </div>
            {sortedRecents.length === 0 ? (
              <p className="project-home__empty">No recent projects yet.</p>
            ) : (
              <ul className="project-home__recent-list">
                {sortedRecents.map((entry) => {
                  const isActive = activeProject?.path === entry.path;
                  return (
                    <li key={entry.path}>
                      <button
                        type="button"
                        className={`project-home__recent-button${
                          isActive ? ' project-home__recent-button--active' : ''
                        }`}
                        onClick={() => void handleOpenRecent(entry)}
                      >
                        <span className="project-home__recent-name">{entry.name}</span>
                        <span className="project-home__recent-path">{entry.path}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="project-home__details">
            <h3>Project details</h3>
            {activeProject ? (
              <div className="project-home__details-card">
                <div className="project-home__details-header">
                  <h4>{activeProject.name}</h4>
                  <span className="project-home__details-path">{activeProject.path}</span>
                </div>
                <dl className="project-home__stats">
                  <div>
                    <dt>Acts</dt>
                    <dd>{activeProject.outline.acts.length}</dd>
                  </div>
                  <div>
                    <dt>Chapters</dt>
                    <dd>{activeProject.outline.chapters.length}</dd>
                  </div>
                  <div>
                    <dt>Scenes</dt>
                    <dd>{activeProject.outline.scenes.length}</dd>
                  </div>
                </dl>
                {issues.length > 0 ? (
                  <div className="project-home__issues">
                    <h5>Issues detected</h5>
                    <ul>
                      {issues.map((issue) => (
                        <li key={`${issue.message}-${issue.path ?? 'unknown'}`}>
                          <span className={`project-home__issue project-home__issue--${issue.level}`}>
                            {issue.message}
                          </span>
                          {issue.detail ? (
                            <span className="project-home__issue-detail">{issue.detail}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="project-home__details-hint">
                    Outline and draft metadata look healthy.
                  </p>
                )}
              </div>
            ) : (
              <p className="project-home__empty">Select a project to preview its outline and scenes.</p>
            )}
          </section>

          <section className="project-home__draft">
            <div className="project-home__draft-header">
              {activeScene ? (
                <>
                  <div className="project-home__draft-header-left">
                    <span className="project-home__draft-scene-id">{activeScene.id}</span>
                    <h3 className="project-home__draft-title">{activeScene.title}</h3>
                  </div>
                  <div className="project-home__draft-header-meta">
                    {activeScene.emotion_tag ? (
                      <span
                        className={`project-home__scene-tag project-home__scene-tag--${activeScene.emotion_tag}`}
                      >
                        {activeScene.emotion_tag}
                      </span>
                    ) : null}
                    {activeScene.purpose ? (
                      <span className="project-home__scene-purpose">{activeScene.purpose}</span>
                    ) : null}
                    {activeScene.word_target ? (
                      <span className="project-home__scene-word-target">
                        {activeScene.word_target} words
                      </span>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="project-home__draft-header-empty">
                  <h3 className="project-home__draft-title">Draft preview</h3>
                  <span className="project-home__draft-hint">
                    Choose a scene from the sidebar to load its Markdown draft.
                  </span>
                </div>
              )}
            </div>
            <div className="project-home__draft-editor">
              {activeScene ? (
                <DraftEditor
                  value={activeSceneDraft}
                  placeholder="Scene text will appear once loaded."
                  className="project-home__draft-editor-host"
                  onChange={(nextValue) => {
                    onDraftChange?.(activeScene.id, nextValue);
                  }}
                />
              ) : (
                <p className="project-home__empty project-home__draft-empty">
                  Select a scene to preview its Markdown draft.
                </p>
              )}
            </div>
          </section>
        </section>

        <aside className="project-home__sidebar">
          <div className="project-home__sidebar-header">
            <h3>Scene metadata</h3>
            <span>{activeProject?.scenes.length ?? 0}</span>
          </div>
          {activeProject ? (
            <ul className="project-home__scene-list">
              {activeProject.scenes.map((scene) => {
                const isActive = scene.id === activeSceneId;
                return (
                  <li
                    key={scene.id}
                    className={`project-home__scene-card${
                      isActive ? ' project-home__scene-card--active' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="project-home__scene-button"
                      onClick={() => setActiveSceneId(scene.id)}
                      aria-pressed={isActive}
                    >
                      <div className="project-home__scene-header">
                        <span className="project-home__scene-id">{scene.id}</span>
                        <span className="project-home__scene-order">#{scene.order}</span>
                      </div>
                      <h4 className="project-home__scene-title">{scene.title}</h4>
                      <div className="project-home__scene-meta">
                        {scene.emotion_tag ? (
                          <span
                            className={`project-home__scene-tag project-home__scene-tag--${scene.emotion_tag}`}
                          >
                            {scene.emotion_tag}
                          </span>
                        ) : null}
                        {scene.purpose ? (
                          <span className="project-home__scene-purpose">{scene.purpose}</span>
                        ) : null}
                        {scene.word_target ? (
                          <span className="project-home__scene-word-target">{scene.word_target} words</span>
                        ) : null}
                      </div>
                      {scene.beats && scene.beats.length > 0 ? (
                        <div className="project-home__scene-beats">
                          {scene.beats.map((beat) => (
                            <span key={beat}>{beat}</span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="project-home__empty">Load a project to review scene metadata.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
