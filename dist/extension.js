/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerTodo = registerTodo;
const vscode = __importStar(__webpack_require__(2));
const provider_1 = __webpack_require__(3);
function registerTodo(context) {
    const provider = new provider_1.TodoProvider();
    vscode.window.registerTreeDataProvider("todoView", provider);
    context.subscriptions.push(vscode.commands.registerCommand("todo.add", async () => {
        const text = await vscode.window.showInputBox({
            prompt: "Add a new task",
        });
        if (text) {
            await provider.add(text.trim());
        }
    }), vscode.commands.registerCommand("todo.complete", (item) => item && provider.complete(item)), vscode.commands.registerCommand("todo.uncomplete", (item) => item && provider.uncomplete(item)), vscode.commands.registerCommand("todo.refresh", () => {
        provider.refresh();
    }), 
    // ✅ ESTE ES EL QUE FALTABA
    vscode.commands.registerCommand("todo.edit", async (item) => {
        if (!item)
            return;
        const text = await vscode.window.showInputBox({
            prompt: "Edit task",
            value: item.text,
        });
        if (text) {
            await provider.edit(item, text.trim());
        }
    }), 
    // (recomendado agregar también)
    vscode.commands.registerCommand("todo.remove", async (item) => {
        if (!item)
            return;
        await provider.remove(item);
    }));
}


/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TodoProvider = void 0;
const vscode = __importStar(__webpack_require__(2));
const persistence_1 = __webpack_require__(4);
class TodoProvider {
    _onDidChange = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChange.event;
    items = [];
    constructor() {
        void this.load();
    }
    async load() {
        const all = await (0, persistence_1.readTodos)();
        const pending = all
            .filter((i) => !i.completed)
            .sort((a, b) => b.date_added.localeCompare(a.date_added));
        const done = all
            .filter((i) => i.completed)
            .sort((a, b) => (b.date_finished ?? "").localeCompare(a.date_finished ?? ""));
        this.items = [...pending, ...done];
        this._onDidChange.fire();
    }
    refresh() {
        void this.load();
    }
    getTreeItem(item) {
        const added = formatDate(item.date_added);
        const finished = item.completed && item.date_finished
            ? ` (finished: ${formatDate(item.date_finished)})`
            : "";
        const label = `${added} – ${item.text}${finished}`;
        const treeItem = new vscode.TreeItem(label);
        treeItem.contextValue = item.completed ? "done" : "pending";
        treeItem.tooltip = label;
        treeItem.iconPath = new vscode.ThemeIcon(item.completed ? "check" : "circle-outline");
        return treeItem;
    }
    getChildren(element) {
        return Promise.resolve(element ? [] : this.items);
    }
    async add(text) {
        const todos = await (0, persistence_1.readTodos)();
        todos.push((0, persistence_1.makeTodo)(text));
        await (0, persistence_1.writeTodos)(todos);
        this.refresh();
    }
    async complete(item) {
        if (!item)
            return;
        const todos = await (0, persistence_1.readTodos)();
        const todo = todos.find((t) => t.id === item.id);
        if (!todo)
            return;
        todo.completed = true;
        todo.date_finished = new Date().toISOString();
        await (0, persistence_1.writeTodos)(todos);
        this.refresh();
    }
    async uncomplete(item) {
        if (!item)
            return;
        const todos = await (0, persistence_1.readTodos)();
        const todo = todos.find((t) => t.id === item.id);
        if (!todo)
            return;
        todo.completed = false;
        todo.date_finished = null;
        await (0, persistence_1.writeTodos)(todos);
        this.refresh();
    }
    async edit(item, newText) {
        const todos = await (0, persistence_1.readTodos)();
        const todo = todos.find((t) => t.id === item.id);
        if (!todo)
            return;
        todo.text = newText;
        await (0, persistence_1.writeTodos)(todos);
        this.refresh();
    }
    async remove(item) {
        const todos = await (0, persistence_1.readTodos)();
        const filtered = todos.filter((t) => t.id !== item.id);
        await (0, persistence_1.writeTodos)(filtered);
        this.refresh();
    }
}
exports.TodoProvider = TodoProvider;
function formatDate(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}


