import * as vscode from "vscode";
import { registerTodo } from "./todo";

export function activate(context: vscode.ExtensionContext) {
  registerTodo(context);
}

export function deactivate() {}
