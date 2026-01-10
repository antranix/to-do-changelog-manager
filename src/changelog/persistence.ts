import * as vscode from "vscode";
import type { ChangelogVersion, ChangelogEntry } from "./types";

const FILE_NAME = "CHANGELOG.md";

function getFileUri(): vscode.Uri | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage("Open a folder to use the changelog.");
    return null;
  }
  return vscode.Uri.joinPath(folders[0].uri, FILE_NAME);
}

export async function readChangelog(): Promise<ChangelogVersion[]> {
  const uri = getFileUri();
  if (!uri) return [];

  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const md = Buffer.from(bytes).toString("utf8");
    return parseMd(md);
  } catch {
    return [];
  }
}

export async function writeChangelog(
  versions: ChangelogVersion[]
): Promise<void> {
  const uri = getFileUri();
  if (!uri) return;

  const md = generateMd(versions);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(md, "utf8"));
}

// ---- PARSE / GENERATE UTILS ---- //

function parseMd(md: string): ChangelogVersion[] {
  const lines = md.split(/\r?\n/);
  const versions: ChangelogVersion[] = [];
  let current: ChangelogVersion | null = null;
  let section: string | null = null;

  const sectionNames = [
    "Additions",
    "Changes",
    "Deprecations",
    "Fixes",
    "Removals",
    "Security Changes",
  ];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Match version line: ## VERSION YYYY-MM-DD
    const verMatch = line.match(/^##\s+(\S+)\s+(\d{4}-\d{2}-\d{2})$/);
    if (verMatch) {
      current = {
        version: verMatch[1],
        date: verMatch[2],
        sections: {},
      };
      section = null;
      for (const sn of sectionNames) {
        current.sections[sn] = [];
      }
      versions.push(current);
      continue;
    }

    if (!current) continue;

    // Match section heading
    const secMatch = sectionNames.find((sn) => line === `### ${sn}`);
    if (secMatch) {
      section = secMatch;
      continue;
    }

    // Match entry line: "- [YYYY-MM-DD HH:mm] some text"
    if (section && line.startsWith("- ")) {
      // entry could contain a date in brackets
      const entryReg = line.match(/^-\s+\[([0-9T:\- ]+)\]\s+(.+)$/);

      if (entryReg) {
        const entryDate = entryReg[1].trim();
        const text = entryReg[2].trim();
        current.sections[section].push({
          text,
        });
      } else {
        // If no bracketed date, fallback
        const text = line.replace(/^- /, "").trim();
        current.sections[section].push({
          text,
        });
      }
    }
  }

  return versions;
}

function generateMd(versions: ChangelogVersion[]): string {
  const lines: string[] = [];

  for (const v of versions) {
    // Version header
    lines.push(`## ${v.version} ${v.date}`);

    for (const secName of Object.keys(v.sections)) {
      lines.push("");
      lines.push(`### ${secName}`);

      const entries = v.sections[secName] as ChangelogEntry[];

      if (entries.length === 0) {
        // Section placeholder if you want explicit 0 entries
        // lines.push(`- (no entries)`);
      } else {
        for (const e of entries) {
          lines.push(`- ${e.text}`);
        }
      }
    }

    // Blank line between versions
    lines.push("");
  }

  return lines.join("\n");
}
