import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantumGrde — Prediction Market Intelligence",
  description:
    "Cross-venue prediction market dashboard. Polymarket + Kalshi aggregation, arbitrage scanner, and AI research briefs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-[var(--color-accent)]" />
              <span className="font-semibold tracking-tight">QuantumGrde</span>
              <span className="text-xs text-[var(--color-muted)]">
                prediction market intel
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link
                href="/markets"
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Markets
              </Link>
              <Link
                href="/arbitrage"
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Arbitrage
              </Link>
              <a
                href="https://github.com/vandam236/quantumgrde-poly"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-6 py-12 text-xs text-[var(--color-muted)]">
          <p>
            Research tool only. Not financial advice. Data may be delayed or
            inaccurate. Verify before trading.
          </p>
        </footer>
      </body>
    </html>
  );
}
