import {
  Drawer, DrawerBody, DrawerContent, DrawerFooter, Button, Image, Badge
} from "@heroui/react";
import { CartIcon } from "@/components/icons";
import { 
  useCartStore, useCartTotal, incCart, decCart, removeFromCart, clearCart 
} from "@/stores/cart";
import { asset } from "@/lib/assets";


function formatCOP(n: number) {
return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function CartDrawer({ showInCheckout = false }: { showInCheckout?: boolean }) {


const isOpen = useCartStore((s) => s.isOpen);
const close = useCartStore((s) => s.close);
const items = useCartStore((s) => s.items);
const total = useCartTotal();

if (!showInCheckout && typeof window !== 'undefined' && window.location.pathname.startsWith('/checkout')) {
        return null;
    }

const handleCheckout = () => {
    close(); 
};

return (
  <Drawer isOpen={isOpen} 
      onOpenChange={(open) => (open ? null : close())}
      placement="right"
      size="md"
      isDismissable={true}
  >
    <DrawerContent className="bg-custom-cream lg:absolute lg:top-20 lg:right-4 w-full lg:w-[28rem] rounded-xl shadow-xl border border-custom-medium-green/20">
      <div className="flex items-center justify-between border-b border-custom-medium-green/20 p-4">
        <div className="flex items-center gap-3">
          <CartIcon className="h-6 w-6 text-custom-dark-green" />
          <h2 className="text-xl font-bold text-custom-dark-green">Tu Carrito</h2>
        </div>
        <Badge 
          className="bg-custom-medium-green text-white" 
          variant="solid"
        >
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </Badge>
      </div>
      <DrawerBody className="p-4 max-h-[70vh] overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-custom-medium-green/30 p-8 text-center">
            <CartIcon className="h-12 w-12 text-custom-medium-green/50" />
            <p className="mt-4 text-lg font-medium text-custom-black/70">
              Tu carrito está vacío
            </p>
            <p className="mt-1 text-sm text-custom-black/50">
              Agrega productos para comenzar
            </p>
            <Button 
              className="mt-4 btn-primary" 
              onPress={close}
            >
              Seguir comprando
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((it) => (
              <li
                key={it.id}
                className="grid grid-cols-[80px_1fr_auto] gap-4 rounded-xl border border-custom-medium-green/20 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="h-20 w-20 overflow-hidden rounded-lg border border-custom-medium-green/10">
                  {it.image ? (
                    <Image
                      src={asset(it.image)}
                      alt={it.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-custom-cream text-xs text-gray-500">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-custom-dark-green line-clamp-2">
                      {it.name}
                    </h3>
                    <p className="text-sm text-custom-medium-green">
                      {formatCOP(it.price)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="flat" 
                      className="min-w-8 bg-custom-cream hover:bg-custom-light-green"
                      onPress={() => decCart(it.id)}
                      isDisabled={it.quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {it.quantity}
                    </span>
                    <Button 
                      size="sm" 
                      variant="flat" 
                      className="min-w-8 bg-custom-cream hover:bg-custom-light-green"
                      onPress={() => incCart(it.id)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <p className="text-right font-bold text-custom-dark-green">
                    {formatCOP(it.price * it.quantity)}
                  </p>
                  <Button
                    size="sm"
                    variant="light"
                    className="text-xs text-custom-red hover:text-custom-red/80"
                    onPress={() => removeFromCart(it.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DrawerBody>
      {items.length > 0 && (
          <DrawerFooter className="border-t border-custom-medium-green/20 bg-white/95 px-4 py-3">
              <div className="flex w-full items-center justify-between mb-3 h-10">
                  <div className="flex items-center text-base font-medium text-custom-black h-full">
                  Total
                  </div>
                  <div className="flex items-center text-lg font-bold text-custom-dark-green h-full">
                  {formatCOP(total)}
                  </div>
              </div>
              <div className="flex w-full gap-3">
                  <Button 
                  variant="flat"
                  className="flex-1 h-10 px-3 rounded-lg bg-custom-cream border border-custom-medium-green/30 text-custom-red hover:bg-custom-red/5 hover:border-custom-red/40 active:bg-custom-red/10 transition-all font-medium text-sm flex items-center justify-center"
                  onPress={clearCart}
                  onClick={handleCheckout}
                  >
                      Vaciar carrito
                  </Button>
                  <Button 
                  className="flex-1 h-10 px-3 rounded-lg bg-custom-dark-green text-white hover:bg-custom-medium-green active:scale-[0.98] transition-all font-medium text-sm flex items-center justify-center"
                  onPress={() => window.location.href = "/checkout/shipping/"}
                  >
                      Continuar compra
                  </Button>
              </div>
          </DrawerFooter>
      )}
    </DrawerContent>
  </Drawer>
);
}