import * as vscode from "vscode";
import { ChangelogProvider } from "./provider";
import { readChangelog, writeChangelog } from "./persistence";

export function registerChangelog(context: vscode.ExtensionContext) {
  const provider = new ChangelogProvider();

  // Registrar el TreeDataProvider para la vista de changelog
  const treeReg = vscode.window.registerTreeDataProvider("changelogView", provider);
  context.subscriptions.push(treeReg);

  // Refrescar la vista
  context.subscriptions.push(
    vscode.commands.registerCommand("changelog.refresh", () => {
      provider.refresh();
    })
  );

  // Comando para agregar una nueva versión
  context.subscriptions.push(
    vscode.commands.registerCommand("changelog.addVersion", async () => {
      const version = await vscode.window.showInputBox({
        prompt: "New version (e.g., 1.0.0)",
      });
      if (!version) return;

      const date = new Date().toISOString().split("T")[0];
      const all = await readChangelog();

      // Evitar duplicados
      const exists = all.some((v) => v.version === version);
      if (exists) {
        vscode.window.showWarningMessage(`Version "${version}" already exists!`);
        return;
      }

      all.unshift({
        version,
        date,
        sections: {
          Additions: [],
          Changes: [],
          Deprecations: [],
          Fixes: [],
          Removals: [],
          "Security Changes": [],
        },
      });

      await writeChangelog(all);
      provider.refresh();
    })
  );

  // Comando para agregar una entrada en una sección
  context.subscriptions.push(
    vscode.commands.registerCommand("changelog.addEntry", async (node: any) => {
      const versionObj = node.version; // objeto versión

      // ✅ IMPORTANTE:
      // - provider nuevo: node.key (sin emoji)
      // - provider viejo: node.name (posiblemente con emoji)
      const sectionKey: string = node.key ?? node.name;
      const sectionLabel: string = node.label ?? node.name ?? sectionKey;

      const text = await vscode.window.showInputBox({
        prompt: `Add entry to ${sectionLabel}`,
        placeHolder: "Describe the change...",
      });
      if (!text) return;

      const all = await readChangelog();
      const versionIdx = all.findIndex((v) => v.version === versionObj.version);
      if (versionIdx === -1) return;

      // ✅ Blindaje: si la sección no existe (o viene undefined), la creamos
      if (!all[versionIdx].sections[sectionKey]) {
        all[versionIdx].sections[sectionKey] = [];
      }

      all[versionIdx].sections[sectionKey].push({ text });

      await writeChangelog(all);
      provider.refresh();
    })
  );

  // Comando para editar una entrada existente
  context.subscriptions.push(
    vscode.commands.registerCommand("changelog.editEntry", async (node: any) => {
      const newText = await vscode.window.showInputBox({
        prompt: "Edit entry text",
        value: node.text,
      });
      if (!newText) return;

      const all = await readChangelog();
      const versionIdx = all.findIndex((v) => v.version === node.version.version);
      if (versionIdx === -1) return;

      // ✅ Blindaje: garantiza arreglo existente
      const secArr = all[versionIdx].sections[node.section] ?? [];
      all[versionIdx].sections[node.section] = secArr;

      const entryIdx = secArr.findIndex((e: any) => e.text === node.text);
      if (entryIdx === -1) return;

      secArr[entryIdx].text = newText;

      await writeChangelog(all);
      provider.refresh();
    })
  );

  // Comando para eliminar una entrada
  context.subscriptions.push(
    vscode.commands.registerCommand("changelog.removeEntry", async (node: any) => {
      const confirm = await vscode.window.showWarningMessage(
        `Remove this entry?\n"${node.text}"`,
        { modal: true },
        "Yes"
      );
      if (confirm !== "Yes") return;

      const all = await readChangelog();
      const versionIdx = all.findIndex((v) => v.version === node.version.version);
      if (versionIdx === -1) return;

      const secArr = all[versionIdx].sections[node.section] ?? [];
      all[versionIdx].sections[node.section] = secArr.filter((e: any) => e.text !== node.text);

      await writeChangelog(all);
      provider.refresh();
    })
  );

  // Comando para eliminar una versión completa
  context.subscriptions.push(
    vscode.commands.registerCommand("changelog.removeVersion", async (node: any) => {
      const confirm = await vscode.window.showWarningMessage(
        `Remove version "${node.version}" and all its entries?`,
        { modal: true },
        "Yes"
      );
      if (confirm !== "Yes") return;

      const all = await readChangelog();
      const filtered = all.filter((v) => v.version !== node.version);

      await writeChangelog(filtered);
      provider.refresh();
    })
  );
}
