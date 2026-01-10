import * as vscode from "vscode";
import type { ChangelogVersion, ChangelogEntry } from "./types";

const FILE_NAME = "CHANGELOG.md";

const SECTION_ORDER = [
  "Additions",
  "Changes",
  "Deprecations",
  "Fixes",
  "Removals",
  "Security Changes",
] as const;

type SectionName = (typeof SECTION_ORDER)[number];

function getFileUri(): vscode.Uri | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage("Open a folder to use the changelog.");
    return null;
  }
  return vscode.Uri.joinPath(folders[0].uri, FILE_NAME);
}

const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();

export async function readChangelog(): Promise<ChangelogVersion[]> {
  const uri = getFileUri();
  if (!uri) return [];

  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const md = decoder.decode(bytes);
    return parseMd(md);
  } catch {
    // File missing or unreadable -> treat as empty changelog
    return [];
  }
}

export async function writeChangelog(
  versions: ChangelogVersion[]
): Promise<void> {
  const uri = getFileUri();
  if (!uri) return;

  const md = generateMd(versions);
  await vscode.workspace.fs.writeFile(uri, encoder.encode(md));
}

// ---- PARSE / GENERATE UTILS ---- //

function emptySections(): Record<string, ChangelogEntry[]> {
  const obj: Record<string, ChangelogEntry[]> = {};
  for (const sn of SECTION_ORDER) obj[sn] = [];
  return obj;
}

function normalizeSectionHeading(line: string): string | null {
  // Expect: ### Additions
  const m = line.match(/^###\s+(.+)\s*$/);
  if (!m) return null;
  return m[1].trim();
}

function parseVersionHeading(
  line: string
): { version: string; date: string } | null {
  // Accept:
  // ## 1.0.0 2026-01-09
  // ## [1.0.0] 2026-01-09
  // ## [1.0.0] - 2026-01-09
  const m = line.match(
    /^##\s+(?:\[(.+?)\]|(\S+))\s*(?:-\s*)?(\d{4}-\d{2}-\d{2})\s*$/
  );
  if (!m) return null;
  const version = (m[1] ?? m[2])?.trim();
  const date = m[3]?.trim();
  if (!version || !date) return null;
  return { version, date };
}

function parseEntry(line: string): string | null {
  // Accept:
  // - text
  // - [2026-01-09 12:00] text  (we ignore date, keep text)
  const m = line.match(/^- (?:\[[^\]]+\]\s*)?(.+)\s*$/);
  if (!m) return null;
  return m[1].trim();
}

function parseMd(md: string): ChangelogVersion[] {
  const lines = md.split(/\r?\n/);
  const versions: ChangelogVersion[] = [];

  let current: ChangelogVersion | null = null;
  let section: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Version line
    const ver = parseVersionHeading(line);
    if (ver) {
      current = {
        version: ver.version,
        date: ver.date,
        sections: emptySections(),
      };
      section = null;
      versions.push(current);
      continue;
    }

    if (!current) continue;

    // Section heading
    const secName = normalizeSectionHeading(line);
    if (secName) {
      // If it's a known section, use it; if unknown, create it dynamically
      if (!current.sections[secName]) current.sections[secName] = [];
      section = secName;
      continue;
    }

    // Entry line
    if (section && line.startsWith("- ")) {
      const text = parseEntry(line);
      if (!text) continue;

      current.sections[section].push({ text });
    }
  }

  return versions;
}

function generateMd(versions: ChangelogVersion[]): string {
  const lines: string[] = [];

  const sectionOrder = [
    "Additions",
    "Changes",
    "Deprecations",
    "Fixes",
    "Removals",
    "Security Changes",
  ] as const;

  // ✅ Copia + orden: más reciente primero
  const sorted = [...versions].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date); // YYYY-MM-DD funciona perfecto
    if (byDate !== 0) return byDate;

    // Desempate por versión (simple, sin semver estricto)
    return String(b.version).localeCompare(String(a.version), undefined, {
      numeric: true,
    });
  });

  for (const v of sorted) {
    // Filtrar secciones con contenido
    const sectionsWithEntries = sectionOrder.filter(
      (sec) => (v.sections?.[sec]?.length ?? 0) > 0
    );

    // ✅ Si una versión no tiene nada en ninguna sección, puedes:
    // A) igual mostrar solo el header (sin secciones)
    // B) o saltarla. Aquí dejo A.
    lines.push(`## ${v.version} ${v.date}`);

    // ✅ Solo secciones con elementos
    for (const secName of sectionsWithEntries) {
      lines.push("");
      lines.push(`### ${secName}`);

      const entries = v.sections[secName] as ChangelogEntry[];
      for (const e of entries) {
        lines.push(`- ${e.text}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}
