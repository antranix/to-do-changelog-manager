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

  refresh(): void {
    void this.load();
  }

  getTreeItem(item: TodoItem): vscode.TreeItem {
    const added = formatDate(item.date_added);
    const finished =
      item.completed && item.date_finished
        ? ` (finished: ${formatDate(item.date_finished)})`
        : "";

    const label = `${added} – ${item.text}${finished}`;

    const treeItem = new vscode.TreeItem(label);
    treeItem.contextValue = item.completed ? "done" : "pending";
    treeItem.tooltip = label;
    treeItem.iconPath = new vscode.ThemeIcon(
      item.completed ? "check" : "circle-outline"
    );

    return treeItem;
  }

  getChildren(element?: TodoItem): Thenable<TodoItem[]> {
    return Promise.resolve(element ? [] : this.items);
  }

  async add(text: string): Promise<void> {
    const todos = await readTodos();
    todos.push(makeTodo(text));
    await writeTodos(todos);
    this.refresh();
  }

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
  async edit(item: TodoItem, newText: string) {
    const todos = await readTodos();
    const todo = todos.find((t) => t.id === item.id);
    if (!todo) return;

    todo.text = newText;
    await writeTodos(todos);
    this.refresh();
  }

  async remove(item: TodoItem) {
    const todos = await readTodos();
    const filtered = todos.filter((t) => t.id !== item.id);
    await writeTodos(filtered);
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
