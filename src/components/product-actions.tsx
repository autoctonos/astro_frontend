import { useState } from "react";
import {
  Check,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
  Sprout,
  Truck,
} from "lucide-react";

import { addToCart, openCart } from "@/stores/cart";
import { formatCOP, getPriceInfo } from "@/lib/price";

/** Umbral para avisar «últimas unidades» (urgencia real, no inventada). */
const POCAS_UNIDADES = 5;

export type ProductBuyBoxProps = {
  productId: number | string;
  productName: string;
  price: number | string;
  precioConDescuento?: number | string | null;
  stock?: number;
  image?: string;
  category?: string;
  categoryHref?: string;
  presentation?: string | null;
  producer?: string | null;
  origin?: string | null;
  requiresCold?: boolean;
};

/**
 * Caja de compra del detalle, con la jerarquía que el comprador espera de un marketplace
 * (Mercado Libre): qué es → cuánto cuesta → cómo llega → cuántas hay → comprar.
 * «Comprar ahora» es la acción principal; «Agregar al carrito» la secundaria.
 */
export default function ProductActions({
  productId,
  productName,
  price,
  precioConDescuento,
  stock,
  image,
  category,
  categoryHref,
  presentation,
  producer,
  origin,
  requiresCold = false,
}: ProductBuyBoxProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = stock === 0;
  const max = outOfStock ? 0 : Math.max(1, stock ?? 99);
  const { effectivePrice, originalPrice, discountPct, hasPromo } = getPriceInfo(price, precioConDescuento);
  const pocas = typeof stock === "number" && stock > 0 && stock <= POCAS_UNIDADES;

  const agregar = () =>
    addToCart({
      id: productId,
      name: productName,
      price: effectivePrice,
      image,
      quantity: qty,
      ...(category && { category }),
      ...(hasPromo && originalPrice > effectivePrice && { originalPrice }),
    });

  const handleAddToCart = () => {
    agregar();
    openCart();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    agregar();
    window.location.href = "/checkout";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Qué es */}
      <header className="flex flex-col gap-2">
        {category && (
          <a
            href={categoryHref ?? "#"}
            className="w-fit text-xs font-semibold uppercase tracking-wider text-custom-medium-green hover:text-custom-dark-green hover:underline"
          >
            {category}
          </a>
        )}
        <h1 className="text-2xl font-bold leading-tight text-custom-black sm:text-[1.75rem]">
          {productName}
        </h1>
        {(presentation || producer) && (
          <p className="text-sm text-custom-black/60">
            {presentation && <span>Presentación: {presentation}</span>}
            {presentation && producer && <span aria-hidden="true"> · </span>}
            {producer && (
              <span>
                Vendido por <span className="font-semibold text-custom-dark-green">{producer}</span>
              </span>
            )}
          </p>
        )}
      </header>

      {/* Cuánto cuesta */}
      <div className="flex flex-col gap-1">
        {hasPromo && (
          <span className="text-sm text-custom-black/45 line-through tabular-nums">
            {formatCOP(originalPrice)}
          </span>
        )}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl font-semibold tracking-tight tabular-nums text-custom-black">
            {formatCOP(effectivePrice)}
          </span>
          {hasPromo && discountPct > 0 && (
            <span className="text-lg font-semibold text-custom-medium-green">{discountPct}% OFF</span>
          )}
        </div>
        {hasPromo && (
          <span className="text-sm font-medium text-custom-medium-green">
            Ahorras {formatCOP(originalPrice - effectivePrice)}
          </span>
        )}
      </div>

      {/* Cómo llega */}
      <ul className="flex flex-col gap-3 text-sm">
        <li className="flex gap-3">
          <Truck className="mt-0.5 size-5 shrink-0 text-custom-medium-green" aria-hidden="true" />
          <span>
            <span className="font-semibold text-custom-black">Envío a domicilio</span>
            <span className="block text-custom-black/60">
              El costo y la fecha de entrega se calculan en el checkout según tu municipio.
            </span>
          </span>
        </li>
        {origin && (
          <li className="flex gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-custom-medium-green" aria-hidden="true" />
            <span className="text-custom-black/75">
              Sale desde <span className="font-medium text-custom-black">{origin}</span>
            </span>
          </li>
        )}
        {requiresCold && (
          <li className="flex gap-3">
            <Snowflake className="mt-0.5 size-5 shrink-0 text-sky-700" aria-hidden="true" />
            <span className="text-custom-black/75">
              Viaja refrigerado: <span className="font-medium text-custom-black">empaque frío incluido</span>
            </span>
          </li>
        )}
      </ul>

      {/* Cuántas hay + cantidad */}
      <div className="flex flex-col gap-3 border-t border-custom-black/10 pt-5">
        <p className="text-sm">
          {outOfStock ? (
            <span className="font-semibold text-custom-red">Sin stock por ahora</span>
          ) : pocas ? (
            <span className="font-semibold text-amber-700">
              ¡{stock === 1 ? "Última unidad" : `Últimas ${stock} unidades`}!
            </span>
          ) : (
            <>
              <span className="font-semibold text-custom-black">Stock disponible</span>
              {typeof stock === "number" && (
                <span className="text-custom-black/55"> ({stock} disponibles)</span>
              )}
            </>
          )}
        </p>

        {!outOfStock && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-custom-black/70" id="cantidad-label">
              Cantidad
            </span>
            <div
              role="group"
              aria-labelledby="cantidad-label"
              className="inline-flex items-center rounded-xl border border-custom-black/10 bg-white"
            >
              <button
                type="button"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                disabled={qty <= 1}
                className="flex size-10 items-center justify-center rounded-l-xl text-custom-dark-green transition-colors hover:bg-custom-light-green/15 disabled:text-custom-black/20 disabled:hover:bg-transparent"
                aria-label="Quitar una unidad"
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <output
                aria-live="polite"
                className="w-10 text-center text-sm font-semibold tabular-nums text-custom-black"
              >
                {qty}
              </output>
              <button
                type="button"
                onClick={() => setQty((n) => Math.min(max, n + 1))}
                disabled={qty >= max}
                className="flex size-10 items-center justify-center rounded-r-xl text-custom-dark-green transition-colors hover:bg-custom-light-green/15 disabled:text-custom-black/20 disabled:hover:bg-transparent"
                aria-label="Agregar una unidad"
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        {!outOfStock && qty > 1 && (
          <p className="text-right text-sm text-custom-black/60">
            Subtotal <span className="font-semibold tabular-nums text-custom-black">{formatCOP(effectivePrice * qty)}</span>
          </p>
        )}
      </div>

      {/* Comprar */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleBuyNow}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-custom-dark-green text-base font-semibold text-white transition-colors hover:bg-custom-medium-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-custom-black/15 disabled:text-custom-black/45"
        >
          {outOfStock ? "Agotado" : "Comprar ahora"}
        </button>
        {!outOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green focus-visible:ring-offset-2 active:scale-[0.99] ${
              added
                ? "bg-custom-medium-green text-white"
                : "bg-custom-light-green/25 text-custom-dark-green hover:bg-custom-light-green/40"
            }`}
          >
            {added ? (
              <>
                <Check className="size-5" aria-hidden="true" />
                Agregado al carrito
              </>
            ) : (
              <>
                <ShoppingCart className="size-5" aria-hidden="true" />
                Agregar al carrito
              </>
            )}
          </button>
        )}
      </div>

      {/* Confianza: sólo afirmaciones verdaderas del negocio */}
      <ul className="flex flex-col gap-2.5 border-t border-custom-black/10 pt-5 text-sm text-custom-black/65">
        <li className="flex items-center gap-2.5">
          <ShieldCheck className="size-4 shrink-0 text-custom-medium-green" aria-hidden="true" />
          Pago seguro con PayU
        </li>
        <li className="flex items-center gap-2.5">
          <Sprout className="size-4 shrink-0 text-custom-medium-green" aria-hidden="true" />
          Hecho por productores locales colombianos
        </li>
      </ul>
    </div>
  );
}
