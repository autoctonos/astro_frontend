/** Convierte un valor de precio a número. Retorna 0 para valores inválidos. */
export function toNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

/** Formatea un número como peso colombiano (COP). */
export function formatCOP(value: number | string | undefined | null): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export type PriceInfo = {
  /** Precio efectivo a pagar (con descuento si aplica). */
  effectivePrice: number;
  /** Precio original antes del descuento. */
  originalPrice: number;
  /** Porcentaje de descuento redondeado (0 si no hay promoción). */
  discountPct: number;
  /** Indica si hay una promoción activa. */
  hasPromo: boolean;
};

/**
 * Calcula la información de precios dado el precio base y el precio de oferta.
 * La promoción se activa únicamente si `precioConDescuento` es positivo y menor que `precio`.
 */
export function getPriceInfo(
  precio: number | string | undefined | null,
  precioConDescuento?: number | string | null
): PriceInfo {
  const original = toNumber(precio);
  const discounted = toNumber(precioConDescuento);

  const hasPromo = discounted > 0 && discounted < original;
  const effectivePrice = hasPromo ? discounted : original;
  const discountPct = hasPromo
    ? Math.round(((original - discounted) / original) * 100)
    : 0;

  return { effectivePrice, originalPrice: original, discountPct, hasPromo };
}
