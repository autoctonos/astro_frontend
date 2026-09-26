import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  /** Nombre de la categoría del producto (opcional). */
  category?: string;
  /** Precio original antes de descuento (para mostrar ahorro). */
  originalPrice?: number;
  /**
   * Peso de despacho en kg. Sólo display: la cotización de envío la resuelve el backend
   * a partir del `id_producto`, nunca de este valor.
   */
  weightKg?: number;
  /** Requiere cadena de frío. Sólo display, por la misma razón que `weightKg`. */
  requiresCooling?: boolean;
};

/** Precios/atributos que llegan de la cotización y re-sincronizan un carrito rancio. */
export type CartPricingPatch = {
  id: CartItem["id"];
  price?: number;
  weightKg?: number;
  requiresCooling?: boolean;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  clear: () => void;
  add: (item: CartItem) => void;
  remove: (id: CartItem["id"]) => void;
  inc: (id: CartItem["id"]) => void;
  dec: (id: CartItem["id"]) => void;
  syncPricing: (patches: CartPricingPatch[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
      clear: () => set({ items: [] }),
      add: (item) =>
        set(({ items }) => {
          const i = items.findIndex((it) => it.id === item.id);
          if (i === -1) return { items: [...items, item] };
          const next = [...items];
          const existing = next[i];
          next[i] = {
            ...existing,
            quantity: existing.quantity + item.quantity,
            ...(item.category && !existing.category ? { category: item.category } : {}),
            ...(item.originalPrice != null && existing.originalPrice == null ? { originalPrice: item.originalPrice } : {}),
            ...(item.weightKg != null ? { weightKg: item.weightKg } : {}),
            ...(item.requiresCooling != null ? { requiresCooling: item.requiresCooling } : {}),
          };
          return { items: next };
        }),
      remove: (id) => set(({ items }) => ({ items: items.filter((it) => it.id !== id) })),
      inc: (id) =>
        set(({ items }) => ({
          items: items.map((it) => (it.id === id ? { ...it, quantity: it.quantity + 1 } : it)),
        })),
      dec: (id) =>
        set(({ items }) => ({
          items: items
            .map((it) => (it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))
            .filter((it) => it.quantity > 0),
        })),
      syncPricing: (patches) =>
        set(({ items }) => {
          if (patches.length === 0) return { items };
          const byId = new Map(patches.map((p) => [String(p.id), p]));
          let changed = false;
          const next = items.map((it) => {
            const patch = byId.get(String(it.id));
            if (!patch) return it;
            const updated = {
              ...it,
              ...(patch.price != null && patch.price !== it.price ? { price: patch.price } : {}),
              ...(patch.weightKg != null && patch.weightKg !== it.weightKg
                ? { weightKg: patch.weightKg }
                : {}),
              ...(patch.requiresCooling != null && patch.requiresCooling !== it.requiresCooling
                ? { requiresCooling: patch.requiresCooling }
                : {}),
            };
            if (updated.price !== it.price ||
                updated.weightKg !== it.weightKg ||
                updated.requiresCooling !== it.requiresCooling) {
              changed = true;
              return updated;
            }
            return it;
          });
          return changed ? { items: next } : { items };
        }),
    }),
    {
      // La key NO cambia: un carrito viejo debe seguir funcionando. La cotización va por
      // `id_producto`, así que un item sin `weightKg` cotiza exactamente igual de bien.
      name: "cart-v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : (undefined as any))),
      version: 2,
      migrate: (persisted) => persisted as CartState,
    }
  )
);


export const useCartCount = () => useCartStore((s) => s.items.reduce((a, b) => a + b.quantity, 0));
export const useCartTotal = () => useCartStore((s) => s.items.reduce((a, b) => a + b.price * b.quantity, 0));

/** Formatea un número como peso colombiano (COP). */
export function formatCOP(n: number | string): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(num);
}

export const addToCart = (item: CartItem) => useCartStore.getState().add(item);
export const removeFromCart = (id: CartItem["id"]) => useCartStore.getState().remove(id);
export const incCart = (id: CartItem["id"]) => useCartStore.getState().inc(id);
export const decCart = (id: CartItem["id"]) => useCartStore.getState().dec(id);
export const openCart = () => useCartStore.getState().open();
export const closeCart = () => useCartStore.getState().close();
export const clearCart = () => useCartStore.getState().clear();
export const syncCartPricing = (patches: CartPricingPatch[]) =>
  useCartStore.getState().syncPricing(patches);
