"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceApi = void 0;
exports.makeServiceCall = makeServiceCall;
const electron_1 = require("electron");
const logging_js_1 = require("../shared/ipc/logging.js");
const runtime_js_1 = require("../shared/config/runtime.js");
const projectLoader_js_1 = require("../shared/ipc/projectLoader.js");
const diagnostics_js_1 = require("../shared/ipc/diagnostics.js");
const layout_js_1 = require("../shared/ipc/layout.js");
class BridgeCircuitOpenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BridgeCircuitOpenError';
    }
}
class BridgeTimeoutError extends Error {
    timeoutMs;
    constructor(timeoutMs) {
        super(`Request timed out after ${timeoutMs}ms.`);
        this.timeoutMs = timeoutMs;
        this.name = 'BridgeTimeoutError';
    }
}
class BridgeNetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BridgeNetworkError';
    }
}
class CircuitBreaker {
    failureThreshold;
    resetMs;
    failureCount = 0;
    state = 'closed';
    openedAt = 0;
    constructor(failureThreshold, resetMs) {
        this.failureThreshold = failureThreshold;
        this.resetMs = resetMs;
    }
    allow() {
        if (this.state === 'open') {
            if (this.resetMs === 0) {
                return false;
            }
            const elapsed = Date.now() - this.openedAt;
            if (elapsed >= this.resetMs) {
                this.state = 'half-open';
                return true;
            }
            return false;
        }
        return true;
    }
    recordSuccess() {
        this.failureCount = 0;
        this.state = 'closed';
    }
    recordFailure() {
        this.failureCount += 1;
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'open';
            this.openedAt = Date.now();
            return true;
        }
        return false;
    }
}
function parsePositiveInt(value, fallback) {
    if (!value) {
        return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}
const REQUEST_POLICY = {
    timeoutMs: parsePositiveInt(process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS, 45_000),
    maxAttempts: Math.max(1, parsePositiveInt(process.env.BLACKSKIES_BRIDGE_MAX_ATTEMPTS, 2)),
    backoffMs: Math.max(0, parsePositiveInt(process.env.BLACKSKIES_BRIDGE_BACKOFF_MS, 250)),
    circuitFailureThreshold: Math.max(1, parsePositiveInt(process.env.BLACKSKIES_BRIDGE_FAILURE_THRESHOLD, 3)),
    circuitResetMs: Math.max(0, parsePositiveInt(process.env.BLACKSKIES_BRIDGE_RESET_MS, 15_000)),
};
const REQUEST_BREAKER = new CircuitBreaker(REQUEST_POLICY.circuitFailureThreshold, REQUEST_POLICY.circuitResetMs);
const LOG_LEVEL_MAP = {
    log: 'info',
    info: 'info',
    warn: 'warn',
    error: 'error',
    debug: 'debug',
};
const runtimeConfig = (0, runtime_js_1.loadRuntimeConfig)();
async function sleep(milliseconds) {
    if (milliseconds <= 0) {
        return;
    }
    await new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}
function currentServicePort() {
    const raw = process.env.BLACKSKIES_SERVICES_PORT;
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
}
function normalizeError(message, extra) {
    return {
        message,
        ...extra,
    };
}
async function fetchWithTimeout(url, init, timeoutMs) {
    if (timeoutMs <= 0) {
        return fetch(url, init);
    }
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    }
    catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new BridgeTimeoutError(timeoutMs);
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new BridgeNetworkError(message);
    }
    finally {
        clearTimeout(timeoutHandle);
    }
}
async function fetchWithResilience(url, init, method) {
    let lastError;
    for (let attempt = 1; attempt <= REQUEST_POLICY.maxAttempts; attempt += 1) {
        if (!REQUEST_BREAKER.allow()) {
            throw new BridgeCircuitOpenError('Service bridge circuit is open.');
        }
        try {
            const response = await fetchWithTimeout(url, init, REQUEST_POLICY.timeoutMs);
            REQUEST_BREAKER.recordSuccess();
            return response;
        }
        catch (error) {
            lastError = error;
            let circuitOpened = false;
            if (!(error instanceof BridgeCircuitOpenError)) {
                circuitOpened = REQUEST_BREAKER.recordFailure();
                if (circuitOpened && !(error instanceof BridgeTimeoutError)) {
                    lastError = new BridgeCircuitOpenError('Service bridge circuit is open.');
                }
            }
            const retryable = method === 'GET' && attempt < REQUEST_POLICY.maxAttempts && !circuitOpened;
            if (!retryable) {
                break;
            }
            await sleep(REQUEST_POLICY.backoffMs * attempt);
        }
    }
    if (lastError instanceof Error) {
        throw lastError;
    }
    throw new Error('Service request failed.');
}
function formatLogArgument(argument) {
    if (typeof argument === 'string') {
        return argument;
    }
    if (argument instanceof Error) {
        return argument.stack ?? `${argument.name}: ${argument.message}`;
    }
    const seen = new WeakSet();
    try {
        const json = JSON.stringify(argument, (_key, value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            if (typeof value === 'symbol') {
                return value.toString();
            }
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
            }
            return value;
        }, 2);
        if (typeof json === 'string') {
            return json;
        }
    }
    catch (error) {
        // Ignore serialization errors and fall through to the string fallback.
    }
    return String(argument);
}
async function parseErrorPayload(response, headerTraceId) {
    let payload;
    try {
        payload = await response.json();
    }
    catch (parseError) {
        return normalizeError(`Service responded with HTTP ${response.status}.`, {
            httpStatus: response.status,
            details: { parseError: String(parseError) },
            traceId: headerTraceId,
        });
    }
    let payloadTraceId;
    if (payload && typeof payload === 'object' && 'trace_id' in payload) {
        const traceCandidate = payload.trace_id;
        if (typeof traceCandidate === 'string' && traceCandidate.length > 0) {
            payloadTraceId = traceCandidate;
        }
    }
    const traceId = payloadTraceId ?? headerTraceId;
    if (payload &&
        typeof payload === 'object' &&
        'code' in payload &&
        typeof payload.code === 'string') {
        return {
            code: payload.code,
            message: typeof payload.message === 'string'
                ? payload.message
                : `Service responded with HTTP ${response.status}.`,
            details: payload.details,
            httpStatus: response.status,
            traceId,
        };
    }
    return normalizeError(`Service responded with HTTP ${response.status}.`, {
        httpStatus: response.status,
        details: payload ?? undefined,
        traceId,
    });
}
async function makeServiceCall(path, method, body) {
    const port = currentServicePort();
    if (!port) {
        return { ok: false, error: normalizeError('Service port is unavailable.') };
    }
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `http://127.0.0.1:${port}/api/v1/${normalizedPath}`;
    const headers = {
        'Content-Type': 'application/json',
    };
    const requestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };
    try {
        const response = await fetchWithResilience(url, requestInit, method);
        const traceId = response.headers.get('x-trace-id') ?? undefined;
        if (!response.ok) {
            const error = await parseErrorPayload(response, traceId);
            return { ok: false, error, traceId: error.traceId ?? traceId };
        }
        if (response.status === 204) {
            return { ok: true, data: undefined, traceId };
        }
        try {
            const data = (await response.json());
            return { ok: true, data, traceId };
        }
        catch (parseError) {
            const parseMessage = parseError instanceof Error ? parseError.message : String(parseError);
            const error = normalizeError('Failed to parse response payload.', {
                traceId,
                httpStatus: response.status,
                details: { parseError: parseMessage },
            });
            return { ok: false, error, traceId };
        }
    }
    catch (error) {
        if (error instanceof BridgeCircuitOpenError) {
            return {
                ok: false,
                error: normalizeError('Service requests temporarily unavailable.', {
                    code: 'SERVICE_UNAVAILABLE',
                }),
            };
        }
        if (error instanceof BridgeTimeoutError) {
            return {
                ok: false,
                error: normalizeError(error.message, {
                    code: 'TIMEOUT',
                    details: { timeout_ms: error.timeoutMs },
                }),
            };
        }
        if (error instanceof BridgeNetworkError) {
            return {
                ok: false,
                error: normalizeError(error.message, {
                    code: 'NETWORK_ERROR',
                }),
            };
        }
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: normalizeError(message) };
    }
}
async function probeHealth() {
    const port = currentServicePort();
    if (!port) {
        return {
            ok: false,
            error: normalizeError('Service port is unavailable.'),
        };
    }
    const url = `http://127.0.0.1:${port}/api/v1/healthz`;
    try {
        const response = await fetchWithResilience(url, { method: 'GET' }, 'GET');
        const traceId = response.headers.get('x-trace-id') ?? undefined;
        if (!response.ok) {
            const error = await parseErrorPayload(response, traceId);
            return {
                ok: false,
                error,
                traceId: error.traceId ?? traceId,
            };
        }
        let data;
        try {
            data = (await response.json());
        }
        catch (parseError) {
            const parseMessage = parseError instanceof Error ? parseError.message : String(parseError);
            return {
                ok: false,
                error: normalizeError('Failed to parse health payload.', {
                    traceId,
                    httpStatus: response.status,
                    details: { parseError: parseMessage },
                }),
                traceId,
            };
        }
        if (data?.status === 'ok') {
            return { ok: true, data, traceId };
        }
        return {
            ok: false,
            data,
            error: normalizeError('Service reported an unhealthy status.', {
                traceId,
                httpStatus: response.status,
            }),
            traceId,
        };
    }
    catch (error) {
        if (error instanceof BridgeCircuitOpenError) {
            return {
                ok: false,
                error: normalizeError('Service requests temporarily unavailable.'),
            };
        }
        if (error instanceof BridgeTimeoutError) {
            return {
                ok: false,
                error: normalizeError(error.message, {
                    code: 'TIMEOUT',
                    details: { timeout_ms: error.timeoutMs },
                }),
            };
        }
        if (error instanceof BridgeNetworkError) {
            return {
                ok: false,
                error: normalizeError(error.message, { code: 'NETWORK_ERROR' }),
            };
        }
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: normalizeError(message) };
    }
}
function forwardConsole(method) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
        original(...args);
        try {
            const payload = {
                level: LOG_LEVEL_MAP[method],
                scope: 'renderer.console',
                message: args.map((argument) => formatLogArgument(argument)).join(' '),
            };
            electron_1.ipcRenderer.send(logging_js_1.LOGGING_CHANNELS.diagnostics, payload);
        }
        catch (error) {
            original('Failed to forward renderer log entry', error);
        }
    };
}
function registerConsoleForwarding() {
    Object.keys(LOG_LEVEL_MAP).forEach((method) => {
        forwardConsole(method);
    });
}
function buildProjectPayload(projectId, extras = {}) {
    return {
        project_id: projectId,
        ...extras,
    };
}
function normalizedString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function setOptional(target, key, value) {
    if (value !== undefined && value !== null) {
        target[key] = value;
    }
}
function setOptionalString(target, key, value) {
    const normalized = normalizedString(value);
    if (normalized !== undefined) {
        target[key] = normalized;
    }
}
function serializeOutlineRequest({ projectId, forceRebuild, wizardLocks, }) {
    return buildProjectPayload(projectId, {
        force_rebuild: Boolean(forceRebuild),
        wizard_locks: {
            acts: wizardLocks.acts.map(({ title }) => ({ title })),
            chapters: wizardLocks.chapters.map(({ title, actIndex }) => ({
                title,
                act_index: actIndex,
            })),
            scenes: wizardLocks.scenes.map(({ title, chapterIndex, beatRefs }) => ({
                title,
                chapter_index: chapterIndex,
                beat_refs: beatRefs ?? [],
            })),
        },
    });
}
function serializeWizardSnapshotRequest({ projectId, step, label, includes, }) {
    const payload = buildProjectPayload(projectId, { step });
    setOptionalString(payload, 'label', label);
    if (includes && includes.length > 0) {
        setOptional(payload, 'includes', includes);
    }
    return payload;
}
function serializeDraftOverrides(overrides) {
    if (!overrides) {
        return undefined;
    }
    const entries = [];
    for (const [key, override] of Object.entries(overrides)) {
        if (!override) {
            continue;
        }
        entries.push([
            key,
            {
                order: override.order,
                purpose: override.purpose,
                emotion_tag: override.emotion_tag,
                pov: override.pov,
                goal: override.goal,
                conflict: override.conflict,
                turn: override.turn,
                word_target: override.word_target,
                beats: override.beats,
            },
        ]);
    }
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}
function serializeDraftGenerateRequest({ projectId, unitScope, unitIds, temperature, seed, overrides, }) {
    return buildProjectPayload(projectId, {
        unit_scope: unitScope,
        unit_ids: unitIds,
        temperature,
        seed,
        overrides: serializeDraftOverrides(overrides),
    });
}
function serializeCritiqueRequest({ projectId, draftId, unitId, rubric, }) {
    return buildProjectPayload(projectId, {
        draft_id: draftId,
        unit_id: unitId,
        rubric,
    });
}
function serializeAcceptRequest({ projectId, draftId, unitId, unit, message, snapshotLabel, }) {
    const unitPayload = {
        id: unit.id,
        previous_sha256: unit.previous_sha256,
        text: unit.text,
    };
    if (unit.meta && Object.keys(unit.meta).length > 0) {
        unitPayload.meta = unit.meta;
    }
    const payload = {
        project_id: projectId,
        draft_id: draftId,
        unit_id: unitId,
        unit: unitPayload,
    };
    setOptionalString(payload, 'message', message);
    setOptionalString(payload, 'snapshot_label', snapshotLabel);
    return payload;
}
function serializePreflightRequest({ projectId, unitScope, unitIds, }) {
    return buildProjectPayload(projectId, {
        unit_scope: unitScope,
        unit_ids: unitIds,
    });
}
function serializeRecoveryRestoreRequest({ projectId, snapshotId, }) {
    const payload = buildProjectPayload(projectId);
    setOptionalString(payload, 'snapshot_id', snapshotId);
    return payload;
}
exports.serviceApi = {
    buildOutline: (request) => makeServiceCall('outline/build', 'POST', serializeOutlineRequest(request)),
    generateDraft: (request) => makeServiceCall('draft/generate', 'POST', serializeDraftGenerateRequest(request)),
    critiqueDraft: (request) => makeServiceCall('draft/critique', 'POST', serializeCritiqueRequest(request)),
    preflightDraft: (request) => makeServiceCall('draft/preflight', 'POST', serializePreflightRequest(request)),
    acceptDraft: (request) => makeServiceCall('draft/accept', 'POST', serializeAcceptRequest(request)),
    createSnapshot: (request) => makeServiceCall('draft/wizard/lock', 'POST', serializeWizardSnapshotRequest(request)),
    getRecoveryStatus: (request) => {
        const params = new URLSearchParams({ project_id: request.projectId });
        return makeServiceCall(`draft/recovery?${params.toString()}`, 'GET');
    },
    restoreSnapshot: (request) => makeServiceCall('draft/recovery/restore', 'POST', serializeRecoveryRestoreRequest(request)),
};
const projectLoaderApi = {
    async openProjectDialog() {
        const result = await electron_1.ipcRenderer.invoke(projectLoader_js_1.PROJECT_LOADER_CHANNELS.openDialog);
        return result;
    },
    async loadProject(request) {
        const response = await electron_1.ipcRenderer.invoke(projectLoader_js_1.PROJECT_LOADER_CHANNELS.loadProject, request);
        return response;
    },
    async getSampleProjectPath() {
        try {
            const path = await electron_1.ipcRenderer.invoke(projectLoader_js_1.PROJECT_LOADER_CHANNELS.getSamplePath);
            return typeof path === 'string' ? path : null;
        }
        catch (error) {
            console.warn('[preload] Failed to resolve sample project path', error);
            return null;
        }
    },
};
const diagnosticsBridge = {
    async openDiagnosticsFolder() {
        try {
            const response = await electron_1.ipcRenderer.invoke(diagnostics_js_1.DIAGNOSTICS_CHANNELS.openHistory);
            if (response &&
                typeof response === 'object' &&
                'ok' in response &&
                typeof response.ok === 'boolean') {
                return response;
            }
            return {
                ok: false,
                error: 'Diagnostics bridge returned an unexpected payload.',
            };
        }
        catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
};
const servicesBridge = {
    async checkHealth() {
        return probeHealth();
    },
    buildOutline: exports.serviceApi.buildOutline,
    generateDraft: exports.serviceApi.generateDraft,
    critiqueDraft: exports.serviceApi.critiqueDraft,
    preflightDraft: exports.serviceApi.preflightDraft,
    acceptDraft: exports.serviceApi.acceptDraft,
    createSnapshot: exports.serviceApi.createSnapshot,
    getRecoveryStatus: exports.serviceApi.getRecoveryStatus,
    restoreSnapshot: exports.serviceApi.restoreSnapshot,
};
const layoutBridge = {
    async loadLayout(request) {
        try {
            const response = await electron_1.ipcRenderer.invoke(layout_js_1.LAYOUT_CHANNELS.load, request);
            if (response && typeof response === 'object') {
                return response;
            }
            return { layout: null, floatingPanes: [], schemaVersion: 2 };
        }
        catch (error) {
            console.warn('[preload] Failed to load layout', error);
            return { layout: null, floatingPanes: [], schemaVersion: 2 };
        }
    },
    async saveLayout(request) {
        try {
            await electron_1.ipcRenderer.invoke(layout_js_1.LAYOUT_CHANNELS.save, request);
        }
        catch (error) {
            console.warn('[preload] Failed to save layout', error);
        }
    },
    async resetLayout(request) {
        try {
            await electron_1.ipcRenderer.invoke(layout_js_1.LAYOUT_CHANNELS.reset, request);
        }
        catch (error) {
            console.warn('[preload] Failed to reset layout', error);
        }
    },
    async openFloatingPane(request) {
        try {
            const result = await electron_1.ipcRenderer.invoke(layout_js_1.LAYOUT_CHANNELS.openFloating, request);
            return Boolean(result);
        }
        catch (error) {
            console.warn('[preload] Failed to open floating pane', error);
            return false;
        }
    },
    async closeFloatingPane(request) {
        try {
            await electron_1.ipcRenderer.invoke(layout_js_1.LAYOUT_CHANNELS.closeFloating, request);
        }
        catch (error) {
            console.warn('[preload] Failed to close floating pane', error);
        }
    },
    async listFloatingPanes(projectPath) {
        try {
            const response = await electron_1.ipcRenderer.invoke(layout_js_1.LAYOUT_CHANNELS.listFloating, projectPath);
            if (Array.isArray(response)) {
                return response;
            }
        }
        catch (error) {
            console.warn('[preload] Failed to list floating panes', error);
        }
        return [];
    },
};
registerConsoleForwarding();
electron_1.contextBridge.exposeInMainWorld('projectLoader', projectLoaderApi);
electron_1.contextBridge.exposeInMainWorld('services', servicesBridge);
electron_1.contextBridge.exposeInMainWorld('diagnostics', diagnosticsBridge);
electron_1.contextBridge.exposeInMainWorld('layout', layoutBridge);
electron_1.contextBridge.exposeInMainWorld('runtimeConfig', runtimeConfig);
if (process.env.PLAYWRIGHT === '1') {
    const devTools = {
        async setProjectDir(dir) {
            await electron_1.ipcRenderer.invoke(projectLoader_js_1.PROJECT_LOADER_CHANNELS.setDevProjectPath, dir);
        },
        overrideServices(overrides) {
            Object.assign(servicesBridge, overrides);
        },
    };
    if (process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1') {
        const disableAnimations = () => {
            if (typeof document === 'undefined') {
                return;
            }
            const existing = document.head.querySelector('[data-playwright-disable-animations="true"]');
            if (existing) {
                return;
            }
            const style = document.createElement('style');
            style.setAttribute('data-playwright-disable-animations', 'true');
            style.textContent = `
        *, *::before, *::after {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
          animation-delay: 0ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      `;
            document.head.appendChild(style);
        };
        if (typeof window !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', disableAnimations, { once: true });
            }
            else {
                disableAnimations();
            }
        }
    }
    electron_1.contextBridge.exposeInMainWorld('__dev', devTools);
}
//# sourceMappingURL=preload.js.map