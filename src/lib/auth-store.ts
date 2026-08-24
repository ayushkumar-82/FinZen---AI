import { useSyncExternalStore } from "react";
import { financeStore } from "./finance-store";

/**
 * Lightweight client-side auth for this demo app. There is no backend database here —
 * accounts and sessions are persisted to localStorage, same pattern as `finance-store.ts`.
 * This is intentionally simple (not production-grade security) but gives a fully functional
 * sign-up / login / logout flow that gates and personalizes the app.
 */

export type Account = {
  id: string;
  name: string;
  email: string;
  password: string; // demo only — never store plaintext passwords in a real app
  createdAt: string;
};

type AuthState = {
  currentUserId: string | null;
};

const ACCOUNTS_KEY = "finpilot.accounts.v1";
const SESSION_KEY = "finpilot.session.v1";

function loadAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

function persistAccounts(accounts: Account[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* ignore quota errors */
  }
}

function loadSession(): AuthState {
  if (typeof window === "undefined") return { currentUserId: null };
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : { currentUserId: null };
  } catch {
    return { currentUserId: null };
  }
}

function persistSession(s: AuthState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

let accounts: Account[] = loadAccounts();
let session: AuthState = loadSession();
const listeners = new Set<() => void>();

function emit() {
  persistAccounts(accounts);
  persistSession(session);
  listeners.forEach((l) => l());
}

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  age?: number;
  profession?: string;
  monthlySalary: number;
  dependents: number;
  estimatedMonthlyExpenses: number;
  currentSavings: number;
  monthlyEmi: number;
};

export const authStore = {
  get: () => session,
  getAccounts: () => accounts,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  signUp(input: SignUpInput): { ok: true; account: Account } | { ok: false; error: string } {
    const email = input.email.trim().toLowerCase();
    if (!input.name.trim()) return { ok: false, error: "Enter your name." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, error: "Enter a valid email address." };
    if (input.password.length < 6)
      return { ok: false, error: "Password must be at least 6 characters." };
    if (accounts.some((a) => a.email === email)) {
      return {
        ok: false,
        error: "An account with this email already exists. Try logging in instead.",
      };
    }
    const account: Account = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email,
      password: input.password,
      createdAt: new Date().toISOString(),
    };
    accounts = [...accounts, account];
    session = { currentUserId: account.id };
    emit();

    // Personalize the finance profile with what they entered at sign-up.
    financeStore.updateProfile({
      name: account.name,
      email: account.email,
      age: input.age,
      profession: input.profession,
      monthlySalary: input.monthlySalary,
      dependents: input.dependents,
      estimatedMonthlyExpenses: input.estimatedMonthlyExpenses,
      currentSavings: input.currentSavings,
      monthlyEmi: input.monthlyEmi,
    });

    return { ok: true, account };
  },

  login(
    email: string,
    password: string,
  ): { ok: true; account: Account } | { ok: false; error: string } {
    const normalized = email.trim().toLowerCase();
    const account = accounts.find((a) => a.email === normalized);
    if (!account || account.password !== password) {
      return { ok: false, error: "Incorrect email or password." };
    }
    session = { currentUserId: account.id };
    emit();
    financeStore.updateProfile({ name: account.name, email: account.email });
    return { ok: true, account };
  },

  logout() {
    session = { currentUserId: null };
    emit();
  },
};

export function useAuth(): { isAuthenticated: boolean; account: Account | null } {
  const s = useSyncExternalStore(
    (cb) => authStore.subscribe(cb),
    () => authStore.get(),
    () => ({ currentUserId: null }) as AuthState,
  );
  const account = s.currentUserId ? (accounts.find((a) => a.id === s.currentUserId) ?? null) : null;
  return { isAuthenticated: !!account, account };
}
