import * as vscode from "vscode";
import { registerTodo } from "./todo/index";

export function activate(context: vscode.ExtensionContext) {

  registerTodo(context);

}

export function deactivate() {}
