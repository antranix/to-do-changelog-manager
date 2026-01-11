import * as vscode from "vscode";
import type { TodoItem } from "./types";

const uuidv4 = (...args: any[]) => {
  const { v4 } = require("uuid");
  return v4(...args);
};

const FILE_NAME = "TO-DO.md";

function getFileUri(): vscode.Uri | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage("Open a folder first to save TO-DOs.");
    return null;
  }
  return vscode.Uri.joinPath(folders[0].uri, FILE_NAME);
}

/* ---------------- READ ---------------- */

export async function readTodos(): Promise<TodoItem[]> {
  const uri = getFileUri();
  if (!uri) return [];

  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const text = Buffer.from(bytes).toString("utf8");
    return parseMarkdown(text);
  } catch {
    return [];
  }
}

/* ---------------- WRITE ---------------- */

export async function writeTodos(items: TodoItem[]): Promise<void> {
  const uri = getFileUri();
  if (!uri) return;

  const md = generateMarkdown(items);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(md, "utf8"));

  // 🧾 Agregar al .gitignore
  await ensureGitignoreHasEntry(FILE_NAME);
}

/* ---------------- HELPERS ---------------- */

function parseMarkdown(md: string): TodoItem[] {
  const lines = md.split("\n");
  const todos: TodoItem[] = [];

  for (const line of lines) {
    const match = line.match(/^- \[( |x)\] (.+?)(?: <!-- (.+) -->)?$/);
    if (!match) continue;

    const completed = match[1] === "x";
    const text = match[2];
    const metaRaw = (match[3] ?? "").trim();

    // Defaults
    let id = uuidv4();
    let date_added = new Date().toISOString();
    let date_finished: string | null = null;

    // ✨ Campos extras
    let relativePath: string | undefined;
    let lineNumber: number | undefined;

    if (metaRaw) {
      // JSON metadata
      if (metaRaw.startsWith("{") && metaRaw.endsWith("}")) {
        try {
          const meta = JSON.parse(metaRaw) as any;

          if (meta.id) id = meta.id;
          if (meta.date_added) date_added = meta.date_added;
          if (meta.date_finished !== undefined)
            date_finished = meta.date_finished ?? null;

          // ✨ Cargar ruta relativa y línea si están
          if (typeof meta.relativePath === "string") {
            relativePath = meta.relativePath;
          }
          if (typeof meta.line === "number") {
            lineNumber = meta.line;
          }
        } catch {
          // ignore invalid JSON
        }
      } else {
        // backward compatibility
        const meta: Record<string, string> = {};
        const re = /(\w+):([\s\S]*?)(?=\s+\w+:|$)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(metaRaw)) !== null) {
          meta[m[1]] = m[2].trim();
        }
        if (meta.id) id = meta.id;
        if (meta.date_added) date_added = meta.date_added;
        if (meta.date_finished) date_finished = meta.date_finished;

        // No legacy support here for relativePath/line
      }
    }

    todos.push({
      id,
      text,
      completed,
      date_added,
      date_finished,
      relativePath,
      line: lineNumber,
    });
  }

  return todos;
}

function generateMarkdown(items: TodoItem[]): string {
  const lines: string[] = ["# TO-DO", ""];

  for (const item of items) {
    const checkbox = item.completed ? "x" : " ";

    // Incluye relativePath y line en la metadata si existen
    const meta: any = {
      id: item.id,
      date_added: item.date_added,
      date_finished: item.date_finished ?? null,
    };

    if (item.relativePath) meta.relativePath = item.relativePath;
    if (typeof item.line === "number") meta.line = item.line;

    const metaJson = JSON.stringify(meta);

    lines.push(`- [${checkbox}] ${item.text} <!-- ${metaJson} -->`);
  }

  lines.push("");
  return lines.join("\n");
}

async function ensureGitignoreHasEntry(fileName: string) {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return;
  }

  const rootUri = folders[0].uri;
  const gitignoreUri = vscode.Uri.joinPath(rootUri, ".gitignore");

  // 📌 Declárala aquí
  let content = "";

  try {
    const bytes = await vscode.workspace.fs.readFile(gitignoreUri);
    content = Buffer.from(bytes).toString("utf8");
  } catch {
    // Si no existe .gitignore, content queda como ""
  }

  // Ya sí se puede usar
  if (content.split(/\r?\n/).includes(fileName)) {
    return;
  }

  const newContent =
    content + (content.length > 0 ? "\n" : "") + fileName + "\n";

  await vscode.workspace.fs.writeFile(
    gitignoreUri,
    Buffer.from(newContent, "utf8")
  );
}

/* ---------------- FACTORY ---------------- */

export function makeTodo(text: string): TodoItem {
  return {
    id: uuidv4(),
    text,
    completed: false,
    date_added: new Date().toISOString(),
    date_finished: null,
  };
}
