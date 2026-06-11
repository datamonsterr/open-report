import { For, type Component } from "solid-js";
import { useApp } from "~/context/app";

const actions = [
  { id: "new-report", label: "New Report", icon: "+" },
  { id: "import", label: "Import", icon: "↓" },
  { id: "export", label: "Export", icon: "↑" },
  { id: "settings", label: "Settings", icon: "⚙" },
  { id: "help", label: "Help", icon: "?" },
];

export const TopToolbar: Component = () => {
  const app = useApp();

  return (
    <header class="h-10 bg-muted/50 border-b border-border flex items-center px-3 gap-1 shrink-0">
      <button
        class="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-sm"
        onClick={() => app.setSidebarCollapsed(!app.sidebarCollapsed())}
        title="Toggle sidebar"
      >
        ☰
      </button>
      <span class="font-semibold text-sm mr-4 select-none">Open Report</span>
      <div class="flex-1" />
      <For each={actions}>
        {(action) => (
          <button
            class="px-2.5 py-1 text-xs rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={action.label}
          >
            <span class="mr-1">{action.icon}</span>
            {action.label}
          </button>
        )}
      </For>
      <button
        class="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-sm ml-2"
        onClick={app.toggleTheme}
        title="Toggle theme"
      >
        {app.theme() === "dark" ? "☀" : "☾"}
      </button>
    </header>
  );
};
