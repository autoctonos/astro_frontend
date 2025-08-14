import React, { useEffect } from "react";
import { useCartStore, formatCOP } from "@/stores/cart";
import { CartIcon } from "@/components/icons/CartIcon";

export default function CartSheet() {
  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.list());
  const count = useCartStore((s) => s.count());
  const total = useCartStore((s) => s.total());
  const close = useCartStore((s) => s.close);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);

  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      aria-modal="true"
      role="dialog"
      aria-label="Carrito de compras"
    >
      <button
        onClick={close}
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar carrito"
      />
      <div className="ml-auto h-full w-full max-w-md bg-white text-[--color-custom-black] shadow-2xl flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <CartIcon className="ui-icon" />
            <h2 className="text-lg font-semibold">Tu carrito</h2>
          </div>
          <button
            onClick={close}
            className="rounded-full px-3 py-1 hover:bg-gray-100"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no has agregado productos.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  {it.image ? (
                    <img
                      src={it.image}
                      alt={it.name}
                      className="size-14 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="size-14 rounded-lg bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="truncate font-medium">{it.name}</h3>
                      <button
                        onClick={() => remove(it.id)}
                        className="text-xs text-gray-500 hover:text-[--color-custom-red]"
                        aria-label={`Quitar ${it.name}`}
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dec(it.id)}
                          className="rounded-full border px-2 py-1 text-sm hover:bg-gray-50"
                          aria-label={`Disminuir cantidad de ${it.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center tabular-nums">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => inc(it.id)}
                          className="rounded-full border px-2 py-1 text-sm hover:bg-gray-50"
                          aria-label={`Aumentar cantidad de ${it.name}`}
                        >
                          +
                        </button>
                      </div>
                      <div className="font-medium">{formatCOP(it.price * it.qty)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Productos ({count})</span>
            <span className="font-semibold">{formatCOP(total)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={clear}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Vaciar
            </button>
            <button
              className="rounded-xl bg-[--color-custom-dark-green] px-4 py-2 text-white hover:opacity-90"
              onClick={() => alert("Implementa tu flujo de checkout aquí")}
            >
              Ir a pagar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
