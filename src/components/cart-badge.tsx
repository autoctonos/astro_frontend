import { useCartStore } from "@/stores/cart";
import { CartIcon } from "@/components/icons/CartIcon";

type Props = { className?: string };

export default function CartBadge({ className }: Props) {
  const open = useCartStore((s) => s.open);
  const count = useCartStore((s) => s.count());

  return (
    <button
      onClick={open}
      className={`relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-gray-50 ${className ?? ""}`}
      aria-label="Abrir carrito"
    >
      <CartIcon className="ui-icon" />
      <span className="text-sm">Carrito</span>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 rounded-full bg-[--color-custom-red] px-2 py-0.5 text-xs text-white">
          {count}
        </span>
      )}
    </button>
  );
}
