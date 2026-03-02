import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  Leaf,
} from "lucide-react";
import {
  useCartStore,
  useCartTotal,
  incCart,
  decCart,
  removeFromCart,
  formatCOP,
} from "@/stores/cart";
import { asset } from "@/lib/assets";

const FREE_SHIPPING_MIN = 200000;
const SHIPPING_COST = 15000;

export default function CartDrawer({ showInCheckout = false }: { showInCheckout?: boolean }) {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const total = useCartTotal();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMounted(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = prev;
      setMounted(false);
    };
  }, [isOpen]);

  if (
    !showInCheckout &&
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/checkout")
  ) {
    return null;
  }

  if (!isOpen) return null;

  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const savings = items.reduce(
    (sum, it) =>
      sum +
      (it.originalPrice && it.originalPrice > it.price
        ? (it.originalPrice - it.price) * it.quantity
        : 0),
    0
  );
  const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
  const totalWithShipping = subtotal - savings + shipping;
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);

  return (
    <div
      className="fixed inset-0 z-[9999] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compras"
    >
      <button
        type="button"
        onClick={close}
        className="absolute inset-0 bg-black/10 backdrop-blur-[1px] transition-opacity"
        aria-label="Cerrar carrito"
      />

      <div
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden rounded-l-2xl border-l border-white/50 bg-custom-cream/85 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out"
        style={{
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          transform: mounted ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="absolute inset-y-0 left-0 w-px bg-white/30" />

        <div className="relative flex h-full flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/40 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-custom-dark-green/10 border border-custom-dark-green/20">
                <ShoppingBag className="size-5 text-custom-dark-green" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-custom-dark-green tracking-tight">
                  Mi carrito
                </h2>
                <p className="text-xs text-custom-dark-green/70">
                  {totalItems} {totalItems === 1 ? "producto" : "productos"}
                </p>
              </div>
              {savings > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-custom-medium-green/30 bg-custom-medium-green/10 px-2.5 py-1 text-xs font-bold text-custom-medium-green">
                  <Tag className="size-3" />
                  Ahorras {formatCOP(savings)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full p-2 text-custom-dark-green/80 hover:bg-white/60 hover:text-custom-dark-green transition-all"
              aria-label="Cerrar carrito"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="relative size-20 overflow-hidden rounded-full">
                  <div className="absolute inset-0 rounded-full border border-white/50 bg-white/40 backdrop-blur-xl" />
                  <div className="relative flex size-full items-center justify-center">
                    <ShoppingBag className="size-8 text-custom-dark-green/40" />
                  </div>
                </div>
                <p className="text-center text-sm font-medium text-custom-black/70">
                  Tu carrito está vacío
                </p>
                <p className="max-w-[200px] text-center text-xs text-custom-black/50">
                  Descubre productos artesanales increíbles en nuestra tienda
                </p>
                <Button
                  className="mt-2 rounded-xl bg-custom-dark-green text-white hover:bg-custom-medium-green shadow-lg"
                  onPress={close}
                >
                  Seguir comprando
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-1">
                {items.map((it, index) => (
                  <div
                    key={it.id}
                    className="relative overflow-hidden rounded-2xl transition-all duration-300 group hover:shadow-lg hover:shadow-custom-dark-green/5"
                  >
                    <div className="absolute inset-0 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl group-hover:bg-white/65" />
                    <div className="relative flex gap-3 p-3">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl shadow-sm">
                        {it.image ? (
                          <img
                            src={asset(it.image)}
                            alt={it.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-custom-cream/80 text-xs text-custom-dark-green/50">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-custom-dark-green">
                            {it.name}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative inline-flex items-center overflow-hidden rounded-lg">
                            <div className="absolute inset-0 rounded-lg border border-white/50 bg-white/50 backdrop-blur-md" />
                            <button
                              type="button"
                              onClick={() => decCart(it.id)}
                              disabled={it.quantity <= 1}
                              className="relative flex size-7 items-center justify-center text-custom-dark-green/60 hover:bg-white/50 hover:text-custom-dark-green disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              aria-label="Reducir cantidad"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="relative w-7 text-center text-xs font-bold tabular-nums text-custom-dark-green">
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => incCart(it.id)}
                              className="relative flex size-7 items-center justify-center text-custom-dark-green/60 hover:bg-white/50 hover:text-custom-dark-green transition-all"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-custom-dark-green">
                              {formatCOP(it.price * it.quantity)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(it.id)}
                              className="flex size-7 shrink-0 items-center justify-center rounded-full text-custom-dark-green/40 hover:bg-custom-red/10 hover:text-custom-red transition-all duration-200"
                              aria-label={`Eliminar ${it.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="relative mt-auto shrink-0">
              <div className="absolute inset-0 border-t border-white/60 bg-white/50 backdrop-blur-2xl" />
              <div className="relative flex flex-col gap-4 px-5 py-5">
                {/* Progreso envío gratis */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-custom-dark-green/80">
                      <Leaf className="size-3 text-custom-medium-green" />
                      {subtotal >= FREE_SHIPPING_MIN
                        ? "Envío gratis incluido"
                        : `Faltan ${formatCOP(FREE_SHIPPING_MIN - subtotal)} para envío gratis`}
                    </span>
                    <span className="font-semibold text-custom-medium-green">
                      {formatCOP(FREE_SHIPPING_MIN)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-custom-medium-green/80 to-custom-dark-green transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Resumen */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-custom-black/70">Subtotal</span>
                    <span className="font-semibold text-custom-dark-green">
                      {formatCOP(subtotal)}
                    </span>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-custom-medium-green">Descuentos</span>
                      <span className="font-semibold text-custom-medium-green">
                        -{formatCOP(savings)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-custom-black/70">Envío</span>
                    <span className="font-semibold text-custom-dark-green">
                      {subtotal >= FREE_SHIPPING_MIN ? "Gratis" : formatCOP(SHIPPING_COST)}
                    </span>
                  </div>
                  <div className="my-1 h-px bg-white/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-custom-dark-green">Total</span>
                    <span className="text-xl font-bold text-custom-dark-green">
                      {formatCOP(totalWithShipping)}
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="h-12 w-full gap-2 rounded-xl bg-custom-dark-green text-base font-bold text-white shadow-lg shadow-custom-dark-green/20 hover:bg-custom-medium-green hover:shadow-xl transition-all duration-300"
                  onPress={() => {
                    close();
                    window.location.href = "/checkout";
                  }}
                >
                  Ir al pago
                  <ArrowRight className="size-4" />
                </Button>

                <p className="text-center text-[10px] leading-relaxed text-custom-black/50">
                  Impuestos calculados en el checkout. Al continuar aceptas nuestros Términos y
                  Condiciones.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
