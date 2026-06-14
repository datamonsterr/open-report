import { createContext, useContext, createSignal, type JSX, createEffect } from "solid-js";
import { createWS } from "@solid-primitives/websocket";

interface Project {
  name: string;
  reports: string[];
}

interface BusinessState {
  projects: () => Project[];
  setProjects: (p: Project[]) => void;
  activeProject: () => string | null;
  setActiveProject: (name: string | null) => void;
  activeReport: () => string | null;
  setActiveReport: (name: string | null) => void;
  chatMessages: () => any[];
  addChatMessage: (msg: any) => void;
  sendChatMessage: (msg: any) => void;
}

const BusinessContext = createContext<BusinessState>();

export function BusinessProvider(props: { children: JSX.Element }) {
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [activeProject, setActiveProject] = createSignal<string | null>(null);
  const [activeReport, setActiveReport] = createSignal<string | null>(null);
  const [chatMessages, setChatMessages] = createSignal<any[]>([]);

   const ws = createWS(`ws://${window.location.host}/ws`);

  if (ws) {
    ws.addEventListener("message", (event: MessageEvent) => {
      setChatMessages((prev) => [...prev, event.data]);
    });
  }

  const state: BusinessState = {
    projects,
    setProjects,
    activeProject,
    setActiveProject,
    activeReport,
    setActiveReport,
    chatMessages,
    addChatMessage: (msg) => setChatMessages((prev) => [...prev, msg]),
    sendChatMessage: (msg) => ws.send(JSON.stringify(msg)),
  };

  return <BusinessContext.Provider value={state}>{props.children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}