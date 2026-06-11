import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, cpSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { homedir } from "node:os";
import { $ } from "bun";

const HOME = homedir();
const OPEN_REPORT_DIR = join(HOME, ".open-report");
const TMP_OPENCODE = join("/tmp", "opencode");
const PORT = 4091;

// Ensure directories exist
mkdirSync(OPEN_REPORT_DIR, { recursive: true });
mkdirSync(TMP_OPENCODE, { recursive: true });

// SQLite setup
const DB_PATH = join(OPEN_REPORT_DIR, "data.db");
const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA foreign_keys=ON");

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    git_repo_path TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    archived INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS project_repos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    provider TEXT DEFAULT 'github',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'markdown',
    path TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'custom',
    template_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version_count INTEGER DEFAULT 0,
    author_id TEXT
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    skills_json TEXT DEFAULT '[]',
    rules_json TEXT DEFAULT '[]',
    subagents_json TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS authors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    email TEXT DEFAULT '',
    org TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
    opencode_session_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    git_commit TEXT DEFAULT '',
    version_number INTEGER NOT NULL,
    message TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// --- Helpers ---

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function projectPath(name: string): string {
  return join(OPEN_REPORT_DIR, name);
}

function projectJsonPath(name: string): string {
  return join(projectPath(name), "project.json");
}

function readProjectJson(name: string): Record<string, unknown> | null {
  const p = projectJsonPath(name);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8"));
}

function writeProjectJson(name: string, data: Record<string, unknown>): void {
  const dir = projectPath(name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(projectJsonPath(name), JSON.stringify(data, null, 2));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function parseBody(req: Request): Promise<unknown> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return req.json();
  return req.text();
}

// CORS helper
function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// --- Git Operations ---

async function gitInit(projName: string): Promise<void> {
  const dir = projectPath(projName);
  if (!existsSync(join(dir, ".git"))) {
    await $`cd ${dir} && git init && git config user.email "open-report@local" && git config user.name "open-report"`.quiet();
  }
}

async function gitCommit(projName: string, reportName: string, versionNum: number): Promise<string> {
  const dir = projectPath(projName);
  try {
    await $`cd ${dir} && git add ${reportName}/ && git commit -m "feat(report): render ${reportName} v${versionNum}"`.quiet();
    await $`cd ${dir} && git tag v/${reportName}/${versionNum}`.quiet();
    const sha = await $`cd ${dir} && git rev-parse HEAD`.text();
    return sha.trim();
  } catch {
    return "";
  }
}

async function gitLog(projName: string, limit = 20): Promise<{ hash: string; message: string; date: string }[]> {
  const dir = projectPath(projName);
  try {
    const output = await $`cd ${dir} && git log --oneline --format="%H|%s|%ai" -n ${limit}`.text();
    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, message, date] = line.split("|");
        return { hash, message, date };
      });
  } catch {
    return [];
  }
}

async function gitCheckout(projName: string, tag: string): Promise<void> {
  const dir = projectPath(projName);
  await $`cd ${dir} && git checkout ${tag}`.quiet();
}

async function gitStatus(projName: string): Promise<{ hasChanges: boolean }> {
  const dir = projectPath(projName);
  try {
    await $`cd ${dir} && git status --porcelain`.quiet();
    const status = await $`cd ${dir} && git status --porcelain`.text();
    return { hasChanges: status.trim().length > 0 };
  } catch {
    return { hasChanges: false };
  }
}

