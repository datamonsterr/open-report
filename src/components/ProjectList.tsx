import { createSignal, createEffect, Show, For, type Component } from "solid-js";
import { api } from "~/utils/api";

interface Project {
  id: string;
  name: string;
  description: string;
  updated_at: string;
  reportCount?: number;
}

interface Report {
  id: string;
  project_id: string;
  title: string;
  type: string;
  updated_at: string;
}

export const ProjectList: Component<{
  onSelectReport: (proj: string, report: string) => void;
}> = (props) => {
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [reports, setReports] = createSignal<Record<string, Report[]>>({});
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    api.listProjects()
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  });

  const toggleExpand = async (projName: string) => {
    const set = new Set(expanded());
    if (set.has(projName)) {
      set.delete(projName);
    } else {
      set.add(projName);
      // Load reports
      if (!reports()[projName]) {
        try {
          const data = await api.listReports(projName);
          setReports((prev) => ({ ...prev, [projName]: data }));
        } catch { /* ignore */ }
      }
    }
    setExpanded(set);
  };

  const handleNewProject = async () => {
    const name = prompt("Project name:");
    if (!name) return;
    try {
      await api.createProject({ name });
      const data = await api.listProjects();
      setProjects(data);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to create project");
    }
  };

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-3 py-2 border-b border-border">
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
        <button
          class="text-xs text-primary hover:underline"
          onClick={handleNewProject}
        >
          + New
        </button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <Show when={loading()}>
          <div class="p-3 text-xs text-muted-foreground">Loading...</div>
        </Show>
        <Show when={!loading() && projects().length === 0}>
          <div class="p-3 text-xs text-muted-foreground">
            No projects yet. Click "+ New" to create one.
          </div>
        </Show>
        <For each={projects()}>
          {(proj) => (
            <div>
              <button
                class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left"
                onClick={() => toggleExpand(proj.name)}
              >
                <span class="text-muted-foreground">{expanded().has(proj.name) ? "▾" : "▸"}</span>
                <span class="truncate flex-1">{proj.name}</span>
              </button>
              <Show when={expanded().has(proj.name)}>
                <div class="pl-7">
                  <For each={reports()[proj.name] || []}>
                    {(report) => (
                      <button
                        class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left text-muted-foreground"
                        onClick={() => props.onSelectReport(proj.name, report.id)}
                      >
                        <span>📄</span>
                        <span class="truncate">{report.title}</span>
                        <span class="text-[10px] opacity-50 ml-auto">{report.type}</span>
                      </button>
                    )}
                  </For>
                  <button
                    class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left text-primary"
                    onClick={async () => {
                      const title = prompt("Report title:");
                      if (!title) return;
                      try {
                        await api.createReport(proj.name, { title });
                        const data = await api.listReports(proj.name);
                        setReports((prev) => ({ ...prev, [proj.name]: data }));
                      } catch (e: unknown) {
                        alert(e instanceof Error ? e.message : "Failed to create report");
                      }
                    }}
                  >
                    <span>+</span>
                    <span>New Report</span>
                  </button>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
