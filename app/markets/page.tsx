import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { fetchAllMarkets } from "@/lib/markets";
import { formatPrice, formatUsd, relativeDate } from "@/lib/utils";
import { VenueBadge } from "@/components/venue-badge";
import { ErrorBanner } from "@/components/error-banner";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const { markets, errors } = await fetchAllMarkets({ limit: 200 });

  // Top markets by 24h volume.
  const top = [...markets]
    .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0))
    .slice(0, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Markets</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {markets.length} active markets across {new Set(markets.map((m) => m.venue)).size} venues, ranked by 24h volume.
        </p>
      </div>

      <ErrorBanner errors={errors} />

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Market</th>
              <th className="px-4 py-3 text-right font-medium">Yes</th>
              <th className="px-4 py-3 text-right font-medium">No</th>
              <th className="px-4 py-3 text-right font-medium">24h Vol</th>
              <th className="px-4 py-3 text-right font-medium">Resolves</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {top.map((m) => (
              <tr
                key={m.id}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]"
              >
                <td className="max-w-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <VenueBadge venue={m.venue} />
                    <span className="line-clamp-1 font-medium">{m.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-positive)]">
                  {formatPrice(m.yesPrice)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-negative)]">
                  {formatPrice(m.noPrice)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-muted)]">
                  {m.volume24h ? formatUsd(m.volume24h) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[var(--color-muted)]">
                  {relativeDate(m.endDate)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {top.length === 0 && (
          <div className="p-8 text-center text-sm text-[var(--color-muted)]">
            No markets loaded. Check the error banner above or try again.
          </div>
        )}
      </div>
    </div>
  );
}
