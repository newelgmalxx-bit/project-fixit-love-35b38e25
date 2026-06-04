// TEMPORARY: admin-only raw backend response inspector. Remove once schemas are locked.
export function DebugRaw({ label, data }: { label: string; data: unknown }) {
  if (data == null) return null;
  let pretty = "";
  try { pretty = JSON.stringify(data, null, 2); }
  catch { pretty = String(data); }
  return (
    <details className="mb-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs">
      <summary className="cursor-pointer font-bold text-amber-700 dark:text-amber-300">
        🐞 TEMP DEBUG — raw response: <span dir="ltr" className="font-mono">{label}</span>
      </summary>
      <pre dir="ltr" className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-foreground/80">
{pretty}
      </pre>
    </details>
  );
}
