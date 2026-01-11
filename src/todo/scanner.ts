import * as vscode from "vscode";
import * as path from "path";
import type { TodoItem } from "./types";
import { makeTodo } from "./persistence";

const TODO_REGEX = /(\/\/\s*TO-?DO)/i;

export async function scanTodosInWorkspace(): Promise<TodoItem[]> {
  const todos: TodoItem[] = [];

  const files = await vscode.workspace.findFiles(
    "**/*.{js,ts,jsx,tsx,py,java,go,cpp,c,h}",
    "**/node_modules/**"
  );

  for (const file of files) {
    const document = await vscode.workspace.openTextDocument(file);

    // Determina la carpeta raíz que contiene este archivo
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(file);
    const rootPath = workspaceFolder?.uri.fsPath;

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;

      if (TODO_REGEX.test(lineText)) {
        // Extrae solo la parte después de TODO / TO-DO
        const match = lineText.match(/(?:TODO:?|TO-DO:?)(.*)/i);
        const rawText = match ? match[1].trim() : lineText.trim();

        // Calcula ruta relativa si hay carpeta workspace abierta
        const relativePath = rootPath
          ? path.relative(rootPath, file.fsPath)
          : file.fsPath;

        const taskText = `${rawText} (${relativePath}:${i + 1})`;

        const todo = makeTodo(taskText);

        // Guarda info extra para navegación
        (todo as any).fileUri = file;
        (todo as any).line = i;
        (todo as any).relativePath = relativePath;

        todos.push(todo);
      }
    }
  }

  return todos;
}
