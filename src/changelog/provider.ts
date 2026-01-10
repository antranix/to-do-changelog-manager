import * as vscode from "vscode";
import type { ChangelogEntry, ChangelogVersion } from "./types";
import { readChangelog } from "./persistence";

type SectionKey =
  | "Additions"
  | "Changes"
  | "Deprecations"
  | "Fixes"
  | "Removals"
  | "Security Changes";

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: "Additions", label: "🆕 Additions" },
  { key: "Changes", label: "🔃 Changes" },
  { key: "Deprecations", label: "⬇️ Deprecations" },
  { key: "Fixes", label: "🆗 Fixes" },
  { key: "Removals", label: "🗑️ Removals" },
  { key: "Security Changes", label: "🛡️ Security Changes" },
];

type VersionNode = {
  kind: "version";
  version: string;
  date: string;
  sections: Record<string, ChangelogEntry[]>;
};

type SectionNode = {
  kind: "section";
  key: SectionKey;      // <- key real
  label: string;        // <- label bonito
  count: number;
  version: VersionNode;
};

type EntryNode = {
  kind: "entry";
  text: string;
  version: VersionNode;
  section: SectionKey;
};

type Node = VersionNode | SectionNode | EntryNode;

export class ChangelogProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private versions: VersionNode[] = [];

  constructor() {
    void this.load();
  }

  async load() {
    const raw = await readChangelog();

    this.versions = raw.map((v) => ({
      kind: "version",
      version: v.version,
      date: v.date,
      sections: v.sections,
    }));

    this._onDidChange.fire();
  }

  refresh() {
    void this.load();
  }

  getTreeItem(element: Node): vscode.TreeItem {
    if (element.kind === "version") {
      const label = `${element.version}   ${element.date}`;
      const ti = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
      ti.contextValue = "changelogVersion";
      return ti;
    }

    if (element.kind === "section") {
      const ti = new vscode.TreeItem(
        `${element.label} (${element.count})`,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      ti.contextValue = "changelogSection";
      return ti;
    }

    // entry
    const ti = new vscode.TreeItem(`🔸 ${element.text}`, vscode.TreeItemCollapsibleState.None);
    ti.contextValue = "changelogEntry";
    return ti;
  }

  getChildren(element?: Node): Thenable<Node[]> {
    if (!element) {
      return Promise.resolve(
        [...this.versions].sort((a, b) => b.date.localeCompare(a.date))
      );
    }

    if (element.kind === "version") {
      return Promise.resolve(
        sections.map(({ key, label }) => {
          const count = element.sections[key]?.length ?? 0;

          const node: SectionNode = {
            kind: "section",
            key,
            label,
            count,
            version: element,
          };

          return node;
        })
      );
    }

    // Section -> entries
    if (element.kind === "section") {
      const ver = element.version;
      const list = ver.sections[element.key] ?? [];

      return Promise.resolve(
        list.map((e) => ({
          kind: "entry",
          text: e.text,
          version: ver,
          section: element.key,
        }))
      );
    }

    return Promise.resolve([]);
  }
}
