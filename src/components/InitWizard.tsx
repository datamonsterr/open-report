import { createSignal, Show, type Component } from "solid-js";
import { api } from "~/utils/api";

interface WizardStep {
  question: string;
  field: string;
  type: "text" | "select" | "text";
  options?: string[];
}

const wizardSteps: WizardStep[] = [
  { question: "What should we name this project?", field: "projectName", type: "text" },
  { question: "What type of report do you want? (srs, architecture, slides, custom)", field: "reportType", type: "text" },
  { question: "Describe the target system or project scope:", field: "scope", type: "text" },
];

export const InitWizard: Component<{ onComplete: (project: string, report: string) => void }> = (props) => {
  const [step, setStep] = createSignal(0);
  const [answers, setAnswers] = createSignal<Record<string, string>>({});
  const [currentInput, setCurrentInput] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [messages, setMessages] = createSignal<{ role: string; content: string }[]>([
    { role: "assistant", content: "Let's set up your report. I'll ask a few questions." },
  ]);

  const current = () => wizardSteps[step()];

  const handleNext = async () => {
    const value = currentInput().trim();
    if (!value && current()?.type !== "text") return;

    const field = current()?.field || "";
    setAnswers((a) => ({ ...a, [field]: value }));
    setMessages((m) => [...m, { role: "user", content: value }, { role: "assistant", content: current()?.question || "" }]);
    setCurrentInput("");

    if (step() >= wizardSteps.length - 1) {
      // Finish wizard
      setLoading(true);
      const a = answers();
      const projName = a.projectName || "default-project";

      try {
        // Create project
        const projs = await api.listProjects();
        const existing = projs.find((p: { name: string }) => p.name === projName.toLowerCase().replace(/\s+/g, "-"));
        if (!existing) {
          await api.createProject({ name: projName });
        }
        const slug = projName.toLowerCase().replace(/\s+/g, "-");

        // Create report
        const report = await api.createReport(slug, {
          title: `${a.reportType || "custom"} Report - ${new Date().toLocaleDateString()}`,
          type: a.reportType || "custom",
        });

        setMessages((m) => [...m, { role: "assistant", content: `Report created! Opening "${a.reportType || "custom"}" report for ${projName}.` }]);
        setLoading(false);
        props.onComplete(slug, report.id);
      } catch (e: unknown) {
        setMessages((m) => [...m, { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Unknown"}` }]);
        setLoading(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div class="flex-1 flex flex-col min-w-0 bg-background">
      <div class="h-8 bg-muted/30 border-b border-border flex items-center px-3 shrink-0">
        <span class="text-xs text-muted-foreground">Report Setup Wizard</span>
        <div class="flex-1" />
        <button
          class="text-xs text-primary hover:underline"
          onClick={() => {
            api.createProject({ name: "quick-report" }).then(() => {
              api.createReport("quick-report", { title: "Quick Report", type: "custom" }).then((r: { id: string }) => {
                props.onComplete("quick-report", r.id);
              });
            });
          }}
        >
          Quick Start
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages().map((msg, i) => (
          <div class={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              class={`max-w-[80%] rounded-lg px-3 py-2 text-sm
                ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
       <Show when={step() < wizardSteps.length}>
        <div class="border-t border-border p-3 bg-muted/20">
          <div class="flex gap-2 items-end">
            <input
              value={currentInput()}
              onInput={(e) => setCurrentInput(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              placeholder={current()?.question || ""}
              class="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
                placeholder:text-muted-foreground"
            />
            <button
              onClick={handleNext}
              disabled={loading()}
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium
                hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
            >
              {loading() ? "Creating..." : step() >= wizardSteps.length - 1 ? "Create" : "Next"}
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};
