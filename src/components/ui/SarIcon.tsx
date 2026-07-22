import sarLogo from "@/assets/sar.png";

export function SarIcon({ className = "" }: { className?: string }) {
  return (
    <img
      src={sarLogo}
      alt="SAR"
      width={60}
      height={67}
      loading="lazy"
      decoding="async"
      className={`inline-block h-[0.9em] w-auto align-[-0.08em] mx-1 ${className}`}
      draggable={false}
    />
  );
}

export function Price({ value, className = "" }: { value: number | string; className?: string }) {
  const num = typeof value === "number"
    ? new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(value)
    : String(value);
  return (
    <span className={`inline-flex items-center ${className}`} dir="ltr">
      <span data-ltr-number>{num}</span>
      <SarIcon />
    </span>
  );
}