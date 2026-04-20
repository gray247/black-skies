"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHarnessHooksEnabled = isHarnessHooksEnabled;
exports.getMode = getMode;
exports.isFlat = isFlat;
exports.isFlatMode = isFlatMode;
exports.isRecovery = isRecovery;
exports.isRecoveryMode = isRecoveryMode;
exports.isFull = isFull;
exports.isTestEnv = isTestEnv;
exports.isStableDock = isStableDock;
exports.isVisualHome = isVisualHome;
exports.getOfflineReason = getOfflineReason;
exports.isForcedOffline = isForcedOffline;
exports.testModeFreezeServiceHealth = testModeFreezeServiceHealth;
function getWindow() {
    if (typeof window === 'undefined') {
        return undefined;
    }
    return window;
}
function datasetFlagEnabled(flag) {
    if (typeof document === 'undefined') {
        return false;
    }
    const htmlValue = document.documentElement?.dataset?.[flag];
    if (htmlValue === '1') {
        return true;
    }
    const bodyValue = document.body?.dataset?.[flag];
    return bodyValue === '1';
}
function isHarnessHooksEnabled() {
    return typeof process !== 'undefined' && process.env?.BLACKSKIES_ENABLE_HARNESS_HOOKS === '1';
}
function getMode() {
    if (!isHarnessHooksEnabled()) {
        return 'none';
    }
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
function isFlatMode() {
    return isFlat();
}
function isRecovery() {
    return getMode() === 'recovery';
}
function isRecoveryMode() {
    return isRecovery();
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
    if (!isHarnessHooksEnabled()) {
        return false;
    }
    const datasetFlag = typeof document !== 'undefined' &&
        (document.body?.dataset?.testStableDock === '1' ||
            document.documentElement?.dataset?.testStableDock === '1');
    return datasetFlag;
}
function isVisualHome() {
    if (!isHarnessHooksEnabled()) {
        return false;
    }
    const datasetFlag = typeof document !== 'undefined' &&
        (document.body?.dataset?.testVisualStable === '1' ||
            document.documentElement?.dataset?.testVisualStable === '1');
    return datasetFlag;
}
function getOfflineReason() {
    if (!isHarnessHooksEnabled()) {
        return null;
    }
    const datasetReason = typeof document !== 'undefined' ? document.body?.dataset?.testEnvForceOfflineReason ?? null : null;
    if (datasetReason) {
        return datasetReason;
    }
    if (datasetFlagEnabled('testForceOffline')) {
        return 'test-offline';
    }
    return null;
}
function isForcedOffline() {
    if (!isHarnessHooksEnabled()) {
        return false;
    }
    const datasetReason = typeof document !== 'undefined' ? document.body?.dataset?.testEnvForceOfflineReason : null;
    return Boolean(datasetReason || datasetFlagEnabled('testForceOffline'));
}
function testModeFreezeServiceHealth() {
    if (!isHarnessHooksEnabled()) {
        return false;
    }
    return Boolean(datasetFlagEnabled('testModeFreezeServiceHealth'));
}
//# sourceMappingURL=testModeManager.js.map