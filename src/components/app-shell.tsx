import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  Target,
  Sparkles,
  TrendingUp,
  Home as HomeIcon,
  PiggyBank,
  Bell,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-store";

const navGroups = [
  {
    label: "Analysis",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/expenses", label: "Expense Analyzer", icon: Wallet },
      { to: "/goals", label: "Goals", icon: Target },
      { to: "/advisor", label: "AI Advisor", icon: Sparkles },
    ],
  },
  {
    label: "Planners",
    items: [
      { to: "/planners/inflation", label: "Inflation Sim", icon: TrendingUp },
      { to: "/planners/house", label: "House Planner", icon: HomeIcon },
      { to: "/planners/retirement", label: "Retirement", icon: PiggyBank, disabled: true },
    ],
  },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-surface z-40 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="size-9 bg-foreground rounded-lg flex items-center justify-center">
            <div className="size-3 bg-accent rounded-full animate-pulse" />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight text-lg">FinPilot AI</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Wealth OS
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                const cls = `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                } ${"disabled" in item && item.disabled ? "opacity-40 pointer-events-none" : ""}`;
                return (
                  <Link key={item.to} to={item.to as "/"} className={cls}>
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    {"disabled" in item && item.disabled ? (
                      <span className="ml-auto text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                        soon
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-border">
          <UserCard />
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <h1 className="text-sm font-semibold text-muted-foreground">Wealth Overview</h1>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-accent">
              <span className="size-1.5 rounded-full bg-accent animate-pulse-line" />
              AI ENGINE: ACTIVE
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ask AI or search..."
                className="bg-background border border-border rounded-full py-1.5 pl-9 pr-4 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <button className="size-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
              <Bell className="size-3.5" />
            </button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

function UserCard() {
  const { isAuthenticated, account } = useAuth();

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-3 px-3 py-2 bg-foreground text-background rounded-lg hover:brightness-125 transition-all"
      >
        <div className="size-9 rounded-full bg-accent/30 flex items-center justify-center text-accent font-bold text-sm">
          ?
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">Guest · Demo Data</p>
          <p className="text-[10px] opacity-60 font-mono">LOG IN / SIGN UP</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/profile"
      className="flex items-center gap-3 px-3 py-2 bg-foreground text-background rounded-lg hover:brightness-125 transition-all"
    >
      <div className="size-9 rounded-full bg-accent/30 flex items-center justify-center text-accent font-bold text-sm">
        {account?.name.charAt(0).toUpperCase() ?? "U"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{account?.name}</p>
        <p className="text-[10px] opacity-60 font-mono">PRO PLAN</p>
      </div>
    </Link>
  );
}
