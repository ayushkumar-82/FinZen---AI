import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, Save, UserCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { financeStore, useFinance } from "@/lib/finance-store";
import { authStore, useAuth } from "@/lib/auth-store";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · FinPilot AI" },
      {
        name: "description",
        content: "Manage your financial profile: income, expenses, savings, and family details.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, account } = useAuth();
  const state = useFinance();
  const p = state.profile;

  const [name, setName] = useState(p.name);
  const [age, setAge] = useState(p.age?.toString() ?? "");
  const [profession, setProfession] = useState(p.profession ?? "");
  const [monthlySalary, setMonthlySalary] = useState(p.monthlySalary.toString());
  const [dependents, setDependents] = useState(p.dependents.toString());
  const [estimatedMonthlyExpenses, setEstimatedMonthlyExpenses] = useState(
    (p.estimatedMonthlyExpenses ?? 0).toString(),
  );
  const [currentSavings, setCurrentSavings] = useState(p.currentSavings.toString());
  const [monthlyEmi, setMonthlyEmi] = useState(p.monthlyEmi.toString());

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name can't be empty.");
      return;
    }
    const salary = parseFloat(monthlySalary);
    if (!salary || salary <= 0) {
      toast.error("Enter a valid monthly income.");
      return;
    }
    financeStore.updateProfile({
      name: name.trim(),
      age: age ? parseInt(age, 10) : undefined,
      profession: profession || undefined,
      monthlySalary: salary,
      dependents: parseInt(dependents, 10) || 0,
      estimatedMonthlyExpenses: parseFloat(estimatedMonthlyExpenses) || 0,
      currentSavings: parseFloat(currentSavings) || 0,
      monthlyEmi: parseFloat(monthlyEmi) || 0,
    });
    toast.success("Profile updated");
  };

  const logout = () => {
    authStore.logout();
    toast.success("Logged out");
    navigate({ to: "/login" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCircle className="size-6 text-accent" /> Your Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            This information personalizes your dashboard, Inflation Simulator, and House Planner.
          </p>
        </div>
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-border text-xs font-bold rounded-lg uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          >
            <LogOut className="size-3.5" /> Log Out
          </button>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:brightness-110"
          >
            <LogIn className="size-3.5" /> Log In / Sign Up
          </Link>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="bg-accent-soft border border-accent/20 rounded-xl p-4 text-xs text-accent">
          You're browsing with sample demo data. Log in or create an account to save your own
          financial profile.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="size-12 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-lg shrink-0">
            {account?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold">{account?.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{account?.email}</p>
          </div>
        </div>
      )}

      <form onSubmit={save} className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Personal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full Name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Age">
              <input
                type="number"
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Working Profession">
              <input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Family Members / Dependents">
              <input
                type="number"
                min="0"
                value={dependents}
                onChange={(e) => setDependents(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Financial Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Monthly Income (₹)">
              <input
                type="number"
                min="0"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Avg. Monthly Expenses (₹)">
              <input
                type="number"
                min="0"
                value={estimatedMonthlyExpenses}
                onChange={(e) => setEstimatedMonthlyExpenses(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Current Savings (₹)">
              <input
                type="number"
                min="0"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Existing EMIs / Monthly Commitments (₹)">
              <input
                type="number"
                min="0"
                value={monthlyEmi}
                onChange={(e) => setMonthlyEmi(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Currently tracked spend this month from Expense Analyzer:{" "}
            <span className="font-mono text-foreground">
              {formatINR(state.expenses.reduce((s, e) => s + e.amount, 0))}
            </span>
          </p>
        </section>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 bg-accent text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:brightness-110"
        >
          <Save className="size-3.5" /> Save Changes
        </button>
      </form>
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
