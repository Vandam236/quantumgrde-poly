# QuantumGrde — Prediction Market Intelligence

A real-time decision-support dashboard that aggregates **Polymarket** and
**Kalshi**, scans for cross-venue arbitrage, and (in upcoming phases)
generates AI research briefs on individual markets.

This is a **research tool**, not a trading bot. We never custody funds or
execute trades on your behalf.

## Stack

- **Next.js 15** (App Router, RSC, typed routes)
- **React 19** + TypeScript
- **Tailwind CSS v4** (CSS-first config via `@theme`)
- **lucide-react** icons
- Public Polymarket Gamma + Kalshi v2 APIs (no auth required for the MVP)

## Features (MVP)

| Status | Feature |
|--------|---------|
| Done | Polymarket + Kalshi market ingestion, normalized to a unified schema |
| Done | `/markets` — top markets across venues, ranked by 24h volume |
| Done | `/arbitrage` — cross-venue arbitrage scanner with fee-adjusted edge |
| Next | AI research briefs (Claude Sonnet 4.6 with prompt caching) |
| Next | Order book depth + slippage calculator |
| Next | Email/Telegram alerts on user-defined edges |
| Later | News-to-market impact feed (requires persistent worker, not Vercel) |
| Later | Whale tracking via on-chain Polymarket data |
| Later | Backtesting playground |

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

The app pulls live data from public endpoints — no `.env` is required to
boot. Copy `.env.example` to `.env.local` if/when you add features that need
keys (Anthropic, Supabase, etc).

## Project structure

```
app/
  layout.tsx          # root layout, nav, footer
  page.tsx            # landing
  markets/page.tsx    # unified market list
  arbitrage/page.tsx  # cross-venue arb scanner
components/
  venue-badge.tsx
  error-banner.tsx
lib/
  types.ts            # UnifiedMarket, ArbOpportunity, FeeModel
  polymarket.ts       # Gamma API adapter
  kalshi.ts           # Kalshi v2 adapter
  markets.ts          # parallel fetch + partial-failure handling
  arbitrage.ts        # title matching + edge calculation
  utils.ts            # formatters, cn helper
```

## Architecture notes

- **Adapters normalize to `UnifiedMarket`.** Adding a new venue (Manifold,
  PredictIt, Insight) means writing one file in `lib/`. Pricing math and the
  UI never touch venue-specific shapes.
- **Title matching is intentionally crude** (Jaccard over significant
  tokens). It is the right starting point because (a) it has zero
  dependencies, (b) it is interpretable when wrong, and (c) the matching
  function is isolated so swapping in embeddings later is a one-file change.
- **Fees are conservative.** See `FEES` in `lib/arbitrage.ts`. Refine per
  venue/asset class as you measure real fills.
- **Vercel is for the UI only.** Anything that needs persistent
  websockets (CLOB streams, news firehose, latency-sensitive alerts)
  belongs on a long-running worker (Fly.io / Railway), not serverless.

## Disclaimer

Data may be delayed, incorrect, or stale. Arbitrage opportunities surfaced
by this tool depend on accurate cross-venue matching and may not actually be
arbitrageable due to slippage, fees, geographic restrictions, or
resolution-criteria mismatches. **Verify everything before you trade.** Not
financial advice.
