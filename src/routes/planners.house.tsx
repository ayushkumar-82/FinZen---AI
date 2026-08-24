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
  ReferenceLine,
} from "recharts";
import { Home, CheckCircle2, Clock, Landmark } from "lucide-react";
import { effectiveMonthlyExpenses, monthlySurplus, useFinance } from "@/lib/finance-store";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/planners/house")({
  head: () => ({
    meta: [
      { title: "House Planner · FinPilot AI" },
      {
        name: "description",
        content:
          "Find out when you can realistically afford a house: EMI estimates, affordable budget, and a savings timeline.",
      },
      { property: "og:title", content: "House Planner · FinPilot AI" },
      {
        property: "og:description",
        content: "Plan your home purchase with a personalized EMI and readiness timeline.",
      },
    ],
  }),
  component: HousePlanner,
});

/** Standard reducing-balance EMI formula. */
function calcEmi(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

/** Reverse of calcEmi: how much can be borrowed for a given monthly payment budget. */
function affordableLoan(emiBudget: number, annualRatePct: number, months: number): number {
  if (emiBudget <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return emiBudget * months;
  const factor = Math.pow(1 + r, months);
  return (emiBudget * (factor - 1)) / (r * factor);
}

function HousePlanner() {
  const state = useFinance();
  const surplus = monthlySurplus(state);
  const expenses = effectiveMonthlyExpenses(state);

  const [housePrice, setHousePrice] = useState<number>(6000000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  const result = useMemo(() => {
    const downPayment = housePrice * (downPaymentPct / 100);
    const loanAmount = Math.max(0, housePrice - downPayment);
    const months = tenureYears * 12;
    const emi = calcEmi(loanAmount, interestRate, months);

    // Common lender/affordability rule of thumb: total EMI obligations shouldn't exceed
    // ~40% of gross monthly income.
    const maxTotalEmi = state.profile.monthlySalary * 0.4;
    const maxAdditionalEmi = Math.max(0, maxTotalEmi - state.profile.monthlyEmi);
    const emiAffordable = emi <= maxAdditionalEmi;

    const affordableLoanAmt = affordableLoan(maxAdditionalEmi, interestRate, months);
    const affordableHousePrice =
      downPaymentPct < 100 ? affordableLoanAmt / (1 - downPaymentPct / 100) : affordableLoanAmt;

    // Timeline to save the required down payment, assuming the user channels their
    // current monthly surplus toward it.
    const shortfall = Math.max(0, downPayment - state.profile.currentSavings);
    const monthsToSaveDownPayment = surplus > 0 ? Math.ceil(shortfall / surplus) : Infinity;

    // Build a savings-growth projection for the chart (down payment target line vs. projected savings).
    const projectionMonths = Math.min(
      120,
      Math.max(12, isFinite(monthsToSaveDownPayment) ? monthsToSaveDownPayment + 6 : 36),
    );
    const series = Array.from({ length: Math.floor(projectionMonths / 3) + 1 }, (_, i) => {
      const m = i * 3;
      const projected = state.profile.currentSavings + surplus * m;
      return { month: `M${m}`, savings: Math.round(projected), target: Math.round(downPayment) };
    });

    const ready = shortfall === 0 && emiAffordable;

    return {
      downPayment,
      loanAmount,
      months,
      emi,
      maxTotalEmi,
      maxAdditionalEmi,
      emiAffordable,
      affordableHousePrice,
      monthsToSaveDownPayment,
      series,
      ready,
      shortfall,
    };
  }, [
    housePrice,
    downPaymentPct,
    interestRate,
    tenureYears,
    state.profile.monthlySalary,
    state.profile.monthlyEmi,
    state.profile.currentSavings,
    surplus,
  ]);

  const yearsToSave = result.monthsToSaveDownPayment / 12;

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Home className="size-5 text-accent" /> House Planner
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estimate your EMI, an affordable budget, and when you'll realistically be ready to buy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold">House & Loan Details</h3>

          <Field label="Expected House Price (₹)">
            <input
              type="number"
              min="0"
              value={housePrice || ""}
              onChange={(e) => setHousePrice(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>

          <Field
            label={`Down Payment — ${downPaymentPct}% (${formatINR((housePrice * downPaymentPct) / 100, { compact: true })})`}
          >
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </Field>

          <Field label={`Interest Rate — ${interestRate.toFixed(1)}%`}>
            <input
              type="range"
              min="5"
              max="15"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </Field>

          <Field label={`Loan Tenure — ${tenureYears} years`}>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(parseInt(e.target.value, 10))}
              className="w-full accent-accent"
            />
          </Field>

          <div className="pt-3 border-t border-border text-[11px] text-muted-foreground space-y-1">
            <p>
              Loan amount:{" "}
              <span className="font-mono text-foreground">
                {formatINR(result.loanAmount, { compact: true })}
              </span>
            </p>
            <p>
              Your monthly surplus:{" "}
              <span className="font-mono text-foreground">
                {formatINR(surplus, { compact: true })}
              </span>
            </p>
            <p>
              Monthly expenses used:{" "}
              <span className="font-mono text-foreground">
                {formatINR(expenses, { compact: true })}
              </span>
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ResultCard
              label="Estimated EMI"
              value={formatINR(result.emi, { compact: true })}
              note={result.emiAffordable ? "Within recommended budget" : "Above recommended budget"}
              tone={result.emiAffordable ? "accent" : "warn"}
            />
            <ResultCard
              label="Down Payment Needed"
              value={formatINR(result.downPayment, { compact: true })}
              note={
                result.shortfall > 0
                  ? `${formatINR(result.shortfall, { compact: true })} more to save`
                  : "Already covered by savings"
              }
              tone={result.shortfall > 0 ? "warn" : "accent"}
            />
            <ResultCard
              label="Affordable House Budget"
              value={formatINR(result.affordableHousePrice, { compact: true })}
              note="Based on your income & EMI capacity"
              tone="accent"
            />
          </div>

          {/* Readiness banner */}
          <div
            className={`rounded-2xl p-6 flex items-start gap-4 ${result.ready ? "bg-accent-soft border border-accent/20" : "bg-foreground text-background"}`}
          >
            {result.ready ? (
              <CheckCircle2 className="size-6 text-accent shrink-0 mt-0.5" />
            ) : (
              <Clock className="size-6 text-accent shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className={`text-sm font-bold ${result.ready ? "text-accent" : ""}`}>
                {result.ready
                  ? "You're financially ready for this house today."
                  : result.monthsToSaveDownPayment === Infinity
                    ? "Increase your monthly surplus to start building toward this down payment."
                    : `You'll likely be ready in about ${result.monthsToSaveDownPayment} months (~${yearsToSave.toFixed(1)} years).`}
              </p>
              <p
                className={`text-xs leading-relaxed ${result.ready ? "text-accent/80" : "opacity-70"}`}
              >
                {result.emiAffordable
                  ? `Your estimated EMI of ${formatINR(result.emi, { compact: true })} fits within the recommended ${formatINR(result.maxAdditionalEmi, { compact: true })}/month capacity (≤40% of income, net of existing EMIs).`
                  : `Your estimated EMI of ${formatINR(result.emi, { compact: true })} exceeds the recommended ${formatINR(result.maxAdditionalEmi, { compact: true })}/month capacity. Consider a longer tenure, larger down payment, or a house closer to ${formatINR(result.affordableHousePrice, { compact: true })}.`}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">Down Payment Savings Timeline</h3>
              <div className="flex gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-accent" />
                  Projected savings
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[hsl(22_90%_55%)]" />
                  Target
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={result.series}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gSave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(158 55% 35%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(158 55% 35%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 12% / 0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(210 10% 45%)" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(210 10% 45%)"
                    tickFormatter={(v) => `${Math.round(v / 100000)}L`}
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
                  <ReferenceLine
                    y={result.downPayment}
                    stroke="hsl(22 90% 55%)"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="hsl(158 55% 35%)"
                    strokeWidth={2}
                    fill="url(#gSave)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 flex items-start gap-3">
            <Landmark className="size-4 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Calculations use your current profile:{" "}
              {formatINR(state.profile.monthlySalary, { compact: true })}/month income,{" "}
              {formatINR(state.profile.monthlyEmi, { compact: true })} existing EMI,{" "}
              {state.profile.dependents} dependent(s), and{" "}
              {formatINR(state.profile.currentSavings, { compact: true })} in current savings.
              Update these anytime from your{" "}
              <span className="text-foreground font-medium">Profile</span> page for a more accurate
              plan.
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
