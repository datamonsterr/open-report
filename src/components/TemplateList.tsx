import { createSignal, createEffect, For, Show, type Component } from "solid-js";
import { api } from "~/utils/api";

interface Template {
  id: string;
  name: string;
  description: string;
  skills_json: string;
  rules_json: string;
}

export const TemplateList: Component = () => {
  const [templates, setTemplates] = createSignal<Template[]>([]);
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [form, setForm] = createSignal({ name: "", description: "", skills: "", rules: "" });
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    api.listTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const handleCreate = async () => {
    const f = form();
    if (!f.name) return;
    try {
      await api.createTemplate({ name: f.name, description: f.description, skills: f.skills ? f.skills.split(",").map((s) => s.trim()) : [], rules: f.rules ? f.rules.split(",").map((s) => s.trim()) : [] });
      const data = await api.listTemplates();
      setTemplates(data);
      setForm({ name: "", description: "", skills: "", rules: "" });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await api.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-3 py-2 border-b border-border">
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Templates</span>
      </div>
      <div class="flex-1 overflow-y-auto">
        <Show when={loading()}>
          <div class="p-3 text-xs text-muted-foreground">Loading...</div>
        </Show>
        <Show when={!loading() && templates().length === 0}>
          <div class="p-3 text-xs text-muted-foreground">No templates yet.</div>
        </Show>
        <For each={templates()}>
          {(tmpl) => (
            <div class="px-3 py-2 border-b border-border/50 hover:bg-accent/50 transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium truncate">{tmpl.name}</span>
                <button
                  class="text-[10px] text-destructive hover:underline ml-2"
                  onClick={() => handleDelete(tmpl.id)}
                >
                  Del
                </button>
              </div>
              <Show when={tmpl.description}>
                <p class="text-[10px] text-muted-foreground mt-0.5 truncate">{tmpl.description}</p>
              </Show>
            </div>
          )}
        </For>
      </div>
      {/* Create form */}
      <div class="border-t border-border p-2">
        <input
          value={form().name}
          onInput={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
          placeholder="Template name"
          class="w-full bg-muted border border-border rounded px-2 py-1 text-xs mb-1 focus:outline-none focus:border-primary"
        />
        <input
          value={form().description}
          onInput={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))}
          placeholder="Description"
          class="w-full bg-muted border border-border rounded px-2 py-1 text-xs mb-1 focus:outline-none focus:border-primary"
        />
        <input
          value={form().skills}
          onInput={(e) => setForm((f) => ({ ...f, skills: e.currentTarget.value }))}
          placeholder="Skills (comma-separated)"
          class="w-full bg-muted border border-border rounded px-2 py-1 text-xs mb-1 focus:outline-none focus:border-primary"
        />
        <input
          value={form().rules}
          onInput={(e) => setForm((f) => ({ ...f, rules: e.currentTarget.value }))}
          placeholder="Rules (comma-separated)"
          class="w-full bg-muted border border-border rounded px-2 py-1 text-xs mb-1 focus:outline-none focus:border-primary"
        />
        <button
          class="w-full bg-primary text-primary-foreground rounded px-2 py-1 text-xs hover:opacity-90 transition-opacity"
          onClick={handleCreate}
        >
          Create Template
        </button>
      </div>
    </div>
  );
};
