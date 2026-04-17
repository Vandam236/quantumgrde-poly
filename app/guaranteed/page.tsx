import { ArrowRight, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { ErrorBanner } from "@/components/error-banner";
import { VenueBadge } from "@/components/venue-badge";
import { findAllGuaranteedProfits } from "@/lib/dutch";
import { fetchAllMarkets } from "@/lib/markets";
import { researchHrefFor } from "@/lib/research-url";
import type { DutchLeg, DutchOpportunity } from "@/lib/types";
import { formatPct, formatPrice } from "@/lib/utils";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function GuaranteedPage() {
  const { markets, errors } = await fetchAllMarkets({ limit: 300 });
  const { opportunities, stats } = findAllGuaranteedProfits(markets);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Guaranteed profit scanner
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
          Find events where buying all outcomes costs less than the guaranteed $1
          payout. Works across any category — politics, crypto, weather, sports.
          Verify resolution criteria before trading.
        </p>
      </div>

      <ErrorBanner errors={errors} />

      <div className="flex flex-wrap gap-3 text-xs">
        <StatCard label="Markets scanned" value={stats.marketsScanned.toLocaleString()} />
        <StatCard label="Events analyzed" value={stats.eventsFound.toLocaleString()} />
        <StatCard
          label="Single-venue"
          value={stats.singleVenueOpps.toString()}
          accent={stats.singleVenueOpps > 0}
        />
        <StatCard
          label="Cross-venue"
          value={stats.crossVenueOpps.toString()}
          accent={stats.crossVenueOpps > 0}
        />
        <StatCard
          label="Best profit"
          value={
            opportunities.length
              ? formatPct(opportunities[0].netProfit)
              : "—"
          }
          accent={opportunities.length > 0}
        />
      </div>

      <div className="space-y-3">
        {opportunities.length === 0 && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-card)]">
            <Shield className="mx-auto mb-3 h-8 w-8 text-[var(--color-muted)]" />
            <p className="text-sm text-[var(--color-muted)]">
              No guaranteed-profit opportunities found above the current
              threshold. Markets are efficient most of the time — check back
              during high-activity periods or after major news events.
            </p>
          </div>
        )}
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opp={opp} />
        ))}
      </div>
    </div>
  );
}

function OpportunityCard({ opp }: { opp: DutchOpportunity }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--color-accent-soft-2)] hover:shadow-[var(--shadow-card-lg)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TypeBadge type={opp.type} />
            {opp.matchScore !== undefined && (
              <span className="text-xs text-[var(--color-muted)]">
                Match {(opp.matchScore * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <h3 className="font-semibold leading-snug">{opp.eventTitle}</h3>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-semibold text-[var(--color-positive)]">
            +{formatPct(opp.netProfit)}
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            {formatPct(opp.roi)} ROI
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {opp.legs.map((leg, i) => (
          <LegRow key={i} leg={leg} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-muted)]">
        <span>
          Total cost{" "}
          <span className="font-mono">{formatPrice(opp.totalCost)}</span> per $1
          payout
        </span>
        <ArrowRight className="h-3 w-3" />
        <span className="text-[var(--color-positive)]">
          Guaranteed profit{" "}
          <span className="font-mono">
            {formatPrice(opp.grossProfit)}
          </span>{" "}
          per $1
        </span>
      </div>
    </div>
  );
}

function LegRow({ leg }: { leg: DutchLeg }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 font-mono text-xs font-semibold text-[var(--color-accent-strong)]">
          BUY YES
        </span>
        <VenueBadge venue={leg.venue} />
        {leg.isCheapest && (
          <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
            Best
          </span>
        )}
        <span className="min-w-0 truncate text-sm">{leg.outcomeLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm">{formatPrice(leg.price)}</span>
        {leg.alternativePrice !== undefined && leg.alternativeVenue && (
          <span className="text-xs text-[var(--color-muted)]">
            vs {formatPrice(leg.alternativePrice)} on{" "}
            {leg.alternativeVenue}
          </span>
        )}
        <Link
          href={researchHrefFor(leg.market)}
          className="inline-flex items-center gap-1 text-xs text-[var(--color-accent-strong)] hover:underline"
        >
          <Sparkles className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: "single-venue" | "cross-venue" }) {
  const styles =
    type === "cross-venue"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-violet-50 text-violet-700 border-violet-200";
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles}`}
    >
      {type === "cross-venue" ? "Cross-venue" : "Single-venue"}
    </span>
  );
}

function StatCard({
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
