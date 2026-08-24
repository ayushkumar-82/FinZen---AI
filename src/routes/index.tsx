import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ArrowUpRight, Sparkles, ShieldCheck, TrendingUp, Send } from "lucide-react";
import { classify, computeFinancialHealth, monthlyCashLeft, monthlyExpenseTotal, useFinance } from "@/lib/finance-store";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · FinPilot AI" },
      { name: "description", content: "Your wealth overview: balance, savings rate, financial health, expenses, goals, and AI insights." },
      { property: "og:title", content: "Dashboard · FinPilot AI" },
      { property: "og:description", content: "AI-powered personal finance overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const state = useFinance();
  const monthlyExp = monthlyExpenseTotal(state.expenses);
  const cashLeft = monthlyCashLeft(state);
  const monthlySavings = Math.max(0, cashLeft);
  const savingsRate = state.profile.monthlySalary > 0 ? (monthlySavings / state.profile.monthlySalary) : 0;
  const healthScore = computeFinancialHealth(state);
  const emergencyMonths = monthlyExp > 0 ? state.profile.currentSavings / monthlyExp : 0;

  // Needs/Wants/Luxury breakdown for current month
  const breakdown = useMemo(() => {
    const now = new Date();
    const m = now.getMonth(), y = now.getFullYear();
    const totals = { need: 0, want: 0, luxury: 0 };
    for (const e of state.expenses) {
      const d = new Date(e.date);
      if (d.getMonth() !== m || d.getFullYear() !== y) continue;
      const cls = e.classification ?? classify(e.category);
      totals[cls] += e.amount;
    }
    return totals;
  }, [state.expenses]);

  const donutData = [
    { name: "Needs", value: breakdown.need, color: "hsl(158 55% 35%)" },
    { name: "Wants", value: breakdown.want, color: "hsl(22 90% 55%)" },
    { name: "Luxury", value: breakdown.luxury, color: "hsl(210 10% 45%)" },
  ];
  const totalCurrent = breakdown.need + breakdown.want + breakdown.luxury || 1;

  // Cashflow trend (last 6 months, seeded)
  const trend = useMemo(() => {
    const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const base = state.profile.monthlySalary;
    return months.map((label, i) => ({
      month: label,
      income: base,
      expense: Math.round(base * (0.55 + i * 0.02 + (i === 5 ? -0.03 : 0))),
    }));
  }, [state.profile.monthlySalary]);

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Net Liquidity"
          value={formatINR(state.profile.currentSavings, { compact: true })}
          delta="+12.4%"
          note="vs last month"
          delay={100}
        />
        <KpiCard
          label="Savings Rate"
          value={`${(savingsRate * 100).toFixed(1)}%`}
          progress={savingsRate}
          delay={150}
        />
        <KpiCard
          label="Health Score"
          value={<>{healthScore}<span className="text-muted-foreground text-lg">/100</span></>}
          bars={healthScore}
          delay={200}
        />
        <KpiCard
          label="Cash Left"
          value={formatINR(cashLeft, { compact: true })}
          note={`${formatINR(monthlyExp)} expenses + ${formatINR(state.profile.monthlyEmi)} EMI`}
          delay={250}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          {/* AI Insights Hero */}
          <div className="bg-foreground text-background p-6 lg:p-8 rounded-2xl relative overflow-hidden animate-enter">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8 md:mb-12">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-accent uppercase">
                    Intelligence Briefing
                  </span>
                  <h2 className="text-xl lg:text-2xl font-medium tracking-tight text-balance max-w-[24ch]">
                    {healthScore >= 75
                      ? "Your finances are on a resilient path"
                      : healthScore >= 55
                      ? "Solid base — a few tweaks unlock the next tier"
                      : "Time to tighten a few leaks in cashflow"}
                  </h2>
                </div>
                <Link
                  to="/advisor"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all shrink-0"
                >
                  Ask AI Advisor
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <InsightCol
                  label="Savings Momentum"
                  value={`${(savingsRate * 100).toFixed(0)}%`}
                  tone="accent"
                  note={savingsRate >= 0.3 ? "Above the healthy 30% benchmark." : "Aim for 30%+ savings rate."}
                />
                <InsightCol
                  label="Lifestyle Load"
                  value={`${((breakdown.want + breakdown.luxury) / (totalCurrent) * 100).toFixed(0)}%`}
                  tone={((breakdown.want + breakdown.luxury) / totalCurrent) > 0.35 ? "warn" : "accent"}
                  note="Share of spend on wants + luxury."
                />
                <InsightCol
                  label="Emergency Runway"
                  value={`${emergencyMonths.toFixed(1)} mo`}
                  tone={emergencyMonths >= 6 ? "accent" : "warn"}
                  note={emergencyMonths >= 6 ? "Above 6-month safety threshold." : "Aim for 6 months of expenses."}
                />
              </div>
            </div>
            <div className="absolute right-[-10%] bottom-[-20%] size-96 bg-accent/10 blur-[100px] rounded-full" />
          </div>

          {/* Expense + Goal cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold">Expense Breakdown</h3>
                <span className="text-xs font-mono text-muted-foreground">This month</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative size-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-base font-bold">{formatINR(totalCurrent, { compact: true })}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span>{d.name}</span>
                      </div>
                      <span className="font-mono">{((d.value / totalCurrent) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-border">
                <Link to="/expenses" className="text-xs font-bold text-accent uppercase tracking-wider inline-flex items-center gap-1">
                  Open analyzer <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </Card>

            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold">Goal Progress</h3>
                <Link to="/goals" className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  All Goals
                </Link>
              </div>
              <div className="space-y-4">
                {state.goals.slice(0, 3).map((g) => {
                  const p = Math.min(1, g.saved / g.target);
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium truncate pr-2">{g.title}</span>
                        <span className="font-mono text-muted-foreground shrink-0">
                          {formatINR(g.saved, { compact: true })} / {formatINR(g.target, { compact: true })}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${p * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Cashflow trend */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">Cashflow Trend</h3>
              <div className="flex gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" />Income</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[hsl(22_90%_55%)]" />Expense</span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(158 55% 35%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(158 55% 35%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(22 90% 55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(22 90% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 12% / 0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(210 10% 45%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(210 10% 45%)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    contentStyle={{ background: "white", border: "1px solid hsl(210 20% 12% / 0.08)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => formatINR(v)}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(158 55% 35%)" strokeWidth={2} fill="url(#gInc)" />
                  <Area type="monotone" dataKey="expense" stroke="hsl(22 90% 55%)" strokeWidth={2} fill="url(#gExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Side */}
        <div className="xl:col-span-4 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="size-3.5 text-accent" />AI Suggestions</h3>
            </div>
            <ul className="space-y-3 text-xs">
              <Suggestion tone="accent" title="Boost SIP by ₹5,000">
                Your savings rate can hit 35% by redirecting subscription spend into an index fund SIP.
              </Suggestion>
              <Suggestion tone="warn" title="Trim luxury spend">
                Luxury spend is {((breakdown.luxury / totalCurrent) * 100).toFixed(0)}% this month. Cap at 10% to stay on track for the House goal.
              </Suggestion>
              <Suggestion tone="accent" title="Tax: use 80C headroom">
                An additional ₹40,000 in ELSS could reduce taxable income under 80C.
              </Suggestion>
            </ul>
          </Card>

          <Card>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-accent" /> Emergency Fund
            </h3>
            <div className="p-4 bg-accent-soft rounded-lg border border-accent/10">
              <p className="text-xs text-muted-foreground mb-1">Runway Protected</p>
              <p className="text-2xl font-bold font-mono tracking-tight">{emergencyMonths.toFixed(1)} Months</p>
              <p className="text-[10px] text-accent font-medium mt-1 uppercase tracking-wider">
                {emergencyMonths >= 6 ? "Fully Funded" : "Building"} · {formatINR(state.profile.currentSavings, { compact: true })}
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="size-3.5 text-accent" /> Quick Ask
            </h3>
            <div className="space-y-2">
              {["How can I save more?", "Explain 80C benefits", "Should I buy a car now?"].map((q) => (
                <Link
                  key={q}
                  to="/advisor"
                  search={{ q }}
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary hover:bg-accent-soft hover:text-accent transition-colors text-xs"
                >
                  <span>{q}</span>
                  <Send className="size-3" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-surface border border-border p-5 lg:p-6 rounded-xl">{children}</div>;
}

function KpiCard({ label, value, delta, note, progress, bars, delay = 0 }: {
  label: string; value: React.ReactNode; delta?: string; note?: string; progress?: number; bars?: number; delay?: number;
}) {
  return (
    <div className="bg-surface border border-border p-5 rounded-xl animate-enter" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <div className="mt-4">
        {progress !== undefined ? (
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </div>
        ) : bars !== undefined ? (
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${bars >= (i + 1) * 25 ? "bg-accent" : "bg-accent/20"}`}
              />
            ))}
          </div>
        ) : delta ? (
          <div className="flex items-center gap-2 text-[11px] text-accent font-medium">
            <span className="px-1.5 py-0.5 bg-accent/10 rounded">{delta}</span>
            {note ? <span className="text-muted-foreground">{note}</span> : null}
          </div>
        ) : note ? (
          <p className="text-[11px] text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </div>
  );
}

function InsightCol({ label, value, note, tone }: { label: string; value: string; note: string; tone: "accent" | "warn" }) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-[10px] opacity-60 uppercase mb-2 tracking-wider">{label}</p>
      <p className={`text-lg font-medium ${tone === "warn" ? "text-orange-400" : "text-accent"}`}>{value}</p>
      <p className="text-[10px] opacity-50 mt-1 leading-relaxed">{note}</p>
    </div>
  );
}

function Suggestion({ title, tone, children }: { title: string; tone: "accent" | "warn"; children: React.ReactNode }) {
  const color = tone === "accent" ? "bg-accent" : "bg-[hsl(22_90%_55%)]";
  return (
    <li className="flex gap-3">
      <span className={`size-1.5 rounded-full ${color} mt-1.5 shrink-0`} />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </li>
  );
}
