import { useState } from "react";
import {
  ShoppingCart,
  Minus,
  Plus,
  Check,
  Package,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { addToCart, openCart } from "@/stores/cart";
import { getPriceInfo, formatCOP } from "@/lib/price";
import PriceDisplay from "@/components/PriceDisplay";

export default function ProductActions({
  price,
  precioConDescuento,
  stock,
  productId,
  productName,
  image,
  category,
}: {
  price: number | string;
  precioConDescuento?: number | string | null;
  stock?: number;
  productId: number | string;
  productName: string;
  image?: string;
  category?: string;
}) {
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const outOfStock = stock === 0;
  const max = outOfStock ? 0 : Math.max(1, stock ?? 99);
  const { effectivePrice, originalPrice, discountPct, hasPromo } = getPriceInfo(
    price,
    precioConDescuento
  );

  const stockPercentage =
    typeof stock === "number" && stock > 0 ? Math.min((stock / 50) * 100, 100) : 0;

  const handleAddToCart = () => {
    addToCart({
      id: productId,
      name: productName,
      price: effectivePrice,
      image,
      quantity: qty,
      ...(category && { category }),
      ...(hasPromo && originalPrice > effectivePrice && { originalPrice }),
    });
    openCart();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart({
      id: productId,
      name: productName,
      price: effectivePrice,
      image,
      quantity: qty,
      ...(category && { category }),
      ...(hasPromo && originalPrice > effectivePrice && { originalPrice }),
    });
    openCart();
    window.location.href = "/checkout";
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out hover:shadow-xl hover:bg-white/80 hover:-translate-y-2 cursor-default">
      <div className="relative flex flex-col gap-4 p-5">
        {/* Precio */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-custom-black/60">
              Precio
            </span>
            <div className="mt-1 flex items-end gap-2.5">
              <PriceDisplay
                precio={price}
                precioConDescuento={precioConDescuento}
                size="lg"
              />
            </div>
          </div>
          {hasPromo && discountPct > 0 && (
            <span className="rounded-full border border-custom-medium-green/25 bg-custom-medium-green/15 px-2.5 py-1 text-xs font-bold text-custom-medium-green">
              -{discountPct}% OFF
            </span>
          )}
          {outOfStock && !hasPromo && (
            <span className="rounded-full border border-custom-red/30 bg-custom-red/5 px-2.5 py-1 text-xs font-semibold text-custom-red">
              Agotado
            </span>
          )}
        </div>

        {/* Stock bar */}
        {!outOfStock && typeof stock === "number" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Package className="size-3.5 text-custom-dark-green" />
              <span className="text-xs font-medium text-custom-black/70">
                Stock disponible: {stock} unidades
              </span>
            </div>
          </div>
        )}

        <div className="h-px bg-custom-medium-green/10" />

        {/* Cantidad */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-custom-black/60">
            Cantidad
          </span>
          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center overflow-hidden rounded-xl">
              <div className="absolute inset-0 rounded-xl border border-gray-100 bg-gray-50" />
              <button
                type="button"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                disabled={outOfStock || qty <= 1}
                className="relative flex size-11 items-center justify-center text-custom-dark-green/60 transition-all duration-200 hover:bg-white/70 hover:text-custom-dark-green disabled:opacity-30"
                aria-label="Reducir cantidad"
              >
                <Minus className="size-4" />
              </button>
              <span className="relative w-12 select-none text-center text-sm font-bold tabular-nums text-custom-dark-green">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((n) => Math.min(max, n + 1))}
                disabled={outOfStock || qty >= max}
                className="relative flex size-11 items-center justify-center text-custom-dark-green/60 transition-all duration-200 hover:bg-white/70 hover:text-custom-dark-green disabled:opacity-30"
                aria-label="Aumentar cantidad"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {!outOfStock && (
              <span className="text-xs text-custom-black/70">
                Total:{" "}
                <span className="font-bold text-custom-dark-green">
                  {formatCOP(effectivePrice * qty)}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="mt-1 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={outOfStock}
            onClick={handleAddToCart}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${addedToCart
                ? "bg-custom-medium-green text-white shadow-custom-medium-green/30"
                : "bg-gradient-to-r from-custom-cream/90 to-custom-light-green/15 text-custom-dark-green border border-custom-dark-green/20 shadow-sm hover:from-custom-cream hover:to-custom-light-green/25 hover:border-custom-medium-green/40 hover:shadow-md hover:shadow-custom-medium-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green/50"
              }`}
          >
            {outOfStock ? (
              "Agotado"
            ) : addedToCart ? (
              <>
                <Check className="size-5" />
                Agregado al carrito
              </>
            ) : (
              <>
                <ShoppingCart className="size-5" />
                Añadir al carrito
              </>
            )}
          </button>
          {!outOfStock && (
            <button
              type="button"
              onClick={handleBuyNow}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-custom-medium-green/30 bg-gradient-to-r from-custom-light-green to-custom-medium-green py-3.5 text-base font-bold text-white shadow-lg shadow-custom-medium-green/20 transition-all duration-300 hover:from-custom-medium-green hover:to-custom-dark-green hover:shadow-xl hover:border-custom-medium-green/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green/60 overflow-hidden"
            >
              <span className="relative">Comprar ahora</span>
              <span className="pointer-events-none absolute -inset-px translate-x-[-120%] bg-white/20 opacity-0 transition duration-700 group-hover:translate-x-[120%] group-hover:opacity-100" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
