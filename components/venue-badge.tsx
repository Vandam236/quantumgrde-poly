import type { Venue } from "@/lib/types";

const STYLES: Record<Venue, string> = {
  polymarket: "bg-violet-50 text-violet-700 border-violet-200",
  kalshi: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const LABELS: Record<Venue, string> = {
  polymarket: "Polymarket",
  kalshi: "Kalshi",
};

export function VenueBadge({ venue }: { venue: Venue }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STYLES[venue]}`}
    >
      {LABELS[venue]}
    </span>
  );
}
