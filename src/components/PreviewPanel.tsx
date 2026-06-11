import { createSignal, Show, type Component } from "solid-js";

export const PreviewPanel: Component<{ reportUrl?: string }> = (props) => {
  const [activeTab, setActiveTab] = createSignal<"preview" | "diagram" | "inspect">("preview");
  const [diagramSource, setDiagramSource] = createSignal("");
  const [selectedElements, setSelectedElements] = createSignal<string[]>([]);

  const tabs = [
    { id: "preview" as const, label: "Preview" },
    { id: "diagram" as const, label: "Diagram" },
    { id: "inspect" as const, label: "Inspect" },
  ];

  const sendToAI = () => {
    const elms = selectedElements();
    if (elms.length === 0) return;
    const msg = `Edit these HTML elements:\n\`\`\`html\n${elms.join("\n")}\n\`\`\``;
    // Will integrate with ChatPanel via context/event bus
    console.log("Send to AI:", msg);
    setSelectedElements([]);
  };

  return (
    <section class="flex flex-col h-full">
      {/* Tab bar */}
      <div class="h-8 bg-muted/30 border-b border-border flex items-center shrink-0">
        {tabs.map((tab) => (
          <button
            class={`px-3 h-full text-xs transition-colors
              ${activeTab() === tab.id
                ? "text-foreground border-b-2 border-primary bg-background/50"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <div class="flex-1" />
        <Show when={selectedElements().length > 0}>
          <button
            class="text-xs text-primary hover:underline px-2"
            onClick={sendToAI}
          >
            Send {selectedElements().length} selected to AI
          </button>
        </Show>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-hidden">
        <Show when={activeTab() === "preview"}>
          <div class="h-full flex flex-col">
            {props.reportUrl ? (
              <iframe
                src={props.reportUrl}
                class="flex-1 w-full border-0"
                sandbox="allow-scripts"
                title="Report preview"
              />
            ) : (
              <div class="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                No report open. Create or select a report to preview.
              </div>
            )}
          </div>
        </Show>

        <Show when={activeTab() === "diagram"}>
          <div class="h-full flex flex-col p-4">
            <div class="flex gap-4 flex-1 min-h-0">
              {/* Source editor */}
              <div class="flex-1 flex flex-col">
                <label class="text-xs text-muted-foreground mb-1">Diagram Source</label>
                <textarea
                  value={diagramSource()}
                  onInput={(e) => setDiagramSource(e.currentTarget.value)}
                  placeholder="Paste PlantUML, Mermaid, or Diagrams.py source here..."
                  class="flex-1 bg-muted border border-border rounded-lg p-3 font-mono text-xs resize-none
                    focus:outline-none focus:border-primary"
                  spellcheck={false}
                />
                <div class="flex gap-2 mt-2">
                  <button
                    class="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity"
                    onClick={() => {/* TODO: render diagram */}}
                  >
                    Render
                  </button>
                  <button
                    class="px-3 py-1 bg-accent text-foreground rounded text-xs hover:opacity-90 transition-opacity"
                    onClick={() => console.log("Edit with AI:", diagramSource())}
                  >
                    Edit with AI
                  </button>
                </div>
              </div>
              {/* Preview */}
              <div class="flex-1 flex flex-col">
                <label class="text-xs text-muted-foreground mb-1">Preview</label>
                <div class="flex-1 bg-muted/50 border border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                  {diagramSource() ? "Click Render to preview" : "No diagram source"}
                </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === "inspect"}>
          <div class="p-4 text-sm text-muted-foreground">
            <p class="mb-2">HTML Inspector</p>
            <ul class="list-disc pl-4 space-y-1 text-xs">
              <li><strong>Hover</strong> — highlights elements</li>
              <li><strong>Click</strong> — select & edit text (contentEditable)</li>
              <li><strong>Shift+Click</strong> — add to multi-select</li>
              <li>Use toolbar button to send selection to AI</li>
            </ul>
            <Show when={selectedElements().length > 0}>
              <div class="mt-3 p-2 bg-accent rounded text-xs">
                {selectedElements().length} element(s) selected
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </section>
  );
};
