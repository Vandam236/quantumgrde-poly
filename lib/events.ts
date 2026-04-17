import type {
  CrossVenueEvent,
  CrossVenueOutcome,
  EventGroup,
  UnifiedMarket,
  Venue,
} from "./types";
import { titleSimilarity, tokenize } from "./matching";

/**
 * Group flat UnifiedMarket[] into EventGroup[] by eventId.
 *
 * Markets without an eventId are skipped — they remain available as
 * individual binary markets for the existing arb scanner.
 */
export function groupByEvent(markets: UnifiedMarket[]): EventGroup[] {
  const groups = new Map<string, UnifiedMarket[]>();
  for (const m of markets) {
    if (!m.eventId) continue;
    if (!groups.has(m.eventId)) groups.set(m.eventId, []);
    groups.get(m.eventId)!.push(m);
  }

  const out: EventGroup[] = [];
  for (const [eventId, members] of groups) {
    // Need at least 2 outcomes for a meaningful event group.
    if (members.length < 2) continue;
    const first = members[0];
    out.push({
      eventId,
      title: first.title,
      venue: first.venue,
      outcomes: members.map((m) => ({
        label: m.outcomeLabel ?? m.title,
        market: m,
        price: m.yesAsk ?? m.yesPrice,
        venue: m.venue,
      })),
      endDate: first.endDate,
      category: first.category,
    });
  }

  // Sort by number of outcomes descending (richer events first).
  out.sort((a, b) => b.outcomes.length - a.outcomes.length);
  return out;
}

/**
 * Match events across venues and pair their individual outcomes.
 *
 * Two-level matching:
 *  1. Coarse: match event titles across venues using Jaccard.
 *  2. Fine: within a matched event pair, match outcome labels.
 */
export function matchEventsAcrossVenues(
  events: EventGroup[],
  minEventMatch = 0.45,
  minOutcomeMatch = 0.3,
): CrossVenueEvent[] {
  const byVenue = new Map<Venue, EventGroup[]>();
  for (const e of events) {
    if (e.venue === ("cross" as Venue)) continue;
    if (!byVenue.has(e.venue)) byVenue.set(e.venue, []);
    byVenue.get(e.venue)!.push(e);
  }

  const venues = [...byVenue.keys()];
  const out: CrossVenueEvent[] = [];

  for (let i = 0; i < venues.length; i++) {
    for (let j = i + 1; j < venues.length; j++) {
      const eventsA = byVenue.get(venues[i])!;
      const eventsB = byVenue.get(venues[j])!;

      for (const ea of eventsA) {
        for (const eb of eventsB) {
          const score = titleSimilarity(ea.title, eb.title);
          if (score < minEventMatch) continue;

          const matched = matchOutcomes(
            ea.outcomes.map((o) => ({
              label: o.label,
              venue: ea.venue,
              market: o.market,
              price: o.price,
            })),
            eb.outcomes.map((o) => ({
              label: o.label,
              venue: eb.venue,
              market: o.market,
              price: o.price,
            })),
            minOutcomeMatch,
          );

          if (matched.length >= 2) {
            out.push({
              eventTitle: ea.title,
              matchScore: score,
              outcomes: matched,
            });
          }
        }
      }
    }
  }

  return out;
}

interface OutcomeCandidate {
  label: string;
  venue: Venue;
  market: UnifiedMarket;
  price: number;
}

/**
 * Match individual outcomes across two venues by label similarity.
 * Within a matched event pair, outcome labels like "Trump" vs "Donald Trump"
 * need a lower threshold since we already know the events match.
 */
function matchOutcomes(
  a: OutcomeCandidate[],
  b: OutcomeCandidate[],
  threshold: number,
): CrossVenueOutcome[] {
  const usedB = new Set<number>();
  const out: CrossVenueOutcome[] = [];

  for (const oa of a) {
    let bestIdx = -1;
    let bestScore = threshold;

    for (let j = 0; j < b.length; j++) {
      if (usedB.has(j)) continue;
      const score = labelSimilarity(oa.label, b[j].label);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }

    if (bestIdx >= 0) {
      usedB.add(bestIdx);
      const ob = b[bestIdx];
      const cheapest = oa.price <= ob.price ? oa.venue : ob.venue;
      out.push({
        label: oa.label,
        options: [
          { venue: oa.venue, market: oa.market, price: oa.price },
          { venue: ob.venue, market: ob.market, price: ob.price },
        ],
        cheapest,
      });
    }
  }

  return out;
}

/**
 * Label similarity for outcome matching within a paired event.
 * Uses Jaccard but also checks for substring containment — "Trump" should
 * match "Donald Trump" even though Jaccard penalizes different token counts.
 */
function labelSimilarity(a: string, b: string): number {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.9;

  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersect = 0;
  for (const t of ta) if (tb.has(t)) intersect++;
  const union = ta.size + tb.size - intersect;
  return intersect / union;
}
