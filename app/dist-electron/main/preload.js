"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceApi = void 0;
exports.makeServiceCall = makeServiceCall;
const electron_1 = require("electron");
const logging_js_1 = require("../shared/ipc/logging.js");
const runtime_js_1 = require("../shared/config/runtime.js");
const projectLoader_js_1 = require("../shared/ipc/projectLoader.js");
const diagnostics_js_1 = require("../shared/ipc/diagnostics.js");
const LOG_LEVEL_MAP = {
    log: 'info',
    info: 'info',
    warn: 'warn',
    error: 'error',
    debug: 'debug',
};
const runtimeConfig = (0, runtime_js_1.loadRuntimeConfig)();
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
    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
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
        const response = await fetch(url);
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
registerConsoleForwarding();
electron_1.contextBridge.exposeInMainWorld('projectLoader', projectLoaderApi);
electron_1.contextBridge.exposeInMainWorld('services', servicesBridge);
electron_1.contextBridge.exposeInMainWorld('diagnostics', diagnosticsBridge);
electron_1.contextBridge.exposeInMainWorld('runtimeConfig', runtimeConfig);
//# sourceMappingURL=preload.js.map