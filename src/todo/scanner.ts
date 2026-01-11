import * as vscode from "vscode";
import * as path from "path";
import type { TodoItem } from "./types";
import { makeScannedTodo } from "./persistence";

const TODO_REGEX = /(\/\/\s*TO-?DO)/i;

export async function scanTodosInWorkspace(): Promise<TodoItem[]> {
  const todos: TodoItem[] = [];
  const seen = new Set<string>();

  const files = await vscode.workspace.findFiles(
    "**/*.{js,ts,jsx,tsx,py,java,go,cpp,c,h}",
    "**/node_modules/**"
  );

  for (const file of files) {
    const doc = await vscode.workspace.openTextDocument(file);
    const ws = vscode.workspace.getWorkspaceFolder(file);
    const root = ws?.uri.fsPath;

    for (let i = 0; i < doc.lineCount; i++) {
      const text = doc.lineAt(i).text;
      if (!TODO_REGEX.test(text)) continue;

      const match = text.match(/(?:TODO:?|TO-DO:?)(.*)/i);
      const raw = match ? match[1].trim() : "";

      const rel = root ? path.relative(root, file.fsPath) : file.fsPath;

      const todo = makeScannedTodo(raw, rel, i);

      if (seen.has(todo.id)) continue;
      seen.add(todo.id);

      todos.push(todo);
    }
  }

  return todos;
}
