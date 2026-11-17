import { addToCart, openCart } from "@/stores/cart";
import { getPriceInfo } from "@/lib/price";
import PriceDisplay from "@/components/PriceDisplay";
import { ShoppingCart } from "lucide-react";
import ProductPhoto from "@/components/ProductPhoto";
import { productImageSrc } from "@/lib/product-image";

type ProductCardData = {
  id_producto: number;
  nombre: string;
  precio?: number | string;
  precio_con_descuento?: number | string | null;
  stock?: number;
  imagenes?: Array<{ url_imagen: string | null }>;
  categoria?: string;
  categoria_nombre?: string;
};

export default function ProductsList({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => {
        const foto = p.imagenes?.[0]?.url_imagen;
        const outOfStock = p.stock === 0;
        const categoria = p.categoria ?? p.categoria_nombre;
        const { effectivePrice, originalPrice, discountPct, hasPromo } = getPriceInfo(p.precio, p.precio_con_descuento);
        return (
          <li
            key={p.id_producto}
            className="group relative flex flex-col rounded-2xl border border-custom-dark-green/10 bg-white/70 p-2.5 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-custom-dark-green/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-3"
          >
            <a
              href={`/producto/${p.id_producto}`}
              className="flex min-h-0 flex-1 flex-col rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green focus-visible:ring-offset-2"
            >
              <ProductPhoto
                src={foto}
                alt={p.nombre}
                sizes="(min-width: 1024px) 260px, (min-width: 640px) 30vw, 46vw"
                maxWidth={640}
                fit="cover"
                ratio="4:3"
                dimmed={outOfStock}
                className="rounded-xl"
                imgClassName="transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              >
                {hasPromo && discountPct > 0 && !outOfStock && (
                  <span className="absolute left-2 top-2 rounded-full bg-custom-dark-green px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
                    −{discountPct}%
                  </span>
                )}
                {outOfStock && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-custom-black/75 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Agotado
                  </span>
                )}
              </ProductPhoto>
              <div className="mt-3 flex flex-1 flex-col gap-1 px-0.5">
                {categoria && (
                  <span className="truncate text-[11px] font-medium uppercase tracking-wide text-custom-medium-green">
                    {categoria}
                  </span>
                )}
                <h3 className="line-clamp-2 min-h-[2.75em] text-[15px] font-semibold leading-snug text-custom-black/90">
                  {p.nombre}
                </h3>
                <div className="mt-auto pt-1">
                  <PriceDisplay precio={p.precio} precioConDescuento={p.precio_con_descuento} />
                </div>
              </div>
            </a>

            <button
              type="button"
              disabled={outOfStock}
              aria-label={outOfStock ? `${p.nombre} agotado` : `Añadir ${p.nombre} al carrito`}
              onClick={
                outOfStock
                  ? undefined
                  : (e) => {
                    e.preventDefault();
                    addToCart({
                      id: p.id_producto,
                      name: p.nombre,
                      price: effectivePrice,
                      image: productImageSrc(foto) ?? undefined,
                      quantity: 1,
                      ...(categoria && { category: categoria }),
                      ...(hasPromo && originalPrice > effectivePrice && { originalPrice }),
                    });
                    openCart();
                  }
              }
              className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-custom-dark-green px-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-custom-medium-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-custom-black/10 disabled:text-custom-black/45 motion-reduce:active:scale-100"
            >
              {outOfStock ? (
                "Agotado"
              ) : (
                <>
                  <ShoppingCart className="size-4 shrink-0" aria-hidden="true" />
                  <span className="sm:hidden">Añadir</span>
                  <span className="hidden sm:inline">Añadir al carrito</span>
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