/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.readTodos = readTodos;
exports.writeTodos = writeTodos;
exports.makeTodo = makeTodo;
const vscode = __importStar(__webpack_require__(2));
const uuidv4 = (...args) => {
    const { v4 } = __webpack_require__(5);
    return v4(...args);
};
const FILE_NAME = "TO-DO.md";
function getFileUri() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showWarningMessage("Open a folder first to save TO-DOs.");
        return null;
    }
    return vscode.Uri.joinPath(folders[0].uri, FILE_NAME);
}
/* ---------------- READ ---------------- */
async function readTodos() {
    const uri = getFileUri();
    if (!uri)
        return [];
    try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const text = Buffer.from(bytes).toString("utf8");
        return parseMarkdown(text);
    }
    catch {
        return [];
    }
}
/* ---------------- WRITE ---------------- */
async function writeTodos(items) {
    const uri = getFileUri();
    if (!uri)
        return;
    const md = generateMarkdown(items);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(md, "utf8"));
    // 🧾 Agregar al .gitignore
    await ensureGitignoreHasEntry(FILE_NAME);
}
/* ---------------- HELPERS ---------------- */
function parseMarkdown(md) {
    const lines = md.split("\n");
    const todos = [];
    for (const line of lines) {
        const match = line.match(/^- \[( |x)\] (.+?)(?: <!-- (.+) -->)?$/);
        if (!match)
            continue;
        const completed = match[1] === "x";
        const text = match[2];
        const metaRaw = (match[3] ?? "").trim();
        // Defaults
        let id = uuidv4();
        let date_added = new Date().toISOString();
        let date_finished = null;
        if (metaRaw) {
            // ✅ New format: JSON metadata
            if (metaRaw.startsWith("{") && metaRaw.endsWith("}")) {
                try {
                    const meta = JSON.parse(metaRaw);
                    if (meta.id)
                        id = meta.id;
                    if (meta.date_added)
                        date_added = meta.date_added;
                    if (meta.date_finished !== undefined)
                        date_finished = meta.date_finished ?? null;
                }
                catch {
                    // ignore bad meta
                }
            }
            else {
                // ⚠️ Backward compatibility (old "key:value key:value")
                // Parse as: key:(anything up to next " key:" or end)
                const meta = {};
                const re = /(\w+):([\s\S]*?)(?=\s+\w+:|$)/g;
                let m;
                while ((m = re.exec(metaRaw)) !== null) {
                    meta[m[1]] = m[2].trim();
                }
                if (meta.id)
                    id = meta.id;
                if (meta.date_added)
                    date_added = meta.date_added;
                if (meta.date_finished)
                    date_finished = meta.date_finished;
            }
        }
        todos.push({
            id,
            text,
            completed,
            date_added,
            date_finished,
        });
    }
    return todos;
}
function generateMarkdown(items) {
    const lines = ["# TO-DO", ""];
    for (const item of items) {
        const checkbox = item.completed ? "x" : " ";
        const metaJson = JSON.stringify({
            id: item.id,
            date_added: item.date_added,
            date_finished: item.date_finished ?? null,
        });
        lines.push(`- [${checkbox}] ${item.text} <!-- ${metaJson} -->`);
    }
    lines.push("");
    return lines.join("\n");
}
async function ensureGitignoreHasEntry(fileName) {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        return;
    }
    const rootUri = folders[0].uri;
    const gitignoreUri = vscode.Uri.joinPath(rootUri, ".gitignore");
    // 📌 Declárala aquí
    let content = "";
    try {
        const bytes = await vscode.workspace.fs.readFile(gitignoreUri);
        content = Buffer.from(bytes).toString("utf8");
    }
    catch {
        // Si no existe .gitignore, content queda como ""
    }
    // Ya sí se puede usar
    if (content.split(/\r?\n/).includes(fileName)) {
        return;
    }
    const newContent = content + (content.length > 0 ? "\n" : "") + fileName + "\n";
    await vscode.workspace.fs.writeFile(gitignoreUri, Buffer.from(newContent, "utf8"));
}
/* ---------------- FACTORY ---------------- */
function makeTodo(text) {
    return {
        id: uuidv4(),
        text,
        completed: false,
        date_added: new Date().toISOString(),
        date_finished: null,
    };
}


