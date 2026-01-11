import * as vscode from "vscode";
import { registerTodo } from "./todo/index";
import { registerChangelog } from "./changelog/index";

export function activate(context: vscode.ExtensionContext) {

  registerTodo(context);

  registerChangelog(context);

}

export function deactivate() {}
