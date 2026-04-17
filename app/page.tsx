import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Activity, Search, Sparkles, Scale, Shield } from "lucide-react";

const features: {
  icon: typeof Scale;
  title: string;
  body: string;
  href: Route;
}[] = [
  {
    icon: Scale,
    title: "Cross-venue arbitrage",
    body: "Scan Polymarket and Kalshi for the same event trading at different prices. Fee-adjusted edge, sortable by ROI.",
    href: "/arbitrage",
  },
  {
    icon: Search,
    title: "Unified market search",
    body: "One search box across every venue. Filter by category, volume, liquidity, and resolution date.",
    href: "/markets",
  },
  {
    icon: Sparkles,
    title: "AI research briefs",
    body: "On-demand Claude-powered briefs with base rates, catalysts, expert forecasts, and counterarguments.",
    href: "/markets",
  },
  {
    icon: Shield,
    title: "Guaranteed profit scanner",
    body: "Buy all outcomes of an event for less than the $1 payout. Multi-outcome dutching across any category.",
    href: "/guaranteed" as Route,
  },
  {
    icon: Activity,
    title: "Whale & news alerts",
    body: "Track large on-chain Polymarket bets and news that move markets. (Phase 2)",
    href: "/markets",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      <section className="space-y-7 pt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-soft-2)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent-strong)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)]" />
          MVP — arbitrage scanner & AI research briefs live
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          A Bloomberg Terminal for{" "}
          <span className="text-[var(--color-accent)]">prediction markets</span>
          .
        </h1>
        <p className="max-w-2xl text-lg text-[var(--color-muted)]">
          Aggregate Polymarket and Kalshi in real time. Spot cross-venue
          arbitrage, generate AI research briefs on any market, and place
          smarter bets — you stay in control.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/arbitrage"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-card)] transition hover:bg-[var(--color-accent-hover)]"
          >
            Open arbitrage scanner <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--color-surface-2)]"
          >
            Browse markets
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--color-accent-soft-2)] hover:shadow-[var(--shadow-card-lg)]"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-[var(--color-muted)]">{f.body}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