/***/ }),
/* 5 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MAX: () => (/* reexport safe */ _max_js__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   NIL: () => (/* reexport safe */ _nil_js__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   parse: () => (/* reexport safe */ _parse_js__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   stringify: () => (/* reexport safe */ _stringify_js__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   v1: () => (/* reexport safe */ _v1_js__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   v1ToV6: () => (/* reexport safe */ _v1ToV6_js__WEBPACK_IMPORTED_MODULE_5__["default"]),
/* harmony export */   v3: () => (/* reexport safe */ _v3_js__WEBPACK_IMPORTED_MODULE_6__["default"]),
/* harmony export */   v4: () => (/* reexport safe */ _v4_js__WEBPACK_IMPORTED_MODULE_7__["default"]),
/* harmony export */   v5: () => (/* reexport safe */ _v5_js__WEBPACK_IMPORTED_MODULE_8__["default"]),
/* harmony export */   v6: () => (/* reexport safe */ _v6_js__WEBPACK_IMPORTED_MODULE_9__["default"]),
/* harmony export */   v6ToV1: () => (/* reexport safe */ _v6ToV1_js__WEBPACK_IMPORTED_MODULE_10__["default"]),
/* harmony export */   v7: () => (/* reexport safe */ _v7_js__WEBPACK_IMPORTED_MODULE_11__["default"]),
/* harmony export */   validate: () => (/* reexport safe */ _validate_js__WEBPACK_IMPORTED_MODULE_12__["default"]),
/* harmony export */   version: () => (/* reexport safe */ _version_js__WEBPACK_IMPORTED_MODULE_13__["default"])
/* harmony export */ });
/* harmony import */ var _max_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);
/* harmony import */ var _nil_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _parse_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(11);
/* harmony import */ var _v1_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(12);
/* harmony import */ var _v1ToV6_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(15);
/* harmony import */ var _v3_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(16);
/* harmony import */ var _v4_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(19);
/* harmony import */ var _v5_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(21);
/* harmony import */ var _v6_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(23);
/* harmony import */ var _v6ToV1_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(24);
/* harmony import */ var _v7_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(25);
/* harmony import */ var _validate_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(9);
/* harmony import */ var _version_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(26);
















/***/ }),
/* 6 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ('ffffffff-ffff-ffff-ffff-ffffffffffff');


/***/ }),
/* 7 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ('00000000-0000-0000-0000-000000000000');


/***/ }),
/* 8 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _validate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);

function parse(uuid) {
    if (!(0,_validate_js__WEBPACK_IMPORTED_MODULE_0__["default"])(uuid)) {
        throw TypeError('Invalid UUID');
    }
    let v;
    return Uint8Array.of((v = parseInt(uuid.slice(0, 8), 16)) >>> 24, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff, (v = parseInt(uuid.slice(9, 13), 16)) >>> 8, v & 0xff, (v = parseInt(uuid.slice(14, 18), 16)) >>> 8, v & 0xff, (v = parseInt(uuid.slice(19, 23), 16)) >>> 8, v & 0xff, ((v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff, (v / 0x100000000) & 0xff, (v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (parse);


/***/ }),
/* 9 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _regex_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(10);

function validate(uuid) {
    return typeof uuid === 'string' && _regex_js__WEBPACK_IMPORTED_MODULE_0__["default"].test(uuid);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (validate);


/***/ }),
/* 10 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i);


/***/ }),
/* 11 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   unsafeStringify: () => (/* binding */ unsafeStringify)
/* harmony export */ });
/* harmony import */ var _validate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!(0,_validate_js__WEBPACK_IMPORTED_MODULE_0__["default"])(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (stringify);


/***/ }),
/* 12 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   updateV1State: () => (/* binding */ updateV1State)
/* harmony export */ });
/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(13);
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);


const _state = {};
function v1(options, buf, offset) {
    let bytes;
    const isV6 = options?._v6 ?? false;
    if (options) {
        const optionsKeys = Object.keys(options);
        if (optionsKeys.length === 1 && optionsKeys[0] === '_v6') {
            options = undefined;
        }
    }
    if (options) {
        bytes = v1Bytes(options.random ?? options.rng?.() ?? (0,_rng_js__WEBPACK_IMPORTED_MODULE_0__["default"])(), options.msecs, options.nsecs, options.clockseq, options.node, buf, offset);
    }
    else {
        const now = Date.now();
        const rnds = (0,_rng_js__WEBPACK_IMPORTED_MODULE_0__["default"])();
        updateV1State(_state, now, rnds);
        bytes = v1Bytes(rnds, _state.msecs, _state.nsecs, isV6 ? undefined : _state.clockseq, isV6 ? undefined : _state.node, buf, offset);
    }
    return buf ?? (0,_stringify_js__WEBPACK_IMPORTED_MODULE_1__.unsafeStringify)(bytes);
}
function updateV1State(state, now, rnds) {
    state.msecs ??= -Infinity;
    state.nsecs ??= 0;
    if (now === state.msecs) {
        state.nsecs++;
        if (state.nsecs >= 10000) {
            state.node = undefined;
            state.nsecs = 0;
        }
    }
    else if (now > state.msecs) {
        state.nsecs = 0;
    }
    else if (now < state.msecs) {
        state.node = undefined;
    }
    if (!state.node) {
        state.node = rnds.slice(10, 16);
        state.node[0] |= 0x01;
        state.clockseq = ((rnds[8] << 8) | rnds[9]) & 0x3fff;
    }
    state.msecs = now;
    return state;
}
function v1Bytes(rnds, msecs, nsecs, clockseq, node, buf, offset = 0) {
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    if (!buf) {
        buf = new Uint8Array(16);
        offset = 0;
    }
    else {
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
    }
    msecs ??= Date.now();
    nsecs ??= 0;
    clockseq ??= ((rnds[8] << 8) | rnds[9]) & 0x3fff;
    node ??= rnds.slice(10, 16);
    msecs += 12219292800000;
    const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    buf[offset++] = (tl >>> 24) & 0xff;
    buf[offset++] = (tl >>> 16) & 0xff;
    buf[offset++] = (tl >>> 8) & 0xff;
    buf[offset++] = tl & 0xff;
    const tmh = ((msecs / 0x100000000) * 10000) & 0xfffffff;
    buf[offset++] = (tmh >>> 8) & 0xff;
    buf[offset++] = tmh & 0xff;
    buf[offset++] = ((tmh >>> 24) & 0xf) | 0x10;
    buf[offset++] = (tmh >>> 16) & 0xff;
    buf[offset++] = (clockseq >>> 8) | 0x80;
    buf[offset++] = clockseq & 0xff;
    for (let n = 0; n < 6; ++n) {
        buf[offset++] = node[n];
    }
    return buf;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v1);


