"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('electron', () => ({
    app: {
        getAppPath: vitest_1.vi.fn(() => process.cwd()),
    },
    dialog: {
        showOpenDialog: vitest_1.vi.fn(),
    },
    ipcMain: {
        handle: vitest_1.vi.fn(),
        removeHandler: vitest_1.vi.fn(),
        removeAllListeners: vitest_1.vi.fn(),
    },
}));
const projectLoaderIpc_1 = require("../projectLoaderIpc");
(0, vitest_1.describe)('projectLoaderIpc helpers', () => {
    (0, vitest_1.it)('extractFrontMatter parses scalar and array values', () => {
        const raw = `---
id: sc-001
title: The Vault
order: 2
beats: ["setup", "turn"]
word_target: 900
---
Scene body`;
        const frontMatter = (0, projectLoaderIpc_1.extractFrontMatter)(raw);
        (0, vitest_1.expect)(frontMatter).not.toBeNull();
        (0, vitest_1.expect)(frontMatter).toMatchObject({
            id: 'sc-001',
            title: 'The Vault',
            order: 2,
            beats: ['setup', 'turn'],
            word_target: 900,
        });
    });
    (0, vitest_1.it)('parseFrontMatterValue handles quoted strings and numbers', () => {
        (0, vitest_1.expect)((0, projectLoaderIpc_1.parseFrontMatterValue)('"whisper"')).toBe('whisper');
        (0, vitest_1.expect)((0, projectLoaderIpc_1.parseFrontMatterValue)('["one","two"]')).toEqual(['one', 'two']);
        (0, vitest_1.expect)((0, projectLoaderIpc_1.parseFrontMatterValue)('42')).toBe(42);
    });
    (0, vitest_1.it)('runWithConcurrency limits concurrent executions', async () => {
        const items = Array.from({ length: 5 }, (_, index) => index);
        let active = 0;
        let peak = 0;
        await (0, projectLoaderIpc_1.runWithConcurrency)(items, 2, async () => {
            active += 1;
            peak = Math.max(peak, active);
            await new Promise((resolve) => setTimeout(resolve, 5));
            active -= 1;
        });
        (0, vitest_1.expect)(peak).toBeLessThanOrEqual(2);
        (0, vitest_1.expect)(projectLoaderIpc_1.MAX_SCENE_READ_CONCURRENCY).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=projectLoaderIpc.test.js.map