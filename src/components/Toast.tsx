import { createSignal, For, onCleanup, type Component } from "solid-js";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const [toasts, setToasts] = createSignal<Toast[]>([]);

export function showToast(message: string, type: Toast["type"] = "info") {
  const id = crypto.randomUUID();
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 3000);
}

export const ToastContainer: Component = () => {
  return (
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <For each={toasts()}>
        {(toast) => (
          <div
            class={`px-4 py-2 rounded-lg text-sm shadow-lg animate-in slide-in-from-right
              ${toast.type === "success" ? "bg-green-600 text-white" : ""}
              ${toast.type === "error" ? "bg-red-600 text-white" : ""}
              ${toast.type === "info" ? "bg-accent text-foreground border border-border" : ""}
            `}
          >
            {toast.message}
          </div>
        )}
      </For>
    </div>
  );
};
