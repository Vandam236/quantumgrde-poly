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
        <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-white shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M3 17l5-5 4 4 8-8" />
                  <path d="M14 8h6v6" />
                </svg>
              </div>
              <span className="font-semibold tracking-tight">QuantumGrde</span>
              <span className="hidden text-xs text-[var(--color-muted)] sm:inline">
                prediction market intel
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/markets" label="Markets" />
              <NavLink href="/arbitrage" label="Arbitrage" />
              <NavLink href="/guaranteed" label="Dutch Scanner" />
              <a
                href="https://github.com/vandam236/quantumgrde-poly"
                target="_blank"
                rel="noreferrer"
                className="rounded-md px-3 py-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
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

function NavLink({
  href,
  label,
}: {
  href: "/markets" | "/arbitrage" | "/guaranteed";
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
    >
      {label}
    </Link>
  );
}
