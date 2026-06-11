const BASE = "/api";

async function request(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts?.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Projects
  listProjects: () => request("/projects"),
  createProject: (data: { name: string; description?: string; context?: string; repos?: unknown[] }) =>
    request("/projects", { method: "POST", body: JSON.stringify(data) }),
  deleteProject: (name: string) => request(`/projects/${name}`, { method: "DELETE" }),
  updateProject: (name: string, data: Record<string, unknown>) =>
    request(`/projects/${name}`, { method: "PUT", body: JSON.stringify(data) }),

  // Reports
  listReports: (projName: string) => request(`/projects/${projName}/reports`),
  createReport: (projName: string, data: { title: string; type?: string; template_id?: string }) =>
    request(`/projects/${projName}/reports`, { method: "POST", body: JSON.stringify(data) }),

  // Templates
  listTemplates: () => request("/templates"),
  createTemplate: (data: { name: string; description?: string; skills?: string[]; rules?: string[]; subagents?: Record<string, unknown> }) =>
    request("/templates", { method: "POST", body: JSON.stringify(data) }),
  updateTemplate: (id: string, data: Record<string, unknown>) =>
    request(`/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTemplate: (id: string) => request(`/templates/${id}`, { method: "DELETE" }),

  // Profile
  getProfile: () => request("/profile"),
  updateProfile: (data: Record<string, unknown>) =>
    request("/profile", { method: "PUT", body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request("/settings"),
  updateSettings: (data: Record<string, string>) =>
    request("/settings", { method: "PUT", body: JSON.stringify(data) }),
};
