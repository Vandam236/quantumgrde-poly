/**
 * Unified market schema. Every venue adapter normalizes to this.
 *
 * Conventions:
 *  - Prices are in 0..1 (probability), not cents. Adapters convert.
 *  - `id` is namespaced by venue: e.g. "polymarket:0xabc...", "kalshi:PRES-2024-DJT".
 *  - Multi-outcome markets are decomposed: each outcome is a separate
 *    UnifiedMarket sharing the same `eventId`, with `outcomeLabel`
 *    identifying the specific outcome.
 */
export type Venue = "polymarket" | "kalshi";

export interface UnifiedMarket {
  id: string;
  venue: Venue;
  title: string;
  description?: string;
  category?: string;

  /** Probability of YES, 0..1. */
  yesPrice: number;
  /** Probability of NO, 0..1. Usually 1 - yesPrice but venues may quote independently. */
  noPrice: number;

  /** Best bid/ask if available, else undefined. */
  yesBid?: number;
  yesAsk?: number;
  noBid?: number;
  noAsk?: number;

  volume24h?: number;
  volumeTotal?: number;
  liquidity?: number;
  openInterest?: number;

  endDate?: string;
  resolutionSource?: string;

  url: string;
  slug?: string;

  /** Groups outcomes under one event. E.g. "polymarket:event:<conditionId>". */
  eventId?: string;
  /** Human-readable outcome label. E.g. "Trump", "Biden". Undefined for plain Yes/No binary markets. */
  outcomeLabel?: string;
}

export interface ArbOpportunity {
  /** Stable id for the pairing, derived from the two market ids. */
  id: string;
  /** Buy YES on this market... */
  buyYes: UnifiedMarket;
  /** ...and buy NO on this market (i.e. YES on the opposite side). */
  buyNo: UnifiedMarket;
  /** Cost to lock $1 of payout, before fees. */
  cost: number;
  /** Gross edge (1 - cost), before fees. */
  grossEdge: number;
  /** Edge after estimated fees. */
  netEdge: number;
  /** ROI on capital deployed, after fees. */
  roi: number;
  /** Title-similarity score for the matched markets, 0..1. */
  matchScore: number;
}

export interface FeeModel {
  /** Taker fee on the trade itself, expressed as fraction of notional (e.g. 0.0 for Polymarket spot). */
  takerFee: number;
  /** Fee on profits at resolution, expressed as fraction of profit (e.g. 0.02 for 2%). */
  profitFee: number;
}

// --- Event grouping & dutch scanning types ---

export interface EventGroup {
  eventId: string;
  title: string;
  venue: Venue;
  outcomes: OutcomeOption[];
  endDate?: string;
  category?: string;
}

export interface OutcomeOption {
  label: string;
  market: UnifiedMarket;
  price: number;
  venue: Venue;
}

export interface DutchOpportunity {
  id: string;
  type: "single-venue" | "cross-venue";
  eventTitle: string;
  legs: DutchLeg[];
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  roi: number;
  matchScore?: number;
}

export interface DutchLeg {
  outcomeLabel: string;
  market: UnifiedMarket;
  price: number;
  venue: Venue;
  isCheapest?: boolean;
  alternativePrice?: number;
  alternativeVenue?: Venue;
}

export interface CrossVenueEvent {
  eventTitle: string;
  matchScore: number;
  outcomes: CrossVenueOutcome[];
}

export interface CrossVenueOutcome {
  label: string;
  options: { venue: Venue; market: UnifiedMarket; price: number }[];
  cheapest: Venue;
}

export interface ScanStats {
  marketsScanned: number;
  eventsFound: number;
  singleVenueOpps: number;
  crossVenueOpps: number;
}
