import Link from "next/link";
import { ArrowRight, Activity, Search, Sparkles, Scale } from "lucide-react";

const features = [
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
    icon: Activity,
    title: "Whale & news alerts",
    body: "Track large on-chain Polymarket bets and news that move markets. (Phase 2)",
    href: "/markets",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)]" />
          MVP — arbitrage scanner live
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight">
          A Bloomberg Terminal for{" "}
          <span className="text-[var(--color-accent)]">
            prediction markets
          </span>
          .
        </h1>
        <p className="max-w-2xl text-lg text-[var(--color-muted)]">
          Aggregate Polymarket and Kalshi in real time. Spot cross-venue
          arbitrage, generate AI research briefs, and place smarter bets — you
          stay in control.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/arbitrage"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Open arbitrage scanner <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface-2)]"
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
              href={f.href as never}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
            >
              <Icon className="mb-4 h-5 w-5 text-[var(--color-accent)]" />
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-[var(--color-muted)]">{f.body}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
