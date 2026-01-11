import * as vscode from "vscode";
import type { TodoItem } from "./types";
import { readTodos, writeTodos, makeTodo } from "./persistence";

export class TodoProvider implements vscode.TreeDataProvider<TodoItem> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private items: TodoItem[] = [];

  constructor() {
    void this.load();
  }

  // Carga y ordena tareas
  async load() {
    const all = await readTodos();

    const pending = all
      .filter((i) => !i.completed)
      .sort((a, b) => b.date_added.localeCompare(a.date_added));

    const done = all
      .filter((i) => i.completed)
      .sort((a, b) =>
        (b.date_finished ?? "").localeCompare(a.date_finished ?? "")
      );

    this.items = [...pending, ...done];
    this._onDidChange.fire();
  }

  // Fuerza recarga
  refresh(): void {
    void this.load();
  }

  // Representación visual de cada TODO
  getTreeItem(item: TodoItem): vscode.TreeItem {
    const added = formatDate(item.date_added);
    const finished =
      item.completed && item.date_finished
        ? `(finished: ${formatDate(item.date_finished)})`
        : "";
    const mainLabel = `${added} – ${item.text}${finished}`;

    const treeItem = new vscode.TreeItem(mainLabel);

    let absolutePathStr: string | undefined;

    if (item.relativePath && typeof item.line === "number") {
      const rootFolders = vscode.workspace.workspaceFolders;
      if (rootFolders && rootFolders.length > 0) {
        const absoluteUri = vscode.Uri.joinPath(
          rootFolders[0].uri,
          item.relativePath
        );
        absolutePathStr = absoluteUri.fsPath;

        treeItem.description = `${item.relativePath}:${item.line + 1}`;

        // 🛠 Tooltip mejorado con ruta absoluta
        treeItem.tooltip = `${item.text}\n${absolutePathStr}:${item.line + 1}`;

        treeItem.command = {
          command: "vscode.open",
          title: "Open File",
          arguments: [
            absoluteUri,
            { selection: new vscode.Range(item.line, 0, item.line, 0) },
          ],
        };
      }
    }

    // 📝 Si no hay ruta/linea, tooltip normal
    if (!treeItem.tooltip) {
      treeItem.tooltip = mainLabel;
    }

    treeItem.contextValue = item.completed ? "done" : "pending";
    treeItem.iconPath = new vscode.ThemeIcon(
      item.completed ? "check" : "circle-outline"
    );

    return treeItem;
  }

  // Retorna las tareas para el TreeView
  getChildren(element?: TodoItem): Thenable<TodoItem[]> {
    return Promise.resolve(element ? [] : this.items);
  }

  // Agregar tarea manual
  async add(text: string): Promise<void> {
    const todos = await readTodos();
    todos.push(makeTodo(text));
    await writeTodos(todos);
    this.refresh();
  }

  // Marcar como completada
  async complete(item?: TodoItem): Promise<void> {
    if (!item) return;

    const todos = await readTodos();
    const todo = todos.find((t) => t.id === item.id);
    if (!todo) return;

    todo.completed = true;
    todo.date_finished = new Date().toISOString();
    await writeTodos(todos);
    this.refresh();
  }

  // Marcar como incompleta
  async uncomplete(item?: TodoItem): Promise<void> {
    if (!item) return;

    const todos = await readTodos();
    const todo = todos.find((t) => t.id === item.id);
    if (!todo) return;

    todo.completed = false;
    todo.date_finished = null;
    await writeTodos(todos);
    this.refresh();
  }

  // Editar texto de tarea
  async edit(item: TodoItem, newText: string) {
    const todos = await readTodos();
    const todo = todos.find((t) => t.id === item.id);
    if (!todo) return;

    todo.text = newText;
    await writeTodos(todos);
    this.refresh();
  }

  // Eliminar tarea
  async remove(item: TodoItem) {
    const todos = await readTodos();
    const filtered = todos.filter((t) => t.id !== item.id);
    await writeTodos(filtered);
    this.refresh();
  }

  // ✨ NUEVO método para agregar TODOs escaneados desde archivos
  async addScanned(found: TodoItem[]) {
    if (found.length === 0) return;

    const todos = await readTodos();

    // Evita duplicados simples: si el texto coincide exacto
    const existingTexts = new Set(todos.map((t) => t.text));
    const uniques = found.filter((t) => !existingTexts.has(t.text));

    if (uniques.length === 0) return;

    const combined = [...todos, ...uniques];
    await writeTodos(combined);

    this.refresh();
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}