/***/ }),
/* 13 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ rng)
/* harmony export */ });
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);

const rnds8Pool = new Uint8Array(256);
let poolPtr = rnds8Pool.length;
function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
        (0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.randomFillSync)(rnds8Pool);
        poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, (poolPtr += 16));
}


/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),
/* 15 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ v1ToV6)
/* harmony export */ });
/* harmony import */ var _parse_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);


function v1ToV6(uuid) {
    const v1Bytes = typeof uuid === 'string' ? (0,_parse_js__WEBPACK_IMPORTED_MODULE_0__["default"])(uuid) : uuid;
    const v6Bytes = _v1ToV6(v1Bytes);
    return typeof uuid === 'string' ? (0,_stringify_js__WEBPACK_IMPORTED_MODULE_1__.unsafeStringify)(v6Bytes) : v6Bytes;
}
function _v1ToV6(v1Bytes) {
    return Uint8Array.of(((v1Bytes[6] & 0x0f) << 4) | ((v1Bytes[7] >> 4) & 0x0f), ((v1Bytes[7] & 0x0f) << 4) | ((v1Bytes[4] & 0xf0) >> 4), ((v1Bytes[4] & 0x0f) << 4) | ((v1Bytes[5] & 0xf0) >> 4), ((v1Bytes[5] & 0x0f) << 4) | ((v1Bytes[0] & 0xf0) >> 4), ((v1Bytes[0] & 0x0f) << 4) | ((v1Bytes[1] & 0xf0) >> 4), ((v1Bytes[1] & 0x0f) << 4) | ((v1Bytes[2] & 0xf0) >> 4), 0x60 | (v1Bytes[2] & 0x0f), v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
}


/***/ }),
/* 16 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DNS: () => (/* reexport safe */ _v35_js__WEBPACK_IMPORTED_MODULE_1__.DNS),
/* harmony export */   URL: () => (/* reexport safe */ _v35_js__WEBPACK_IMPORTED_MODULE_1__.URL),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _md5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(17);
/* harmony import */ var _v35_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18);



function v3(value, namespace, buf, offset) {
    return (0,_v35_js__WEBPACK_IMPORTED_MODULE_1__["default"])(0x30, _md5_js__WEBPACK_IMPORTED_MODULE_0__["default"], value, namespace, buf, offset);
}
v3.DNS = _v35_js__WEBPACK_IMPORTED_MODULE_1__.DNS;
v3.URL = _v35_js__WEBPACK_IMPORTED_MODULE_1__.URL;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v3);


/***/ }),
/* 17 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);

function md5(bytes) {
    if (Array.isArray(bytes)) {
        bytes = Buffer.from(bytes);
    }
    else if (typeof bytes === 'string') {
        bytes = Buffer.from(bytes, 'utf8');
    }
    return (0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.createHash)('md5').update(bytes).digest();
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (md5);


/***/ }),
/* 18 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DNS: () => (/* binding */ DNS),
/* harmony export */   URL: () => (/* binding */ URL),
/* harmony export */   "default": () => (/* binding */ v35),
/* harmony export */   stringToBytes: () => (/* binding */ stringToBytes)
/* harmony export */ });
/* harmony import */ var _parse_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);


function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; ++i) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}
const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
function v35(version, hash, value, namespace, buf, offset) {
    const valueBytes = typeof value === 'string' ? stringToBytes(value) : value;
    const namespaceBytes = typeof namespace === 'string' ? (0,_parse_js__WEBPACK_IMPORTED_MODULE_0__["default"])(namespace) : namespace;
    if (typeof namespace === 'string') {
        namespace = (0,_parse_js__WEBPACK_IMPORTED_MODULE_0__["default"])(namespace);
    }
    if (namespace?.length !== 16) {
        throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    }
    let bytes = new Uint8Array(16 + valueBytes.length);
    bytes.set(namespaceBytes);
    bytes.set(valueBytes, namespaceBytes.length);
    bytes = hash(bytes);
    bytes[6] = (bytes[6] & 0x0f) | version;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return (0,_stringify_js__WEBPACK_IMPORTED_MODULE_1__.unsafeStringify)(bytes);
}


