import { AlertTriangle } from "lucide-react";

export function ErrorBanner({
  errors,
}: {
  errors: { venue: string; message: string }[];
}) {
  if (!errors.length) return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" />
      <div className="space-y-1">
        <div className="font-medium text-[var(--color-warning)]">
          Some venues failed to load
        </div>
        <ul className="space-y-0.5 text-xs text-[var(--color-muted)]">
          {errors.map((e) => (
            <li key={e.venue}>
              <span className="font-mono uppercase">{e.venue}</span> —{" "}
              {e.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
