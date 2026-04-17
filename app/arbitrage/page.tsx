import { ExternalLink, ArrowRight, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { ErrorBanner } from "@/components/error-banner";
import { VenueBadge } from "@/components/venue-badge";
import { findArbitrage } from "@/lib/arbitrage";
import { fetchAllMarkets } from "@/lib/markets";
import { researchHrefFor } from "@/lib/research-url";
import type { UnifiedMarket } from "@/lib/types";
import { formatPct, formatPrice } from "@/lib/utils";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function ArbitragePage() {
  const { markets, errors } = await fetchAllMarkets({ limit: 300 });
  const opps = findArbitrage(markets, {
    minMatchScore: 0.45,
    minNetEdge: 0.005,
  }).slice(0, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Arbitrage scanner
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
          Cross-venue opportunities where buying YES on one venue and NO on
          another locks in a guaranteed payout. Edges are net of estimated
          fees. Match score is a Jaccard token-similarity heuristic — verify
          both markets describe the same event before trading.
        </p>
      </div>

      <Link
        href="/guaranteed"
        className="flex items-center gap-2 rounded-lg border border-[var(--color-accent-soft-2)] bg-[var(--color-accent-soft)] px-4 py-2.5 text-sm text-[var(--color-accent-strong)] hover:bg-[var(--color-accent-soft-2)]"
      >
        <Shield className="h-4 w-4" />
        Looking for multi-outcome opportunities? Try the Dutch Scanner →
      </Link>

      <ErrorBanner errors={errors} />

      <div className="flex flex-wrap gap-3 text-xs">
        <Stat label="Markets scanned" value={markets.length.toLocaleString()} />
        <Stat label="Opportunities" value={opps.length.toString()} />
        <Stat
          label="Best edge"
          value={opps.length ? formatPct(opps[0].netEdge) : "—"}
          accent={opps.length > 0}
        />
        <Stat
          label="Best ROI"
          value={
            opps.length
              ? formatPct(Math.max(...opps.map((o) => o.roi)))
              : "—"
          }
          accent={opps.length > 0}
        />
      </div>

      <div className="space-y-3">
        {opps.length === 0 && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-muted)] shadow-[var(--shadow-card)]">
            No arbitrage found above the current thresholds. Markets are
            efficient most of the time — try refreshing during a news event,
            or lower the matching threshold.
          </div>
        )}
        {opps.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--color-accent-soft-2)] hover:shadow-[var(--shadow-card-lg)]"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                Match score {(o.matchScore * 100).toFixed(0)}%
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-semibold text-[var(--color-positive)]">
                  +{formatPct(o.netEdge)}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {formatPct(o.roi)} ROI
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Leg side="BUY YES" market={o.buyYes} price={o.buyYes.yesPrice} />
              <Leg side="BUY NO" market={o.buyNo} price={o.buyNo.noPrice} />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <span>Locked cost {formatPrice(o.cost)} per $1 payout</span>
              <ArrowRight className="h-3 w-3" />
              <span className="text-[var(--color-positive)]">
                Profit {formatPrice(1 - o.cost)} per $1
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-card)]">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </div>
      <div
        className={`font-mono text-sm ${
          accent ? "text-[var(--color-positive)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Leg({
  side,
  price,
  market,
}: {
  side: string;
  price: number;
  market: UnifiedMarket;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono font-semibold text-[var(--color-accent-strong)]">
          {side}
        </span>
        <VenueBadge venue={market.venue} />
      </div>
      <div className="mb-2 line-clamp-2 text-sm">{market.title}</div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm">{formatPrice(price)}</span>
        <div className="flex items-center gap-3">
          <Link
            href={researchHrefFor(market)}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-accent-strong)] hover:underline"
          >
            <Sparkles className="h-3 w-3" />
            Research
          </Link>
          <a
            href={market.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
