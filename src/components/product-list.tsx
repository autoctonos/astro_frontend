import { addToCart, openCart } from "@/stores/cart";
import { getPriceInfo } from "@/lib/price";
import PriceDisplay from "@/components/PriceDisplay";
import { ShoppingCart } from "lucide-react";

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

function normalizeImage(url?: string | null) {
  if (!url) return "/placeholder.png";
  if (url.startsWith("http")) return url;
  const base = import.meta.env.PUBLIC_API_BASE ?? "";
  return `${base}${url}`;
}

export default function ProductsList({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const img = normalizeImage(p.imagenes?.[0]?.url_imagen);
        const outOfStock = p.stock === 0;
        const { effectivePrice, originalPrice, discountPct, hasPromo } = getPriceInfo(p.precio, p.precio_con_descuento);
        return (
          <li
            key={p.id_producto}
            className={`group relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-3 shadow-sm backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-custom-light-green/70${outOfStock ? " opacity-60 grayscale" : ""}`}
          >
            <a href={`/producto/${p.id_producto}`} className="block">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/60 bg-white/40">
                <img
                  src={img}
                  alt={p.nombre}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                  loading="lazy"
                />
                {hasPromo && discountPct > 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-custom-light-green px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md border border-white/20">
                    {discountPct}% OFF
                  </span>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {outOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      Agotado
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <h3 className="line-clamp-2 font-semibold text-custom-black/90">
                  {p.nombre}
                </h3>
                <PriceDisplay precio={p.precio} precioConDescuento={p.precio_con_descuento} />
              </div>
            </a>

            <button
              disabled={outOfStock}
              onClick={
                outOfStock
                  ? undefined
                  : (e) => {
                    e.preventDefault();
                    addToCart({
                      id: p.id_producto,
                      name: p.nombre,
                      price: effectivePrice,
                      image: img,
                      quantity: 1,
                      ...((p.categoria ?? p.categoria_nombre) && { category: p.categoria ?? p.categoria_nombre }),
                      ...(hasPromo && originalPrice > effectivePrice && { originalPrice }),
                    });
                    openCart();
                  }
              }
              className={
                outOfStock
                  ? "mt-3 w-full cursor-not-allowed rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm font-medium text-gray-400 backdrop-blur"
                  : "mt-3 w-full rounded-xl border border-custom-dark-green/70 bg-custom-dark-green/90 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition-all duration-200 hover:bg-custom-medium-green hover:border-custom-medium-green active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
              }
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <ShoppingCart className="size-3.5 shrink-0" />
                {outOfStock ? "Agotado" : "Añadir al carrito"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
