/**
 * Unified market schema. Every venue adapter normalizes to this.
 *
 * Conventions:
 *  - Prices are in 0..1 (probability), not cents. Adapters convert.
 *  - `id` is namespaced by venue: e.g. "polymarket:0xabc...", "kalshi:PRES-2024-DJT".
 *  - Binary markets only for MVP. Multi-outcome markets are decomposed by
 *    each outcome representing a separate UnifiedMarket where `yesPrice`
 *    is the price of that outcome occurring.
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
