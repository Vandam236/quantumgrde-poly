import type { ArbOpportunity, UnifiedMarket } from "./types";
import { FEES, titleSimilarity } from "./matching";

export { FEES, titleSimilarity };

/**
 * Cross-venue binary arbitrage detection.
 *
 * For multi-outcome guaranteed-profit scanning, see lib/dutch.ts.
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
  const taker = (f1?.takerFee ?? 0) + (f2?.takerFee ?? 0);
  const grossProfit = 1 - cost;
  const profitDrag =
    Math.max(f1?.profitFee ?? 0, f2?.profitFee ?? 0) * Math.max(grossProfit, 0);
  return cost + taker + profitDrag;
}

export interface FindArbOptions {
  minMatchScore?: number;
  minNetEdge?: number;
  maxPairsPerVenue?: number;
}

export function findArbitrage(
  markets: UnifiedMarket[],
  opts: FindArbOptions = {},
): ArbOpportunity[] {
  const minMatch = opts.minMatchScore ?? 0.45;
  const minEdge = opts.minNetEdge ?? 0.005;

  // Only use binary markets (no eventId or 2-outcome events) for the binary arb scanner.
  const binaryMarkets = markets.filter(
    (m) => !m.outcomeLabel || m.outcomeLabel.toLowerCase() === "yes",
  );

  const byVenue = new Map<string, UnifiedMarket[]>();
  for (const m of binaryMarkets) {
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
