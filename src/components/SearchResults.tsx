import type { Producto } from "@/api/schemas/products";
import PriceDisplay from "@/components/PriceDisplay";
import ProductPhoto from "@/components/ProductPhoto";

export default function SearchResults({
  items,
  onItemClick,
}: {
  items: Producto[];
  onItemClick?: () => void;
}) {
  if (items.length === 0) {
    return <li className="p-3 text-sm text-white/60">Sin resultados</li>;
  }

  return (
    <>
      {items.map((p) => {
        const outOfStock = p.stock === 0;
        return (
          <li key={p.id_producto} role="option" className={outOfStock ? "opacity-60" : ""}>
            <a
              href={`/producto/${p.id_producto}`}
              className="flex w-full items-center gap-3 p-2 text-sm transition-colors hover:bg-custom-light-green/10 focus:outline-none"
              onClick={onItemClick}
            >
              <ProductPhoto
                fit="cover"
                src={p.imagenes?.[0]?.url_imagen}
                alt=""
                sizes="44px"
                maxWidth={96}
                className="size-11 shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">{p.nombre}</span>
                <div className="flex items-center gap-2">
                  <PriceDisplay
                    precio={p.precio}
                    precioConDescuento={p.precio_con_descuento}
                    theme="dark"
                  />
                  {outOfStock && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                      Agotado
                    </span>
                  )}
                </div>
              </div>
            </a>
          </li>
        );
      })}
    </>
  );
}
