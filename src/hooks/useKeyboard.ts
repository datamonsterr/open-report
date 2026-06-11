import { onCleanup } from "solid-js";

export function useKeyboard() {
  const handlers = new Map<string, () => void>();

  const register = (key: string, handler: () => void) => {
    handlers.set(key, handler);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    for (const [key, handler] of handlers) {
      if (e.key === key && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handler();
        return;
      }
      if (e.key === key && !e.ctrlKey && !e.metaKey) {
        // Plain key shortcuts without modifiers
      }
    }
  };

  document.addEventListener("keydown", onKeyDown);
  onCleanup(() => document.removeEventListener("keydown", onKeyDown));

  return { register };
}
