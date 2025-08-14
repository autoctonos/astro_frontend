import type { Producto } from "@/api/schemas/products";
import { addToCart, openCart } from "@/stores/cart";

function normalizeImage(url?: string) {
  if (!url) return "/placeholder.png";
  if (url.startsWith("http")) return url;
  const base = import.meta.env.PUBLIC_API_BASE ?? "";
  return `${base}${url}`;
}
function formatCOP(n: number | string) {
  const num = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(num)
    ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(num as number)
    : String(n);
}

export default function ProductsList({ products }: { products: Producto[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const img = normalizeImage(p.imagenes?.[0]?.url_imagen);
        return (
          <li
            key={p.id_producto}
            className="group rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
          >
            <a href={`/producto/${p.id_producto}`} className="block">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-100">
                <img
                  src={img}
                  alt={p.nombre}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="mt-3">
                <h3 className="line-clamp-1 font-medium text-custom-black">{p.nombre}</h3>
                <p className="text-sm text-gray-600">{formatCOP(p.precio)}</p>
              </div>
            </a>

            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart({
                  id: p.id_producto,
                  name: p.nombre,
                  price: Number(p.precio),
                  image: img,
                  quantity: 1,
                });
                openCart();
              }}
              className="mt-3 w-full rounded-xl border border-custom-medium-green/40 bg-custom-light-green/10 px-3 py-2 text-sm font-medium text-custom-dark-green transition hover:bg-custom-light-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
            >
              Añadir
            </button>
          </li>
        );
      })}
    </ul>
  );
}