/***/ }),
/* 19 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);
/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(11);



function _v4(options, buf, offset) {
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? (0,_rng_js__WEBPACK_IMPORTED_MODULE_1__["default"])();
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return (0,_stringify_js__WEBPACK_IMPORTED_MODULE_2__.unsafeStringify)(rnds);
}
function v4(options, buf, offset) {
    if (_native_js__WEBPACK_IMPORTED_MODULE_0__["default"].randomUUID && !buf && !options) {
        return _native_js__WEBPACK_IMPORTED_MODULE_0__["default"].randomUUID();
    }
    return _v4(options, buf, offset);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v4);


/***/ }),
/* 20 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ randomUUID: node_crypto__WEBPACK_IMPORTED_MODULE_0__.randomUUID });


/***/ }),
/* 21 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DNS: () => (/* reexport safe */ _v35_js__WEBPACK_IMPORTED_MODULE_1__.DNS),
/* harmony export */   URL: () => (/* reexport safe */ _v35_js__WEBPACK_IMPORTED_MODULE_1__.URL),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _sha1_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(22);
/* harmony import */ var _v35_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18);



function v5(value, namespace, buf, offset) {
    return (0,_v35_js__WEBPACK_IMPORTED_MODULE_1__["default"])(0x50, _sha1_js__WEBPACK_IMPORTED_MODULE_0__["default"], value, namespace, buf, offset);
}
v5.DNS = _v35_js__WEBPACK_IMPORTED_MODULE_1__.DNS;
v5.URL = _v35_js__WEBPACK_IMPORTED_MODULE_1__.URL;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v5);


/***/ }),
/* 22 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);

function sha1(bytes) {
    if (Array.isArray(bytes)) {
        bytes = Buffer.from(bytes);
    }
    else if (typeof bytes === 'string') {
        bytes = Buffer.from(bytes, 'utf8');
    }
    return (0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.createHash)('sha1').update(bytes).digest();
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (sha1);


/***/ }),
/* 23 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);
/* harmony import */ var _v1_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(12);
/* harmony import */ var _v1ToV6_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(15);



function v6(options, buf, offset) {
    options ??= {};
    offset ??= 0;
    let bytes = (0,_v1_js__WEBPACK_IMPORTED_MODULE_1__["default"])({ ...options, _v6: true }, new Uint8Array(16));
    bytes = (0,_v1ToV6_js__WEBPACK_IMPORTED_MODULE_2__["default"])(bytes);
    if (buf) {
        for (let i = 0; i < 16; i++) {
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return (0,_stringify_js__WEBPACK_IMPORTED_MODULE_0__.unsafeStringify)(bytes);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v6);


/***/ }),
/* 24 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ v6ToV1)
/* harmony export */ });
/* harmony import */ var _parse_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);


function v6ToV1(uuid) {
    const v6Bytes = typeof uuid === 'string' ? (0,_parse_js__WEBPACK_IMPORTED_MODULE_0__["default"])(uuid) : uuid;
    const v1Bytes = _v6ToV1(v6Bytes);
    return typeof uuid === 'string' ? (0,_stringify_js__WEBPACK_IMPORTED_MODULE_1__.unsafeStringify)(v1Bytes) : v1Bytes;
}
function _v6ToV1(v6Bytes) {
    return Uint8Array.of(((v6Bytes[3] & 0x0f) << 4) | ((v6Bytes[4] >> 4) & 0x0f), ((v6Bytes[4] & 0x0f) << 4) | ((v6Bytes[5] & 0xf0) >> 4), ((v6Bytes[5] & 0x0f) << 4) | (v6Bytes[6] & 0x0f), v6Bytes[7], ((v6Bytes[1] & 0x0f) << 4) | ((v6Bytes[2] & 0xf0) >> 4), ((v6Bytes[2] & 0x0f) << 4) | ((v6Bytes[3] & 0xf0) >> 4), 0x10 | ((v6Bytes[0] & 0xf0) >> 4), ((v6Bytes[0] & 0x0f) << 4) | ((v6Bytes[1] & 0xf0) >> 4), v6Bytes[8], v6Bytes[9], v6Bytes[10], v6Bytes[11], v6Bytes[12], v6Bytes[13], v6Bytes[14], v6Bytes[15]);
}


/***/ }),
/* 25 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   updateV7State: () => (/* binding */ updateV7State)
/* harmony export */ });
/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(13);
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);


