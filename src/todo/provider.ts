import * as vscode from "vscode";
import { TodoItem } from "./types";
import { readTodos, writeTodos, makeTodo } from "./persistence";

export class TodoProvider implements vscode.TreeDataProvider<TodoItem> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private items: TodoItem[] = [];

  constructor() {
    void this.load();
  }

  async load() {
    this.items = await readTodos();
    this._onDidChange.fire();
  }

  refresh() {
    void this.load();
  }

  getTreeItem(item: TodoItem): vscode.TreeItem {
    const label = `${item.text} (added: ${formatDate(item.date_added)})`;
    const treeItem = new vscode.TreeItem(
      label,
      vscode.TreeItemCollapsibleState.None
    );

    treeItem.contextValue = item.completed ? "done" : "pending";

    treeItem.iconPath = new vscode.ThemeIcon(
      item.completed ? "check" : "circle-outline"
    );

    // Command to toggle
    treeItem.command = {
      title: item.completed ? "Mark Unfinished" : "Mark Complete",
      command: item.completed ? "todo.uncomplete" : "todo.complete",
      arguments: [item],
    };
    treeItem.tooltip = `Added: ${item.date_added}${
      item.completed && item.date_finished
        ? `\nFinished: ${item.date_finished}`
        : ""
    }`;

    return treeItem;
  }

  getChildren(): Thenable<TodoItem[]> {
    return Promise.resolve(this.items);
  }

  async add(text: string) {
    const todo = makeTodo(text);
    this.items.push(todo);
    await writeTodos(this.items);
    this.refresh();
  }

  async complete(item: TodoItem) {
    const idx = this.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.items[idx].completed = true;
      this.items[idx].date_finished = new Date().toISOString();
      await writeTodos(this.items);
      this.refresh();
    }
  }

  async uncomplete(item: TodoItem) {
    const idx = this.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.items[idx].completed = false;
      this.items[idx].date_finished = null;
      await writeTodos(this.items);
      this.refresh();
    }
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${(d.getMonth()+1)
    .toString()
    .padStart(2, "0")}-${d.getDate()
    .toString()
    .padStart(2, "0")} ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}
