import { ExternalLink, ArrowRight } from "lucide-react";
import { ErrorBanner } from "@/components/error-banner";
import { VenueBadge } from "@/components/venue-badge";
import { findArbitrage } from "@/lib/arbitrage";
import { fetchAllMarkets } from "@/lib/markets";
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Arbitrage scanner
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-muted)]">
          Cross-venue opportunities where buying YES on one venue and NO on
          another locks in a guaranteed payout. Edges are net of estimated
          fees. Match score is a Jaccard token-similarity heuristic — verify
          both markets actually describe the same event before trading.
        </p>
      </div>

      <ErrorBanner errors={errors} />

      <div className="flex flex-wrap gap-4 text-xs">
        <Stat label="Markets scanned" value={markets.length.toLocaleString()} />
        <Stat label="Opportunities found" value={opps.length.toString()} />
        <Stat
          label="Best edge"
          value={
            opps.length ? formatPct(opps[0].netEdge) : "—"
          }
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
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
            No arbitrage found above the current thresholds. Markets are
            efficient most of the time — try refreshing during a news event,
            or lower the matching threshold.
          </div>
        )}
        {opps.map((o) => (
          <div
            key={o.id}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-accent)]/50"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                  Match score {(o.matchScore * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-[var(--color-positive)]">
                  +{formatPct(o.netEdge)}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {formatPct(o.roi)} ROI
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Leg
                side="BUY YES"
                price={o.buyYes.yesPrice}
                title={o.buyYes.title}
                venue={o.buyYes.venue}
                url={o.buyYes.url}
              />
              <Leg
                side="BUY NO"
                price={o.buyNo.noPrice}
                title={o.buyNo.title}
                venue={o.buyNo.venue}
                url={o.buyNo.url}
              />
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-muted)]">
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
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </div>
      <div
        className={`font-mono ${accent ? "text-[var(--color-positive)]" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function Leg({
  side,
  price,
  title,
  venue,
  url,
}: {
  side: string;
  price: number;
  title: string;
  venue: "polymarket" | "kalshi";
  url: string;
}) {
  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono text-[var(--color-accent)]">{side}</span>
        <VenueBadge venue={venue} />
      </div>
      <div className="mb-2 line-clamp-2 text-sm">{title}</div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm">{formatPrice(price)}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