const _state = {};
function v7(options, buf, offset) {
    let bytes;
    if (options) {
        bytes = v7Bytes(options.random ?? options.rng?.() ?? (0,_rng_js__WEBPACK_IMPORTED_MODULE_0__["default"])(), options.msecs, options.seq, buf, offset);
    }
    else {
        const now = Date.now();
        const rnds = (0,_rng_js__WEBPACK_IMPORTED_MODULE_0__["default"])();
        updateV7State(_state, now, rnds);
        bytes = v7Bytes(rnds, _state.msecs, _state.seq, buf, offset);
    }
    return buf ?? (0,_stringify_js__WEBPACK_IMPORTED_MODULE_1__.unsafeStringify)(bytes);
}
function updateV7State(state, now, rnds) {
    state.msecs ??= -Infinity;
    state.seq ??= 0;
    if (now > state.msecs) {
        state.seq = (rnds[6] << 23) | (rnds[7] << 16) | (rnds[8] << 8) | rnds[9];
        state.msecs = now;
    }
    else {
        state.seq = (state.seq + 1) | 0;
        if (state.seq === 0) {
            state.msecs++;
        }
    }
    return state;
}
function v7Bytes(rnds, msecs, seq, buf, offset = 0) {
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    if (!buf) {
        buf = new Uint8Array(16);
        offset = 0;
    }
    else {
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
    }
    msecs ??= Date.now();
    seq ??= ((rnds[6] * 0x7f) << 24) | (rnds[7] << 16) | (rnds[8] << 8) | rnds[9];
    buf[offset++] = (msecs / 0x10000000000) & 0xff;
    buf[offset++] = (msecs / 0x100000000) & 0xff;
    buf[offset++] = (msecs / 0x1000000) & 0xff;
    buf[offset++] = (msecs / 0x10000) & 0xff;
    buf[offset++] = (msecs / 0x100) & 0xff;
    buf[offset++] = msecs & 0xff;
    buf[offset++] = 0x70 | ((seq >>> 28) & 0x0f);
    buf[offset++] = (seq >>> 20) & 0xff;
    buf[offset++] = 0x80 | ((seq >>> 14) & 0x3f);
    buf[offset++] = (seq >>> 6) & 0xff;
    buf[offset++] = ((seq << 2) & 0xff) | (rnds[10] & 0x03);
    buf[offset++] = rnds[11];
    buf[offset++] = rnds[12];
    buf[offset++] = rnds[13];
    buf[offset++] = rnds[14];
    buf[offset++] = rnds[15];
    return buf;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v7);


