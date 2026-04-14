import { Sparkles } from "lucide-react";
import type { ResearchBrief } from "@/lib/research";
import { formatPct } from "@/lib/utils";

const CONFIDENCE_STYLES: Record<string, string> = {
  low: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-sky-50 text-sky-700 border-sky-200",
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function BriefView({
  brief,
  marketYesPrice,
}: {
  brief: ResearchBrief;
  marketYesPrice: number;
}) {
  const fv = brief.fairValueEstimate;
  const delta = fv !== undefined ? fv - marketYesPrice : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          AI research brief
        </div>
        {brief.confidence && (
          <span
            className={`rounded border px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${CONFIDENCE_STYLES[brief.confidence] ?? ""}`}
          >
            {brief.confidence} confidence
          </span>
        )}
      </div>

      <h2 className="text-2xl font-semibold leading-snug tracking-tight">
        {brief.restatedQuestion}
      </h2>

      {fv !== undefined && delta !== null && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Market YES"
            value={`${(marketYesPrice * 100).toFixed(1)}¢`}
          />
          <Stat
            label="Model fair value"
            value={`${(fv * 100).toFixed(1)}¢`}
            accent
          />
          <Stat
            label="Edge"
            value={`${delta >= 0 ? "+" : ""}${formatPct(delta)}`}
            accent={Math.abs(delta) > 0.02}
            negative={delta < 0}
          />
        </div>
      )}

      <Section title="Background">{brief.background}</Section>
      <Section title="Base rates">{brief.baseRates}</Section>

      <div>
        <SectionHeading title="Key catalysts" />
        <ul className="space-y-2">
          {brief.catalysts.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)]" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <SectionHeading title="Counterarguments" />
        <ul className="space-y-2">
          {brief.counterarguments.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-muted)]" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-[var(--color-accent-soft-2)] bg-[var(--color-accent-soft)] p-4">
        <SectionHeading
          title="Bottom line"
          className="text-[var(--color-accent-strong)]"
        />
        <p className="text-sm leading-relaxed text-[var(--color-text)]">
          {brief.bottomLine}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionHeading title={title} />
      <p className="text-sm leading-relaxed text-[var(--color-text-soft)]">
        {children}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  return (
    <h3
      className={`mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] ${className}`}
    >
      {title}
    </h3>
  );
}

function Stat({
  label,
  value,
  accent,
  negative,
}: {
  label: string;
  value: string;
  accent?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </div>
      <div
        className={`font-mono text-lg ${
          negative
            ? "text-[var(--color-negative)]"
            : accent
              ? "text-[var(--color-positive)]"
              : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function BriefSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-[var(--color-accent)]" />
        Generating research brief…
      </div>
      <div className="space-y-3">
        <SkeletonBar w="60%" h="h-7" />
        <SkeletonBar w="100%" />
        <SkeletonBar w="95%" />
        <SkeletonBar w="80%" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonBar h="h-16" />
        <SkeletonBar h="h-16" />
        <SkeletonBar h="h-16" />
      </div>
      <div className="space-y-3">
        <SkeletonBar w="40%" h="h-4" />
        <SkeletonBar w="100%" />
        <SkeletonBar w="92%" />
        <SkeletonBar w="78%" />
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        Streaming from Claude Sonnet 4.6 — typically resolves in 3–6 seconds.
      </p>
    </div>
  );
}

function SkeletonBar({ w = "100%", h = "h-3" }: { w?: string; h?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--color-surface-2)] ${h}`}
      style={{ width: w }}
    />
  );
}
