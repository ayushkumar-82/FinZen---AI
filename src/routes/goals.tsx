import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { financeStore, localDateISO, useFinance, type Goal } from "@/lib/finance-store";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals · FinPilot AI" },
      { name: "description", content: "Set financial goals, track progress, and get AI-recommended monthly savings targets." },
      { property: "og:title", content: "Goals · FinPilot AI" },
      { property: "og:description", content: "Track financial goals with AI-recommended savings plans." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const state = useFinance();
  const [form, setForm] = useState<Omit<Goal, "id">>({
    title: "", target: 0, saved: 0, targetDate: localDateISO(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
    priority: "medium",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || form.target <= 0) { toast.error("Enter title and target"); return; }
    financeStore.addGoal(form);
    setForm({ ...form, title: "", target: 0, saved: 0 });
    toast.success(`Goal "${form.title}" added`);
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Goals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every goal maps to a monthly savings target so you know exactly what to set aside.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-1">
          <h3 className="text-sm font-bold mb-4">New Goal</h3>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
                placeholder="New MacBook" />
            </Field>
            <Field label="Target Amount (₹)">
              <input type="number" value={form.target || ""} onChange={(e) => setForm({ ...form, target: parseFloat(e.target.value) || 0 })}
                className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm" />
            </Field>
            <Field label="Already Saved (₹)">
              <input type="number" value={form.saved || ""} onChange={(e) => setForm({ ...form, saved: parseFloat(e.target.value) || 0 })}
                className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm" />
            </Field>
            <Field label="Target Date">
              <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm" />
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Goal["priority"] })}
                className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-accent text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:brightness-110">
              <Plus className="size-3.5" /> Add Goal
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {state.goals.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              No goals yet. Add your first goal on the left.
            </div>
          ) : null}
          {[...state.goals].reverse().map((g) => {
            const remaining = Math.max(0, g.target - g.saved);
            const monthsLeft = Math.max(1, Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (30 * 24 * 3600 * 1000)));
            const monthlyNeeded = remaining / monthsLeft;
            const progress = Math.min(1, g.saved / g.target);
            return (
              <div key={g.id} className="bg-surface border border-border rounded-xl p-5 lg:p-6">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{g.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                        g.priority === "high" ? "bg-destructive/10 text-destructive" :
                        g.priority === "medium" ? "bg-accent/10 text-accent" :
                        "bg-muted/20 text-muted-foreground"
                      }`}>{g.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target {new Date(g.targetDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} · {monthsLeft} mo left
                    </p>
                  </div>
                  <button
                    onClick={() => financeStore.removeGoal(g.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap justify-between text-xs mb-2">
                  <span className="font-mono">{formatINR(g.saved, { compact: true })} / {formatINR(g.target, { compact: true })}</span>
                  <span className="font-mono text-muted-foreground">{(progress * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <Stat label="Remaining" value={formatINR(remaining, { compact: true })} />
                  <Stat label="Save / month" value={formatINR(monthlyNeeded, { compact: true })} accent />
                  <Stat label="On track" value={progress >= (1 - monthsLeft / 24) ? "Yes" : "Push"} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}
