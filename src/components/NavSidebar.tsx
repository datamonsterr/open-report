import { createSignal, Show, type Component } from "solid-js";
import { useApp } from "~/context/app";
import { ProjectList } from "~/components/ProjectList";
import { TemplateList } from "~/components/TemplateList";
import { SettingsPanel } from "~/components/SettingsPanel";

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: "projects", label: "Projects", icon: "📁" },
  { id: "templates", label: "Templates", icon: "📋" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export const NavSidebar: Component<{
  onSelectReport: (proj: string, report: string) => void;
}> = (props) => {
  const app = useApp();
  const [activeTab, setActiveTab] = createSignal("projects");

  return (
    <aside
      class="border-r border-border bg-muted/30 flex flex-col shrink-0 overflow-hidden transition-all duration-200"
      style={{ width: app.sidebarCollapsed() ? "40px" : `${app.sidebarWidth()}px` }}
    >
      <nav class="flex-1 overflow-hidden flex flex-col">
        {/* Tab bar */}
        <div class="flex border-b border-border shrink-0">
          {navItems.map((item) => (
            <button
              class={`flex-1 py-2 text-center text-xs transition-colors hover:bg-accent
                ${activeTab() === item.id ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
            >
              {app.sidebarCollapsed() ? item.icon : item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <Show when={!app.sidebarCollapsed()}>
          <div class="flex-1 overflow-hidden">
            <Show when={activeTab() === "projects"}>
              <ProjectList onSelectReport={props.onSelectReport} />
            </Show>
            <Show when={activeTab() === "templates"}>
              <TemplateList />
            </Show>
            <Show when={activeTab() === "settings"}>
              <SettingsPanel />
            </Show>
          </div>
        </Show>
      </nav>

      <div class="p-2 border-t border-border text-xs text-muted-foreground">
        {!app.sidebarCollapsed() && <span>Open Report v0.1</span>}
      </div>
    </aside>
  );
};