// --- API Routes ---

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const path = url.pathname.replace(/\/$/, "");

  // Health
  if (path === "/api/status" && method === "GET") {
    return jsonResponse({ status: "ok", time: new Date().toISOString() });
  }

  // --- Projects ---

  if (path === "/api/projects" && method === "GET") {
    const rows = db.query("SELECT * FROM projects WHERE archived = 0 ORDER BY updated_at DESC").all() as Record<string, unknown>[];
    const projects = rows.map((row) => {
      const pj = readProjectJson(row.name as string);
      return { ...row, repos: pj?.repos || [], materials: pj?.materials || [], context: pj?.context || "" };
    });
    return jsonResponse(projects);
  }

  if (path === "/api/projects" && method === "POST") {
    const body = (await parseBody(req)) as Record<string, unknown>;
    const name = body.name as string;
    if (!name) return errorResponse("name is required");
    const id = generateId();
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    // Check duplicate
    const existing = db.query("SELECT id FROM projects WHERE name = ?").get(name);
    if (existing) return errorResponse("Project with this name already exists", 409);

    db.run("INSERT INTO projects (id, name, description) VALUES (?, ?, ?)", [id, slug, body.description || ""]);

    writeProjectJson(slug, {
      name,
      description: body.description || "",
      context: body.context || "",
      repos: body.repos || [],
      materials: [],
    });

    await gitInit(slug);

    return jsonResponse({ id, name: slug, description: body.description }, 201);
  }

  if (path.startsWith("/api/projects/") && method === "DELETE") {
    const name = path.replace("/api/projects/", "");
    const project = db.query("SELECT * FROM projects WHERE name = ?").get(name) as Record<string, unknown>;
    if (!project) return errorResponse("Not found", 404);

    db.run("DELETE FROM projects WHERE name = ?", [name]);
    rmSync(projectPath(name), { recursive: true, force: true });

    return jsonResponse({ deleted: true });
  }

  if (path.startsWith("/api/projects/") && method === "PUT") {
    const name = path.replace("/api/projects/", "");
    const project = db.query("SELECT * FROM projects WHERE name = ?").get(name) as Record<string, unknown>;
    if (!project) return errorResponse("Not found", 404);

    const body = (await parseBody(req)) as Record<string, unknown>;
    const pj = readProjectJson(name) || {};

    if (body.description !== undefined) pj.description = body.description;
    if (body.context !== undefined) pj.context = body.context;
    if (body.repos !== undefined) pj.repos = body.repos;
    if (body.materials !== undefined) pj.materials = body.materials;

    writeProjectJson(name, pj);

    return jsonResponse({ ...project, ...pj });
  }

  // --- Reports (scoped to project) ---

  const reportListMatch = path.match(/^\/api\/projects\/(.+)\/reports$/);
  if (reportListMatch && method === "GET") {
    const projName = reportListMatch[1];
    const rows = db.query("SELECT * FROM reports WHERE project_id = (SELECT id FROM projects WHERE name = ?) ORDER BY updated_at DESC").all(projName);
    return jsonResponse(rows);
  }

  if (reportListMatch && method === "POST") {
    const projName = reportListMatch[1];
    const project = db.query("SELECT id FROM projects WHERE name = ?").get(projName) as Record<string, unknown>;
    if (!project) return errorResponse("Project not found", 404);

    const body = (await parseBody(req)) as Record<string, unknown>;
    const title = body.title as string;
    if (!title) return errorResponse("title is required");

    const id = generateId();
    const slug = title.toLowerCase().replace(/\s+/g, "-");
    const type = (body.type as string) || "custom";

    db.run("INSERT INTO reports (id, project_id, title, type, template_id) VALUES (?, ?, ?, ?, ?)", [
      id,
      project.id,
      title,
      type,
      body.template_id || null,
    ]);

    // Create report dir
    const reportDir = join(projectPath(projName), slug, "v1");
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(join(reportDir, "artifacts.json"), JSON.stringify({ artifacts: [] }, null, 2));

    return jsonResponse({ id, project_id: project.id, title, type }, 201);
  }

  // --- Templates ---

  if (path === "/api/templates" && method === "GET") {
    const rows = db.query("SELECT * FROM templates ORDER BY name").all();
    return jsonResponse(rows);
  }

  if (path === "/api/templates" && method === "POST") {
    const body = (await parseBody(req)) as Record<string, unknown>;
    if (!body.name) return errorResponse("name is required");
    const id = generateId();
    db.run(
      "INSERT INTO templates (id, name, description, skills_json, rules_json, subagents_json) VALUES (?, ?, ?, ?, ?, ?)",
      [id, body.name, body.description || "", JSON.stringify(body.skills || []), JSON.stringify(body.rules || []), JSON.stringify(body.subagents || {})],
    );
    return jsonResponse({ id, name: body.name }, 201);
  }

  if (path.startsWith("/api/templates/") && method === "DELETE") {
    const id = path.replace("/api/templates/", "");
    db.run("DELETE FROM templates WHERE id = ?", [id]);
    return jsonResponse({ deleted: true });
  }

  if (path.startsWith("/api/templates/") && method === "PUT") {
    const id = path.replace("/api/templates/", "");
    const body = (await parseBody(req)) as Record<string, unknown>;
    db.run(
      "UPDATE templates SET name = ?, description = ?, skills_json = ?, rules_json = ?, subagents_json = ? WHERE id = ?",
      [body.name, body.description || "", JSON.stringify(body.skills || []), JSON.stringify(body.rules || []), JSON.stringify(body.subagents || {}), id],
    );
    const row = db.query("SELECT * FROM templates WHERE id = ?").get(id);
    return jsonResponse(row);
  }

  // --- Profile ---

  if (path === "/api/profile" && method === "GET") {
    const configPath = join(OPEN_REPORT_DIR, "config.json");
    const profile = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf-8")) : { name: "", email: "", org: "" };
    return jsonResponse(profile);
  }

  if (path === "/api/profile" && method === "PUT") {
    const body = (await parseBody(req)) as Record<string, unknown>;
    const configPath = join(OPEN_REPORT_DIR, "config.json");
    const existing = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf-8")) : {};
    const updated = { ...existing, ...body };
    writeFileSync(configPath, JSON.stringify(updated, null, 2));
    return jsonResponse(updated);
  }

  // --- Settings ---

  if (path === "/api/settings" && method === "GET") {
    const rows = db.query("SELECT key, value FROM settings").all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    return jsonResponse(settings);
  }

  if (path === "/api/settings" && method === "PUT") {
    const body = (await parseBody(req)) as Record<string, string>;
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(body)) {
      upsert.run(key, value);
    }
    return jsonResponse({ saved: true });
  }

  // --- Version history ---

  const versionMatch = path.match(/^\/api\/projects\/(.+)\/(.+)\/versions$/);
  if (versionMatch && method === "GET") {
    const [, projName, reportName] = versionMatch;
    const logs = await gitLog(projName);
    return jsonResponse(logs);
  }

  // 404
  return errorResponse("Not found", 404);
}

// Start server
const server = Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`[open-report] Backend server running on http://localhost:${PORT}`);
