"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_SCENE_READ_CONCURRENCY = void 0;
exports.registerProjectLoaderIpc = registerProjectLoaderIpc;
exports.runWithConcurrency = runWithConcurrency;
exports.extractFrontMatter = extractFrontMatter;
exports.parseFrontMatterValue = parseFrontMatterValue;
const electron_1 = require("electron");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const projectLoader_1 = require("../shared/ipc/projectLoader");
const layoutIpc_js_1 = require("./layoutIpc.js");
const ISSUE_PREFIX = '[projectLoader]';
exports.MAX_SCENE_READ_CONCURRENCY = 8;
let devProjectPathOverride = null;
function logIssue(issue) {
    const scope = issue.level === 'error' ? 'error' : 'warn';
    console[scope](ISSUE_PREFIX, issue.message, issue.path ? `(${issue.path})` : '', issue.detail ?? '');
}
function registerProjectLoaderIpc() {
    electron_1.ipcMain.removeHandler(projectLoader_1.PROJECT_LOADER_CHANNELS.openDialog);
    electron_1.ipcMain.removeHandler(projectLoader_1.PROJECT_LOADER_CHANNELS.loadProject);
    electron_1.ipcMain.removeHandler(projectLoader_1.PROJECT_LOADER_CHANNELS.getSamplePath);
    electron_1.ipcMain.removeHandler(projectLoader_1.PROJECT_LOADER_CHANNELS.setDevProjectPath);
    electron_1.ipcMain.handle(projectLoader_1.PROJECT_LOADER_CHANNELS.openDialog, async () => {
        const override = devProjectPathOverride;
        if (override) {
            try {
                const stats = await promises_1.default.stat(override);
                if (stats.isDirectory()) {
                    return {
                        canceled: false,
                        filePath: override,
                    };
                }
            }
            catch (error) {
                console.warn('[projectLoader] dev override path invalid', error);
            }
        }
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        return {
            canceled: result.canceled,
            filePath: result.filePaths?.[0],
        };
    });
    electron_1.ipcMain.handle(projectLoader_1.PROJECT_LOADER_CHANNELS.setDevProjectPath, async (_event, nextPath) => {
        if (typeof nextPath === 'string' && nextPath.trim().length > 0) {
            devProjectPathOverride = node_path_1.default.resolve(nextPath);
        }
        else {
            devProjectPathOverride = null;
        }
    });
    electron_1.ipcMain.handle(projectLoader_1.PROJECT_LOADER_CHANNELS.loadProject, async (_event, request) => {
        if (!request?.path) {
            return {
                ok: false,
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project path is required.',
                },
            };
        }
        try {
            const { project, issues } = await loadProjectFromDisk(request.path);
            issues.forEach(logIssue);
            (0, layoutIpc_js_1.authorizeProjectPath)(project.path);
            return { ok: true, project, issues };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            const aggregate = error instanceof ProjectLoaderAggregateError ? error : undefined;
            const fallbackCode = mapSystemErrorCode(error?.code);
            const mappedCode = aggregate?.code ?? fallbackCode;
            const issues = aggregate?.issues;
            issues?.forEach(logIssue);
            return {
                ok: false,
                error: {
                    code: mappedCode,
                    message,
                    issues,
                },
            };
        }
    });
    electron_1.ipcMain.handle(projectLoader_1.PROJECT_LOADER_CHANNELS.getSamplePath, async () => {
        const samplePath = await resolveSampleProjectPath();
        return samplePath;
    });
}
class ProjectLoaderAggregateError extends Error {
    issues;
    code;
    constructor(message, issues, code = 'UNKNOWN') {
        super(message);
        this.issues = issues;
        this.code = code;
        this.name = 'ProjectLoaderAggregateError';
    }
}
function mapSystemErrorCode(code) {
    switch (code) {
        case 'ENOENT':
            return 'PROJECT_NOT_FOUND';
        default:
            return 'UNKNOWN';
    }
}
async function loadProjectFromDisk(projectPath) {
    const normalizedPath = node_path_1.default.resolve(projectPath);
    const outline = await readOutline(normalizedPath);
    const { scenes, issues, drafts } = await readScenes(normalizedPath);
    const project = {
        path: normalizedPath,
        name: node_path_1.default.basename(normalizedPath),
        outline,
        scenes,
        drafts,
    };
    return { project, issues };
}
async function readOutline(projectPath) {
    const outlinePath = node_path_1.default.join(projectPath, 'outline.json');
    let raw;
    try {
        raw = await promises_1.default.readFile(outlinePath, 'utf8');
    }
    catch (error) {
        const err = new ProjectLoaderAggregateError('Unable to read outline.json for the selected project.', [
            {
                level: 'error',
                message: 'outline.json could not be read.',
                detail: error instanceof Error ? error.message : String(error),
                path: outlinePath,
            },
        ], 'OUTLINE_NOT_FOUND');
        if (error instanceof Error && 'code' in error) {
            err.originalCode = error.code;
        }
        throw err;
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        throw new ProjectLoaderAggregateError('outline.json is not valid JSON.', [
            {
                level: 'error',
                message: 'outline.json failed to parse.',
                detail: error instanceof Error ? error.message : String(error),
                path: outlinePath,
            },
        ], 'OUTLINE_INVALID');
    }
    if (parsed.schema_version !== 'OutlineSchema v1') {
        throw new ProjectLoaderAggregateError('outline.json uses an unsupported schema version.', [
            {
                level: 'error',
                message: `Expected schema_version "OutlineSchema v1" but received "${parsed.schema_version}".`,
                path: outlinePath,
            },
        ], 'OUTLINE_INVALID');
    }
    if (!Array.isArray(parsed.scenes)) {
        throw new ProjectLoaderAggregateError('outline.json is missing a scenes array.', [
            {
                level: 'error',
                message: 'outline.json missing scenes array.',
                path: outlinePath,
            },
        ], 'OUTLINE_INVALID');
    }
    return parsed;
}
async function runWithConcurrency(items, concurrency, worker) {
    if (items.length === 0) {
        return;
    }
    const effectiveConcurrency = Math.max(1, Math.min(concurrency, items.length));
    let index = 0;
    const runner = async () => {
        while (true) {
            const currentIndex = index;
            index += 1;
            if (currentIndex >= items.length) {
                return;
            }
            await worker(items[currentIndex]);
        }
    };
    await Promise.all(Array.from({ length: effectiveConcurrency }, runner));
}
async function readScenes(projectPath) {
    const draftsPath = node_path_1.default.join(projectPath, 'drafts');
    let entries;
    try {
        entries = await promises_1.default.readdir(draftsPath);
    }
    catch (error) {
        const err = new ProjectLoaderAggregateError('Could not read drafts directory.', [
            {
                level: 'error',
                message: 'drafts folder missing or inaccessible.',
                detail: error instanceof Error ? error.message : String(error),
                path: draftsPath,
            },
        ], 'DRAFTS_NOT_FOUND');
        if (error instanceof Error && 'code' in error) {
            err.originalCode = error.code;
        }
        throw err;
    }
    const scenes = [];
    const issues = [];
    const drafts = {};
    const markdownEntries = entries
        .filter((entry) => entry.toLowerCase().endsWith('.md'))
        .map((entry) => ({
        entry,
        filePath: node_path_1.default.join(draftsPath, entry),
    }));
    await runWithConcurrency(markdownEntries, exports.MAX_SCENE_READ_CONCURRENCY, async ({ entry, filePath }) => {
        try {
            const scene = await parseSceneFile(filePath, entry);
            scenes.push(scene.metadata);
            drafts[scene.metadata.id] = scene.markdown;
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            const issue = {
                level: 'warning',
                message: 'Unable to parse scene metadata.',
                detail,
                path: filePath,
            };
            issues.push(issue);
        }
    });
    scenes.sort((a, b) => a.order - b.order);
    return { scenes, issues, drafts };
}
async function parseSceneFile(filePath, entry) {
    const raw = await promises_1.default.readFile(filePath, 'utf8');
    const meta = extractFrontMatter(raw);
    if (!meta) {
        throw new Error('Missing front matter header.');
    }
    const id = ensureString(meta.id);
    const title = ensureString(meta.title);
    const orderValue = meta.order;
    const order = typeof orderValue === 'number' ? orderValue : Number(orderValue);
    if (!id || !title || Number.isNaN(order)) {
        throw new Error('Front matter missing required fields (id, title, order).');
    }
    const expectedId = entry.replace(/\.md$/i, '');
    if (expectedId !== id) {
        throw new Error(`Scene id mismatch: expected ${expectedId} but front matter declared ${id}.`);
    }
    const scene = {
        id,
        title,
        order,
    };
    const optionalKeys = [
        'slug',
        'pov',
        'purpose',
        'goal',
        'conflict',
        'turn',
        'emotion_tag',
        'chapter_id',
    ];
    for (const key of optionalKeys) {
        const value = meta[key];
        if (typeof value === 'string' && value.length > 0) {
            scene[key] = value;
        }
    }
    if (typeof meta.word_target === 'number') {
        scene.word_target = meta.word_target;
    }
    else if (typeof meta.word_target === 'string') {
        const parsedWordTarget = Number(meta.word_target);
        if (!Number.isNaN(parsedWordTarget)) {
            scene.word_target = parsedWordTarget;
        }
    }
    if (Array.isArray(meta.beats)) {
        scene.beats = meta.beats.map((beat) => ensureString(beat)).filter(Boolean);
    }
    else if (typeof meta.beats === 'string') {
        scene.beats = meta.beats
            .split(',')
            .map((beat) => ensureString(beat))
            .filter(Boolean);
    }
    return { metadata: scene, markdown: raw };
}
function extractFrontMatter(raw) {
    const lines = raw.split(/\r?\n/);
    if (lines[0]?.trim() !== '---') {
        return null;
    }
    const frontMatterLines = [];
    for (let index = 1; index < lines.length; index += 1) {
        const line = lines[index];
        if (line.trim() === '---') {
            break;
        }
        frontMatterLines.push(line);
    }
    const data = {};
    let currentKey = null;
    let buffer = [];
    const commitBuffer = () => {
        if (!currentKey) {
            return;
        }
        const value = parseFrontMatterValue(buffer.join('\n'));
        data[currentKey] = value;
        currentKey = null;
        buffer = [];
    };
    for (const line of frontMatterLines) {
        if (/^\s/.test(line)) {
            buffer.push(line.trim());
            continue;
        }
        if (currentKey) {
            commitBuffer();
        }
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
            continue;
        }
        currentKey = line.slice(0, separatorIndex).trim();
        const remainder = line.slice(separatorIndex + 1).trim();
        if (remainder.length === 0) {
            buffer = [];
            continue;
        }
        buffer = [remainder];
        commitBuffer();
    }
    if (currentKey) {
        commitBuffer();
    }
    return data;
}
function parseFrontMatterValue(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        return '';
    }
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
        return trimmed.slice(1, -1);
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const inner = trimmed.slice(1, -1).trim();
        if (!inner) {
            return [];
        }
        return inner
            .split(',')
            .map((item) => item.trim())
            .map((item) => item.replace(/^['"]|['"]$/g, ''))
            .filter((item) => item.length > 0);
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        const numeric = Number(trimmed);
        if (!Number.isNaN(numeric)) {
            return numeric;
        }
    }
    return trimmed;
}
function ensureString(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        return value.toString();
    }
    return '';
}
async function resolveSampleProjectPath() {
    const knownRelative = node_path_1.default.join('sample_project', 'Esther_Estate');
    const candidates = [
        node_path_1.default.resolve(electron_1.app.getAppPath(), '..', knownRelative),
        node_path_1.default.resolve(electron_1.app.getAppPath(), knownRelative),
        node_path_1.default.resolve(electron_1.app.getAppPath(), '..', '..', knownRelative),
        node_path_1.default.resolve(process.cwd(), knownRelative),
        node_path_1.default.resolve(process.cwd(), '..', knownRelative),
        node_path_1.default.resolve(process.cwd(), '..', '..', knownRelative),
    ];
    for (const candidate of candidates) {
        try {
            const stats = await promises_1.default.stat(candidate);
            if (stats.isDirectory()) {
                return candidate;
            }
        }
        catch {
            // ignore and continue
        }
    }
    return null;
}
//# sourceMappingURL=projectLoaderIpc.js.map