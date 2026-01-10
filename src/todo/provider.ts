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

  async load() {
    const all = await readTodos();

    // Separar pendientes y completadas
    const pending = all.filter((i) => !i.completed);
    const done    = all.filter((i) => i.completed);

    // Orden: más recientes al principio según date_added / date_finished
    pending.sort((a, b) => b.date_added.localeCompare(a.date_added));
    done.sort((a, b) => {
      // si ambas tienen date_finished
      if (b.date_finished && a.date_finished) {
        return b.date_finished.localeCompare(a.date_finished);
      }
      return 0;
    });

    this.items = [...pending, ...done];
    this._onDidChange.fire();
  }

  refresh() {
    void this.load();
  }

  getTreeItem(item: TodoItem): vscode.TreeItem {
    // Mostrar texto con fecha/hora y (finished) si aplica
    const added = formatDate(item.date_added);
    const finishedPart = item.completed && item.date_finished
      ? ` (finished: ${formatDate(item.date_finished)})`
      : "";

    const label = `${added} – ${item.text}${finishedPart}`;

    const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);

    // contextual value para iconos/menus
    treeItem.contextValue = item.completed ? "done" : "pending";
    treeItem.tooltip = label;

    // ícono de tarea pendiente vs completada
    treeItem.iconPath = new vscode.ThemeIcon(
      item.completed ? "check" : "circle-outline"
    );

    return treeItem;
  }

  getChildren(): Thenable<TodoItem[]> {
    return Promise.resolve(this.items);
  }

  async add(text: string) {
    const todos = await readTodos();
    const todo = makeTodo(text);
    todos.push(todo);
    await writeTodos(todos);
    this.refresh();
  }

  async complete(item: TodoItem) {
    const todos = await readTodos();
    const idx = todos.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      todos[idx].completed = true;
      todos[idx].date_finished = new Date().toISOString();
      await writeTodos(todos);
    }
    this.refresh();
  }

  async uncomplete(item: TodoItem) {
    const todos = await readTodos();
    const idx = todos.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      todos[idx].completed = false;
      todos[idx].date_finished = null;
      await writeTodos(todos);
    }
    this.refresh();
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}
