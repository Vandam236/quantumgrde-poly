import type { FeeModel } from "./types";

/**
 * Shared text-matching and fee utilities used by both the binary arbitrage
 * scanner and the multi-outcome dutch scanner.
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

export function tokenize(title: string): Set<string> {
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
