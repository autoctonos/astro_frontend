import { useState } from "react";
import { Button } from "@heroui/react";
import { addToCart, openCart } from "@/stores/cart";

function formatCOP(n: number | string) {
  const num = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(num)
    ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
        num as number
      )
    : String(n);
}

export default function ProductActions({
  price,
  stock,
  productId,
  productName,
  image,
}: {
  price: number | string;
  stock?: number;
  productId: number | string;
  productName: string;
  image?: string;
}) {
  const [qty, setQty] = useState(1);
  const max = Math.max(1, stock ?? 99);

  return (
    <div className="rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-2xl font-semibold text-custom-dark-green">{formatCOP(price)}</div>
        {typeof stock === "number" && (
          <span className="rounded-full border border-custom-medium-green/40 bg-custom-light-green/10 px-2 py-0.5 text-xs text-custom-dark-green">
            Stock: {stock}
          </span>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Button
          size="sm"
          variant="flat"
          onPress={() => setQty((n) => Math.max(1, n - 1))}
          aria-label="Disminuir"
          isDisabled={qty <= 1}
        >
          -
        </Button>
        <span className="w-10 rounded-md border border-gray-200 bg-white text-center text-base">{qty}</span>
        <Button
          size="sm"
          variant="flat"
          onPress={() => setQty((n) => Math.min(max, n + 1))}
          aria-label="Aumentar"
          isDisabled={qty >= max}
        >
          +
        </Button>
      </div>

      <Button
        color="primary"
        className="w-full rounded-xl bg-custom-dark-green text-custom-cream transition hover:bg-custom-medium-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
        onPress={() => {
          addToCart({
            id: productId,
            name: productName,
            price: Number(price),
            image,
            quantity: qty,
          });
          openCart();
        }}
      >
        Añadir al carrito
      </Button>
    </div>
  );
}
