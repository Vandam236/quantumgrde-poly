import { groupByEvent, matchEventsAcrossVenues } from "./events";
import { FEES } from "./matching";
import type {
  CrossVenueEvent,
  DutchLeg,
  DutchOpportunity,
  EventGroup,
  ScanStats,
  UnifiedMarket,
  Venue,
} from "./types";

export interface DutchScanOptions {
  minNetProfit?: number; // default 0.005 (0.5¢ per $1)
  minEventMatch?: number; // default 0.45
  minOutcomeMatch?: number; // default 0.3
}

/**
 * Find single-venue dutch opportunities.
 *
 * For each event on a single venue, sum the YES prices of all outcomes.
 * If sum < 1, buying YES on every outcome guarantees a profit.
 */
function findSingleVenueDutch(
  events: EventGroup[],
  minProfit: number,
): DutchOpportunity[] {
  const out: DutchOpportunity[] = [];

  for (const event of events) {
    if (event.outcomes.length < 2) continue;

    const totalCost = event.outcomes.reduce((s, o) => s + o.price, 0);
    if (totalCost >= 1) continue;

    const grossProfit = 1 - totalCost;

    // Apply fees: sum taker fees across all legs, worst-case profit fee.
    const takerTotal = event.outcomes.reduce((s, o) => {
      return s + (FEES[o.venue]?.takerFee ?? 0);
    }, 0);
    const worstProfitFee = Math.max(
      ...event.outcomes.map((o) => FEES[o.venue]?.profitFee ?? 0),
    );
    const netProfit = grossProfit - takerTotal - worstProfitFee * grossProfit;

    if (netProfit < minProfit) continue;

    const legs: DutchLeg[] = event.outcomes.map((o) => ({
      outcomeLabel: o.label,
      market: o.market,
      price: o.price,
      venue: o.venue,
    }));

    out.push({
      id: `dutch:single:${event.eventId}`,
      type: "single-venue",
      eventTitle: event.title,
      legs,
      totalCost,
      grossProfit,
      netProfit,
      roi: netProfit / totalCost,
    });
  }

  return out;
}

/**
 * Find cross-venue dutch opportunities.
 *
 * For events matched across venues, pick the cheapest price per outcome
 * across all venues. If the cheapest-price sum < 1, guaranteed profit.
 */
function findCrossVenueDutch(
  crossEvents: CrossVenueEvent[],
  minProfit: number,
): DutchOpportunity[] {
  const out: DutchOpportunity[] = [];

  for (const event of crossEvents) {
    if (event.outcomes.length < 2) continue;

    const legs: DutchLeg[] = [];
    let totalCost = 0;

    for (const outcome of event.outcomes) {
      const sorted = [...outcome.options].sort((a, b) => a.price - b.price);
      const cheapest = sorted[0];
      const alternative = sorted.length > 1 ? sorted[1] : undefined;

      totalCost += cheapest.price;
      legs.push({
        outcomeLabel: outcome.label,
        market: cheapest.market,
        price: cheapest.price,
        venue: cheapest.venue,
        isCheapest: true,
        alternativePrice: alternative?.price,
        alternativeVenue: alternative?.venue as Venue | undefined,
      });
    }

    if (totalCost >= 1) continue;

    const grossProfit = 1 - totalCost;
    const takerTotal = legs.reduce((s, l) => {
      return s + (FEES[l.venue]?.takerFee ?? 0);
    }, 0);
    const worstProfitFee = Math.max(
      ...legs.map((l) => FEES[l.venue]?.profitFee ?? 0),
    );
    const netProfit = grossProfit - takerTotal - worstProfitFee * grossProfit;

    if (netProfit < minProfit) continue;

    out.push({
      id: `dutch:cross:${event.eventTitle.slice(0, 40).replace(/\W/g, "_")}`,
      type: "cross-venue",
      eventTitle: event.eventTitle,
      legs,
      totalCost,
      grossProfit,
      netProfit,
      roi: netProfit / totalCost,
      matchScore: event.matchScore,
    });
  }

  return out;
}

/**
 * Orchestrator: find all guaranteed-profit opportunities from raw markets.
 */
export function findAllGuaranteedProfits(
  markets: UnifiedMarket[],
  opts: DutchScanOptions = {},
): { opportunities: DutchOpportunity[]; stats: ScanStats } {
  const minProfit = opts.minNetProfit ?? 0.005;
  const minEventMatch = opts.minEventMatch ?? 0.45;
  const minOutcomeMatch = opts.minOutcomeMatch ?? 0.3;

  // Group markets into events.
  const events = groupByEvent(markets);

  // Find single-venue dutch.
  const singleVenue = findSingleVenueDutch(events, minProfit);

  // Match events across venues and find cross-venue dutch.
  const crossEvents = matchEventsAcrossVenues(
    events,
    minEventMatch,
    minOutcomeMatch,
  );
  const crossVenue = findCrossVenueDutch(crossEvents, minProfit);

  // Combine, de-duplicate (a cross-venue opp where all legs are from one venue
  // is just a single-venue opp), and sort by netProfit.
  const seenEvents = new Set(singleVenue.map((o) => o.eventTitle));
  const dedupedCross = crossVenue.filter((o) => !seenEvents.has(o.eventTitle));

  const opportunities = [...singleVenue, ...dedupedCross].sort(
    (a, b) => b.netProfit - a.netProfit,
  );

  return {
    opportunities,
    stats: {
      marketsScanned: markets.length,
      eventsFound: events.length,
      singleVenueOpps: singleVenue.length,
      crossVenueOpps: dedupedCross.length,
    },
  };
}
