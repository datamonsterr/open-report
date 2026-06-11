import { createSignal, For, Show, type Component } from "solid-js";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool_call" | "tool_result";
  content: string;
  toolName?: string;
  toolArgs?: string;
}

export const ChatPanel: Component = () => {
  const [messages, setMessages] = createSignal<Message[]>([
    { id: "welcome", role: "assistant", content: "Select a report to start collaborating. I can help you generate SRS documents, architecture reports, and more." },
  ]);
  const [input, setInput] = createSignal("");
  const [streaming, setStreaming] = createSignal(false);

  const sendMessage = () => {
    const text = input().trim();
    if (!text) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    // Simulate streaming response (placeholder until opencode WebSocket integration)
    setTimeout(() => {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Received: "${text}". OpenCode session integration coming soon.`,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setStreaming(false);
    }, 1000);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section class="flex-1 flex flex-col min-w-0 bg-background">
      {/* Session header */}
      <div class="h-8 bg-muted/30 border-b border-border flex items-center px-3 shrink-0">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
        <span class="text-xs text-muted-foreground">Open Report Session</span>
        <div class="flex-1" />
        <button class="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent transition-colors" title="Export chat">
          ↓
        </button>
        <button class="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent transition-colors ml-1" title="Clear chat">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <For each={messages()}>
          {(msg) => (
            <div class={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                class={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed
                  ${msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : msg.role === "tool_call" || msg.role === "tool_result"
                      ? "bg-muted text-muted-foreground border border-border font-mono text-xs"
                      : "bg-accent text-foreground"
                  }`}
              >
                <Show when={msg.role === "tool_call" && msg.toolName}>
                  <div class="font-semibold mb-1">🔧 {msg.toolName}</div>
                  <pre class="whitespace-pre-wrap text-xs">{msg.toolArgs}</pre>
                </Show>
                <Show when={msg.role === "tool_result"}>
                  <div class="font-semibold mb-1">📋 Result</div>
                  <pre class="whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">{msg.content}</pre>
                </Show>
                <Show when={msg.role !== "tool_call" && msg.role !== "tool_result"}>
                  <div innerHTML={msg.content.replace(/\n/g, "<br>")} />
                </Show>
              </div>
            </div>
          )}
        </For>
        <Show when={streaming()}>
          <div class="flex justify-start">
            <div class="bg-accent rounded-lg px-3 py-2 text-sm text-muted-foreground animate-pulse">
              Thinking...
            </div>
          </div>
        </Show>
      </div>

      {/* Input */}
      <div class="border-t border-border p-3 bg-muted/20">
        <div class="flex gap-2 items-end">
          <textarea
            value={input()}
            onInput={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={2}
            class="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none
              focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
              placeholder:text-muted-foreground"
          />
          <button
            onClick={sendMessage}
            disabled={streaming() || !input().trim()}
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium
              hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
};
