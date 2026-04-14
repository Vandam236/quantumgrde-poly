import { AlertTriangle } from "lucide-react";

export function ErrorBanner({
  errors,
}: {
  errors: { venue: string; message: string }[];
}) {
  if (!errors.length) return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="space-y-1">
        <div className="font-medium text-amber-800">
          Some venues failed to load
        </div>
        <ul className="space-y-0.5 text-xs text-amber-700">
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
