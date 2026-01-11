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
// Funciones de persistencia
const persistence_1 = __webpack_require__(4);
// Escáner de TODOs en archivos
const scanner_1 = __webpack_require__(6);
function registerTodo(context) {
    const provider = new provider_1.TodoProvider();
    vscode.window.registerTreeDataProvider("todoView", provider);
    context.subscriptions.push(
    // Agregar tarea manual
    vscode.commands.registerCommand("todo.add", async () => {
        const text = await vscode.window.showInputBox({
            prompt: "Add a new task",
        });
        if (text) {
            await provider.add(text.trim());
        }
    }), 
    // Marcar como completada
    vscode.commands.registerCommand("todo.complete", (item) => item && provider.complete(item)), 
    // Marcar como incompleta
    vscode.commands.registerCommand("todo.uncomplete", (item) => item && provider.uncomplete(item)), 
    // Refrescar lista
    vscode.commands.registerCommand("todo.refresh", () => {
        provider.refresh();
    }), 
    // Editar texto de tarea
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
    // Eliminar tarea
    vscode.commands.registerCommand("todo.remove", async (item) => {
        if (!item)
            return;
        await provider.remove(item);
    }), 
    // ✨ Nuevo: Escanear TODOs dentro de archivos del proyecto
    vscode.commands.registerCommand("todo.scanFiles", async () => {
        try {
            // Busca TODOs en todos los archivos
            const found = await (0, scanner_1.scanTodosInWorkspace)();
            if (found.length === 0) {
                vscode.window.showInformationMessage("No TODOs found in project files.");
                return;
            }
            // Leer tareas existentes
            const existing = await (0, persistence_1.readTodos)();
            // Concatenar (puedes luego hacer deduplicación si quieres)
            const combined = [...existing, ...found];
            // Guardar todo en persistencia
            await (0, persistence_1.writeTodos)(combined);
            // Refrescar lista
            provider.refresh();
            vscode.window.showInformationMessage(`Added ${found.length} TODOs found in project files.`);
        }
        catch (err) {
            console.error("Error scanning TODOs:", err);
            vscode.window.showErrorMessage("Failed to scan TODOs in project files.");
        }
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
        this.items = [
            ...all.filter((t) => !t.completed),
            ...all.filter((t) => t.completed),
        ];
        this._onDidChange.fire();
    }
    refresh() {
        void this.load();
    }
    getTreeItem(item) {
        const label = `${item.text}`;
        const treeItem = new vscode.TreeItem(label);
        if (item.relativePath && typeof item.line === "number") {
            const root = vscode.workspace.workspaceFolders?.[0];
            if (root) {
                const uri = vscode.Uri.joinPath(root.uri, item.relativePath);
                treeItem.command = {
                    command: "vscode.open",
                    title: "Open",
                    arguments: [
                        uri,
                        { selection: new vscode.Range(item.line, 0, item.line, 0) },
                    ],
                };
                treeItem.description = `${item.relativePath}:${item.line + 1}`;
            }
        }
        treeItem.contextValue = item.completed ? "done" : "pending";
        return treeItem;
    }
    getChildren() {
        return Promise.resolve(this.items);
    }
    async add(text) {
        const todos = await (0, persistence_1.readTodos)();
        todos.push((0, persistence_1.makeTodo)(text));
        await (0, persistence_1.writeTodos)(todos);
        this.refresh();
    }
    async addScanned(found) {
        if (found.length === 0)
            return;
        const existing = await (0, persistence_1.readTodos)();
        const map = new Map();
        for (const t of existing)
            map.set(t.id, t);
        for (const t of found)
            if (!map.has(t.id))
                map.set(t.id, t);
        await (0, persistence_1.writeTodos)([...map.values()]);
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
    // Marcar como incompleta
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
    async complete(item) {
        const todos = await (0, persistence_1.readTodos)();
        const t = todos.find((x) => x.id === item.id);
        if (!t)
            return;
        t.completed = true;
        t.date_finished = new Date().toISOString();
        await (0, persistence_1.writeTodos)(todos);
        this.refresh();
    }
    async remove(item) {
        await (0, persistence_1.writeTodos)((await (0, persistence_1.readTodos)()).filter((t) => t.id !== item.id));
        this.refresh();
    }
}
exports.TodoProvider = TodoProvider;


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
exports.makeTodo = makeTodo;
exports.makeScannedTodo = makeScannedTodo;
exports.readTodos = readTodos;
exports.writeTodos = writeTodos;
const vscode = __importStar(__webpack_require__(2));
const crypto = __importStar(__webpack_require__(5));
const FILE_NAME = "TO-DO.md";
/* ---------------- PATH ---------------- */
function getFileUri() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showWarningMessage("Open a folder first to save TO-DOs.");
        return null;
    }
    return vscode.Uri.joinPath(folders[0].uri, FILE_NAME);
}
function normalizePath(p) {
    return p.replace(/\\/g, "/");
}
/* ---------------- ID (SCAN) ---------------- */
function makeSourceKey(relativePath, line, text) {
    const t = text.trim().slice(0, 32);
    return `${normalizePath(relativePath)}:${line}:${t}`;
}
function hashId(input) {
    return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}
/* ---------------- FACTORIES ---------------- */
// 🔴 SOLO para TODOs manuales
function makeTodo(text) {
    return {
        id: crypto.randomUUID(),
        text,
        completed: false,
        date_added: new Date().toISOString(),
        date_finished: null,
    };
}
// 🟢 SOLO para TODOs escaneados
function makeScannedTodo(text, relativePath, line) {
    const cleanText = text.trim() || "TODO";
    const sourceKey = makeSourceKey(relativePath, line, cleanText);
    const id = hashId(sourceKey);
    return {
        id,
        text: cleanText,
        completed: false,
        date_added: new Date().toISOString(),
        date_finished: null,
        relativePath: normalizePath(relativePath),
        line,
        sourceKey,
    };
}
/* ---------------- READ ---------------- */
async function readTodos() {
    const uri = getFileUri();
    if (!uri)
        return [];
    try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        return parseMarkdown(Buffer.from(bytes).toString("utf8"));
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
    // 🔥 blindaje final
    const map = new Map();
    for (const t of items) {
        if (!map.has(t.id))
            map.set(t.id, t);
    }
    const md = generateMarkdown([...map.values()]);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(md, "utf8"));
    await ensureGitignoreHasEntry(FILE_NAME);
}
/* ---------------- PARSE ---------------- */
function parseMarkdown(md) {
    const todos = [];
    for (const line of md.split(/\r?\n/)) {
        const m = line.match(/^- \[( |x)\] (.+?)(?: <!-- (.+) -->)?$/);
        if (!m)
            continue;
        const completed = m[1] === "x";
        const text = m[2];
        const metaRaw = m[3];
        if (!metaRaw)
            continue;
        try {
            const meta = JSON.parse(metaRaw);
            todos.push({
                id: meta.id,
                text,
                completed,
                date_added: meta.date_added,
                date_finished: meta.date_finished ?? null,
                relativePath: meta.relativePath,
                line: meta.line,
                sourceKey: meta.sourceKey,
            });
        }
        catch {
            // ignore
        }
    }
    return todos;
}
/* ---------------- GENERATE ---------------- */
function generateMarkdown(items) {
    const lines = ["# TO-DO", ""];
    for (const item of items) {
        const meta = {
            id: item.id,
            date_added: item.date_added,
            date_finished: item.date_finished ?? null,
            relativePath: item.relativePath,
            line: item.line,
            sourceKey: item.sourceKey,
        };
        lines.push(`- [${item.completed ? "x" : " "}] ${item.text} <!-- ${JSON.stringify(meta)} -->`);
    }
    lines.push("");
    return lines.join("\n");
}
/* ---------------- GITIGNORE ---------------- */
async function ensureGitignoreHasEntry(fileName) {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0)
        return;
    const gitignoreUri = vscode.Uri.joinPath(folders[0].uri, ".gitignore");
    let content = "";
    try {
        content = Buffer.from(await vscode.workspace.fs.readFile(gitignoreUri)).toString("utf8");
    }
    catch { }
    if (!content.split(/\r?\n/).includes(fileName)) {
        await vscode.workspace.fs.writeFile(gitignoreUri, Buffer.from(content + "\n" + fileName + "\n", "utf8"));
    }
}


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),
/* 6 */
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
exports.scanTodosInWorkspace = scanTodosInWorkspace;
const vscode = __importStar(__webpack_require__(2));
const path = __importStar(__webpack_require__(7));
const persistence_1 = __webpack_require__(4);
const TODO_REGEX = /(\/\/\s*TO-?DO)/i;
async function scanTodosInWorkspace() {
    const todos = [];
    const seen = new Set();
    const files = await vscode.workspace.findFiles("**/*.{js,ts,jsx,tsx,py,java,go,cpp,c,h}", "**/node_modules/**");
    for (const file of files) {
        const doc = await vscode.workspace.openTextDocument(file);
        const ws = vscode.workspace.getWorkspaceFolder(file);
        const root = ws?.uri.fsPath;
        for (let i = 0; i < doc.lineCount; i++) {
            const text = doc.lineAt(i).text;
            if (!TODO_REGEX.test(text))
                continue;
            const match = text.match(/(?:TODO:?|TO-DO:?)(.*)/i);
            const raw = match ? match[1].trim() : "";
            const rel = root ? path.relative(root, file.fsPath) : file.fsPath;
            const todo = (0, persistence_1.makeScannedTodo)(raw, rel, i);
            if (seen.has(todo.id))
                continue;
            seen.add(todo.id);
            todos.push(todo);
        }
    }
    return todos;
}


/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 8 */
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
const provider_1 = __webpack_require__(9);
const persistence_1 = __webpack_require__(10);
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
/* 9 */
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
const persistence_1 = __webpack_require__(10);
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
/* 10 */
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
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const index_1 = __webpack_require__(1);
const index_2 = __webpack_require__(8);
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