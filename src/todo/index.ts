import * as vscode from "vscode";
import { TodoProvider } from "./provider";

export function registerTodo(context: vscode.ExtensionContext) {
  const provider = new TodoProvider();

  vscode.window.registerTreeDataProvider("todoView", provider);

  context.subscriptions.push(
    vscode.commands.registerCommand("todo.add", async () => {
      const text = await vscode.window.showInputBox({
        prompt: "Add a new task",
      });
      if (text?.trim()) {
        await provider.add(text.trim());
      }
    }),

    vscode.commands.registerCommand("todo.complete", async (item) => {
      if (item) await provider.complete(item);
    }),

    vscode.commands.registerCommand("todo.uncomplete", async (item) => {
      if (item) await provider.uncomplete(item);
    }),

    vscode.commands.registerCommand("todo.refresh", () => provider.refresh())
  );
}
