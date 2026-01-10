import * as vscode from "vscode";
import { TodoProvider } from "./provider";
import type { TodoItem } from "./types";

export function registerTodo(context: vscode.ExtensionContext) {
  const provider = new TodoProvider();
  vscode.window.registerTreeDataProvider("todoView", provider);

  context.subscriptions.push(
    vscode.commands.registerCommand("todo.add", async () => {
      const text = await vscode.window.showInputBox({
        prompt: "Add a new task",
      });
      if (text) {
        await provider.add(text.trim());
      }
    }),

    vscode.commands.registerCommand(
      "todo.complete",
      (item?: TodoItem) => item && provider.complete(item)
    ),

    vscode.commands.registerCommand(
      "todo.uncomplete",
      (item?: TodoItem) => item && provider.uncomplete(item)
    ),

    vscode.commands.registerCommand("todo.refresh", () => {
      provider.refresh();
    }),

    // ✅ ESTE ES EL QUE FALTABA
    vscode.commands.registerCommand(
      "todo.edit",
      async (item?: TodoItem) => {
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

    // (recomendado agregar también)
    vscode.commands.registerCommand(
      "todo.remove",
      async (item?: TodoItem) => {
        if (!item) return;
        await provider.remove(item);
      }
    )
  );
}
