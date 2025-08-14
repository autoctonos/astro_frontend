import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
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
          next[i] = { ...next[i], quantity: next[i].quantity + item.quantity };
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
    }),
    {
      name: "cart-v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : (undefined as any))),
      version: 1,
    }
  )
);


export const useCartCount = () => useCartStore((s) => s.items.reduce((a, b) => a + b.quantity, 0));
export const useCartTotal = () => useCartStore((s) => s.items.reduce((a, b) => a + b.price * b.quantity, 0));

export const addToCart = (item: CartItem) => useCartStore.getState().add(item);
export const removeFromCart = (id: CartItem["id"]) => useCartStore.getState().remove(id);
export const incCart = (id: CartItem["id"]) => useCartStore.getState().inc(id);
export const decCart = (id: CartItem["id"]) => useCartStore.getState().dec(id);
export const openCart = () => useCartStore.getState().open();
export const closeCart = () => useCartStore.getState().close();
export const clearCart = () => useCartStore.getState().clear();
