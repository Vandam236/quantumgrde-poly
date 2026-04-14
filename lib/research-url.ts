import type { Route } from "next";
import type { UnifiedMarket } from "./types";

/**
 * Type-safe research URL for a unified market.
 *
 * typedRoutes generates types for static segments only; dynamic params
 * still need a `Route` cast at the construction site. We isolate the cast
 * in this one helper so call sites remain clean.
 */
export function researchHrefFor(market: UnifiedMarket): Route {
  return `/research/${market.venue}/${encodeURIComponent(
    market.slug ?? "",
  )}` as Route;
}
