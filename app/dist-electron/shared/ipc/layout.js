"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LAYOUT = exports.LAYOUT_CHANNELS = void 0;
exports.LAYOUT_CHANNELS = {
    load: "layout:load",
    save: "layout:save",
    reset: "layout:reset",
    listFloating: "layout:floating:list",
    openFloating: "layout:floating:open",
    closeFloating: "layout:floating:close",
};
exports.DEFAULT_LAYOUT = {
    direction: "row",
    first: "wizard",
    second: {
        direction: "row",
        first: {
            direction: "column",
            first: "draft-board",
            second: "history",
        },
        second: "critique",
    },
};
//# sourceMappingURL=layout.js.map