import type { ArbOpportunity, FeeModel, UnifiedMarket } from "./types";

/**
 * Cross-venue arbitrage detection.
 *
 * Strategy for the MVP:
 *  1. Pull binary markets from every venue.
 *  2. Compute a normalized token signature for each title.
 *  3. Pair markets across venues whose signatures overlap above a threshold.
 *  4. For each pair, check whether buying YES on one + NO on the other costs
 *     less than $1 per $1 of guaranteed payout. Apply fees. Sort by ROI.
 *
 * Title matching is a hack — the right answer is embeddings (text-embedding-3
 * or Voyage) plus a few hand-coded canonical event ids. We isolate matching
 * behind `matchScore` so we can swap the implementation without touching the
 * pricing math.
 */

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "be",
  "is",
  "are",
  "was",
  "were",
  "will",
  "would",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "from",
  "and",
  "or",
  "vs",
  "than",
  "more",
  "less",
  "this",
  "that",
  "it",
  "its",
  "as",
  "after",
  "before",
  "any",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
]);

function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

/** Jaccard similarity over significant tokens. */
export function titleSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersect = 0;
  for (const t of ta) if (tb.has(t)) intersect++;
  const union = ta.size + tb.size - intersect;
  return intersect / union;
}

/** Default fee assumptions. Conservative — refine per venue/asset later. */
export const FEES: Record<string, FeeModel> = {
  polymarket: { takerFee: 0, profitFee: 0 },
  kalshi: { takerFee: 0.0, profitFee: 0.0 },
};

/**
 * Cost (in $) to buy $1 of guaranteed payout by buying YES on `yesMarket` and
 * NO on `noMarket`. Uses ask prices when available, else mid.
 */
function lockedCost(yesMarket: UnifiedMarket, noMarket: UnifiedMarket): number {
  const yesPx = yesMarket.yesAsk ?? yesMarket.yesPrice;
  const noPx = noMarket.noAsk ?? noMarket.noPrice;
  return yesPx + noPx;
}

function applyFees(
  cost: number,
  yesMarket: UnifiedMarket,
  noMarket: UnifiedMarket,
): number {
  const f1 = FEES[yesMarket.venue];
  const f2 = FEES[noMarket.venue];
  // Taker fees on the notional traded.
  const taker = (f1?.takerFee ?? 0) + (f2?.takerFee ?? 0);
  // Profit fees apply only to the winning leg's $1 payout net of its cost.
  // Worst-case profit-fee drag = max(profitFee) * grossProfit.
  const grossProfit = 1 - cost;
  const profitDrag =
    Math.max(f1?.profitFee ?? 0, f2?.profitFee ?? 0) * Math.max(grossProfit, 0);
  return cost + taker + profitDrag;
}

export interface FindArbOptions {
  minMatchScore?: number; // default 0.45
  minNetEdge?: number; // default 0.005 (0.5¢ per $1)
  maxPairsPerVenue?: number; // safety cap
}

/**
 * Find cross-venue arbitrage opportunities.
 *
 * Only considers PAIRS WHERE THE TWO MARKETS COME FROM DIFFERENT VENUES.
 * Same-venue near-arbitrage exists but is usually internalized by market
 * makers within seconds and not worth surfacing in a research tool.
 */
export function findArbitrage(
  markets: UnifiedMarket[],
  opts: FindArbOptions = {},
): ArbOpportunity[] {
  const minMatch = opts.minMatchScore ?? 0.45;
  const minEdge = opts.minNetEdge ?? 0.005;

  const byVenue = new Map<string, UnifiedMarket[]>();
  for (const m of markets) {
    if (!byVenue.has(m.venue)) byVenue.set(m.venue, []);
    byVenue.get(m.venue)!.push(m);
  }

  const venues = [...byVenue.keys()];
  const out: ArbOpportunity[] = [];

  for (let i = 0; i < venues.length; i++) {
    for (let j = i + 1; j < venues.length; j++) {
      const A = byVenue.get(venues[i])!;
      const B = byVenue.get(venues[j])!;

      for (const a of A) {
        for (const b of B) {
          const score = titleSimilarity(a.title, b.title);
          if (score < minMatch) continue;

          // Try both orientations: buy YES on a / NO on b, and vice versa.
          for (const [yesM, noM] of [
            [a, b] as const,
            [b, a] as const,
          ]) {
            const gross = lockedCost(yesM, noM);
            if (gross >= 1) continue;
            const totalCost = applyFees(gross, yesM, noM);
            const grossEdge = 1 - gross;
            const netEdge = 1 - totalCost;
            if (netEdge < minEdge) continue;
            const roi = netEdge / totalCost;
            out.push({
              id: `${yesM.id}__YES__${noM.id}__NO`,
              buyYes: yesM,
              buyNo: noM,
              cost: totalCost,
              grossEdge,
              netEdge,
              roi,
              matchScore: score,
            });
          }
        }
      }
    }
  }

  out.sort((x, y) => y.netEdge - x.netEdge);
  return out;
}
