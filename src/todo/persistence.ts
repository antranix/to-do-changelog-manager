import * as vscode from "vscode";
import type { TodoItem } from "./types";

const uuidv4 = (...args: any[]) => {
  const { v4 } = require("uuid");
  return v4(...args);
};

const FILE_NAME = "todo.json";

function getFileUri(): vscode.Uri | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage("Open a folder first to save TO-DOs.");
    return null;
  }
  return vscode.Uri.joinPath(folders[0].uri, FILE_NAME);
}

export async function readTodos(): Promise<TodoItem[]> {
  const uri = getFileUri();
  if (!uri) return [];
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const text = Buffer.from(bytes).toString("utf8");
    return JSON.parse(text) as TodoItem[];
  } catch {
    return [];
  }
}

export async function writeTodos(items: TodoItem[]): Promise<void> {
  const uri = getFileUri();
  if (!uri) return;
  const data = JSON.stringify(items, null, 2);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(data, "utf8"));
}

export function makeTodo(text: string): TodoItem {
  return {
    id: uuidv4(),
    text,
    completed: false,
    date_added: new Date().toISOString(),
    date_finished: null
  };
}
