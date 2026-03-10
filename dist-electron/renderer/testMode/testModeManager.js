"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMode = getMode;
exports.isFlat = isFlat;
exports.isRecovery = isRecovery;
exports.isFull = isFull;
exports.isTestEnv = isTestEnv;
exports.isStableDock = isStableDock;
exports.getOfflineReason = getOfflineReason;
exports.isForcedOffline = isForcedOffline;
function getWindow() {
    if (typeof window === 'undefined') {
        return undefined;
    }
    return window;
}
function getMode() {
    const win = getWindow();
    if (!win) {
        return 'none';
    }
    if (win.__testEnvFlatMode === true) {
        return 'flat';
    }
    if (win.__testEnvRecoveryMode === true) {
        return 'recovery';
    }
    if (win.__testEnvFullMode === true) {
        return 'full';
    }
    return 'none';
}
function isFlat() {
    return getMode() === 'flat';
}
function isRecovery() {
    return getMode() === 'recovery';
}
function isFull() {
    const mode = getMode();
    return mode === 'full' || mode === 'none';
}
function isTestEnv() {
    const win = getWindow();
    const documentTestEnv = typeof document !== 'undefined' && document.body?.dataset?.testEnv === '1';
    if (!win) {
        return false;
    }
    const envFlag = win.__testEnv;
    const isPlaywrightFlag = envFlag === true ||
        (envFlag !== false && typeof envFlag === 'object' && envFlag.isPlaywright === true);
    return Boolean(isPlaywrightFlag || documentTestEnv);
}
function isStableDock() {
    if (typeof document !== 'undefined' && document.body?.dataset?.testStableDock === '1') {
        return true;
    }
    const win = getWindow();
    return Boolean(win?.__testEnvStableDock === true || win?.__testEnvFullMode === true);
}
function getOfflineReason() {
    const win = getWindow();
    const datasetReason = typeof document !== 'undefined' ? document.body?.dataset?.testEnvForceOfflineReason ?? null : null;
    if (datasetReason) {
        return datasetReason;
    }
    if (win?.__testEnvForceOffline) {
        return 'test-offline';
    }
    if (win?.__testEnvForceOfflineReason) {
        return win.__testEnvForceOfflineReason;
    }
    return null;
}
function isForcedOffline() {
    const win = getWindow();
    const datasetReason = typeof document !== 'undefined' ? document.body?.dataset?.testEnvForceOfflineReason : null;
    return Boolean(datasetReason || win?.__testEnvForceOffline === true);
}
//# sourceMappingURL=testModeManager.js.map