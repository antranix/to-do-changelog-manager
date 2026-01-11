import * as vscode from "vscode";
import type { TodoItem } from "./types";
import * as crypto from "crypto";

const FILE_NAME = "TO-DO.md";

/* ---------------- PATH ---------------- */

function getFileUri(): vscode.Uri | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage("Open a folder first to save TO-DOs.");
    return null;
  }
  return vscode.Uri.joinPath(folders[0].uri, FILE_NAME);
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

/* ---------------- ID (SCAN) ---------------- */

function makeSourceKey(
  relativePath: string,
  line: number,
  text: string
): string {
  const t = text.trim().slice(0, 32);
  return `${normalizePath(relativePath)}:${line}:${t}`;
}

function hashId(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

/* ---------------- FACTORIES ---------------- */

// 🔴 SOLO para TODOs manuales
export function makeTodo(text: string): TodoItem {
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
    date_added: new Date().toISOString(),
    date_finished: null,
  };
}

// 🟢 SOLO para TODOs escaneados
export function makeScannedTodo(
  text: string,
  relativePath: string,
  line: number
): TodoItem {
  const cleanText = text.trim() || "TODO";
  const sourceKey = makeSourceKey(relativePath, line, cleanText);
  const id = hashId(sourceKey);

  return {
    id,
    text: cleanText,
    completed: false,
    date_added: new Date().toISOString(),
    date_finished: null,
    relativePath: normalizePath(relativePath),
    line,
    sourceKey,
  };
}

/* ---------------- READ ---------------- */

export async function readTodos(): Promise<TodoItem[]> {
  const uri = getFileUri();
  if (!uri) return [];

  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return parseMarkdown(Buffer.from(bytes).toString("utf8"));
  } catch {
    return [];
  }
}

/* ---------------- WRITE ---------------- */

export async function writeTodos(items: TodoItem[]): Promise<void> {
  const uri = getFileUri();
  if (!uri) return;

  // 🔥 blindaje final
  const map = new Map<string, TodoItem>();
  for (const t of items) {
    if (!map.has(t.id)) map.set(t.id, t);
  }

  const md = generateMarkdown([...map.values()]);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(md, "utf8"));

  await ensureGitignoreHasEntry(FILE_NAME);
}

/* ---------------- PARSE ---------------- */

function parseMarkdown(md: string): TodoItem[] {
  const todos: TodoItem[] = [];

  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^- \[( |x)\] (.+?)(?: <!-- (.+) -->)?$/);
    if (!m) continue;

    const completed = m[1] === "x";
    const text = m[2];
    const metaRaw = m[3];

    if (!metaRaw) continue;

    try {
      const meta = JSON.parse(metaRaw);

      todos.push({
        id: meta.id,
        text,
        completed,
        date_added: meta.date_added,
        date_finished: meta.date_finished ?? null,
        relativePath: meta.relativePath,
        line: meta.line,
        sourceKey: meta.sourceKey,
      });
    } catch {
      // ignore
    }
  }

  return todos;
}

/* ---------------- GENERATE ---------------- */

function generateMarkdown(items: TodoItem[]): string {
  const lines: string[] = ["# TO-DO", ""];

  for (const item of items) {
    const meta = {
      id: item.id,
      date_added: item.date_added,
      date_finished: item.date_finished ?? null,
      relativePath: item.relativePath,
      line: item.line,
      sourceKey: item.sourceKey,
    };

    lines.push(
      `- [${item.completed ? "x" : " "}] ${item.text} <!-- ${JSON.stringify(
        meta
      )} -->`
    );
  }

  lines.push("");
  return lines.join("\n");
}

/* ---------------- GITIGNORE ---------------- */

async function ensureGitignoreHasEntry(fileName: string) {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return;

  const gitignoreUri = vscode.Uri.joinPath(folders[0].uri, ".gitignore");

  let content = "";
  try {
    content = Buffer.from(
      await vscode.workspace.fs.readFile(gitignoreUri)
    ).toString("utf8");
  } catch {}

  if (!content.split(/\r?\n/).includes(fileName)) {
    await vscode.workspace.fs.writeFile(
      gitignoreUri,
      Buffer.from(content + "\n" + fileName + "\n", "utf8")
    );
  }
}