/***/ }),
/* 26 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _validate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);

function version(uuid) {
    if (!(0,_validate_js__WEBPACK_IMPORTED_MODULE_0__["default"])(uuid)) {
        throw TypeError('Invalid UUID');
    }
    return parseInt(uuid.slice(14, 15), 16);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (version);


/***/ }),
/* 27 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerChangelog = registerChangelog;
const vscode = __importStar(__webpack_require__(2));
const provider_1 = __webpack_require__(28);
const persistence_1 = __webpack_require__(29);
function registerChangelog(context) {
    const provider = new provider_1.ChangelogProvider();
    const treeReg = vscode.window.registerTreeDataProvider("changelogView", provider);
    context.subscriptions.push(treeReg);
    context.subscriptions.push(vscode.commands.registerCommand("changelog.refresh", () => {
        provider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("changelog.addVersion", async () => {
        const version = await vscode.window.showInputBox({
            prompt: "New version (e.g., 1.0.0)",
        });
        if (!version)
            return;
        const date = new Date().toISOString().split("T")[0];
        const all = await (0, persistence_1.readChangelog)();
        const exists = all.some((v) => v.version === version);
        if (exists) {
            vscode.window.showWarningMessage(`Version "${version}" already exists!`);
            return;
        }
        all.unshift({
            version,
            date,
            sections: {
                Additions: [],
                Changes: [],
                Deprecations: [],
                Fixes: [],
                Removals: [],
                "Security Changes": [],
            },
        });
        await (0, persistence_1.writeChangelog)(all);
        provider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("changelog.addEntry", async (node) => {
        const versionObj = node.version;
        const sectionKey = node.key ?? node.name;
        const sectionLabel = node.label ?? node.name ?? sectionKey;
        const text = await vscode.window.showInputBox({
            prompt: `Add entry to ${sectionLabel}`,
            placeHolder: "Describe the change...",
        });
        if (!text)
            return;
        const all = await (0, persistence_1.readChangelog)();
        const versionIdx = all.findIndex((v) => v.version === versionObj.version);
        if (versionIdx === -1)
            return;
        if (!all[versionIdx].sections[sectionKey]) {
            all[versionIdx].sections[sectionKey] = [];
        }
        all[versionIdx].sections[sectionKey].push({ text });
        await (0, persistence_1.writeChangelog)(all);
        provider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("changelog.editEntry", async (node) => {
        const newText = await vscode.window.showInputBox({
            prompt: "Edit entry text",
            value: node.text,
        });
        if (!newText)
            return;
        const all = await (0, persistence_1.readChangelog)();
        const versionIdx = all.findIndex((v) => v.version === node.version.version);
        if (versionIdx === -1)
            return;
        const secArr = all[versionIdx].sections[node.section] ?? [];
        all[versionIdx].sections[node.section] = secArr;
        const entryIdx = secArr.findIndex((e) => e.text === node.text);
        if (entryIdx === -1)
            return;
        secArr[entryIdx].text = newText;
        await (0, persistence_1.writeChangelog)(all);
        provider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("changelog.removeEntry", async (node) => {
        const confirm = await vscode.window.showWarningMessage(`Remove this entry?\n"${node.text}"`, { modal: true }, "Yes");
        if (confirm !== "Yes")
            return;
        const all = await (0, persistence_1.readChangelog)();
        const versionIdx = all.findIndex((v) => v.version === node.version.version);
        if (versionIdx === -1)
            return;
        const secArr = all[versionIdx].sections[node.section] ?? [];
        all[versionIdx].sections[node.section] = secArr.filter((e) => e.text !== node.text);
        await (0, persistence_1.writeChangelog)(all);
        provider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("changelog.removeVersion", async (node) => {
        const confirm = await vscode.window.showWarningMessage(`Remove version "${node.version}" and all its entries?`, { modal: true }, "Yes");
        if (confirm !== "Yes")
            return;
        const all = await (0, persistence_1.readChangelog)();
        const filtered = all.filter((v) => v.version !== node.version);
        await (0, persistence_1.writeChangelog)(filtered);
        provider.refresh();
    }));
}


/***/ }),
/* 28 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChangelogProvider = void 0;
const vscode = __importStar(__webpack_require__(2));
const persistence_1 = __webpack_require__(29);
const sections = [
    { key: "Additions", label: "🆕 Additions" },
    { key: "Changes", label: "🔃 Changes" },
    { key: "Deprecations", label: "⬇️ Deprecations" },
    { key: "Fixes", label: "🆗 Fixes" },
    { key: "Removals", label: "🗑️ Removals" },
    { key: "Security Changes", label: "🛡️ Security Changes" },
];
class ChangelogProvider {
    _onDidChange = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChange.event;
    versions = [];
    constructor() {
        void this.load();
    }
    async load() {
        const raw = await (0, persistence_1.readChangelog)();
        this.versions = raw.map((v) => ({
            kind: "version",
            version: v.version,
            date: v.date,
            sections: v.sections,
        }));
        this._onDidChange.fire();
    }
    refresh() {
        void this.load();
    }
    getTreeItem(element) {
        if (element.kind === "version") {
            const label = `${element.version}   ${element.date}`;
            const ti = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
            ti.contextValue = "changelogVersion";
            return ti;
        }
        if (element.kind === "section") {
            const ti = new vscode.TreeItem(`${element.label} (${element.count})`, vscode.TreeItemCollapsibleState.Collapsed);
            ti.contextValue = "changelogSection";
            return ti;
        }
        // entry
        const ti = new vscode.TreeItem(`🔸 ${element.text}`, vscode.TreeItemCollapsibleState.None);
        ti.contextValue = "changelogEntry";
        return ti;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve([...this.versions].sort((a, b) => b.date.localeCompare(a.date)));
        }
        if (element.kind === "version") {
            return Promise.resolve(sections.map(({ key, label }) => {
                const count = element.sections[key]?.length ?? 0;
                const node = {
                    kind: "section",
                    key,
                    label,
                    count,
                    version: element,
                };
                return node;
            }));
        }
        // Section -> entries
        if (element.kind === "section") {
            const ver = element.version;
            const list = ver.sections[element.key] ?? [];
            return Promise.resolve(list.map((e) => ({
                kind: "entry",
                text: e.text,
                version: ver,
                section: element.key,
            })));
        }
        return Promise.resolve([]);
    }
}
exports.ChangelogProvider = ChangelogProvider;


/***/ }),
/* 29 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.readChangelog = readChangelog;
exports.writeChangelog = writeChangelog;
const vscode = __importStar(__webpack_require__(2));
const FILE_NAME = "CHANGELOG.md";
const SECTION_ORDER = [
    "Additions",
    "Changes",
    "Deprecations",
    "Fixes",
    "Removals",
    "Security Changes",
];
function getFileUri() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showWarningMessage("Open a folder to use the changelog.");
        return null;
    }
    return vscode.Uri.joinPath(folders[0].uri, FILE_NAME);
}
const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();
async function readChangelog() {
    const uri = getFileUri();
    if (!uri)
        return [];
    try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const md = decoder.decode(bytes);
        return parseMd(md);
    }
    catch {
        // File missing or unreadable -> treat as empty changelog
        return [];
    }
}
async function writeChangelog(versions) {
    const uri = getFileUri();
    if (!uri)
        return;
    const md = generateMd(versions);
    // ✨ 1. Escribe el archivo
    await vscode.workspace.fs.writeFile(uri, encoder.encode(md));
    // ✨ 2. Asegura que el changelog esté en .gitignore
    const fileName = uri.path.split("/").pop() ?? "";
    await ensureGitignoreHasEntry(fileName);
}
async function ensureGitignoreHasEntry(fileName) {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        return;
    }
    const rootUri = folders[0].uri;
    const gitignoreUri = vscode.Uri.joinPath(rootUri, ".gitignore");
    let content = "";
    try {
        const bytes = await vscode.workspace.fs.readFile(gitignoreUri);
        content = Buffer.from(bytes).toString("utf8");
    }
    catch {
        // Si no existe .gitignore, content queda como ""
    }
    // Si ya está, salir
    if (content.split(/\r?\n/).includes(fileName)) {
        return;
    }
    // Agregar al final
    const newContent = content + (content.length > 0 ? "\n" : "") + fileName + "\n";
    await vscode.workspace.fs.writeFile(gitignoreUri, Buffer.from(newContent, "utf8"));
}
// ---- PARSE / GENERATE UTILS ---- //
function emptySections() {
    const obj = {};
    for (const sn of SECTION_ORDER)
        obj[sn] = [];
    return obj;
}
function normalizeSectionHeading(line) {
    // Expect: ### Additions
    const m = line.match(/^###\s+(.+)\s*$/);
    if (!m)
        return null;
    return m[1].trim();
}
function parseVersionHeading(line) {
    // Accept:
    // ## 1.0.0 2026-01-09
    // ## [1.0.0] 2026-01-09
    // ## [1.0.0] - 2026-01-09
    const m = line.match(/^##\s+(?:\[(.+?)\]|(\S+))\s*(?:-\s*)?(\d{4}-\d{2}-\d{2})\s*$/);
    if (!m)
        return null;
    const version = (m[1] ?? m[2])?.trim();
    const date = m[3]?.trim();
    if (!version || !date)
        return null;
    return { version, date };
}
function parseEntry(line) {
    // Accept:
    // - text
    // - [2026-01-09 12:00] text  (we ignore date, keep text)
    const m = line.match(/^- (?:\[[^\]]+\]\s*)?(.+)\s*$/);
    if (!m)
        return null;
    return m[1].trim();
}
function parseMd(md) {
    const lines = md.split(/\r?\n/);
    const versions = [];
    let current = null;
    let section = null;
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line)
            continue;
        // Version line
        const ver = parseVersionHeading(line);
        if (ver) {
            current = {
                version: ver.version,
                date: ver.date,
                sections: emptySections(),
            };
            section = null;
            versions.push(current);
            continue;
        }
        if (!current)
            continue;
        // Section heading
        const secName = normalizeSectionHeading(line);
        if (secName) {
            // If it's a known section, use it; if unknown, create it dynamically
            if (!current.sections[secName])
                current.sections[secName] = [];
            section = secName;
            continue;
        }
        // Entry line
        if (section && line.startsWith("- ")) {
            const text = parseEntry(line);
            if (!text)
                continue;
            current.sections[section].push({ text });
        }
    }
    return versions;
}
function generateMd(versions) {
    const lines = [];
    const sectionOrder = [
        "Additions",
        "Changes",
        "Deprecations",
        "Fixes",
        "Removals",
        "Security Changes",
    ];
    const sorted = [...versions].sort((a, b) => {
        const byDate = b.date.localeCompare(a.date); // YYYY-MM-DD
        if (byDate !== 0)
            return byDate;
        return String(b.version).localeCompare(String(a.version), undefined, {
            numeric: true,
        });
    });
    for (const v of sorted) {
        const sectionsWithEntries = sectionOrder.filter((sec) => (v.sections?.[sec]?.length ?? 0) > 0);
        lines.push(`## ${v.version} ${v.date}`);
        for (const secName of sectionsWithEntries) {
            lines.push("");
            lines.push(`### ${secName}`);
            const entries = v.sections[secName];
            for (const e of entries) {
                lines.push(`- ${e.text}`);
            }
        }
        lines.push("");
    }
    return lines.join("\n");
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const index_1 = __webpack_require__(1);
const index_2 = __webpack_require__(27);
function activate(context) {
    (0, index_1.registerTodo)(context);
    (0, index_2.registerChangelog)(context);
}
function deactivate() { }

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map