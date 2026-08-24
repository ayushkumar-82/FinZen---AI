import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Plus, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES, classify, financeStore, localDateISO, monthlyExpenseTotal, useFinance } from "@/lib/finance-store";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expense Analyzer · FinPilot AI" },
      { name: "description", content: "Track spending across categories, visualize needs vs wants vs luxury, and spot lifestyle inflation." },
      { property: "og:title", content: "Expense Analyzer · FinPilot AI" },
      { property: "og:description", content: "Track and analyze your spending with AI-powered classification." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const state = useFinance();
  const [category, setCategory] = useState<string>("Food");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<string>(localDateISO());

  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byClass = { need: 0, want: 0, luxury: 0 };
    let total = 0;
    for (const e of state.expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      byClass[e.classification ?? classify(e.category)] += e.amount;
      total += e.amount;
    }
    return { byCategory, byClass, total };
  }, [state.expenses]);

  const currentMonthTotal = monthlyExpenseTotal(state.expenses);
  const recentExpenses = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date));

  const barData = Object.entries(totals.byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const classData = [
    { name: "Needs", value: totals.byClass.need, color: "hsl(158 55% 35%)" },
    { name: "Wants", value: totals.byClass.want, color: "hsl(22 90% 55%)" },
    { name: "Luxury", value: totals.byClass.luxury, color: "hsl(210 10% 45%)" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    financeStore.addExpense({
      category, amount: amt, date, note: note || undefined,
      classification: classify(category),
    });
    setAmount(""); setNote("");
    toast.success(`Added ${formatINR(amt)} to ${category}`);
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expense Analyzer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track every category, classify needs vs wants, and spot lifestyle inflation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-1">
          <h3 className="text-sm font-bold mb-4">Log Expense</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.key}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Auto-classified as <span className="text-accent font-mono uppercase">{classify(category)}</span>
              </p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount (₹)</label>
              <input
                type="number" min="0" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full mt-1 bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</label>
              <input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full mt-1 bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Note (optional)</label>
              <input
                type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. dinner with team"
                className="w-full mt-1 bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 uppercase tracking-widest"
            >
              <Plus className="size-3.5" /> Add Expense
            </button>
          </form>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-2">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h3 className="text-sm font-bold">Category Breakdown</h3>
            <div className="text-right text-xs font-mono text-muted-foreground">
              <p>This month: <span className="text-foreground">{formatINR(currentMonthTotal)}</span></p>
              <p>All logged: <span className="text-foreground">{formatINR(totals.total)}</span></p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 12% / 0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(210 10% 45%)" interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(210 10% 45%)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: "white", border: "1px solid hsl(210 20% 12% / 0.08)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatINR(v)}
                />
                <Bar dataKey="value" fill="hsl(158 55% 35%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold mb-4">Needs vs Wants vs Luxury</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={classData} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={2} stroke="none">
                  {classData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Legend iconType="circle" formatter={(v) => <span className="text-xs">{v}</span>} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-2">
          <h3 className="text-sm font-bold mb-4">Recent Expenses</h3>
          <div className="max-h-72 overflow-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-2 py-2 font-bold">Category</th>
                  <th className="text-left px-2 py-2 font-bold">Type</th>
                  <th className="text-left px-2 py-2 font-bold">Date</th>
                  <th className="text-right px-2 py-2 font-bold">Amount</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.slice(0, 20).map((e) => {
                  const cls = e.classification ?? classify(e.category);
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-2 py-2">{e.category}</td>
                      <td className="px-2 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                          cls === "need" ? "bg-accent/10 text-accent" :
                          cls === "want" ? "bg-orange-500/10 text-orange-600" :
                          "bg-muted/20 text-muted-foreground"
                        }`}>{cls}</span>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground text-xs">{e.date}</td>
                      <td className="px-2 py-2 text-right font-mono">{formatINR(e.amount)}</td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() => financeStore.removeExpense(e.id)}
                          className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {state.expenses.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No expenses yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
