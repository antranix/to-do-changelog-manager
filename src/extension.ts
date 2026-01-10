import * as vscode from "vscode";
import { registerTodo } from "./todo/index";          // Registrar todo
import { registerChangelog } from "./changelog/index"; // Registrar changelog

export function activate(context: vscode.ExtensionContext) {

  // Registrar módulo TO-DO
  registerTodo(context);

  // Registrar módulo CHANGELOG
  registerChangelog(context);

  // Opcional: log para saber que la extensión se activó
  console.log('✨ TO-DO Changelog Manager is now active!');
}

export function deactivate() {}
