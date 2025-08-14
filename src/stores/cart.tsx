// src/stores/cart.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

type CartStore = {
  isOpen: boolean;
  items: CartItem[];
  open: () => void;
  close: () => void;
  clear: () => void;
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  inc: (id: CartItem["id"]) => void;
  dec: (id: CartItem["id"]) => void;
  remove: (id: CartItem["id"]) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      items: [],
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      clear: () => set({ items: [] }),
      add: (item) =>
        set((s) => {
          const qty = Math.max(1, item.quantity ?? 1);
          const ix = s.items.findIndex((l) => l.id === item.id);
          if (ix >= 0) {
            const next = [...s.items];
            next[ix] = { ...next[ix], quantity: next[ix].quantity + qty };
            return { items: next, isOpen: true };
          }
          return { items: [...s.items, { ...item, quantity: qty }], isOpen: true };
        }),
      inc: (id) => set((s) => ({ items: s.items.map((l) => (l.id === id ? { ...l, quantity: l.quantity + 1 } : l)) })),
      dec: (id) =>
        set((s) => ({
          items: s.items
            .map((l) => (l.id === id ? { ...l, quantity: l.quantity - 1 } : l))
            .filter((l) => l.quantity > 0),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((l) => l.id !== id) })),
    }),
    {
      name: "cart:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    }
  )
);

export const useCartCount = () => useCartStore((s) => s.items.reduce((n, l) => n + l.quantity, 0));
export const useCartTotal = () => useCartStore((s) => s.items.reduce((n, l) => n + l.price * l.quantity, 0));

// helpers opcionales
export const addToCart = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => useCartStore.getState().add(item);
export const openCart = () => useCartStore.getState().open();
