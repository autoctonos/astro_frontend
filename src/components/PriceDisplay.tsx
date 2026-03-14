import { getPriceInfo, formatCOP } from "@/lib/price";

type PriceDisplayProps = {
  precio: number | string | undefined | null;
  precioConDescuento?: number | string | null;
  /**
   * sm — product cards and search results (default)
   * lg — product detail page
   */
  size?: "sm" | "lg";
  /**
   * light — light background (default)
   * dark  — dark background (e.g. search dropdown)
   */
  theme?: "light" | "dark";
};

export default function PriceDisplay({
  precio,
  precioConDescuento,
  size = "sm",
  theme = "light",
}: PriceDisplayProps) {
  const { effectivePrice, originalPrice, discountPct, hasPromo } = getPriceInfo(
    precio,
    precioConDescuento
  );

  if (!hasPromo) {
    const plainClass =
      size === "lg"
        ? "text-2xl font-semibold text-custom-dark-green"
        : theme === "dark"
        ? "text-xs text-white/90"
        : "text-sm text-gray-600";
    return <span className={plainClass}>{formatCOP(effectivePrice)}</span>;
  }

  const discountedClass =
    size === "lg"
      ? "text-2xl font-bold text-custom-dark-green"
      : theme === "dark"
      ? "text-xs font-semibold text-white"
      : "text-sm font-bold text-custom-dark-green";

  const originalClass =
    size === "lg"
      ? "text-base text-gray-400 line-through"
      : theme === "dark"
      ? "text-[10px] text-white/50 line-through"
      : "text-xs text-gray-400 line-through";

  const badgeClass =
    size === "lg"
      ? "rounded-full bg-custom-light-green px-2.5 py-0.5 text-sm font-bold text-custom-dark-green"
      : "rounded-full bg-custom-light-green px-1.5 py-0.5 text-[10px] font-bold text-custom-dark-green";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={discountedClass}>{formatCOP(effectivePrice)}</span>
      <span className={originalClass}>{formatCOP(originalPrice)}</span>
    </div>
  );
}
