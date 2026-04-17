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

/**
 * Convert a single Gamma market to one or more UnifiedMarkets.
 *
 * Binary (2-outcome) markets: returns [single market] — backward compatible.
 * Multi-outcome (3+) markets: returns one UnifiedMarket per outcome, each
 * sharing the same `eventId` so the dutch scanner can group them.
 */
function gammaToUnifiedMarkets(m: GammaMarket): UnifiedMarket[] {
  if (m.closed || m.archived) return [];
  const outcomes = parseJsonArray(m.outcomes);
  const prices = parseJsonArray(m.outcomePrices).map(num);
  if (outcomes.length < 2 || outcomes.length !== prices.length) return [];

  const eventId = m.conditionId
    ? `polymarket:event:${m.conditionId}`
    : `polymarket:event:${m.id}`;

  const base = {
    venue: "polymarket" as const,
    description: m.description,
    category: m.category,
    volume24h: num(m.volume24hr),
    volumeTotal: num(m.volume),
    liquidity: num(m.liquidity),
    endDate: m.endDate,
    url: `https://polymarket.com/market/${m.slug}`,
    slug: m.slug,
    eventId,
  };

  // Binary market (Yes/No): single UnifiedMarket, same shape as before.
  if (outcomes.length === 2) {
    const yesIdx =
      outcomes.findIndex((o) => /^yes$/i.test(o)) >= 0
        ? outcomes.findIndex((o) => /^yes$/i.test(o))
        : 0;
    const noIdx = yesIdx === 0 ? 1 : 0;
    const yesPrice = prices[yesIdx];
    const noPrice = prices[noIdx];
    if (!Number.isFinite(yesPrice) || !Number.isFinite(noPrice)) return [];
    if (yesPrice <= 0 || yesPrice >= 1) return [];

    return [
      {
        ...base,
        id: `polymarket:${m.id}`,
        title: m.question,
        yesPrice,
        noPrice,
      },
    ];
  }

  // Multi-outcome market (3+): one UnifiedMarket per outcome.
  const out: UnifiedMarket[] = [];
  for (let i = 0; i < outcomes.length; i++) {
    const price = prices[i];
    if (!Number.isFinite(price) || price <= 0 || price >= 1) continue;
    out.push({
      ...base,
      id: `polymarket:${m.id}:outcome:${i}`,
      title: m.question,
      yesPrice: price,
      noPrice: 1 - price,
      outcomeLabel: outcomes[i],
    });
  }
  return out;
}

/**
 * Fetch active markets, normalized to UnifiedMarket[].
 * Now includes both binary and multi-outcome markets.
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
    out.push(...gammaToUnifiedMarkets(m));
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
  const markets = gammaToUnifiedMarkets(raw[0]);
  return markets.length > 0 ? markets[0] : null;
}
