import { createSignal, createEffect, Show, type Component } from "solid-js";
import { api } from "~/utils/api";

export const SettingsPanel: Component = () => {
  const [profile, setProfile] = createSignal({ name: "", email: "", org: "" });
  const [saved, setSaved] = createSignal(false);

  createEffect(() => {
    api.getProfile().then(setProfile).catch(() => {});
  });

  const handleSave = async () => {
    try {
      await api.updateProfile(profile());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <div class="p-3 space-y-3">
      <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Author Profile</h3>
      <div class="space-y-2">
        <div>
          <label class="text-[10px] text-muted-foreground block mb-0.5">Name</label>
          <input
            value={profile().name}
            onInput={(e) => setProfile((p) => ({ ...p, name: e.currentTarget.value }))}
            class="w-full bg-muted border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="text-[10px] text-muted-foreground block mb-0.5">Email</label>
          <input
            value={profile().email}
            onInput={(e) => setProfile((p) => ({ ...p, email: e.currentTarget.value }))}
            class="w-full bg-muted border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="text-[10px] text-muted-foreground block mb-0.5">Organization</label>
          <input
            value={profile().org}
            onInput={(e) => setProfile((p) => ({ ...p, org: e.currentTarget.value }))}
            class="w-full bg-muted border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
          />
        </div>
      </div>
      <button
        class="w-full bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
        onClick={handleSave}
      >
        {saved() ? "Saved!" : "Save Profile"}
      </button>
    </div>
  );
};
