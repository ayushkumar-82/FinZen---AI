import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { chatWithAdvisor } from "@/lib/chat.functions";
import { monthlyExpenseTotal, useFinance } from "@/lib/finance-store";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/advisor")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "AI Advisor · FinPilot AI" },
      {
        name: "description",
        content:
          "Chat with a personal AI financial advisor for budgeting, taxes, investments, and goals.",
      },
      { property: "og:title", content: "AI Advisor · FinPilot AI" },
      { property: "og:description", content: "Chat with a personal AI financial advisor." },
    ],
  }),
  component: AdvisorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How can I save more each month?",
  "Explain the 80C tax benefits.",
  "Should I choose the old or new tax regime?",
  "How much emergency fund do I need?",
  "Give me a plan for my house downpayment.",
  "Which investments suit a 30-year-old?",
];

function AdvisorPage() {
  const state = useFinance();
  const search = useSearch({ from: "/advisor" });
  const chat = useServerFn(chatWithAdvisor);
  const firstName = state.profile.name.split(" ")[0] || "there";
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hi ${firstName} — I'm **FinPilot AI**. I can help with budgeting, taxes, investments, EMIs, and goal planning. Ask me anything, or tap a suggestion below.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const monthlyExp = monthlyExpenseTotal(state.expenses);
      const context = `Name: ${state.profile.name}. Age: ${state.profile.age ?? "unknown"}. Profession: ${state.profile.profession ?? "unknown"}. Monthly salary: ${formatINR(state.profile.monthlySalary)}. Monthly expenses: ${formatINR(monthlyExp)}. Monthly EMI: ${formatINR(state.profile.monthlyEmi)}. Current savings: ${formatINR(state.profile.currentSavings)}. Dependents: ${state.profile.dependents}. Currency: INR.\nGoals: ${state.goals.map((g) => `${g.title} (${formatINR(g.saved)}/${formatINR(g.target)} by ${g.targetDate})`).join("; ")}.`;
      const res = await chat({ data: { messages: next, financialContext: context } });
      setMessages((m) => [...m, { role: "assistant", content: res.text }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI advisor unavailable.";
      toast.error(msg);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `_Sorry, I couldn't respond right now: ${msg}_` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search.q && !sentInitial.current) {
      sentInitial.current = true;
      send(search.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.q]);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="size-5 text-accent" /> AI Advisor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalized guidance grounded in your finances.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}
        {loading ? (
          <div className="flex gap-2 items-center px-4 py-3 text-xs text-muted-foreground">
            <span className="size-1.5 bg-accent rounded-full animate-pulse [animation-delay:0ms]" />
            <span className="size-1.5 bg-accent rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="size-1.5 bg-accent rounded-full animate-pulse [animation-delay:300ms]" />
            <span>FinPilot is thinking…</span>
          </div>
        ) : null}
      </div>

      {messages.length <= 2 ? (
        <div className="flex flex-wrap gap-2 mt-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="px-3 py-1.5 rounded-full text-xs bg-secondary hover:bg-accent-soft hover:text-accent transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-center gap-2 bg-surface border border-border rounded-xl p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about budgets, taxes, investments…"
          className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 disabled:opacity-50 uppercase tracking-widest"
        >
          <Send className="size-3.5" /> Send
        </button>
      </form>
    </div>
  );
}

function Message({ role, content }: Msg) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-accent text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%] text-sm leading-relaxed">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="size-8 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
        <Sparkles className="size-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0 text-sm leading-relaxed">
        <div className="prose prose-sm max-w-none prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-a:text-accent">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
