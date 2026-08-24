import { useSyncExternalStore } from "react";

export type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string; // ISO
  note?: string;
  classification?: "need" | "want" | "luxury";
};

export type Goal = {
  id: string;
  title: string;
  target: number;
  saved: number;
  targetDate: string;
  priority: "low" | "medium" | "high";
};

export type FinanceState = {
  profile: {
    name: string;
    monthlySalary: number;
    currency: string;
    currentSavings: number;
    monthlyEmi: number;
    dependents: number;
    // Extended profile (collected during sign-up / editable from Profile page)
    age?: number;
    profession?: string;
    email?: string;
    /** Self-reported average monthly expenses, used as a fallback baseline for planners
     *  when the itemized expense tracker doesn't have enough history. */
    estimatedMonthlyExpenses?: number;
  };
  expenses: Expense[];
  goals: Goal[];
};

const STORAGE_KEY = "finpilot.state.v1";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function localDateISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const EXPENSE_CATEGORIES = [
  { key: "Food", classification: "need" },
  { key: "Rent", classification: "need" },
  { key: "Electricity", classification: "need" },
  { key: "Internet", classification: "need" },
  { key: "Fuel", classification: "need" },
  { key: "Transport", classification: "need" },
  { key: "Medical", classification: "need" },
  { key: "Education", classification: "need" },
  { key: "Insurance", classification: "need" },
  { key: "Investments", classification: "need" },
  { key: "Entertainment", classification: "want" },
  { key: "Shopping", classification: "want" },
  { key: "Subscriptions", classification: "want" },
  { key: "Travel", classification: "luxury" },
  { key: "Miscellaneous", classification: "want" },
] as const;

const seed = (): FinanceState => {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  return {
    profile: {
      name: "Rohan Sharma",
      monthlySalary: 145000,
      currency: "INR",
      currentSavings: 452000,
      monthlyEmi: 18000,
      dependents: 1,
      age: 29,
      profession: "Software Engineer",
      email: "",
      estimatedMonthlyExpenses: 0,
    },
    expenses: [
      { id: "e1", category: "Rent", amount: 32000, date: daysAgo(2), classification: "need" },
      { id: "e2", category: "Food", amount: 8400, date: daysAgo(4), classification: "need" },
      {
        id: "e3",
        category: "Entertainment",
        amount: 3200,
        date: daysAgo(6),
        classification: "want",
      },
      { id: "e4", category: "Shopping", amount: 6800, date: daysAgo(9), classification: "want" },
      { id: "e5", category: "Fuel", amount: 4200, date: daysAgo(11), classification: "need" },
      {
        id: "e6",
        category: "Subscriptions",
        amount: 1899,
        date: daysAgo(14),
        classification: "want",
      },
      { id: "e7", category: "Travel", amount: 12500, date: daysAgo(18), classification: "luxury" },
      { id: "e8", category: "Medical", amount: 2400, date: daysAgo(22), classification: "need" },
      {
        id: "e9",
        category: "Investments",
        amount: 15000,
        date: daysAgo(25),
        classification: "need",
      },
      { id: "e10", category: "Internet", amount: 999, date: daysAgo(27), classification: "need" },
    ],
    goals: [
      {
        id: "g1",
        title: "House Downpayment",
        target: 2500000,
        saved: 1200000,
        targetDate: "2027-03-01",
        priority: "high",
      },
      {
        id: "g2",
        title: "European Summer '25",
        target: 600000,
        saved: 410000,
        targetDate: "2025-06-01",
        priority: "medium",
      },
      {
        id: "g3",
        title: "Emergency Fund",
        target: 840000,
        saved: 840000,
        targetDate: "2024-12-01",
        priority: "high",
      },
      {
        id: "g4",
        title: "New MacBook Pro",
        target: 250000,
        saved: 90000,
        targetDate: "2025-09-01",
        priority: "low",
      },
    ],
  };
};

let state: FinanceState = load();
const listeners = new Set<() => void>();

