import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(p: number): string {
  if (!Number.isFinite(p)) return "—";
  return `${(p * 100).toFixed(1)}¢`;
}

export function formatPct(p: number, digits = 2): string {
  if (!Number.isFinite(p)) return "—";
  return `${(p * 100).toFixed(digits)}%`;
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function relativeDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const ms = d.getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 0 && days < 30) return `in ${days}d`;
  if (days >= 30 && days < 365) return `in ${Math.round(days / 30)}mo`;
  if (days >= 365) return `in ${(days / 365).toFixed(1)}y`;
  if (days < 0 && days > -30) return `${Math.abs(days)}d ago`;
  return d.toLocaleDateString();
}
