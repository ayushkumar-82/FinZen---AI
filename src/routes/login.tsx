import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authStore, useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In · FinPilot AI" },
      {
        name: "description",
        content:
          "Log in or create your FinPilot AI account to personalize your financial dashboard.",
      },
    ],
  }),
  component: LoginPage,
});

type Mode = "login" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, account } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign-up fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [dependents, setDependents] = useState("0");
  const [estimatedMonthlyExpenses, setEstimatedMonthlyExpenses] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [monthlyEmi, setMonthlyEmi] = useState("0");

  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && account) {
    return (
      <div className="p-4 lg:p-8 max-w-xl mx-auto">
        <div className="bg-surface border border-border rounded-xl p-8 text-center space-y-3">
          <div className="size-12 rounded-full bg-accent-soft flex items-center justify-center mx-auto text-accent">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-lg font-bold">You're already logged in</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {account.name} ({account.email})
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate({ to: "/" })}
              className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:brightness-110"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate({ to: "/profile" })}
              className="px-4 py-2 border border-border text-xs font-bold rounded-lg uppercase tracking-widest hover:bg-secondary"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = authStore.login(loginEmail, loginPassword);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Welcome back, ${res.account.name}!`);
    navigate({ to: "/" });
  };

  const submitSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const salary = parseFloat(monthlySalary);
    if (!name.trim()) {
      toast.error("Enter your name.");
      return;
    }
    if (!salary || salary <= 0) {
      toast.error("Enter a valid monthly income.");
      return;
    }
    setSubmitting(true);
    const res = authStore.signUp({
      name,
      email,
      password,
      age: age ? parseInt(age, 10) : undefined,
      profession: profession || undefined,
      monthlySalary: salary,
      dependents: parseInt(dependents, 10) || 0,
      estimatedMonthlyExpenses: parseFloat(estimatedMonthlyExpenses) || 0,
      currentSavings: parseFloat(currentSavings) || 0,
      monthlyEmi: parseFloat(monthlyEmi) || 0,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Welcome to FinPilot AI, ${res.account.name}!`);
    navigate({ to: "/" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "signup"
            ? "Tell us a bit about your finances so we can personalize your dashboard, Inflation Simulator, and House Planner."
            : "Log in to pick up right where you left off."}
        </p>
      </div>

      <div className="inline-flex bg-secondary rounded-lg p-1 text-xs font-bold uppercase tracking-widest">
        <button
          onClick={() => setMode("signup")}
          className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
            mode === "signup" ? "bg-surface shadow-sm text-foreground" : "text-muted-foreground"
          }`}
        >
          <UserPlus className="size-3.5" /> Sign Up
        </button>
        <button
          onClick={() => setMode("login")}
          className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
            mode === "login" ? "bg-surface shadow-sm text-foreground" : "text-muted-foreground"
          }`}
        >
          <LogIn className="size-3.5" /> Log In
        </button>
      </div>

      {mode === "login" ? (
        <form
          onSubmit={submitLogin}
          className="bg-surface border border-border rounded-xl p-6 space-y-3 max-w-md"
        >
          <Field label="Email">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-accent text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
          >
            <LogIn className="size-3.5" /> Log In
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            No account yet?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-accent font-semibold underline underline-offset-2"
            >
              Sign up
            </button>
          </p>
        </form>
      ) : (
        <form
          onSubmit={submitSignup}
          className="bg-surface border border-border rounded-xl p-6 space-y-6"
        >
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Nair"
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={inputCls}
                />
              </Field>
              <Field label="Age">
                <input
                  type="number"
                  min="0"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="29"
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Financial Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Working Profession">
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Software Engineer"
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
              <Field label="Monthly Income (₹)">
                <input
                  type="number"
                  min="0"
                  required
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  placeholder="145000"
                  className={inputCls}
                />
              </Field>
              <Field label="Avg. Monthly Expenses (₹)">
                <input
                  type="number"
                  min="0"
                  value={estimatedMonthlyExpenses}
                  onChange={(e) => setEstimatedMonthlyExpenses(e.target.value)}
                  placeholder="60000"
                  className={inputCls}
                />
              </Field>
              <Field label="Current Savings (₹)">
                <input
                  type="number"
                  min="0"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  placeholder="452000"
                  className={inputCls}
                />
              </Field>
              <Field label="Existing EMIs / Monthly Commitments (₹)">
                <input
                  type="number"
                  min="0"
                  value={monthlyEmi}
                  onChange={(e) => setMonthlyEmi(e.target.value)}
                  placeholder="18000"
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-accent text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
          >
            <UserPlus className="size-3.5" /> Create Account
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-accent font-semibold underline underline-offset-2"
            >
              Log in
            </button>
          </p>
          <p className="text-[10px] text-muted-foreground text-center">
            Demo app: your details are stored securely in this browser only, never sent to a server.
          </p>
        </form>
      )}
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
