import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, AlertTriangle, Wallet } from "lucide-react";
import { effectiveMonthlyExpenses, useFinance } from "@/lib/finance-store";
import { formatINR, pct } from "@/lib/format";

export const Route = createFileRoute("/planners/inflation")({
  head: () => ({
    meta: [
      { title: "Inflation Simulator · FinPilot AI" },
      {
        name: "description",
        content:
          "See how inflation erodes your purchasing power over time and what it means for your budget and goals.",
      },
      { property: "og:title", content: "Inflation Simulator · FinPilot AI" },
      {
        property: "og:description",
        content: "Simulate the future cost of goods and your purchasing power under inflation.",
      },
    ],
  }),
  component: InflationSimulator,
});

function InflationSimulator() {
  const state = useFinance();
  const baselineExpense = effectiveMonthlyExpenses(state);

  const [currentPrice, setCurrentPrice] = useState<number>(baselineExpense || 60000);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [years, setYears] = useState<number>(10);

  const result = useMemo(() => {
    const r = inflationRate / 100;
    const series = Array.from({ length: years + 1 }, (_, y) => {
      const futureCost = currentPrice * Math.pow(1 + r, y);
      // What ₹currentPrice-worth of *today's* money will actually be able to buy in year y
      const realValueOfToday = currentPrice / Math.pow(1 + r, y);
      return {
        year: `Yr ${y}`,
        cost: Math.round(futureCost),
        realValue: Math.round(realValueOfToday),
      };
    });
    const futureCost = series[series.length - 1].cost;
    const totalIncreasePct = currentPrice > 0 ? (futureCost - currentPrice) / currentPrice : 0;
    const requiredSalary = state.profile.monthlySalary * Math.pow(1 + r, years);
    const purchasingPowerLoss = 1 - 1 / Math.pow(1 + r, years);
    return { series, futureCost, totalIncreasePct, requiredSalary, purchasingPowerLoss };
  }, [currentPrice, inflationRate, years, state.profile.monthlySalary]);

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="size-5 text-accent" /> Inflation Simulator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          See how rising prices erode what your money can buy — and what it means for your income
          and goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold">Simulation Inputs</h3>

          <Field label="Current Price / Monthly Cost (₹)">
            <input
              type="number"
              min="0"
              value={currentPrice || ""}
              onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Defaulted to your average monthly expenses — edit to price a specific item or basket.
            </p>
          </Field>

          <Field label={`Annual Inflation Rate — ${inflationRate.toFixed(1)}%`}>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={inflationRate}
              onChange={(e) => setInflationRate(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
              <span>0%</span>
              <span>India avg ~5-7%</span>
              <span>20%</span>
            </div>
          </Field>

          <Field label={`Time Period — ${years} ${years === 1 ? "year" : "years"}`}>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value, 10))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
              <span>1yr</span>
              <span>30yr</span>
            </div>
          </Field>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ResultCard
              label={`Cost in ${years} yrs`}
              value={formatINR(result.futureCost, { compact: true })}
              note={`+${pct(result.totalIncreasePct, 0)} vs today`}
              tone="warn"
            />
            <ResultCard
              label="Purchasing Power Lost"
              value={pct(result.purchasingPowerLoss, 0)}
              note={`of today's ₹1 value, in ${years} yrs`}
              tone="warn"
            />
            <ResultCard
              label="Salary Needed to Keep Up"
              value={formatINR(result.requiredSalary, { compact: true })}
              note="per month, same lifestyle"
              tone="accent"
            />
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">Cost Over Time</h3>
              <div className="flex gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[hsl(22_90%_55%)]" />
                  Future cost
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-accent" />
                  Real value of today's ₹
                </span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={result.series}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(22 90% 55%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(22 90% 55%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(158 55% 35%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(158 55% 35%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 12% / 0.06)" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    stroke="hsl(210 10% 45%)"
                    interval={Math.max(0, Math.floor(years / 8))}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(210 10% 45%)"
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid hsl(210 20% 12% / 0.08)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatINR(v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="hsl(22 90% 55%)"
                    strokeWidth={2}
                    fill="url(#gCost)"
                  />
                  <Area
                    type="monotone"
                    dataKey="realValue"
                    stroke="hsl(158 55% 35%)"
                    strokeWidth={2}
                    fill="url(#gReal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-foreground text-background p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] font-mono tracking-[0.2em] text-accent uppercase">
                Personalized Insight
              </span>
              <p className="text-sm leading-relaxed">
                At {inflationRate.toFixed(1)}% average inflation, what costs{" "}
                {formatINR(currentPrice)} today will cost{" "}
                <span className="font-bold text-accent">{formatINR(result.futureCost)}</span> in{" "}
                {years} years — a {pct(result.totalIncreasePct, 0)} increase. To maintain your
                current lifestyle on a {formatINR(state.profile.monthlySalary, { compact: true })}
                /month income, you'd need to be earning about{" "}
                <span className="font-bold text-accent">
                  {formatINR(result.requiredSalary, { compact: true })}/month
                </span>{" "}
                by then — roughly{" "}
                {pct(result.requiredSalary / Math.max(1, state.profile.monthlySalary) - 1, 0)} more
                than today.
              </p>
              <div className="flex items-start gap-2 pt-2 border-t border-white/10 text-xs opacity-80">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-orange-400" />
                <span>
                  Factor this into salary negotiations, SIP step-ups, and long-term goal targets
                  (like the House Planner).
                </span>
              </div>
            </div>
            <div className="absolute right-[-10%] bottom-[-20%] size-80 bg-accent/10 blur-[100px] rounded-full" />
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 flex items-start gap-3">
            <Wallet className="size-4 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This baseline currently uses your{" "}
              <span className="text-foreground font-medium">
                {effectiveMonthlyExpenses(state) > 0
                  ? "logged / estimated monthly expenses"
                  : "salary-based estimate"}
              </span>{" "}
              of {formatINR(baselineExpense, { compact: true })}. Update the price field above to
              model a specific goal or purchase instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "accent" | "warn";
}) {
  return (
    <div className="bg-surface border border-border p-5 rounded-xl">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`text-2xl font-bold tracking-tight ${tone === "warn" ? "text-orange-500" : "text-accent"}`}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-2">{note}</p>
    </div>
  );
}
