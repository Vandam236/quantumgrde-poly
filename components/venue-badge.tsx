import type { Venue } from "@/lib/types";

const STYLES: Record<Venue, string> = {
  polymarket: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  kalshi: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
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
