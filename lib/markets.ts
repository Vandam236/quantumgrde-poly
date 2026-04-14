import { fetchKalshiMarkets } from "./kalshi";
import { fetchPolymarketMarkets } from "./polymarket";
import type { UnifiedMarket } from "./types";

export interface FetchAllOptions {
  limit?: number;
  /** If a single venue fails, continue with the others rather than throwing. */
  partial?: boolean;
}

export interface FetchAllResult {
  markets: UnifiedMarket[];
  errors: { venue: string; message: string }[];
}

/**
 * Pull markets from every venue in parallel.
 *
 * Returns partial results on per-venue failure so the UI can render what's
 * available and surface the error as a banner.
 */
export async function fetchAllMarkets(
  opts: FetchAllOptions = {},
): Promise<FetchAllResult> {
  const { limit = 200, partial = true } = opts;

  const results = await Promise.allSettled([
    fetchPolymarketMarkets(limit),
    fetchKalshiMarkets(limit),
  ]);

  const venueNames = ["polymarket", "kalshi"] as const;
  const markets: UnifiedMarket[] = [];
  const errors: FetchAllResult["errors"] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      markets.push(...r.value);
    } else {
      errors.push({
        venue: venueNames[i],
        message: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
      if (!partial) throw r.reason;
    }
  });

  return { markets, errors };
}
