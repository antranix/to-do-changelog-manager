import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import type { TodoItem } from "./types";
import { readTodos, writeTodos } from "./persistence";

/**
 * Al refrescar: si la línea ya no existe en el archivo vinculado,
 * marcar la tarea como completada.
 */
export async function syncOnRefresh() {
  const todos = await readTodos();
  let updated = false;

  for (const t of todos) {
    if (!t.relativePath || t.completed) continue;

    try {
      const root = vscode.workspace.workspaceFolders?.[0];
      if (!root) continue;

      const filePath = path.join(root.uri.fsPath, t.relativePath);
      const content = await fs.readFile(filePath, "utf-8");

      // Si la línea ya no está en el archivo
      if (!content.includes(t.text)) {
        t.completed = true;
        t.date_finished = new Date().toISOString();
        updated = true;
      }
    } catch (e) {
      console.error("Error leyendo archivo para sincronización:", e);
    }
  }

  if (updated) await writeTodos(todos);
}

/**
 * Elimina la línea del archivo vinculado cuando la tarea se completa.
 */
export async function removeFromLinkedFile(item: TodoItem) {
  if (!item.relativePath) return;

  const root = vscode.workspace.workspaceFolders?.[0];
  if (!root) return;

  try {
    const filePath = path.join(root.uri.fsPath, item.relativePath);
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split(/\r?\n/);

    const newContent = lines
      .filter((line) => !line.includes(item.text))
      .join("\n");

    await fs.writeFile(filePath, newContent, "utf-8");
  } catch (e) {
    console.error("Error al eliminar línea:", e);
  }
}

/**
 * Agrega la línea de vuelta al archivo vinculado cuando la tarea se desmarca.
 */
export async function addToLinkedFile(item: TodoItem) {
  if (!item.relativePath) return;

  const root = vscode.workspace.workspaceFolders?.[0];
  if (!root) return;

  try {
    const filePath = path.join(root.uri.fsPath, item.relativePath);

    let content = "";
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      // Si no existe, se creará
    }

    // Línea TODO con formato correcto
    const todoLine = `// TODO: ${item.text}`;

    // Evita duplicados
    if (!content.includes(todoLine)) {
      content += content.length > 0 ? `\n${todoLine}` : todoLine;
      await fs.writeFile(filePath, content, "utf-8");
    }
  } catch (e) {
    console.error("Error al agregar línea TODO al archivo:", e);
  }
}
