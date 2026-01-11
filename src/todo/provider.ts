import * as vscode from "vscode";
import type { TodoItem } from "./types";
import { readTodos, writeTodos, makeTodo } from "./persistence";
import { removeFromLinkedFile, addToLinkedFile, syncOnRefresh } from "./fileSync";

export class TodoProvider implements vscode.TreeDataProvider<TodoItem> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private items: TodoItem[] = [];

  constructor() {
    void this.load();
  }

  async load() {
    const all = await readTodos();

    this.items = [
      ...all.filter((t) => !t.completed),
      ...all.filter((t) => t.completed),
    ];

    this._onDidChange.fire();
  }

  refresh() {
    syncOnRefresh()
      .then(() => this.load())
      .catch(console.error);
  }

  getTreeItem(item: TodoItem): vscode.TreeItem {
    // Construir el label con tachado visual si está completo
    const text = item.completed
      ? item.text // lo dejamos igual para el label
      : item.text;

    const treeItem = new vscode.TreeItem(text);

    // Agregar decoración visual para completadas
    if (item.completed) {
      // Usa un icono de check y tooltip
      treeItem.iconPath = new vscode.ThemeIcon("check");
      treeItem.tooltip = `✔️ ${item.text}`;
      treeItem.description = "completed";
    }

    // Si tiene archivo y línea, permitir abrir
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

        // Si no está completada, show descripción de línea
        if (!item.completed) {
          treeItem.description = `${item.relativePath}:${item.line + 1}`;
        } else {
          // si está completada pero aún tiene ruta, mantenemos también la info
          treeItem.description += ` (${item.relativePath}:${item.line + 1})`;
        }
      }
    }

    treeItem.contextValue = item.completed ? "done" : "pending";
    return treeItem;
  }

  getChildren(): Thenable<TodoItem[]> {
    return Promise.resolve(this.items);
  }

  async add(text: string) {
    const todos = await readTodos();
    todos.push(makeTodo(text));
    await writeTodos(todos);
    this.refresh();
  }

  async addScanned(found: TodoItem[]) {
    if (found.length === 0) return;

    const existing = await readTodos();
    const map = new Map<string, TodoItem>();

    for (const t of existing) map.set(t.id, t);
    for (const t of found) if (!map.has(t.id)) map.set(t.id, t);

    await writeTodos([...map.values()]);
    this.refresh();
  }

  async edit(item: TodoItem, newText: string): Promise<void> {
    const todos = await readTodos();
    const todo = todos.find((t) => t.id === item.id);
    if (!todo) return;

    todo.text = newText;
    await writeTodos(todos);
    this.refresh();
  }

  // Marcar como incompleta
  async uncomplete(item?: TodoItem): Promise<void> {
    if (!item) return;

    const todos = await readTodos();
    const todo = todos.find((t) => t.id === item.id);
    if (!todo) return;

    // Marcar como no completada
    todo.completed = false;
    todo.date_finished = null;
    await writeTodos(todos);

    // Agregar la línea al archivo vinculado si tiene
    await addToLinkedFile(item);

    // Refrescar la vista
    this.refresh();
  }

  async complete(item: TodoItem) {
    const todos = await readTodos();
    const t = todos.find((x) => x.id === item.id);
    if (!t) return;

    // Marcar como completa
    t.completed = true;
    t.date_finished = new Date().toISOString();
    await writeTodos(todos);

    // Eliminar la línea del archivo vinculado si la tiene
    await removeFromLinkedFile(item);

    // Refrescar la vista
    this.refresh();
  }

  async remove(item: TodoItem) {
    await writeTodos((await readTodos()).filter((t) => t.id !== item.id));
    this.refresh();
  }
}
