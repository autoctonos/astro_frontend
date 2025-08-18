import { Drawer, DrawerBody, DrawerContent, DrawerFooter, Button, Image, Badge } from "@heroui/react";
import { CartIcon } from "@/components/icons";
import { useCartStore, useCartTotal, incCart, decCart, removeFromCart, clearCart } from "@/stores/cart";
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
        <Drawer isOpen={isOpen} onOpenChange={(o) => (o ? null : close())} placement="right" size="md">
            <DrawerContent className="bg-custom-cream">
                <DrawerBody className="p-4">
                    <div className="mb-4 flex items-center gap-2 text-custom-dark-green">
                        <CartIcon /> <span className="text-lg font-semibold">Tu carrito</span>
                        <Badge className="ml-auto" variant="flat">{items.length}</Badge>
                    </div>

                    {items.length === 0 ? (
                        <div className="rounded-2xl border border-custom-medium-green/30 p-6 text-center text-custom-black/70">
                            Aún no has agregado productos.
                        </div>
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
                    <div className="flex w-full gap-2">
                        <Button variant="flat" className="flex-1" onPress={clearCart}>Vaciar</Button>
                        <a
                            href="/checkout/shipping/"
                            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
                            onClick={handleCheckout}
                        >
                            <Button className="flex-1 bg-custom-dark-green text-custom-cream hover:bg-custom-medium-green">
                                Ir a pagar
                            </Button>
                        </a>
                    </div>
                </div>
                <div className="flex w-full gap-3">
                    <Button 
                    variant="flat"
                    className="flex-1 h-10 px-3 rounded-lg bg-custom-cream border border-custom-medium-green/30 text-custom-red hover:bg-custom-red/5 hover:border-custom-red/40 active:bg-custom-red/10 transition-all font-medium text-sm flex items-center justify-center"
                    onPress={clearCart}
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
