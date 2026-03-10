type WindowWithFlags = typeof window & {
  __testEnvFlatMode?: boolean;
  __testEnvRecoveryMode?: boolean;
  __testEnvFullMode?: boolean;
  __testEnvForceOfflineReason?: string;
};

export function setFlatMode(reason?: string) {
  const win = window as WindowWithFlags;
  win.__testEnvFlatMode = true;
  win.__testEnvRecoveryMode = false;
  win.__testEnvFullMode = false;
  if (reason) {
    win.__testEnvForceOfflineReason = reason;
  } else {
    delete win.__testEnvForceOfflineReason;
  }
  if (typeof document !== 'undefined' && document.body) {
    if (reason) {
      document.body.dataset.testEnvForceOfflineReason = reason;
    } else {
      delete document.body.dataset.testEnvForceOfflineReason;
    }
    document.body.dataset.testMode = 'flat';
  }
  console.log('[test-mode]', 'set mode=flat', 'reason=' + (reason ?? 'null'));
}

export function setRecoveryMode(reason?: string) {
  const win = window as WindowWithFlags;
  win.__testEnvFlatMode = false;
  win.__testEnvRecoveryMode = true;
  win.__testEnvFullMode = false;
  if (reason) {
    win.__testEnvForceOfflineReason = reason;
  } else {
    delete win.__testEnvForceOfflineReason;
  }
  if (typeof document !== 'undefined' && document.body) {
    if (reason) {
      document.body.dataset.testEnvForceOfflineReason = reason;
    } else {
      delete document.body.dataset.testEnvForceOfflineReason;
    }
    document.body.dataset.testMode = 'recovery';
  }
  console.log('[test-mode]', 'set mode=recovery', 'reason=' + (reason ?? 'null'));
}

export function setFullMode(reason?: string) {
  const win = window as WindowWithFlags;
  win.__testEnvFlatMode = false;
  win.__testEnvRecoveryMode = false;
  win.__testEnvFullMode = true;
  if (reason) {
    win.__testEnvForceOfflineReason = reason;
  } else {
    delete win.__testEnvForceOfflineReason;
  }
  if (typeof document !== 'undefined' && document.body) {
    if (reason) {
      document.body.dataset.testEnvForceOfflineReason = reason;
    } else {
      delete document.body.dataset.testEnvForceOfflineReason;
    }
    document.body.dataset.testMode = 'full';
  }
  console.log('[test-mode]', 'set mode=full', 'reason=' + (reason ?? 'null'));
}
