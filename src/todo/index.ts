import * as vscode from "vscode";

import type { TodoItem as TodoType } from "./types";
import { TodoProvider } from "./provider";

// Funciones de persistencia
import { readTodos, writeTodos } from "./persistence";

// Escáner de TODOs en archivos
import { scanTodosInWorkspace } from "./scanner";

export function registerTodo(context: vscode.ExtensionContext) {
  const provider = new TodoProvider();
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
    vscode.commands.registerCommand(
      "todo.complete",
      (item?: TodoType) => item && provider.complete(item)
    ),

    // Marcar como incompleta
    vscode.commands.registerCommand(
      "todo.uncomplete",
      (item?: TodoType) => item && provider.uncomplete(item)
    ),

    // Refrescar lista
    vscode.commands.registerCommand("todo.refresh", () => {
      provider.refresh();
    }),

    // Editar texto de tarea
    vscode.commands.registerCommand(
      "todo.edit",
      async (item?: TodoType) => {
        if (!item) return;

        const text = await vscode.window.showInputBox({
          prompt: "Edit task",
          value: item.text,
        });

        if (text) {
          await provider.edit(item, text.trim());
        }
      }
    ),

    // Eliminar tarea
    vscode.commands.registerCommand(
      "todo.remove",
      async (item?: TodoType) => {
        if (!item) return;
        await provider.remove(item);
      }
    ),

    // ✨ Nuevo: Escanear TODOs dentro de archivos del proyecto
    vscode.commands.registerCommand("todo.scanFiles", async () => {
      try {
        // Busca TODOs en todos los archivos
        const found = await scanTodosInWorkspace();

        if (found.length === 0) {
          vscode.window.showInformationMessage(
            "No TODOs found in project files."
          );
          return;
        }

        // Leer tareas existentes
        const existing = await readTodos();

        // Concatenar (puedes luego hacer deduplicación si quieres)
        const combined = [...existing, ...found];

        // Guardar todo en persistencia
        await writeTodos(combined);

        // Refrescar lista
        provider.refresh();

        vscode.window.showInformationMessage(
          `Added ${found.length} TODOs found in project files.`
        );
      } catch (err) {
        console.error("Error scanning TODOs:", err);
        vscode.window.showErrorMessage(
          "Failed to scan TODOs in project files."
        );
      }
    })
  );
}
