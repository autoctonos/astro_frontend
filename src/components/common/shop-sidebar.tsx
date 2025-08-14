import { Drawer, DrawerContent, DrawerBody, DrawerFooter, Button } from "@heroui/react";
import { CartIcon } from "@/components/icons";
import { useCartStore, useCartCount, useCartTotal } from "@/stores/cart";

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function ShopSiderBar() {
  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.items);
  const open = useCartStore((s) => s.open);
  const close = useCartStore((s) => s.close);
  const clear = useCartStore((s) => s.clear);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);

  const count = useCartCount();
  const total = useCartTotal();

  return (
    <>
      <Button
        className="rounded-xl bg-custom-dark-green px-4 py-2 text-custom-cream shadow-sm transition hover:bg-custom-medium-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
        onPress={open}
        startContent={<CartIcon className="text-custom-red" />}
        size="sm"
        variant="solid"
      >
        Carrito ({count})
      </Button>

      <Drawer isOpen={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
        <DrawerContent>
          {() => (
            <>
              <DrawerBody className="space-y-4">
                {items.length === 0 ? (
                  <p className="mt-8 text-center text-gray-500">Tu carrito está vacío.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 border-b border-gray-200 pb-4">
                      <div className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-custom-black">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          Precio: {formatCOP(item.price)} · Subtotal: {formatCOP(item.price * item.quantity)}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <Button size="sm" variant="flat" onPress={() => dec(item.id)}>-</Button>
                          <span className="w-8 text-center text-base font-medium">{item.quantity}</span>
                          <Button size="sm" variant="flat" onPress={() => inc(item.id)}>+</Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            aria-label="Eliminar"
                            onPress={() => remove(item.id)}
                          >
                            X
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </DrawerBody>

              {items.length > 0 && (
                <DrawerFooter className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-custom-black">Total: {formatCOP(total)}</div>
                  <div className="flex items-center gap-2">
                    <Button color="danger" variant="light" onPress={clear}>
                      Vaciar
                    </Button>
                    <a href="/checkout/shipping" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green">
                      <Button color="primary" onPress={close}>
                        Ir a pagar
                      </Button>
                    </a>
                  </div>
                </DrawerFooter>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
