import type { UnifiedMarket } from "./types";

/**
 * Kalshi API client.
 *
 * Public market data needs no auth. Docs: https://trading-api.readme.io/reference/
 *
 * Kalshi prices are in cents (0..100); we normalize to 0..1 probability.
 * Each Kalshi market is binary (Yes/No), so 1:1 mapping to UnifiedMarket.
 */

const BASE = "https://api.elections.kalshi.com/trade-api/v2";

interface KalshiMarket {
  ticker: string;
  event_ticker?: string;
  title: string;
  subtitle?: string;
  category?: string;
  status: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;
  volume?: number;
  volume_24h?: number;
  liquidity?: number;
  open_interest?: number;
  close_time?: string;
  rules_primary?: string;
}

interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor?: string;
}

/** Convert cents (0..100) to probability (0..1). */
function cents(n: number | undefined): number | undefined {
  if (n === undefined || n === null) return undefined;
  if (!Number.isFinite(n)) return undefined;
  return n / 100;
}

function kalshiToUnified(m: KalshiMarket): UnifiedMarket | null {
  if (m.status !== "active" && m.status !== "open") return null;

  const yesAsk = cents(m.yes_ask);
  const yesBid = cents(m.yes_bid);
  const noAsk = cents(m.no_ask);
  const noBid = cents(m.no_bid);
  const last = cents(m.last_price);

  // Use mid of bid/ask for the displayed price; fall back to last.
  const yesPrice =
    yesBid !== undefined && yesAsk !== undefined
      ? (yesBid + yesAsk) / 2
      : last ?? yesAsk ?? yesBid;
  const noPrice =
    noBid !== undefined && noAsk !== undefined
      ? (noBid + noAsk) / 2
      : yesPrice !== undefined
        ? 1 - yesPrice
        : undefined;

  if (
    yesPrice === undefined ||
    noPrice === undefined ||
    yesPrice <= 0 ||
    yesPrice >= 1
  ) {
    return null;
  }

  return {
    id: `kalshi:${m.ticker}`,
    venue: "kalshi",
    title: m.title + (m.subtitle ? ` — ${m.subtitle}` : ""),
    description: m.rules_primary,
    category: m.category,
    yesPrice,
    noPrice,
    yesBid,
    yesAsk,
    noBid,
    noAsk,
    volume24h: m.volume_24h,
    volumeTotal: m.volume,
    liquidity: m.liquidity,
    openInterest: m.open_interest,
    endDate: m.close_time,
    url: `https://kalshi.com/markets/${m.event_ticker ?? m.ticker}`,
    slug: m.ticker,
    eventId: m.event_ticker
      ? `kalshi:event:${m.event_ticker}`
      : undefined,
    outcomeLabel: m.title,
  };
}

/**
 * Fetch open Kalshi markets, normalized.
 *
 * @param limit Max markets to fetch (Kalshi paginates at 1000/page).
 */
export async function fetchKalshiMarkets(
  limit = 200,
): Promise<UnifiedMarket[]> {
  const url = new URL(`${BASE}/markets`);
  url.searchParams.set("status", "open");
  url.searchParams.set("limit", String(Math.min(limit, 1000)));

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Kalshi ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as KalshiMarketsResponse;

  const out: UnifiedMarket[] = [];
  for (const m of data.markets ?? []) {
    const u = kalshiToUnified(m);
    if (u) out.push(u);
  }
  return out;
}

/**
 * Fetch a single Kalshi market by ticker, normalized.
 * Returns null if not found.
 */
export async function fetchKalshiMarketByTicker(
  ticker: string,
): Promise<UnifiedMarket | null> {
  const res = await fetch(`${BASE}/markets/${encodeURIComponent(ticker)}`, {
    next: { revalidate: 30 },
    headers: { accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Kalshi ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { market?: KalshiMarket };
  if (!data.market) return null;
  return kalshiToUnified(data.market);
}
