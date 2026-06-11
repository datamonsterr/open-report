import { createSignal, type Component } from "solid-js";
import { AppProvider, useApp } from "~/context/app";
import { TopToolbar } from "~/components/TopToolbar";
import { NavSidebar } from "~/components/NavSidebar";
import { ChatPanel } from "~/components/ChatPanel";
import { PreviewPanel } from "~/components/PreviewPanel";
import { PanelResizer } from "~/components/PanelResizer";
import { ToastContainer } from "~/components/Toast";

const AppLayout: Component = () => {
  const app = useApp();
  const [activeProj, setActiveProj] = createSignal<string | null>(null);
  const [activeReport, setActiveReport] = createSignal<string | null>(null);

  const handleSelectReport = (proj: string, report: string) => {
    setActiveProj(proj);
    setActiveReport(report);
  };

  return (
    <div class="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TopToolbar />
      <main class="flex-1 flex overflow-hidden">
        <NavSidebar onSelectReport={handleSelectReport} />
        <PanelResizer
          direction="horizontal"
          onResize={(delta) => {
            if (!app.sidebarCollapsed()) {
              app.setSidebarWidth(Math.max(160, Math.min(400, app.sidebarWidth() + delta)));
            }
          }}
        />
        <ChatPanel />
        <PanelResizer
          direction="horizontal"
          onResize={(delta) => {
            const container = document.querySelector("main");
            if (!container) return;
            const total = container.clientWidth;
            const currentPx = (app.previewWidth() / 100) * total;
            const newPx = currentPx - delta;
            app.setPreviewWidth(Math.max(20, Math.min(80, (newPx / total) * 100)));
          }}
        />
        <section
          class="border-l border-border bg-background flex flex-col"
          style={{ width: `${app.previewWidth()}%` }}
        >
          <PreviewPanel reportUrl={activeReport() ? `/api/static/${activeProj()}/${activeReport()}/v1/index.html` : undefined} />
        </section>
      </main>
      <ToastContainer />
    </div>
  );
};

export const App: Component = () => {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};
