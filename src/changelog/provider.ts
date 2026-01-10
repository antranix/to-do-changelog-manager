import * as vscode from "vscode";
import type { ChangelogVersion } from "./types";
import { readChangelog } from "./persistence";

// Orden fijo de secciones
const sectionOrder = [
  "Additions",
  "Changes",
  "Deprecations",
  "Fixes",
  "Removals",
  "Security Changes",
];

export class ChangelogProvider implements vscode.TreeDataProvider<any> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private versions: ChangelogVersion[] = [];

  constructor() {
    void this.load();
  }

  async load() {
    this.versions = await readChangelog();
    this._onDidChange.fire();
  }

  refresh() {
    void this.load();
  }

  getTreeItem(element: any): vscode.TreeItem {
    // ➤ Nodo de versión (solo aquí mostramos fecha)
    if (element.kind === "version") {
      const label = `${element.version}   ${element.date}`;  
      const ti = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
      ti.contextValue = "changelogVersion"; // para eliminar versión
      return ti;
    }

    // ➤ Nodo de sección (Additions, Changes, etc)
    if (element.kind === "section") {
      const ti = new vscode.TreeItem(
        `${element.name} (${element.count})`,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      ti.contextValue = "changelogSection"; // para añadir entrada
      return ti;
    }

    // ➤ Nodo de entrada individual
    if (element.kind === "entry") {
      // Prefijo con el símbolo deseado 🔸
      const ti = new vscode.TreeItem(
        `🔸 ${element.text}`,
        vscode.TreeItemCollapsibleState.None
      );
      ti.contextValue = "changelogEntry"; // para editar/eliminar
      return ti;
    }

    // ➤ Fallback
    return new vscode.TreeItem("Unknown item");
  }

  getChildren(element?: any): Thenable<any[]> {
    // ✨ Si no hay elemento, devolvemos las versiones
    if (!element) {
      return Promise.resolve(
        this.versions
          .sort((a, b) => b.date.localeCompare(a.date)) // versiones más recientes primero
          .map((v) => ({
            kind: "version",
            ...v,
          }))
      );
    }

    // ✨ Si el elemento es una versión, devolvemos sus secciones
    if (element.kind === "version") {
      return Promise.resolve(
        sectionOrder.map((sectionName) => ({
          kind: "section",
          name: sectionName,
          count: element.sections[sectionName]?.length ?? 0,
          version: element,
        }))
      );
    }

    // ✨ Si el elemento es una sección, devolvemos sus entradas
    if (element.kind === "section") {
      const ver = element.version as ChangelogVersion;
      const listOfEntries = ver.sections[element.name] ?? [];

      return Promise.resolve(
        listOfEntries.map((entry: any) => ({
          kind: "entry",
          text: entry.text,
          version: ver,
          section: element.name,
        }))
      );
    }

    // ✨ Si no hay nada más
    return Promise.resolve([]);
  }
}
