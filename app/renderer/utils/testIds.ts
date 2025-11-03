export const TID = {
  // Project home / navigation
  createProjectBtn: 'project-create-btn',
  openProjectBtn: 'project-open-btn',
  recentList: 'recent-projects-list',
  diagnosticsButton: 'project-diagnostics-btn',

  // Wizard / outline
  wizardRoot: 'wizard-root',
  wizardNext: 'wizard-next',
  outlineEditor: 'outline-editor',
  critiqueTab: 'wizard-critique-tab',

  // Dock workspace & editor
  dockWorkspace: 'dock-workspace',
  sceneAddBtn: 'scene-add-btn',
  saveBtn: 'scene-save-btn',

  // Export & toast notifications
  exportBtn: 'export-btn',
  exportToast: 'export-toast-success',

  // Recovery
  recoveryBanner: 'recovery-banner',
  recoveryDialog: 'recovery-dialog',
} as const;

export type TestIdKey = keyof typeof TID;