function load(): FinanceState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as FinanceState;
  } catch {
    return seed();
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const financeStore = {
  get: () => state,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  update: (mut: (s: FinanceState) => FinanceState) => {
    state = mut(state);
    emit();
  },
  addExpense: (e: Omit<Expense, "id">) => {
    state = { ...state, expenses: [{ ...e, id: createId("expense") }, ...state.expenses] };
    emit();
  },
  removeExpense: (id: string) => {
    state = { ...state, expenses: state.expenses.filter((x) => x.id !== id) };
    emit();
  },
  addGoal: (g: Omit<Goal, "id">) => {
    state = { ...state, goals: [...state.goals, { ...g, id: createId("goal") }] };
    emit();
  },
  updateGoal: (id: string, patch: Partial<Goal>) => {
    state = { ...state, goals: state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) };
    emit();
  },
  removeGoal: (id: string) => {
    state = { ...state, goals: state.goals.filter((g) => g.id !== id) };
    emit();
  },
  updateProfile: (patch: Partial<FinanceState["profile"]>) => {
    state = { ...state, profile: { ...state.profile, ...patch } };
    emit();
  },
  reset: () => {
    state = seed();
    emit();
  },
};

export function useFinance(): FinanceState {
  return useSyncExternalStore(
    (cb) => financeStore.subscribe(cb),
    () => financeStore.get(),
    () => seed(),
  );
}

// Derived helpers
export function monthlyExpenseTotal(expenses: Expense[]): number {
  const now = new Date();
  const m = now.getMonth(),
    y = now.getFullYear();
  return expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === m && d.getFullYear() === y;
    })
    .reduce((s, e) => s + e.amount, 0);
}

/** Best-available monthly expense figure: real logged expenses for the current month,
 *  falling back to the user's self-reported estimate from their profile, then to a
 *  conservative 55% of salary so planners still produce sane numbers for brand-new users. */
export function effectiveMonthlyExpenses(s: FinanceState): number {
  const logged = monthlyExpenseTotal(s.expenses);
  if (logged > 0) return logged;
  if (s.profile.estimatedMonthlyExpenses && s.profile.estimatedMonthlyExpenses > 0) {
    return s.profile.estimatedMonthlyExpenses;
  }
  return Math.round(s.profile.monthlySalary * 0.55);
}

/** Money left over each month after expenses and existing EMI/commitments. Never negative. */
export function monthlySurplus(s: FinanceState): number {
  const exp = effectiveMonthlyExpenses(s);
  return Math.max(0, s.profile.monthlySalary - exp - s.profile.monthlyEmi);
}

/** Actual cash left from this month's entered income after logged expenses and EMI. */
export function monthlyCashLeft(s: FinanceState): number {
  return s.profile.monthlySalary - monthlyExpenseTotal(s.expenses) - s.profile.monthlyEmi;
}

export function classify(category: string): "need" | "want" | "luxury" {
  const found = EXPENSE_CATEGORIES.find((c) => c.key === category);
  return (found?.classification ?? "want") as "need" | "want" | "luxury";
}

export function computeFinancialHealth(s: FinanceState): number {
  const monthlyExp = monthlyExpenseTotal(s.expenses);
  const savingsRate =
    s.profile.monthlySalary > 0
      ? Math.max(0, (s.profile.monthlySalary - monthlyExp) / s.profile.monthlySalary)
      : 0;
  const emergencyMonths = monthlyExp > 0 ? s.profile.currentSavings / monthlyExp : 12;
  const debtRatio =
    s.profile.monthlySalary > 0 ? s.profile.monthlyEmi / s.profile.monthlySalary : 0;
  const score =
    Math.min(35, savingsRate * 70) +
    Math.min(30, emergencyMonths * 5) +
    Math.min(20, (1 - Math.min(1, debtRatio / 0.4)) * 20) +
    15;
  return Math.round(Math.max(0, Math.min(100, score)));
}
