import { createSignal, createContext, useContext, createEffect } from "solid-js";
import type { JSX, Accessor, Setter } from "solid-js";

export interface AppState {
  sidebarCollapsed: Accessor<boolean>;
  setSidebarCollapsed: Setter<boolean>;
  sidebarWidth: Accessor<number>;
  setSidebarWidth: Setter<number>;
  previewWidth: Accessor<number>;
  setPreviewWidth: Setter<number>;
  theme: Accessor<"dark" | "light">;
  setTheme: Setter<"dark" | "light">;
  toggleTheme: () => void;
}

const AppContext = createContext<AppState>();

export function AppProvider(props: { children: JSX.Element }) {
  const stored = (() => {
    try {
      return JSON.parse(localStorage.getItem("open-report-prefs") || "{}");
    } catch {
      return {};
    }
  })();

  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(stored.sidebarCollapsed ?? false);
  const [sidebarWidth, setSidebarWidth] = createSignal(stored.sidebarWidth ?? 240);
  const [previewWidth, setPreviewWidth] = createSignal(stored.previewWidth ?? 50);
  const [theme, setTheme] = createSignal<"dark" | "light">(stored.theme ?? "dark");

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  createEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme() === "dark");
    root.classList.toggle("light", theme() === "light");
  });

  createEffect(() => {
    localStorage.setItem(
      "open-report-prefs",
      JSON.stringify({
        sidebarCollapsed: sidebarCollapsed(),
        sidebarWidth: sidebarWidth(),
        previewWidth: previewWidth(),
        theme: theme(),
      }),
    );
  });

  const state: AppState = {
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarWidth,
    setSidebarWidth,
    previewWidth,
    setPreviewWidth,
    theme,
    setTheme,
    toggleTheme,
  };

  return <AppContext.Provider value={state}>{props.children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
