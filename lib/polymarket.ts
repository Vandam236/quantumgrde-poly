import type { UnifiedMarket } from "./types";

/**
 * Polymarket Gamma API client.
 *
 * Public, no auth required. Docs: https://docs.polymarket.com/
 *
 * The Gamma API returns rich market metadata. For order book depth we'd hit
 * the CLOB REST/WebSocket — see lib/polymarket-clob.ts in a future phase.
 */

const GAMMA = "https://gamma-api.polymarket.com";

interface GammaMarket {
  id: string;
  question: string;
  description?: string;
  slug: string;
  conditionId?: string;
  outcomes?: string; // JSON-encoded array
  outcomePrices?: string; // JSON-encoded array of strings
  volume?: string;
  volume24hr?: string;
  liquidity?: string;
  endDate?: string;
  category?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
}

function parseJsonArray(s: string | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function num(s: string | undefined): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function gammaToUnified(m: GammaMarket): UnifiedMarket | null {
  if (m.closed || m.archived) return null;
  const outcomes = parseJsonArray(m.outcomes);
  const prices = parseJsonArray(m.outcomePrices).map(num);
  if (outcomes.length !== 2 || prices.length !== 2) return null;

  // Normalize so YES is the affirmative outcome.
  const yesIdx =
    outcomes.findIndex((o) => /^yes$/i.test(o)) >= 0
      ? outcomes.findIndex((o) => /^yes$/i.test(o))
      : 0;
  const noIdx = yesIdx === 0 ? 1 : 0;

  const yesPrice = prices[yesIdx];
  const noPrice = prices[noIdx];
  if (!Number.isFinite(yesPrice) || !Number.isFinite(noPrice)) return null;
  if (yesPrice <= 0 || yesPrice >= 1) return null;

  return {
    id: `polymarket:${m.id}`,
    venue: "polymarket",
    title: m.question,
    description: m.description,
    category: m.category,
    yesPrice,
    noPrice,
    volume24h: num(m.volume24hr),
    volumeTotal: num(m.volume),
    liquidity: num(m.liquidity),
    endDate: m.endDate,
    url: `https://polymarket.com/market/${m.slug}`,
    slug: m.slug,
  };
}

/**
 * Fetch active binary markets, normalized to UnifiedMarket.
 * Polymarket returns multi-outcome events too; we keep only 2-outcome
 * (Yes/No) markets for the arbitrage MVP.
 */
export async function fetchPolymarketMarkets(
  limit = 200,
): Promise<UnifiedMarket[]> {
  const url = new URL(`${GAMMA}/markets`);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("archived", "false");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order", "volume24hr");
  url.searchParams.set("ascending", "false");

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Polymarket gamma ${res.status}: ${await res.text()}`);
  }
  const raw = (await res.json()) as GammaMarket[];

  const out: UnifiedMarket[] = [];
  for (const m of raw) {
    const u = gammaToUnified(m);
    if (u) out.push(u);
  }
  return out;
}

/**
 * Fetch a single Polymarket market by slug, normalized.
 * Returns null if not found or not a binary market.
 */
export async function fetchPolymarketMarketBySlug(
  slug: string,
): Promise<UnifiedMarket | null> {
  const url = new URL(`${GAMMA}/markets`);
  url.searchParams.set("slug", slug);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    next: { revalidate: 30 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Polymarket gamma ${res.status}: ${await res.text()}`);
  }
  const raw = (await res.json()) as GammaMarket[];
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return gammaToUnified(raw[0]);
}
