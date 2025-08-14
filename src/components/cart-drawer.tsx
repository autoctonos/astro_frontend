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

export default function CartDrawer() {


    const isOpen = useCartStore((s) => s.isOpen);
    const close = useCartStore((s) => s.close);
    const items = useCartStore((s) => s.items);
    const total = useCartTotal();
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
                        <ul className="space-y-3">
                            {items.map((it) => (
                                <li key={it.id} className="grid grid-cols-[64px_1fr_auto] gap-3 rounded-2xl border border-custom-medium-green/30 bg-white p-3">
                                    <div className="h-16 w-16 overflow-hidden rounded-xl border">
                                        {it.image ? (
                                            <Image src={asset(it.image)} alt={it.name} className="h-16 w-16 object-cover" />
                                        ) : (
                                            <div className="grid h-16 w-16 place-items-center text-xs text-gray-500">Sin imagen</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-custom-dark-green">{it.name}</div>
                                        <div className="text-sm text-gray-600">{formatCOP(it.price)}</div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Button size="sm" variant="flat" onPress={() => decCart(it.id)}>-</Button>
                                            <span className="w-9 text-center">{it.quantity}</span>
                                            <Button size="sm" variant="flat" onPress={() => incCart(it.id)}>+</Button>
                                            <Button size="sm" variant="light" className="ml-2 text-red-600" onPress={() => removeFromCart(it.id)}>
                                                Quitar
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-right font-semibold text-custom-dark-green">
                                        {formatCOP(it.price * it.quantity)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </DrawerBody>

                <DrawerFooter className="border-t border-custom-medium-green/20 bg-custom-cream/60">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-sm text-gray-600">Subtotal</div>
                        <div className="text-lg font-semibold text-custom-dark-green">{formatCOP(total)}</div>
                    </div>
                    <div className="flex w-full gap-2">
                        <Button variant="flat" className="flex-1" onPress={clearCart}>Vaciar</Button>
                        <a
                            href="/checkout/shipping/"
                            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
                        >
                            <Button className="flex-1 bg-custom-dark-green text-custom-cream hover:bg-custom-medium-green">
                                Ir a pagar
                            </Button>
                        </a>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
